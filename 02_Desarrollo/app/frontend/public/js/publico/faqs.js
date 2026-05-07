
import { seleccionarTodos } from "./utilidades.js";
export function iniciarPreguntasFrecuentes() {
  const preguntas = seleccionarTodos(".pregunta-faq");
  preguntas.forEach((pregunta) => {
    pregunta.addEventListener("toggle", () => {
      if (!pregunta.open) return;
      preguntas.forEach((otra) => { if (otra !== pregunta) otra.open = false; });
    });
  });
}
