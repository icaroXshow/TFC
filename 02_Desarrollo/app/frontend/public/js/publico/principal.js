
import { cargarContenidoPublico } from "./contenido-publico.js";
import { iniciarTema } from "./tema.js";
import { iniciarMenuMovil } from "./menu-movil.js";
import { iniciarAccesoPrivado } from "./acceso.js";
import { marcarPaginaActiva, corregirAnclas } from "./navegacion.js";
import { iniciarPreguntasFrecuentes } from "./faqs.js";
import { API_BASE } from "./utilidades.js";

function activarSaltoInicio() {
  const esInicio = /\/?(index\.html)?$/.test(window.location.pathname);
  if (!esInicio) return;
  const objetivo = document.body;
  objetivo.classList.remove("animar-inicio");
  void objetivo.offsetWidth;
  setTimeout(() => {
    objetivo.classList.add("animar-inicio");
  }, 50);
}

function animarBienvenidaPorLetras() {
  const esInicio = /\/?(index\.html)?$/.test(window.location.pathname);
  if (!esInicio) return;
  const nodo = document.querySelector(".texto-bienvenida");
  if (!nodo) return;
  const texto = (nodo.textContent || "").trim();
  if (!texto) return;
  const limpio = nodo.getAttribute("data-animado") === "1";
  if (!limpio) {
    nodo.textContent = "";
    Array.from(texto).forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "letra-bienvenida";
      span.style.setProperty("--i", String(i));
      span.textContent = ch === " " ? "\u00A0" : ch;
      nodo.appendChild(span);
    });
    nodo.setAttribute("data-animado", "1");
  }
  nodo.classList.remove("animar-letras");
  void nodo.offsetWidth;
  nodo.classList.add("animar-letras");
}

function iniciarFormularioContacto() {
  const form = document.querySelector(".formulario-contacto");
  if (!form) return;
  const boton = form.querySelector(".boton-formulario");
  const nombre = document.getElementById("nombreContacto");
  const correo = document.getElementById("correoContacto");
  const mensaje = document.getElementById("mensajeContacto");
  if (!boton || !nombre || !correo || !mensaje) return;

  let estado = form.querySelector(".estado-formulario");
  if (!estado) {
    estado = document.createElement("p");
    estado.className = "estado-formulario";
    form.appendChild(estado);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
  });

  boton.addEventListener("click", async () => {
    estado.textContent = "";
    boton.setAttribute("disabled", "disabled");
    try {
      const r = await fetch(`${API_BASE}/api/configuracion/web-public/contacto`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre: String(nombre.value || "").trim(),
          correo: String(correo.value || "").trim(),
          mensaje: String(mensaje.value || "").trim(),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        estado.textContent = String(d?.error || "No se pudo enviar el mensaje.");
        return;
      }
      estado.textContent = "Mensaje enviado correctamente.";
      form.reset();
    } catch {
      estado.textContent = "Error de conexión al enviar el mensaje.";
    } finally {
      boton.removeAttribute("disabled");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  activarSaltoInicio();
  iniciarTema();
  iniciarMenuMovil();
  iniciarAccesoPrivado();
  marcarPaginaActiva();
  corregirAnclas();
  iniciarPreguntasFrecuentes();
  cargarContenidoPublico();
  iniciarFormularioContacto();
  setTimeout(() => {
    animarBienvenidaPorLetras();
  }, 120);
});

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  activarSaltoInicio();
  animarBienvenidaPorLetras();
});
