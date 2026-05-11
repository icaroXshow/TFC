# IoT del Sistema KWL

## 1. Rol de ESP32

Los ESP32 son la capa de ejecucion fisica.

Su funcion es:

- recibir comandos del backend
- accionar reles y elementos electricos
- publicar estado, eventos y telemetria

No toman decisiones de negocio; ejecutan ordenes.

## 2. Conexion WiFi

Cada nodo ESP32 se conecta a la red WiFi interna del local.

Requisitos:

- red estable en zona tecnica
- direccionamiento dentro de LAN privada
- aislamiento de red frente a Internet directa

## 3. Conexion MQTT

Los nodos usan cliente MQTT contra `LXC_MQTT (192.168.1.53)` con usuario y contrasena.

Se recomienda:

- keepalive activo
- reconexion automatica
- Last Will para disponibilidad (`online/offline`)

## 4. Topics

Estructura base del proyecto:

- `kwl/maquinas/<id>/comando`
- `kwl/maquinas/<id>/estado`
- `kwl/maquinas/<id>/evento`
- `kwl/maquinas/<id>/telemetria`
- `kwl/maquinas/<id>/disponibilidad`
- `kwl/sistema/puerta/comando|estado`
- `kwl/sistema/luces/comando|estado`

## 5. Comandos

Comandos esperados en MVP:

- maquina: `start`, `stop`, `restart`, `status`, `ping`
- puerta: `abrir`, `cerrar`
- luz: `on`, `off`

Admite payload simple y JSON (`{"accion":"start"}`).

## 6. Estados

El ESP32 publica estados retenidos para consumo inmediato del panel:

- estado de maquina
- estado de puerta
- estado de luces
- disponibilidad del nodo

Tambien publica eventos puntuales y telemetria periodica.

## 7. Reles

Mapa de reles de la placa actual:

- rele maquina: pin `26`
- rele reinicio: pin `25`
- rele puerta: pin `33`
- rele luz: pin `32`

Cada instalacion debe validar nivel activo (`HIGH` o `LOW`) antes de produccion.

## 8. Watchdog y resiliencia

El firmware implementa:

- reintento de reconexion WiFi
- reintento de reconexion MQTT
- telemetria ciclica (RSSI, uptime, heap)
- publicacion de disponibilidad con LWT

Esto reduce caidas silenciosas y facilita diagnostico operativo.

## 9. Principio operativo

Principio clave del proyecto:

- el servidor decide
- el dispositivo ejecuta

Con este modelo se mantiene control centralizado, trazabilidad y escalabilidad.

## 10. Simulacion de dispositivo en VM

Para pruebas y demo sin hardware fisico, el sistema incorpora simulador software desplegado en `VM_CORE`.

Este nodo software:

- se conecta al broker MQTT como un ESP32
- consume comandos de maquina/puerta/luz
- publica estado, eventos, telemetria y disponibilidad
- permite validacion completa del flujo backend-IoT
