import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../db/pool.js";

type ConfigRow = RowDataPacket & { valor: string };

export type IotActionLogItem = {
  dispositivo: string;
  accion: string;
  ts: string;
  by?: number;
  origen?: string;
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function getConfigLav<T>(idLav: number, clave: string, fallback: T): Promise<T> {
  const [rows] = await db.query<ConfigRow[]>(
    `
    SELECT valor
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

function dayKeyNow() {
  return new Date().toISOString().slice(0, 10);
}

export async function ensureDailyIotActionLog(idLav: number) {
  const currentDay = dayKeyNow();
  const savedDay = await getConfigLav<string>(idLav, "iot_action_log_day", "");
  if (savedDay === currentDay) return;
  await setConfigLav(idLav, "iot_action_log", [], "Registro de acciones IoT");
  await setConfigLav(idLav, "iot_action_log_day", currentDay, "Fecha de reseteo diario iot_action_log");
}

export async function getIotActionLog(idLav: number): Promise<IotActionLogItem[]> {
  await ensureDailyIotActionLog(idLav);
  const log = await getConfigLav<IotActionLogItem[]>(idLav, "iot_action_log", []);
  return Array.isArray(log) ? log : [];
}

export async function appendIotActionLog(idLav: number, item: IotActionLogItem) {
  const prev = await getIotActionLog(idLav);
  const next = prev.slice(-499);
  next.push(item);
  await setConfigLav(idLav, "iot_action_log", next, "Registro de acciones IoT");
}

