# app/backend

API del sistema KWL.

## Requisitos

- Node.js >= 20
- MariaDB
- Broker MQTT si `MQTT_ENABLED=true`
- Redis si `REDIS_ENABLED=true` (recomendado)

## Arrancar en desarrollo

1. Copia `.env.example` a `.env` y rellena tus valores reales.
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
