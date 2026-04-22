import { Router } from "express";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { db } from "../../db/pool.js";
import type { MaquinaRow, TarifaRow } from "../../db/types.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { publishMachineCommand } from "../../iot/mqtt.js";

export const maquinasRouter = Router();

type ConfigRow = RowDataPacket & { valor: string };

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return (JSON.parse(raw) ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function getConfigLav<T>(idLav: number, clave: string, fallback: T): Promise<T> {
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT valor
    FROM configuracion
    WHERE ambito='LAVANDERIA' AND id_lavanderia=:idLav AND clave=:clave
    LIMIT 1
    `,
    { idLav, clave },
  );
  return safeJsonParse<T>(rows[0]?.valor, fallback);
}

async function setConfigLav(idLav: number, clave: string, valor: unknown, descripcion: string) {
  await db.query<ResultSetHeader>(
    `
    INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
    VALUES ('LAVANDERIA', :idLav, :clave, :valor, :descripcion)
    ON DUPLICATE KEY UPDATE valor=VALUES(valor), descripcion=VALUES(descripcion)
    `,
    { idLav, clave, valor: JSON.stringify(valor), descripcion },
  );
}

function fanKey(idMaquina: number) {
  return String(idMaquina);
}

async function setFanPendingOff(idLav: number, idMaquina: number, minutes = 5) {
  const pending = await getConfigLav<Record<string, string | null>>(idLav, "fan_pending_off", {});
  pending[fanKey(idMaquina)] = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  await setConfigLav(idLav, "fan_pending_off", pending, "Apagado diferido de ventiladores por máquina");
}

async function clearFanPendingOff(idLav: number, idMaquina: number) {
  const pending = await getConfigLav<Record<string, string | null>>(idLav, "fan_pending_off", {});
  delete pending[fanKey(idMaquina)];
  await setConfigLav(idLav, "fan_pending_off", pending, "Apagado diferido de ventiladores por máquina");
}

async function isFanAutoEnabled(idLav: number, idMaquina: number) {
  const map = await getConfigLav<Record<string, boolean>>(idLav, "fan_auto_enabled", {});
  return Boolean(map[fanKey(idMaquina)]);
}

maquinasRouter.get("/", requireAuth, requireLavanderia, async (req, res) => {
  const idLavanderia = req.auth?.id_lavanderia ?? 1;

  // Auto-cierre: si el ciclo llegó a 0, deja de estar EN_MARCHA.
  const [overdue] = await db.query<(import("mysql2").RowDataPacket & { id_ciclo: number; id_maquina: number })[]>(
    `
    SELECT c.id_ciclo, c.id_maquina
    FROM ciclo c
    INNER JOIN maquina m ON m.id_maquina = c.id_maquina
    WHERE m.id_lavanderia = :idLav
      AND c.estado_ciclo = 'INICIADO'
      AND m.estado_actual = 'EN_MARCHA'
      AND DATE_ADD(c.fecha_hora_inicio, INTERVAL c.duracion_total_programada_min MINUTE) <= NOW()
    `,
    { idLav: idLavanderia },
  );

  for (const row of overdue) {
    await db.query<ResultSetHeader>(
      "UPDATE ciclo SET estado_ciclo = 'FINALIZADO', fecha_hora_fin = COALESCE(fecha_hora_fin, NOW()) WHERE id_ciclo = :id",
      { id: row.id_ciclo },
    );
    await db.query<ResultSetHeader>("UPDATE maquina SET estado_actual = 'STOP' WHERE id_maquina = :id", { id: row.id_maquina });
    await setFanPendingOff(idLavanderia, row.id_maquina, 5);
    await db.query<ResultSetHeader>(
      `
      INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
      VALUES (:idLav, :idMaquina, :idCiclo, NOW(), 'CICLO_FINALIZADO_AUTO', 'INFO', JSON_OBJECT('origen','timer_auto'), 1)
      `,
      { idLav: idLavanderia, idMaquina: row.id_maquina, idCiclo: row.id_ciclo },
    );
  }

  const pendingOff = await getConfigLav<Record<string, string | null>>(idLavanderia, "fan_pending_off", {});
  const nowMs = Date.now();
  const nextPending: Record<string, string | null> = { ...pendingOff };
  const pendingMachineIds = Object.keys(pendingOff)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (pendingMachineIds.length) {
    const idsCsv = pendingMachineIds.join(",");
    const [machines] = await db.query<(RowDataPacket & { id_maquina: number; codigo_visible: string; estado_actual: string })[]>(
      "SELECT id_maquina, codigo_visible, estado_actual FROM maquina WHERE id_lavanderia=:idLav AND FIND_IN_SET(id_maquina,:idsCsv)>0",
      { idLav: idLavanderia, idsCsv },
    );
    for (const machine of machines) {
      const key = fanKey(machine.id_maquina);
      const due = pendingOff[key];
      const dueMs = due ? new Date(due).getTime() : Number.NaN;
      if (!Number.isFinite(dueMs) || dueMs > nowMs) continue;
      if (machine.estado_actual === "EN_MARCHA") {
        delete nextPending[key];
        continue;
      }
      publishMachineCommand(machine.codigo_visible, {
        accion: "ventilador_off",
        id_maquina: machine.id_maquina,
        timestamp: new Date().toISOString(),
      });
      delete nextPending[key];
    }
    if (JSON.stringify(nextPending) !== JSON.stringify(pendingOff)) {
      await setConfigLav(idLavanderia, "fan_pending_off", nextPending, "Apagado diferido de ventiladores por máquina");
    }
  }

  const fanAutoMap = await getConfigLav<Record<string, boolean>>(idLavanderia, "fan_auto_enabled", {});

  const [rows] = await db.query<MaquinaRow[]>(
    `
    SELECT
      m.id_maquina, m.id_lavanderia, m.codigo_visible, m.tipo_maquina, m.estado_actual, m.activa, m.observaciones,
      c.id_ciclo,
      c.fecha_hora_inicio,
      c.duracion_total_programada_min,
      GREATEST(
        0,
        TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(c.fecha_hora_inicio, INTERVAL c.duracion_total_programada_min MINUTE))
      ) AS segundos_restantes_estimados,
      GREATEST(
        0,
        TIMESTAMPDIFF(MINUTE, NOW(), DATE_ADD(c.fecha_hora_inicio, INTERVAL c.duracion_total_programada_min MINUTE))
      ) AS minutos_restantes_estimados
    FROM maquina m
    LEFT JOIN ciclo c
      ON c.id_maquina = m.id_maquina
     AND c.estado_ciclo = 'INICIADO'
    WHERE m.id_lavanderia = :id
    ORDER BY m.codigo_visible
    `,
    { id: idLavanderia },
  );
  const maquinas = rows.map((m) => ({ ...m, ventilador_auto: Boolean(fanAutoMap[fanKey(Number(m.id_maquina))]) }));
  res.json({ ok: true, maquinas });
});

maquinasRouter.get("/:id", requireAuth, (req, res) => {
  res.json({ ok: true, id: req.params.id });
});

maquinasRouter.put("/:id/ventilador-auto", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idMaquina = Number(req.params.id);
  if (!Number.isFinite(idMaquina) || idMaquina <= 0) {
    return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
  }
  const enabled = Boolean(req.body?.enabled);
  const idLavanderia = req.auth?.id_lavanderia ?? 1;

  const [maquinaRows] = await db.query<MaquinaRow[]>(
    "SELECT id_maquina, id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones FROM maquina WHERE id_maquina=:id LIMIT 1",
    { id: idMaquina },
  );
  const maquina = maquinaRows[0];
  if (!maquina || maquina.id_lavanderia !== idLavanderia) {
    return res.status(404).json({ ok: false, error: "MAQUINA_NOT_FOUND" });
  }

  const map = await getConfigLav<Record<string, boolean>>(idLavanderia, "fan_auto_enabled", {});
  map[fanKey(idMaquina)] = enabled;
  await setConfigLav(idLavanderia, "fan_auto_enabled", map, "Encendido automático ventilador por máquina");

  if (!enabled) {
    await clearFanPendingOff(idLavanderia, idMaquina);
    publishMachineCommand(maquina.codigo_visible, {
      accion: "ventilador_off",
      id_maquina: idMaquina,
      timestamp: new Date().toISOString(),
    });
  } else if (maquina.estado_actual === "EN_MARCHA") {
    await clearFanPendingOff(idLavanderia, idMaquina);
    publishMachineCommand(maquina.codigo_visible, {
      accion: "ventilador_on",
      id_maquina: idMaquina,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({ ok: true, id_maquina: idMaquina, enabled });
});

maquinasRouter.post(
  "/:id/iniciar",
  requireAuth,
  requireRole(["ADMIN"]),
  requireLavanderia,
  async (req, res) => {
    const idMaquina = Number(req.params.id);
    if (!Number.isFinite(idMaquina) || idMaquina <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
    }

    const idLavanderia = req.auth?.id_lavanderia ?? 1;
    const idUsuario = Number(req.auth?.id_usuario ?? "0");

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [maquinaRows] = await conn.query<MaquinaRow[]>(
        "SELECT id_maquina, id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones FROM maquina WHERE id_maquina = :id FOR UPDATE",
        { id: idMaquina },
      );
      const maquina = maquinaRows[0];
      if (!maquina || maquina.id_lavanderia !== idLavanderia) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: "MAQUINA_NOT_FOUND" });
      }
      if (maquina.activa !== 1) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "MAQUINA_INACTIVA" });
      }
      if (maquina.estado_actual !== "STOP") {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "MAQUINA_ESTADO_NO_PERMITE", estado: maquina.estado_actual });
      }

      await conn.query<ResultSetHeader>(
        "UPDATE maquina SET estado_actual = 'PAUSADA' WHERE id_maquina = :id",
        { id: idMaquina },
      );

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
        VALUES (:idLav, :idMaquina, NULL, NOW(), 'RELE_ENCENDIDO', 'INFO', JSON_OBJECT('origen','web_admin'), 1)
        `,
        { idLav: idLavanderia, idMaquina },
      );

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO auditoria (
          id_usuario, id_lavanderia, id_maquina, id_ciclo,
          fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
        ) VALUES (
          :idUsuario,
          :idLav,
          :idMaquina,
          NULL,
          NOW(),
          'MAQUINA_ENCENDER',
          'maquina',
          :idMaquina,
          :detalle,
          :ip
        )
        `,
        {
          idUsuario: idUsuario || 1,
          idLav: idLavanderia,
          idMaquina,
          detalle: `Encendido de relé de ${maquina.codigo_visible} desde panel admin`,
          ip: req.ip ?? null,
        },
      );

      await conn.commit();
      publishMachineCommand(maquina.codigo_visible, {
        accion: "encender_rele",
        id_maquina: idMaquina,
        timestamp: new Date().toISOString(),
      });
      return res.json({ ok: true, maquina: { ...maquina, estado_actual: "PAUSADA" } });
    } catch (e) {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
      return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
    } finally {
      conn.release();
    }
  },
);

maquinasRouter.post(
  "/:id/detener",
  requireAuth,
  requireRole(["ADMIN"]),
  requireLavanderia,
  async (req, res) => {
    const idMaquina = Number(req.params.id);
    if (!Number.isFinite(idMaquina) || idMaquina <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
    }

    const idLavanderia = req.auth?.id_lavanderia ?? 1;
    const idUsuario = Number(req.auth?.id_usuario ?? "0");

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [maquinaRows] = await conn.query<MaquinaRow[]>(
        "SELECT id_maquina, id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones FROM maquina WHERE id_maquina = :id FOR UPDATE",
        { id: idMaquina },
      );
      const maquina = maquinaRows[0];
      if (!maquina || maquina.id_lavanderia !== idLavanderia) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: "MAQUINA_NOT_FOUND" });
      }

      // Cierra el ciclo abierto (si existe)
      const [cicloRows] = await conn.query<(import("mysql2").RowDataPacket & { id_ciclo: number })[]>(
        "SELECT id_ciclo FROM ciclo WHERE id_maquina = :idMaquina AND estado_ciclo = 'INICIADO' ORDER BY fecha_hora_inicio DESC LIMIT 1 FOR UPDATE",
        { idMaquina },
      );
      const idCiclo = cicloRows[0]?.id_ciclo ?? null;

      if (idCiclo) {
        await conn.query<ResultSetHeader>(
          "UPDATE ciclo SET estado_ciclo = 'FINALIZADO', fecha_hora_fin = NOW() WHERE id_ciclo = :id",
          { id: idCiclo },
        );

        await conn.query<ResultSetHeader>(
          `
          INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
          VALUES (:idLav, :idMaquina, :idCiclo, NOW(), 'CICLO_FINALIZADO', 'INFO', JSON_OBJECT('origen','web_admin'), 1)
          `,
          { idLav: idLavanderia, idMaquina, idCiclo },
        );
      }

      await conn.query<ResultSetHeader>(
        "UPDATE maquina SET estado_actual = 'STOP' WHERE id_maquina = :id",
        { id: idMaquina },
      );
      await setFanPendingOff(idLavanderia, idMaquina, 5);

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO auditoria (
          id_usuario, id_lavanderia, id_maquina, id_ciclo,
          fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
        ) VALUES (
          :idUsuario,
          :idLav,
          :idMaquina,
          :idCiclo,
          NOW(),
          'MAQUINA_DETENER',
          'maquina',
          :idMaquina,
          :detalle,
          :ip
        )
        `,
        {
          idUsuario: idUsuario || 1,
          idLav: idLavanderia,
          idMaquina,
          idCiclo,
          detalle: `Parada de máquina ${maquina.codigo_visible} desde panel admin (MVP)`,
          ip: req.ip ?? null,
        },
      );

      await conn.commit();
      publishMachineCommand(maquina.codigo_visible, {
        accion: "apagar_rele",
        id_maquina: idMaquina,
        id_ciclo: idCiclo,
        timestamp: new Date().toISOString(),
      });
      return res.json({ ok: true, id_ciclo: idCiclo, maquina: { ...maquina, estado_actual: "STOP" } });
    } catch {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
      return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
    } finally {
      conn.release();
    }
  },
);

maquinasRouter.post(
  "/:id/reiniciar",
  requireAuth,
  requireRole(["ADMIN"]),
  requireLavanderia,
  async (req, res) => {
    const idMaquina = Number(req.params.id);
    if (!Number.isFinite(idMaquina) || idMaquina <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
    }

    const idLavanderia = req.auth?.id_lavanderia ?? 1;
    const idUsuario = Number(req.auth?.id_usuario ?? "0") || 1;

    const [maquinaRows] = await db.query<MaquinaRow[]>(
      "SELECT id_maquina, id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones FROM maquina WHERE id_maquina = :id LIMIT 1",
      { id: idMaquina },
    );
    const maquina = maquinaRows[0];
    if (!maquina || maquina.id_lavanderia !== idLavanderia) {
      return res.status(404).json({ ok: false, error: "MAQUINA_NOT_FOUND" });
    }

    await db.query<ResultSetHeader>(
      `
      INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
      VALUES (:idLav, :idMaquina, NULL, NOW(), 'REINICIO_SOLICITADO', 'INFO', JSON_OBJECT('origen','web_admin'), 1)
      `,
      { idLav: idLavanderia, idMaquina },
    );

    await db.query<ResultSetHeader>(
      `
      INSERT INTO auditoria (
        id_usuario, id_lavanderia, id_maquina, id_ciclo,
        fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
      ) VALUES (
        :idUsuario, :idLav, :idMaquina, NULL,
        NOW(), 'MAQUINA_REINICIAR', 'maquina', :idMaquina, :detalle, :ip
      )
      `,
      {
        idUsuario,
        idLav: idLavanderia,
        idMaquina,
        detalle: `Reinicio solicitado para ${maquina.codigo_visible}`,
        ip: req.ip ?? null,
      },
    );

    publishMachineCommand(maquina.codigo_visible, {
      accion: "reiniciar_maquina",
      id_maquina: idMaquina,
      timestamp: new Date().toISOString(),
    });

    return res.json({ ok: true, maquina });
  },
);

maquinasRouter.post(
  "/:id/credito",
  requireAuth,
  requireRole(["ADMIN"]),
  requireLavanderia,
  async (req, res) => {
    const idMaquina = Number(req.params.id);
    const importe = Number(req.body?.importe ?? 0);
    if (!Number.isFinite(idMaquina) || idMaquina <= 0) return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
    if (!Number.isFinite(importe) || importe <= 0) return res.status(400).json({ ok: false, error: "BAD_IMPORTE" });

    const idLavanderia = req.auth?.id_lavanderia ?? 1;
    const idUsuario = Number(req.auth?.id_usuario ?? "0");

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [maquinaRows] = await conn.query<MaquinaRow[]>(
        "SELECT id_maquina, id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones FROM maquina WHERE id_maquina = :id FOR UPDATE",
        { id: idMaquina },
      );
      const maquina = maquinaRows[0];
      if (!maquina || maquina.id_lavanderia !== idLavanderia) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: "MAQUINA_NOT_FOUND" });
      }
      if (maquina.estado_actual !== "PAUSADA") {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "MAQUINA_NO_ENCENDIDA", estado: maquina.estado_actual });
      }

      const [abiertoRows] = await conn.query<(import("mysql2").RowDataPacket & { id_ciclo: number; id_tarifa_aplicada: number })[]>(
        "SELECT id_ciclo, id_tarifa_aplicada FROM ciclo WHERE id_maquina = :idMaquina AND estado_ciclo = 'INICIADO' ORDER BY fecha_hora_inicio DESC LIMIT 1 FOR UPDATE",
        { idMaquina },
      );
      const cicloAbierto = abiertoRows[0];
      if (cicloAbierto) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "USA_AMPLIAR_EN_MARCHA", estado: maquina.estado_actual });
      }
      {
        const [tarifaRows] = await conn.query<TarifaRow[]>(
          `
          SELECT id_tarifa, id_lavanderia, nombre, precio_arranque, tiempo_base_minutos, importe_incremento, minutos_por_incremento
          FROM tarifa_maquina
          WHERE id_lavanderia = :idLav
            AND activa = 1
            AND fecha_inicio_vigencia <= NOW()
            AND (fecha_fin_vigencia IS NULL OR fecha_fin_vigencia > NOW())
          ORDER BY fecha_inicio_vigencia DESC
          LIMIT 1
          `,
          { idLav: idLavanderia },
        );
        const tarifa = tarifaRows[0];
        if (!tarifa) {
          await conn.rollback();
          return res.status(409).json({ ok: false, error: "SIN_TARIFA_VIGENTE" });
        }

        const [cicloRes] = await conn.query<ResultSetHeader>(
          `
          INSERT INTO ciclo (
            id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
            precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
            importe_cliente_total, importe_bonificado_total, importe_total_aplicado, duracion_total_programada_min, observaciones
          ) VALUES (
            :idMaquina, :idTarifa, NOW(), NULL, 'INICIADO',
            :precioArranque, :tiempoBase, 0, 0.00, :importeBonificado, :importeTotal, :duracionTotal, 'Crédito web (arranque)'
          )
          `,
          {
            idMaquina,
            idTarifa: tarifa.id_tarifa,
            precioArranque: tarifa.precio_arranque,
            tiempoBase: tarifa.tiempo_base_minutos,
            importeBonificado: importe,
            importeTotal: importe,
            duracionTotal: Number(tarifa.tiempo_base_minutos),
          },
        );
        const idCiclo = cicloRes.insertId;

        await conn.query<ResultSetHeader>(
          `
          INSERT INTO movimiento_maquina (
            id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora, tipo_movimiento, origen_movimiento, importe, minutos_extra_generados, es_bonificacion, descripcion
          ) VALUES (
            :idLav, :idMaquina, :idCiclo, :idUsuario, NOW(), 'ARRANQUE', 'WEB_MANUAL', :importe, 0, 1, 'Crédito web para iniciar ciclo'
          )
          `,
          { idLav: idLavanderia, idMaquina, idCiclo, idUsuario: idUsuario || null, importe },
        );

        await conn.query<ResultSetHeader>("UPDATE maquina SET estado_actual = 'EN_MARCHA' WHERE id_maquina = :id", { id: idMaquina });
        if (await isFanAutoEnabled(idLavanderia, idMaquina)) {
          await clearFanPendingOff(idLavanderia, idMaquina);
        }
        await conn.commit();
        if (await isFanAutoEnabled(idLavanderia, idMaquina)) {
          publishMachineCommand(maquina.codigo_visible, {
            accion: "ventilador_on",
            id_maquina: idMaquina,
            id_ciclo: idCiclo,
            timestamp: new Date().toISOString(),
          });
        }
        publishMachineCommand(maquina.codigo_visible, {
          accion: "insertar_credito",
          id_maquina: idMaquina,
          id_ciclo: idCiclo,
          importe,
          timestamp: new Date().toISOString(),
        });
        return res.json({ ok: true, id_ciclo: idCiclo, importe_aplicado: importe });
      }

    } catch {
      try {
        await conn.rollback();
      } catch {}
      return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
    } finally {
      conn.release();
    }
  },
);

maquinasRouter.post(
  "/:id/ampliar",
  requireAuth,
  requireRole(["ADMIN"]),
  requireLavanderia,
  async (req, res) => {
    const idMaquina = Number(req.params.id);
    if (!Number.isFinite(idMaquina) || idMaquina <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_MACHINE_ID" });
    }

    const importe = Number(req.body?.importe ?? 0);
    if (!Number.isFinite(importe) || importe <= 0) {
      return res.status(400).json({ ok: false, error: "BAD_IMPORTE" });
    }

    const idLavanderia = req.auth?.id_lavanderia ?? 1;
    const idUsuario = Number(req.auth?.id_usuario ?? "0");

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [maquinaRows] = await conn.query<MaquinaRow[]>(
        "SELECT id_maquina, id_lavanderia, codigo_visible, tipo_maquina, estado_actual, activa, observaciones FROM maquina WHERE id_maquina = :id FOR UPDATE",
        { id: idMaquina },
      );
      const maquina = maquinaRows[0];
      if (!maquina || maquina.id_lavanderia !== idLavanderia) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: "MAQUINA_NOT_FOUND" });
      }
      if (maquina.activa !== 1) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "MAQUINA_INACTIVA" });
      }
      if (maquina.estado_actual !== "EN_MARCHA") {
        await conn.rollback();
        return res
          .status(409)
          .json({ ok: false, error: "MAQUINA_ESTADO_NO_PERMITE", estado: maquina.estado_actual });
      }

      const [cicloRows] = await conn.query<
        (import("mysql2").RowDataPacket & { id_ciclo: number; id_tarifa_aplicada: number })[]
      >(
        "SELECT id_ciclo, id_tarifa_aplicada FROM ciclo WHERE id_maquina = :idMaquina AND estado_ciclo = 'INICIADO' ORDER BY fecha_hora_inicio DESC LIMIT 1 FOR UPDATE",
        { idMaquina },
      );
      const ciclo = cicloRows[0];
      if (!ciclo) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "SIN_CICLO_ABIERTO" });
      }

      const [tarifaRows] = await conn.query<TarifaRow[]>(
        `
        SELECT id_tarifa, id_lavanderia, nombre, precio_arranque, tiempo_base_minutos, importe_incremento, minutos_por_incremento
        FROM tarifa_maquina
        WHERE id_tarifa = :idTarifa
        LIMIT 1
        `,
        { idTarifa: ciclo.id_tarifa_aplicada },
      );
      const tarifa = tarifaRows[0];
      if (!tarifa) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "TARIFA_NO_ENCONTRADA" });
      }

      const incImporte = Number(tarifa.importe_incremento);
      const incMin = Number(tarifa.minutos_por_incremento);
      if (!incImporte || !incMin) {
        await conn.rollback();
        return res.status(409).json({ ok: false, error: "TARIFA_INCREMENTO_INVALIDO" });
      }

      const incrementos = Math.floor(importe / incImporte);
      if (incrementos <= 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, error: "IMPORTE_INSUFICIENTE_INCREMENTO" });
      }
      const minutosExtra = incrementos * incMin;
      const importeAplicado = Number((incrementos * incImporte).toFixed(2));

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO movimiento_maquina (
          id_lavanderia,
          id_maquina,
          id_ciclo,
          id_usuario,
          fecha_hora,
          tipo_movimiento,
          origen_movimiento,
          importe,
          minutos_extra_generados,
          es_bonificacion,
          descripcion
        ) VALUES (
          :idLav,
          :idMaquina,
          :idCiclo,
          :idUsuario,
          NOW(),
          'AMPLIACION_TIEMPO',
          'WEB_MANUAL',
          :importe,
          :minutos,
          1,
          'Ampliación desde web (admin)'
        )
        `,
        {
          idLav: idLavanderia,
          idMaquina,
          idCiclo: ciclo.id_ciclo,
          idUsuario: idUsuario || null,
          importe: importeAplicado,
          minutos: minutosExtra,
        },
      );

      await conn.query<ResultSetHeader>(
        `
        UPDATE ciclo
        SET
          minutos_extra_total = minutos_extra_total + :minutos,
          importe_bonificado_total = importe_bonificado_total + :importe,
          importe_total_aplicado = importe_total_aplicado + :importe,
          duracion_total_programada_min = duracion_total_programada_min + :minutos
        WHERE id_ciclo = :idCiclo
        `,
        { minutos: minutosExtra, importe: importeAplicado, idCiclo: ciclo.id_ciclo },
      );

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
        VALUES (:idLav, :idMaquina, :idCiclo, NOW(), 'AMPLIACION_APLICADA', 'INFO', JSON_OBJECT('origen','web_admin','importe',:importe,'minutos',:minutos), 1)
        `,
        { idLav: idLavanderia, idMaquina, idCiclo: ciclo.id_ciclo, importe: importeAplicado, minutos: minutosExtra },
      );

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO auditoria (
          id_usuario, id_lavanderia, id_maquina, id_ciclo,
          fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
        ) VALUES (
          :idUsuario,
          :idLav,
          :idMaquina,
          :idCiclo,
          NOW(),
          'MAQUINA_AMPLIAR',
          'ciclo',
          :idCiclo,
          :detalle,
          :ip
        )
        `,
        {
          idUsuario: idUsuario || 1,
          idLav: idLavanderia,
          idMaquina,
          idCiclo: ciclo.id_ciclo,
          detalle: `Ampliación ${importeAplicado}€ (+${minutosExtra} min) en ${maquina.codigo_visible} (MVP)`,
          ip: req.ip ?? null,
        },
      );

      await conn.commit();
      publishMachineCommand(maquina.codigo_visible, {
        accion: "ampliar_tiempo",
        id_maquina: idMaquina,
        id_ciclo: ciclo.id_ciclo,
        importe: importeAplicado,
        minutos_extra: minutosExtra,
        timestamp: new Date().toISOString(),
      });
      return res.json({
        ok: true,
        id_ciclo: ciclo.id_ciclo,
        minutos_extra_generados: minutosExtra,
        importe_aplicado: importeAplicado,
      });
    } catch {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
      return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
    } finally {
      conn.release();
    }
  },
);
