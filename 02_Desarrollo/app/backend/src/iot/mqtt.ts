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

let client: MqttClient | null = null;
let mqttConnected = false;

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
  }

  if (tipoEvento === "PULSO_INICIO") {
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'EN_MARCHA' WHERE id_maquina = :idMaquina`, {
      idMaquina: machine.id_maquina,
    });
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
