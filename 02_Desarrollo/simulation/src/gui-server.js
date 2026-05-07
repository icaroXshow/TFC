import express from "express";
import mqtt from "mqtt";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { WebSocketServer } from "ws";

const MQTT_URL = process.env.MQTT_URL || "mqtt://mqtt:1883";
const PORT = Number(process.env.SIM_GUI_PORT || "8090");
const SIM_MACHINE_CODES = String(
  process.env.SIM_MACHINE_CODES || "L1,L2,L3,S1,S2",
)
  .split(",")
  .map((x) => x.trim().toUpperCase())
  .filter(Boolean);
const SIM_LAV_ID = Number(process.env.SIM_LAV_ID || "3");
const SIM_CYCLE_SECONDS = Number(process.env.SIM_CYCLE_SECONDS || "2220");
const SIM_PLUS_SECONDS_PER_EURO = Number(
  process.env.SIM_PLUS_SECONDS_PER_EURO || "540",
);
const SIM_START_MIN_CREDIT = Number(process.env.SIM_START_MIN_CREDIT || "4");
const tarifaActual = {
  cycle_seconds: Number.isFinite(SIM_CYCLE_SECONDS) && SIM_CYCLE_SECONDS > 0 ? SIM_CYCLE_SECONDS : 2220,
  plus_seconds_per_euro:
    Number.isFinite(SIM_PLUS_SECONDS_PER_EURO) && SIM_PLUS_SECONDS_PER_EURO > 0
      ? SIM_PLUS_SECONDS_PER_EURO
      : 540,
  start_min_credit: Number.isFinite(SIM_START_MIN_CREDIT) && SIM_START_MIN_CREDIT > 0 ? SIM_START_MIN_CREDIT : 4,
};

const app = express();
app.use(express.json({ limit: "256kb" }));
const wsClients = new Set();

let mqttConnected = false;
const machineState = Object.fromEntries(
  SIM_MACHINE_CODES.map((c) => [c, "STOP"]),
);
const fanState = Object.fromEntries(SIM_MACHINE_CODES.map((c) => [c, false]));
const iotState = {
  puerta_abierta: false,
  luces_encendidas: false,
  ventilacion_encendida: false,
};
const machineCredit = Object.fromEntries(SIM_MACHINE_CODES.map((c) => [c, 0]));
const machineTimer = Object.fromEntries(SIM_MACHINE_CODES.map((c) => [c, 0]));
const dryerDoorState = Object.fromEntries(
  SIM_MACHINE_CODES.map((c) => [c, false]),
);
const localIso = () => {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
};
let lastUpdate = localIso();

function buildSnapshot() {
  return {
    ok: true,
    mqtt_connected: mqttConnected,
    machines: machineState,
    fan: fanState,
    dryer_door: dryerDoorState,
    iot: iotState,
    credit: machineCredit,
    timer_sec: machineTimer,
    last_update: lastUpdate,
  };
}

function broadcastSnapshot() {
  const json = JSON.stringify(buildSnapshot());
  for (const ws of wsClients) {
    try {
      ws.send(json);
    } catch {
      wsClients.delete(ws);
    }
  }
}

const mqttClient = mqtt.connect(MQTT_URL, {
  reconnectPeriod: 3000,
  connectTimeout: 5000,
});
mqttClient.on("connect", () => {
  mqttConnected = true;
  mqttClient.subscribe(`kwl/maquinas/${SIM_LAV_ID}/+/estado`);
  mqttClient.subscribe(`kwl/maquinas/${SIM_LAV_ID}/+/evento`);
  mqttClient.subscribe(`kwl/iot/${SIM_LAV_ID}/estado`);
  mqttClient.subscribe(`kwl/config/${SIM_LAV_ID}/tarifa`);
});
mqttClient.on("close", () => {
  mqttConnected = false;
});
mqttClient.on("error", () => {
  mqttConnected = false;
});
mqttClient.on("message", (topic, payloadBuf) => {
  let data;
  try {
    data = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    return;
  }
  const parts = topic.split("/");
  if (
    parts[0] === "kwl" &&
    parts[1] === "config" &&
    Number(parts[2]) === SIM_LAV_ID &&
    parts[3] === "tarifa"
  ) {
    const cycleSeconds = Number(data?.cycle_seconds ?? Number.NaN);
    const plusSeconds = Number(data?.plus_seconds_per_euro ?? Number.NaN);
    const startMinCredit = Number(data?.start_min_credit ?? Number.NaN);
    if (Number.isFinite(cycleSeconds) && cycleSeconds > 0) {
      tarifaActual.cycle_seconds = Math.floor(cycleSeconds);
    }
    if (Number.isFinite(plusSeconds) && plusSeconds > 0) {
      tarifaActual.plus_seconds_per_euro = Math.floor(plusSeconds);
    }
    if (Number.isFinite(startMinCredit) && startMinCredit > 0) {
      tarifaActual.start_min_credit = Number(startMinCredit.toFixed(2));
    }
    lastUpdate = localIso();
    broadcastSnapshot();
    return;
  }
  if (
    parts[0] === "kwl" &&
    parts[1] === "maquinas" &&
    Number(parts[2]) === SIM_LAV_ID &&
    parts[4] === "estado"
  ) {
    const code = String(parts[3] || "").toUpperCase();
    if (!SIM_MACHINE_CODES.includes(code)) return;
    machineState[code] = String(data?.estado || "STOP").toUpperCase();
    const secs = Number(data?.segundos_restantes_estimados ?? Number.NaN);
    if (Number.isFinite(secs) && secs >= 0)
      machineTimer[code] = Math.floor(secs);
    if (machineState[code] === "STOP") machineTimer[code] = 0;
    lastUpdate = localIso();
    broadcastSnapshot();
    return;
  }
  if (
    parts[0] === "kwl" &&
    parts[1] === "maquinas" &&
    Number(parts[2]) === SIM_LAV_ID &&
    parts[4] === "evento"
  ) {
    const code = String(parts[3] || "").toUpperCase();
    if (!SIM_MACHINE_CODES.includes(code)) return;
    const tipo = String(data?.tipo_evento || "").toUpperCase();
    if (tipo === "VENTILADOR_ON") fanState[code] = true;
    if (tipo === "VENTILADOR_OFF") fanState[code] = false;
    if (tipo === "SECADORA_PUERTA_ABIERTA") dryerDoorState[code] = true;
    if (tipo === "SECADORA_PUERTA_CERRADA") dryerDoorState[code] = false;
    if (tipo === "CREDITO_ACUMULADO") {
      const saldo = Number(data?.payload?.saldo ?? Number.NaN);
      if (Number.isFinite(saldo) && saldo >= 0)
        machineCredit[code] = Number(saldo.toFixed(2));
    }
    if (tipo === "CREDITO_ACUMULADO_AMPLIACION") {
      const saldo = Number(data?.payload?.saldo ?? Number.NaN);
      if (Number.isFinite(saldo) && saldo >= 0)
        machineCredit[code] = Number(saldo.toFixed(2));
    }
    if (tipo === "CICLO_INICIADO") machineCredit[code] = 0;
    if (tipo === "AMPLIACION_APLICADA") {
      const extraMin = Number(data?.payload?.minutos ?? 0);
      if (Number.isFinite(extraMin) && extraMin > 0)
        machineTimer[code] = Math.max(
          0,
          Number(machineTimer[code] || 0) + Math.floor(extraMin * 60),
        );
    }
    if (tipo === "CICLO_FINALIZADO") machineTimer[code] = 0;
    if (tipo === "CREDITO_RECHAZADO_APAGADA") {
      // no cambia saldo ni estado, solo feedback por evento
    }
    lastUpdate = localIso();
    broadcastSnapshot();
    return;
  }
  if (
    parts[0] === "kwl" &&
    parts[1] === "iot" &&
    Number(parts[2]) === SIM_LAV_ID &&
    parts[3] === "estado"
  ) {
    iotState.puerta_abierta = Boolean(data?.puerta_abierta);
    iotState.luces_encendidas = Boolean(data?.luces_encendidas);
    iotState.ventilacion_encendida = Boolean(data?.ventilacion_encendida);
    lastUpdate = localIso();
    broadcastSnapshot();
  }
});

const nowIso = () => localIso();

setInterval(() => {
  for (const c of SIM_MACHINE_CODES) {
    if (String(machineState[c] || "").toUpperCase() === "EN_MARCHA") {
      machineTimer[c] = Math.max(0, Number(machineTimer[c] || 0) - 1);
    }
  }
}, 1000);

function publish(topic, payload) {
  if (!mqttConnected) return false;
  mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 });
  return true;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mqtt: { connected: mqttConnected, url: MQTT_URL },
    machine_codes: SIM_MACHINE_CODES,
    lav_id: SIM_LAV_ID,
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    ok: true,
    machine_codes: SIM_MACHINE_CODES,
    lav_id: SIM_LAV_ID,
    cycle_seconds: tarifaActual.cycle_seconds,
    plus_seconds_per_euro: tarifaActual.plus_seconds_per_euro,
    start_min_credit: tarifaActual.start_min_credit,
  });
});

app.get("/api/state", (_req, res) => {
  res.json(buildSnapshot());
});

app.post("/api/machine/credit", (req, res) => {
  const codigo = String(req.body?.codigo ?? "")
    .trim()
    .toUpperCase();
  const importe = Number(req.body?.importe ?? 0);
  if (!SIM_MACHINE_CODES.includes(codigo))
    return res.status(400).json({ ok: false, error: "BAD_CODIGO" });
  if (!Number.isFinite(importe) || importe <= 0)
    return res.status(400).json({ ok: false, error: "BAD_IMPORTE" });
  const estado = String(machineState[codigo] || "STOP").toUpperCase();
  if (estado === "STOP")
    return res
      .status(409)
      .json({ ok: false, error: "MACHINE_STOPPED_NEEDS_PAUSED" });
  const ok = publish(`kwl/maquinas/${SIM_LAV_ID}/${codigo}/comando`, {
    accion: "insertar_credito",
    importe,
    timestamp: nowIso(),
    origen: "sim_gui",
  });
  if (!ok)
    return res.status(503).json({ ok: false, error: "MQTT_NOT_CONNECTED" });
  return res.json({ ok: true });
});

app.post("/api/machine/confirm-start", (req, res) => {
  const codigo = String(req.body?.codigo ?? "")
    .trim()
    .toUpperCase();
  if (!SIM_MACHINE_CODES.includes(codigo))
    return res.status(400).json({ ok: false, error: "BAD_CODIGO" });
  const ok = publish(`kwl/maquinas/${SIM_LAV_ID}/${codigo}/comando`, {
    accion: "confirmar_inicio",
    timestamp: nowIso(),
    origen: "sim_gui",
  });
  if (!ok)
    return res.status(503).json({ ok: false, error: "MQTT_NOT_CONNECTED" });
  return res.json({ ok: true });
});

app.post("/api/machine/toggle-dryer-door", (req, res) => {
  const codigo = String(req.body?.codigo ?? "")
    .trim()
    .toUpperCase();
  if (!SIM_MACHINE_CODES.includes(codigo))
    return res.status(400).json({ ok: false, error: "BAD_CODIGO" });
  const ok = publish(`kwl/maquinas/${SIM_LAV_ID}/${codigo}/comando`, {
    accion: "toggle_puerta_maquina",
    timestamp: nowIso(),
    origen: "sim_gui",
  });
  if (!ok)
    return res.status(503).json({ ok: false, error: "MQTT_NOT_CONNECTED" });
  return res.json({ ok: true });
});

app.post("/api/iot/toggle", (req, res) => {
  const dispositivo = String(req.body?.dispositivo ?? "").toLowerCase();
  if (!["puerta", "luces"].includes(dispositivo))
    return res.status(400).json({ ok: false, error: "BAD_DISPOSITIVO" });
  const ok = publish(`kwl/iot/${SIM_LAV_ID}/comando`, {
    dispositivo,
    accion: "toggle",
    ts: nowIso(),
    origen: "sim_gui",
  });
  if (!ok)
    return res.status(503).json({ ok: false, error: "MQTT_NOT_CONNECTED" });
  return res.json({ ok: true });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  wsClients.add(ws);
  try {
    ws.send(JSON.stringify(buildSnapshot()));
  } catch {}
  ws.on("close", () => wsClients.delete(ws));
  ws.on("error", () => wsClients.delete(ws));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`sim-gui listening on http://0.0.0.0:${PORT}`);
});
