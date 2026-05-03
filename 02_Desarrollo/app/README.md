# app

Código funcional del sistema (backend + frontend).

## Estructura

- `backend/`: API, reglas de negocio, DB, MQTT
- `frontend/`: panel web admin y web pública

## Reglas actuales importantes

- Ampliación de tiempo: solo en secadoras. No hay límite de ampliaciones por ciclo.
- En web admin, si el importe enviado supera lo aplicable, el sobrante no se contabiliza.
- La lógica de puerta de secadora con retardo es de simulación física y vive en `simulation/`.