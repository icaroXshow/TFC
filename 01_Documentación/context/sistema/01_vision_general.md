# Visión general del sistema

## Descripción

KWL es un sistema integral de gestión, automatización y control para una lavandería autoservicio real.

El sistema centraliza en un servidor local las funciones operativas del negocio, incluyendo:

- control remoto de máquinas
- gestión de créditos
- apertura y cierre de tienda
- control de puerta motorizada
- control de iluminación
- control de ventilación
- visualización de cámaras
- gestión de usuarios y roles
- registro de eventos y auditoría
- contabilidad operativa de la lavandería

---

## Arquitectura general

El sistema se compone de:

- `VM_CORE` → backend, web, Redis y tiempo real
- `VM_DATA` → MariaDB
- `LXC_MQTT` → broker Mosquitto
- dispositivos ESP32 o simulados
- red local protegida por VPN

---

## Principio de funcionamiento

El sistema sigue este principio:

- el servidor decide
- el dispositivo ejecuta

El backend valida acciones, consulta datos, registra histórico y emite órdenes a los dispositivos mediante MQTT.

Los dispositivos físicos o simulados:

- reciben comandos
- ejecutan acciones
- publican estado
- generan eventos

---

## Tiempo real

El frontend debe poder mostrar paneles en tiempo real.

Para ello:

- MQTT comunica backend y dispositivos
- Redis mantiene estado rápido y ayuda a desacoplar eventos internos
- WebSockets actualiza los paneles web sin recarga

---

## Modos de ejecución

El sistema debe poder funcionar en dos modos:

### Entorno real
Con infraestructura distribuida:
- VM_CORE
- VM_DATA
- LXC_MQTT
- LXC_SIM
- ESP32 reales cuando aplique

### Entorno demo/evaluación
En una sola máquina, manteniendo la misma lógica funcional principal.
