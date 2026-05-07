const seleccionar = (selector) => document.querySelector(selector);

const panelCuadricula = seleccionar("#panelGrid");
const indicadorMqtt = seleccionar("#indicadorMqtt");
const indicadorRedis = seleccionar("#indicadorRedis");
let estadoPuerta = null;
let estadoLuces = null;
const pistaSimulacion = seleccionar("#pistaSimulacion");
const ultimaLectura = seleccionar("#ultimaLectura");
const listaAlarmas = seleccionar("#listaAlarmas");
const botonLimpiarAlarmas = seleccionar("#limpiarAlarmas");
const contenedorTostadas = seleccionar("#contenedorTostadas");

let minimoCreditoArranque = 4;
let minutosCiclo = 37;
let minutosAmpliacion = 9;
let codigosMaquina = [];
let estadoAnterior = null;
let ultimaAlarmaId = 0;
let redisConectadoCache = false;
let streamActivo = false;
let wsActiva = false;

function horaActual() {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatearHoraLectura(iso) {
  if (!iso) return "--:--:--";
  const dt = new Date(String(iso));
  if (Number.isNaN(dt.getTime())) return "--:--:--";
  return dt.toLocaleTimeString("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function textoEstado(estado) {
  return String(estado || "STOP").toUpperCase();
}

function etiquetaEstado(estadoNormalizado) {
  if (estadoNormalizado === "STOP") return "APAGADO";
  if (estadoNormalizado === "PAUSADA") return "ENCENDIDA";
  if (estadoNormalizado === "EN_MARCHA") return "CICLO";
  return estadoNormalizado;
}

function tipoAlarma(clave) {
  if (["error", "mqtt-off", "stop"].includes(clave)) return "critica";
  if (["aviso", "pausada", "tiempo"].includes(clave)) return "aviso";
  return "info";
}

function agregarAlarma(mensaje, clave = "info", mostrarTostada = true) {
  const tipo = tipoAlarma(clave);
  const id = `alarma-${++ultimaAlarmaId}`;
  const item = document.createElement("li");
  item.className = `alarma alarma-${tipo}`;
  item.id = id;
  item.innerHTML = `<span class="alarma-hora">${horaActual()}</span><span class="alarma-texto"></span>`;
  item.querySelector(".alarma-texto").textContent = mensaje;

  const vacia = listaAlarmas.querySelector(".alarma-vacia");
  if (vacia) vacia.remove();
  listaAlarmas.prepend(item);

  while (listaAlarmas.children.length > 8) {
    listaAlarmas.lastElementChild.remove();
  }

  if (mostrarTostada) mostrarNotificacion(mensaje, tipo);
}

function mostrarNotificacion(mensaje, tipo = "info") {
  const aviso = document.createElement("div");
  aviso.className = `tostada tostada-${tipo}`;
  aviso.textContent = mensaje;
  contenedorTostadas.append(aviso);
  window.setTimeout(() => aviso.classList.add("tostada-visible"), 20);
  window.setTimeout(() => {
    aviso.classList.remove("tostada-visible");
    window.setTimeout(() => aviso.remove(), 250);
  }, 4200);
}

function limpiarAlarmas() {
  listaAlarmas.innerHTML =
    '<li class="alarma-vacia">Sin alarmas recientes.</li>';
}

function actualizarIndicador(
  el,
  activo,
  textoActivo = "ON",
  textoInactivo = "OFF",
) {
  if (!el) return;
  el.classList.toggle("estado-on", Boolean(activo));
  el.classList.toggle("estado-off", !activo);
  el.querySelector("span:last-child").textContent = activo
    ? textoActivo
    : textoInactivo;
}

function actualizarEstadoMaquina(codigo, estado) {
  const el = seleccionar(`[data-machine-state="${codigo}"]`);
  if (!el) return;
  const estadoNormalizado = textoEstado(estado);
  const enMarcha = estadoNormalizado === "EN_MARCHA";
  const pausada = estadoNormalizado === "PAUSADA";
  el.classList.toggle("estado-ciclo", enMarcha);
  el.classList.toggle("estado-encendida", pausada);
  el.classList.toggle("estado-apagado", !enMarcha && !pausada);
  el.querySelector("span:last-child").textContent =
    etiquetaEstado(estadoNormalizado);

  const btn = seleccionar(`[data-confirm="${codigo}"]`);
  if (btn) {
    const stop = estadoNormalizado === "STOP";
    btn.disabled = stop;
    btn.title = stop ? "Primero enciende relé de máquina (estado PAUSADA)" : "";
  }
}

async function api(path, body) {
  const respuesta = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!respuesta.ok) {
    let mensaje = "REQ_FAIL";
    try {
      const datos = await respuesta.json();
      mensaje = datos?.error || mensaje;
    } catch {}
    throw new Error(mensaje);
  }
}

function renderizarPanelesMaquina() {
  const tarjetasMaquina = codigosMaquina
    .map((codigo) => {
      const esSecadora = String(codigo).toUpperCase().startsWith("S");
      return `
        <article class="tarjeta tarjeta-maquina">
          <header class="maquina-cabecera">
            <p class="titulo-maquina">${codigo}</p>
            <span class="tipo-maquina">${esSecadora ? "Secadora" : "Lavadora"}</span>
          </header>
          <div class="bloque-dato">
            <span class="texto-suave">Estado</span>
            <div class="estado estado-apagado" data-machine-state="${codigo}">
              <span class="punto"></span><span>STOP</span>
            </div>
          </div>
          <div class="datos-maquina">
            <div><span>Temporizador</span><strong data-timer="${codigo}">00:00</strong></div>
            <div><span>Refrigerar</span><strong data-fan="${codigo}">OFF</strong></div>
            <div><span>Saldo sin aplicar</span><strong data-saldo="${codigo}">0.00 €</strong></div>
            <div><span>Puerta máquina</span><strong data-dryer-door="${codigo}">CERRADA</strong></div>
          </div>
          <div class="acciones-maquina">
            <label class="campo-credito">
              <span>Importe</span>
              <input type="number" min="0.1" step="0.1" value="1.0" data-credit="${codigo}" />
            </label>
            <button class="boton boton-principal" data-confirm="${codigo}" type="button">Insertar</button>
            <button class="boton boton-secundario" data-start="${codigo}" type="button">START</button>
            <button class="boton boton-secundario" data-toggle-door="${codigo}" data-machine-type="${esSecadora ? "SECADORA" : "LAVADORA"}" type="button">Puerta</button>
          </div>
          <footer class="ayuda-maquina">
            <span>Ciclo: ${minutosCiclo} min</span>
            <span>Ampliación: ${minutosAmpliacion} min/€</span>
            <span>Inicio mínimo: ${minimoCreditoArranque.toFixed(2)} €</span>
          </footer>
        </article>
      `;
    })
    .join("");

  const tarjetaInterruptores = `
    <article class="tarjeta tarjeta-maquina tarjeta-interruptores">
      <header class="maquina-cabecera">
        <p class="titulo-maquina">IOT</p>
        <span class="tipo-maquina">Interruptores</span>
      </header>
      <div class="datos-maquina">
        <div>
          <span>Puerta tienda</span>
          <strong id="doorState" class="estado estado-off"><span class="punto"></span><span>OFF</span></strong>
        </div>
        <div>
          <span>Luces tienda</span>
          <strong id="lightsState" class="estado estado-off"><span class="punto"></span><span>OFF</span></strong>
        </div>
      </div>
      <div class="acciones-maquina">
        <button id="doorToggle" class="boton boton-principal" type="button">Puerta</button>
        <button id="lightsToggle" class="boton boton-principal" type="button">Luces</button>
      </div>
      <footer class="ayuda-maquina">
        <span>Control general de tienda</span>
      </footer>
    </article>
  `;

  panelCuadricula.innerHTML = `${tarjetasMaquina}${tarjetaInterruptores}`;
  estadoPuerta = seleccionar("#doorState");
  estadoLuces = seleccionar("#lightsState");
}

async function cargarConfiguracion() {
  const respuesta = await fetch("/api/config");
  const datos = await respuesta.json();
  codigosMaquina = Array.isArray(datos?.machine_codes)
    ? datos.machine_codes
    : ["L1", "L2", "L3", "S1", "S2"];
  minimoCreditoArranque = Number(datos?.start_min_credit || 4);
  minutosCiclo = Math.max(
    1,
    Math.floor(Number(datos?.cycle_seconds || 2220) / 60),
  );
  minutosAmpliacion = Math.max(
    1,
    Math.floor(Number(datos?.plus_seconds_per_euro || 540) / 60),
  );
  renderizarPanelesMaquina();
}

function comprobarAlarmas(datos) {
  const actual = {
    mqtt: Boolean(datos?.mqtt_connected),
    maquinas: datos?.machines || {},
    credito: datos?.credit || {},
    temporizador: datos?.timer_sec || {},
    iot: datos?.iot || {},
  };

  if (!estadoAnterior) {
    estadoAnterior = actual;
    if (!actual.mqtt)
      agregarAlarma(
        "MQTT desconectado al iniciar el panel.",
        "mqtt-off",
        false,
      );
    return;
  }

  if (estadoAnterior.mqtt !== actual.mqtt) {
    agregarAlarma(
      actual.mqtt ? "MQTT conectado de nuevo." : "MQTT desconectado.",
      actual.mqtt ? "info" : "mqtt-off",
    );
  }

  codigosMaquina.forEach((codigo) => {
    const previo = textoEstado(estadoAnterior.maquinas[codigo]);
    const nuevo = textoEstado(actual.maquinas[codigo]);
    if (previo !== nuevo) {
      if (nuevo === "EN_MARCHA")
        agregarAlarma(`${codigo} ha iniciado ciclo.`, "info");
      else if (nuevo === "PAUSADA")
        agregarAlarma(`${codigo} está en pausa/lista.`, "pausada");
      else if (nuevo === "STOP")
        agregarAlarma(`${codigo} está apagada.`, "stop");
      else agregarAlarma(`${codigo} cambió a ${nuevo}.`, "info");
    }

    const creditoPrevio = Number(estadoAnterior.credito[codigo] || 0);
    const creditoNuevo = Number(actual.credito[codigo] || 0);
    if (
      creditoPrevio < minimoCreditoArranque &&
      creditoNuevo >= minimoCreditoArranque
    ) {
      agregarAlarma(`${codigo} tiene crédito suficiente para START.`, "info");
    }

    const tiempoPrevio = Number(estadoAnterior.temporizador[codigo] || 0);
    const tiempoNuevo = Number(actual.temporizador[codigo] || 0);
    if (tiempoPrevio > 60 && tiempoNuevo > 0 && tiempoNuevo <= 60) {
      agregarAlarma(`${codigo} termina en menos de 1 minuto.`, "tiempo");
    }
  });

  if (
    Boolean(estadoAnterior.iot.puerta_abierta) !==
    Boolean(actual.iot.puerta_abierta)
  ) {
    agregarAlarma(
      actual.iot.puerta_abierta
        ? "Puerta de tienda abierta."
        : "Puerta de tienda cerrada.",
      "aviso",
    );
  }
  if (
    Boolean(estadoAnterior.iot.luces_encendidas) !==
    Boolean(actual.iot.luces_encendidas)
  ) {
    agregarAlarma(
      actual.iot.luces_encendidas ? "Luces encendidas." : "Luces apagadas.",
      "info",
    );
  }

  estadoAnterior = actual;
}

async function refrescarEstado() {
  try {
    let redisConectado = false;
    try {
      const backendHealth = await fetch(
        `${window.location.protocol}//${window.location.hostname}:8080/health`,
      );
      if (backendHealth.ok) {
        const h = await backendHealth.json();
        redisConectado = Boolean(
          h?.redis?.ok ??
          h?.redis?.connected ??
          h?.cache?.redis?.ok ??
          h?.cache?.redis?.connected,
        );
      }
    } catch {}

    redisConectadoCache = redisConectado;
    const respuesta = await fetch("/api/state");
    const datos = await respuesta.json();
    aplicarEstado(datos, redisConectadoCache);
  } catch {
    indicadorMqtt.textContent = "MQTT: OFF";
    indicadorMqtt.classList.remove("estado-bueno");
    indicadorMqtt.classList.add("estado-malo");
    if (indicadorRedis) {
      indicadorRedis.textContent = "Redis: OFF";
      indicadorRedis.classList.remove("estado-bueno");
      indicadorRedis.classList.add("estado-malo");
    }
    agregarAlarma("No se pudo refrescar el estado del simulador.", "error");
  }
}

function aplicarEstado(datos, redisConectado = redisConectadoCache) {
  if (!estadoPuerta) estadoPuerta = seleccionar("#doorState");
  if (!estadoLuces) estadoLuces = seleccionar("#lightsState");
  const conectado = Boolean(datos?.mqtt_connected);
  indicadorMqtt.textContent = `MQTT: ${conectado ? "ON" : "OFF"}`;
  indicadorMqtt.classList.toggle("estado-bueno", conectado);
  indicadorMqtt.classList.toggle("estado-malo", !conectado);
  if (indicadorRedis) {
    indicadorRedis.textContent = `Redis: ${redisConectado ? "ON" : "OFF"}`;
    indicadorRedis.classList.toggle("estado-bueno", redisConectado);
    indicadorRedis.classList.toggle("estado-malo", !redisConectado);
  }
  ultimaLectura.textContent = formatearHoraLectura(datos?.last_update);

  const maquinas = datos?.machines || {};
  const ventiladores = datos?.fan || {};
  const estadoPuertaSecadora = datos?.dryer_door || {};
  const creditos = datos?.credit || {};
  const temporizadores = datos?.timer_sec || {};

  codigosMaquina.forEach((codigo) =>
    actualizarEstadoMaquina(codigo, maquinas[codigo] || "STOP"),
  );
  codigosMaquina.forEach((codigo) => {
    const fanEl = seleccionar(`[data-fan="${codigo}"]`);
    if (fanEl) fanEl.textContent = ventiladores[codigo] ? "VENTILANDO" : "NOAIR";
    const saldoEl = seleccionar(`[data-saldo="${codigo}"]`);
    if (saldoEl)
      saldoEl.textContent = `${Number(creditos[codigo] || 0).toFixed(2)} €`;
    const puertaSecadoraEl = seleccionar(`[data-dryer-door="${codigo}"]`);
    if (puertaSecadoraEl)
      puertaSecadoraEl.textContent = estadoPuertaSecadora[codigo]
        ? "ABIERTA"
        : "CERRADA";
    const puertaBtn = seleccionar(`[data-toggle-door="${codigo}"]`);
    if (puertaBtn) {
      const tipo = String(puertaBtn.getAttribute("data-machine-type") || "");
      const estado = textoEstado(maquinas[codigo]);
      const bloquear = tipo === "LAVADORA" && estado === "EN_MARCHA";
      puertaBtn.disabled = bloquear;
      puertaBtn.title = bloquear
        ? "En lavadoras no se puede Puerta en marcha"
        : "";
    }
    const startBtn = seleccionar(`[data-start="${codigo}"]`);
    if (startBtn) {
      const estado = textoEstado(maquinas[codigo]);
      const saldo = Number(creditos[codigo] || 0);
      startBtn.disabled = !(
        estado === "PAUSADA" && saldo >= minimoCreditoArranque
      );
    }
    const timerEl = seleccionar(`[data-timer="${codigo}"]`);
    if (timerEl) {
      const segundos = Math.max(0, Number(temporizadores[codigo] || 0));
      const minutos = Math.floor(segundos / 60);
      const restoSegundos = segundos % 60;
      timerEl.textContent = `${String(minutos).padStart(2, "0")}:${String(restoSegundos).padStart(2, "0")}`;
    }
  });
  actualizarIndicador(estadoPuerta, Boolean(datos?.iot?.puerta_abierta));
  actualizarIndicador(estadoLuces, Boolean(datos?.iot?.luces_encendidas));
  comprobarAlarmas(datos);
}

function iniciarStreamTiempoReal() {
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${wsProtocol}://${window.location.host}/ws`;
  try {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      wsActiva = true;
      streamActivo = true;
    };
    ws.onmessage = (ev) => {
      try {
        const datos = JSON.parse(ev.data);
        aplicarEstado(datos, redisConectadoCache);
      } catch {}
    };
    ws.onerror = () => {
      wsActiva = false;
      streamActivo = false;
    };
    ws.onclose = () => {
      wsActiva = false;
      streamActivo = false;
      window.setTimeout(iniciarStreamTiempoReal, 2000);
    };
  } catch {
    wsActiva = false;
    streamActivo = false;
  }
}

document.addEventListener("click", async (evento) => {
  const botonCredito = evento.target.closest("[data-confirm]");
  if (botonCredito) {
    const codigo = botonCredito.getAttribute("data-confirm");
    const input = seleccionar(`[data-credit="${codigo}"]`);
    const importe = Number(String(input?.value || "").replace(",", "."));
    if (!Number.isFinite(importe) || importe <= 0) {
      agregarAlarma(`Importe no válido para ${codigo}.`, "aviso");
      return;
    }
    botonCredito.disabled = true;
    try {
      await api("/api/machine/credit", { codigo, importe });
      pistaSimulacion.textContent = "";
      agregarAlarma(
        `Crédito enviado a ${codigo}: ${importe.toFixed(2)} €.`,
        "info",
      );
    } catch (err) {
      pistaSimulacion.textContent = `Error crédito (${codigo}): ${err.message}`;
      agregarAlarma(`Error crédito ${codigo}: ${err.message}`, "error");
    } finally {
      botonCredito.disabled = false;
    }
    return;
  }

  const botonStart = evento.target.closest("[data-start]");
  if (botonStart) {
    const codigo = botonStart.getAttribute("data-start");
    botonStart.disabled = true;
    try {
      await api("/api/machine/confirm-start", { codigo });
      pistaSimulacion.textContent = "";
      agregarAlarma(`START enviado a ${codigo}.`, "info");
    } catch (err) {
      pistaSimulacion.textContent = `Error inicio (${codigo}): ${err.message}`;
      agregarAlarma(`Error START ${codigo}: ${err.message}`, "error");
    } finally {
      botonStart.disabled = false;
    }
    return;
  }

  const botonPuertaSecadora = evento.target.closest("[data-toggle-door]");
  if (botonPuertaSecadora) {
    const codigo = botonPuertaSecadora.getAttribute("data-toggle-door");
    botonPuertaSecadora.disabled = true;
    try {
      await api("/api/machine/toggle-dryer-door", { codigo });
      pistaSimulacion.textContent = `Acción puerta enviada (${codigo}).`;
      agregarAlarma(`Puerta accionada en ${codigo}.`, "aviso");
    } catch (err) {
      pistaSimulacion.textContent = `Error puerta (${codigo}): ${err.message}`;
      agregarAlarma(`Error puerta ${codigo}: ${err.message}`, "error");
    } finally {
      botonPuertaSecadora.disabled = false;
    }
  }
});

document.addEventListener("click", (evento) => {
  const doorBtn = evento.target.closest("#doorToggle");
  if (doorBtn) {
    api("/api/iot/toggle", { dispositivo: "puerta" })
      .then(() => agregarAlarma("Comando enviado: interruptor puerta.", "info"))
      .catch((err) =>
        agregarAlarma(`Error interruptor puerta: ${err.message}`, "error"),
      );
    return;
  }
  const lightsBtn = evento.target.closest("#lightsToggle");
  if (lightsBtn) {
    api("/api/iot/toggle", { dispositivo: "luces" })
      .then(() => agregarAlarma("Comando enviado: interruptor luces.", "info"))
      .catch((err) =>
        agregarAlarma(`Error interruptor luces: ${err.message}`, "error"),
      );
  }
});

botonLimpiarAlarmas.addEventListener("click", limpiarAlarmas);

cargarConfiguracion()
  .then(refrescarEstado)
  .catch(() =>
    agregarAlarma("No se pudo cargar la configuración del simulador.", "error"),
  );

iniciarStreamTiempoReal();
setInterval(() => {
  if (!streamActivo) refrescarEstado();
}, 1200);
