import { seleccionar, seleccionarTodos } from "./utilidades.js";

export function iniciarMenuMovil() {
  const botonAbrir = seleccionar("#botonMenuMovil");
  const botonCerrar = seleccionar("#botonCerrarMenu");
  const fondo = seleccionar("#fondoMenu");
  const panel = seleccionar(".menu-lateral");

  const abrir = () => {
    document.body.classList.add("menu-abierto");
    botonAbrir?.setAttribute("aria-expanded", "true");
    panel?.setAttribute("aria-hidden", "false");
    setTimeout(() => seleccionar(".enlace-menu-lateral, .boton-acceso-menu", panel)?.focus(), 40);
  };

  const cerrar = () => {
    document.body.classList.remove("menu-abierto");
    botonAbrir?.setAttribute("aria-expanded", "false");
    panel?.setAttribute("aria-hidden", "true");
    botonAbrir?.focus();
  };

  botonAbrir?.setAttribute("aria-expanded", "false");
  panel?.setAttribute("aria-hidden", "true");
  botonAbrir?.addEventListener("click", abrir);
  botonCerrar?.addEventListener("click", cerrar);
  fondo?.addEventListener("click", cerrar);

  seleccionarTodos(".enlace-menu-lateral, .boton-acceso-menu").forEach((elemento) => {
    elemento.addEventListener("click", cerrar);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && document.body.classList.contains("menu-abierto")) cerrar();
  });
}
