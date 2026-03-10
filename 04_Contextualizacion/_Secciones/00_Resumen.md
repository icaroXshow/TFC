# RESUMEN DEL PROYECTO

## Nombre del proyecto
LAVANDERÍA KWL- Sistema integral de gestión, automatización y control de una lavanderia 

---

## Descripción General

El proyecto consiste en el diseño y desarrollo de un sistema integral de control y gestión para una lavandería autoservicio real. 

El sistema centraliza en un servidor local todas las funciones operativas del negocio, incluyendo:

- Control remoto de máquinas (encendido, apagado y reinicio)
- Gestión de créditos mediante pulsos a MPS1
- Automatización de apertura y cierre de tienda
- Control de puerta motorizada
- Control de iluminación
- Visualización de cámaras de seguridad
- Gestión de usuarios y roles
- Registro de auditoría de acciones críticas

El sistema se comunica con controladores ESP32 instalados en las máquinas y elementos eléctricos del local mediante protocolo MQTT.

---

## Objetivo del TFC (Versión Básica)

Desarrollar una versión funcional mínima (MVP) que permita:

- Operar una lavandería desde un panel web responsive
- Controlar al menos una máquina real
- Ejecutar apertura y cierre de tienda (puerta + luces)
- Gestionar créditos mediante pulsos
- Visualizar cámaras de seguridad
- Registrar acciones críticas en bd
- Registrar contabilidad de la lavanderia en bd
- Acceder de forma segura mediante VPN

El sistema se ejecutará completamente en infraestructura local.

---

## Tecnologías Utilizadas

- Proxmox (virtualización)
- Linux (servidor)
- PHP (backend)
- HTML / CSS / JavaScript (frontend)
- MariaDB (base de datos)
- Redis (cache y tiempo real)
- Mosquitto MQTT (comunicación IoT)
- ESP32 (controladores físicos)
- WireGuard (VPN)
- WebSockets (tiempo real)

---

## Arquitectura General

El sistema se compone de:

- Servidor local con Proxmox (VM_CORE, VM_DATA y LXC_MQTT)
- Router con VPN
- Red LAN interna
- Controladores ESP32 conectados a elementos eléctricos
- Cámaras IP en red local
- Panel web accesible únicamente mediante VPN

El servidor actúa como cerebro del sistema, mientras que los ESP32 ejecutan las acciones físicas.

---

## Principios del Sistema

- El servidor decide.
- El ESP32 ejecuta.
- Toda acción crítica queda registrada.
- El sistema no depende de servicios en la nube.
- La seguridad y control operativo son prioritarios.

---

## Vision a futuro y alcance del Proyecto Real (8 meses)

La versión completa incluirá:

- Escalabilidad a múltiples máquinas
- Optimización de seguridad
- Mejora de auditoría y trazabilidad
- Métricas avanzadas de actividad
- Automatizaciones adicionales con IA
- Mayor robustez eléctrica y redundancia
- Sincronia con otra lavanderia 

---

## Justificación del Proyecto

El proyecto responde a la necesidad real de modernizar la gestión de lavanderías autoservicio mediante una solución local, segura y personalizable, eliminando dependencia de plataformas externas y mejorando el control operativo.

Además, permite aplicar conocimientos de desarrollo web, redes, bases de datos e IoT en un entorno real con impacto tangible.

---


