import { getJson } from './api.js';

export async function getSession() {
  return getJson('/api/auth/me');
}

export async function login(loginValue, passwordValue) {
  return getJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginValue, password: passwordValue }),
  });
}

export async function logout() {
  return getJson('/api/auth/logout', { method: 'POST' });
}

export async function requireRole(role) {
  const session = await getSession();

  if (!session.authenticated) {
    window.location.href = './login.html';
    throw new Error('auth_required');
  }

  if ((session.user?.role || '').toUpperCase() !== role.toUpperCase()) {
    window.location.href = './index.html';
    throw new Error('insufficient_role');
  }

  return session;
}
