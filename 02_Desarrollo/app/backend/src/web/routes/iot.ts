import { Router } from "express";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { publishMachineCommand } from "../../iot/mqtt.js";

export const iotRouter = Router();

type ConfigRow = RowDataPacket & {
  ambito: string;
  id_lavanderia: number | null;
  clave: string;
  valor: string;
};

type IoTState = {
  puerta_abierta: boolean;
  luces_encendidas: boolean;
  ventilacion_encendida: boolean;
  updated_at?: string;
};

type IoTScheduleItem = {
  on?: string | null; // "HH:MM"
  off?: string | null; // "HH:MM"
};

type IoTSchedule = {
  puerta?: IoTScheduleItem;
  luces?: IoTScheduleItem;
  ventilacion?: IoTScheduleItem;
};

type StoreActions = {
  abrir_tienda: { puerta_abierta: boolean; luces_encendidas: boolean; ventilacion_encendida: boolean };
  cerrar_tienda: { puerta_abierta: boolean; luces_encendidas: boolean; ventilacion_encendida: boolean };
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function isTimeHHMM(t: string) {
  return /^([01]\\d|2[0-3]):[0-5]\\d$/.test(t);
}

async function getConfigLav<T>(idLav: number, clave: string, fallback: T): Promise<T> {
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT ambito, id_lavanderia, clave, valor
    FROM configuracion
    WHERE ambito = 'LAVANDERIA'
      AND id_lavanderia = :idLav
      AND clave = :clave
    LIMIT 1
    `,
    { idLav, clave },
  );
  const row = rows[0];
  if (!row) return fallback;
  return safeJsonParse<T>(row.valor, fallback);
}

async function setConfigLav(idLav: number, clave: string, valor: unknown, descripcion: string) {
  const json = JSON.stringify(valor);
  await db.query<ResultSetHeader>(
    `
    INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
    VALUES ('LAVANDERIA', :idLav, :clave, :valor, :descripcion)
    ON DUPLICATE KEY UPDATE
      valor = VALUES(valor),
      descripcion = VALUES(descripcion)
    `,
    { idLav, clave, valor: json, descripcion },
  );
}

async function audit(req: any, accion: string, detalle: string) {
  const idUsuario = Number(req.auth?.id_usuario ?? "0") || 1;
  const idLav = Number(req.auth?.id_lavanderia ?? 1) || 1;
  await db.query<ResultSetHeader>(
    `
    INSERT INTO auditoria (
      id_usuario, id_lavanderia, id_maquina, id_ciclo,
      fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
    ) VALUES (
      :idUsuario, :idLav, NULL, NULL,
      NOW(), :accion, 'iot', NULL, :detalle, :ip
    )
    `,
    { idUsuario, idLav, accion, detalle, ip: req.ip ?? null },
  );
}

function normalizeState(input: any): IoTState {
  return {
    puerta_abierta: Boolean(input?.puerta_abierta),
    luces_encendidas: Boolean(input?.luces_encendidas),
    ventilacion_encendida: Boolean(input?.ventilacion_encendida),
    updated_at: new Date().toISOString(),
  };
}

function normalizeSchedule(input: any): IoTSchedule {
  const s: IoTSchedule = {
    puerta: { on: input?.puerta?.on ?? null, off: input?.puerta?.off ?? null },
    luces: { on: input?.luces?.on ?? null, off: input?.luces?.off ?? null },
    ventilacion: { on: input?.ventilacion?.on ?? null, off: input?.ventilacion?.off ?? null },
  };
  (Object.keys(s) as Array<keyof IoTSchedule>).forEach((k) => {
    const item = s[k] as IoTScheduleItem;
    if (item.on && !isTimeHHMM(item.on)) item.on = null;
    if (item.off && !isTimeHHMM(item.off)) item.off = null;
  });
  return s;
}

iotRouter.get("/state", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = await getConfigLav<IoTState>(
    idLav,
    "iot_state",
    { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false },
  );
  res.json({ ok: true, state });
});

iotRouter.put("/state", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = normalizeState(req.body ?? {});
  await setConfigLav(idLav, "iot_state", state, "Estado manual de IoT (MVP)");
  await audit(req, "IOT_SET_STATE", `Estado actualizado: ${JSON.stringify(state)}`);
  res.json({ ok: true, state });
});

iotRouter.get("/schedule", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const schedule = await getConfigLav<IoTSchedule>(idLav, "iot_schedule", {
    puerta: { on: null, off: null },
    luces: { on: null, off: null },
    ventilacion: { on: null, off: null },
  });
  res.json({ ok: true, schedule });
});

iotRouter.put("/schedule", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const schedule = normalizeSchedule(req.body ?? {});
  await setConfigLav(idLav, "iot_schedule", schedule, "Programación IoT (MVP)");
  await audit(req, "IOT_SET_SCHEDULE", `Horario actualizado: ${JSON.stringify(schedule)}`);
  res.json({ ok: true, schedule });
});

iotRouter.get("/store-actions", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const actions = await getConfigLav<StoreActions>(idLav, "iot_store_actions", {
    abrir_tienda: { puerta_abierta: true, luces_encendidas: true, ventilacion_encendida: true },
    cerrar_tienda: { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false },
  });
  res.json({ ok: true, actions });
});

iotRouter.put("/store-actions", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const input = req.body ?? {};
  const actions: StoreActions = {
    abrir_tienda: {
      puerta_abierta: Boolean(input?.abrir_tienda?.puerta_abierta),
      luces_encendidas: Boolean(input?.abrir_tienda?.luces_encendidas),
      ventilacion_encendida: Boolean(input?.abrir_tienda?.ventilacion_encendida),
    },
    cerrar_tienda: {
      puerta_abierta: Boolean(input?.cerrar_tienda?.puerta_abierta),
      luces_encendidas: Boolean(input?.cerrar_tienda?.luces_encendidas),
      ventilacion_encendida: Boolean(input?.cerrar_tienda?.ventilacion_encendida),
    },
  };
  await setConfigLav(idLav, "iot_store_actions", actions, "Acciones botones abrir/cerrar tienda");
  await audit(req, "IOT_SET_STORE_ACTIONS", `Acciones tienda: ${JSON.stringify(actions)}`);
  res.json({ ok: true, actions });
});

iotRouter.get("/store-open-machines", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const maquinas = await getConfigLav<number[]>(idLav, "iot_store_open_machines", []);
  res.json({ ok: true, maquinas });
});

iotRouter.put("/store-open-machines", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const raw = Array.isArray(req.body?.maquinas) ? req.body.maquinas : [];
  const maquinas = [...new Set(raw.map((x: unknown) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0))];
  await setConfigLav(idLav, "iot_store_open_machines", maquinas, "Máquinas a encender con botón Abrir");
  await audit(req, "IOT_SET_STORE_OPEN_MACHINES", `Maquinas abrir tienda: ${JSON.stringify(maquinas)}`);
  res.json({ ok: true, maquinas });
});

iotRouter.post("/store/open", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = await getConfigLav<IoTState>(idLav, "iot_state", {
    puerta_abierta: false,
    luces_encendidas: false,
    ventilacion_encendida: false,
  });
  const actions = await getConfigLav<StoreActions>(idLav, "iot_store_actions", {
    abrir_tienda: { puerta_abierta: true, luces_encendidas: true, ventilacion_encendida: true },
    cerrar_tienda: { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false },
  });
  const next = { ...state, ...actions.abrir_tienda, updated_at: new Date().toISOString() };
  await setConfigLav(idLav, "iot_state", next, "Estado por abrir tienda");
  const maquinasCfg = await getConfigLav<number[]>(idLav, "iot_store_open_machines", []);
  if (maquinasCfg.length) {
    const idsCsv = maquinasCfg.join(",");
    const [rows] = await db.query<(RowDataPacket & { id_maquina: number; codigo_visible: string })[]>(
      "SELECT id_maquina, codigo_visible FROM maquina WHERE id_lavanderia = :idLav AND FIND_IN_SET(id_maquina, :idsCsv) > 0",
      { idLav, idsCsv },
    );
    for (const m of rows) {
      await db.query<ResultSetHeader>("UPDATE maquina SET estado_actual = 'PAUSADA' WHERE id_maquina = :id", { id: m.id_maquina });
      publishMachineCommand(m.codigo_visible, {
        accion: "encender_rele",
        id_maquina: m.id_maquina,
        timestamp: new Date().toISOString(),
      });
    }
  }
  await audit(req, "IOT_STORE_OPEN", `Abrir tienda aplicado: ${JSON.stringify(actions.abrir_tienda)}`);
  res.json({ ok: true, state: next, maquinas_encendidas: maquinasCfg });
});

iotRouter.post("/store/close", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = await getConfigLav<IoTState>(idLav, "iot_state", {
    puerta_abierta: false,
    luces_encendidas: false,
    ventilacion_encendida: false,
  });
  const actions = await getConfigLav<StoreActions>(idLav, "iot_store_actions", {
    abrir_tienda: { puerta_abierta: true, luces_encendidas: true, ventilacion_encendida: true },
    cerrar_tienda: { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false },
  });
  const next = { ...state, ...actions.cerrar_tienda, updated_at: new Date().toISOString() };
  await setConfigLav(idLav, "iot_state", next, "Estado por cerrar tienda");
  await audit(req, "IOT_STORE_CLOSE", `Cerrar tienda aplicado: ${JSON.stringify(actions.cerrar_tienda)}`);
  res.json({ ok: true, state: next });
});

