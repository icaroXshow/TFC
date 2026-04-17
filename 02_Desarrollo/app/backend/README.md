# app/backend

API del sistema KWL (MVP).

## Requisitos

- Node.js (LTS)

## Arrancar

1. Crea `.env` desde `.env.example`.
2. Instala:
   - `cd app/backend`
   - `npm install`
3. Ejecuta:
   - `npm run dev`

## Endpoints (hoy)

- `GET /health`
- `POST /api/auth/login` (demo)
- `GET /api/auth/me` (Bearer)

El resto está en modo placeholder (`NOT_IMPLEMENTED`) hasta conectar MariaDB/Redis/MQTT/WebSocket.

