# Integración MQTT con base de datos

## Regla general

Los dispositivos NO escriben en BD.

El backend es responsable de transformar mensajes MQTT en datos persistentes.

---

## Traducción de eventos

### Evento MQTT → LogMaquina

Evento:
- tipo_evento
- nivel
- payload

Se guarda en:
- log_maquina

---

### Estado MQTT → Redis

Estado:
- estado actual

Se guarda en:
- Redis

---

### Evento relevante → impacto en ciclo

Ejemplo:

CICLO_FINALIZADO:
- actualiza estado_ciclo
- registra fecha_fin

## Regla obligatoria:

Todo evento MQTT relevante debe convertirse en un registro en la tabla `log_maquina`.

Ejemplos:

- CICLO_INICIADO → log_maquina
- CICLO_FINALIZADO → log_maquina
- ERROR_COMUNICACION → log_maquina