(() => {
  const STORAGE_KEY = "kwl_auth";
  const ACTIVE_LAV_KEY = "kwl_lavanderia_activa";

  const $ = (s, c = document) => c.querySelector(s);

  const cardBackend = $("#cardBackend");
  const healthLine = $("#healthLine");
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
  const storeOpenTime = $("#storeOpenTime");
  const storeCloseTime = $("#storeCloseTime");
  const storeOpenMachines = $("#storeOpenMachines");
  const openDoor = $("#openDoor");
  const openLights = $("#openLights");
  const openFan = $("#openFan");
  const closeDoor = $("#closeDoor");
  const closeLights = $("#closeLights");
  const closeFan = $("#closeFan");
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
  const cameraImg = $("#cameraStream");
  const cameraImg1 = $("#cameraStream1");
  const cameraImg2 = $("#cameraStream2");
  const cameraHint = $("#cameraHint");
  const quickDoorBtn = $("#quickDoorBtn");
  const quickLightsBtn = $("#quickLightsBtn");
  const quickAudioBtn = $("#quickAudioBtn");
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
  const doorToggle = $("#doorToggle");
  const lightsToggle = $("#lightsToggle");
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

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
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
    // Si alguien entra a /admin/usuarios.html sin ser admin: fuera.
    if (!isAdmin && location.pathname.toLowerCase().endsWith("/admin/usuarios.html")) {
      window.location.href = "/admin/inicio.html";
    }
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
    const res = await fetch("http://127.0.0.1:8080/api/lavanderias", {
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
      const canExtend = estado === "EN_MARCHA";
      const rest = Number(m.minutos_restantes_estimados ?? 0);
      el.innerHTML = `
        <div class="machine-meta">
          <strong>${m.codigo_visible}</strong>
          <span>${tipoLabel(m.tipo_maquina)}</span>
        </div>
        <div class="machine-state">
          <span class="state-pill ${stateClass(estado)}">${estado}</span>
          <span class="machine-timer">${rest > 0 ? `~${rest} min` : "—"}</span>
        </div>
        <div class="machine-actions">
          <button type="button" class="btn-primary js-start" data-id="${id}" ${canStart ? "" : "disabled"}>Encender</button>
          <button type="button" class="btn-secondary js-stop" data-id="${id}" ${canStop ? "" : "disabled"}>Apagar</button>
          ${canCredit ? `<button type="button" class="btn-secondary js-credit" data-id="${id}">Crédito</button>` : ""}
          ${canExtend ? `<button type="button" class="btn-secondary js-extend" data-id="${id}">Ampliar</button>` : ""}
        </div>
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
    setActiveNav();
    setBreadcrumbs();
    applyRoleUI(rol);

    let activeLavId = getActiveLavanderiaId();
    try {
      const l = await fetchLavanderias(token);
      const list = l?.lavanderias || [];
      if (list.length) {
        // Si el active no está permitido, cae al primero.
        if (!list.some((x) => x.id_lavanderia === activeLavId)) activeLavId = list[0].id_lavanderia;
        setLavUI(list, activeLavId);

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
    try {
      const healthRes = await fetch("http://127.0.0.1:8080/health");
      const health = await healthRes.json();
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
      const r = await fetch(`http://127.0.0.1:8080/api/caja/dia?date=${encodeURIComponent(date)}`, {
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
    if (storeConfigSave) {
      storeConfigSave.addEventListener("click", async () => {
        storeConfigSave.disabled = true;
        const actionsPayload = {
          abrir_tienda: {
            puerta_abierta: Boolean(openDoor?.checked),
            luces_encendidas: Boolean(openLights?.checked),
            ventilacion_encendida: Boolean(openFan?.checked),
          },
          cerrar_tienda: {
            puerta_abierta: Boolean(closeDoor?.checked),
            luces_encendidas: Boolean(closeLights?.checked),
            ventilacion_encendida: Boolean(closeFan?.checked),
          },
        };
        const schedulePayload = {
          puerta: { on: openDoor?.checked ? (storeOpenTime?.value || null) : null, off: closeDoor?.checked ? (storeCloseTime?.value || null) : null },
          luces: { on: openLights?.checked ? (storeOpenTime?.value || null) : null, off: closeLights?.checked ? (storeCloseTime?.value || null) : null },
          ventilacion: { on: openFan?.checked ? (storeOpenTime?.value || null) : null, off: closeFan?.checked ? (storeCloseTime?.value || null) : null },
        };
        const selectedMachines = storeOpenMachines
          ? [...storeOpenMachines.querySelectorAll("input[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
          : [];
        const [aRes, sRes, mRes] = await Promise.all([
          fetch("http://127.0.0.1:8080/api/iot/store-actions", {
            method: "PUT",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify(actionsPayload),
          }),
          fetch("http://127.0.0.1:8080/api/iot/schedule", {
            method: "PUT",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify(schedulePayload),
          }),
          fetch("http://127.0.0.1:8080/api/iot/store-open-machines", {
            method: "PUT",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify({ maquinas: selectedMachines }),
          }),
        ]);
        storeConfigSave.disabled = false;
        if (aRes.ok && sRes.ok && mRes.ok) {
          storeConfigDialog?.close();
          return;
        }
        window.alert("No se pudo guardar la configuración.");
      });
    }
    if (storeConfigDialog) {
      const [r, s, machinesRes, selectedRes] = await Promise.all([
        fetch("http://127.0.0.1:8080/api/iot/store-actions", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch("http://127.0.0.1:8080/api/iot/schedule", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch("http://127.0.0.1:8080/api/maquinas", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch("http://127.0.0.1:8080/api/iot/store-open-machines", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
      ]);
      if (r.ok) {
        const d = await r.json();
        if (openDoor) openDoor.checked = Boolean(d?.actions?.abrir_tienda?.puerta_abierta);
        if (openLights) openLights.checked = Boolean(d?.actions?.abrir_tienda?.luces_encendidas);
        if (openFan) openFan.checked = Boolean(d?.actions?.abrir_tienda?.ventilacion_encendida);
        if (closeDoor) closeDoor.checked = Boolean(d?.actions?.cerrar_tienda?.puerta_abierta);
        if (closeLights) closeLights.checked = Boolean(d?.actions?.cerrar_tienda?.luces_encendidas);
        if (closeFan) closeFan.checked = Boolean(d?.actions?.cerrar_tienda?.ventilacion_encendida);
      }
      if (s.ok) {
        const d = await s.json();
        if (storeOpenTime) storeOpenTime.value = d?.schedule?.puerta?.on || d?.schedule?.luces?.on || d?.schedule?.ventilacion?.on || "";
        if (storeCloseTime) storeCloseTime.value = d?.schedule?.puerta?.off || d?.schedule?.luces?.off || d?.schedule?.ventilacion?.off || "";
      }
      if (storeOpenMachines) {
        const allMachines = machinesRes.ok ? (await machinesRes.json())?.maquinas || [] : [];
        const selectedIds = selectedRes.ok ? (await selectedRes.json())?.maquinas || [] : [];
        const selected = new Set(selectedIds.map((x) => Number(x)));
        storeOpenMachines.innerHTML = allMachines
          .map((m) => `<label><input type="checkbox" value="${m.id_maquina}" ${selected.has(Number(m.id_maquina)) ? "checked" : ""} /> ${m.codigo_visible}</label>`)
          .join("");
      }
    }
    const loadEnvFromBackend = async () => {
      const r = await fetch("http://127.0.0.1:8080/api/configuracion/env", {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      if (!r.ok) throw new Error("ENV_LOAD_FAILED");
      const d = await r.json();
      if (envCameraBase) envCameraBase.value = d?.env?.CAMERA_BASE_URL || "";
      if (envCameraUser) envCameraUser.value = d?.env?.CAMERA_USER || "";
      if (envCameraPass) envCameraPass.value = d?.env?.CAMERA_PASS || "";
      if (envMqttUrl) envMqttUrl.value = d?.env?.MQTT_URL || "";
    };
    storeEnvBtn?.addEventListener("click", async () => {
      try {
        await loadEnvFromBackend();
        storeEnvDialog?.showModal();
      } catch {
        window.alert("No se pudieron cargar ajustes.");
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
      const r = await fetch("http://127.0.0.1:8080/api/configuracion/env", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify(next),
      });
      if (!r.ok) {
        window.alert("No se pudieron guardar ajustes.");
        return;
      }
      storeEnvDialog?.close();
    });
    if (storeOpenBtn) {
      storeOpenBtn.addEventListener("click", async () => {
        await fetch("http://127.0.0.1:8080/api/iot/store/open", {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId), "content-type": "application/json" },
          body: "{}",
        });
      });
    }
    if (storeCloseBtn) {
      storeCloseBtn.addEventListener("click", async () => {
        await fetch("http://127.0.0.1:8080/api/iot/store/close", {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId), "content-type": "application/json" },
          body: "{}",
        });
      });
    }

    // Cámara (si hay botones en esta vista)
    const callCamera = async (path, body) => {
      const res = await fetch(`http://127.0.0.1:8080/api/camera${path}`, {
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

    camCenter?.addEventListener("click", async () => {
      await callCamera("/ptz/center");
    });
    camZoomIn?.addEventListener("click", async () => {
      await callCamera("/zoom", { mode: "relative", value: 250 });
    });
    camZoomOut?.addEventListener("click", async () => {
      await callCamera("/zoom", { mode: "relative", value: -250 });
    });
    camZoom1x?.addEventListener("click", async () => {
      await callCamera("/zoom", { mode: "absolute", value: 1000 });
    });
    camZoom2x?.addEventListener("click", async () => {
      await callCamera("/zoom", { mode: "absolute", value: 2000 });
    });
    camZoom4x?.addEventListener("click", async () => {
      await callCamera("/zoom", { mode: "absolute", value: 4000 });
    });
    camZoom8x?.addEventListener("click", async () => {
      await callCamera("/zoom", { mode: "absolute", value: 8000 });
    });

    // Stream: <img> usa token en query param (no Authorization)
    const cameraTargets = [];
    if (cameraImg) cameraTargets.push({ el: cameraImg, cam: null });
    if (cameraImg1) cameraTargets.push({ el: cameraImg1, cam: 1 });
    if (cameraImg2) cameraTargets.push({ el: cameraImg2, cam: 2 });

    if (cameraTargets.length) {
      const setSnap = () => {
        const cacheBust = Date.now();
        cameraTargets.forEach(({ el, cam }) => {
          const camParam = cam === 1 || cam === 2 ? `&cam=${cam}` : "";
          el.src = `http://127.0.0.1:8080/api/camera/stream.jpg?t=${encodeURIComponent(token)}&lav=${encodeURIComponent(
            String(activeLavId),
          )}${camParam}&cb=${cacheBust}`;
        });
      };
      setSnap();
      window.setInterval(setSnap, 1200);
      cameraTargets.forEach(({ el }) =>
        el.addEventListener("error", () => {
          if (cameraHint) {
            cameraHint.textContent = "Cámara no disponible (credenciales o URL no configuradas).";
          }
        }),
      );
    }

    // IOT / Programador
    const isIotView = Boolean(iotSaveSchedule || doorToggle || lightsToggle || fanOn);
    let currentIotState = { puerta_abierta: false, luces_encendidas: false, ventilacion_encendida: false };
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
      setIotHint("");
      const [stateRes, schRes, approxRes] = await Promise.all([
        fetch("http://127.0.0.1:8080/api/iot/state", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch("http://127.0.0.1:8080/api/iot/schedule", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch("http://127.0.0.1:8080/api/iot/approx-state", {
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
        puerta_abierta: Boolean(approx.puerta_abierta),
        luces_encendidas: Boolean(approx.luces_encendidas),
        ventilacion_encendida: Boolean(st.ventilacion_encendida),
      };
      setPill(doorState, approx.puerta_abierta);
      setPill(lightsState, approx.luces_encendidas);
      setPill(fanState, st.ventilacion_encendida);

      const sc = schData?.schedule || {};
      if (doorOn) doorOn.value = sc?.puerta?.on || "";
      if (doorOff) doorOff.value = sc?.puerta?.off || "";
      if (lightsOnTime) lightsOnTime.value = sc?.luces?.on || "";
      if (lightsOffTime) lightsOffTime.value = sc?.luces?.off || "";
      if (fanOnTime) fanOnTime.value = sc?.ventilacion?.on || "";
      if (fanOffTime) fanOffTime.value = sc?.ventilacion?.off || "";
    };

    const saveState = async (nextState) => {
      const payload = { ...currentIotState, ...nextState };
      const res = await fetch("http://127.0.0.1:8080/api/iot/state", {
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
      const r = await fetch("http://127.0.0.1:8080/api/camera/relay/pulse", {
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
    const registerRelayToggle = async (device) => {
      const r = await fetch("http://127.0.0.1:8080/api/iot/relay-action", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify({ dispositivo: device }),
      });
      if (!r.ok) throw new Error("RELAY_LOG_FAILED");
    };

    quickDoorBtn?.addEventListener("click", async () => {
      if (!window.confirm("¿Confirmas cambiar estado de puerta?")) return;
      try {
        await triggerRelayPulse("door");
        await registerRelayToggle("puerta");
        await loadIot();
      } catch {
        window.alert("No se pudo cambiar puerta.");
      }
    });
    quickLightsBtn?.addEventListener("click", async () => {
      try {
        await triggerRelayPulse("lights");
        await registerRelayToggle("luces");
        await loadIot();
      } catch {
        window.alert("No se pudo cambiar luces.");
      }
    });
    quickAudioBtn?.addEventListener("click", async () => {
      if (!window.confirm("¿Reproducir audio en la tienda?")) return;
      try {
        const r = await fetch("http://127.0.0.1:8080/api/camera/audio/play", {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify({ soundfile: "PUBLICIDAD" }),
        });
        if (!r.ok) throw new Error("AUDIO_FAILED");
      } catch {
        window.alert("No se pudo reproducir audio.");
      }
    });

    doorToggle?.addEventListener("click", async () => {
      try {
        await triggerRelayPulse("door");
        await registerRelayToggle("puerta");
        await loadIot();
      } catch {
        setIotHint("Error en pulso de puerta.");
      }
    });
    lightsToggle?.addEventListener("click", async () => {
      try {
        await triggerRelayPulse("lights");
        await registerRelayToggle("luces");
        await loadIot();
      } catch {
        setIotHint("Error en pulso de luces.");
      }
    });
    doorState?.addEventListener("click", async () => {
      try {
        await registerRelayToggle("puerta");
        await loadIot();
      } catch {
        setIotHint("Error al actualizar estado aproximado de puerta.");
      }
    });
    lightsState?.addEventListener("click", async () => {
      try {
        await registerRelayToggle("luces");
        await loadIot();
      } catch {
        setIotHint("Error al actualizar estado aproximado de luces.");
      }
    });
    fanOn?.addEventListener("click", async () => {
      await saveState({ ventilacion_encendida: true });
    });
    fanOff?.addEventListener("click", async () => {
      await saveState({ ventilacion_encendida: false });
    });

    iotSaveSchedule?.addEventListener("click", async () => {
      setIotHint("");
      const payload = {
        puerta: { on: String(doorOn?.value ?? "").trim() || null, off: String(doorOff?.value ?? "").trim() || null },
        luces: { on: String(lightsOnTime?.value ?? "").trim() || null, off: String(lightsOffTime?.value ?? "").trim() || null },
        ventilacion: { on: String(fanOnTime?.value ?? "").trim() || null, off: String(fanOffTime?.value ?? "").trim() || null },
      };
      const res = await fetch("http://127.0.0.1:8080/api/iot/schedule", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-lavanderia-id": String(activeLavId),
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIotHint(`Error: ${data?.error || "NO_OK"} (solo ADMIN)`);
        return;
      }
      setIotHint("Guardado.");
      await loadIot();
    });

    if (isIotView) {
      await loadIot();
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
          <td>${fullName || "—"}</td>
          <td>${u.email}</td>
          <td>${u.rol}</td>
          <td>${pill}</td>
          <td>${formatDate(u.ultimo_acceso)}</td>
          <td>
            <div class="users-actions-inline">
              <button type="button" class="btn-secondary js-user-edit" data-id="${u.id_usuario}">Editar</button>
              <button type="button" class="btn-secondary js-user-lavs" data-id="${u.id_usuario}">Tiendas</button>
              <button type="button" class="btn-secondary js-user-toggle" data-id="${u.id_usuario}" ${
                canToggle ? "" : "disabled"
              }>${u.activo ? "Desactivar" : "Activar"}</button>
              <button type="button" class="btn-secondary js-user-delete" data-id="${u.id_usuario}" ${
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
      const res = await fetch("http://127.0.0.1:8080/api/usuarios", {
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
            fetch("http://127.0.0.1:8080/api/lavanderias", {
              headers: { authorization: `Bearer ${token}` },
            }),
            fetch(`http://127.0.0.1:8080/api/usuarios/${id}/lavanderias`, {
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
          const r = await fetch(`http://127.0.0.1:8080/api/usuarios/${id}/lavanderias`, {
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
          const r = await fetch(`http://127.0.0.1:8080/api/usuarios/${id}/${action}`, {
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
        if (!window.confirm(`¿Borrar usuario ${user.email}?`)) return;
        try {
          const r = await fetch(`http://127.0.0.1:8080/api/usuarios/${id}`, {
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
        mode === "edit" && id > 0 ? `http://127.0.0.1:8080/api/usuarios/${id}` : "http://127.0.0.1:8080/api/usuarios";
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
        cashTbody.innerHTML = `<tr><td colspan="4">Sin movimientos</td></tr>`;
      } else {
        items.forEach((it) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${it.codigo_visible}</td>
            <td>${it.tipo_maquina}</td>
            <td>${it.movimientos}</td>
            <td>${eur(it.importe_total)}</td>
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
      const res = await fetch(`http://127.0.0.1:8080/api/caja/${path}`, {
        headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCashHint(`Error: ${data?.error || "NO_OK"}`);
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
        b.addEventListener("click", () => {
          setCashView(b.getAttribute("data-tab") || "dia");
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

    // Informes (Ciclos)
    const isReportsView = Boolean(repTbody);
    if (isReportsView) {
      const today = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const t = today();
      if (repFrom && !repFrom.value) repFrom.value = t;
      if (repTo && !repTo.value) repTo.value = t;

      let offset = 0;
      const limit = 25;

      const setHint = (text) => {
        if (!repHint) return;
        repHint.textContent = text || "";
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

      const setReportsTab = (tab) => {
        document.querySelectorAll(".reports-tab").forEach((b) => {
          const active = b.getAttribute("data-tab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        document.querySelectorAll(".reports-view").forEach((v) => {
          const show = v.getAttribute("data-view") === tab;
          v.hidden = !show;
        });
      };

      document.querySelectorAll(".reports-tab").forEach((b) => {
        b.addEventListener("click", () => setReportsTab(b.getAttribute("data-tab") || "ciclos"));
      });
      setReportsTab("ciclos");

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

        const res = await fetch(`http://127.0.0.1:8080/api/informes/ciclos?${qs.toString()}`, {
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
              <td>${c.id_ciclo}</td>
              <td>${c.codigo_visible} (${c.tipo_maquina})</td>
              <td>${fmt(c.fecha_hora_inicio)}</td>
              <td>${fmt(c.fecha_hora_fin)}</td>
              <td>${c.estado_ciclo}</td>
              <td>${c.duracion_total_programada_min}</td>
              <td>${eur(c.importe_total_aplicado)}</td>
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

      await loadCiclos();
    }

    async function loadMaquinas() {
      const res = await fetch("http://127.0.0.1:8080/api/maquinas", {
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
          .map((m) => ({ codigo: m.codigo_visible, min: Number(m.minutos_restantes_estimados ?? Number.MAX_SAFE_INTEGER) }))
          .filter((m) => Number.isFinite(m.min) && m.min >= 0)
          .sort((a, b) => a.min - b.min);
        nextFinishEl.textContent = running.length ? `${running[0].codigo} · ${running[0].min} min` : "—";
      }
    }

    if (machinesGrid) {
      await loadMaquinas();
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
        if (!drawer || !title || !apply) return;
        closeAllDrawers();
        const isCredit = Boolean(creditBtn);
        title.textContent = isCredit ? "Añadir crédito" : "Ampliar tiempo";
        apply.setAttribute("data-mode", isCredit ? "credito" : "ampliar");
        drawer.classList.add("is-open");
        const input = tile.querySelector(".machine-drawer-input");
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
          const res = await fetch(`http://127.0.0.1:8080/api/maquinas/${id}/${mode}`, {
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
        const res = await fetch(`http://127.0.0.1:8080/api/maquinas/${id}/${action}`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("ACTION_FAILED");
        await loadMaquinas();
      } catch {
        await loadMaquinas();
      }
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
      fetch("http://127.0.0.1:8080/api/auth/logout", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  });

  init();
})();
