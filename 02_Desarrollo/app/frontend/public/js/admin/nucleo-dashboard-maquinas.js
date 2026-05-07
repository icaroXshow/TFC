(() => {
  const STORAGE_KEY = "kwl_auth";
  const ACTIVE_LAV_KEY = "kwl_lavanderia_activa";
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080`;

  const $ = (s, c = document) => c.querySelector(s);
  let machineTimerInterval = null;
  let machinesPollInterval = null;
  let iotPollInterval = null;

  const cardBackend = $("#cardBackend");
  const healthLine = $("#healthLine");
  const serverClockEl = $("#serverClock");
  const cardCajaHoy = $("#cardCajaHoy");
  const storeOpenBtn = $("#storeOpenBtn");
  const storeCloseBtn = $("#storeCloseBtn");
  const storeConfigToggle = $("#storeConfigToggle");
  const storeConfigDialog = $("#storeConfigDialog");
  const storeConfigClose = $("#storeConfigClose");
  const storeConfigSave = $("#storeConfigSave");
  const storeEnvBtn = $("#storeEnvBtn");
  const storeEnvDialog = $("#storeEnvDialog");
  const storeEnvClose = $("#storeEnvClose");
  const storeEnvSave = $("#storeEnvSave");
  const envCameraBase = $("#envCameraBase");
  const envCameraUser = $("#envCameraUser");
  const envCameraPass = $("#envCameraPass");
  const envMqttUrl = $("#envMqttUrl");
  const envMqttUser = $("#envMqttUser");
  const envMqttPass = $("#envMqttPass");
  const envCamera2Base = $("#envCamera2Base");
  const envCamera2User = $("#envCamera2User");
  const envCamera2Pass = $("#envCamera2Pass");
  const envRedisEnabled = $("#envRedisEnabled");
  const envRedisHost = $("#envRedisHost");
  const envRedisPort = $("#envRedisPort");
  const envRedisPass = $("#envRedisPass");
  const envRedisDb = $("#envRedisDb");
  const envRedisTimeout = $("#envRedisTimeout");
  const envRedisPrefix = $("#envRedisPrefix");
  const envSettingsForm = $("#envSettingsForm");
  const envSettingsSave = $("#envSettingsSave");
  const envSettingsHint = $("#envSettingsHint");
  const storeOpenTime = $("#storeOpenTime");
  const storeCloseTime = $("#storeCloseTime");
  const storeOpenMachines = $("#storeOpenMachines");
  const storeCloseMachines = $("#storeCloseMachines");
  const openDoor = $("#openDoor");
  const openLights = $("#openLights");
  const closeDoor = $("#closeDoor");
  const closeLights = $("#closeLights");
  const machinesGrid = $("#machinesGrid");
  const logoutBtn = $("#adminLogout");
  const adminApp = $("#adminApp");
  const burgerBtn = $("#adminBurger");
  const breadcrumbsEl = $("#adminBreadcrumbs");
  const lavSelect = $("#adminLavSelect");
  const adminAddLavBtn = $("#adminAddLavBtn");
  const locationEl = $("#adminLocation");
  const camCenter = $("#camCenter");
  const camZoomIn = $("#camZoomIn");
  const camZoomOut = $("#camZoomOut");
  const camZoom1x = $("#camZoom1x");
  const camZoom2x = $("#camZoom2x");
  const camZoom4x = $("#camZoom4x");
  const camZoom8x = $("#camZoom8x");
  const camDisplayMode = $("#camDisplayMode");
  const camDisplayApply = $("#camDisplayApply");
  const camOpenMobotix = $("#camOpenMobotix");
  const camOpenAdmin = $("#camOpenAdmin");
  const camOpenEvents = $("#camOpenEvents");
  const camDetach = $("#camDetach");
  const cameraImg = $("#cameraStream");
  const cameraImg1 = $("#cameraStream1");
  const cameraImg2 = $("#cameraStream2");
  const cameraHint = $("#cameraHint");
  const quickDoorBtn = $("#quickDoorBtn");
  const quickLightsBtn = $("#quickLightsBtn");
  const quickDoorState = $("#quickDoorState");
  const quickLightsState = $("#quickLightsState");
  const usersTbody = $("#usersTbody");
  const usersSearch = $("#usersSearch");
  const userNewBtn = $("#userNewBtn");
  const usersNote = $("#usersNote");
  const userDialog = $("#userDialog");
  const userDialogTitle = $("#userDialogTitle");
  const userDialogClose = $("#userDialogClose");
  const userCancelBtn = $("#userCancelBtn");
  const userForm = $("#userForm");
  const userNombre = $("#userNombre");
  const userApellidos = $("#userApellidos");
  const userEmail = $("#userEmail");
  const userRol = $("#userRol");
  const userPassword = $("#userPassword");
  const userTempPassword = $("#userTempPassword");
  const iotHint = $("#iotHint");
  const iotSaveSchedule = $("#iotSaveSchedule");
  const iotLogTbody = $("#iotLogTbody");
  const doorToggle = $("#doorToggle");
  const lightsToggle = $("#lightsToggle");
  const doorScheduleEnabled = $("#doorScheduleEnabled");
  const lightsScheduleEnabled = $("#lightsScheduleEnabled");
  const fanOn = $("#fanOn");
  const fanOff = $("#fanOff");
  const doorState = $("#iotDoorState");
  const lightsState = $("#iotLightsState");
  const fanState = $("#iotFanState");
  const doorOn = $("#doorOn");
  const doorOff = $("#doorOff");
  const lightsOnTime = $("#lightsOnTime");
  const lightsOffTime = $("#lightsOffTime");
  const fanOnTime = $("#fanOnTime");
  const fanOffTime = $("#fanOffTime");
  const cashTbody = $("#cashTbody");
  const cashHint = $("#cashHint");
  const cashPeriod = $("#cashPeriod");
  const cashMoves = $("#cashMoves");
  const cashTotal = $("#cashTotal");
  const cashDay = $("#cashDay");
  const cashWeekDate = $("#cashWeekDate");
  const cashFrom = $("#cashFrom");
  const cashTo = $("#cashTo");
  const cashLoadDay = $("#cashLoadDay");
  const cashLoadWeek = $("#cashLoadWeek");
  const cashLoadRange = $("#cashLoadRange");
  const repTbody = $("#repTbody");
  const repFrom = $("#repFrom");
  const repTo = $("#repTo");
  const repMachineId = $("#repMachineId");
  const repEstado = $("#repEstado");
  const repLoad = $("#repLoad");
  const repPrev = $("#repPrev");
  const repNext = $("#repNext");
  const repHint = $("#repHint");
  const repTotal = $("#repTotal");
  const repPage = $("#repPage");
  const repRange = $("#repRange");
  const logsTbody = $("#logsTbody");
  const logsHint = $("#logsHint");
  const logsQuery = $("#logsQuery");
  const logsAction = $("#logsAction");
  const logsLoad = $("#logsLoad");
  const webEditorForm = $("#webEditorForm");
  const webEditorSave = $("#webEditorSave");
  const webPreviewPage = $("#webPreviewPage");
  const webPreviewReload = $("#webPreviewReload");
  const webPreviewFrame = $("#webPreviewFrame");

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }
  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function confirmNice(title, message, okLabel = "Confirmar", cancelLabel = "Cancelar") {
    return new Promise((resolve) => {
      const dlg = document.createElement("dialog");
      dlg.className = "modal";
      dlg.innerHTML = `
        <form method="dialog" class="modal-card" style="max-width:420px">
          <div class="modal-head">
            <strong>${title}</strong>
          </div>
          <div class="modal-body">
            <p style="margin:0;color:rgba(255,255,255,.9)">${message}</p>
          </div>
          <div class="modal-foot">
            <button type="button" class="boton-secundario js-cancel">${cancelLabel}</button>
            <button type="button" class="boton-primario js-ok">${okLabel}</button>
          </div>
        </form>
      `;
      document.body.appendChild(dlg);
      const close = (v) => {
        try {
          dlg.close();
        } catch {}
        dlg.remove();
        resolve(v);
      };
      dlg.querySelector(".js-cancel")?.addEventListener("click", () => close(false));
      dlg.querySelector(".js-ok")?.addEventListener("click", () => close(true));
      dlg.addEventListener("cancel", (e) => {
        e.preventDefault();
        close(false);
      });
      if (typeof dlg.showModal === "function") dlg.showModal();
      else close(false);
    });
  }

  function notifyNice(message, title = "Aviso") {
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.innerHTML = `
      <form method="dialog" class="modal-card" style="max-width:420px">
        <div class="modal-head">
          <strong>${title}</strong>
        </div>
        <div class="modal-body">
          <p style="margin:0;color:rgba(255,255,255,.9)">${message}</p>
        </div>
        <div class="modal-foot">
          <button type="button" class="boton-primario js-ok">Aceptar</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    const close = () => {
      try {
        dlg.close();
      } catch {}
      dlg.remove();
    };
    dlg.querySelector(".js-ok")?.addEventListener("click", close);
    dlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    if (typeof dlg.showModal === "function") dlg.showModal();
    else close();
  }

  function loadAuth() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function lockUI(locked) {
    document.body.classList.toggle("admin-locked", locked);
    if (adminApp) adminApp.setAttribute("aria-busy", locked ? "true" : "false");
  }

  function getActiveLavanderiaId() {
    const raw = localStorage.getItem(ACTIVE_LAV_KEY) || "1";
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : 1;
  }

  function setActiveLavanderiaId(id) {
    localStorage.setItem(ACTIVE_LAV_KEY, String(id));
  }

  function setActiveNav() {
    const path = location.pathname.toLowerCase();
    const navMap = [
      ["inicio", "/admin/inicio.html"],
      ["maquinas", "/admin/maquinas.html"],
      ["iot", "/admin/iot.html"],
      ["camara", "/admin/camara.html"],
      ["caja", "/admin/caja.html"],
      ["informes", "/admin/informes.html"],
      ["usuarios", "/admin/usuarios.html"],
      ["logs", "/admin/logs.html"],
      ["editor-web", "/admin/editor-web.html"],
    ];
    const current = navMap.find(([, url]) => path.endsWith(url));
    const key = current?.[0] ?? null;
    document.querySelectorAll(".item-navegacion-admin, .item-nav-admin").forEach((a) => {
      a.classList.toggle("is-active", key ? a.getAttribute("data-nav") === key : false);
    });
  }

  function applyRoleUI(rol) {
    const isAdmin = rol === "ADMIN";
    const isSuperAdmin = rol === "SUPERADMIN";
    const isOperador = rol === "OPERADOR";

    const navVisibilidad = {
      inicio: isAdmin || isSuperAdmin || isOperador,
      maquinas: isAdmin || isSuperAdmin || isOperador,
      iot: isAdmin || isSuperAdmin || isOperador,
      camara: isAdmin || isSuperAdmin || isOperador,
      caja: isAdmin || isSuperAdmin,
      informes: isAdmin || isSuperAdmin,
      usuarios: isAdmin || isSuperAdmin,
      logs: isAdmin || isSuperAdmin || isOperador,
      "editor-web": isAdmin || isSuperAdmin,
      ajustes: isAdmin || isSuperAdmin,
    };

    Object.entries(navVisibilidad).forEach(([key, visible]) => {
      document.querySelectorAll(`[data-nav="${key}"]`).forEach((el) => {
        el.style.display = visible ? "" : "none";
      });
    });

    if (storeEnvBtn) storeEnvBtn.style.display = isAdmin || isSuperAdmin ? "" : "none";

    const rutaActual = location.pathname.toLowerCase();
    const rutasPermitidasOperador = new Set([
      "/admin/inicio.html",
      "/admin/maquinas.html",
      "/admin/iot.html",
      "/admin/camara.html",
      "/admin/logs.html",
    ]);
    if (isOperador && !rutasPermitidasOperador.has(rutaActual)) {
      window.location.href = "/admin/maquinas.html";
      return;
    }

    // Si rol desconocido o sin permisos en admin, lo devolvemos al inicio público.
    if (!isAdmin && !isSuperAdmin && !isOperador) {
      window.location.href = "/index.html";
    }
  }

  function ensureEditorWebNavLink() {
    const nav = document.querySelector(".navegacion-admin, .navegacion-admin");
    if (!nav) return;
    if (nav.querySelector('[data-nav="editor-web"]')) return;
    const a = document.createElement("a");
    a.className = "item-navegacion-admin";
    a.setAttribute("data-nav", "editor-web");
    a.setAttribute("href", "/admin/editor-web.html");
    a.textContent = "Editor Web";
    const logs = nav.querySelector('[data-nav="logs"]');
    if (logs?.parentElement === nav) {
      logs.insertAdjacentElement("afterend", a);
      return;
    }
    nav.appendChild(a);
  }

  function setBreadcrumbs() {
    if (!breadcrumbsEl) return;
    const raw = document.body.getAttribute("data-breadcrumb") || "";
    const parts = raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    const items = ["Inicio", ...parts];
    breadcrumbsEl.textContent = "";
    items.forEach((label, idx) => {
      const span = document.createElement("span");
      span.textContent = label;
      breadcrumbsEl.appendChild(span);
      if (idx !== items.length - 1) {
        const sep = document.createElement("span");
        sep.textContent = "›";
        breadcrumbsEl.appendChild(sep);
      }
    });
  }

  async function fetchLavanderias(token) {
    const res = await fetch(`${API_BASE}/api/lavanderias`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("LAVANDERIAS_FAILED");
    return res.json();
  }

  function formatUbicacion(lav) {
    const parts = [lav.direccion, lav.ciudad, lav.provincia].filter(Boolean);
    return parts.join(", ") || lav.nombre || "—";
  }

  function setLavUI(lavanderias, activeId) {
    if (!lavSelect || !locationEl) return;

    lavSelect.innerHTML = "";
    lavanderias.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = String(l.id_lavanderia);
      opt.textContent = formatUbicacion(l);
      if (l.id_lavanderia === activeId) opt.selected = true;
      lavSelect.appendChild(opt);
    });

    const active = lavanderias.find((l) => l.id_lavanderia === activeId) || lavanderias[0];
    if (active) {
      setActiveLavanderiaId(active.id_lavanderia);
      locationEl.textContent = formatUbicacion(active);
    } else {
      locationEl.textContent = "—";
    }

    const unaSolaTienda = lavanderias.length <= 1;
    lavSelect.hidden = unaSolaTienda;
    // Si solo hay una tienda asignada, mostramos su ubicación en texto fijo.
    locationEl.style.display = unaSolaTienda ? "inline" : "";
  }

  function isSimulatorLav(lav) {
    const code = String(lav?.codigo || "").toUpperCase();
    const name = String(lav?.nombre || "").toUpperCase();
    return code === "SIM-01" || name.includes("SIMULADOR");
  }

  function shouldPreferSimulatorLav() {
    const path = location.pathname.toLowerCase();
    return (
      path.endsWith("/admin/maquinas.html") ||
      path.endsWith("/admin/iot.html") ||
      path.endsWith("/admin/camara.html") ||
      path.endsWith("/admin/inicio.html")
    );
  }

  function hasStoredActiveLavanderiaId() {
    const raw = localStorage.getItem(ACTIVE_LAV_KEY);
    if (!raw) return false;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0;
  }

  function stateClass(estado) {
    if (estado === "STOP") return "state-stop";
    if (estado === "PAUSADA") return "state-on";
    if (estado === "EN_MARCHA") return "state-cycle";
    if (estado === "MANTENIMIENTO") return "state-maint";
    if (estado === "FUERA_SERVICIO") return "state-maint";
    return "state-stop";
  }

  function estadoLabel(estado) {
    if (estado === "STOP") return "APAGADO";
    if (estado === "PAUSADA") return "ENCENDIDA";
    if (estado === "EN_MARCHA") return "CICLO";
    return estado;
  }

  function refrigerarLabel(enabled) {
    return enabled ? "VENTILANDO" : "NOAIR";
  }

  function tipoLabel(tipo) {
    if (tipo === "LAVADORA") return "Lavadora";
    if (tipo === "SECADORA") return "Secadora";
    return tipo || "Máquina";
  }

  function renderMaquinas(maquinas, puertaAbierta = false) {
    if (!machinesGrid) return;
    const isInicioView = location.pathname.toLowerCase().endsWith("/admin/inicio.html");
    machinesGrid.innerHTML = "";
    if (!maquinas?.length) {
      machinesGrid.innerHTML = `<div class="vacio-admin">Sin máquinas</div>`;
      return;
    }

    maquinas.forEach((m) => {
      const el = document.createElement("article");
      el.className = "tarjeta-maquina";
      if (isInicioView) el.classList.add("tarjeta-maquina-inicio");
      const estado = String(m.estado_actual || "STOP");
      const id = Number(m.id_maquina);
      const canStart = estado === "STOP";
      const canStop = estado === "EN_MARCHA" || estado === "PAUSADA";
      const canCredit = estado === "PAUSADA";
      const canExtend =
        estado === "EN_MARCHA" &&
        String(m.tipo_maquina || "").toUpperCase() === "SECADORA" &&
        Boolean(Number(m.ampliacion_disponible ?? 1));
      const restMin = Number(m.minutos_restantes_estimados ?? 0);
      const fanEnabled = Boolean(m.ventilador_auto);
      const restSecFromApi = Number(m.segundos_restantes_estimados ?? NaN);
      const startAt = m.fecha_hora_inicio ? new Date(m.fecha_hora_inicio).getTime() : NaN;
      const durationSec = Number(m.duracion_total_programada_min ?? 0) * 60;
      const nowMs = Date.now();
      const restSecByDates =
        Number.isFinite(startAt) && durationSec > 0
          ? Math.max(0, Math.floor((startAt + durationSec * 1000 - nowMs) / 1000))
          : 0;
      const restSec = Number.isFinite(restSecFromApi) ? Math.max(0, Math.floor(restSecFromApi)) : restSecByDates;
      const mm = Math.floor(restSec / 60);
      const ss = restSec % 60;
      const timerLabel = restSec > 0 ? `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : (restMin > 0 ? `~${restMin} min` : "—");
      const creditoVisible = Number(
        m.credito_actual ?? m.credito_pendiente ?? m.saldo_credito ?? 0,
      );
      const isDryer = String(m.tipo_maquina || "").toUpperCase() === "SECADORA";
      const puertaEstado = String(m.puerta_estado || "CERRADA").toUpperCase();
      const puertaClass =
        puertaEstado === "ABIERTA"
          ? "state-running"
          : puertaEstado === "APERTURA_PENDIENTE"
            ? "state-maint"
            : "state-stop";
      const rightStatusBlock = `
        <div class="resumen-derecha-maquina">
          <span
            class="temporizador-maquina"
            data-codigo="${m.codigo_visible || ""}"
            data-estado="${estado}"
            data-start="${m.fecha_hora_inicio || ""}"
            data-duration-min="${Number(m.duracion_total_programada_min ?? 0)}"
            data-rest-sec="${restSec}"
          >${timerLabel}</span>
          <div class="meta-credito-maquina">${creditoVisible.toFixed(2)} €</div>
        </div>
      `;

      const actionsInicio = `
        <div class="acciones-maquina acciones-maquina-inicio">
          ${canExtend ? `<button type="button" class="boton-secundario js-extend" data-id="${id}">Ampliar</button>` : ""}
          <button
            type="button"
            class="boton-secundario js-fan-auto-btn"
            data-id="${id}"
            data-enabled="${fanEnabled ? "1" : "0"}"
          >Refrigerar</button>
        </div>
      `;

      el.innerHTML = `
        <div class="meta-maquina">
          <strong>${m.codigo_visible}</strong>
          <span>${tipoLabel(m.tipo_maquina)}</span>
        </div>
        <div class="estado-maquina">
          <div class="izquierda-estado-maquina">
            <span class="state-pill ${stateClass(estado)}">${estadoLabel(estado)}</span>
            <span class="state-pill ${fanEnabled ? "state-cycle" : "state-noair"}">${refrigerarLabel(fanEnabled)}</span>
            <span class="state-pill ${puertaClass}">PUERTA ${puertaEstado}</span>
          </div>
          ${rightStatusBlock}
        </div>
        ${isInicioView ? actionsInicio : `<div class="acciones-maquina">
          <button type="button" class="boton-primario js-start" data-id="${id}" ${canStart ? "" : "disabled"}>Encender</button>
          <button type="button" class="boton-secundario js-stop" data-id="${id}" ${canStop ? "" : "disabled"}>Apagar</button>
          ${canCredit ? `<button type="button" class="boton-secundario js-credit" data-id="${id}">Crédito</button>` : ""}
          ${canExtend ? `<button type="button" class="boton-secundario js-extend" data-id="${id}">Ampliar</button>` : ""}
        </div>
        <button
          type="button"
          class="boton-secundario toggle-ventilador-maquina js-fan-auto-btn"
          data-id="${id}"
          data-enabled="${fanEnabled ? "1" : "0"}"
        >Refrigerar</button>
        <div class="cajon-maquina" data-id="${id}">
          <p class="titulo-cajon-maquina">Importe</p>
          <div class="fila-cajon-maquina">
            <input type="number" min="0.10" step="0.10" class="entrada entrada-cajon-maquina" value="1.00" />
            <button type="button" class="boton-primario js-amount-apply" data-id="${id}" data-mode="">Aplicar</button>
            <button type="button" class="boton-secundario js-amount-cancel" data-id="${id}">Cancelar</button>
          </div>
        </div>`}
      `;
      machinesGrid.appendChild(el);
    });
    startMachineTimerTick();
  }

  function startMachineTimerTick() {
    if (machineTimerInterval) {
      clearInterval(machineTimerInterval);
      machineTimerInterval = null;
    }
    const update = () => {
      const timers = document.querySelectorAll(".temporizador-maquina");
      let nextMinSec = Number.POSITIVE_INFINITY;
      let nextCode = "";
      timers.forEach((el) => {
        const estado = String(el.getAttribute("data-estado") || "").toUpperCase();
        const startRaw = el.getAttribute("data-start") || "";
        const durationMin = Number(el.getAttribute("data-duration-min") || 0);
        const restSecAttr = Number(el.getAttribute("data-rest-sec") || 0);
        let secondsLeft = Math.max(0, Math.floor(restSecAttr));
        const debeCongelar = estado === "PAUSADA" || estado === "STOP";
        if (!debeCongelar && startRaw && durationMin > 0) {
          const startMs = new Date(startRaw).getTime();
          if (Number.isFinite(startMs)) {
            const endMs = startMs + durationMin * 60 * 1000;
            secondsLeft = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
          }
        }
        el.setAttribute("data-rest-sec", String(secondsLeft));
        if (secondsLeft > 0 && secondsLeft < nextMinSec) {
          nextMinSec = secondsLeft;
          nextCode = el.getAttribute("data-codigo") || "";
        }
        if (secondsLeft <= 0) {
          el.textContent = "00:00";
          return;
        }
        const mm = Math.floor(secondsLeft / 60);
        const ss = secondsLeft % 60;
        el.textContent = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
      });
      const nextFinishEl = document.querySelector("#cardNextFinish");
      if (nextFinishEl) {
        if (!Number.isFinite(nextMinSec) || nextMinSec === Number.POSITIVE_INFINITY) {
          nextFinishEl.textContent = "—";
        } else {
          const mm = Math.floor(nextMinSec / 60);
          const ss = nextMinSec % 60;
          nextFinishEl.textContent = `${nextCode || "—"} · ${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
        }
      }
    };
    update();
    machineTimerInterval = window.setInterval(update, 1000);
  }

  function applyLiveSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    const maquinas = Array.isArray(snapshot.maquinas) ? snapshot.maquinas : [];
    const iot = snapshot.iot || {};

    if (machinesGrid && maquinas.length) {
      renderMaquinas(maquinas, Boolean(iot.puerta_abierta));
    }

    if (doorState) {
      doorState.className = `estado-iot ${iot.puerta_abierta ? "on" : "off"}`;
      doorState.textContent = iot.puerta_abierta ? "ON" : "OFF";
    }
    if (quickDoorState) {
      quickDoorState.classList.toggle("estado-iot-encendido", Boolean(iot.puerta_abierta));
      quickDoorState.classList.toggle("estado-iot-apagado", !Boolean(iot.puerta_abierta));
      quickDoorState.textContent = iot.puerta_abierta ? "ON" : "OFF";
    }
    if (lightsState) {
      lightsState.className = `estado-iot ${iot.luces_encendidas ? "on" : "off"}`;
      lightsState.textContent = iot.luces_encendidas ? "ON" : "OFF";
    }
    if (quickLightsState) {
      quickLightsState.classList.toggle("estado-iot-encendido", Boolean(iot.luces_encendidas));
      quickLightsState.classList.toggle("estado-iot-apagado", !Boolean(iot.luces_encendidas));
      quickLightsState.textContent = iot.luces_encendidas ? "ON" : "OFF";
    }
    if (fanState && "ventilacion_encendida" in iot) {
      fanState.className = `estado-iot ${iot.ventilacion_encendida ? "on" : "off"}`;
      fanState.textContent = iot.ventilacion_encendida ? "ON" : "OFF";
    }

    if (document.querySelector("#cardActivas")) {
      const activas = maquinas.filter((m) => String(m?.estado_actual || "").toUpperCase() === "EN_MARCHA").length;
      const cardActivas = document.querySelector("#cardActivas");
      if (cardActivas) cardActivas.textContent = String(activas);
    }
  }

  function connectAdminLiveWs(activeLavId) {
    const path = location.pathname.toLowerCase();
    const enabled =
      path.endsWith("/admin/inicio.html") ||
      path.endsWith("/admin/maquinas.html") ||
      path.endsWith("/admin/iot.html");
    if (!enabled) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsBase =
      window.location.port === "8081"
        ? `${proto}://${window.location.hostname}:8080`
        : `${proto}://${window.location.host}`;
    const wsUrl = `${wsBase}/ws/admin-live?lav=${encodeURIComponent(String(activeLavId))}`;
    let ws = null;
    let reconnectTimer = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl, [`auth.${String(token || "")}`]);
      } catch {
        return;
      }
      ws.onopen = () => {
        if (machinesPollInterval) {
          clearInterval(machinesPollInterval);
          machinesPollInterval = null;
        }
        if (iotPollInterval) {
          clearInterval(iotPollInterval);
          iotPollInterval = null;
        }
      };
      ws.onmessage = (ev) => {
        try {
          const snapshot = JSON.parse(ev.data);
          applyLiveSnapshot(snapshot);
        } catch {}
      };
      ws.onclose = () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };
    };
    connect();
  }

  async function init() {
    const existing = loadAuth();
    const token = existing?.token;
    const rol = existing?.user?.rol ?? "OPERADOR";
    const esSuperadmin = Boolean(existing?.user?.es_superadmin) || rol === "SUPERADMIN";

    if (!token) {
      // Un solo login: se hace desde el modal público.
      window.location.href = "/index.html#login";
      return;
    }

    lockUI(false);
    ensureEditorWebNavLink();
    setActiveNav();
    setBreadcrumbs();
    applyRoleUI(rol);
    if (adminAddLavBtn) adminAddLavBtn.hidden = !esSuperadmin;

    let activeLavId = getActiveLavanderiaId();
    let activeLavInfo = null;
    try {
      const l = await fetchLavanderias(token);
      const list = l?.lavanderias || [];
      if (list.length) {
        if (shouldPreferSimulatorLav() && !hasStoredActiveLavanderiaId()) {
          const lavSimulador = list.find(isSimulatorLav);
          if (lavSimulador) activeLavId = lavSimulador.id_lavanderia;
        }
        // Si el active no está permitido, cae al primero.
        if (!list.some((x) => x.id_lavanderia === activeLavId)) activeLavId = list[0].id_lavanderia;
        setLavUI(list, activeLavId);
        activeLavInfo = list.find((x) => x.id_lavanderia === activeLavId) || list[0] || null;

        lavSelect?.addEventListener("change", () => {
          const next = Number(lavSelect.value);
          if (!Number.isFinite(next) || next <= 0) return;
          setActiveLavanderiaId(next);
          // recarga para que todo se refresque con nueva lavandería
          location.reload();
        });
        adminAddLavBtn?.addEventListener("click", async () => {
          const nombre = window.prompt("Nombre de la nueva lavandería:");
          if (!nombre) return;
          const codigo = window.prompt("Código único (ej: NUEVA-01):");
          if (!codigo) return;
          const direccion = window.prompt("Dirección (opcional):") || "";
          const ciudad = window.prompt("Ciudad (opcional):") || "";
          const provincia = window.prompt("Provincia (opcional):") || "";
          const r = await fetch(`${API_BASE}/api/lavanderias`, {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ nombre, codigo, direccion, ciudad, provincia, activo: 1 }),
          });
          if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            notifyNice(`No se pudo crear la lavandería (${e?.error || r.status}).`);
            return;
          }
          const d = await r.json().catch(() => ({}));
          const newId = Number(d?.lavanderia?.id_lavanderia || 0);
          if (newId > 0) setActiveLavanderiaId(newId);
          location.reload();
        });
      } else {
        if (locationEl) locationEl.textContent = "—";
        if (lavSelect) lavSelect.hidden = true;
      }
    } catch {
      if (locationEl) locationEl.textContent = "—";
      if (lavSelect) lavSelect.hidden = true;
    }
    connectAdminLiveWs(activeLavId);
    const renderServerClock = (isoValue) => {
      if (!serverClockEl) return;
      const dt = new Date(String(isoValue || ""));
      if (Number.isNaN(dt.getTime())) {
        serverClockEl.textContent = "Hora servidor: no disponible";
        return;
      }
      const madrid = dt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
      serverClockEl.textContent = `Hora servidor (Madrid): ${madrid}`;
    };

    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      const health = await healthRes.json();
      renderServerClock(health?.timestamp);
      setText(cardBackend, health?.db === "ok" ? "Conectado" : "BD caída");
      if (healthLine) {
        const apiOk = Boolean(health?.ok);
        const dbOk = health?.db === "ok";
        const mqttOk = Boolean(health?.mqtt?.connected);
        const iotRunning = String(health?.iot?.scheduler || "running") === "running";
        healthLine.innerHTML = `
          <span class="health-pill ${apiOk ? "is-ok" : "is-bad"}">API: ${apiOk ? "OK" : "DOWN"}</span>
          <span class="health-pill ${dbOk ? "is-ok" : "is-bad"}">BD: ${dbOk ? "OK" : "DOWN"}</span>
          <span class="health-pill ${mqttOk ? "is-ok" : "is-bad"}">MQTT: ${mqttOk ? "OK" : "DOWN"}</span>
          <span class="health-pill ${iotRunning ? "is-ok" : "is-bad"}">IoT: ${health?.iot?.scheduler || "DOWN"}</span>
        `;
      }
    } catch {
      renderServerClock(null);
      setText(cardBackend, "Desconectado");
      if (healthLine) {
        healthLine.innerHTML = `
          <span class="health-pill is-bad">API: DOWN</span>
          <span class="health-pill is-bad">BD: DOWN</span>
          <span class="health-pill is-bad">MQTT: DOWN</span>
          <span class="health-pill is-bad">IoT: DOWN</span>
        `;
      }
    }
    if (cardCajaHoy) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const date = `${yyyy}-${mm}-${dd}`;
      const r = await fetch(`${API_BASE}/api/caja/dia?date=${encodeURIComponent(date)}`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      if (r.ok) {
        const data = await r.json();
        const total = Number(data?.total ?? 0);
        cardCajaHoy.textContent = total.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
      } else {
        cardCajaHoy.textContent = "—";
      }
    }

    storeConfigToggle?.addEventListener("click", (e) => {
      e.preventDefault();
      storeConfigDialog?.showModal();
    });
    storeConfigClose?.addEventListener("click", () => {
      storeConfigDialog?.close();
    });
    const buildStoreConfigPayloads = () => {
      const actionsPayload = {
        abrir_tienda: {
          puerta_abierta: Boolean(openDoor?.checked),
          luces_encendidas: Boolean(openLights?.checked),
        },
        cerrar_tienda: {
          puerta_abierta: Boolean(closeDoor?.checked),
          luces_encendidas: Boolean(closeLights?.checked),
        },
      };
      const schedulePayload = {
        open: storeOpenTime?.value || null,
        close: storeCloseTime?.value || null,
      };
      const selectedOpenMachines = storeOpenMachines
        ? [...storeOpenMachines.querySelectorAll("input[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
      const selectedCloseMachines = storeCloseMachines
        ? [...storeCloseMachines.querySelectorAll("input[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
      return { actionsPayload, schedulePayload, selectedOpenMachines, selectedCloseMachines };
    };
    const persistStoreConfigFromUi = async () => {
      const { actionsPayload, schedulePayload, selectedOpenMachines, selectedCloseMachines } = buildStoreConfigPayloads();
      const [aRes, sRes, openRes, closeRes] = await Promise.all([
        fetch(`${API_BASE}/api/iot/store-actions`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(actionsPayload),
        }),
        fetch(`${API_BASE}/api/iot/store-schedule`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(schedulePayload),
        }),
        fetch(`${API_BASE}/api/iot/store-open-machines`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify({ maquinas: selectedOpenMachines }),
        }),
        fetch(`${API_BASE}/api/iot/store-close-machines`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify({ maquinas: selectedCloseMachines }),
        }),
      ]);
      return aRes.ok && sRes.ok && openRes.ok && closeRes.ok;
    };
    if (storeConfigSave) {
      storeConfigSave.addEventListener("click", async () => {
        storeConfigSave.disabled = true;
        const ok = await persistStoreConfigFromUi();
        storeConfigSave.disabled = false;
        if (ok) {
          storeConfigDialog?.close();
          return;
        }
        notifyNice("No se pudo guardar la configuración.");
      });
    }
    if (storeConfigDialog) {
      const [r, s, machinesRes, selectedOpenRes, selectedCloseRes] = await Promise.all([
        fetch(`${API_BASE}/api/iot/store-actions`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch(`${API_BASE}/api/iot/store-schedule`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch(`${API_BASE}/api/maquinas`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch(`${API_BASE}/api/iot/store-open-machines`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch(`${API_BASE}/api/iot/store-close-machines`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
      ]);
      if (r.ok) {
        const d = await r.json();
        if (openDoor) openDoor.checked = Boolean(d?.actions?.abrir_tienda?.puerta_abierta);
        if (openLights) openLights.checked = Boolean(d?.actions?.abrir_tienda?.luces_encendidas);
        if (closeDoor) closeDoor.checked = Boolean(d?.actions?.cerrar_tienda?.puerta_abierta);
        if (closeLights) closeLights.checked = Boolean(d?.actions?.cerrar_tienda?.luces_encendidas);
      }
      if (s.ok) {
        const d = await s.json();
        if (storeOpenTime) storeOpenTime.value = d?.schedule?.open || "";
        if (storeCloseTime) storeCloseTime.value = d?.schedule?.close || "";
      }
      if (storeOpenMachines || storeCloseMachines) {
        const allMachines = machinesRes.ok ? (await machinesRes.json())?.maquinas || [] : [];
        const selectedOpenIds = selectedOpenRes.ok ? (await selectedOpenRes.json())?.maquinas || [] : [];
        const selectedCloseIds = selectedCloseRes.ok ? (await selectedCloseRes.json())?.maquinas || [] : [];
        const selectedOpen = new Set(selectedOpenIds.map((x) => Number(x)));
        const selectedClose = new Set(selectedCloseIds.map((x) => Number(x)));
      const htmlOpen = allMachines
          .map((m) => `<label><input type="checkbox" value="${Number(m.id_maquina)}" ${selectedOpen.has(Number(m.id_maquina)) ? "checked" : ""} /> ${escapeHtml(m.codigo_visible)}</label>`)
          .join("");
        const htmlClose = allMachines
          .map((m) => `<label><input type="checkbox" value="${Number(m.id_maquina)}" ${selectedClose.has(Number(m.id_maquina)) ? "checked" : ""} /> ${escapeHtml(m.codigo_visible)}</label>`)
          .join("");
        if (storeOpenMachines) storeOpenMachines.innerHTML = htmlOpen;
        if (storeCloseMachines) storeCloseMachines.innerHTML = htmlClose;
      }
    }
    const loadEnvFromBackend = async () => {
      const r = await fetch(`${API_BASE}/api/configuracion/env`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      if (!r.ok) throw new Error("ENV_LOAD_FAILED");
      const d = await r.json();
      if (envCameraBase) envCameraBase.value = d?.env?.CAMERA_BASE_URL || "";
      if (envCameraUser) envCameraUser.value = d?.env?.CAMERA_USER || "";
      if (envCameraPass) envCameraPass.value = d?.env?.CAMERA_PASS || "";
      if (envMqttUrl) envMqttUrl.value = d?.env?.MQTT_URL || "";
      if (envMqttUser) envMqttUser.value = d?.env?.MQTT_USER || "";
      if (envCamera2Base) envCamera2Base.value = d?.env?.CAMERA2_BASE_URL || "";
      if (envCamera2User) envCamera2User.value = d?.env?.CAMERA2_USER || "";
      if (envRedisEnabled) envRedisEnabled.value = String(d?.env?.REDIS_ENABLED || "true");
      if (envRedisHost) envRedisHost.value = d?.env?.REDIS_HOST || "";
      if (envRedisPort) envRedisPort.value = d?.env?.REDIS_PORT || "";
      if (envRedisDb) envRedisDb.value = d?.env?.REDIS_DB || "";
      if (envRedisTimeout) envRedisTimeout.value = d?.env?.REDIS_TIMEOUT_MS || "";
      if (envRedisPrefix) envRedisPrefix.value = d?.env?.REDIS_KEY_PREFIX || "";
    };
    const webEditorKeys = [
      "brand_name",
      "nav_inicio",
      "nav_about",
      "nav_contacto",
      "nav_faqs",
      "inicio_bienvenida",
      "inicio_titulo",
      "inicio_subtitulo",
      "about_titulo",
      "about_subtitulo",
      "about_parrafo_1",
      "about_parrafo_2",
      "about_card_1_titulo",
      "about_card_1_texto",
      "about_card_2_titulo",
      "about_card_2_texto",
      "about_card_3_titulo",
      "about_card_3_texto",
      "contacto_titulo",
      "contacto_subtitulo",
      "contacto_telefono",
      "contacto_email",
      "direccion_texto",
      "contacto_ubicacion_titulo",
      "contacto_ubicacion_texto",
      "mapa_url",
      "footer_titulo_horario",
      "footer_titulo_mapa",
      "footer_copy",
      "horario_lunes",
      "horario_martes",
      "horario_miercoles",
      "horario_jueves",
      "horario_viernes",
      "horario_sabado",
      "horario_domingo",
      "faq_q1",
      "faq_a1",
      "faq_q2",
      "faq_a2",
      "faq_q3",
      "faq_a3",
      "faq_q4",
      "faq_a4",
      "faq_q5",
      "faq_a5",
      "faq_q6",
      "faq_a6",
      "faqs_titulo",
      "faqs_subtitulo",
      "faqs_duda_titulo",
      "faqs_duda_texto",
      "faq_items",
    ];
    const getWebEditorKeys = () => {
      const keysFromDom = webEditorForm
        ? [...webEditorForm.querySelectorAll("[id^='web_']")]
            .map((el) => String(el.id || ""))
            .filter((id) => id.startsWith("web_"))
            .map((id) => id.replace(/^web_/, ""))
        : [];
      return [...new Set([...webEditorKeys, ...keysFromDom])];
    };
    const loadWebEditor = async () => {
      if (!webEditorForm) return;
      const r = await fetch(`${API_BASE}/api/configuracion/web-public/admin`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      if (!r.ok) throw new Error("WEB_EDITOR_LOAD_FAILED");
      const d = await r.json();
      const content = d?.contenido || {};
      getWebEditorKeys().forEach((key) => {
        const entrada = document.getElementById(`web_${key}`);
        if (entrada) entrada.value = String(content[key] ?? "");
      });
    };
    if (webEditorForm) {
      let previewLoadId = 0;
      const renderPreviewFaqItems = (doc, content) => {
        const bloqueFaq = doc.querySelector(".bloque-faq");
        if (!bloqueFaq) return;
        const escapeHtml = (text) =>
          String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
        const parseDynamicItems = () => {
          try {
            const raw = String(content.faq_items || "").trim();
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
              .map((x) => ({ q: String(x?.q || "").trim(), a: String(x?.a || "").trim() }))
              .filter((x) => x.q || x.a);
          } catch {
            return [];
          }
        };
        const dynamic = parseDynamicItems();
        const hasFaqItemsField = Object.prototype.hasOwnProperty.call(content || {}, "faq_items");
        const legacy = Array.from({ length: 6 }, (_, i) => {
          const n = i + 1;
          return {
            q: String(content[`faq_q${n}`] || "").trim(),
            a: String(content[`faq_a${n}`] || "").trim(),
          };
        }).filter((x) => x.q || x.a);
        const items = hasFaqItemsField ? dynamic : (dynamic.length ? dynamic : legacy);
        if (!items.length) {
          bloqueFaq.innerHTML = "";
          return;
        }
        bloqueFaq.innerHTML = items
          .map(
            (item) => `
            <details class="pregunta-faq">
              <summary>${escapeHtml(item.q || "Pregunta frecuente")}</summary>
              <p>${escapeHtml(item.a || "Respuesta pendiente de edición.")}</p>
            </details>
          `,
          )
          .join("");
      };
      const collectWebEditorPayload = () => {
        const payload = {};
        getWebEditorKeys().forEach((key) => {
          const entrada = document.getElementById(`web_${key}`);
          payload[key] = String(entrada?.value ?? "").trim();
        });
        return payload;
      };
      const applyPreviewToFrame = () => {
        if (!webPreviewFrame) return;
        const doc = webPreviewFrame.contentDocument;
        if (!doc) return;
        const content = collectWebEditorPayload();
        doc.querySelectorAll("[data-web-key]").forEach((el) => {
          const key = el.getAttribute("data-web-key");
          if (!key || content[key] == null) return;
          if (el.tagName === "IFRAME") {
            el.setAttribute("src", String(content[key]));
            return;
          }
          el.textContent = String(content[key]);
        });
        for (let i = 1; i <= 6; i += 1) {
          const qKey = `faq_q${i}`;
          const aKey = `faq_a${i}`;
          const qEl = doc.querySelector(`[data-web-key="${qKey}"]`);
          const aEl = doc.querySelector(`[data-web-key="${aKey}"]`);
          if (qEl && content[qKey] != null) qEl.textContent = String(content[qKey]);
          if (aEl && content[aKey] != null) aEl.textContent = String(content[aKey]);
        }
        renderPreviewFaqItems(doc, content);
      };
      const loadPreviewFrame = () => {
