import mqtt, { type MqttClient } from "mqtt";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/pool.js";
import { env } from "../system/env.js";

type EstadoPayload = {
  id_maquina?: number;
  estado?: string;
  timestamp?: string;
};

type EventoPayload = {
  id_maquina?: number;
  id_ciclo?: number;
  tipo_evento?: string;
  nivel?: string;
  payload?: unknown;
  timestamp?: string;
};

type MaquinaRef = RowDataPacket & {
  id_maquina: number;
  id_lavanderia: number;
  codigo_visible: string;
};

type ConfigRow = RowDataPacket & { valor: string };

let client: MqttClient | null = null;
let mqttConnected = false;

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
    "SELECT valor FROM configuracion WHERE ambito='LAVANDERIA' AND id_lavanderia=:idLav AND clave=:clave LIMIT 1",
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

async function isFanAutoEnabled(idLav: number, idMaquina: number) {
  const map = await getConfigLav<Record<string, boolean>>(idLav, "fan_auto_enabled", {});
  return Boolean(map[fanKey(idMaquina)]);
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

function toMySqlDate(value?: string): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace("T", " ");
  return d.toISOString().slice(0, 19).replace("T", " ");
}

async function findMachineByCode(codigoVisible: string): Promise<MaquinaRef | null> {
  const [rows] = await db.query<MaquinaRef[]>(
    `SELECT id_maquina, id_lavanderia, codigo_visible FROM maquina WHERE codigo_visible = :codigo LIMIT 1`,
    { codigo: codigoVisible },
  );
  return rows[0] ?? null;
}

function parseTopic(topic: string): { codigo: string; kind: "estado" | "evento" } | null {
  const parts = topic.split("/");
  if (parts.length !== 4) return null;
  if (parts[0] !== "kwl" || parts[1] !== "maquinas") return null;
  if (parts[3] !== "estado" && parts[3] !== "evento") return null;
  return { codigo: parts[2], kind: parts[3] };
}

function normalizeEstado(raw: string): string {
  const up = raw.toUpperCase();
  if (up === "STOP") return "STOP";
  if (up === "EN_MARCHA") return "EN_MARCHA";
  if (up === "PAUSADA") return "PAUSADA";
  if (up === "MANTENIMIENTO") return "MANTENIMIENTO";
  if (up === "FUERA_SERVICIO") return "FUERA_SERVICIO";
  return "STOP";
}

async function processEstado(codigo: string, data: EstadoPayload) {
  const machine = await findMachineByCode(codigo);
  if (!machine) return;

  const estado = normalizeEstado(String(data.estado ?? "STOP"));
  const [prevRows] = await db.query<(RowDataPacket & { estado_actual: string })[]>(
    "SELECT estado_actual FROM maquina WHERE id_maquina=:id LIMIT 1",
    { id: machine.id_maquina },
  );
  const prevEstado = String(prevRows[0]?.estado_actual || "STOP");

  await db.query<ResultSetHeader>(
    `UPDATE maquina SET estado_actual = :estado WHERE id_maquina = :idMaquina`,
    { estado, idMaquina: machine.id_maquina },
  );

  await db.query<ResultSetHeader>(
    `
    INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
    VALUES (:idLav, :idMaquina, NULL, :fecha, 'MQTT_ESTADO', 'INFO', JSON_OBJECT('estado', :estado, 'codigo_visible', :codigo), 1)
    `,
    {
      idLav: machine.id_lavanderia,
      idMaquina: machine.id_maquina,
      fecha: toMySqlDate(data.timestamp),
      estado,
      codigo,
    },
  );

  if (estado === "EN_MARCHA") {
    if (await isFanAutoEnabled(machine.id_lavanderia, machine.id_maquina)) {
      await clearFanPendingOff(machine.id_lavanderia, machine.id_maquina);
      publishMachineCommand(machine.codigo_visible, {
        accion: "ventilador_on",
        id_maquina: machine.id_maquina,
        timestamp: new Date().toISOString(),
      });
    }
  } else if (prevEstado === "EN_MARCHA") {
    await setFanPendingOff(machine.id_lavanderia, machine.id_maquina, 5);
  }
}

async function processEvento(codigo: string, data: EventoPayload) {
  const machine = await findMachineByCode(codigo);
  if (!machine) return;

  const tipoEvento = String(data.tipo_evento ?? "EVENTO_DISPOSITIVO");
  const nivel = String(data.nivel ?? "INFO").toUpperCase();

  await db.query<ResultSetHeader>(
    `
    INSERT INTO log_maquina (id_lavanderia, id_maquina, id_ciclo, fecha_hora, tipo_evento, nivel, payload, procesado)
    VALUES (:idLav, :idMaquina, :idCiclo, :fecha, :tipo, :nivel, :payload, 1)
    `,
    {
      idLav: machine.id_lavanderia,
      idMaquina: machine.id_maquina,
      idCiclo: data.id_ciclo ?? null,
      fecha: toMySqlDate(data.timestamp),
      tipo: tipoEvento,
      nivel: ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"].includes(nivel) ? nivel : "INFO",
      payload: JSON.stringify(data.payload ?? {}),
    },
  );

  if (tipoEvento === "CICLO_FINALIZADO") {
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'STOP' WHERE id_maquina = :idMaquina`, {
      idMaquina: machine.id_maquina,
    });

    await db.query<ResultSetHeader>(
      `
      UPDATE ciclo
      SET estado_ciclo = 'FINALIZADO', fecha_hora_fin = COALESCE(fecha_hora_fin, NOW())
      WHERE id_maquina = :idMaquina AND estado_ciclo = 'INICIADO'
      ORDER BY fecha_hora_inicio DESC
      LIMIT 1
      `,
      { idMaquina: machine.id_maquina },
    );
    await setFanPendingOff(machine.id_lavanderia, machine.id_maquina, 5);
  }

  if (tipoEvento === "PULSO_INICIO") {
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'EN_MARCHA' WHERE id_maquina = :idMaquina`, {
      idMaquina: machine.id_maquina,
    });
    if (await isFanAutoEnabled(machine.id_lavanderia, machine.id_maquina)) {
      await clearFanPendingOff(machine.id_lavanderia, machine.id_maquina);
      publishMachineCommand(machine.codigo_visible, {
        accion: "ventilador_on",
        id_maquina: machine.id_maquina,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (tipoEvento === "PULSO_FIN") {
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'STOP' WHERE id_maquina = :idMaquina`, {
      idMaquina: machine.id_maquina,
    });
    await db.query<ResultSetHeader>(
      `
      UPDATE ciclo
      SET estado_ciclo = 'FINALIZADO', fecha_hora_fin = COALESCE(fecha_hora_fin, NOW())
      WHERE id_maquina = :idMaquina AND estado_ciclo = 'INICIADO'
      ORDER BY fecha_hora_inicio DESC
      LIMIT 1
      `,
      { idMaquina: machine.id_maquina },
    );
    await setFanPendingOff(machine.id_lavanderia, machine.id_maquina, 5);
  }
}

async function onMessage(topic: string, payload: Buffer) {
  const parsed = parseTopic(topic);
  if (!parsed) return;

  let data: any;
  try {
    data = JSON.parse(payload.toString("utf8"));
  } catch {
    return;
  }

  if (parsed.kind === "estado") {
    await processEstado(parsed.codigo, data as EstadoPayload);
    return;
  }

  await processEvento(parsed.codigo, data as EventoPayload);
}

export function startMqttBridge() {
  if (!env.mqtt.enabled) return;
  if (client) return;

  client = mqtt.connect(env.mqtt.url, {
    username: env.mqtt.user || undefined,
    password: env.mqtt.pass || undefined,
    reconnectPeriod: 3000,
    connectTimeout: 5000,
  });

  client.on("connect", () => {
    mqttConnected = true;
    client?.subscribe("kwl/maquinas/+/estado");
    client?.subscribe("kwl/maquinas/+/evento");
  });
  client.on("close", () => {
    mqttConnected = false;
  });
  client.on("error", () => {
    mqttConnected = false;
  });

  client.on("message", (topic, payload) => {
    onMessage(topic, payload).catch(() => {});
  });
}

export function getMqttHealth() {
  return {
    enabled: env.mqtt.enabled,
    connected: mqttConnected,
    url: env.mqtt.url,
  };
}

export function publishMachineCommand(codigoVisible: string, command: Record<string, unknown>) {
  if (!env.mqtt.enabled || !client || !client.connected) return;
  const topic = `kwl/maquinas/${codigoVisible}/comando`;
  client.publish(topic, JSON.stringify(command), { qos: 0 });
}
