import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || "mqtt://mqtt:1883";
const CYCLE_SECONDS_RAW = Number(process.env.SIM_CYCLE_SECONDS || "2400");
const PLUS_SECONDS_RAW = Number(process.env.SIM_PLUS_SECONDS_PER_EURO || "900");
const CYCLE_SECONDS = Number.isFinite(CYCLE_SECONDS_RAW) && CYCLE_SECONDS_RAW >= 600 ? CYCLE_SECONDS_RAW : 2400;
const PLUS_SECONDS_PER_EURO = Number.isFinite(PLUS_SECONDS_RAW) && PLUS_SECONDS_RAW >= 300 ? PLUS_SECONDS_RAW : 900;
const START_MIN_CREDIT = Number(process.env.SIM_START_MIN_CREDIT || "4");
const SIM_MACHINE_CODES = String(process.env.SIM_MACHINE_CODES || "L1,L2,L3,S1,S2")
  .split(",")
  .map((x) => x.trim().toUpperCase())
  .filter(Boolean);
const SIM_LAV_IDS = String(process.env.SIM_LAV_IDS || "3")
  .split(",")
  .map((x) => Number(x.trim()))
  .filter((x) => Number.isFinite(x) && x > 0);

const client = mqtt.connect(MQTT_URL, {
  reconnectPeriod: 3000,
  connectTimeout: 5000,
});

const stateByCode = new Map();
const iotByLav = new Map();

function nowIso() {
  return new Date().toISOString();
}

function ensureMachine(codigo) {
  if (!SIM_MACHINE_CODES.includes(String(codigo || "").toUpperCase())) return null;
  if (!stateByCode.has(codigo)) {
    stateByCode.set(codigo, {
      estado: "STOP",
      idCiclo: null,
      timer: null,
      relayOn: false,
      ventiladorOn: false,
      saldoCredito: 0,
      ampliacionAplicada: false,
      endAtMs: 0,
    });
  }
  return stateByCode.get(codigo);
}

function ensureIotLav(idLav) {
  if (!iotByLav.has(idLav)) {
    iotByLav.set(idLav, {
      puerta_abierta: false,
      luces_encendidas: false,
      ventilacion_encendida: false,
    });
  }
  return iotByLav.get(idLav);
}

function publishEstado(idLav, codigo, estado, extras = {}) {
  client.publish(
    `kwl/maquinas/${idLav}/${codigo}/estado`,
    JSON.stringify({ estado, timestamp: nowIso(), ...extras }),
  );
}

function publishEvento(idLav, codigo, tipoEvento, payload = {}) {
  const st = ensureMachine(codigo);
  if (!st) return;
  client.publish(
    `kwl/maquinas/${idLav}/${codigo}/evento`,
    JSON.stringify({
      id_ciclo: st.idCiclo,
      tipo_evento: tipoEvento,
      nivel: "INFO",
      payload,
      timestamp: nowIso(),
    }),
  );
}

function publishIotEstado(idLav) {
  const st = ensureIotLav(idLav);
  client.publish(
    `kwl/iot/${idLav}/estado`,
    JSON.stringify({
      ...st,
      origen: "simulador",
      timestamp: nowIso(),
    }),
  );
}

function applyIotCommand(idLav, cmd) {
  const st = ensureIotLav(idLav);
  const dispositivo = String(cmd?.dispositivo || "").toLowerCase();
  const accion = String(cmd?.accion || "toggle").toLowerCase();
  const apply = (key) => {
    if (accion === "on") st[key] = true;
    else if (accion === "off") st[key] = false;
    else st[key] = !st[key];
  };
  if (dispositivo === "puerta") apply("puerta_abierta");
  if (dispositivo === "luces") apply("luces_encendidas");
  if (dispositivo === "ventilacion") apply("ventilacion_encendida");
  publishIotEstado(idLav);
  client.publish(
    `kwl/iot/${idLav}/evento`,
    JSON.stringify({
      tipo_evento: "IOT_RELAY_APPLIED",
      nivel: "INFO",
      payload: { dispositivo, accion, origen: "simulador" },
      timestamp: nowIso(),
    }),
  );
}

function stopTimer(st) {
  if (!st.timer) return;
  clearTimeout(st.timer);
  st.timer = null;
}

function finishCycleToPaused(idLav, codigo, reason = "simulador") {
  const st = ensureMachine(codigo);
  if (!st) return;
  stopTimer(st);
  st.estado = "PAUSADA";
  st.relayOn = true;
  st.endAtMs = 0;
  publishEstado(idLav, codigo, "PAUSADA", { segundos_restantes_estimados: 0 });
  publishEvento(idLav, codigo, "CICLO_FINALIZADO", { origen: reason });
}

function startCycle(idLav, codigo, cmd) {
  const st = ensureMachine(codigo);
  if (!st) return;
  stopTimer(st);

  st.estado = "EN_MARCHA";
  st.idCiclo = Number(cmd.id_ciclo) || null;
  const creditoUsado = Number.isFinite(Number(cmd?.credito_total)) ? Number(cmd.credito_total) : START_MIN_CREDIT;
  const extraEuros = Math.max(0, creditoUsado - START_MIN_CREDIT);
  const extraMs = Math.floor(extraEuros * PLUS_SECONDS_PER_EURO * 1000);
  st.endAtMs = Date.now() + CYCLE_SECONDS * 1000 + Math.max(0, extraMs);
  st.saldoCredito = 0;
  st.ampliacionAplicada = false;

  publishEstado(idLav, codigo, "EN_MARCHA", { segundos_restantes_estimados: Math.floor((st.endAtMs - Date.now()) / 1000) });
  publishEvento(idLav, codigo, "PULSO_INICIO", { origen: "simulador" });
  publishEvento(idLav, codigo, "CICLO_INICIADO", { origen: "simulador", credito_total: creditoUsado, extra_euros: extraEuros });

  const leftMs = Math.max(1000, st.endAtMs - Date.now());
  st.timer = setTimeout(() => finishCycleToPaused(idLav, codigo, "simulador"), leftMs);
}

function stopCycle(idLav, codigo) {
  const st = ensureMachine(codigo);
  if (!st) return;
  stopTimer(st);
  st.estado = "STOP";
  st.relayOn = false;
  st.ventiladorOn = false;
  st.saldoCredito = 0;
  st.ampliacionAplicada = false;
  st.endAtMs = 0;
  publishEstado(idLav, codigo, "STOP", { segundos_restantes_estimados: 0 });
  publishEvento(idLav, codigo, "VENTILADOR_OFF", { origen: "simulador", motivo: "maquina_off" });
  publishEvento(idLav, codigo, "CICLO_FINALIZADO", { origen: "simulador", motivo: "stop_manual" });
}

function extendCycle(idLav, codigo, cmd) {
  const st = ensureMachine(codigo);
  if (!st) return;
  if (st.estado !== "EN_MARCHA") return;
  const euros = Number(cmd.importe) || 0;
  if (Math.abs(euros - 1) > 0.0001) {
    publishEvento(idLav, codigo, "AMPLIACION_RECHAZADA_IMPORTE", {
      origen: "simulador",
      importe: euros,
      esperado: 1,
    });
    return;
  }
  if (st.ampliacionAplicada) {
    publishEvento(idLav, codigo, "AMPLIACION_RECHAZADA_LIMITE", {
      origen: "simulador",
      importe: euros,
      limite: 1,
    });
    return;
  }
  const minutosExtra = Number(cmd.minutos_extra);
  const extraMs = Number.isFinite(minutosExtra) && minutosExtra > 0
    ? Math.floor(minutosExtra * 60 * 1000)
    : Math.max(0, Math.floor(euros * PLUS_SECONDS_PER_EURO * 1000));
  const minutosAplicados = Math.max(0, Math.round(extraMs / 60000));
  st.ampliacionAplicada = true;
  if (st.endAtMs > Date.now()) st.endAtMs += extraMs;
  if (st.timer) {
    clearTimeout(st.timer);
    const leftMs = Math.max(1000, st.endAtMs - Date.now());
    st.timer = setTimeout(() => finishCycleToPaused(idLav, codigo, "simulador"), leftMs);
  }

  publishEvento(idLav, codigo, "AMPLIACION_APLICADA", {
    origen: "simulador",
    importe: Number(cmd.importe) || 0,
    minutos: minutosAplicados,
  });
  publishEstado(idLav, codigo, "EN_MARCHA", { segundos_restantes_estimados: Math.max(0, Math.floor((st.endAtMs - Date.now()) / 1000)) });
}

function onCommand(topic, payloadBuf) {
  const parts = topic.split("/");

  let cmd;
  try {
    cmd = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    return;
  }

  if (parts.length === 4 && parts[0] === "kwl" && parts[1] === "iot" && parts[3] === "comando") {
    const idLav = Number(parts[2]);
    if (!Number.isFinite(idLav) || idLav <= 0) return;
    return applyIotCommand(idLav, cmd);
  }
  if (parts.length !== 5 || parts[0] !== "kwl" || parts[1] !== "maquinas" || parts[4] !== "comando") return;
  const idLav = Number(parts[2]);
  if (!Number.isFinite(idLav) || idLav <= 0) return;
  if (!SIM_LAV_IDS.includes(idLav)) return;
  const codigo = String(parts[3] || "").toUpperCase();
  if (!SIM_MACHINE_CODES.includes(codigo)) return;
  const accion = String(cmd.accion || "");

  if (accion === "encender_rele") {
    const st = ensureMachine(codigo);
    if (!st) return;
    st.relayOn = true;
    if (st.estado === "STOP") {
      st.estado = "PAUSADA";
      publishEstado(idLav, codigo, "PAUSADA", { segundos_restantes_estimados: 0 });
    }
    return;
  }
  if (accion === "apagar_rele") return stopCycle(idLav, codigo);
  if (accion === "ventilador_on") {
    const st = ensureMachine(codigo);
    if (!st) return;
    st.ventiladorOn = true;
    publishEvento(idLav, codigo, "VENTILADOR_ON", { origen: "simulador" });
    return;
  }
  if (accion === "ventilador_off") {
    const st = ensureMachine(codigo);
    if (!st) return;
    st.ventiladorOn = false;
    publishEvento(idLav, codigo, "VENTILADOR_OFF", { origen: "simulador" });
    return;
  }
  if (accion === "insertar_credito") {
    const st = ensureMachine(codigo);
    if (!st) return;
    const euros = Number(cmd.importe) || 0;
    if (euros <= 0) return;
    if (st.estado === "STOP") {
      publishEvento(idLav, codigo, "CREDITO_RECHAZADO_APAGADA", {
        origen: "simulador",
        importe: euros,
        saldo: st.saldoCredito,
      });
      return;
    }
    if (st.estado === "EN_MARCHA") return extendCycle(idLav, codigo, cmd);

    const saldoActual = Number(st.saldoCredito || 0);
    const maxAntesDeInicio = START_MIN_CREDIT;
    const restante = Number((maxAntesDeInicio - saldoActual).toFixed(2));
    if (restante <= 0) {
      publishEvento(idLav, codigo, "CREDITO_RECHAZADO_LIMITE_PREVIO", {
        origen: "simulador",
        saldo: saldoActual,
        maximo: maxAntesDeInicio,
      });
      return;
    }
    const aplicado = Math.min(euros, restante);
    st.saldoCredito = Number((saldoActual + aplicado).toFixed(2));
    publishEvento(idLav, codigo, "CREDITO_ACUMULADO", {
      origen: "simulador",
      importe: aplicado,
      saldo: st.saldoCredito,
      minimo_arranque: START_MIN_CREDIT,
    });
    if (aplicado < euros) {
      publishEvento(idLav, codigo, "CREDITO_RECHAZADO_EXCESO_PREVIO", {
        origen: "simulador",
        intentado: euros,
        aplicado,
        maximo: maxAntesDeInicio,
      });
    }
    return;
  }
  if (accion === "confirmar_inicio") {
    const st = ensureMachine(codigo);
    if (!st) return;
    if (st.estado !== "PAUSADA") return;
    if (Number(st.saldoCredito || 0) < START_MIN_CREDIT) {
      publishEvento(idLav, codigo, "CREDITO_INSUFICIENTE", {
        origen: "simulador",
        saldo: st.saldoCredito,
        minimo_arranque: START_MIN_CREDIT,
      });
      return;
    }
    return startCycle(idLav, codigo, { ...cmd, credito_total: st.saldoCredito });
  }
  if (accion === "ampliar_tiempo") return extendCycle(idLav, codigo, cmd);
  if (accion === "reiniciar_maquina") {
    stopCycle(idLav, codigo);
    return startCycle(idLav, codigo, cmd);
  }
}

client.on("connect", () => {
  client.subscribe("kwl/maquinas/+/+/comando");
  client.subscribe("kwl/iot/+/comando");
  for (const idLav of SIM_LAV_IDS) {
    for (const c of SIM_MACHINE_CODES) publishEstado(idLav, c, "STOP", { segundos_restantes_estimados: 0 });
  }
  for (const idLav of SIM_LAV_IDS) publishIotEstado(idLav);
});

setInterval(() => {
  for (const idLav of SIM_LAV_IDS) {
    for (const codigo of SIM_MACHINE_CODES) {
      const st = ensureMachine(codigo);
      if (!st || st.estado !== "EN_MARCHA") continue;
      const secs = Math.max(0, Math.floor((st.endAtMs - Date.now()) / 1000));
      publishEstado(idLav, codigo, "EN_MARCHA", { segundos_restantes_estimados: secs });
    }
  }
}, 1000);

client.on("message", onCommand);
