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
    const cashSearch = document.getElementById("cashSearch");
    const cashFilterBar = document.getElementById("cashFilterBar");
    const cashControlsRow = document.getElementById("cashControlsRow");
    const cashSummaryTitle = document.getElementById("cashSummaryTitle");
    const cashWeekDate = document.getElementById("cashWeekDate");
    const cashFilterType = document.getElementById("cashFilterType");
    const cashFilterMoves = document.getElementById("cashFilterMoves");
    const cashAmountMax = document.getElementById("cashAmountMax");
    const cashAmountLabel = document.getElementById("cashAmountLabel");
    const cashTopMachine = document.getElementById("cashTopMachine");
    const cashMonth = document.getElementById("cashMonth");
    const cashYear = document.getElementById("cashYear");
    const cashLoadMonth = document.getElementById("cashLoadMonth");
    const cashLoadYear = document.getElementById("cashLoadYear");
    const cashApplyFilters = document.getElementById("cashApplyFilters");
    const cashClearFilters = document.getElementById("cashClearFilters");
    const cashFilterHint = document.getElementById("cashFilterHint");
    let cashRawItems = [];
    const setCashHint = (text) => {
      if (!cashHint) return;
      cashHint.hidden = !text;
      cashHint.textContent = text || "";
    };
    const setCashFilterHint = (text) => {
      if (!cashFilterHint) return;
      cashFilterHint.hidden = !text;
      cashFilterHint.textContent = text || "";
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
    const isoWeekValueFromDate = (dateStr) => {
      const d = new Date(`${dateStr}T00:00:00`);
      const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = utc.getUTCDay() || 7;
      utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    };
    const isoWeekToMonday = (weekVal) => {
      const m = /^(\d{4})-W(\d{2})$/.exec(String(weekVal || ""));
      if (!m) return "";
      const year = Number(m[1]);
      const week = Number(m[2]);
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const jan4Day = jan4.getUTCDay() || 7;
      const mondayWeek1 = new Date(jan4);
      mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
      const monday = new Date(mondayWeek1);
      monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
      return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
    };
    const populateWeekOptions = (anchorDate) => {
      if (!cashWeekDate) return;
      const d = new Date(`${anchorDate}T00:00:00`);
      const options = [];
      for (let i = 0; i < 60; i += 1) {
        const base = new Date(d);
        base.setDate(base.getDate() - i * 7);
        const iso = isoWeekValueFromDate(base.toISOString().slice(0, 10));
        const monday = isoWeekToMonday(iso);
        const monDate = new Date(`${monday}T00:00:00`);
        const sunday = new Date(monDate);
        sunday.setDate(monDate.getDate() + 6);
        const ddm = `${String(monDate.getDate()).padStart(2, "0")}/${String(monDate.getMonth() + 1).padStart(2, "0")}`;
        const dds = `${String(sunday.getDate()).padStart(2, "0")}/${String(sunday.getMonth() + 1).padStart(2, "0")}`;
        const year = iso.slice(0, 4);
        const wNum = Number(iso.slice(6));
        const month = String(monDate.getMonth() + 1).padStart(2, "0");
        options.push({ iso, label: `${year}-${month} · Semana ${wNum} (${ddm}-${dds})` });
      }
      const uniq = [];
      const seen = new Set();
      options.forEach((o) => {
        if (seen.has(o.iso)) return;
        seen.add(o.iso);
        uniq.push(o);
      });
      cashWeekDate.innerHTML = uniq.map((o) => `<option value="${o.iso}">${o.label}</option>`).join("");
    };
    const renderCashRows = (items) => {
      if (!cashTbody) return;
      setCashHint("");
      setCashFilterHint("");
      cashTbody.innerHTML = "";
      if (!items.length) {
        cashTbody.innerHTML = `<tr><td colspan="6" class="table-empty">Sin actividad en el periodo seleccionado</td></tr>`;
      } else {
        items.forEach((it) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${escapeHtml(it.codigo_visible)}</td>
            <td>${escapeHtml(it.tipo_maquina)}</td>
            <td>${escapeHtml(it.movimientos)}</td>
            <td>${escapeHtml(eur(it.importe))}</td>
            <td>${escapeHtml(eur(it.abonado))}</td>
            <td>${escapeHtml(eur(it.total))}</td>
          `;
          cashTbody.appendChild(tr);
        });
      }
    };
    const applyCashFilters = () => {
      const q = String(cashSearch?.value ?? "").trim().toLowerCase();
      const type = String(cashFilterType?.value ?? "").trim();
      const moves = String(cashFilterMoves?.value ?? "").trim();
      const maxAmount = Number(cashAmountMax?.value ?? 2000);

      const filtered = cashRawItems.filter((it) => {
        if (type && String(it.tipo_maquina) !== type) return false;
        if (moves) {
          const m = Number(it.movimientos ?? 0);
          if (moves === "0" && m !== 0) return false;
          if (moves === "1-5" && (m < 1 || m > 5)) return false;
          if (moves === "6-15" && (m < 6 || m > 15)) return false;
          if (moves === "16+" && m < 16) return false;
        }
        const a = Number(it.total ?? 0);
        if (!(a <= maxAmount)) return false;
        if (!q) return true;
        const rowText = `${it.codigo_visible} ${it.tipo_maquina} ${it.movimientos} ${eur(it.importe)} ${eur(it.abonado)} ${eur(it.total)}`.toLowerCase();
        return rowText.includes(q);
      });

      renderCashRows(filtered);
      if (!filtered.length && cashRawItems.length) {
        setCashFilterHint("No hay resultados con los filtros actuales.");
      }
    };
    const renderCash = (data) => {
      cashRawItems = Array.isArray(data?.items) ? data.items : [];
      applyCashFilters();
      if (cashMoves) cashMoves.textContent = String(data?.movimientos ?? "0");
      if (cashTotal) cashTotal.textContent = eur(data?.total ?? 0);
      const top = [...cashRawItems].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0];
      if (cashTopMachine) {
        cashTopMachine.textContent = top
          ? `${top.codigo_visible} · ${eur(top.total)} · ${top.movimientos} mov.`
          : "Sin actividad";
      }
    };
    const updateAmountLabel = () => {
      if (!cashAmountLabel) return;
      const maxAmount = Number(cashAmountMax?.value ?? 2000);
      cashAmountLabel.textContent = `${maxAmount}€`;
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
      document.querySelectorAll(".pestana-caja").forEach((b) => {
        const active = b.getAttribute("data-tab") === view;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      document.querySelectorAll(".filtro-caja").forEach((f) => {
        const show = f.getAttribute("data-view") === view;
        f.hidden = !show;
        f.style.display = show ? "" : "none";
      });
      if (cashFilterBar) cashFilterBar.hidden = view !== "dia";
      if (cashControlsRow) {
        cashControlsRow.classList.toggle("is-range-view", view === "rango");
      }
      if (cashSummaryTitle) {
        if (view === "dia") cashSummaryTitle.textContent = "Resumen Diario";
        else if (view === "semana") cashSummaryTitle.textContent = "Resumen Semanal";
        else if (view === "mensual") cashSummaryTitle.textContent = "Resumen Mensual";
        else if (view === "anual") cashSummaryTitle.textContent = "Resumen Anual";
        else cashSummaryTitle.textContent = "Resumen Acumulado";
      }
    };

    if (isCashView) {
      const t = today();
      if (cashDay && !cashDay.value) cashDay.value = t;
      populateWeekOptions(t);
      if (cashWeekDate && !cashWeekDate.value) cashWeekDate.value = isoWeekValueFromDate(t);
      if (cashMonth && !cashMonth.value) cashMonth.value = t.slice(0, 7);
      if (cashYear && !cashYear.value) cashYear.value = String(new Date().getFullYear());
      if (cashFrom && !cashFrom.value) cashFrom.value = t.slice(0, 8) + "01";
      if (cashTo && !cashTo.value) cashTo.value = t;

      document.querySelectorAll(".pestana-caja").forEach((b) => {
        b.addEventListener("click", async () => {
          const view = b.getAttribute("data-tab") || "dia";
          setCashView(view);
          if (view === "dia") {
            const d = String(cashDay?.value ?? "").trim() || t;
            await loadCash(`dia?date=${encodeURIComponent(d)}`);
            return;
          }
          if (view === "semana") {
            const w = String(cashWeekDate?.value ?? "").trim();
            const monday = w ? isoWeekToMonday(w) : t;
            await loadCash(`semana?date=${encodeURIComponent(monday)}`);
            return;
          }
          if (view === "mensual") {
            const m = String(cashMonth?.value ?? "").trim() || t.slice(0, 7);
            await loadCash(`mensual?month=${encodeURIComponent(m)}`);
            return;
          }
          if (view === "anual") {
            const y = String(cashYear?.value ?? "").trim() || String(new Date().getFullYear());
            await loadCash(`anual?year=${encodeURIComponent(y)}`);
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
        const w = String(cashWeekDate?.value ?? "").trim();
        if (!w) return;
        const monday = isoWeekToMonday(w);
        if (!monday) return;
        loadCash(`semana?date=${encodeURIComponent(monday)}`);
      });
      cashLoadMonth?.addEventListener("click", () => {
        const m = String(cashMonth?.value ?? "").trim();
        if (!m) return;
        loadCash(`mensual?month=${encodeURIComponent(m)}`);
      });
      cashLoadYear?.addEventListener("click", () => {
        const y = String(cashYear?.value ?? "").trim();
        if (!y) return;
        loadCash(`anual?year=${encodeURIComponent(y)}`);
      });
      cashLoadRange?.addEventListener("click", () => {
        const f = String(cashFrom?.value ?? "").trim();
        const to = String(cashTo?.value ?? "").trim();
        if (!f || !to) return;
        loadCash(`rango?from=${encodeURIComponent(f)}&to=${encodeURIComponent(to)}`);
      });
      cashApplyFilters?.addEventListener("click", applyCashFilters);
      cashAmountMax?.addEventListener("input", () => {
        updateAmountLabel();
      });
      cashClearFilters?.addEventListener("click", () => {
        if (cashSearch) cashSearch.value = "";
        if (cashFilterType) cashFilterType.value = "";
        if (cashFilterMoves) cashFilterMoves.value = "";
        if (cashAmountMax) cashAmountMax.value = "2000";
        updateAmountLabel();
        applyCashFilters();
      });

      updateAmountLabel();
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
      const evLineChart = document.getElementById("evLineChart");

      const stDate = document.getElementById("stDate");
      const stMonth = document.getElementById("stMonth");
      const stYear = document.getElementById("stYear");
      const stLoad = document.getElementById("stLoad");
      const stPeriod = document.getElementById("stPeriod");
      const stTotal = document.getElementById("stTotal");
      const stCycles = document.getElementById("stCycles");
      const stTable = document.getElementById("stTable");
      const stHint = document.getElementById("stHint");
      const stLineChart = document.getElementById("stLineChart");

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

      const drawLineChart = (canvas, labels, series = []) => {
        if (!canvas) return;
        const c = canvas;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const w = c.clientWidth || 900;
        const h = c.clientHeight || 280;
        c.width = w * window.devicePixelRatio;
        c.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, w, h);
        if (!series.length || !series.some((s) => Array.isArray(s.values) && s.values.length)) return;
        const pad = { l: 44, r: 16, t: 20, b: 36 };
        const allVals = series.flatMap((s) => s.values || []).map((v) => Number(v || 0));
        const max = Math.max(1, ...allVals);
        const min = 0;
        const pw = w - pad.l - pad.r;
        const ph = h - pad.t - pad.b;
        ctx.strokeStyle = "rgba(255,255,255,.14)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i += 1) {
          const y = pad.t + (ph * i) / 4;
          ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        }
        const drawn = [];
        series.forEach((s) => {
          const vals = s.values || [];
          const pts = vals.map((v, i) => {
            const x = pad.l + (vals.length === 1 ? pw / 2 : (pw * i) / (vals.length - 1));
            const y = pad.t + ph - ((Number(v || 0) - min) / (max - min || 1)) * ph;
            return { x, y };
          });
          ctx.strokeStyle = s.color || "#40c2a8";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.stroke();
          ctx.fillStyle = s.color || "#40c2a8";
          pts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2); ctx.fill(); });
          drawn.push({ name: s.name || "Serie", color: s.color || "#40c2a8", values: vals, pts });
        });

        // X labels
        ctx.fillStyle = "rgba(255,255,255,.78)";
        ctx.font = "12px Poppins, sans-serif";
        const tickCount = Math.min(labels.length, 8);
        for (let i = 0; i < tickCount; i += 1) {
          const idx = Math.round((i * (labels.length - 1)) / Math.max(1, tickCount - 1));
          const x = pad.l + (labels.length === 1 ? pw / 2 : (pw * idx) / (labels.length - 1));
          const txt = String(labels[idx] ?? "");
          ctx.fillText(txt, x - Math.min(22, txt.length * 2), h - 10);
        }

        // Hover tooltip
        c.onmousemove = (ev) => {
          const r = c.getBoundingClientRect();
          const mx = ev.clientX - r.left;
          const my = ev.clientY - r.top;
          let best = null;
          drawn.forEach((s) =>
            s.pts.forEach((p, i) => {
              const d = Math.hypot(mx - p.x, my - p.y);
              if (!best || d < best.d) best = { d, x: p.x, y: p.y, i, s };
            }),
          );
          let tip = document.getElementById("lineChartTooltip");
          if (!tip) {
            tip = document.createElement("div");
            tip.id = "lineChartTooltip";
            tip.style.position = "fixed";
            tip.style.zIndex = "9999";
            tip.style.pointerEvents = "none";
            tip.style.padding = "8px 10px";
            tip.style.borderRadius = "10px";
            tip.style.background = "rgba(8,15,28,.95)";
            tip.style.border = "1px solid rgba(255,255,255,.18)";
            tip.style.color = "#fff";
            tip.style.font = "12px Poppins, sans-serif";
            document.body.appendChild(tip);
          }
          if (!best || best.d > 20) {
            tip.style.display = "none";
            return;
          }
          const label = labels[best.i] ?? "";
          const val = Number(best.s.values[best.i] || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
          tip.innerHTML = `<strong>${best.s.name}</strong><br>${label}<br>${val}`;
          tip.style.display = "block";
          tip.style.left = `${ev.clientX + 12}px`;
          tip.style.top = `${ev.clientY + 12}px`;
        };
        c.onmouseleave = () => {
          const tip = document.getElementById("lineChartTooltip");
          if (tip) tip.style.display = "none";
        };
      };
      const drawGroupedBarChart = (canvas, labels, currentVals, prevVals) => {
        if (!canvas) return;
        const c = canvas;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const w = c.clientWidth || 900;
        const h = c.clientHeight || 300;
        c.width = w * window.devicePixelRatio;
        c.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, w, h);
        const n = Math.max(labels.length, currentVals.length, prevVals.length);
        if (!n) return;
        const pad = { l: 44, r: 16, t: 20, b: 44 };
        const pw = w - pad.l - pad.r;
        const ph = h - pad.t - pad.b;
        const max = Math.max(1, ...currentVals.map((v) => Number(v || 0)), ...prevVals.map((v) => Number(v || 0)));

        ctx.strokeStyle = "rgba(255,255,255,.14)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i += 1) {
          const y = pad.t + (ph * i) / 4;
          ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        }

        const groupW = pw / n;
        const barW = Math.max(6, Math.min(20, groupW * 0.28));
        const gap = Math.max(4, barW * 0.45);
        const bars = [];
        for (let i = 0; i < n; i += 1) {
          const xCenter = pad.l + groupW * i + groupW / 2;
          const vCur = Number(currentVals[i] || 0);
          const vPrev = Number(prevVals[i] || 0);
          const hCur = (vCur / max) * ph;
          const hPrev = (vPrev / max) * ph;
          const xCur = xCenter - gap / 2 - barW;
          const xPrev = xCenter + gap / 2;
          const yCur = pad.t + ph - hCur;
          const yPrev = pad.t + ph - hPrev;

          ctx.fillStyle = "#40c2a8";
          ctx.fillRect(xCur, yCur, barW, hCur);
          ctx.fillStyle = "#ff9fcd";
          ctx.fillRect(xPrev, yPrev, barW, hPrev);

          bars.push({ x: xCur, y: yCur, w: barW, h: hCur, label: labels[i], series: "Actual", value: vCur });
          bars.push({ x: xPrev, y: yPrev, w: barW, h: hPrev, label: labels[i], series: "Anterior", value: vPrev });

          ctx.fillStyle = "rgba(255,255,255,.78)";
          ctx.font = "12px Poppins, sans-serif";
          const txt = String(labels[i] ?? "");
          ctx.fillText(txt, xCenter - Math.min(16, txt.length * 2), h - 10);
        }

        c.onmousemove = (ev) => {
          const r = c.getBoundingClientRect();
          const mx = ev.clientX - r.left;
          const my = ev.clientY - r.top;
          const hit = bars.find((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
          let tip = document.getElementById("lineChartTooltip");
          if (!tip) {
            tip = document.createElement("div");
            tip.id = "lineChartTooltip";
            tip.style.position = "fixed";
            tip.style.zIndex = "9999";
            tip.style.pointerEvents = "none";
            tip.style.padding = "8px 10px";
            tip.style.borderRadius = "10px";
            tip.style.background = "rgba(8,15,28,.95)";
            tip.style.border = "1px solid rgba(255,255,255,.18)";
            tip.style.color = "#fff";
            tip.style.font = "12px Poppins, sans-serif";
            document.body.appendChild(tip);
          }
          if (!hit) {
            tip.style.display = "none";
            return;
          }
          const val = Number(hit.value || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
          tip.innerHTML = `<strong>${hit.series}</strong><br>${hit.label}<br>${val}`;
          tip.style.display = "block";
          tip.style.left = `${ev.clientX + 12}px`;
          tip.style.top = `${ev.clientY + 12}px`;
        };
        c.onmouseleave = () => {
          const tip = document.getElementById("lineChartTooltip");
          if (tip) tip.style.display = "none";
        };
      };

      const setReportsTab = (tab) => {
        document.querySelectorAll(".pestana-informes[data-tab]").forEach((b) => {
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
        document.querySelectorAll(".pestana-informes[data-evtab]").forEach((b) => {
          const active = b.getAttribute("data-evtab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        document.querySelectorAll("[data-ev-filter]").forEach((el) => {
          const show = el.getAttribute("data-ev-filter") === tab;
          el.hidden = !show;
          el.style.display = show ? "grid" : "none";
        });
      };
      const setStTab = (tab) => {
        stTab = tab;
        document.querySelectorAll(".pestana-informes[data-sttab]").forEach((b) => {
          const active = b.getAttribute("data-sttab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        document.querySelectorAll("[data-st-filter]").forEach((el) => {
          const show = el.getAttribute("data-st-filter") === tab;
          el.hidden = !show;
          el.style.display = show ? "grid" : "none";
        });
      };

      document.querySelectorAll(".pestana-informes[data-tab]").forEach((b) => {
        b.addEventListener("click", () => setReportsTab(b.getAttribute("data-tab") || "ciclos"));
      });
      document.querySelectorAll(".pestana-informes[data-evtab]").forEach((b) => {
        b.addEventListener("click", () => setEvTab(b.getAttribute("data-evtab") || "semanal"));
      });
      document.querySelectorAll(".pestana-informes[data-sttab]").forEach((b) => {
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
          repTbody.innerHTML = `<tr><td colspan="9">Error</td></tr>`;
          return;
        }

        const ciclos = data?.ciclos || [];
        repTbody.innerHTML = "";
        if (!ciclos.length) {
          repTbody.innerHTML = `<tr><td colspan="9">Sin ciclos</td></tr>`;
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
              <td>${escapeHtml(eur(c.importe))}</td>
              <td>${escapeHtml(eur(c.abonado))}</td>
              <td>${escapeHtml(eur(c.total))}</td>
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
          if (evLineChart) drawLineChart(evLineChart, [], []);
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

        drawGroupedBarChart(
          evLineChart,
          items.map((m) => m.codigo_visible),
          items.map((m) => Number(m.total_actual || 0)),
          items.map((m) => Number(m.total_anterior || 0)),
        );
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
          if (stLineChart) drawLineChart(stLineChart, [], []);
          return;
        }
        const rowsRaw = Array.isArray(data?.data) ? data.data : [];
        const monthShortEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const formatSlot = (slot) => {
          const s = String(slot ?? "").trim();
          if (!s) return "—";

          if (stTab === "diario") {
            const hMatch = /^(\d{1,2})/.exec(s);
            if (hMatch) {
              const hNum = Number(hMatch[1]);
              if (Number.isFinite(hNum) && hNum >= 0 && hNum <= 23) {
                const h = String(hNum).padStart(2, "0");
                return `${h}:00-${h}:59`;
              }
            }
            return s;
          }

          if (stTab === "mensual") {
            // Acepta "1", "01", "2026-05-01"
            if (/^\d{1,2}$/.test(s)) return `Día ${s.padStart(2, "0")}`;
            const dayFromIso = /^\d{4}-\d{2}-(\d{1,2})$/.exec(s);
            if (dayFromIso) return `Día ${String(dayFromIso[1]).padStart(2, "0")}`;
            return s;
          }

          if (stTab === "anual") {
            // Acepta "1", "01", "2026-01", "2026-01-01"
            if (/^\d{1,2}$/.test(s)) {
              const m = Number(s);
              if (m >= 1 && m <= 12) return monthShortEs[m - 1];
            }
            const monthFromIsoYm = /^\d{4}-(\d{1,2})$/.exec(s);
            if (monthFromIsoYm) {
              const m = Number(monthFromIsoYm[1]);
              if (m >= 1 && m <= 12) return monthShortEs[m - 1];
            }
            const monthFromIsoYmd = /^\d{4}-(\d{1,2})-\d{1,2}$/.exec(s);
            if (monthFromIsoYmd) {
              const m = Number(monthFromIsoYmd[1]);
              if (m >= 1 && m <= 12) return monthShortEs[m - 1];
            }
            return s;
          }

          return s;
        };
        const rows = rowsRaw
          .filter((r) => {
            if (stTab !== "diario") return true;
            const h = Number(String(r?.slot ?? "").slice(0, 2));
            return Number.isFinite(h) && h >= 7 && h <= 23;
          })
          .map((r) => ({ ...r, slot: formatSlot(r.slot) }));
        const totalsRaw = Array.isArray(data?.totals_by_machine) ? data.totals_by_machine : [];
        const totalsByCode = new Map(
          totalsRaw.map((m) => [
            String(m.codigo_visible),
            { codigo_visible: String(m.codigo_visible), total: 0, ciclos: 0 },
          ]),
        );
        rows.forEach((r) => {
          (r.maquinas || []).forEach((m) => {
            const code = String(m.codigo_visible);
            const acc = totalsByCode.get(code) || { codigo_visible: code, total: 0, ciclos: 0 };
            acc.total += Number(m.total || 0);
            acc.ciclos += Number(m.ciclos || 0);
            totalsByCode.set(code, acc);
          });
        });
        const totals = Array.from(totalsByCode.values());
        const shownTotalGeneral = rows.reduce((a, r) => a + Number(r.total_slot || 0), 0);
        const shownCyclesGeneral = rows.reduce((a, r) => a + Number(r.ciclos_slot || 0), 0);
        if (stPeriod) stPeriod.textContent = String(data?.periodo || "—");
        if (stTotal) stTotal.textContent = eur(shownTotalGeneral);
        if (stCycles) stCycles.textContent = String(shownCyclesGeneral);

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
              <td><strong>${eur(shownTotalGeneral)}</strong></td>
              <td><strong>${shownCyclesGeneral}</strong></td>
            </tr>
          </tbody>
        `;

        drawLineChart(stLineChart, rows.map((r) => String(r.slot)), [
          { name: "Total tramo", color: "#ff9fcd", values: rows.map((r) => Number(r.total_slot || 0)) },
        ]);
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
      document.querySelectorAll(".pestana-informes[data-evtab]").forEach((b) => b.addEventListener("click", loadEvolucion));
      document.querySelectorAll(".pestana-informes[data-sttab]").forEach((b) => b.addEventListener("click", loadEstadisticas));

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

    const creditoAplicadoPorCiclo = new Map();
    const CREDITO_INICIO_EUR = 4;

    async function loadMaquinas() {
      if (loadMaquinas._busy) return;
      loadMaquinas._busy = true;
      try {
        const isMachinesView = location.pathname.toLowerCase().endsWith("/admin/maquinas.html");
        if (isMachinesView && machinesGrid?.querySelector(".cajon-maquina.is-open")) return;
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
        let puertaAbierta = false;
        try {
          const iotRes = await fetch(`${API_BASE}/api/iot/approx-state`, {
            headers: {
              authorization: `Bearer ${token}`,
              "x-lavanderia-id": String(activeLavId),
            },
          });
          if (iotRes.ok) {
            const iotData = await iotRes.json();
            puertaAbierta = Boolean(iotData?.approx?.puerta_abierta);
          } else {
            const iotStateRes = await fetch(`${API_BASE}/api/iot/state`, {
              headers: {
                authorization: `Bearer ${token}`,
                "x-lavanderia-id": String(activeLavId),
              },
            });
            if (iotStateRes.ok) {
              const iotStateData = await iotStateRes.json();
              puertaAbierta = Boolean(iotStateData?.state?.puerta_abierta);
            }
          }
        } catch {
          // fallback silencioso
        }
        const all = data?.maquinas || [];
        all.forEach((m) => {
          const id = Number(m?.id_maquina);
          if (!Number.isFinite(id) || id <= 0) return;
          const estado = String(m?.estado_actual || "").toUpperCase();
          const cicloRef = String(m?.fecha_hora_inicio || "");
          const clave = `${id}::${cicloRef}`;
          if ((estado !== "EN_MARCHA" && estado !== "PAUSADA") || !cicloRef) {
            for (const k of Array.from(creditoAplicadoPorCiclo.keys())) {
              if (k.startsWith(`${id}::`)) creditoAplicadoPorCiclo.delete(k);
            }
            return;
          }
          if (!creditoAplicadoPorCiclo.has(clave)) creditoAplicadoPorCiclo.set(clave, false);
        });
        const isInicio = location.pathname.toLowerCase().endsWith("/admin/inicio.html");
        renderMaquinas(isInicio ? all.filter((m) => m.estado_actual === "EN_MARCHA") : all, puertaAbierta);

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
        machinesGrid.querySelectorAll(".cajon-maquina.is-open").forEach((d) => d.classList.remove("is-open"));
      };

      if (cancelBtn) {
        const tile = cancelBtn.closest(".tarjeta-maquina");
        tile?.querySelector(".cajon-maquina")?.classList.remove("is-open");
        return;
      }

        if (creditBtn || extendBtn) {
          const tile = (creditBtn || extendBtn).closest(".tarjeta-maquina");
          if (!tile) return;
          const id = Number((creditBtn || extendBtn).getAttribute("data-id"));
          if (!Number.isFinite(id) || id <= 0) return;
          if (creditBtn) {
            const cicloRef = String(tile.querySelector(".temporizador-maquina")?.getAttribute("data-start") || "");
            const cicloKey = `${id}::${cicloRef}`;
            if (cicloRef && creditoAplicadoPorCiclo.get(cicloKey)) {
              notifyNice("El crédito inicial ya fue añadido en este ciclo.");
              return;
            }
            const okConfirm = await confirmNice(
              "Confirmar crédito",
              `Se añadirá ${CREDITO_INICIO_EUR.toFixed(2)} € para iniciar lavado. ¿Continuar?`,
              "Sí, añadir",
              "Cancelar",
            );
            if (!okConfirm) return;
            creditBtn.disabled = true;
            try {
              const res = await fetch(`${API_BASE}/api/maquinas/${id}/credito`, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${token}`,
                  "x-lavanderia-id": String(activeLavId),
                  "content-type": "application/json",
                },
                body: JSON.stringify({ importe: CREDITO_INICIO_EUR }),
              });
              if (!res.ok) throw new Error("CREDIT_FAILED");
              if (cicloRef) creditoAplicadoPorCiclo.set(cicloKey, true);
              await loadMaquinas();
            } catch {
              notifyNice("No se pudo añadir crédito.");
              await loadMaquinas();
            } finally {
              creditBtn.disabled = false;
            }
            return;
          }
          if (extendBtn) {
            const okConfirm = await confirmNice(
              "Confirmar ampliación",
              "Se añadirá 1,00 € para ampliar el secado. ¿Continuar?",
              "Sí, ampliar",
              "Cancelar",
            );
            if (!okConfirm) return;
            extendBtn.disabled = true;
            try {
              const res = await fetch(`${API_BASE}/api/maquinas/${id}/ampliar`, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${token}`,
                  "x-lavanderia-id": String(activeLavId),
                  "content-type": "application/json",
                },
                body: JSON.stringify({ importe: 1 }),
              });
              if (!res.ok) throw new Error("EXTEND_FAILED");
              await loadMaquinas();
            } catch {
              notifyNice("No se pudo ampliar la máquina.");
              await loadMaquinas();
            } finally {
              extendBtn.disabled = false;
            }
            return;
          }
          const drawer = tile.querySelector(".cajon-maquina");
          const title = tile.querySelector(".titulo-cajon-maquina");
          const apply = tile.querySelector(".js-amount-apply");
          const entrada = tile.querySelector(".entrada-cajon-maquina");
          if (!drawer || !title || !apply) return;
          closeAllDrawers();
          const isCredit = Boolean(creditBtn);
          title.textContent = isCredit ? "Añadir crédito" : "Ampliar tiempo";
          apply.setAttribute("data-mode", "credito");
          if (entrada) {
            if (isCredit) {
              entrada.min = "0";
              entrada.max = "";
              entrada.step = "0.01";
              entrada.value = "4.00";
              entrada.readOnly = true;
            } else {
              entrada.min = "0.10";
              entrada.max = "";
              entrada.step = "0.10";
              entrada.readOnly = false;
              if (!entrada.value || Number(entrada.value) <= 0) entrada.value = "1.00";
            }
          }
          drawer.classList.add("is-open");
          entrada?.focus();
          return;
        }

      if (applyBtn) {
        const id = Number(applyBtn.getAttribute("data-id"));
        const mode = String(applyBtn.getAttribute("data-mode") || "");
        if (!Number.isFinite(id) || id <= 0 || (mode !== "credito" && mode !== "ampliar")) return;
        const tile = applyBtn.closest(".tarjeta-maquina");
        const entrada = tile?.querySelector(".entrada-cajon-maquina");
        const importe = Number(String(entrada?.value ?? "").replace(",", "."));
        if (!Number.isFinite(importe) || importe <= 0) return;
        const okConfirm = await confirmNice(
          "Confirmar crédito",
          `¿Añadir ${importe.toFixed(2)} € a la máquina?`,
          "Sí, añadir",
          "Cancelar",
        );
        if (!okConfirm) return;
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
          if (mode === "credito") {
            const cicloRef = String(tile?.querySelector(".temporizador-maquina")?.getAttribute("data-start") || "");
            if (cicloRef) creditoAplicadoPorCiclo.set(`${id}::${cicloRef}`, true);
          }
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

      const okConfirm = await confirmNice(
        btn ? "Confirmar encendido" : "Confirmar apagado",
        btn ? "¿Quieres encender esta máquina?" : "¿Quieres apagar/detener esta máquina?",
        "Confirmar",
        "Cancelar",
      );
      if (!okConfirm) return;
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
      const okConfirm = await confirmNice(
        "Confirmar refrigerar",
        `¿Quieres ${enabled ? "activar" : "desactivar"} el ventilador automático?`,
        "Confirmar",
        "Cancelar",
      );
      if (!okConfirm) return;
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
    const sidebar = document.querySelector(".barra-lateral-admin");
    if (!sidebar) return;
    if (!document.body.classList.contains("admin-menu-open")) return;
    if (e.target.closest(".barra-lateral-admin") || e.target.closest("#adminBurger")) return;
    document.body.classList.remove("admin-menu-open");
