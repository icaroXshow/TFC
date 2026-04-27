import mqtt, { type MqttClient } from "mqtt";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "../db/pool.js";
import { env } from "../system/env.js";
import { appendIotActionLog } from "./action-log.js";

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
type TarifaRow = RowDataPacket & { id_tarifa: number; tiempo_base_minutos: number };
type CicloOpenRow = RowDataPacket & { id_ciclo: number };

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

async function findMachineByCode(codigoVisible: string, idLav?: number): Promise<MaquinaRef | null> {
  if (Number.isFinite(idLav) && Number(idLav) > 0) {
    const [rows] = await db.query<MaquinaRef[]>(
      `
      SELECT id_maquina, id_lavanderia, codigo_visible
      FROM maquina
      WHERE codigo_visible = :codigo
        AND id_lavanderia = :idLav
      LIMIT 1
      `,
      { codigo: codigoVisible, idLav: Number(idLav) },
    );
    return rows[0] ?? null;
  }
  const [rows] = await db.query<MaquinaRef[]>(
    `SELECT id_maquina, id_lavanderia, codigo_visible FROM maquina WHERE codigo_visible = :codigo ORDER BY id_maquina ASC LIMIT 1`,
    { codigo: codigoVisible },
  );
  return rows[0] ?? null;
}

function parseTopic(topic: string): { idLav?: number; codigo: string; kind: "estado" | "evento" } | null {
  const parts = topic.split("/");
  if (parts[0] !== "kwl" || parts[1] !== "maquinas") return null;
  if (parts.length === 4 && (parts[3] === "estado" || parts[3] === "evento")) {
    return { codigo: String(parts[2] || "").toUpperCase(), kind: parts[3] };
  }
  if (parts.length === 5 && (parts[4] === "estado" || parts[4] === "evento")) {
    const idLav = Number(parts[2]);
    if (!Number.isFinite(idLav) || idLav <= 0) return null;
    return { idLav, codigo: String(parts[3] || "").toUpperCase(), kind: parts[4] };
  }
  return null;
}

function parseIotTopic(topic: string): { idLav: number; kind: "estado" | "evento" } | null {
  const parts = topic.split("/");
  if (parts.length !== 4) return null;
  if (parts[0] !== "kwl" || parts[1] !== "iot") return null;
  if (parts[3] !== "estado" && parts[3] !== "evento") return null;
  const idLav = Number(parts[2]);
  if (!Number.isFinite(idLav) || idLav <= 0) return null;
  return { idLav, kind: parts[3] };
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

async function processEstado(idLav: number | undefined, codigo: string, data: EstadoPayload) {
  const machine = await findMachineByCode(codigo, idLav);
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
      }, machine.id_lavanderia);
    }
  } else if (prevEstado === "EN_MARCHA") {
    await setFanPendingOff(machine.id_lavanderia, machine.id_maquina, 5);
  }
}

async function processEvento(idLav: number | undefined, codigo: string, data: EventoPayload) {
  const machine = await findMachineByCode(codigo, idLav);
  if (!machine) return;

  const tipoEvento = String(data.tipo_evento ?? "EVENTO_DISPOSITIVO");
  const nivel = String(data.nivel ?? "INFO").toUpperCase();
  const payload = (data.payload && typeof data.payload === "object" ? (data.payload as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;

  const ensureOpenCycle = async () => {
    const [openRows] = await db.query<CicloOpenRow[]>(
      "SELECT id_ciclo FROM ciclo WHERE id_maquina = :idMaquina AND estado_ciclo = 'INICIADO' ORDER BY fecha_hora_inicio DESC LIMIT 1",
      { idMaquina: machine.id_maquina },
    );
    if (openRows[0]?.id_ciclo) return openRows[0].id_ciclo;
    const [tarifaRows] = await db.query<TarifaRow[]>(
      `
      SELECT id_tarifa, tiempo_base_minutos
      FROM tarifa_maquina
      WHERE id_lavanderia=:idLav
        AND activa=1
        AND fecha_inicio_vigencia<=NOW()
        AND (fecha_fin_vigencia IS NULL OR fecha_fin_vigencia>NOW())
      ORDER BY fecha_inicio_vigencia DESC
      LIMIT 1
      `,
      { idLav: machine.id_lavanderia },
    );
    const tarifa = tarifaRows[0];
    if (!tarifa) return null;
    const [ins] = await db.query<ResultSetHeader>(
      `
      INSERT INTO ciclo (
        id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
        precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
        importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
        duracion_total_programada_min, observaciones
      ) VALUES (
        :idMaquina, :idTarifa, NOW(), NULL, 'INICIADO',
        0.00, :tiempoBase, 0, 0.00, 0.00, 0.00, :tiempoBase, 'MQTT auto-cycle'
      )
      `,
      { idMaquina: machine.id_maquina, idTarifa: tarifa.id_tarifa, tiempoBase: Number(tarifa.tiempo_base_minutos || 35) },
    );
    return ins.insertId || null;
  };

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
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'PAUSADA' WHERE id_maquina = :idMaquina`, {
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
    await ensureOpenCycle();
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'EN_MARCHA' WHERE id_maquina = :idMaquina`, {
      idMaquina: machine.id_maquina,
    });
    if (await isFanAutoEnabled(machine.id_lavanderia, machine.id_maquina)) {
      await clearFanPendingOff(machine.id_lavanderia, machine.id_maquina);
      publishMachineCommand(machine.codigo_visible, {
        accion: "ventilador_on",
        id_maquina: machine.id_maquina,
        timestamp: new Date().toISOString(),
      }, machine.id_lavanderia);
    }
  }

  if (tipoEvento === "PULSO_FIN") {
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = 'PAUSADA' WHERE id_maquina = :idMaquina`, {
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

  if (tipoEvento === "AMPLIACION_APLICADA") {
    const idCiclo = await ensureOpenCycle();
    if (idCiclo) {
      const minutosExtra = Math.max(0, Number(payload.minutos ?? 0));
      const importeExtra = Math.max(0, Number(payload.importe ?? 0));
      if (minutosExtra > 0 || importeExtra > 0) {
        await db.query<ResultSetHeader>(
          `
          UPDATE ciclo
          SET minutos_extra_total = minutos_extra_total + :minutos,
              importe_bonificado_total = importe_bonificado_total + :importe,
              importe_total_aplicado = importe_total_aplicado + :importe,
              duracion_total_programada_min = duracion_total_programada_min + :minutos
          WHERE id_ciclo = :idCiclo
          `,
          { minutos: minutosExtra, importe: importeExtra, idCiclo },
        );
      }
    }
  }
}

async function onMessage(topic: string, payload: Buffer) {
  let data: any;
  try {
    data = JSON.parse(payload.toString("utf8"));
  } catch {
    return;
  }

  const parsedMachine = parseTopic(topic);
  if (parsedMachine) {
    if (parsedMachine.kind === "estado") {
      await processEstado(parsedMachine.idLav, parsedMachine.codigo, data as EstadoPayload);
      return;
    }
    await processEvento(parsedMachine.idLav, parsedMachine.codigo, data as EventoPayload);
    return;
  }

  const parsedIot = parseIotTopic(topic);
  if (!parsedIot) return;
  if (parsedIot.kind !== "estado") return;

  const idLav = parsedIot.idLav;
  const state = {
    puerta_abierta: Boolean(data?.puerta_abierta),
    luces_encendidas: Boolean(data?.luces_encendidas),
    ventilacion_encendida: Boolean(data?.ventilacion_encendida),
    updated_at: new Date().toISOString(),
  };
  await setConfigLav(idLav, "iot_state", state, "Estado IoT (sync MQTT simulador)");
  await appendIotActionLog(idLav, {
    dispositivo: "tienda",
    accion: "sync",
    ts: new Date().toISOString(),
    by: 1,
    origen: "mqtt_sim",
  });
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
    client?.subscribe("kwl/maquinas/+/+/estado");
    client?.subscribe("kwl/maquinas/+/+/evento");
    client?.subscribe("kwl/iot/+/estado");
    client?.subscribe("kwl/iot/+/evento");
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

export function publishMachineCommand(codigoVisible: string, command: Record<string, unknown>, idLav?: number) {
  if (!env.mqtt.enabled || !client || !client.connected) return;
  const topic =
    Number.isFinite(idLav) && Number(idLav) > 0
      ? `kwl/maquinas/${Math.trunc(Number(idLav))}/${codigoVisible}/comando`
      : `kwl/maquinas/${codigoVisible}/comando`;
  client.publish(topic, JSON.stringify(command), { qos: 0 });
}

export function publishIotCommand(idLav: number, command: Record<string, unknown>) {
  if (!env.mqtt.enabled || !client || !client.connected) return false;
  if (!Number.isFinite(idLav) || idLav <= 0) return false;
  const topic = `kwl/iot/${Math.trunc(idLav)}/comando`;
  client.publish(topic, JSON.stringify(command), { qos: 0 });
  return true;
}

export function publishMachineState(codigoVisible: string, estado: string, timestamp?: string, idLav?: number) {
  if (!env.mqtt.enabled || !client || !client.connected) return false;
  const topic =
    Number.isFinite(idLav) && Number(idLav) > 0
      ? `kwl/maquinas/${Math.trunc(Number(idLav))}/${String(codigoVisible).toUpperCase()}/estado`
      : `kwl/maquinas/${String(codigoVisible).toUpperCase()}/estado`;
  client.publish(topic, JSON.stringify({ estado, timestamp: timestamp || new Date().toISOString() }), { qos: 0 });
  return true;
}

export function publishMachineEvent(codigoVisible: string, event: Record<string, unknown>, idLav?: number) {
  if (!env.mqtt.enabled || !client || !client.connected) return false;
  const topic =
    Number.isFinite(idLav) && Number(idLav) > 0
      ? `kwl/maquinas/${Math.trunc(Number(idLav))}/${String(codigoVisible).toUpperCase()}/evento`
      : `kwl/maquinas/${String(codigoVisible).toUpperCase()}/evento`;
  client.publish(topic, JSON.stringify(event), { qos: 0 });
  return true;
}

export function publishIotState(
  idLav: number,
  state: { puerta_abierta: boolean; luces_encendidas: boolean; ventilacion_encendida: boolean },
) {
  if (!env.mqtt.enabled || !client || !client.connected) return false;
  if (!Number.isFinite(idLav) || idLav <= 0) return false;
  const topic = `kwl/iot/${Math.trunc(idLav)}/estado`;
  client.publish(topic, JSON.stringify({ ...state, timestamp: new Date().toISOString(), origen: "gui_sim" }), { qos: 0 });
  return true;
}
