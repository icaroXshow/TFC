import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || "mqtt://mqtt:1883";
const CYCLE_SECONDS = Number(process.env.SIM_CYCLE_SECONDS || "120");
const PLUS_SECONDS_PER_EURO = Number(process.env.SIM_PLUS_SECONDS_PER_EURO || "30");

const client = mqtt.connect(MQTT_URL, {
  reconnectPeriod: 3000,
  connectTimeout: 5000,
});

const stateByCode = new Map();

function nowIso() {
  return new Date().toISOString();
}

function ensureMachine(codigo) {
  if (!stateByCode.has(codigo)) {
    stateByCode.set(codigo, {
      estado: "STOP",
      idCiclo: null,
      timer: null,
      relayOn: false,
      endAtMs: 0,
    });
  }
  return stateByCode.get(codigo);
}

function publishEstado(codigo, estado) {
  client.publish(
    `kwl/maquinas/${codigo}/estado`,
    JSON.stringify({ estado, timestamp: nowIso() }),
  );
}

function publishEvento(codigo, tipoEvento, payload = {}) {
  const st = ensureMachine(codigo);
  client.publish(
    `kwl/maquinas/${codigo}/evento`,
    JSON.stringify({
      id_ciclo: st.idCiclo,
      tipo_evento: tipoEvento,
      nivel: "INFO",
      payload,
      timestamp: nowIso(),
    }),
  );
}

function stopTimer(st) {
  if (!st.timer) return;
  clearTimeout(st.timer);
  st.timer = null;
}

function startCycle(codigo, cmd) {
  const st = ensureMachine(codigo);
  stopTimer(st);

  st.estado = "EN_MARCHA";
  st.idCiclo = Number(cmd.id_ciclo) || null;
  st.endAtMs = Date.now() + CYCLE_SECONDS * 1000;

  publishEstado(codigo, "EN_MARCHA");
  publishEvento(codigo, "PULSO_INICIO", { origen: "simulador" });
  publishEvento(codigo, "CICLO_INICIADO", { origen: "simulador" });

  st.timer = setTimeout(() => {
    st.estado = "STOP";
    publishEstado(codigo, "STOP");
    publishEvento(codigo, "PULSO_FIN", { origen: "simulador" });
    publishEvento(codigo, "CICLO_FINALIZADO", { origen: "simulador" });
    st.timer = null;
    st.endAtMs = 0;
  }, CYCLE_SECONDS * 1000);
}

function stopCycle(codigo) {
  const st = ensureMachine(codigo);
  stopTimer(st);
  st.estado = "STOP";
  st.relayOn = false;
  st.endAtMs = 0;
  publishEstado(codigo, "STOP");
  publishEvento(codigo, "CICLO_FINALIZADO", { origen: "simulador", motivo: "stop_manual" });
}

function extendCycle(codigo, cmd) {
  const st = ensureMachine(codigo);
  if (st.estado !== "EN_MARCHA") return;
  const euros = Number(cmd.importe) || 0;
  const extraMs = Math.max(0, Math.floor(euros * PLUS_SECONDS_PER_EURO * 1000));
  if (st.endAtMs > Date.now()) st.endAtMs += extraMs;
  if (st.timer) {
    clearTimeout(st.timer);
    const leftMs = Math.max(1000, st.endAtMs - Date.now());
    st.timer = setTimeout(() => {
      st.estado = "STOP";
      publishEstado(codigo, "STOP");
      publishEvento(codigo, "PULSO_FIN", { origen: "simulador" });
      publishEvento(codigo, "CICLO_FINALIZADO", { origen: "simulador" });
      st.timer = null;
      st.endAtMs = 0;
    }, leftMs);
  }

  publishEvento(codigo, "AMPLIACION_APLICADA", {
    origen: "simulador",
    importe: Number(cmd.importe) || 0,
    minutos: Number(cmd.minutos_extra) || 0,
  });
}

function onCommand(topic, payloadBuf) {
  const parts = topic.split("/");
  if (parts.length !== 4 || parts[0] !== "kwl" || parts[1] !== "maquinas" || parts[3] !== "comando") return;

  let cmd;
  try {
    cmd = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    return;
  }

  const codigo = parts[2];
  const accion = String(cmd.accion || "");

  if (accion === "encender_rele") {
    const st = ensureMachine(codigo);
    st.relayOn = true;
    if (st.estado === "STOP") {
      st.estado = "PAUSADA";
      publishEstado(codigo, "PAUSADA");
    }
    return;
  }
  if (accion === "apagar_rele") return stopCycle(codigo);
  if (accion === "insertar_credito") {
    const st = ensureMachine(codigo);
    if (!st.relayOn) return;
    if (st.estado !== "EN_MARCHA") return startCycle(codigo, cmd);
    return extendCycle(codigo, cmd);
  }
  if (accion === "ampliar_tiempo") return extendCycle(codigo, cmd);
  if (accion === "reiniciar_maquina") {
    stopCycle(codigo);
    return startCycle(codigo, cmd);
  }
}

client.on("connect", () => {
  client.subscribe("kwl/maquinas/+/comando");
});

client.on("message", onCommand);
