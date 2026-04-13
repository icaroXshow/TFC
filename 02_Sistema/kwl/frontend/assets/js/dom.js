export const nodes = {
  healthText: document.getElementById('healthText'),
  systemStatus: document.getElementById('systemStatus'),
  doorState: document.getElementById('doorState'),
  lightState: document.getElementById('lightState'),
  eventsList: document.getElementById('eventsList'),
  eventsCount: document.getElementById('eventsCount'),
  machinesBody: document.getElementById('machinesBody'),
  machinesCount: document.getElementById('machinesCount'),
  refreshNow: document.getElementById('refreshNow'),
  toggleAuto: document.getElementById('toggleAuto'),
  doorOpen: document.getElementById('doorOpen'),
  doorClose: document.getElementById('doorClose'),
  lightOn: document.getElementById('lightOn'),
  lightOff: document.getElementById('lightOff'),
  sessionUser: document.getElementById('sessionUser'),
  logoutBtn: document.getElementById('logoutBtn'),
};

function actionButtons(machineId) {
  return `
    <div class="actions">
      <button data-machine="${machineId}" data-action="START" class="btn">Start</button>
      <button data-machine="${machineId}" data-action="STOP" class="btn btn--warn">Stop</button>
      <button data-machine="${machineId}" data-action="RESTART" class="btn btn--danger">Restart</button>
      <button data-machine="${machineId}" data-action="STATUS" class="btn btn--light">Status</button>
    </div>
  `;
}

export function renderHealth(health) {
  const checks = health.checks || {};
  const allOk = checks.database && checks.redis && checks.mqtt;

  nodes.healthText.className = allOk ? 'ok' : 'err';
  nodes.healthText.textContent =
    `DB:${checks.database} | Redis:${checks.redis} | MQTT:${checks.mqtt} | ${health.time || ''}`;
}

export function renderSystem(system) {
  const door = system?.puerta?.estado || 'DESCONOCIDO';
  const light = system?.luz?.estado || 'DESCONOCIDO';

  nodes.doorState.textContent = `Puerta: ${door}`;
  nodes.lightState.textContent = `Luz: ${light}`;
  nodes.systemStatus.textContent = `${door} | ${light}`;
}

export function renderEvents(events) {
  nodes.eventsList.innerHTML = '';
  nodes.eventsCount.textContent = String(events.length);

  for (const event of events) {
    const li = document.createElement('li');
    li.textContent = `${event.fecha_hora} | ${event.codigo_visible} | ${event.tipo_evento} (${event.nivel})`;
    nodes.eventsList.appendChild(li);
  }

  if (events.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Sin eventos recientes';
    nodes.eventsList.appendChild(li);
  }
}

export function renderMachines(machines, onMachineAction) {
  nodes.machinesBody.innerHTML = '';
  nodes.machinesCount.textContent = String(machines.length);

  for (const machine of machines) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${machine.id_maquina}</td>
      <td>${machine.codigo_visible}</td>
      <td>${machine.tipo_maquina}</td>
      <td><span class="pill">${machine.estado_actual}</span></td>
      <td>${actionButtons(machine.id_maquina)}</td>
    `;
    nodes.machinesBody.appendChild(tr);
  }

  document.querySelectorAll('button[data-machine]').forEach((button) => {
    button.addEventListener('click', async () => {
      const machineId = button.dataset.machine;
      const action = button.dataset.action;
      await onMachineAction(machineId, action);
    });
  });
}

export function renderLoadError(message) {
  nodes.healthText.className = 'err';
  nodes.healthText.textContent = `Error de carga: ${message}`;
}
