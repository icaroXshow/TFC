# Frontend KWL

Frontend estatico desacoplado del backend, servido en `/frontend/` y consumiendo API en `/api` con sesion HTTP.

## Estructura

- `index.html`: landing publica para cliente
- `about.html`: seccion sobre nosotros
- `contact.html`: contacto + formulario + mapa
- `faqs.html`: preguntas frecuentes
- `login.html`: inicio de sesion
- `admin.html`: panel operativo solo para rol admin
- `assets/css/landing.css`: estilos de landing (adaptacion del diseño KWL original)
- `assets/css/main.css`: estilos de login y panel admin
- `assets/js/config.js`: configuracion de frontend
- `assets/js/api.js`: cliente HTTP para backend
- `assets/js/auth.js`: sesion y control de rol
- `assets/js/dom.js`: render y manipulacion de UI
- `assets/js/app.js`: orquestacion de eventos y ciclo de refresco
- `assets/js/login.js`: flujo de autenticacion
- `assets/js/public-ui.js`: modal de login incrustado en paginas publicas
- `assets/img/`: recursos graficos

## Integracion con backend

El frontend consume endpoints:

- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/health`
- `GET /api/dashboard`
- `POST /api/machines/{id}/command`
- `POST /api/system/door/command`
- `POST /api/system/light/command`

## Experiencia pública

- En `index/about/contact/faqs` existe un efecto de login incrustado (modal con `iframe` a `login.html`).
- El login real sigue validando contra backend y solo permite acceso `ADMIN`.

## Notas de despliegue

- Ruta desplegada en servidor: `/var/www/kwl/frontend`
- Nginx sirve esta carpeta por `location /frontend/`
- El JS usa `type="module"` y requiere navegador moderno
