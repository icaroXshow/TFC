(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const API_BASE = "http://127.0.0.1:8080";
  const AUTH_STORAGE_KEY = "kwl_auth";
  const ACTIVE_LAV_KEY = "kwl_lavanderia_activa";

  // ================================
  // MODAL AUTH (solo si existe)
  // ================================
  const overlay = $("#authOverlay");
  const footer = document.querySelector(".footer");
  const openBtn = $("#openLogin");
  const closeBtn = $("#authClose");
  const loginUser = $("#authLogin");
  const loginPass = $("#authPassword");
  const loginSubmit = $("#authSubmit");
  let authError = null;

  if (overlay) {
    function showView(id) {
      $$(".auth-view", overlay).forEach(v => v.classList.remove("active"));
      const view = $("#" + id, overlay);
      if (view) view.classList.add("active");
    }

function openModal() {
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
document.body.classList.add("auth-open");

  // 🔥 CAMBIO DE FOOTER
  footer?.classList.add("footer-auth");

  showView("view-login");
  if (authError) authError.textContent = "";
  setTimeout(() => loginUser?.focus(), 50);
}

function closeModal() {
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");

  // 🔥 RESTAURAR FOOTER
  footer?.classList.remove("footer-auth");
}

    // Abrir
    openBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

    // Cerrar (evitar que el <a href="index.html"> navegue)
    closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });

    // Click fuera cierra
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    // Escape cierra
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Abrir modal automáticamente si llegas con #login (desde admin)
    if (location.hash === "#login") {
      openModal();
    }

    function ensureAuthError() {
      if (authError) return authError;
      const loginView = $("#view-login", overlay);
      if (!loginView) return null;
      const p = document.createElement("p");
      p.style.color = "#ffb4b4";
      p.style.fontSize = "14px";
      p.style.margin = "8px 0 0";
      loginView.appendChild(p);
      authError = p;
      return p;
    }

    async function doLogin(e) {
      e.preventDefault();
      const err = ensureAuthError();
      if (err) err.textContent = "";

      const login = String(loginUser?.value ?? "").trim();
      const password = String(loginPass?.value ?? "");
      if (!login || !password) {
        if (err) err.textContent = "Introduce usuario y contraseña.";
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ login, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.token) throw new Error(data?.error || "LOGIN_FAILED");

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }));
        // MVP: si aún no hay lavandería activa, fija a 1 por defecto
        if (!localStorage.getItem(ACTIVE_LAV_KEY)) {
          localStorage.setItem(ACTIVE_LAV_KEY, "1");
        }
        closeModal();
        window.location.href = "admin/inicio.html";
      } catch {
        if (err) err.textContent = "Credenciales inválidas o backend no disponible.";
      }
    }

    // Login -> backend + token + redirigir a admin
    loginSubmit?.addEventListener("click", doLogin);
    [loginUser, loginPass].forEach((el) => {
      el?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doLogin(e);
      });
    });
  }

// ================================
// ACTIVAR BOTONES MENU
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const links = Array.from(document.querySelectorAll("nav a[href]"));
  if (!links.length) return;

  // Página actual (solo nombre de archivo)
  let current = location.pathname.split("/").pop() || "index.html";
  current = current.split("?")[0].split("#")[0];

  // Quita active a todos
  links.forEach(a => a.classList.remove("active"));

  // Encuentra el enlace que coincide por nombre de archivo
  const match = links.find(a => {
    let href = (a.getAttribute("href") || "").trim();
    href = href.split("?")[0].split("#")[0];
    if (!href || href.startsWith("#")) return false;

    const hrefFile = href.split("/").pop();
    return hrefFile === current;
  });

  // Si no hay match (caso raro), intenta marcar "index.html" cuando estás en "/"
  const fallback = links.find(a => (a.getAttribute("href") || "").includes("index.html"));

  (match || fallback)?.classList.add("active");

});



})();


(function () {
  const MOBILE_WIDTH = 900;
  const NEGRO = "rgba(0,0,0,0.9)";
  const VERDE_INDEX = "#15847c";

  const path = window.location.pathname.toLowerCase();

  const esIndex = path.endsWith("/") || path.endsWith("/index.html");
  const esAdmin = path.includes("admin");

  const esAbout = path.includes("about");
  const esContact = path.includes("contact");
  const esFaqs = path.includes("faq");

  // Solo estas páginas llevan fondo negro en móvil (además de admin)
  const paginasConFondoNegro = esAbout || esContact || esFaqs || esAdmin;

  // Elementos (normal y admin)
  const footerTop =
    document.querySelector(".footer-top") ||
    document.querySelector(".footer-top-admin");

  const footerPoliticas =
    document.querySelector(".footer-politicas") ||
    document.querySelector(".footer-politicas-admin");

  const footerCopy =
    document.querySelector(".footer-copy") ||
    document.querySelector(".footer-copy-admin");

  function aplicarCambios() {
    const esMovil = window.innerWidth < MOBILE_WIDTH;

    // ===== RESET en desktop =====
    if (!esMovil) {
      if (footerTop) footerTop.style.display = "";
      if (footerPoliticas) {
        footerPoliticas.style.display = "";
        footerPoliticas.style.background = "";
      }
      if (footerCopy) footerCopy.style.background = "";
      return;
    }

    // ===== MÓVIL =====

    // 1) INDEX: reglas especiales
    if (esIndex) {
      if (footerTop) footerTop.style.display = "none";
      if (footerPoliticas) footerPoliticas.style.display = "none";
      if (footerCopy) footerCopy.style.background = VERDE_INDEX;

      // Asegura que no quede un fondo negro previo pegado
      if (footerPoliticas) footerPoliticas.style.background = "";
      return;
    }

    // 2) ADMIN: ocultar footer-top
    if (esAdmin) {
      if (footerTop) footerTop.style.display = "none";
    } else {
      // En el resto no tocamos footer-top
      if (footerTop) footerTop.style.display = "";
    }

    // 3) About/Contact/Faqs (y también Admin): fondo negro en politicas/copy
    if (paginasConFondoNegro) {
      if (footerPoliticas) {
        footerPoliticas.style.display = "";
        footerPoliticas.style.background = NEGRO;
      }
      if (footerCopy) {
        footerCopy.style.background = NEGRO;
      }
    } else {
      // Resto de páginas: no forzar fondos
      if (footerPoliticas) footerPoliticas.style.background = "";
      if (footerCopy) footerCopy.style.background = "";
    }
  }

  aplicarCambios();
  window.addEventListener("resize", aplicarCambios);
})();

/*--------------------------------------------------------------------------- */

(() => {
  const BP = 700; // <700px = móvil con hamburguesa

  const IDS = {
    style: "KWLHamStyleV2",
    btn: "KWLHamBtnV2",
    overlay: "KWLHamOverlayV2",
    drawer: "KWLHamDrawerV2",
  };

  function injectCSS() {
    if (document.getElementById(IDS.style)) return;

    const style = document.createElement("style");
    style.id = IDS.style;
    style.textContent = `
/* ===== KWL Hamburguesa V2 (solo <700px) ===== */
@media (max-width:${BP - 1}px){

  /* 1) Asegura que el topbar sea visible y encima de todo */
  header.topbar, header.topbar-admin{
    display:block !important;
    visibility:visible !important;
    opacity:1 !important;
    position:sticky !important;
    top:0 !important;
    z-index:2147483000 !important; /* súper alto */
  }
  .hamburger-icon {
  width: 22px;
  height: 26px;
  stroke: #ffffff;          /* blanco como en el mock */
  stroke-width: 2.5;
  stroke-linecap: round;
  fill: none;
  }


  /* 2) Al modo hamburguesa: ocultar logo/login y nav horizontal */
  header.topbar.KWL-ham-ready .logo,
  header.topbar.KWL-ham-ready .loguin,
  header.topbar-admin.KWL-ham-ready .logo-admin,
  header.topbar-admin.KWL-ham-ready .logout-btn{
    display:none !important;
  }

  header.topbar.KWL-ham-ready .navegador,
  header.topbar-admin.KWL-ham-ready .navegador-admin{
    display:none !important;
  }

  .topbar .titulo h1{
  font-size: 26px !important;
  margin-top:10;
}


  /* 3) Centrar el título como en el mock */
.topbar .cabecera,
.topbar-admin .cabecera-admin{
  position:relative !important;
  justify-content:end !important;

}


  /* Botón hamburguesa */
  #${IDS.btn}{
    position:absolute;
    left:10px;
    top:50%;
    transform:translateY(-50%);
    width:44px;
    height:44px;
    border:0;
    background:transparent;
    cursor:pointer;
    border-radius:12px;
    display:inline-flex !important;
    align-items:center;
    justify-content:center;
    z-index:2147483001 !important;
  }
  #${IDS.btn} .bar{
    display:block;
    width:22px;
    height:3px;
    margin:4px 0;
    background:#fff;
    border-radius:999px;
  }

  /* Overlay */
  #${IDS.overlay}{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    opacity:0;
    pointer-events:none;
    transition:opacity .18s ease;
    z-index:2147483002 !important;
  }

  /* Drawer */
  #${IDS.drawer}{
  position:fixed;
  top:95px;                               /* ⬅ debajo del topbar */
  left:0;
  width:min(350px,86vw);
  background:#fff;
  border-radius:0 0 28px 0;
  box-shadow:0 12px 35px rgba(0,0,0,.35);

  transform:translateX(-110%);
  transition:transform .22s ease;

  z-index:2147483003 !important;
  padding:16px 18px 16px 18px;
  display:flex;
  flex-direction:column;
  }

  html.KWL-ham-open{
    overflow:hidden;
  }
  html.KWL-ham-open #${IDS.overlay}{
    pointer-events:auto;
  }
  html.KWL-ham-open #${IDS.drawer}{
    transform:translateX(0);
  }

  /* Cabecera del drawer (X rosa) */
  .KWL-drawer-head{
    display:flex;
    justify-content:flex-end;
    margin-bottom:14px;
  }
  .KWL-drawer-close{
    border:0;
    background:transparent;
    cursor:pointer;
    padding:8px;
    border-radius:12px;
  }
  .KWL-drawer-close svg{
    width:28px;
    height:28px;
    stroke: var(--rosa, #fc7ce2);
    stroke-width:3.2;
  }

  /* Links */
  .KWL-drawer-nav{
    display:flex;
    flex-direction:column;
    gap:30px;
    padding:6px 2px 10px 2px;
  }
  .KWL-drawer-nav a{
    color: var(--turquesa-oscuro, #15847c);
    text-decoration:none;
    font-weight:800;
    text-transform: uppercase;
    font-size:22px;
    letter-spacing:1px;
  }

  /* Login */
  .KWL-drawer-actions{
    display:flex;
    justify-content:center;
    padding:14px 0 10px 0;
  }
  .KWL-drawer-login{
    margin-top:80%;
    width:min(250px,72%);
    border-radius:10px;
    padding:10px 14px;
    border:2px solid #000;
    background:transparent;
    color:#000;

    font-weight:800;
    letter-spacing:1px;
    cursor:pointer;
    text-align:center;
    text-decoration:none;
  }

  /* Redes (pastilla turquesa + iconos rosas) */
  .KWL-drawer-social{
    margin-top:auto;
    width:min(280px,78%);
    margin-left:auto;
    margin-right:auto;

    background: var(--turquesa-oscuro, #15847c);
    border-radius:22px;
    padding:10px 14px;

    display:flex;
    justify-content:space-around;
    align-items:center;
    gap:18px;
  }
  .KWL-drawer-social img{
    margin-top:20%;
    width:34px;
    height:34px;
    opacity:1;
    /* aproximación rosa del mock */
    filter: invert(64%) sepia(58%) saturate(2098%) hue-rotate(284deg) brightness(102%) contrast(95%);
  }
}
`;
    document.head.appendChild(style);
  }

  function isMobile() {
    return window.innerWidth < BP;
  }

  function cleanup() {
    document.documentElement.classList.remove("KWL-ham-open");

    document.getElementById(IDS.btn)?.remove();
    document.getElementById(IDS.overlay)?.remove();
    document.getElementById(IDS.drawer)?.remove();

    document
      .querySelectorAll("header.topbar.KWL-ham-ready, header.topbar-admin.KWL-ham-ready")
      .forEach((h) => h.classList.remove("KWL-ham-ready"));
  }

  function build() {
    const header =
      document.querySelector("header.topbar") || document.querySelector("header.topbar-admin");
    if (!header) return;

    const cabecera = header.querySelector(".cabecera") || header.querySelector(".cabecera-admin");
    if (!cabecera) return;

    if (document.getElementById(IDS.btn)) return; // ya montado

    injectCSS();
    header.classList.add("KWL-ham-ready");

    // Botón hamburguesa
    const btn = document.createElement("button");
    btn.id = IDS.btn;
    btn.type = "button";
    btn.setAttribute("aria-label", "Abrir menú");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `  <svg class="hamburger-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>`;
    cabecera.appendChild(btn);

    // Overlay
    const overlay = document.createElement("div");
    overlay.id = IDS.overlay;

    // Drawer
    const drawer = document.createElement("aside");
    drawer.id = IDS.drawer;
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");

    // X rosa
    const head = document.createElement("div");
    head.className = "KWL-drawer-head";

    const close = document.createElement("button");
    close.className = "KWL-drawer-close";
    close.type = "button";
    close.setAttribute("aria-label", "Cerrar menú");
    close.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6 6 L18 18"></path>
        <path d="M18 6 L6 18"></path>
      </svg>
    `;
    head.appendChild(close);

    // Links (del nav original, si existe)
    const nav = document.createElement("nav");
    nav.className = "KWL-drawer-nav";
    const navLinks = header.querySelectorAll(".navegador nav a[href], .navegador-admin nav a[href]");
    navLinks.forEach((a) => {
      const link = document.createElement("a");
      link.href = a.getAttribute("href") || "#";
      link.textContent = (a.textContent || "").trim();
      nav.appendChild(link);
    });

    // Login: si existe #openLogin, que abra el modal (tu JS ya escucha click en #openLogin)
    const actions = document.createElement("div");
    actions.className = "KWL-drawer-actions";

    const openLogin = document.querySelector("#openLogin");
    let loginEl;

    if (openLogin) {
      loginEl = document.createElement("a");
      loginEl.href = openLogin.getAttribute("href") || "#login";
      loginEl.textContent = "LOGIN";
      loginEl.addEventListener("click", (e) => {
        // Mantén tu comportamiento: tu script usa click en #openLogin.
        // Simulamos click para abrir el modal sin inventar lógica nueva.
        e.preventDefault();
        openLogin.click();
        closeMenu();
      });
    } else {
      loginEl = document.createElement("button");
      loginEl.type = "button";
      loginEl.textContent = "LOGIN";
    }
    loginEl.className = "KWL-drawer-login";
    actions.appendChild(loginEl);

    // Redes (clonar del footer)
    const social = document.createElement("div");
    social.className = "KWL-drawer-social";

    const socialSrc =
      document.querySelector(".footer-social") || document.querySelector(".footer-social-admin");
    if (socialSrc) {
      const links = socialSrc.querySelectorAll("a");
      if (links.length) {
        links.forEach((a) => {
          const a2 = document.createElement("a");
          a2.href = a.getAttribute("href") || "#";
          a2.target = a.getAttribute("target") || "";
          a2.rel = a.getAttribute("rel") || "";
          const img = a.querySelector("img");
          if (img) a2.appendChild(img.cloneNode(true));
          social.appendChild(a2);
        });
      } else {
        socialSrc.querySelectorAll("img").forEach((img) => social.appendChild(img.cloneNode(true)));
      }
    }

    drawer.appendChild(head);
    drawer.appendChild(nav);
    drawer.appendChild(actions);
    drawer.appendChild(social);

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    function openMenu() {
      document.documentElement.classList.add("KWL-ham-open");
      btn.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      document.documentElement.classList.remove("KWL-ham-open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", openMenu);
    close.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    drawer.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });
  }

  function apply() {
    if (isMobile()) {
      build();
    } else {
      cleanup();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
  window.addEventListener("resize", apply);
})();
