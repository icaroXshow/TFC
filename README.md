# KWL — Sistema de Gestión y Automatización de Lavandería

## Descripción

KWL es un sistema integral diseñado para gestionar y automatizar el funcionamiento de una lavandería autoservicio real.

El sistema centraliza en un servidor local todas las funciones operativas del negocio, permitiendo controlar máquinas, automatizar procesos del local y monitorizar dispositivos en tiempo real.

La plataforma combina desarrollo web, infraestructura de red, bases de datos e IoT para crear una solución completa que elimina la dependencia de servicios cloud y permite operar el negocio de forma autónoma y segura.

El sistema se comunica con controladores físicos basados en ESP32 que interactúan directamente con máquinas, sensores y dispositivos eléctricos del local.

Este proyecto forma parte del **Trabajo de Fin de Ciclo (TFC)** y está diseñado para evolucionar posteriormente a un sistema completo en producción.

---

# Objetivos del Proyecto

El objetivo del sistema es proporcionar una plataforma centralizada que permita:

- Controlar máquinas de lavandería remotamente
- Gestionar créditos mediante pulsos de monedero
- Automatizar apertura y cierre del local
- Controlar iluminación y dispositivos eléctricos
- Monitorizar eventos del sistema en tiempo real
- Registrar auditoría de acciones críticas
- Visualizar cámaras de seguridad
- Gestionar usuarios y permisos

Todo el sistema funciona completamente **dentro de la red local del establecimiento**, garantizando control total sobre la infraestructura y evitando dependencias externas.

---

# Arquitectura General

El sistema sigue una arquitectura distribuida basada en eventos.

El flujo general del sistema es el siguiente:

Usuario  
│  
Panel Web  
│  
Backend (API)  
│  
┌──────┼───────────┐  
▼      ▼           ▼  
Base   Cache      MQTT  
Datos  Redis      Broker  
                     │  
                     ▼  
                  ESP32  
                     │  
                     ▼  
           Dispositivos físicos  

El servidor actúa como el **centro de decisión del sistema**, mientras que los dispositivos IoT ejecutan las acciones físicas.

Principio fundamental del sistema:

El servidor decide.  
Los dispositivos ejecutan.

---

# Infraestructura del Sistema

El sistema se ejecuta en un servidor local virtualizado utilizando **Proxmox VE**.

Infraestructura principal de red:

| Sistema | IP | Función |
|-------|------|--------|
| Proxmox | 192.168.1.50 | Host de virtualización |
| VM_CORE | 192.168.1.51 | Backend + Web |
| VM_DATA | 192.168.1.52 | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |

Cada servicio se ejecuta en una máquina independiente para mejorar:

- seguridad
- mantenimiento
- organización del sistema
- capacidad de escalado futuro

---

# Componentes del Sistema

## Backend

El backend gestiona toda la lógica del sistema.

Funciones principales:

- gestión de usuarios
- control de máquinas
- auditoría del sistema
- comunicación con la base de datos
- comunicación con dispositivos IoT
- automatización de procesos

Tecnologías utilizadas:

- PHP
- Nginx
- Redis

El backend se ejecuta en la máquina **VM_CORE**.

---

## Base de Datos

El sistema utiliza **MariaDB** como motor de base de datos relacional.

Información almacenada:

- usuarios
- máquinas
- créditos
- eventos del sistema
- auditoría
- estado de dispositivos
- contabilidad de la lavandería

La base de datos se ejecuta en la máquina **VM_DATA**.

---

## Comunicación IoT

La comunicación entre el servidor y los dispositivos físicos se realiza mediante el protocolo **MQTT** utilizando el broker **Mosquitto**.

Este sistema permite comunicación en tiempo real entre:

- backend del sistema
- dispositivos ESP32
- sensores
- actuadores

Los dispositivos IoT utilizan microcontroladores **ESP32** conectados por WiFi a la red del local.

Funciones de los dispositivos:

- recibir comandos desde el servidor
- controlar relés y actuadores
- enviar estados del dispositivo
- notificar eventos del sistema

---

# Red del Sistema

Toda la infraestructura funciona dentro de una red local privada.

Red LAN: 192.168.1.0/24

Distribución de red:

Internet  
│  
Router ISP  
│  
Router interno (MikroTik)  
│  
Red LAN  
│  
Servidor Proxmox  
│  
Máquinas virtuales y contenedores  
│  
Dispositivos IoT (ESP32)

El acceso remoto al sistema se realiza mediante **VPN WireGuard**, lo que permite acceder a la red interna de forma segura desde cualquier ubicación.

---

# Seguridad

El sistema sigue varios principios de seguridad:

- el servidor no está expuesto directamente a Internet
- el acceso remoto solo se realiza mediante VPN
- los servicios internos solo son accesibles desde la red LAN
- autenticación en servicios internos
- registro de auditoría de acciones críticas

Esto reduce significativamente la superficie de ataque del sistema.

---

# Tecnologías Utilizadas

Infraestructura

- Proxmox VE
- Linux
- WireGuard VPN

Backend

- PHP
- Nginx
- Redis

Base de Datos

- MariaDB

Comunicación IoT

- Mosquitto MQTT
- ESP32

Frontend

- HTML
- CSS
- JavaScript

---

# Estado del Proyecto

Actualmente el proyecto se encuentra en fase de desarrollo para el **Trabajo de Fin de Ciclo (TFC)**.

Infraestructura completada:

- servidor Proxmox
- red interna
- máquinas virtuales
- broker MQTT
- base de datos
- backend preparado para desarrollo

Siguientes fases:

- desarrollo del backend
- desarrollo del panel web
- implementación de dispositivos IoT
- pruebas con máquinas reales
- documentación final del proyecto

---

# Licencia

Este proyecto se desarrolla como parte de un Trabajo de Fin de Ciclo con fines educativos y de investigación.
