# Mapa de componentes

## Componentes

Frontend
↓
API (backend)
↓
MariaDB
↓
Redis
↓
MQTT
↓
Dispositivos / Simulación

---

## Relaciones

- Frontend → API
- API → BD
- API → MQTT
- MQTT → dispositivos
- dispositivos → MQTT
- MQTT → backend
- backend → Redis
- backend → WebSocket
- WebSocket → frontend

---

## Visión

Sistema desacoplado basado en eventos.
