# Visión general API

## Objetivo

La API conecta el frontend con el backend.

El frontend nunca accede directamente a MariaDB, Redis ni MQTT.

Toda operación debe pasar por la API.

---

## Responsabilidades de la API

- autenticación de usuarios
- consulta de datos
- ejecución de acciones
- validación de permisos
- registro de auditoría
- coordinación con MQTT
- exposición de estado al frontend
- apoyo a tiempo real mediante WebSockets

---

## Principio

El frontend solicita.
El backend valida, decide, ejecuta y responde.
