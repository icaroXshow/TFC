# app/backend

API del sistema KWL.

## Requisitos

- Node.js >= 20
- MariaDB
- Broker MQTT si `MQTT_ENABLED=true`
- Redis si `REDIS_ENABLED=true` (recomendado)

## Arrancar en desarrollo

1. Copia `.env.example` a `.env` (o `.env.demo` a `.env` para demo local) y rellena tus valores reales.
2. Instala dependencias:

```bash
cd app/backend
npm ci
```

3. Compila o ejecuta en desarrollo:

```bash
npm run typecheck
npm run build
npm run dev
```

`npm run dev`:
- recompila `src` en caliente con `tsc --watch`
- reinicia automáticamente `dist/server.js` con `node --watch`

## Configuración local vs Docker

- Local (fuera de Docker): usar `.env` basado en `.env.example` o `.env.demo`.
- Docker demo (`deploy/demo/docker-compose.yml`): las variables del backend se inyectan por `environment` del compose.

Redis:
- Local: `REDIS_ENABLED=true`, `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379`.
- Docker demo: `REDIS_ENABLED=true`, `REDIS_HOST=redis`, `REDIS_PORT=6379`.
- Si no se quiere Redis: `REDIS_ENABLED=false` (backend debe funcionar con fallback a BD).

Seguridad (cámara):
- Los endpoints de stream/UI de cámara en navegador pueden usar token en query (`?t=...`) por limitación del tag `<img>`/`window.open`.
- Tratar ese token como credencial sensible y solo para entorno demo/local.
- En producción, preferir proxy/BFF con sesión o mecanismo de token efímero de un solo uso.

## Scheduler IoT (comportamiento actual)

- Tick cada `30s` (`startIoTScheduler`).
- Evalúa horario por lavandería (`iot_schedule`) y estado (`iot_state`).
- Evita repeticiones con marca `iot_last` por fecha/hora y acción.
- Registra auditoría como evento de sistema (`id_usuario = NULL`) y action-log IoT con origen `auto_schedule`.
- Limitaciones:
  - Resolución temporal de 30s (no ejecución al segundo exacto).
  - Si hay cambios manuales simultáneos, prevalece la última escritura de estado.
  - Depende de la hora del sistema donde corre el backend/contenedor.

## Endpoints principales

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `/api/maquinas`
- `/api/caja`
- `/api/informes`
- `/api/iot`
- `/api/configuracion`
- `/api/dashboard`

Redis ya se usa para cachear estado/configuración IoT (fallback a BD si Redis no responde).
Decisión actual Redis:
- Se mantiene cliente propio TCP/RESP reforzado para MVP.
- Se pospone migración a `ioredis`/`redis` hasta fase de estabilización/CI para evitar cambio de superficie en cierre de TFC.
Notas de entregable:
- No incluir `app/backend/.env` real en repositorio ni en entregables.
- Mantener plantillas: `.env.example` y `.env.demo` (solo valores demo).
