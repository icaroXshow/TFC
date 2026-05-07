import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../db/pool.js";
import { appendIotActionLog } from "./action-log.js";
import { publishIotCommand, publishMachineCommand } from "./mqtt.js";

type ConfigRow = RowDataPacket & {
  id_lavanderia: number | null;
  clave: string;
  valor: string;
};
type MachineRow = RowDataPacket & { id_maquina: number; codigo_visible: string };

type IoTState = {
  puerta_abierta: boolean;
  luces_encendidas: boolean;
  ventilacion_encendida: boolean;
  updated_at?: string;
};

type IoTScheduleItem = { on?: string | null; off?: string | null };
type IoTSchedule = {
  puerta?: IoTScheduleItem;
  luces?: IoTScheduleItem;
  ventilacion?: IoTScheduleItem;
};
type StoreSchedule = {
  open?: string | null;
  close?: string | null;
};
type StoreActions = {
  abrir_tienda: { puerta_abierta: boolean; luces_encendidas: boolean };
  cerrar_tienda: { puerta_abierta: boolean; luces_encendidas: boolean };
};

type IoTLast = Record<string, string | null>;

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function getConfigLavRaw(idLav: number, clave: string): Promise<string | null> {
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT id_lavanderia, clave, valor
    FROM configuracion
    WHERE ambito='LAVANDERIA'
      AND id_lavanderia=:idLav
      AND clave=:clave
    LIMIT 1
    `,
    { idLav, clave },
  );
  return rows[0]?.valor ?? null;
}

async function setConfigLav(idLav: number, clave: string, valor: unknown, descripcion: string) {
  await db.query<ResultSetHeader>(
    `
    INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
    VALUES ('LAVANDERIA', :idLav, :clave, :valor, :descripcion)
    ON DUPLICATE KEY UPDATE
      valor = VALUES(valor),
      descripcion = VALUES(descripcion)
    `,
    { idLav, clave, valor: JSON.stringify(valor), descripcion },
  );
}

async function auditSystem(idLav: number, accion: string, detalle: string) {
  // Auditoría de sistema: no depende de usuario demo fijo.
  await db.query<ResultSetHeader>(
    `
    INSERT INTO auditoria (
      id_usuario, id_lavanderia, id_maquina, id_ciclo,
      fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
    ) VALUES (
      :idUsuario, :idLav, NULL, NULL,
      NOW(), :accion, 'iot', NULL, :detalle, NULL
    )
    `,
    { idUsuario: null, idLav, accion, detalle },
  );
}

function nowHHMM(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function todayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function shouldRun(last: IoTLast, k: string, dateKey: string, hhmm: string) {
  const marker = `${dateKey} ${hhmm}`;
  return last[k] !== marker;
}

export function startIoTScheduler() {
  // Tick cada 30s para que la demo sea "viva".
  const intervalMs = 30_000;
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      const d = new Date();
      const hhmm = nowHHMM(d);
      const dateKey = todayKey(d);

      const [rows] = await db.query<ConfigRow[]>(
        `
        SELECT id_lavanderia, clave, valor
        FROM configuracion
        WHERE ambito='LAVANDERIA'
          AND clave IN (
            'iot_schedule',
            'iot_store_schedule',
            'iot_store_actions',
            'iot_state',
            'iot_last',
            'iot_store_open_machines',
            'iot_store_close_machines'
          )
        `,
      );

      const byLav = new Map<number, Record<string, string>>();
      rows.forEach((r) => {
        const idLav = Number(r.id_lavanderia);
        if (!Number.isFinite(idLav) || idLav <= 0) return;
        const map = byLav.get(idLav) ?? {};
        map[r.clave] = r.valor;
        byLav.set(idLav, map);
      });

      for (const [idLav, cfg] of byLav.entries()) {
        const schedule = safeJsonParse<IoTSchedule>(cfg.iot_schedule ?? "{}", {});
        const storeSchedule = safeJsonParse<StoreSchedule>(cfg.iot_store_schedule ?? "{}", {});
        const storeActions = safeJsonParse<StoreActions>(cfg.iot_store_actions ?? "{}", {
          abrir_tienda: { puerta_abierta: true, luces_encendidas: true },
          cerrar_tienda: { puerta_abierta: true, luces_encendidas: true },
        });
        const openMachinesCfg = safeJsonParse<number[]>(cfg.iot_store_open_machines ?? "[]", []);
        const closeMachinesCfg = safeJsonParse<number[]>(cfg.iot_store_close_machines ?? "[]", []);

        const state = safeJsonParse<IoTState>(cfg.iot_state ?? "{}", {
          puerta_abierta: false,
          luces_encendidas: false,
          ventilacion_encendida: false,
        });
        const last = safeJsonParse<IoTLast>(cfg.iot_last ?? "{}", {});

        let changed = false;

        const apply = (k: string, value: boolean) => {
          if (k === "puerta_abierta" && state.puerta_abierta !== value) {
            state.puerta_abierta = value;
            changed = true;
          }
          if (k === "luces_encendidas" && state.luces_encendidas !== value) {
            state.luces_encendidas = value;
            changed = true;
          }
          if (k === "ventilacion_encendida" && state.ventilacion_encendida !== value) {
            state.ventilacion_encendida = value;
            changed = true;
          }
        };

        const maybe = async (
          label: string,
          onKey: string,
          offKey: string,
          scheduleItem: IoTScheduleItem | undefined,
          stateField: "puerta_abierta" | "luces_encendidas" | "ventilacion_encendida",
        ) => {
          if (!scheduleItem) return;
          if (scheduleItem.on && scheduleItem.on === hhmm && shouldRun(last, onKey, dateKey, hhmm)) {
            apply(stateField, true);
            last[onKey] = `${dateKey} ${hhmm}`;
            publishIotCommand(idLav, {
              dispositivo: stateField === "puerta_abierta" ? "puerta" : stateField === "luces_encendidas" ? "luces" : "ventilacion",
              accion: "on",
              ts: new Date().toISOString(),
              origen: "auto_schedule",
            });
            await appendIotActionLog(idLav, {
              dispositivo: stateField === "puerta_abierta" ? "puerta" : stateField === "luces_encendidas" ? "luces" : "ventilacion",
              accion: "on",
              ts: new Date().toISOString(),
              by: undefined,
              origen: "auto_schedule",
            });
            await auditSystem(idLav, "IOT_SCHEDULE_ON", `${label} ON (${hhmm})`);
          }
          if (scheduleItem.off && scheduleItem.off === hhmm && shouldRun(last, offKey, dateKey, hhmm)) {
            apply(stateField, false);
            last[offKey] = `${dateKey} ${hhmm}`;
            publishIotCommand(idLav, {
              dispositivo: stateField === "puerta_abierta" ? "puerta" : stateField === "luces_encendidas" ? "luces" : "ventilacion",
              accion: "off",
              ts: new Date().toISOString(),
              origen: "auto_schedule",
            });
            await appendIotActionLog(idLav, {
              dispositivo: stateField === "puerta_abierta" ? "puerta" : stateField === "luces_encendidas" ? "luces" : "ventilacion",
              accion: "off",
              ts: new Date().toISOString(),
              by: undefined,
              origen: "auto_schedule",
            });
            await auditSystem(idLav, "IOT_SCHEDULE_OFF", `${label} OFF (${hhmm})`);
          }
        };

        await maybe("Puerta", "puerta_on", "puerta_off", schedule?.puerta, "puerta_abierta");
        await maybe("Luces", "luces_on", "luces_off", schedule?.luces, "luces_encendidas");
        await maybe("Ventilación", "ventilacion_on", "ventilacion_off", schedule?.ventilacion, "ventilacion_encendida");

        const openTime = storeSchedule?.open || null;
        if (openTime && openTime === hhmm && shouldRun(last, "store_open", dateKey, hhmm)) {
          if (storeActions?.abrir_tienda?.puerta_abierta) {
            apply("puerta_abierta", true);
            publishIotCommand(idLav, { dispositivo: "puerta", accion: "on", ts: new Date().toISOString(), origen: "auto_store_open" });
            await appendIotActionLog(idLav, { dispositivo: "puerta", accion: "on", ts: new Date().toISOString(), by: undefined, origen: "auto_store_open" });
          }
          if (storeActions?.abrir_tienda?.luces_encendidas) {
            apply("luces_encendidas", true);
            publishIotCommand(idLav, { dispositivo: "luces", accion: "on", ts: new Date().toISOString(), origen: "auto_store_open" });
            await appendIotActionLog(idLav, { dispositivo: "luces", accion: "on", ts: new Date().toISOString(), by: undefined, origen: "auto_store_open" });
          }
          last.store_open = `${dateKey} ${hhmm}`;
          await auditSystem(idLav, "IOT_STORE_SCHEDULE_OPEN", `Apertura tienda (${hhmm})`);
        }

        if (openTime && openTime === hhmm && shouldRun(last, "maquinas_open", dateKey, hhmm) && openMachinesCfg.length) {
          const idsCsv = openMachinesCfg.join(",");
          const [mRows] = await db.query<MachineRow[]>(
            "SELECT id_maquina, codigo_visible FROM maquina WHERE id_lavanderia = :idLav AND FIND_IN_SET(id_maquina, :idsCsv) > 0",
            { idLav, idsCsv },
          );
          for (const m of mRows) {
            await db.query<ResultSetHeader>("UPDATE maquina SET estado_actual = 'PAUSADA' WHERE id_maquina = :id", { id: m.id_maquina });
            publishMachineCommand(m.codigo_visible, {
              accion: "encender_rele",
              id_maquina: m.id_maquina,
              ts: new Date().toISOString(),
              origen: "auto_schedule_machines_open",
            }, idLav);
            await appendIotActionLog(idLav, {
              dispositivo: "maquina",
              accion: "on",
              ts: new Date().toISOString(),
              by: undefined,
              origen: `auto_schedule_machine_open:${m.codigo_visible}`,
            });
          }
          last.maquinas_open = `${dateKey} ${hhmm}`;
          await auditSystem(idLav, "IOT_SCHEDULE_MACHINES_OPEN", `Máquinas ON (${hhmm}): ${mRows.map((x) => x.codigo_visible).join(", ")}`);
        }

        const closeTime = storeSchedule?.close || null;
        if (closeTime && closeTime === hhmm && shouldRun(last, "store_close", dateKey, hhmm)) {
          if (storeActions?.cerrar_tienda?.puerta_abierta) {
            apply("puerta_abierta", false);
            publishIotCommand(idLav, { dispositivo: "puerta", accion: "off", ts: new Date().toISOString(), origen: "auto_store_close" });
            await appendIotActionLog(idLav, { dispositivo: "puerta", accion: "off", ts: new Date().toISOString(), by: undefined, origen: "auto_store_close" });
          }
          if (storeActions?.cerrar_tienda?.luces_encendidas) {
            apply("luces_encendidas", false);
            publishIotCommand(idLav, { dispositivo: "luces", accion: "off", ts: new Date().toISOString(), origen: "auto_store_close" });
            await appendIotActionLog(idLav, { dispositivo: "luces", accion: "off", ts: new Date().toISOString(), by: undefined, origen: "auto_store_close" });
          }
          last.store_close = `${dateKey} ${hhmm}`;
          await auditSystem(idLav, "IOT_STORE_SCHEDULE_CLOSE", `Cierre tienda (${hhmm})`);
        }

        if (closeTime && closeTime === hhmm && shouldRun(last, "maquinas_close", dateKey, hhmm) && closeMachinesCfg.length) {
          const idsCsv = closeMachinesCfg.join(",");
          const [mRows] = await db.query<MachineRow[]>(
            "SELECT id_maquina, codigo_visible FROM maquina WHERE id_lavanderia = :idLav AND FIND_IN_SET(id_maquina, :idsCsv) > 0",
            { idLav, idsCsv },
          );
          for (const m of mRows) {
            await db.query<ResultSetHeader>("UPDATE maquina SET estado_actual = 'STOP' WHERE id_maquina = :id", { id: m.id_maquina });
            publishMachineCommand(m.codigo_visible, {
              accion: "apagar_rele",
              id_maquina: m.id_maquina,
              ts: new Date().toISOString(),
              origen: "auto_schedule_machines_close",
            }, idLav);
            await appendIotActionLog(idLav, {
              dispositivo: "maquina",
              accion: "off",
              ts: new Date().toISOString(),
              by: undefined,
              origen: `auto_schedule_machine_close:${m.codigo_visible}`,
            });
          }
          last.maquinas_close = `${dateKey} ${hhmm}`;
          await auditSystem(idLav, "IOT_SCHEDULE_MACHINES_CLOSE", `Máquinas OFF (${hhmm}): ${mRows.map((x) => x.codigo_visible).join(", ")}`);
        }

        if (hhmm === "00:00" && shouldRun(last, "midnight_reset", dateKey, hhmm)) {
          let midnightChanged = false;
          if (state.puerta_abierta) {
            state.puerta_abierta = false;
            midnightChanged = true;
          }
          if (state.luces_encendidas) {
            state.luces_encendidas = false;
            midnightChanged = true;
          }
          if (midnightChanged) {
            changed = true;
            await auditSystem(idLav, "IOT_MIDNIGHT_RESET", "Reset diario 00:00 puerta/luces -> OFF");
          }
          last.midnight_reset = `${dateKey} ${hhmm}`;
        }

        if (changed) {
          state.updated_at = new Date().toISOString();
          await setConfigLav(idLav, "iot_state", state, "Estado IoT (auto por horario)");
          await setConfigLav(idLav, "iot_last", last, "Últimas ejecuciones Programador IoT");
        } else if (Object.keys(last).length) {
          // aunque no cambie (por ejemplo mismo valor), guardamos last para evitar repeticiones
          await setConfigLav(idLav, "iot_last", last, "Últimas ejecuciones Programador IoT");
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("IoT scheduler tick failed", err);
    } finally {
      running = false;
    }
  }

  setInterval(tick, intervalMs).unref();
  // Primer tick al arrancar
  tick().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("IoT scheduler initial tick failed", err);
  });
}

