# Integración API

## Flujo estándar

API → BD → MQTT → Redis → WebSocket

---

## Ejemplo: iniciar máquina

API:
- valida usuario
- valida estado

BD:
- crea ciclo

MQTT:
- envía comando

Redis:
- se actualiza al recibir estado

WebSocket:
- notifica al frontend

---

## Regla clave

La API no espera a que el dispositivo confirme.

El estado real llega después vía MQTT.
