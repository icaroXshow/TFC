import { API_BASE, CLAVE_AUTH, CLAVE_LAVANDERIA_ACTIVA, seleccionar, seleccionarTodos } from "./utilidades.js";

export function iniciarAccesoPrivado() {
  const capa = seleccionar("#capaAcceso");
  const cerrar = seleccionar("#cerrarAcceso");
  const correo = seleccionar("#correoAcceso");
  const clave = seleccionar("#claveAcceso");
  const enviar = seleccionar("#enviarAcceso");
  const error = seleccionar("#errorAcceso");
  let ultimoFoco = null;
  if (!capa) return;

  const abrirModal = () => {
    ultimoFoco = document.activeElement;
    document.body.classList.remove("menu-abierto");
    document.body.classList.add("acceso-abierto");
    capa.classList.add("mostrar");
    capa.setAttribute("aria-hidden", "false");
    setTimeout(() => correo?.focus(), 60);
  };

  const cerrarModal = () => {
    document.body.classList.remove("acceso-abierto");
    capa.classList.remove("mostrar");
    capa.setAttribute("aria-hidden", "true");
    if (ultimoFoco && typeof ultimoFoco.focus === "function") ultimoFoco.focus();
  };

  seleccionarTodos("[data-accion='abrir-acceso']").forEach((boton) => {
    boton.addEventListener("click", (evento) => {
      evento.preventDefault();
      abrirModal();
    });
  });

  cerrar?.addEventListener("click", cerrarModal);
  capa.addEventListener("click", (evento) => { if (evento.target === capa) cerrarModal(); });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && capa.classList.contains("mostrar")) cerrarModal();
  });

  async function autenticar(evento) {
    evento?.preventDefault();
    if (error) error.textContent = "";
    const login = String(correo?.value || "").trim();
    const password = String(clave?.value || "");
    if (!login || !password) {
      if (error) error.textContent = "Introduce usuario y contraseña.";
      return;
    }
    try {
      const respuesta = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok || !datos?.token) throw new Error("LOGIN_FAILED");
      localStorage.setItem(CLAVE_AUTH, JSON.stringify({ token: datos.token, user: datos.user }));
      if (!localStorage.getItem(CLAVE_LAVANDERIA_ACTIVA)) localStorage.setItem(CLAVE_LAVANDERIA_ACTIVA, "1");
      window.location.href = "admin/inicio.html";
    } catch {
      if (error) error.textContent = "Credenciales inválidas o backend no disponible.";
    }
  }

  enviar?.addEventListener("click", autenticar);
  [correo, clave].forEach((campo) => campo?.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") autenticar(evento);
  }));

  if (location.hash === "#login") abrirModal();
}
