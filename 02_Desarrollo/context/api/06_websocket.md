# WebSockets

## Objetivo

Actualizar el frontend en tiempo real sin recargar.

---

## Flujo

Backend recibe evento → emite WebSocket → frontend actualiza

---

## Tipos de eventos

- estado_maquina_actualizado
- evento_maquina
- estado_dispositivo
- evento_sistema

---

## Ejemplo

```json
{
  "tipo": "estado_maquina_actualizado",
  "id_maquina": 1,
  "estado": "EN_MARCHA"
}
```

---

## Regla

El frontend:

- carga inicial por API
- actualiza por WebSocket
