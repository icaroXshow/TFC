
import { seleccionarTodos } from "./utilidades.js";
export function marcarPaginaActiva() {
  let pagina = location.pathname.split("/").pop() || "index.html";
  pagina = pagina.split("?")[0].split("#")[0];
  seleccionarTodos(".enlace-navegacion, .enlace-menu-lateral").forEach((enlace) => {
    const destino = (enlace.getAttribute("href") || "").split("?")[0].split("#")[0].split("/").pop();
    enlace.classList.toggle("activo", destino === pagina);
  });
}
export function corregirAnclas() {
  if (location.hash) {
    const destino = document.querySelector(location.hash);
    if (destino) setTimeout(() => destino.scrollIntoView({ block: "start" }), 80);
  }
}
