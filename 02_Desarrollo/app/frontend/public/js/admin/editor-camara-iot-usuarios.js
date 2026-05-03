        if (!webPreviewFrame) return;
        const page = String(webPreviewPage?.value || "index.html");
        const thisLoad = ++previewLoadId;
        webPreviewFrame.src = `/${page}?preview=1&cb=${Date.now()}`;
        webPreviewFrame.onload = () => {
          if (thisLoad !== previewLoadId) return;
          applyPreviewToFrame();
        };
      };

      const webPanelsByPage = {
        "index.html": "webPanelInicio",
        "about.html": "webPanelAbout",
        "contact.html": "webPanelContacto",
        "faqs.html": "webPanelFaqs",
      };
      const faqAddBtn = document.getElementById("webFaqAdd");
      const faqList = document.getElementById("webFaqList");
      const faqItemsInput = document.getElementById("web_faq_items");
      const legacyFaqGrid = document.querySelector("#webPanelFaqs > .form-grid");
      const legacyFaqQInputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`web_faq_q${i + 1}`));
      const legacyFaqAInputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`web_faq_a${i + 1}`));
      const parseFaqItems = () => {
        try {
          const raw = String(faqItemsInput?.value || "[]");
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };
      const syncFaqItemsToHidden = () => {
        if (!faqItemsInput || !faqList) return;
        const items = [...faqList.querySelectorAll(".js-faq-item")]
          .map((row) => {
            const q = row.querySelector(".js-faq-question")?.value || "";
            const a = row.querySelector(".js-faq-answer")?.value || "";
            return { q: String(q).trim(), a: String(a).trim() };
          })
          .filter((x) => x.q || x.a);
        faqItemsInput.value = JSON.stringify(items);

        // Compatibilidad con backend actual: mantener faq_q1..faq_a6 sincronizados
        for (let i = 0; i < 6; i += 1) {
          const item = items[i] || { q: "", a: "" };
          if (legacyFaqQInputs[i]) legacyFaqQInputs[i].value = String(item.q || "");
          if (legacyFaqAInputs[i]) legacyFaqAInputs[i].value = String(item.a || "");
        }
      };
      const renderFaqItems = () => {
        if (!faqList) return;
        const items = parseFaqItems();
        faqList.innerHTML = items
          .map(
            (item, idx) => `
          <article class="js-faq-item" style="border:1px solid rgba(255,255,255,.14); border-radius:12px; padding:10px;">
            <label class="field">
              <span>FAQ extra ${idx + 1} · Pregunta</span>
              <input class="entrada js-faq-question" value="${escapeHtml(String(item?.q || ""))}" />
            </label>
            <label class="field">
              <span>FAQ extra ${idx + 1} · Respuesta</span>
              <input class="entrada js-faq-answer" value="${escapeHtml(String(item?.a || ""))}" />
            </label>
            <button type="button" class="boton-secundario js-faq-remove">Eliminar FAQ</button>
          </article>
        `,
          )
          .join("");
        faqList.querySelectorAll(".js-faq-question, .js-faq-answer").forEach((el) => {
          el.addEventListener("entrada", syncFaqItemsToHidden);
        });
        faqList.querySelectorAll(".js-faq-remove").forEach((btn) => {
          btn.addEventListener("click", () => {
            btn.closest(".js-faq-item")?.remove();
            syncFaqItemsToHidden();
            renderFaqItems();
          });
        });
      };
      faqAddBtn?.addEventListener("click", () => {
        const items = parseFaqItems();
        items.push({ q: "", a: "" });
        if (faqItemsInput) faqItemsInput.value = JSON.stringify(items);
        renderFaqItems();
      });
      const foldAllWebPanels = () => {
        webEditorForm.querySelectorAll(".web-editor-panel").forEach((panel) => {
          panel.open = false;
        });
      };
      const applyWebPanelBySelectedPage = () => {
        const selectedPage = String(webPreviewPage?.value || "index.html");
        const mainPanelId = webPanelsByPage[selectedPage] || "webPanelInicio";
        const autoOpen = new Set(["webPanelNav", mainPanelId, "webPanelFooter"]);
        webEditorForm.querySelectorAll(".web-editor-panel").forEach((panel) => {
          panel.hidden = false;
          panel.open = autoOpen.has(panel.id);
        });
      };
      try {
        await loadWebEditor();
        if (legacyFaqGrid) legacyFaqGrid.hidden = true;
        // Inicializar lista dinámica desde faq_items o desde las 6 FAQs legacy
        let items = parseFaqItems();
        if (!items.length) {
          items = legacyFaqQInputs
            .map((qEl, i) => ({ q: String(qEl?.value || "").trim(), a: String(legacyFaqAInputs[i]?.value || "").trim() }))
            .filter((x) => x.q || x.a);
          if (faqItemsInput) faqItemsInput.value = JSON.stringify(items);
        }
        renderFaqItems();
        applyWebPanelBySelectedPage();
        loadPreviewFrame();
      } catch {
        notifyNice("No se pudo cargar el Editor Web.");
      }

      webPreviewPage?.addEventListener("change", () => {
        applyWebPanelBySelectedPage();
        loadPreviewFrame();
      });
      webPreviewReload?.addEventListener("click", loadPreviewFrame);

      let previewDebounce = null;
      webEditorForm.querySelectorAll("entrada, textarea, select").forEach((el) => {
        el.addEventListener("entrada", () => {
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
          const err = await r.json().catch(() => ({}));
          const detalle = String(err?.message || err?.error || `HTTP ${r.status}`);
          notifyNice(`No se pudo guardar el contenido público. ${detalle}`);
          return;
        }
        notifyNice("Contenido público guardado.", "Guardado");
        loadPreviewFrame();
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
          CAMERA2_BASE_URL: envCamera2Base?.value?.trim() || "",
          CAMERA2_USER: envCamera2User?.value?.trim() || "",
          CAMERA2_PASS: envCamera2Pass?.value || "",
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
      const ok = await callCamera("/zoom", { mode: "relative", value: -200 });
      if (ok) reconnectCameraStreams();
    });
    camDisplayApply?.addEventListener("click", async () => {
      const ok = await callCamera("/display-mode", { mode: String(camDisplayMode?.value || "surround") });
      if (ok) reconnectCameraStreams();
    });
    const getCamaraActivaParaUi = () => (camaraActiva === 2 && hayCamaraAdicional ? 2 : 1);

    let cameraBasePrincipal = "";
    const normalizarBaseCamara = (base) => String(base || "").trim().replace(/\/+$/, "");
    const construirUrlCamaraDirecta = (target) => {
      const base = normalizarBaseCamara(cameraBasePrincipal);
      if (!base) return "";
      if (target === "admin") return `${base}/admin/index.html`;
      if (target === "events") return `${base}/control/player?eventlist`;
      return `${base}/control/userimage.html`;
    };
    const openCamUi = (target) => {
      const directa = construirUrlCamaraDirecta(target);
      if (directa) {
        window.open(directa, "_blank", "noopener,noreferrer");
        return;
      }
      const url = `${API_BASE}/api/camera/ui/${encodeURIComponent(target)}?t=${encodeURIComponent(
        token,
      )}&lav=${encodeURIComponent(String(activeLavId))}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };
    camOpenMobotix?.addEventListener("click", () => openCamUi("userimage"));
    camOpenAdmin?.addEventListener("click", () => openCamUi("admin"));
    camOpenEvents?.addEventListener("click", () => openCamUi("events"));
    const abrirCamaraDesprendida = (camForzada = null) => {
      const popup = window.open("", "kwl-camera-popup", "width=1280,height=860");
      if (!popup) return;
      const camActiva = camForzada === 2 || camForzada === 1 ? camForzada : getCamaraActivaParaUi();
      const safeApi = JSON.stringify(API_BASE);
      const safeToken = JSON.stringify(token);
      const safeLav = JSON.stringify(String(activeLavId));
      const safeCam = JSON.stringify(String(camActiva));
      popup.document.write(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cámara desprendida</title>
<style>
body{margin:0;background:#0f172a;color:#e5e7eb;font-family:system-ui,sans-serif}
.bar{display:flex;gap:8px;flex-wrap:wrap;padding:10px;background:#111827;position:sticky;top:0}
button,select{padding:8px 10px;border-radius:10px;border:1px solid #334155;background:#1f2937;color:#fff;font-weight:600}
.frame{padding:10px}.frame img{width:100%;max-height:calc(100vh - 86px);object-fit:contain;object-position:center;border-radius:12px;border:1px solid #334155;background:#000}
</style></head><body>
<div class="bar">
<button id="center">Centrar</button><button id="zin">Zoom +</button><button id="zout">Zoom -</button>
<select id="mode"><option value="fullimage">Full Image</option><option value="surround">Surround</option><option value="panorama">Panorama</option></select>
<button id="apply">Aplicar modo</button>
</div>
<div class="frame"><img id="stream" alt="Cámara"></div>
<script>
const API_BASE=${safeApi}, token=${safeToken}, lav=${safeLav}, cam=${safeCam};
const stream=document.getElementById("stream");
const refresh=()=>{stream.src=\`\${API_BASE}/api/camera/faststream.mjpg?t=\${encodeURIComponent(token)}&lav=\${encodeURIComponent(lav)}&cam=\${encodeURIComponent(cam)}&cb=\${Date.now()}\`;};
const call=async(path,body)=>{await fetch(\`\${API_BASE}/api/camera\${path}\`,{method:"POST",headers:{authorization:\`Bearer \${token}\`,"x-lavanderia-id":lav,"content-type":"application/json"},body:JSON.stringify(body||{})});refresh();};
document.getElementById("center").onclick=()=>call("/ptz/center");
document.getElementById("zin").onclick=()=>call("/zoom",{mode:"relative",value:250});
document.getElementById("zout").onclick=()=>call("/zoom",{mode:"relative",value:-200});
document.getElementById("apply").onclick=()=>call("/display-mode",{mode:document.getElementById("mode").value});
refresh();
</script></body></html>`);
      popup.document.close();
    };
    camDetach?.addEventListener("click", () => abrirCamaraDesprendida());

    // Cámara: panel principal + panel adicional (si existe).
    const cameraTargets = [];
    if (cameraImg1) cameraTargets.push({ el: cameraImg1, cam: 1, mode: "mjpeg" });
    if (cameraImg2) cameraTargets.push({ el: cameraImg2, cam: 2, mode: "mjpeg" });
    let camaraActiva = 1;
    let hayCamaraAdicional = false;

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

    const panelCamara2 = document.getElementById("panelCamara2");
    const rejillaCamaras = document.querySelector(".rejilla-camaras-admin");
    const actualizarPanelesCamara = () => {
      if (panelCamara2) panelCamara2.hidden = !hayCamaraAdicional;
      if (rejillaCamaras) rejillaCamaras.classList.toggle("una-camara", !hayCamaraAdicional);
      if (cameraImg2 && !hayCamaraAdicional) cameraImg2.removeAttribute("src");
    };

    const detectarCamaraAdicional = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/configuracion/env`, {
          headers: { authorization: `Bearer ${token}`, "x-lavanderia-id": String(activeLavId) },
        });
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        const env = d?.env || {};
        cameraBasePrincipal = String(env.CAMERA_BASE_URL || "").trim();
        hayCamaraAdicional = Boolean(String(env.CAMERA2_BASE_URL || "").trim());
        actualizarPanelesCamara();
      } catch {
        cameraBasePrincipal = "";
        hayCamaraAdicional = false;
        actualizarPanelesCamara();
      }
    };
    detectarCamaraAdicional().catch(() => {});

    const enlazarControlesCamara = (cam) => {
      const suf = cam === 2 ? "2" : "1";
      const btnCenter = document.getElementById(`camCenter${suf}`);
      const btnZoomIn = document.getElementById(`camZoomIn${suf}`);
      const btnZoomOut = document.getElementById(`camZoomOut${suf}`);
      const btnDetach = document.getElementById(`camDetach${suf}`);
      const selMode = document.getElementById(`camDisplayMode${suf}`);
      const btnApply = document.getElementById(`camDisplayApply${suf}`);
      btnCenter?.addEventListener("click", async () => { await callCamera("/ptz/center", { cam }); reconnectCameraStreams(); });
      btnZoomIn?.addEventListener("click", async () => { await callCamera("/zoom", { mode: "relative", value: 250, cam }); reconnectCameraStreams(); });
      btnZoomOut?.addEventListener("click", async () => { await callCamera("/zoom", { mode: "relative", value: -200, cam }); reconnectCameraStreams(); });
      btnApply?.addEventListener("click", async () => { await callCamera("/display-mode", { mode: String(selMode?.value || "surround"), cam }); reconnectCameraStreams(); });
      btnDetach?.addEventListener("click", () => abrirCamaraDesprendida(cam));
    };
    enlazarControlesCamara(1);
    enlazarControlesCamara(2);

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
      el.classList.toggle("estado-iot-encendido", Boolean(on));
      el.classList.toggle("estado-iot-apagado", !on);
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
        el.addEventListener("entrada", () => {
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
        ? [...iotOpenMachines.querySelectorAll("entrada[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
      const selectedCloseMachines = iotCloseMachines
        ? [...iotCloseMachines.querySelectorAll("entrada[type='checkbox']:checked")].map((i) => Number(i.value)).filter((n) => Number.isFinite(n) && n > 0)
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
            <div class="acciones-usuarios-linea">
              <button type="button" class="boton-secundario js-user-edit" data-id="${Number(u.id_usuario)}">Editar</button>
              <button type="button" class="boton-secundario js-user-lavs" data-id="${Number(u.id_usuario)}">Tiendas</button>
              <button type="button" class="boton-secundario js-user-toggle" data-id="${Number(u.id_usuario)}" ${
                canToggle ? "" : "disabled"
              }>${u.activo ? "Desactivar" : "Activar"}</button>
              <button type="button" class="boton-secundario js-user-delete" data-id="${Number(u.id_usuario)}" ${
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

    usersSearch?.addEventListener("entrada", () => {
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
