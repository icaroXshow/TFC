import { Router } from "express";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";

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

