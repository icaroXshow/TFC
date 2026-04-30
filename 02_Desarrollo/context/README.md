# context

Definición conceptual vigente del sistema KWL.

Objetivo:
- alinear backend, frontend, BD y simulador
- evitar contradicciones de reglas funcionales

Estructura:
- `sistema/`: visión global, reglas y alcance
- `dominio/`: entidades, estados, eventos y acciones
- `mqtt/`: contrato MQTT con dispositivos/simulador
- `api/`: contrato HTTP frontend-backend
- `db/`: modelos conceptual/lógico y SQL base

Estado actual:
- runtime en tiempo real por polling HTTP
- Redis activo como caché de estado/configuración IoT
- WebSocket no forma parte del flujo operativo actual

Regla:
- cualquier cambio funcional debe actualizar primero `context/` y luego implementación.
