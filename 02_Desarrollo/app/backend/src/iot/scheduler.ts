import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../db/pool.js";
import { appendIotActionLog } from "./action-log.js";
import { publishIotCommand } from "./mqtt.js";

type ConfigRow = RowDataPacket & {
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

type IoTScheduleItem = { on?: string | null; off?: string | null };
type IoTSchedule = {
  puerta?: IoTScheduleItem;
  luces?: IoTScheduleItem;
  ventilacion?: IoTScheduleItem;
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
  // MVP: usamos el usuario 1 como "sistema" (seed demo).
  await db.query<ResultSetHeader>(
    `
    INSERT INTO auditoria (
      id_usuario, id_lavanderia, id_maquina, id_ciclo,
      fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen
    ) VALUES (
      1, :idLav, NULL, NULL,
      NOW(), :accion, 'iot', NULL, :detalle, NULL
    )
    `,
    { idLav, accion, detalle },
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
          AND clave IN ('iot_schedule','iot_state','iot_last')
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
        if (!schedule || (!schedule.puerta && !schedule.luces && !schedule.ventilacion)) continue;

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
              by: 1,
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
              by: 1,
              origen: "auto_schedule",
            });
            await auditSystem(idLav, "IOT_SCHEDULE_OFF", `${label} OFF (${hhmm})`);
          }
        };

        await maybe("Puerta", "puerta_on", "puerta_off", schedule.puerta, "puerta_abierta");
        await maybe("Luces", "luces_on", "luces_off", schedule.luces, "luces_encendidas");
        await maybe("Ventilación", "ventilacion_on", "ventilacion_off", schedule.ventilacion, "ventilacion_encendida");

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

