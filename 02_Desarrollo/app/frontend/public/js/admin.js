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
  const envCameraStreamUser = $("#envCameraStreamUser");
  const envCameraStreamPass = $("#envCameraStreamPass");
  const envCamera2Base = $("#envCamera2Base");
  const envCamera2User = $("#envCamera2User");
  const envCamera2Pass = $("#envCamera2Pass");
  const envCamera2StreamUser = $("#envCamera2StreamUser");
  const envCamera2StreamPass = $("#envCamera2StreamPass");
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
  const quickAudioBtn = $("#quickAudioBtn");
  const quickAudioSound = $("#quickAudioSound");
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
  const iotOpenMachines = $("#iotOpenMachines");
  const iotCloseMachines = $("#iotCloseMachines");
  const iotMachineOnTime = $("#iotMachineOnTime");
  const iotMachineOffTime = $("#iotMachineOffTime");
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
            <button type="button" class="btn-secondary js-cancel">${cancelLabel}</button>
            <button type="button" class="btn-primary js-ok">${okLabel}</button>
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
          <button type="button" class="btn-primary js-ok">Aceptar</button>
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
    document.querySelectorAll(".admin-nav-item").forEach((a) => {
      a.classList.toggle("is-active", key ? a.getAttribute("data-nav") === key : false);
    });
  }

  function applyRoleUI(rol) {
    const isAdmin = rol === "ADMIN";
    document.querySelectorAll('[data-nav="usuarios"]').forEach((el) => {
      el.style.display = isAdmin ? "" : "none";
    });
    if (storeEnvBtn) storeEnvBtn.style.display = isAdmin ? "" : "none";
    // Si alguien entra a /admin/usuarios.html sin ser admin: fuera.
    if (!isAdmin && location.pathname.toLowerCase().endsWith("/admin/usuarios.html")) {
      window.location.href = "/admin/inicio.html";
    }
  }

  function ensureEditorWebNavLink() {
    const nav = document.querySelector(".admin-nav");
    if (!nav) return;
    if (nav.querySelector('[data-nav="editor-web"]')) return;
    const a = document.createElement("a");
    a.className = "admin-nav-item";
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

    lavSelect.hidden = lavanderias.length <= 1;
  }

  function isSimulatorLav(lav) {
    const code = String(lav?.codigo || "").toUpperCase();
    const name = String(lav?.nombre || "").toUpperCase();
    return code === "SIM-01" || name.includes("SIMULADOR");
  }

  function stateClass(estado) {
    if (estado === "STOP") return "state-stop";
    if (estado === "EN_MARCHA") return "state-running";
    if (estado === "MANTENIMIENTO") return "state-maint";
    if (estado === "FUERA_SERVICIO") return "state-maint";
    if (estado === "PAUSADA") return "state-maint";
    return "state-stop";
  }

  function tipoLabel(tipo) {
    if (tipo === "LAVADORA") return "Lavadora";
    if (tipo === "SECADORA") return "Secadora";
    return tipo || "Máquina";
  }

  function renderMaquinas(maquinas) {
    if (!machinesGrid) return;
    machinesGrid.innerHTML = "";
    if (!maquinas?.length) {
      machinesGrid.innerHTML = `<div class="admin-empty">Sin máquinas</div>`;
      return;
    }

    maquinas.forEach((m) => {
      const el = document.createElement("article");
      el.className = "machine-tile";
      const estado = String(m.estado_actual || "STOP");
      const id = Number(m.id_maquina);
      const canStart = estado === "STOP";
      const canStop = estado === "EN_MARCHA" || estado === "PAUSADA";
      const canCredit = estado === "PAUSADA";
      const canExtend = estado === "EN_MARCHA" && Boolean(Number(m.ampliacion_disponible ?? 1));
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
      el.innerHTML = `
        <div class="machine-meta">
          <strong>${m.codigo_visible}</strong>
          <span>${tipoLabel(m.tipo_maquina)}</span>
        </div>
        <div class="machine-state">
          <div class="machine-state-left">
            <span class="state-pill ${stateClass(estado)}">${estado}</span>
            <span class="state-pill ${fanEnabled ? "state-running" : "state-stop"}">REFRIGERAR ${fanEnabled ? "ON" : "OFF"}</span>
          </div>
          <span
            class="machine-timer"
            data-codigo="${m.codigo_visible || ""}"
            data-start="${m.fecha_hora_inicio || ""}"
            data-duration-min="${Number(m.duracion_total_programada_min ?? 0)}"
            data-rest-sec="${restSec}"
          >${timerLabel}</span>
        </div>
        <div class="machine-actions">
          <button type="button" class="btn-primary js-start" data-id="${id}" ${canStart ? "" : "disabled"}>Encender</button>
          <button type="button" class="btn-secondary js-stop" data-id="${id}" ${canStop ? "" : "disabled"}>Apagar</button>
          ${canCredit ? `<button type="button" class="btn-secondary js-credit" data-id="${id}">Crédito</button>` : ""}
          ${canExtend ? `<button type="button" class="btn-secondary js-extend" data-id="${id}">Ampliar</button>` : ""}
        </div>
        <button
          type="button"
          class="btn-secondary machine-fan-toggle js-fan-auto-btn"
          data-id="${id}"
          data-enabled="${fanEnabled ? "1" : "0"}"
        >Refrigerar</button>
        <div class="machine-drawer" data-id="${id}">
          <p class="machine-drawer-title">Importe</p>
          <div class="machine-drawer-row">
            <input type="number" min="0.10" step="0.10" class="input machine-drawer-input" value="1.00" />
            <button type="button" class="btn-primary js-amount-apply" data-id="${id}" data-mode="">Aplicar</button>
            <button type="button" class="btn-secondary js-amount-cancel" data-id="${id}">Cancelar</button>
          </div>
        </div>
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
      const timers = document.querySelectorAll(".machine-timer");
      let nextMinSec = Number.POSITIVE_INFINITY;
      let nextCode = "";
      timers.forEach((el) => {
        const startRaw = el.getAttribute("data-start") || "";
        const durationMin = Number(el.getAttribute("data-duration-min") || 0);
        const restSecAttr = Number(el.getAttribute("data-rest-sec") || 0);
        let secondsLeft = Math.max(0, Math.floor(restSecAttr));
        if (startRaw && durationMin > 0) {
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

  async function init() {
    const existing = loadAuth();
    const token = existing?.token;
    const rol = existing?.user?.rol ?? "OPERADOR";

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

    let activeLavId = getActiveLavanderiaId();
    let activeLavInfo = null;
    try {
      const l = await fetchLavanderias(token);
      const list = l?.lavanderias || [];
      if (list.length) {
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
      } else {
        if (locationEl) locationEl.textContent = "—";
        if (lavSelect) lavSelect.hidden = true;
      }
    } catch {
      if (locationEl) locationEl.textContent = "—";
      if (lavSelect) lavSelect.hidden = true;
    }
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
        puerta: { on: openDoor?.checked ? (storeOpenTime?.value || null) : null, off: closeDoor?.checked ? (storeCloseTime?.value || null) : null },
        luces: { on: openLights?.checked ? (storeOpenTime?.value || null) : null, off: closeLights?.checked ? (storeCloseTime?.value || null) : null },
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
        fetch(`${API_BASE}/api/iot/schedule`, {
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
        fetch(`${API_BASE}/api/iot/schedule`, {
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
        if (storeOpenTime) storeOpenTime.value = d?.schedule?.puerta?.on || d?.schedule?.luces?.on || "";
        if (storeCloseTime) storeCloseTime.value = d?.schedule?.puerta?.off || d?.schedule?.luces?.off || "";
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
      if (envCameraStreamUser) envCameraStreamUser.value = d?.env?.CAMERA_STREAM_USER || "";
      if (envCamera2Base) envCamera2Base.value = d?.env?.CAMERA2_BASE_URL || "";
      if (envCamera2User) envCamera2User.value = d?.env?.CAMERA2_USER || "";
      if (envCamera2StreamUser) envCamera2StreamUser.value = d?.env?.CAMERA2_STREAM_USER || "";
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
      "contacto_titulo",
      "contacto_subtitulo",
      "contacto_telefono",
      "contacto_email",
      "direccion_texto",
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
    ];
    const loadWebEditor = async () => {
      if (!webEditorForm) return;
      const r = await fetch(`${API_BASE}/api/configuracion/web-public/admin`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      if (!r.ok) throw new Error("WEB_EDITOR_LOAD_FAILED");
      const d = await r.json();
      const content = d?.contenido || {};
      webEditorKeys.forEach((key) => {
        const input = document.getElementById(`web_${key}`);
        if (input) input.value = String(content[key] ?? "");
      });
    };
    if (webEditorForm) {
      let previewLoadId = 0;
      const collectWebEditorPayload = () => {
        const payload = {};
        webEditorKeys.forEach((key) => {
          const input = document.getElementById(`web_${key}`);
          payload[key] = String(input?.value ?? "").trim();
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
      };
      const loadPreviewFrame = () => {
        if (!webPreviewFrame) return;
        const page = String(webPreviewPage?.value || "index.html");
        const thisLoad = ++previewLoadId;
        webPreviewFrame.src = `/${page}?preview=1&cb=${Date.now()}`;
        webPreviewFrame.onload = () => {
          if (thisLoad !== previewLoadId) return;
          applyPreviewToFrame();
        };
      };

      const panelStorageKey = `kwl_web_editor_panels_${String(activeLavId)}`;
      const applyWebPanelVisibility = () => {
        const toggles = [...webEditorForm.querySelectorAll(".js-web-panel-toggle")];
        toggles.forEach((toggle) => {
          const targetId = String(toggle.getAttribute("data-target") || "");
          if (!targetId) return;
          const panel = document.getElementById(targetId);
          if (!panel) return;
          panel.hidden = !toggle.checked;
        });
      };
      try {
        const raw = localStorage.getItem(panelStorageKey);
        const saved = raw ? JSON.parse(raw) : {};
        if (saved && typeof saved === "object") {
          [...webEditorForm.querySelectorAll(".js-web-panel-toggle")].forEach((toggle) => {
            const targetId = String(toggle.getAttribute("data-target") || "");
            if (!targetId) return;
            if (Object.prototype.hasOwnProperty.call(saved, targetId)) toggle.checked = Boolean(saved[targetId]);
          });
        }
      } catch {
        // ignore
      }
      applyWebPanelVisibility();
      webEditorForm.querySelectorAll(".js-web-panel-toggle").forEach((toggle) => {
        toggle.addEventListener("change", () => {
          const state = {};
          webEditorForm.querySelectorAll(".js-web-panel-toggle").forEach((x) => {
            const targetId = String(x.getAttribute("data-target") || "");
            if (!targetId) return;
            state[targetId] = Boolean(x.checked);
          });
          try {
            localStorage.setItem(panelStorageKey, JSON.stringify(state));
          } catch {
            // ignore
          }
          applyWebPanelVisibility();
        });
      });
      try {
        await loadWebEditor();
        loadPreviewFrame();
      } catch {
        notifyNice("No se pudo cargar el Editor Web.");
      }

      webPreviewPage?.addEventListener("change", loadPreviewFrame);
      webPreviewReload?.addEventListener("click", loadPreviewFrame);

      let previewDebounce = null;
      webEditorForm.querySelectorAll("input, textarea, select").forEach((el) => {
        el.addEventListener("input", () => {
          if (previewDebounce) clearTimeout(previewDebounce);
          previewDebounce = setTimeout(() => {
            applyPreviewToFrame();
          }, 120);
        });
      });

      webEditorForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (webEditorSave) webEditorSave.disabled = true;
        const payload = collectWebEditorPayload();
        const r = await fetch(`${API_BASE}/api/configuracion/web-public/admin`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (webEditorSave) webEditorSave.disabled = false;
        if (!r.ok) {
          notifyNice("No se pudo guardar el contenido público.");
          return;
        }
        notifyNice("Contenido público guardado.", "Guardado");
        applyPreviewToFrame();
      });
    }
    storeEnvBtn?.addEventListener("click", async () => {
      try {
        await loadEnvFromBackend();
        storeEnvDialog?.showModal();
      } catch {
        notifyNice("No se pudieron cargar ajustes.");
      }
    });
    storeEnvClose?.addEventListener("click", () => storeEnvDialog?.close());
    storeEnvSave?.addEventListener("click", async () => {
      const next = {
        CAMERA_BASE_URL: envCameraBase?.value?.trim() || "",
        CAMERA_USER: envCameraUser?.value?.trim() || "",
        CAMERA_PASS: envCameraPass?.value || "",
        MQTT_URL: envMqttUrl?.value?.trim() || "",
      };
      const r = await fetch(`${API_BASE}/api/configuracion/env`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify(next),
      });
      if (!r.ok) {
        notifyNice("No se pudieron guardar ajustes.");
        return;
      }
      storeEnvDialog?.close();
    });

    if (envSettingsForm) {
      const setEnvSettingsHint = (text) => {
        if (!envSettingsHint) return;
        envSettingsHint.hidden = !text;
        envSettingsHint.textContent = text || "";
      };
      try {
        await loadEnvFromBackend();
      } catch {
        setEnvSettingsHint("No se pudieron cargar los ajustes actuales.");
      }
      envSettingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setEnvSettingsHint("");
        if (envSettingsSave) envSettingsSave.disabled = true;
        const next = {
          CAMERA_BASE_URL: envCameraBase?.value?.trim() || "",
          CAMERA_USER: envCameraUser?.value?.trim() || "",
          CAMERA_PASS: envCameraPass?.value || "",
          CAMERA_STREAM_USER: envCameraStreamUser?.value?.trim() || "",
          CAMERA_STREAM_PASS: envCameraStreamPass?.value || "",
          CAMERA2_BASE_URL: envCamera2Base?.value?.trim() || "",
          CAMERA2_USER: envCamera2User?.value?.trim() || "",
          CAMERA2_PASS: envCamera2Pass?.value || "",
          CAMERA2_STREAM_USER: envCamera2StreamUser?.value?.trim() || "",
          CAMERA2_STREAM_PASS: envCamera2StreamPass?.value || "",
          MQTT_URL: envMqttUrl?.value?.trim() || "",
          MQTT_USER: envMqttUser?.value?.trim() || "",
          MQTT_PASS: envMqttPass?.value || "",
          REDIS_ENABLED: envRedisEnabled?.value || "true",
          REDIS_HOST: envRedisHost?.value?.trim() || "",
          REDIS_PORT: envRedisPort?.value?.trim() || "",
          REDIS_PASSWORD: envRedisPass?.value || "",
          REDIS_DB: envRedisDb?.value?.trim() || "",
          REDIS_TIMEOUT_MS: envRedisTimeout?.value?.trim() || "",
          REDIS_KEY_PREFIX: envRedisPrefix?.value?.trim() || "",
        };
        const r = await fetch(`${API_BASE}/api/configuracion/env`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(next),
        });
        if (envSettingsSave) envSettingsSave.disabled = false;
        if (!r.ok) {
          setEnvSettingsHint("No se pudieron guardar los ajustes.");
          notifyNice("No se pudieron guardar los ajustes.", "Ajustes");
          return;
        }
        const d = await r.json().catch(() => ({}));
        setEnvSettingsHint(String(d?.note || "Ajustes guardados."));
        notifyNice("Ajustes guardados correctamente.", "Ajustes");
      });
    }
    let storeActionCooldownUntil = 0;
    const beginStoreActionCooldown = () => {
      storeActionCooldownUntil = Date.now() + 3000;
      if (storeOpenBtn) storeOpenBtn.disabled = true;
      if (storeCloseBtn) storeCloseBtn.disabled = true;
      window.setTimeout(() => {
        if (Date.now() >= storeActionCooldownUntil) {
          if (storeOpenBtn) storeOpenBtn.disabled = false;
          if (storeCloseBtn) storeCloseBtn.disabled = false;
        }
      }, 3100);
    };
    const canRunStoreAction = () => {
      const waitMs = storeActionCooldownUntil - Date.now();
      if (waitMs <= 0) return true;
      notifyNice(`Espera ${Math.ceil(waitMs / 1000)}s antes de volver a pulsar.`);
      return false;
    };
    if (storeOpenBtn) {
      storeOpenBtn.addEventListener("click", async () => {
        if (!canRunStoreAction()) return;
        beginStoreActionCooldown();
        const saved = await persistStoreConfigFromUi();
        if (!saved) {
          notifyNice("No se pudo aplicar la configuración de apertura.");
          return;
        }
        const r = await fetch(`${API_BASE}/api/iot/store/open`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId), "content-type": "application/json" },
          body: "{}",
        });
        if (!r.ok) notifyNice("No se pudo abrir tienda.");
      });
    }
    if (storeCloseBtn) {
      storeCloseBtn.addEventListener("click", async () => {
        if (!canRunStoreAction()) return;
        beginStoreActionCooldown();
        const saved = await persistStoreConfigFromUi();
        if (!saved) {
          notifyNice("No se pudo aplicar la configuración de cierre.");
          return;
        }
        const r = await fetch(`${API_BASE}/api/iot/store/close`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId), "content-type": "application/json" },
          body: "{}",
        });
        if (!r.ok) notifyNice("No se pudo cerrar tienda.");
      });
    }

    // Cámara (si hay botones en esta vista)
    const callCamera = async (path, body) => {
      const res = await fetch(`${API_BASE}/api/camera${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: body ? JSON.stringify(body) : "{}",
      });
      return res.ok;
    };

    const reconnectCameraStreams = () => {
      const streams = [cameraImg, cameraImg1, cameraImg2].filter(Boolean);
      streams.forEach((el) => {
        const cam = el.id === "cameraStream2" ? 2 : el.id === "cameraStream1" ? 1 : null;
        const camParam = cam ? `&cam=${cam}` : "";
        el.src = `${API_BASE}/api/camera/faststream.mjpg?t=${encodeURIComponent(token)}&lav=${encodeURIComponent(
          String(activeLavId),
        )}${camParam}&cb=${Date.now()}`;
      });
    };

    camCenter?.addEventListener("click", async () => {
      const ok = await callCamera("/ptz/center");
      if (ok) reconnectCameraStreams();
    });
    camZoomIn?.addEventListener("click", async () => {
      const ok = await callCamera("/zoom", { mode: "relative", value: 250 });
      if (ok) reconnectCameraStreams();
    });
    camZoomOut?.addEventListener("click", async () => {
      const ok = await callCamera("/zoom", { mode: "relative", value: -250 });
      if (ok) reconnectCameraStreams();
    });
    camZoom1x?.addEventListener("click", async () => {
      const ok = await callCamera("/zoom", { mode: "absolute", value: 1000 });
      if (ok) reconnectCameraStreams();
    });
    camZoom2x?.addEventListener("click", async () => {
      const ok = await callCamera("/zoom", { mode: "absolute", value: 2000 });
      if (ok) reconnectCameraStreams();
    });
    camZoom4x?.addEventListener("click", async () => {
      const ok = await callCamera("/zoom", { mode: "absolute", value: 4000 });
      if (ok) reconnectCameraStreams();
    });
    camZoom8x?.addEventListener("click", async () => {
      const ok = await callCamera("/zoom", { mode: "absolute", value: 8000 });
      if (ok) reconnectCameraStreams();
    });
    camDisplayApply?.addEventListener("click", async () => {
      const ok = await callCamera("/display-mode", { mode: String(camDisplayMode?.value || "surround") });
      if (ok) reconnectCameraStreams();
    });
    const openCamUi = (target) => {
      const url = `${API_BASE}/api/camera/ui/${encodeURIComponent(target)}?t=${encodeURIComponent(
        token,
      )}&lav=${encodeURIComponent(String(activeLavId))}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };
    camOpenMobotix?.addEventListener("click", () => openCamUi("userimage"));
    camOpenAdmin?.addEventListener("click", () => openCamUi("admin"));
    camOpenEvents?.addEventListener("click", () => openCamUi("events"));
    camDetach?.addEventListener("click", () => {
      const popup = window.open("", "kwl-camera-popup", "noopener,noreferrer,width=1280,height=860");
      if (!popup) return;
      const safeApi = JSON.stringify(API_BASE);
      const safeToken = JSON.stringify(token);
      const safeLav = JSON.stringify(String(activeLavId));
      popup.document.write(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cámara desprendida</title>
<style>
body{margin:0;background:#0f172a;color:#e5e7eb;font-family:system-ui,sans-serif}
.bar{display:flex;gap:8px;flex-wrap:wrap;padding:10px;background:#111827;position:sticky;top:0}
button,select{padding:8px 10px;border-radius:10px;border:1px solid #334155;background:#1f2937;color:#fff;font-weight:600}
.frame{padding:10px}.frame img{width:100%;max-height:calc(100vh - 86px);object-fit:contain;border-radius:12px;border:1px solid #334155;background:#000}
</style></head><body>
<div class="bar">
<button id="center">Centrar</button><button id="zin">Zoom +</button><button id="zout">Zoom -</button>
<button id="z1">1x</button><button id="z2">2x</button><button id="z4">4x</button><button id="z8">8x</button>
<select id="mode"><option value="fullimage">Full Image</option><option value="surround">Modo surround</option><option value="normal">Modo normal</option><option value="panorama">Modo panorama</option></select>
<button id="apply">Aplicar modo</button>
</div>
<div class="frame"><img id="stream" alt="Cámara"></div>
<script>
const API_BASE=${safeApi}, token=${safeToken}, lav=${safeLav};
const stream=document.getElementById("stream");
const refresh=()=>{stream.src=\`\${API_BASE}/api/camera/faststream.mjpg?t=\${encodeURIComponent(token)}&lav=\${encodeURIComponent(lav)}&cam=1&cb=\${Date.now()}\`;};
const call=async(path,body)=>{await fetch(\`\${API_BASE}/api/camera\${path}\`,{method:"POST",headers:{authorization:\`Bearer \${token}\`,"x-lavanderia-id":lav,"content-type":"application/json"},body:JSON.stringify(body||{})});refresh();};
document.getElementById("center").onclick=()=>call("/ptz/center");
document.getElementById("zin").onclick=()=>call("/zoom",{mode:"relative",value:250});
document.getElementById("zout").onclick=()=>call("/zoom",{mode:"relative",value:-250});
document.getElementById("z1").onclick=()=>call("/zoom",{mode:"absolute",value:1000});
document.getElementById("z2").onclick=()=>call("/zoom",{mode:"absolute",value:2000});
document.getElementById("z4").onclick=()=>call("/zoom",{mode:"absolute",value:4000});
document.getElementById("z8").onclick=()=>call("/zoom",{mode:"absolute",value:8000});
document.getElementById("apply").onclick=()=>call("/display-mode",{mode:document.getElementById("mode").value});
refresh();
</script></body></html>`);
      popup.document.close();
    });

    // Cámara: ambas vistas usan MJPEG directo (1 sola conexión por <img>, sin bucles JS).
    const cameraTargets = [];
    if (cameraImg) cameraTargets.push({ el: cameraImg, cam: null, mode: "mjpeg" });
    if (cameraImg1) cameraTargets.push({ el: cameraImg1, cam: 1, mode: "mjpeg" });
    if (cameraImg2) cameraTargets.push({ el: cameraImg2, cam: 2, mode: "mjpeg" });

    const setCameraHint = (msg = "") => {
      if (cameraHint) cameraHint.textContent = msg;
    };

    const cameraUrl = (cam, cacheBust, mjpeg = false) => {
      const camParam = cam === 1 || cam === 2 ? `&cam=${cam}` : "";
      const base = mjpeg ? "/api/camera/faststream.mjpg" : "/api/camera/stream.jpg";
      return `${API_BASE}${base}?t=${encodeURIComponent(token)}&lav=${encodeURIComponent(String(activeLavId))}${camParam}&cb=${cacheBust}`;
    };

    if (cameraTargets.length) {
      cameraTargets.forEach(({ el, cam, mode }) => {
        el.src = cameraUrl(cam, Date.now(), mode === "mjpeg");
        el.addEventListener("load", () => setCameraHint(""));
        el.addEventListener("error", () =>
          setCameraHint("Cámara no disponible (revisar URL/credenciales y tienda activa)."),
        );
      });
    }

    // IOT / Programador
    const isIotView = Boolean(iotSaveSchedule || doorToggle || lightsToggle || fanOn);
    let currentIotState = { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false };
    let iotScheduleDirty = false;
    const setIotHint = (text) => {
      if (!iotHint) return;
      iotHint.textContent = text || "";
    };
    const setPill = (el, on) => {
      if (!el) return;
      el.classList.toggle("iot-state-on", Boolean(on));
      el.classList.toggle("iot-state-off", !on);
      el.textContent = on ? "ON" : "OFF";
    };
    const loadIot = async () => {
      if (!isIotView) return;
      if (loadIot._busy) return;
      loadIot._busy = true;
      try {
        setIotHint("");
        const [stateRes, schRes, approxRes, machinesRes, openMachinesRes, closeMachinesRes] = await Promise.all([
          fetch(`${API_BASE}/api/iot/state`, {
            headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
          }),
          fetch(`${API_BASE}/api/iot/schedule`, {
            headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
          }),
          fetch(`${API_BASE}/api/iot/approx-state`, {
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
        if (!stateRes.ok || !schRes.ok || !approxRes.ok) {
          setIotHint("No hay permiso o backend caído.");
          return;
        }
        const stateData = await stateRes.json();
        const schData = await schRes.json();
        const approxData = await approxRes.json();
        const st = stateData?.state || {};
        const approx = approxData?.approx || {};
        currentIotState = {
          puerta_abierta: Boolean(st.puerta_abierta),
          luces_encendidas: Boolean(st.luces_encendidas),
          ventilacion_encendida: Boolean(st.ventilacion_encendida),
        };
        setPill(doorState, st.puerta_abierta);
        setPill(lightsState, st.luces_encendidas);
        setPill(fanState, st.ventilacion_encendida);

        const sc = schData?.schedule || {};
        if (!iotScheduleDirty) {
          if (doorScheduleEnabled) doorScheduleEnabled.checked = Boolean(sc?.puerta?.on || sc?.puerta?.off);
          if (lightsScheduleEnabled) lightsScheduleEnabled.checked = Boolean(sc?.luces?.on || sc?.luces?.off);
          if (doorOn) doorOn.value = sc?.puerta?.on || "";
          if (doorOff) doorOff.value = sc?.puerta?.off || "";
          if (lightsOnTime) lightsOnTime.value = sc?.luces?.on || "";
          if (lightsOffTime) lightsOffTime.value = sc?.luces?.off || "";
          if (iotMachineOnTime) iotMachineOnTime.value = sc?.puerta?.on || sc?.luces?.on || "";
          if (iotMachineOffTime) iotMachineOffTime.value = sc?.puerta?.off || sc?.luces?.off || "";
          if (fanOnTime) fanOnTime.value = sc?.ventilacion?.on || "";
          if (fanOffTime) fanOffTime.value = sc?.ventilacion?.off || "";
          if (iotOpenMachines && iotCloseMachines && machinesRes.ok && openMachinesRes.ok && closeMachinesRes.ok) {
            const allMachines = (await machinesRes.json())?.maquinas || [];
            const selectedOpen = new Set((((await openMachinesRes.json())?.maquinas) || []).map((x) => Number(x)));
            const selectedClose = new Set((((await closeMachinesRes.json())?.maquinas) || []).map((x) => Number(x)));
            const htmlOpen = allMachines
              .map((m) => `<label><input type="checkbox" data-role="open" value="${Number(m.id_maquina)}" ${selectedOpen.has(Number(m.id_maquina)) ? "checked" : ""} /> ${escapeHtml(m.codigo_visible)}</label>`)
              .join("");
            const htmlClose = allMachines
              .map((m) => `<label><input type="checkbox" data-role="close" value="${Number(m.id_maquina)}" ${selectedClose.has(Number(m.id_maquina)) ? "checked" : ""} /> ${escapeHtml(m.codigo_visible)}</label>`)
              .join("");
            iotOpenMachines.innerHTML = htmlOpen;
            iotCloseMachines.innerHTML = htmlClose;
          }
        }
        await loadIotLog();
      } finally {
        loadIot._busy = false;
      }
    };

    const loadIotLog = async () => {
      if (!iotLogTbody) return;
      const r = await fetch(`${API_BASE}/api/iot/relay-action-log`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      if (!r.ok) {
        iotLogTbody.innerHTML = `<tr><td colspan="4">Sin acceso</td></tr>`;
        return;
      }
      const data = await r.json().catch(() => ({}));
      const items = Array.isArray(data?.items) ? data.items : [];
      if (!items.length) {
        iotLogTbody.innerHTML = `<tr><td colspan="4">Sin acciones registradas</td></tr>`;
        return;
      }
      iotLogTbody.innerHTML = items
        .map((item) => {
          const ts = item?.ts ? new Date(item.ts).toLocaleString("es-ES") : "—";
          const dispositivo = item?.dispositivo || "—";
          const accion = item?.accion || "—";
          const origen = item?.origen ? ` · ${item.origen}` : "";
          const by = item?.by ? `#${item.by}` : "—";
          return `<tr><td>${escapeHtml(ts)}</td><td>${escapeHtml(dispositivo)}</td><td>${escapeHtml(`${accion}${origen}`)}</td><td>${escapeHtml(by)}</td></tr>`;
        })
        .join("");
    };

    const saveState = async (nextState) => {
      const payload = { ...currentIotState, ...nextState };
      const res = await fetch(`${API_BASE}/api/iot/state`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setIotHint("Solo ADMIN puede cambiar.");
        return false;
      }
      await loadIot();
      return true;
    };

    const triggerRelayPulse = async (kind) => {
      if (isSimulatorLav(activeLavInfo)) {
        return;
      }
      const r = await fetch(`${API_BASE}/api/camera/relay/pulse`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify({ kind }),
      });
      if (!r.ok) throw new Error("RELAY_FAILED");
    };
    const registerRelayToggle = async (device, origin = "manual", forcedAction = "toggle") => {
      const r = await fetch(`${API_BASE}/api/iot/relay-action`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify({ dispositivo: device, origen: origin, accion: forcedAction }),
      });
      if (!r.ok) throw new Error("RELAY_LOG_FAILED");
    };

    quickDoorBtn?.addEventListener("click", async () => {
      if (!(await confirmNice("Confirmar acción", "¿Cambiar estado de puerta?"))) return;
      const nextAction = currentIotState.puerta_abierta ? "off" : "on";
      try {
        await triggerRelayPulse("door");
        await registerRelayToggle("puerta", "inicio", nextAction);
        await loadIot();
      } catch {
        notifyNice("No se pudo cambiar puerta.");
      }
    });
    quickLightsBtn?.addEventListener("click", async () => {
      if (!(await confirmNice("Confirmar acción", "¿Cambiar estado de luces?"))) return;
      const nextAction = currentIotState.luces_encendidas ? "off" : "on";
      try {
        await triggerRelayPulse("lights");
        await registerRelayToggle("luces", "inicio", nextAction);
        await loadIot();
      } catch {
        notifyNice("No se pudo cambiar luces.");
      }
    });
    quickAudioBtn?.addEventListener("click", async () => {
      const soundfile = String(quickAudioSound?.value || "PUBLICIDAD");
      if (!(await confirmNice("Confirmar audio", `¿Reproducir "${soundfile}" en la tienda?`))) return;
      try {
        const r = await fetch(`${API_BASE}/api/camera/audio/play`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify({ soundfile }),
        });
        if (!r.ok) throw new Error("AUDIO_FAILED");
        await fetch(`${API_BASE}/api/iot/relay-action`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify({ dispositivo: "audio", accion: "play", origen: "inicio" }),
        });
      } catch {
        notifyNice("No se pudo reproducir audio.");
      }
    });

    doorToggle?.addEventListener("click", async () => {
      const nextAction = currentIotState.puerta_abierta ? "off" : "on";
      try {
        await triggerRelayPulse("door");
        await registerRelayToggle("puerta", "programador", nextAction);
        await loadIot();
      } catch {
        setIotHint("Error en cambio de puerta.");
      }
    });
    lightsToggle?.addEventListener("click", async () => {
      const nextAction = currentIotState.luces_encendidas ? "off" : "on";
      try {
        await triggerRelayPulse("lights");
        await registerRelayToggle("luces", "programador", nextAction);
        await loadIot();
      } catch {
        setIotHint("Error en cambio de luces.");
      }
    });
    fanOn?.addEventListener("click", async () => {
      await saveState({ ventilacion_encendida: true });
    });
    fanOff?.addEventListener("click", async () => {
      await saveState({ ventilacion_encendida: false });
    });

    [doorScheduleEnabled, lightsScheduleEnabled, doorOn, doorOff, lightsOnTime, lightsOffTime, iotMachineOnTime, iotMachineOffTime, fanOnTime, fanOffTime, iotOpenMachines, iotCloseMachines]
      .filter(Boolean)
      .forEach((el) => {
        el.addEventListener("input", () => {
          iotScheduleDirty = true;
        });
        el.addEventListener("change", () => {
          iotScheduleDirty = true;
        });
      });

    iotSaveSchedule?.addEventListener("click", async () => {
      setIotHint("");
      iotSaveSchedule.disabled = true;
      const machineOn = String(iotMachineOnTime?.value ?? "").trim() || null;
      const machineOff = String(iotMachineOffTime?.value ?? "").trim() || null;
      const doorOnValue = String(doorOn?.value ?? "").trim() || machineOn;
      const doorOffValue = String(doorOff?.value ?? "").trim() || machineOff;
      const lightsOnValue = String(lightsOnTime?.value ?? "").trim() || machineOn;
      const lightsOffValue = String(lightsOffTime?.value ?? "").trim() || machineOff;
      const payload = {
        puerta: doorScheduleEnabled?.checked
          ? { on: doorOnValue, off: doorOffValue }
          : { on: null, off: null },
        luces: lightsScheduleEnabled?.checked
          ? { on: lightsOnValue, off: lightsOffValue }
          : { on: null, off: null },
        ventilacion: { on: String(fanOnTime?.value ?? "").trim() || null, off: String(fanOffTime?.value ?? "").trim() || null },
      };
      const selectedOpenMachines = iotOpenMachines
        ? [...iotOpenMachines.querySelectorAll("input[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
      const selectedCloseMachines = iotCloseMachines
        ? [...iotCloseMachines.querySelectorAll("input[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
      const [res, openRes, closeRes] = await Promise.all([
        fetch(`${API_BASE}/api/iot/schedule`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
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
      const data = await res.json().catch(() => ({}));
      iotSaveSchedule.disabled = false;
      if (!res.ok || !openRes.ok || !closeRes.ok) {
        setIotHint(`Error: ${data?.error || "NO_OK"} (solo ADMIN)`);
        return;
      }
      iotScheduleDirty = false;
      setIotHint("Guardado.");
      await loadIot();
    });

    if (isIotView) {
      await loadIot();
      if (iotPollInterval) clearInterval(iotPollInterval);
      iotPollInterval = setInterval(() => {
        loadIot().catch(() => {});
      }, 2000);
    }

    // Usuarios (solo admin)
    const isUsersView = Boolean(usersTbody);
    let usersCache = [];

    const formatDate = (d) => {
      if (!d) return "—";
      try {
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
      } catch {
        return "—";
      }
    };

    const showNote = (text) => {
      if (!usersNote) return;
      usersNote.hidden = !text;
      usersNote.textContent = text || "";
    };

    const openDialog = (mode, user) => {
      if (!userDialog || !userForm) return;
      userForm.dataset.mode = mode;
      userForm.dataset.userId = user?.id_usuario ? String(user.id_usuario) : "";
      if (userDialogTitle) userDialogTitle.textContent = mode === "create" ? "Nuevo usuario" : "Editar usuario";

      if (userNombre) userNombre.value = user?.nombre || "";
      if (userApellidos) userApellidos.value = user?.apellidos || "";
      if (userEmail) userEmail.value = user?.email || "";
      if (userRol) userRol.value = user?.rol || "OPERADOR";
      if (userPassword) userPassword.value = "";
      if (userTempPassword) {
        userTempPassword.hidden = true;
        userTempPassword.textContent = "";
      }
      userDialog.showModal();
    };

    const closeDialog = () => {
      if (!userDialog) return;
      userDialog.close();
    };

    userDialogClose?.addEventListener("click", closeDialog);
    userCancelBtn?.addEventListener("click", closeDialog);

    const renderUsers = (list) => {
      if (!usersTbody) return;
      usersTbody.innerHTML = "";
      if (!list.length) {
        usersTbody.innerHTML = `<tr><td colspan="6">Sin usuarios</td></tr>`;
        return;
      }

      list.forEach((u) => {
        const tr = document.createElement("tr");
        const fullName = [u.nombre, u.apellidos].filter(Boolean).join(" ");
        const pill = u.activo ? `<span class="pill pill-ok">ACTIVO</span>` : `<span class="pill pill-off">INACTIVO</span>`;
        const canToggle = u.id_usuario !== (existing?.user?.id_usuario ?? 0);
        tr.innerHTML = `
          <td>${escapeHtml(fullName || "—")}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.rol)}</td>
          <td>${pill}</td>
          <td>${escapeHtml(formatDate(u.ultimo_acceso))}</td>
          <td>
            <div class="users-actions-inline">
              <button type="button" class="btn-secondary js-user-edit" data-id="${Number(u.id_usuario)}">Editar</button>
              <button type="button" class="btn-secondary js-user-lavs" data-id="${Number(u.id_usuario)}">Tiendas</button>
              <button type="button" class="btn-secondary js-user-toggle" data-id="${Number(u.id_usuario)}" ${
                canToggle ? "" : "disabled"
              }>${u.activo ? "Desactivar" : "Activar"}</button>
              <button type="button" class="btn-secondary js-user-delete" data-id="${Number(u.id_usuario)}" ${
                canToggle ? "" : "disabled"
              }>Borrar</button>
            </div>
          </td>
        `;
        usersTbody.appendChild(tr);
      });
    };

    const loadUsers = async () => {
      if (!isUsersView) return;
      showNote("");
      const res = await fetch(`${API_BASE}/api/usuarios`, {
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
        },
      });
      if (!res.ok) {
        showNote("No tienes permiso para ver usuarios.");
        return;
      }
      const data = await res.json();
      usersCache = data?.usuarios || [];
      renderUsers(usersCache);
    };

    const filteredUsers = () => {
      const q = String(usersSearch?.value ?? "")
        .trim()
        .toLowerCase();
      if (!q) return usersCache;
      return usersCache.filter((u) => {
        const fullName = [u.nombre, u.apellidos].filter(Boolean).join(" ").toLowerCase();
        return (
          fullName.includes(q) ||
          String(u.email || "").toLowerCase().includes(q) ||
          String(u.rol || "").toLowerCase().includes(q)
        );
      });
    };

    usersSearch?.addEventListener("input", () => {
      renderUsers(filteredUsers());
    });

    userNewBtn?.addEventListener("click", () => {
      openDialog("create", null);
    });

    usersTbody?.addEventListener("click", async (e) => {
      const editBtn = e.target.closest(".js-user-edit");
      const lavsBtn = e.target.closest(".js-user-lavs");
      const toggleBtn = e.target.closest(".js-user-toggle");
      const delBtn = e.target.closest(".js-user-delete");
      if (!editBtn && !toggleBtn && !lavsBtn && !delBtn) return;

      const id = Number((editBtn || toggleBtn || lavsBtn || delBtn).getAttribute("data-id"));
      const user = usersCache.find((x) => Number(x.id_usuario) === id);
      if (!user) return;

      if (editBtn) {
        openDialog("edit", user);
        return;
      }

      if (lavsBtn) {
        try {
          const [allLavRes, userLavRes] = await Promise.all([
            fetch(`${API_BASE}/api/lavanderias`, {
              headers: { authorization: `Bearer ${token}` },
            }),
            fetch(`${API_BASE}/api/usuarios/${id}/lavanderias`, {
              headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
            }),
          ]);
          if (!allLavRes.ok || !userLavRes.ok) throw new Error("LAVS_LOAD_FAILED");
          const allLav = (await allLavRes.json())?.lavanderias || [];
          const userLav = (await userLavRes.json())?.lavanderias || [];
          const hint = allLav.map((l) => `${l.id_lavanderia}:${l.nombre}${userLav.includes(l.id_lavanderia) ? " [x]" : ""}`).join("\n");
          const raw = window.prompt(`IDs de tiendas (coma):\n${hint}`, userLav.join(","));
          if (raw === null) return;
          const ids = raw.split(",").map((x) => Number(x.trim())).filter((x) => Number.isFinite(x) && x > 0);
          const r = await fetch(`${API_BASE}/api/usuarios/${id}/lavanderias`, {
            method: "PUT",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify({ lavanderias: ids }),
          });
          if (!r.ok) throw new Error("LAVS_SAVE_FAILED");
          await loadUsers();
        } catch {
          showNote("No se pudieron actualizar tiendas.");
        }
        return;
      }

      if (toggleBtn) {
        toggleBtn.disabled = true;
        try {
          const action = user.activo ? "desactivar" : "activar";
          const r = await fetch(`${API_BASE}/api/usuarios/${id}/${action}`, {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify({}),
          });
          if (!r.ok) throw new Error("TOGGLE_FAILED");
          await loadUsers();
        } catch {
          await loadUsers();
        } finally {
          toggleBtn.disabled = false;
        }
      }

      if (delBtn) {
        if (!(await confirmNice("Borrar usuario", `¿Borrar usuario ${user.email}?`, "Borrar", "Cancelar"))) return;
        try {
          const r = await fetch(`${API_BASE}/api/usuarios/${id}`, {
            method: "DELETE",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
            },
          });
          if (!r.ok) throw new Error("DELETE_FAILED");
          await loadUsers();
        } catch {
          showNote("No se pudo borrar el usuario.");
        }
      }
    });

    userForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!userForm) return;
      const mode = userForm.dataset.mode || "create";
      const id = Number(userForm.dataset.userId || "0");
      const payload = {
        nombre: String(userNombre?.value ?? "").trim(),
        apellidos: String(userApellidos?.value ?? "").trim(),
        email: String(userEmail?.value ?? "").trim(),
        rol: String(userRol?.value ?? "OPERADOR"),
        password: String(userPassword?.value ?? "").trim(),
      };
      if (!payload.nombre || !payload.email) return;

      const url =
        mode === "edit" && id > 0 ? `${API_BASE}/api/usuarios/${id}` : `${API_BASE}/api/usuarios`;
      const method = mode === "edit" && id > 0 ? "PUT" : "POST";

      const sendPayload = { ...payload };
      if (!sendPayload.apellidos) delete sendPayload.apellidos;
      if (!sendPayload.password) delete sendPayload.password;

      try {
        const r = await fetch(url, {
          method,
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(sendPayload),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          showNote(`Error: ${data?.error || "NO_OK"}`);
          return;
        }
        if (userTempPassword && data?.tempPassword) {
          userTempPassword.hidden = false;
          userTempPassword.textContent = `Contraseña temporal: ${data.tempPassword}`;
        }
        await loadUsers();
        if (!data?.tempPassword) closeDialog();
      } catch {
        showNote("Error guardando usuario.");
      }
    });

    if (isUsersView) {
      await loadUsers();
    }

    // Caja
    const isCashView = Boolean(cashTbody);
    const setCashHint = (text) => {
      if (!cashHint) return;
      cashHint.hidden = !text;
      cashHint.textContent = text || "";
    };
    const eur = (n) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return "—";
      return v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
    };
    const today = () => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const renderCash = (data) => {
      if (!cashTbody) return;
      setCashHint("");
      cashTbody.innerHTML = "";
      const items = data?.items || [];
      if (!items.length) {
        cashTbody.innerHTML = `<tr><td colspan="4" class="table-empty">Sin actividad en el periodo seleccionado</td></tr>`;
      } else {
        items.forEach((it) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${escapeHtml(it.codigo_visible)}</td>
            <td>${escapeHtml(it.tipo_maquina)}</td>
            <td>${escapeHtml(it.movimientos)}</td>
            <td>${escapeHtml(eur(it.importe_total))}</td>
          `;
          cashTbody.appendChild(tr);
        });
      }
      if (cashPeriod) cashPeriod.textContent = `${data?.from || "—"} → ${data?.to || "—"}`;
      if (cashMoves) cashMoves.textContent = String(data?.movimientos ?? "0");
      if (cashTotal) cashTotal.textContent = eur(data?.total ?? 0);
    };
    const loadCash = async (path) => {
      setCashHint("");
      const res = await fetch(`${API_BASE}/api/caja/${path}`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCashHint(`Error: ${data?.error || "NO_OK"}`);
        notifyNice("No se pudo cargar caja para ese filtro.", "Error de caja");
        return;
      }
      renderCash(data);
    };

    const setCashView = (view) => {
      document.querySelectorAll(".cash-tab").forEach((b) => {
        const active = b.getAttribute("data-tab") === view;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      document.querySelectorAll(".cash-filter").forEach((f) => {
        const show = f.getAttribute("data-view") === view;
        f.hidden = !show;
      });
    };

    if (isCashView) {
      const t = today();
      if (cashDay && !cashDay.value) cashDay.value = t;
      if (cashWeekDate && !cashWeekDate.value) cashWeekDate.value = t;
      if (cashFrom && !cashFrom.value) cashFrom.value = t.slice(0, 8) + "01";
      if (cashTo && !cashTo.value) cashTo.value = t;

      document.querySelectorAll(".cash-tab").forEach((b) => {
        b.addEventListener("click", async () => {
          const view = b.getAttribute("data-tab") || "dia";
          setCashView(view);
          if (view === "dia") {
            const d = String(cashDay?.value ?? "").trim() || t;
            await loadCash(`dia?date=${encodeURIComponent(d)}`);
            return;
          }
          if (view === "semana") {
            const d = String(cashWeekDate?.value ?? "").trim() || t;
            await loadCash(`semana?date=${encodeURIComponent(d)}`);
            return;
          }
          const f = String(cashFrom?.value ?? "").trim() || t.slice(0, 8) + "01";
          const to = String(cashTo?.value ?? "").trim() || t;
          await loadCash(`rango?from=${encodeURIComponent(f)}&to=${encodeURIComponent(to)}`);
        });
      });

      cashLoadDay?.addEventListener("click", () => {
        const d = String(cashDay?.value ?? "").trim();
        if (!d) return;
        loadCash(`dia?date=${encodeURIComponent(d)}`);
      });
      cashLoadWeek?.addEventListener("click", () => {
        const d = String(cashWeekDate?.value ?? "").trim();
        if (!d) return;
        loadCash(`semana?date=${encodeURIComponent(d)}`);
      });
      cashLoadRange?.addEventListener("click", () => {
        const f = String(cashFrom?.value ?? "").trim();
        const to = String(cashTo?.value ?? "").trim();
        if (!f || !to) return;
        loadCash(`rango?from=${encodeURIComponent(f)}&to=${encodeURIComponent(to)}`);
      });

      setCashView("dia");
      await loadCash(`dia?date=${encodeURIComponent(String(cashDay?.value ?? t))}`);
    }

    // Informes (Ciclos + Evolución + Estadísticas)
    const isReportsView = Boolean(repTbody);
    if (isReportsView) {
      const evWeekDate = document.getElementById("evWeekDate");
      const evMonth = document.getElementById("evMonth");
      const evYear = document.getElementById("evYear");
      const evLoad = document.getElementById("evLoad");
      const evTbody = document.getElementById("evTbody");
      const evHint = document.getElementById("evHint");
      const evCurrentLabel = document.getElementById("evCurrentLabel");
      const evPrevLabel = document.getElementById("evPrevLabel");
      const evDeltaTotal = document.getElementById("evDeltaTotal");
      const evDeltaCycles = document.getElementById("evDeltaCycles");
      const evChartTable = document.getElementById("evChartTable");

      const stDate = document.getElementById("stDate");
      const stMonth = document.getElementById("stMonth");
      const stYear = document.getElementById("stYear");
      const stLoad = document.getElementById("stLoad");
      const stPeriod = document.getElementById("stPeriod");
      const stTotal = document.getElementById("stTotal");
      const stCycles = document.getElementById("stCycles");
      const stTable = document.getElementById("stTable");
      const stHint = document.getElementById("stHint");
      const stChartTable = document.getElementById("stChartTable");

      const today = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const monthNow = () => today().slice(0, 7);
      const yearNow = () => String(new Date().getFullYear());

      const t = today();
      if (repFrom && !repFrom.value) repFrom.value = t;
      if (repTo && !repTo.value) repTo.value = t;
      if (evWeekDate && !evWeekDate.value) evWeekDate.value = t;
      if (evMonth && !evMonth.value) evMonth.value = monthNow();
      if (evYear && !evYear.value) evYear.value = yearNow();
      if (stDate && !stDate.value) stDate.value = t;
      if (stMonth && !stMonth.value) stMonth.value = monthNow();
      if (stYear && !stYear.value) stYear.value = yearNow();

      let offset = 0;
      const limit = 25;
      let evTab = "semanal";
      let stTab = "diario";

      const setHint = (text) => {
        if (!repHint) return;
        repHint.textContent = text || "";
      };
      const setEvHint = (text) => {
        if (!evHint) return;
        evHint.textContent = text || "";
      };
      const setStHint = (text) => {
        if (!stHint) return;
        stHint.textContent = text || "";
      };

      const eur = (n) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return "—";
        return v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
      };

      const fmt = (d) => {
        if (!d) return "—";
        try {
          const dt = new Date(d);
          if (Number.isNaN(dt.getTime())) return "—";
          return dt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
        } catch {
          return "—";
        }
      };

      const barCell = (pct, txt) =>
        `<div style="display:flex;align-items:center;gap:8px"><div style="height:8px;flex:1;background:rgba(255,255,255,.1);border-radius:999px"><div style="height:8px;width:${pct}%;background:#40c2a8;border-radius:999px"></div></div><span>${txt}</span></div>`;

      const setReportsTab = (tab) => {
        document.querySelectorAll(".reports-tab[data-tab]").forEach((b) => {
          const active = b.getAttribute("data-tab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        document.querySelectorAll(".reports-view").forEach((v) => {
          const show = v.getAttribute("data-view") === tab;
          v.hidden = !show;
        });
      };
      const setEvTab = (tab) => {
        evTab = tab;
        document.querySelectorAll(".reports-tab[data-evtab]").forEach((b) => {
          const active = b.getAttribute("data-evtab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
      };
      const setStTab = (tab) => {
        stTab = tab;
        document.querySelectorAll(".reports-tab[data-sttab]").forEach((b) => {
          const active = b.getAttribute("data-sttab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
      };

      document.querySelectorAll(".reports-tab[data-tab]").forEach((b) => {
        b.addEventListener("click", () => setReportsTab(b.getAttribute("data-tab") || "ciclos"));
      });
      document.querySelectorAll(".reports-tab[data-evtab]").forEach((b) => {
        b.addEventListener("click", () => setEvTab(b.getAttribute("data-evtab") || "semanal"));
      });
      document.querySelectorAll(".reports-tab[data-sttab]").forEach((b) => {
        b.addEventListener("click", () => setStTab(b.getAttribute("data-sttab") || "diario"));
      });
      setReportsTab("ciclos");
      setEvTab("semanal");
      setStTab("diario");

      const loadCiclos = async () => {
        if (!repTbody) return;
        setHint("");

        const from = String(repFrom?.value ?? "").trim();
        const to = String(repTo?.value ?? "").trim();
        const mid = String(repMachineId?.value ?? "").trim();
        const estado = String(repEstado?.value ?? "").trim();

        const qs = new URLSearchParams();
        qs.set("from", from || t);
        qs.set("to", to || t);
        qs.set("limit", String(limit));
        qs.set("offset", String(offset));
        if (mid) qs.set("id_maquina", mid);
        if (estado) qs.set("estado", estado);

        const res = await fetch(`${API_BASE}/api/informes/ciclos?${qs.toString()}`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setHint(`Error: ${data?.error || "NO_OK"}`);
          repTbody.innerHTML = `<tr><td colspan="7">Error</td></tr>`;
          return;
        }

        const ciclos = data?.ciclos || [];
        repTbody.innerHTML = "";
        if (!ciclos.length) {
          repTbody.innerHTML = `<tr><td colspan="7">Sin ciclos</td></tr>`;
        } else {
          ciclos.forEach((c) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${escapeHtml(c.id_ciclo)}</td>
              <td>${escapeHtml(`${c.codigo_visible} (${c.tipo_maquina})`)}</td>
              <td>${escapeHtml(fmt(c.fecha_hora_inicio))}</td>
              <td>${escapeHtml(fmt(c.fecha_hora_fin))}</td>
              <td>${escapeHtml(c.estado_ciclo)}</td>
              <td>${escapeHtml(c.duracion_total_programada_min)}</td>
              <td>${escapeHtml(eur(c.importe_total_aplicado))}</td>
            `;
            repTbody.appendChild(tr);
          });
        }

        if (repTotal) repTotal.textContent = String(data?.total ?? 0);
        if (repRange) repRange.textContent = `${data?.from || "—"} → ${data?.to || "—"}`;
        const page = Math.floor((data?.offset ?? 0) / (data?.limit ?? limit)) + 1;
        const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? limit)));
        if (repPage) repPage.textContent = `${page} / ${pages}`;

        if (repPrev) repPrev.disabled = offset <= 0;
        if (repNext) repNext.disabled = offset + limit >= (data?.total ?? 0);
      };

      const loadEvolucion = async () => {
        if (!evTbody) return;
        setEvHint("");
        let url = `${API_BASE}/api/informes/evolucion/semanal?date=${encodeURIComponent(String(evWeekDate?.value || t))}`;
        if (evTab === "mensual") {
          url = `${API_BASE}/api/informes/evolucion/mensual?month=${encodeURIComponent(String(evMonth?.value || monthNow()))}`;
        }
        if (evTab === "anual") {
          url = `${API_BASE}/api/informes/evolucion/anual?year=${encodeURIComponent(String(evYear?.value || yearNow()))}`;
        }
        const res = await fetch(url, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEvHint(`Error: ${data?.error || "NO_OK"}`);
          evTbody.innerHTML = `<tr><td colspan="7">Error</td></tr>`;
          if (evChartTable) evChartTable.innerHTML = "";
          return;
        }
        if (evCurrentLabel) evCurrentLabel.textContent = data?.periodo_actual || "—";
        if (evPrevLabel) evPrevLabel.textContent = data?.periodo_anterior || "—";
        if (evDeltaTotal) evDeltaTotal.textContent = eur(data?.resumen?.delta_total || 0);
        if (evDeltaCycles) evDeltaCycles.textContent = String(data?.resumen?.delta_ciclos ?? 0);

        const items = Array.isArray(data?.machines) ? data.machines : [];
        evTbody.innerHTML = "";
        if (!items.length) {
          evTbody.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
        } else {
          items.forEach((m) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${escapeHtml(m.codigo_visible)}</td>
              <td>${escapeHtml(eur(m.total_actual))}</td>
              <td>${escapeHtml(eur(m.total_anterior))}</td>
              <td>${escapeHtml(eur(m.delta_total))}</td>
              <td>${escapeHtml(m.ciclos_actual)}</td>
              <td>${escapeHtml(m.ciclos_anterior)}</td>
              <td>${escapeHtml(m.delta_ciclos)}</td>
            `;
            evTbody.appendChild(tr);
          });
        }

        if (evChartTable) {
          const max = Math.max(1, ...items.map((m) => Number(m.total_actual || 0)));
          evChartTable.innerHTML = `
            <thead><tr><th>Máquina</th><th>Total actual (gráfico)</th></tr></thead>
            <tbody>
              ${items
                .map((m) => {
                  const total = Number(m.total_actual || 0);
                  const pct = Math.min(100, Math.round((total / max) * 100));
                  return `<tr><td>${escapeHtml(m.codigo_visible)}</td><td>${barCell(pct, eur(total))}</td></tr>`;
                })
                .join("")}
            </tbody>
          `;
        }
      };

      const loadEstadisticas = async () => {
        if (!stTable) return;
        setStHint("");
        let url = `${API_BASE}/api/informes/tramos/diario?date=${encodeURIComponent(String(stDate?.value || t))}`;
        if (stTab === "mensual") {
          url = `${API_BASE}/api/informes/tramos/mensual?month=${encodeURIComponent(String(stMonth?.value || monthNow()))}`;
        }
        if (stTab === "anual") {
          url = `${API_BASE}/api/informes/tramos/anual?year=${encodeURIComponent(String(stYear?.value || yearNow()))}`;
        }
        const res = await fetch(url, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStHint(`Error: ${data?.error || "NO_OK"}`);
          stTable.innerHTML = "";
          if (stChartTable) stChartTable.innerHTML = "";
          return;
        }
        const rows = Array.isArray(data?.data) ? data.data : [];
        const totals = Array.isArray(data?.totals_by_machine) ? data.totals_by_machine : [];
        if (stPeriod) stPeriod.textContent = String(data?.periodo || "—");
        if (stTotal) stTotal.textContent = eur(data?.total_general || 0);
        if (stCycles) stCycles.textContent = String(data?.ciclos_general ?? 0);

        const machineCols = totals.map((m) => m.codigo_visible);
        stTable.innerHTML = `
          <thead>
            <tr>
              <th>Tramo</th>
              ${machineCols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}
              <th>Total tramo</th>
              <th>Ciclos tramo</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((r) => {
                const cells = (r.maquinas || []).map((m) => `<td>${eur(m.total)}<br/><small>${m.ciclos} ciclos</small></td>`).join("");
                return `<tr><td>${escapeHtml(r.slot)}</td>${cells}<td>${escapeHtml(eur(r.total_slot))}</td><td>${escapeHtml(r.ciclos_slot)}</td></tr>`;
              })
              .join("")}
            <tr>
              <td><strong>Total</strong></td>
              ${totals.map((m) => `<td><strong>${eur(m.total)}</strong><br/><small>${m.ciclos} ciclos</small></td>`).join("")}
              <td><strong>${eur(data?.total_general || 0)}</strong></td>
              <td><strong>${data?.ciclos_general || 0}</strong></td>
            </tr>
          </tbody>
        `;

        if (stChartTable) {
          const max = Math.max(1, ...rows.map((r) => Number(r.total_slot || 0)));
          stChartTable.innerHTML = `
            <thead><tr><th>Tramo</th><th>Total (gráfico)</th></tr></thead>
            <tbody>
              ${rows
                .map((r) => {
                  const total = Number(r.total_slot || 0);
                  const pct = Math.min(100, Math.round((total / max) * 100));
                  return `<tr><td>${escapeHtml(r.slot)}</td><td>${barCell(pct, eur(total))}</td></tr>`;
                })
                .join("")}
            </tbody>
          `;
        }
      };

      repLoad?.addEventListener("click", async () => {
        offset = 0;
        await loadCiclos();
      });
      repPrev?.addEventListener("click", async () => {
        offset = Math.max(0, offset - limit);
        await loadCiclos();
      });
      repNext?.addEventListener("click", async () => {
        offset = offset + limit;
        await loadCiclos();
      });
      evLoad?.addEventListener("click", loadEvolucion);
      stLoad?.addEventListener("click", loadEstadisticas);
      document.querySelectorAll(".reports-tab[data-evtab]").forEach((b) => b.addEventListener("click", loadEvolucion));
      document.querySelectorAll(".reports-tab[data-sttab]").forEach((b) => b.addEventListener("click", loadEstadisticas));

      await loadCiclos();
      await loadEvolucion();
      await loadEstadisticas();
    }

    // Logs (Auditoría)
    const isLogsView = Boolean(logsTbody);
    if (isLogsView) {
      const setLogsHint = (text) => {
        if (!logsHint) return;
        logsHint.hidden = !text;
        logsHint.textContent = text || "";
      };
      const fmt = (d) => {
        if (!d) return "—";
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
      };
      const esc = (v) =>
        String(v ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");

      const loadLogs = async () => {
        setLogsHint("");
        const qs = new URLSearchParams();
        qs.set("limit", "200");
        const q = String(logsQuery?.value ?? "").trim();
        const action = String(logsAction?.value ?? "").trim();
        if (q) qs.set("q", q);
        if (action) qs.set("accion", action);

        const r = await fetch(`${API_BASE}/api/auditoria?${qs.toString()}`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setLogsHint(`Error: ${data?.error || "NO_OK"}`);
          logsTbody.innerHTML = `<tr><td colspan="6" class="table-empty">No se pudieron cargar los logs</td></tr>`;
          notifyNice("No se pudieron cargar los logs.", "Error de logs");
          return;
        }
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) {
          logsTbody.innerHTML = `<tr><td colspan="6" class="table-empty">Sin registros para ese filtro</td></tr>`;
          return;
        }
        logsTbody.innerHTML = items
          .map(
            (it) => `<tr>
              <td><span class="logs-date">${esc(fmt(it?.fecha_hora))}</span></td>
              <td><span class="logs-action-chip">${esc(it?.accion || "—")}</span></td>
              <td>${esc(it?.usuario_login || "—")}</td>
              <td><span class="logs-machine-chip">${esc(it?.maquina_codigo || "—")}</span></td>
              <td>${esc(it?.detalle || "—")}</td>
              <td><span class="logs-ip">${esc(it?.ip_origen || "—")}</span></td>
            </tr>`,
          )
          .join("");
      };

      logsLoad?.addEventListener("click", loadLogs);
      logsQuery?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") loadLogs();
      });
      logsAction?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") loadLogs();
      });
      await loadLogs();
    }

    async function loadMaquinas() {
      if (loadMaquinas._busy) return;
      loadMaquinas._busy = true;
      try {
        const isMachinesView = location.pathname.toLowerCase().endsWith("/admin/maquinas.html");
        if (isMachinesView && machinesGrid?.querySelector(".machine-drawer.is-open")) return;
        const res = await fetch(`${API_BASE}/api/maquinas`, {
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
          },
        });
        if (!res.ok) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.href = "/index.html#login";
          return;
        }
        const data = await res.json();
        const all = data?.maquinas || [];
        const isInicio = location.pathname.toLowerCase().endsWith("/admin/inicio.html");
        renderMaquinas(isInicio ? all.filter((m) => m.estado_actual === "EN_MARCHA") : all);

        const activasEl = document.querySelector("#cardActivas");
        const nextFinishEl = document.querySelector("#cardNextFinish");
        if (activasEl) {
          const activas = all.filter((m) => m.estado_actual === "EN_MARCHA").length;
          activasEl.textContent = String(activas);
        }
        if (nextFinishEl) {
          const running = all
            .filter((m) => m.estado_actual === "EN_MARCHA")
            .map((m) => ({
              codigo: m.codigo_visible,
              sec: Number(m.segundos_restantes_estimados ?? Number.MAX_SAFE_INTEGER),
            }))
            .filter((m) => Number.isFinite(m.sec) && m.sec >= 0)
            .sort((a, b) => a.sec - b.sec);
          if (!running.length) {
            nextFinishEl.textContent = "—";
          } else {
            const sec = Math.max(0, Math.floor(running[0].sec));
            const mm = Math.floor(sec / 60);
            const ss = sec % 60;
            nextFinishEl.textContent = `${running[0].codigo} · ${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
          }
        }
      } finally {
        loadMaquinas._busy = false;
      }
    }

    if (machinesGrid) {
      await loadMaquinas();
      if (machinesPollInterval) clearInterval(machinesPollInterval);
      machinesPollInterval = setInterval(() => {
        loadMaquinas().catch(() => {});
      }, 2000);
    }

    machinesGrid?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".js-start");
      const stopBtn = e.target.closest(".js-stop");
      const creditBtn = e.target.closest(".js-credit");
      const extendBtn = e.target.closest(".js-extend");
      const applyBtn = e.target.closest(".js-amount-apply");
      const cancelBtn = e.target.closest(".js-amount-cancel");

      const closeAllDrawers = () => {
        machinesGrid.querySelectorAll(".machine-drawer.is-open").forEach((d) => d.classList.remove("is-open"));
      };

      if (cancelBtn) {
        const tile = cancelBtn.closest(".machine-tile");
        tile?.querySelector(".machine-drawer")?.classList.remove("is-open");
        return;
      }

        if (creditBtn || extendBtn) {
          const tile = (creditBtn || extendBtn).closest(".machine-tile");
          if (!tile) return;
          const drawer = tile.querySelector(".machine-drawer");
          const title = tile.querySelector(".machine-drawer-title");
          const apply = tile.querySelector(".js-amount-apply");
          const input = tile.querySelector(".machine-drawer-input");
          if (!drawer || !title || !apply) return;
          closeAllDrawers();
          const isCredit = Boolean(creditBtn);
          title.textContent = isCredit ? "Añadir crédito" : "Ampliar tiempo";
          apply.setAttribute("data-mode", isCredit ? "credito" : "ampliar");
          if (input) {
            if (isCredit) {
              input.min = "0.10";
              input.max = "";
              input.step = "0.10";
            } else {
              input.min = "1.00";
              input.max = "1.00";
              input.step = "1.00";
              input.value = "1.00";
            }
          }
          drawer.classList.add("is-open");
          input?.focus();
          return;
        }

      if (applyBtn) {
        const id = Number(applyBtn.getAttribute("data-id"));
        const mode = String(applyBtn.getAttribute("data-mode") || "");
        if (!Number.isFinite(id) || id <= 0 || (mode !== "credito" && mode !== "ampliar")) return;
        const tile = applyBtn.closest(".machine-tile");
        const input = tile?.querySelector(".machine-drawer-input");
        const importe = Number(String(input?.value ?? "").replace(",", "."));
        if (!Number.isFinite(importe) || importe <= 0) return;
        applyBtn.disabled = true;
        try {
          const res = await fetch(`${API_BASE}/api/maquinas/${id}/${mode}`, {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify({ importe }),
          });
          if (!res.ok) throw new Error("AMOUNT_FAILED");
          await loadMaquinas();
        } catch {
          await loadMaquinas();
        }
        return;
      }

      const anyBtn = btn || stopBtn || creditBtn || extendBtn;
      if (!anyBtn) return;

      const id = Number(anyBtn.getAttribute("data-id"));
      if (!Number.isFinite(id) || id <= 0) return;

      const action = btn ? "iniciar" : "detener";
      const body = {};

      anyBtn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/api/maquinas/${id}/${action}`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const ebody = await res.json().catch(() => ({}));
          throw new Error(String(ebody?.error || "ACTION_FAILED"));
        }
        await loadMaquinas();
      } catch {
        notifyNice(`No se pudo ${action === "detener" ? "apagar" : "encender"} la máquina.`);
        await loadMaquinas();
      }
    });
    machinesGrid?.addEventListener("click", async (e) => {
      const fanBtn = e.target.closest(".js-fan-auto-btn");
      if (!fanBtn) return;
      const id = Number(fanBtn.getAttribute("data-id"));
      if (!Number.isFinite(id) || id <= 0) return;
      const enabled = fanBtn.getAttribute("data-enabled") !== "1";
      fanBtn.disabled = true;
      const res = await fetch(`${API_BASE}/api/maquinas/${id}/ventilador-auto`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        notifyNice("No se pudo guardar ventilador auto.");
        fanBtn.disabled = false;
        return;
      }
      await loadMaquinas();
    });
  }

  burgerBtn?.addEventListener("click", () => {
    document.body.classList.toggle("admin-menu-open");
  });

  document.addEventListener("click", (e) => {
    const sidebar = document.querySelector(".admin-sidebar");
    if (!sidebar) return;
    if (!document.body.classList.contains("admin-menu-open")) return;
    if (e.target.closest(".admin-sidebar") || e.target.closest("#adminBurger")) return;
    document.body.classList.remove("admin-menu-open");
  });

  logoutBtn?.addEventListener("click", (e) => {
    // Limpia token aunque navegue a público.
    const existing = loadAuth();
    const token = existing?.token;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    // Logout best-effort (token stateless)
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  });

  window.addEventListener("beforeunload", () => {
    if (machinesPollInterval) {
      clearInterval(machinesPollInterval);
      machinesPollInterval = null;
    }
    if (iotPollInterval) {
      clearInterval(iotPollInterval);
      iotPollInterval = null;
    }
  });

  init();
})();
