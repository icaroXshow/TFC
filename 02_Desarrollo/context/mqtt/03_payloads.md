# Payloads MQTT

## Regla general

Los mensajes deben ser simples, explícitos y fáciles de interpretar.

Se recomienda JSON.

---

## Payload de comando de máquina

```json
{
  "accion": "encender_rele",
  "id_maquina": 1,
  "timestamp": "2026-04-15T18:00:00Z"
}
```

```json
{
  "accion": "insertar_credito",
  "id_maquina": 1,
  "importe": 1.0,
  "timestamp": "2026-04-15T18:00:00Z"
}
```

```json
{
  "accion": "confirmar_inicio",
  "id_maquina": 1,
  "timestamp": "2026-04-15T18:00:03Z",
  "origen": "web_admin"
}
```

```json
{
  "accion": "apagar_rele",
  "id_maquina": 1,
  "id_ciclo": 25,
  "timestamp": "2026-04-15T18:46:00Z"
}
```

---

## Payload de estado de máquina

```json
{
  "id_maquina": 1,
  "estado": "EN_MARCHA",
  "timestamp": "2026-04-15T18:00:02Z"
}
```

---

## Payload de evento de máquina

```json
{
  "id_maquina": 1,
  "id_ciclo": 25,
  "tipo_evento": "CICLO_FINALIZADO",
  "nivel": "INFO",
  "payload": {
    "duracion_total_programada_min": 46
  },
  "timestamp": "2026-04-15T18:46:00Z"
}
```

Eventos relevantes adicionales:

- `PULSO_INICIO`
- `PULSO_FIN`
- `AMPLIACION_APLICADA`

Nota operativa:

- En `CICLO_FINALIZADO`, si `payload.motivo = "stop_manual"`, el backend deja estado final `STOP`.
- En finalización natural de ciclo, el estado final es `PAUSADA`.

---

## Payload de comando de puerta

```json
{
  "accion": "abrir_puerta",
  "timestamp": "2026-04-15T18:00:00Z"
}
```

---

## Payload de estado simple

```json
{
  "estado": "ON",
  "timestamp": "2026-04-15T18:00:00Z"
}
```

---

## Criterio de persistencia

- el backend transforma estados y eventos MQTT en registros persistentes cuando corresponda
- no todo mensaje MQTT implica una fila nueva en todas las tablas
- los eventos técnicos relevantes sí deben acabar en `log_maquina`
