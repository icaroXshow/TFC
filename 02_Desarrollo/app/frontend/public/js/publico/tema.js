
import { seleccionar } from "./utilidades.js";
const CLAVE_TEMA = "kwl_tema_publico";
function aplicarTema(tema) {
  document.body.classList.toggle("modo-claro", tema === "claro");
  const boton = seleccionar("#botonTema");
  if (boton) boton.setAttribute("aria-label", tema === "claro" ? "Activar modo oscuro" : "Activar modo claro");
}
export function iniciarTema() {
  const temaGuardado = localStorage.getItem(CLAVE_TEMA) || "oscuro";
  aplicarTema(temaGuardado);
  seleccionar("#botonTema")?.addEventListener("click", () => {
    const nuevoTema = document.body.classList.contains("modo-claro") ? "oscuro" : "claro";
    localStorage.setItem(CLAVE_TEMA, nuevoTema);
    aplicarTema(nuevoTema);
  });
}
