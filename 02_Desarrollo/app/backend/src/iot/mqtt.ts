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
type MachineRuntimeState = {
  segundos_restantes?: number;
  saldo_credito?: number;
  puerta_estado?: "CERRADA" | "APERTURA_PENDIENTE" | "ABIERTA";
  estado_operativo?: string;
  updated_at?: string;
};
type CreditOriginPending = {
  origen: "MONEDERO" | "WEB_MANUAL" | "SISTEMA";
  importe?: number;
  ts?: string;
};

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

async function getMachineRuntimeStateMap(idLav: number) {
  return getConfigLav<Record<string, MachineRuntimeState>>(idLav, "machine_runtime_state", {});
}

async function setMachineRuntimeStateMap(idLav: number, map: Record<string, MachineRuntimeState>) {
  await setConfigLav(idLav, "machine_runtime_state", map, "Estado runtime por máquina (MQTT)");
}

async function patchMachineRuntimeState(idLav: number, idMaquina: number, patch: Partial<MachineRuntimeState>) {
  const map = await getMachineRuntimeStateMap(idLav);
  const key = String(idMaquina);
  map[key] = { ...(map[key] || {}), ...patch, updated_at: new Date().toISOString() };
  await setMachineRuntimeStateMap(idLav, map);
}

async function hasManualPriority(idLav: number, idMaquina: number) {
  const map = await getConfigLav<Record<string, string | null>>(idLav, "machine_manual_priority_until", {});
  let changed = false;
  const nowMs = Date.now();
  for (const [k, untilRaw] of Object.entries(map)) {
    const ms = untilRaw ? new Date(untilRaw).getTime() : Number.NaN;
    if (!Number.isFinite(ms) || ms <= nowMs) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) {
    await setConfigLav(idLav, "machine_manual_priority_until", map, "Prioridad temporal de control manual por máquina");
  }
  const until = map[String(idMaquina)];
  if (!until) return false;
  const untilMs = new Date(until).getTime();
  if (!Number.isFinite(untilMs)) return false;
  return Date.now() < untilMs;
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
  if (await hasManualPriority(machine.id_lavanderia, machine.id_maquina)) {
    return;
  }

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
  const secs = Number((data as any)?.segundos_restantes_estimados ?? Number.NaN);
  await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, {
    estado_operativo: estado,
    segundos_restantes: Number.isFinite(secs) && secs >= 0 ? Math.floor(secs) : undefined,
  });

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
      SELECT id_tarifa, precio_arranque, tiempo_base_minutos
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
    const creditOriginMap = await getConfigLav<Record<string, CreditOriginPending | null>>(
      machine.id_lavanderia,
      "machine_credit_origin_pending",
      {},
    );
    const pendingOrigin = creditOriginMap[String(machine.id_maquina)] ?? null;
    const precioArranque = Number(tarifa.precio_arranque || 0);
    const abonadoInicial =
      pendingOrigin?.origen === "WEB_MANUAL"
        ? Math.max(0, Math.min(precioArranque, Number(pendingOrigin.importe ?? 0)))
        : 0;
    const importeClienteInicial = Math.max(0, precioArranque - abonadoInicial);

    const [ins] = await db.query<ResultSetHeader>(
      `
      INSERT INTO ciclo (
        id_maquina, id_tarifa_aplicada, fecha_hora_inicio, fecha_hora_fin, estado_ciclo,
        precio_arranque_aplicado, tiempo_base_aplicado_min, minutos_extra_total,
        importe_cliente_total, importe_bonificado_total, importe_total_aplicado,
        duracion_total_programada_min, observaciones
      ) VALUES (
        :idMaquina, :idTarifa, NOW(), NULL, 'INICIADO',
        :precioArranque, :tiempoBase, 0, :importeCliente, :abonado, :precioArranque, :tiempoBase, 'MQTT auto-cycle'
      )
      `,
      {
        idMaquina: machine.id_maquina,
        idTarifa: tarifa.id_tarifa,
        tiempoBase: Number(tarifa.tiempo_base_minutos || 35),
        precioArranque,
        importeCliente: importeClienteInicial,
        abonado: abonadoInicial,
      },
    );
    const idCiclo = ins.insertId || null;
    if (idCiclo && precioArranque > 0) {
      const originMov = pendingOrigin?.origen === "WEB_MANUAL" ? "WEB_MANUAL" : "MONEDERO";
      const isBonif = originMov === "WEB_MANUAL" ? 1 : 0;
      // Si el crédito ya se registró como WEB_MANUAL en /credito, no duplicamos contabilidad en arranque.
      if (originMov !== "WEB_MANUAL") {
        await db.query<ResultSetHeader>(
          `
          INSERT INTO movimiento_maquina (
            id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
            tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
            es_bonificacion, descripcion
          ) VALUES (
            :idLav, :idMaquina, :idCiclo, NULL, NOW(),
            'ARRANQUE', :origen, :importe, 0, :bonif, :descripcion
          )
          `,
          {
            idLav: machine.id_lavanderia,
            idMaquina: machine.id_maquina,
            idCiclo,
            importe: precioArranque,
            origen: originMov,
            bonif: isBonif,
            descripcion: "Arranque detectado por MQTT",
          },
        );
      }
      if (pendingOrigin) {
        delete creditOriginMap[String(machine.id_maquina)];
        await setConfigLav(
          machine.id_lavanderia,
          "machine_credit_origin_pending",
          creditOriginMap,
          "Origen de crédito pendiente por máquina",
        );
      }
    }
    return idCiclo;
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
    const motivo = String(payload.motivo ?? "").toLowerCase();
    const estadoFinal = motivo === "stop_manual" ? "STOP" : "PAUSADA";
    await db.query<ResultSetHeader>(`UPDATE maquina SET estado_actual = :estado WHERE id_maquina = :idMaquina`, {
      estado: estadoFinal,
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
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, {
      estado_operativo: estadoFinal,
      segundos_restantes: 0,
      puerta_estado: "CERRADA",
    });
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
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, {
      estado_operativo: "EN_MARCHA",
    });
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
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, {
      estado_operativo: "PAUSADA",
      segundos_restantes: 0,
    });
  }

  if (tipoEvento === "AMPLIACION_APLICADA") {
    const origen = String(payload?.origen ?? "").toLowerCase();
    const minutosPayload = Number(payload?.minutos ?? Number.NaN);
    const importePayload = Number(payload?.importe ?? 0);
    const minutosCalculados = Number.isFinite(minutosPayload)
      ? Math.max(0, Math.floor(minutosPayload))
      : Math.max(0, Math.floor(importePayload * 15));
    if (minutosCalculados <= 0) return;

    // Si la ampliación vino de web (/maquinas/:id/ampliar), ya está persistida en BD.
    // Aquí solo confirmamos ejecución física para no duplicar minutos.
    if (origen === "web_admin") return;

    // Si la ampliación viene del simulador (cliente mete monedas en secadora en marcha),
    // hay que persistirla en ciclo para mantener web y simulador sincronizados.
    const idCiclo = await ensureOpenCycle();
    if (!idCiclo) return;

    await db.query<ResultSetHeader>(
      `
      UPDATE ciclo
      SET
        minutos_extra_total = minutos_extra_total + :minutos,
        importe_cliente_total = importe_cliente_total + :importe,
        importe_total_aplicado = importe_total_aplicado + :importe,
        duracion_total_programada_min = duracion_total_programada_min + :minutos
      WHERE id_ciclo = :idCiclo
      `,
      {
        idCiclo,
        minutos: minutosCalculados,
        importe: Number(importePayload.toFixed(2)),
      },
    );

    await db.query<ResultSetHeader>(
      `
      INSERT INTO movimiento_maquina (
        id_lavanderia, id_maquina, id_ciclo, id_usuario, fecha_hora,
        tipo_movimiento, origen_movimiento, importe, minutos_extra_generados,
        es_bonificacion, descripcion
      ) VALUES (
        :idLav, :idMaquina, :idCiclo, NULL, NOW(),
        'AMPLIACION_TIEMPO', 'MONEDERO', :importe, :minutos, 0, 'Ampliación desde simulador'
      )
      `,
      {
        idLav: machine.id_lavanderia,
        idMaquina: machine.id_maquina,
        idCiclo,
        importe: Number(importePayload.toFixed(2)),
        minutos: minutosCalculados,
      },
    );
  }
  if (tipoEvento === "CREDITO_ACUMULADO" || tipoEvento === "CREDITO_ACUMULADO_AMPLIACION") {
    const saldo = Number(payload.saldo ?? Number.NaN);
    if (Number.isFinite(saldo) && saldo >= 0) {
      await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, { saldo_credito: Number(saldo.toFixed(2)) });
    }
  }
  if (tipoEvento === "CICLO_INICIADO") {
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, { saldo_credito: 0 });
  }
  if (tipoEvento === "SECADORA_APERTURA_PENDIENTE") {
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, { puerta_estado: "APERTURA_PENDIENTE" });
  }
  if (tipoEvento === "SECADORA_PUERTA_ABIERTA" || tipoEvento === "LAVADORA_PUERTA_ABIERTA") {
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, { puerta_estado: "ABIERTA" });
  }
  if (tipoEvento === "SECADORA_PUERTA_CERRADA" || tipoEvento === "LAVADORA_PUERTA_CERRADA") {
    await patchMachineRuntimeState(machine.id_lavanderia, machine.id_maquina, { puerta_estado: "CERRADA" });
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
  client.on("error", (err) => {
    mqttConnected = false;
    // eslint-disable-next-line no-console
    console.error("MQTT bridge error", err);
  });

  client.on("message", (topic, payload) => {
    onMessage(topic, payload).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("MQTT message processing failed", { topic, err });
    });
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

export async function getRuntimeMachineStateByLav(idLav: number): Promise<Record<string, MachineRuntimeState>> {
  return getMachineRuntimeStateMap(idLav);
}

export async function setCreditOriginPendingByMachine(
  idLav: number,
  idMaquina: number,
  origin: CreditOriginPending | null,
) {
  const map = await getConfigLav<Record<string, CreditOriginPending | null>>(idLav, "machine_credit_origin_pending", {});
  const key = String(idMaquina);
  if (!origin) delete map[key];
  else map[key] = origin;
  await setConfigLav(idLav, "machine_credit_origin_pending", map, "Origen de crédito pendiente por máquina");
}
