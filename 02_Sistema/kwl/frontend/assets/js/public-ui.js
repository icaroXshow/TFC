const overlay = document.getElementById('authOverlay');
const openBtn = document.getElementById('openLogin');
const closeBtn = document.getElementById('authClose');

const navRoot = document.querySelector('.navegador');
const headerRoot = document.querySelector('.cabecera');
const topbarRoot = document.querySelector('.topbar');

let menuOverlay = null;
let menuDrawer = null;
let menuButton = null;
let lastScrollY = 0;
let scrollTicking = false;

function openModal(event) {
  if (event) {
    event.preventDefault();
  }

  if (!overlay) {
    return;
  }

  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('auth-open');
}

function closeModal(event) {
  if (event) {
    event.preventDefault();
  }

  if (!overlay) {
    return;
  }

  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-open');
}

openBtn?.addEventListener('click', openModal);
closeBtn?.addEventListener('click', closeModal);

overlay?.addEventListener('click', (event) => {
  if (event.target === overlay) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

function ensureHamburgerMenu() {
  if (!navRoot || !headerRoot) {
    return;
  }

  if (menuButton) {
    return;
  }

  menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'ham-btn';
  menuButton.setAttribute('aria-label', 'Menu');
  menuButton.innerHTML = '<span></span><span></span><span></span>';

  menuOverlay = document.createElement('div');
  menuOverlay.className = 'ham-overlay';

  menuDrawer = document.createElement('aside');
  menuDrawer.className = 'ham-drawer';

  const title = document.createElement('div');
  title.className = 'ham-title';
  title.textContent = 'Menu';

  const loginAction = document.createElement('button');
  loginAction.type = 'button';
  loginAction.className = 'ham-login';
  loginAction.textContent = 'Entrar';
  loginAction.addEventListener('click', (event) => {
    event.preventDefault();
    closeHamburger();
    openModal();
  });

  const list = document.createElement('nav');
  list.className = 'ham-nav';

  const links = Array.from(navRoot.querySelectorAll('a')).map((a) => {
    const clone = a.cloneNode(true);
    clone.classList.remove('active');
    clone.addEventListener('click', () => closeHamburger());
    return clone;
  });

  for (const link of links) {
    list.appendChild(link);
  }

  menuDrawer.appendChild(title);
  menuDrawer.appendChild(list);

  const divider = document.createElement('div');
  divider.className = 'ham-divider';
  menuDrawer.appendChild(divider);
  menuDrawer.appendChild(loginAction);

  document.body.appendChild(menuOverlay);
  document.body.appendChild(menuDrawer);

  menuButton.addEventListener('click', () => {
    if (document.body.classList.contains('ham-open')) {
      closeHamburger();
    } else {
      openHamburger();
    }
  });

  menuOverlay.addEventListener('click', closeHamburger);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeHamburger();
    }
  });

  headerRoot.prepend(menuButton);
}

function openHamburger() {
  document.body.classList.add('ham-open');
}

function closeHamburger() {
  document.body.classList.remove('ham-open');
}

function syncHamburgerVisibility() {
  if (!navRoot || !headerRoot) {
    return;
  }

  const isMobile = window.innerWidth <= 1110;
  if (isMobile) {
    ensureHamburgerMenu();
    navRoot.classList.add('is-mobile');
    return;
  }

  navRoot.classList.remove('is-mobile');
  closeHamburger();
}

syncHamburgerVisibility();
window.addEventListener('resize', syncHamburgerVisibility);

function updateTopbarOnScroll() {
  if (!topbarRoot) {
    return;
  }

  const isMobile = window.innerWidth <= 1110;
  if (!isMobile) {
    topbarRoot.classList.remove('topbar-hidden');
    lastScrollY = window.scrollY;
    return;
  }

  const currentY = window.scrollY;
  const delta = currentY - lastScrollY;

  // ignore tiny jitter
  if (Math.abs(delta) < 8) {
    return;
  }

  if (delta > 0 && currentY > 80) {
    topbarRoot.classList.add('topbar-hidden');
  }

  if (delta < 0) {
    topbarRoot.classList.remove('topbar-hidden');
  }

  lastScrollY = currentY;
}

function onScroll() {
  if (scrollTicking) {
    return;
  }

  scrollTicking = true;
  window.requestAnimationFrame(() => {
    updateTopbarOnScroll();
    scrollTicking = false;
  });
}

lastScrollY = window.scrollY;
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
  lastScrollY = window.scrollY;
  updateTopbarOnScroll();
});
updateTopbarOnScroll();
