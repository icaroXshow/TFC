# MQTT en el Backend KWL

## 1. Objetivo del modulo MQTT en Back

Este modulo define como el backend se comunica con la capa IoT del sistema KWL.

En la arquitectura del proyecto, MQTT cumple tres funciones:

- enviar comandos desde backend a ESP32
- recibir estado y eventos de dispositivos
- desacoplar logica de negocio del hardware

## 2. Ubicacion en la arquitectura

El backend se ejecuta en `VM_CORE (192.168.1.51)` y el broker en `LXC_MQTT (192.168.1.53)`.

Flujo principal:

1. usuario lanza accion en panel web
2. backend valida permisos y reglas
3. backend publica comando en topic MQTT
4. ESP32 ejecuta accion fisica
5. ESP32 publica estado/evento
6. backend refleja cambios en UI y base de datos

## 3. Relacion con MariaDB y Redis

MQTT no sustituye persistencia ni cache:

- `MariaDB (VM_DATA)` persiste auditoria, estados consolidados y trazabilidad
- `Redis (VM_CORE)` mantiene estado rapido y soporte de tiempo real
- `MQTT` transporta comandos y señales de IoT

## 4. Estructura de topics

Se utiliza prefijo global `kwl/` con separacion por areas:

- `kwl/maquinas/<maquina>/comando`
- `kwl/maquinas/<maquina>/estado`
- `kwl/maquinas/<maquina>/evento`
- `kwl/maquinas/<maquina>/telemetria`
- `kwl/maquinas/<maquina>/disponibilidad`
- `kwl/sistema/puerta/comando`
- `kwl/sistema/puerta/estado`
- `kwl/sistema/luces/comando`
- `kwl/sistema/luces/estado`

## 5. Politica de mensajes

Para mantener consistencia backend-IoT:

- comandos en minuscula (`start`, `stop`, `restart`, `abrir`, `cerrar`)
- soporte a payload simple o JSON (`{\"accion\":\"start\"}`)
- estados con retained en topics de estado/disponibilidad
- eventos sin retained para no contaminar historico

## 6. Seguridad y control

Principios aplicados al modulo:

- broker accesible solo desde LAN/VPN
- autenticacion obligatoria en broker
- sin exposicion MQTT directa a Internet
- auditoria de acciones criticas antes de publicar comando

## 7. Filosofia operativa

Principio del sistema en este modulo:

- el backend decide
- el dispositivo ejecuta

Con esto se mantiene gobierno central, trazabilidad y escalabilidad por nodos.

## 8. Alcance MVP y evolucion

En MVP:

- publicacion de comandos basicos de maquina/tienda
- recepcion de estado y disponibilidad
- integracion con auditoria backend

Evolucion posterior:

- worker dedicado de publish/consume MQTT
- ACL por topic
- TLS interno en broker
- monitorizacion activa de colas y latencia
