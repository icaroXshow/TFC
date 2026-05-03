
import { API_BASE, CLAVE_LAVANDERIA_ACTIVA, seleccionarTodos } from "./utilidades.js";
const ATRIBUTO_CONTENIDO = "data-web-key";

function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseFaqItems(contenido) {
  try {
    const raw = String(contenido?.faq_items || "").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        q: String(x?.q || "").trim(),
        a: String(x?.a || "").trim(),
      }))
      .filter((x) => x.q || x.a);
  } catch {
    return [];
  }
}

function getLegacyFaqItems(contenido) {
  const items = [];
  for (let i = 1; i <= 6; i += 1) {
    const q = String(contenido?.[`faq_q${i}`] || "").trim();
    const a = String(contenido?.[`faq_a${i}`] || "").trim();
    if (q || a) items.push({ q, a });
  }
  return items;
}

function renderFaqPublico(contenido) {
  const bloqueFaq = document.querySelector(".bloque-faq");
  if (!bloqueFaq) return;
  const faqItemsDefinido = Object.prototype.hasOwnProperty.call(contenido || {}, "faq_items");
  const items = parseFaqItems(contenido);
  const finalItems = faqItemsDefinido ? items : (items.length ? items : getLegacyFaqItems(contenido));
  if (!finalItems.length) {
    bloqueFaq.innerHTML = "";
    return;
  }

  bloqueFaq.innerHTML = finalItems
    .map(
      (item) => `
        <details class="pregunta-faq">
          <summary>${escapeHtml(item.q || "Pregunta frecuente")}</summary>
          <p>${escapeHtml(item.a || "Respuesta pendiente de edición.")}</p>
        </details>
      `,
    )
    .join("");
}

export async function cargarContenidoPublico() {
  try {
    const valorLavanderia = Number(localStorage.getItem(CLAVE_LAVANDERIA_ACTIVA) || "");
    const idLavanderia = Number.isFinite(valorLavanderia) && valorLavanderia > 0 ? valorLavanderia : 1;
    const respuesta = await fetch(`${API_BASE}/api/configuracion/web-public?lav=${encodeURIComponent(String(idLavanderia))}`);
    if (!respuesta.ok) return;
    const datos = await respuesta.json().catch(() => ({}));
    const contenido = datos?.contenido || {};
    seleccionarTodos(`[${ATRIBUTO_CONTENIDO}]`).forEach((elemento) => {
      const clave = elemento.getAttribute(ATRIBUTO_CONTENIDO);
      if (!clave || contenido[clave] == null) return;
      if (elemento.tagName === "IFRAME") elemento.setAttribute("src", String(contenido[clave]));
      else elemento.textContent = String(contenido[clave]);
    });
    renderFaqPublico(contenido);
  } catch {
    // La web pública debe seguir cargando aunque el backend no responda.
  }
}
