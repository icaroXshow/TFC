# WebSockets

## Objetivo

Actualizar el frontend en tiempo real sin recargar.

Estado actual: documentado para evolución. El runtime actual usa polling HTTP sobre API.

---

## Flujo

Futuro: Backend recibe evento → emite WebSocket → frontend actualiza

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
- en versión actual actualiza por polling HTTP
- en evolución actualizará por WebSocket
