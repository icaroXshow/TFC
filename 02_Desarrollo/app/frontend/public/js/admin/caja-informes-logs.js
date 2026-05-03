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
      document.querySelectorAll(".pestana-caja").forEach((b) => {
        const active = b.getAttribute("data-tab") === view;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      document.querySelectorAll(".filtro-caja").forEach((f) => {
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
      };
      const setStTab = (tab) => {
        stTab = tab;
        document.querySelectorAll(".pestana-informes[data-sttab]").forEach((b) => {
          const active = b.getAttribute("data-sttab") === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
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
          const drawer = tile.querySelector(".cajon-maquina");
          const title = tile.querySelector(".titulo-cajon-maquina");
          const apply = tile.querySelector(".js-amount-apply");
          const entrada = tile.querySelector(".entrada-cajon-maquina");
          if (!drawer || !title || !apply) return;
          closeAllDrawers();
          const isCredit = Boolean(creditBtn);
          title.textContent = isCredit ? "Añadir crédito" : "Ampliar tiempo";
          apply.setAttribute("data-mode", isCredit ? "credito" : "ampliar");
          if (entrada) {
            if (isCredit) {
              entrada.min = "0.10";
              entrada.max = "";
              entrada.step = "0.10";
            } else {
              entrada.min = "0.10";
              entrada.max = "";
              entrada.step = "0.10";
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
    const sidebar = document.querySelector(".barra-lateral-admin");
    if (!sidebar) return;
    if (!document.body.classList.contains("admin-menu-open")) return;
    if (e.target.closest(".barra-lateral-admin") || e.target.closest("#adminBurger")) return;
    document.body.classList.remove("admin-menu-open");
