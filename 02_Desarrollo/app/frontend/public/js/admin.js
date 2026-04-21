(() => {
  const STORAGE_KEY = "kwl_auth";
  const ACTIVE_LAV_KEY = "kwl_lavanderia_activa";

  const $ = (s, c = document) => c.querySelector(s);

  const cardBackend = $("#cardBackend");
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
  const cameraImg = $("#cameraStream");
  const cameraHint = $("#cameraHint");
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
  const doorOpen = $("#doorOpen");
  const doorClose = $("#doorClose");
  const lightsOn = $("#lightsOn");
  const lightsOff = $("#lightsOff");
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
      opt.textContent = l.nombre || `Lavandería ${l.id_lavanderia}`;
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
      const canExtend = estado === "EN_MARCHA" || estado === "PAUSADA";
      el.innerHTML = `
        <div class="machine-meta">
          <strong>${m.codigo_visible}</strong>
          <span>${tipoLabel(m.tipo_maquina)}</span>
        </div>
        <div class="machine-state">
          <span class="state-pill ${stateClass(estado)}">${estado}</span>
        </div>
        <div class="machine-actions">
          <button type="button" class="btn-primary js-start" data-id="${id}" ${canStart ? "" : "disabled"}>Iniciar</button>
          <button type="button" class="btn-secondary js-stop" data-id="${id}" ${canStop ? "" : "disabled"}>Detener</button>
          <button type="button" class="btn-secondary js-extend" data-id="${id}" ${canExtend ? "" : "disabled"}>Ampliar</button>
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
    } catch {
      setText(cardBackend, "Desconectado");
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

    // Stream: <img> usa token en query param (no Authorization)
    if (cameraImg) {
      const setSnap = () => {
        const cacheBust = Date.now();
        cameraImg.src = `http://127.0.0.1:8080/api/camera/stream.jpg?t=${encodeURIComponent(token)}&cb=${cacheBust}`;
      };
      setSnap();
      // "Vídeo" simple: refresca snapshot.
      window.setInterval(setSnap, 1200);
      cameraImg.addEventListener("error", () => {
        if (cameraHint) {
          cameraHint.textContent = "Cámara no disponible (credenciales o URL no configuradas).";
        }
      });
    }

    // IOT / Programador
    const isIotView = Boolean(iotSaveSchedule || doorOpen || lightsOn || fanOn);
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
      const [stateRes, schRes] = await Promise.all([
        fetch("http://127.0.0.1:8080/api/iot/state", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
        fetch("http://127.0.0.1:8080/api/iot/schedule", {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        }),
      ]);
      if (!stateRes.ok || !schRes.ok) {
        setIotHint("No hay permiso o backend caído.");
        return;
      }
      const stateData = await stateRes.json();
      const schData = await schRes.json();
      const st = stateData?.state || {};
      currentIotState = {
        puerta_abierta: Boolean(st.puerta_abierta),
        luces_encendidas: Boolean(st.luces_encendidas),
        ventilacion_encendida: Boolean(st.ventilacion_encendida),
      };
      setPill(doorState, st.puerta_abierta);
      setPill(lightsState, st.luces_encendidas);
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

    doorOpen?.addEventListener("click", async () => {
      await saveState({ puerta_abierta: true });
    });
    doorClose?.addEventListener("click", async () => {
      await saveState({ puerta_abierta: false });
    });
    lightsOn?.addEventListener("click", async () => {
      await saveState({ luces_encendidas: true });
    });
    lightsOff?.addEventListener("click", async () => {
      await saveState({ luces_encendidas: false });
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
              <button type="button" class="btn-secondary js-user-toggle" data-id="${u.id_usuario}" ${
                canToggle ? "" : "disabled"
              }>${u.activo ? "Desactivar" : "Activar"}</button>
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
      const toggleBtn = e.target.closest(".js-user-toggle");
      if (!editBtn && !toggleBtn) return;

      const id = Number((editBtn || toggleBtn).getAttribute("data-id"));
      const user = usersCache.find((x) => Number(x.id_usuario) === id);
      if (!user) return;

      if (editBtn) {
        openDialog("edit", user);
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
      renderMaquinas(data?.maquinas || []);

      // Resumen (si existe)
      const activasEl = document.querySelector("#cardActivas");
      if (activasEl) {
        const activas = (data?.maquinas || []).filter((m) => m.estado_actual === "EN_MARCHA").length;
        activasEl.textContent = String(activas);
      }
    }

    if (machinesGrid) {
      await loadMaquinas();
    }

    machinesGrid?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".js-start");
      const stopBtn = e.target.closest(".js-stop");
      const extendBtn = e.target.closest(".js-extend");
      const anyBtn = btn || stopBtn || extendBtn;
      if (!anyBtn) return;

      const id = Number(anyBtn.getAttribute("data-id"));
      if (!Number.isFinite(id) || id <= 0) return;

      // Ampliar pide importe
      if (extendBtn) {
        const raw = window.prompt("¿Cuánto quieres ampliar? (euros)", "1");
        if (raw === null) return;
        const importe = Number(String(raw).replace(",", "."));
        if (!Number.isFinite(importe) || importe <= 0) return;

        anyBtn.disabled = true;
        try {
          const res = await fetch(`http://127.0.0.1:8080/api/maquinas/${id}/ampliar`, {
            method: "POST",
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
              "content-type": "application/json",
            },
            body: JSON.stringify({ importe }),
          });
          if (!res.ok) throw new Error("EXTEND_FAILED");
          await loadMaquinas();
        } catch {
          await loadMaquinas();
        }
        return;
      }

      anyBtn.disabled = true;
      const action = btn ? "iniciar" : "detener";
      try {
        const res = await fetch(`http://127.0.0.1:8080/api/maquinas/${id}/${action}`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "x-lavanderia-id": String(activeLavId),
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
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
