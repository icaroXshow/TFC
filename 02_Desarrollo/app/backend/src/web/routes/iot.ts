import { Router } from "express";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../../db/pool.js";
import { requireAuth, requireLavanderia, requireRole } from "../auth/middleware.js";
import { publishIotCommand, publishMachineCommand } from "../../iot/mqtt.js";
import { appendIotActionLog, getIotActionLog, type IotActionLogItem } from "../../iot/action-log.js";
import { env } from "../../system/env.js";
import { redisDel, redisGetJson, redisSetJson } from "../../cache/redis.js";

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
  abrir_tienda: { puerta_abierta: boolean; luces_encendidas: boolean };
  cerrar_tienda: { puerta_abierta: boolean; luces_encendidas: boolean };
};

type StoreSchedule = {
  open: string | null;
  close: string | null;
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
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

function normalizeTime(t: string | null | undefined): string | null {
  if (!t) return null;
  return isTimeHHMM(t) ? t : null;
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

function cacheKey(idLav: number, clave: string) {
  return `${env.redis.keyPrefix}:lav:${idLav}:cfg:${clave}`;
}

function approxCacheKey(idLav: number) {
  return `${env.redis.keyPrefix}:lav:${idLav}:iot:approx_state`;
}

async function getConfigLavCached<T>(idLav: number, clave: string, fallback: T): Promise<T> {
  const key = cacheKey(idLav, clave);
  const cached = await redisGetJson<T>(key);
  if (cached !== null) return cached;
  const fromDb = await getConfigLav<T>(idLav, clave, fallback);
  await redisSetJson(key, fromDb, 30);
  return fromDb;
}

async function setConfigLavCached(idLav: number, clave: string, valor: unknown, descripcion: string) {
  await setConfigLav(idLav, clave, valor, descripcion);
  await redisSetJson(cacheKey(idLav, clave), valor, 30);
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
    item.on = normalizeTime(item.on ?? null);
    item.off = normalizeTime(item.off ?? null);
  });
  return s;
}

function deriveApproxStateFromLog(log: IotActionLogItem[]) {
  let puerta = false;
  let luces = false;
  let ventilacion = false;
  for (const item of log) {
    if (item.dispositivo === "puerta") {
      if (item.accion === "on") puerta = true;
      else if (item.accion === "off") puerta = false;
      else puerta = !puerta;
    }
    if (item.dispositivo === "luces") {
      if (item.accion === "on") luces = true;
      else if (item.accion === "off") luces = false;
      else luces = !luces;
    }
    if (item.dispositivo === "ventilacion") {
      if (item.accion === "on") ventilacion = true;
      else if (item.accion === "off") ventilacion = false;
      else ventilacion = !ventilacion;
    }
  }
  return { puerta_abierta: puerta, luces_encendidas: luces, ventilacion_encendida: ventilacion };
}

function nextBool(current: boolean, accion: string): boolean {
  if (accion === "on") return true;
  if (accion === "off") return false;
  return !current;
}

iotRouter.get("/state", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = await getConfigLavCached<IoTState>(
    idLav,
    "iot_state",
    { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false },
  );
  res.json({ ok: true, state });
});

iotRouter.get("/approx-state", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const ck = approxCacheKey(idLav);
  const cached = await redisGetJson<{ approx: IoTState; last_action: IotActionLogItem | null }>(ck);
  if (cached) return res.json({ ok: true, approx: cached.approx, last_action: cached.last_action, cache: "redis" });
  const safeLog = await getIotActionLog(idLav);
  const approx = deriveApproxStateFromLog(safeLog);
  const last = safeLog[safeLog.length - 1] ?? null;
  await redisSetJson(ck, { approx, last_action: last }, 5);
  res.json({ ok: true, approx, last_action: last });
});

iotRouter.get("/relay-action-log", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const safeLog = await getIotActionLog(idLav);
  res.json({ ok: true, items: safeLog.slice(-50).reverse() });
});

iotRouter.post("/relay-action", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const raw = String(req.body?.dispositivo ?? "").toLowerCase();
  const allowedDevices = new Set(["puerta", "luces", "ventilacion", "tienda"]);
  if (!allowedDevices.has(raw)) return res.status(400).json({ ok: false, error: "BAD_DISPOSITIVO" });
  const accionRaw = String(req.body?.accion ?? "toggle").toLowerCase();
  const accion = accionRaw === "on" || accionRaw === "off" ? accionRaw : "toggle";
  const origen = String(req.body?.origen ?? "manual").slice(0, 40);
  const nextItem: IotActionLogItem = {
    dispositivo: raw,
    accion,
    ts: new Date().toISOString(),
    by: Number(req.auth?.id_usuario ?? "0") || undefined,
    origen,
  };
  await appendIotActionLog(idLav, nextItem);
  if (raw === "puerta" || raw === "luces" || raw === "ventilacion") {
    const state = await getConfigLavCached<IoTState>(
      idLav,
      "iot_state",
      { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false },
    );
    if (raw === "puerta") state.puerta_abierta = nextBool(Boolean(state.puerta_abierta), accion);
    if (raw === "luces") state.luces_encendidas = nextBool(Boolean(state.luces_encendidas), accion);
    if (raw === "ventilacion") state.ventilacion_encendida = nextBool(Boolean(state.ventilacion_encendida), accion);
    state.updated_at = new Date().toISOString();
    await setConfigLavCached(idLav, "iot_state", state, "Estado manual de IoT (relay-action)");
    publishIotCommand(idLav, { dispositivo: raw, accion, ts: nextItem.ts, origen });
  }
  const log = await getIotActionLog(idLav);
  const approx = deriveApproxStateFromLog(log);
  await audit(req, "IOT_RELAY_ACTION", `Acción ${raw}:${accion} (${origen})`);
  await redisDel(approxCacheKey(idLav));
  res.json({ ok: true, approx, last_action: nextItem });
});

iotRouter.put("/state", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = normalizeState(req.body ?? {});
  await setConfigLavCached(idLav, "iot_state", state, "Estado manual de IoT (MVP)");
  publishIotCommand(idLav, {
    dispositivo: "puerta",
    accion: state.puerta_abierta ? "on" : "off",
    ts: new Date().toISOString(),
    origen: "state_put",
  });
  publishIotCommand(idLav, {
    dispositivo: "luces",
    accion: state.luces_encendidas ? "on" : "off",
    ts: new Date().toISOString(),
    origen: "state_put",
  });
  publishIotCommand(idLav, {
    dispositivo: "ventilacion",
    accion: state.ventilacion_encendida ? "on" : "off",
    ts: new Date().toISOString(),
    origen: "state_put",
  });
  await audit(req, "IOT_SET_STATE", `Estado actualizado: ${JSON.stringify(state)}`);
  await redisDel(approxCacheKey(idLav));
  res.json({ ok: true, state });
});

iotRouter.get("/schedule", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const schedule = await getConfigLavCached<IoTSchedule>(idLav, "iot_schedule", {
    puerta: { on: null, off: null },
    luces: { on: null, off: null },
    ventilacion: { on: null, off: null },
  });
  res.json({ ok: true, schedule });
});

iotRouter.put("/schedule", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const schedule = normalizeSchedule(req.body ?? {});
  await setConfigLavCached(idLav, "iot_schedule", schedule, "Programación IoT (MVP)");
  await audit(req, "IOT_SET_SCHEDULE", `Horario actualizado: ${JSON.stringify(schedule)}`);
  res.json({ ok: true, schedule });
});

iotRouter.get("/store-schedule", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const schedule = await getConfigLavCached<StoreSchedule>(idLav, "iot_store_schedule", {
    open: null,
    close: null,
  });
  res.json({ ok: true, schedule });
});

iotRouter.put("/store-schedule", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const schedule: StoreSchedule = {
    open: normalizeTime(req.body?.open ?? null),
    close: normalizeTime(req.body?.close ?? null),
  };
  await setConfigLavCached(idLav, "iot_store_schedule", schedule, "Programación general de tienda");
  await audit(req, "IOT_SET_STORE_SCHEDULE", `Horario tienda: ${JSON.stringify(schedule)}`);
  res.json({ ok: true, schedule });
});

iotRouter.get("/store-actions", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const actions = await getConfigLavCached<StoreActions>(idLav, "iot_store_actions", {
    abrir_tienda: { puerta_abierta: true, luces_encendidas: true },
    cerrar_tienda: { puerta_abierta: false, luces_encendidas: false },
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
    },
    cerrar_tienda: {
      puerta_abierta: Boolean(input?.cerrar_tienda?.puerta_abierta),
      luces_encendidas: Boolean(input?.cerrar_tienda?.luces_encendidas),
    },
  };
  await setConfigLavCached(idLav, "iot_store_actions", actions, "Acciones botones abrir/cerrar tienda");
  await audit(req, "IOT_SET_STORE_ACTIONS", `Acciones tienda: ${JSON.stringify(actions)}`);
  res.json({ ok: true, actions });
});

iotRouter.get("/store-open-machines", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const maquinas = await getConfigLavCached<number[]>(idLav, "iot_store_open_machines", []);
  res.json({ ok: true, maquinas });
});

iotRouter.put("/store-open-machines", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const raw = Array.isArray(req.body?.maquinas) ? req.body.maquinas : [];
  const maquinas = [...new Set(raw.map((x: unknown) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0))];
  await setConfigLavCached(idLav, "iot_store_open_machines", maquinas, "Máquinas a encender con botón Abrir");
  await audit(req, "IOT_SET_STORE_OPEN_MACHINES", `Maquinas abrir tienda: ${JSON.stringify(maquinas)}`);
  res.json({ ok: true, maquinas });
});

iotRouter.get("/store-close-machines", requireAuth, requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const maquinas = await getConfigLavCached<number[]>(idLav, "iot_store_close_machines", []);
  res.json({ ok: true, maquinas });
});

iotRouter.put("/store-close-machines", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const raw = Array.isArray(req.body?.maquinas) ? req.body.maquinas : [];
  const maquinas = [...new Set(raw.map((x: unknown) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0))];
  await setConfigLavCached(idLav, "iot_store_close_machines", maquinas, "Máquinas a apagar con botón Cerrar");
  await audit(req, "IOT_SET_STORE_CLOSE_MACHINES", `Maquinas cerrar tienda: ${JSON.stringify(maquinas)}`);
  res.json({ ok: true, maquinas });
});

iotRouter.post("/store/open", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = await getConfigLavCached<IoTState>(idLav, "iot_state", {
    puerta_abierta: false,
    luces_encendidas: false,
    ventilacion_encendida: false,
  });
  const actions = await getConfigLavCached<StoreActions>(idLav, "iot_store_actions", {
    abrir_tienda: { puerta_abierta: true, luces_encendidas: true },
    cerrar_tienda: { puerta_abierta: false, luces_encendidas: false },
  });
  const next = {
    ...state,
    puerta_abierta: actions.abrir_tienda.puerta_abierta ? true : state.puerta_abierta,
    luces_encendidas: actions.abrir_tienda.luces_encendidas ? true : state.luces_encendidas,
    updated_at: new Date().toISOString(),
  };
  await setConfigLavCached(idLav, "iot_state", next, "Estado por abrir tienda");
  if (actions.abrir_tienda.puerta_abierta) {
    publishIotCommand(idLav, {
      dispositivo: "puerta",
      accion: "on",
      ts: new Date().toISOString(),
      origen: "store_open",
    });
    await appendIotActionLog(idLav, {
      dispositivo: "puerta",
      accion: "on",
      ts: new Date().toISOString(),
      by: Number(req.auth?.id_usuario ?? "0") || undefined,
      origen: "store_open",
    });
  }
  if (actions.abrir_tienda.luces_encendidas) {
    publishIotCommand(idLav, {
      dispositivo: "luces",
      accion: "on",
      ts: new Date().toISOString(),
      origen: "store_open",
    });
    await appendIotActionLog(idLav, {
      dispositivo: "luces",
      accion: "on",
      ts: new Date().toISOString(),
      by: Number(req.auth?.id_usuario ?? "0") || undefined,
      origen: "store_open",
    });
  }
  const maquinasCfg = await getConfigLavCached<number[]>(idLav, "iot_store_open_machines", []);
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
      }, idLav);
    }
  }
  await audit(req, "IOT_STORE_OPEN", `Abrir tienda aplicado: ${JSON.stringify(actions.abrir_tienda)}`);
  await redisDel(approxCacheKey(idLav));
  res.json({ ok: true, state: next, maquinas_encendidas: maquinasCfg });
});

iotRouter.post("/store/close", requireAuth, requireRole(["ADMIN"]), requireLavanderia, async (req, res) => {
  const idLav = req.auth?.id_lavanderia ?? 1;
  const state = await getConfigLavCached<IoTState>(idLav, "iot_state", {
    puerta_abierta: false,
    luces_encendidas: false,
    ventilacion_encendida: false,
  });
  const actions = await getConfigLavCached<StoreActions>(idLav, "iot_store_actions", {
    abrir_tienda: { puerta_abierta: true, luces_encendidas: true },
    cerrar_tienda: { puerta_abierta: false, luces_encendidas: false },
  });
  const nextClosed = {
    ...state,
    puerta_abierta: actions.cerrar_tienda.puerta_abierta ? false : state.puerta_abierta,
    luces_encendidas: actions.cerrar_tienda.luces_encendidas ? false : state.luces_encendidas,
    updated_at: new Date().toISOString(),
  };
  await setConfigLavCached(idLav, "iot_state", nextClosed, "Estado por cerrar tienda");
  if (actions.cerrar_tienda.puerta_abierta) {
    publishIotCommand(idLav, {
      dispositivo: "puerta",
      accion: "off",
      ts: new Date().toISOString(),
      origen: "store_close",
    });
    await appendIotActionLog(idLav, {
      dispositivo: "puerta",
      accion: "off",
      ts: new Date().toISOString(),
      by: Number(req.auth?.id_usuario ?? "0") || undefined,
      origen: "store_close",
    });
  }
  if (actions.cerrar_tienda.luces_encendidas) {
    publishIotCommand(idLav, {
      dispositivo: "luces",
      accion: "off",
      ts: new Date().toISOString(),
      origen: "store_close",
    });
    await appendIotActionLog(idLav, {
      dispositivo: "luces",
      accion: "off",
      ts: new Date().toISOString(),
      by: Number(req.auth?.id_usuario ?? "0") || undefined,
      origen: "store_close",
    });
  }
  const maquinasCloseCfg = await getConfigLavCached<number[]>(idLav, "iot_store_close_machines", []);
  if (maquinasCloseCfg.length) {
    const idsCsv = maquinasCloseCfg.join(",");
    const [rows] = await db.query<(RowDataPacket & { id_maquina: number; codigo_visible: string })[]>(
      "SELECT id_maquina, codigo_visible FROM maquina WHERE id_lavanderia = :idLav AND FIND_IN_SET(id_maquina, :idsCsv) > 0",
      { idLav, idsCsv },
    );
    for (const m of rows) {
      await db.query<ResultSetHeader>("UPDATE maquina SET estado_actual = 'STOP' WHERE id_maquina = :id", { id: m.id_maquina });
      publishMachineCommand(m.codigo_visible, {
        accion: "apagar_rele",
        id_maquina: m.id_maquina,
        timestamp: new Date().toISOString(),
      }, idLav);
    }
  }
  await audit(req, "IOT_STORE_CLOSE", `Cerrar tienda aplicado: ${JSON.stringify(actions.cerrar_tienda)}`);
  await redisDel(approxCacheKey(idLav));
  res.json({ ok: true, state: nextClosed, maquinas_apagadas: maquinasCloseCfg });
});
