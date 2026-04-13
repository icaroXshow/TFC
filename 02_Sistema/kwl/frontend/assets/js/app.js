import { REFRESH_MS } from './config.js';
import { getJson, sendCommand } from './api.js';
import { logout, requireRole } from './auth.js';
import {
  nodes,
  renderEvents,
  renderHealth,
  renderLoadError,
  renderMachines,
  renderSystem,
} from './dom.js';

let timer = null;
let autoMode = true;

async function refreshAll() {
  try {
    const [health, dashboard] = await Promise.all([
      getJson('/api/health'),
      getJson('/api/dashboard'),
    ]);

    renderHealth(health);
    renderSystem(dashboard.system || {});
    renderEvents(dashboard.recent_events || []);
    renderMachines(dashboard.machines || [], onMachineAction);
  } catch (error) {
    renderLoadError(error.message);
  }
}

async function onMachineAction(machineId, action) {
  await sendCommand(`/api/machines/${machineId}/command`, action);
  await refreshAll();
}

async function onDoorAction(action) {
  await sendCommand('/api/system/door/command', action);
  await refreshAll();
}

async function onLightAction(action) {
  await sendCommand('/api/system/light/command', action);
  await refreshAll();
}

function toggleAutoRefresh() {
  autoMode = !autoMode;
  nodes.toggleAuto.textContent = `Auto: ${autoMode ? 'ON' : 'OFF'}`;

  if (autoMode) {
    timer = setInterval(refreshAll, REFRESH_MS);
    return;
  }

  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function bindUiEvents() {
  nodes.refreshNow.addEventListener('click', refreshAll);
  nodes.toggleAuto.addEventListener('click', toggleAutoRefresh);

  nodes.doorOpen.addEventListener('click', async () => {
    await onDoorAction('abrir');
  });

  nodes.doorClose.addEventListener('click', async () => {
    await onDoorAction('cerrar');
  });

  nodes.lightOn.addEventListener('click', async () => {
    await onLightAction('on');
  });

  nodes.lightOff.addEventListener('click', async () => {
    await onLightAction('off');
  });
}

async function bootstrap() {
  const session = await requireRole('ADMIN');
  if (nodes.sessionUser) {
    nodes.sessionUser.textContent = `${session.user.login} (${session.user.role})`;
  }

  bindUiEvents();
  if (nodes.logoutBtn) {
    nodes.logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.href = './login.html';
    });
  }

  await refreshAll();
  timer = setInterval(refreshAll, REFRESH_MS);
}

bootstrap();
