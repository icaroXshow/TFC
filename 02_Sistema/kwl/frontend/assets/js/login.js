import { getSession, login } from './auth.js';

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');

function redirectByRole(role) {
  if (role === 'ADMIN') {
    window.location.href = './admin.html';
    return;
  }

  window.location.href = './index.html';
}

async function bootstrap() {
  try {
    const session = await getSession();
    if (session.authenticated) {
      redirectByRole((session.user?.role || '').toUpperCase());
      return;
    }
  } catch (_error) {
    // keep login screen
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Validando...';

    try {
      const result = await login(loginInput.value.trim(), passwordInput.value);
      const role = (result.user?.role || '').toUpperCase();
      message.textContent = 'Sesion iniciada';
      redirectByRole(role);
    } catch (_error) {
      message.textContent = 'Credenciales no validas';
      passwordInput.value = '';
      passwordInput.focus();
    }
  });
}

bootstrap();
