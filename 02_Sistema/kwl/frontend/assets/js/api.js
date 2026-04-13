import { API_BASE } from './config.js';

export async function getJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'request_failed');
  }

  return data;
}

export async function sendCommand(path, action) {
  return getJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}
