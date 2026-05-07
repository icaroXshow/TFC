# CORE_contexto.md

# VM_CORE — Contexto del Sistema

## 1. Propósito

La máquina virtual **VM_CORE** actúa como el núcleo lógico del sistema de gestión de la lavandería.

En esta máquina se ejecutan los servicios encargados de:

- servir el panel web
- ejecutar la lógica de negocio del sistema
- comunicarse con la base de datos
- comunicarse con el broker MQTT
- coordinar las acciones enviadas a los dispositivos IoT

VM_CORE es el **cerebro del sistema**.

---

# 2. Ubicación en la Infraestructura

La VM forma parte de la infraestructura virtual alojada en el servidor Proxmox.

Red del sistema:

192.168.1.0/24

Distribución de máquinas:

| Sistema | IP | Función |
|--------|------|--------|
| Proxmox | 192.168.1.50 | Host de virtualización |
| VM_CORE | 192.168.1.51 | Backend + Web + Redis |
| VM_DATA | 192.168.1.52 | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |

VM_CORE es el punto central que conecta los servicios internos del sistema.

---

# 3. Rol dentro de la Arquitectura

VM_CORE ejecuta:

- servidor web
- backend del sistema
- API
- lógica de negocio
- integración con Redis
- integración con MariaDB
- integración con MQTT

Flujo principal del sistema:

Usuario  
│  
Panel Web  
│  
Backend (VM_CORE)  
│  
MQTT (LXC_MQTT)  
│  
ESP32  
│  
Dispositivos físicos

El backend procesa las acciones del usuario y decide qué órdenes deben enviarse a los dispositivos.

---

# 4. Servicios Instalados

Servicios instalados en VM_CORE:

## Servidor web

- Nginx

## Backend

- PHP 8.3
- PHP-FPM

## Estado / cache

- Redis

## Herramientas de prueba MQTT

- mosquitto-clients

---

# 5. Comunicación con Otros Servicios

VM_CORE se comunica con otros componentes del sistema.

## Base de datos

Servidor:

VM_DATA

IP:

192.168.1.52

Motor:

MariaDB

Uso:

- usuarios
- auditoría
- eventos
- estado de máquinas
- contabilidad
- información de control del sistema

---

## Broker MQTT

Servidor:

LXC_MQTT

IP:

192.168.1.53

Software:

Mosquitto

Uso:

- envío de comandos a ESP32
- recepción de estados
- comunicación en tiempo real con dispositivos IoT

---

# 6. Panel Web

El panel web del sistema se sirve desde VM_CORE.

Acceso local:

http://192.168.1.51

Acceso remoto:

mediante VPN hacia la red local.

---

# 7. Filosofía de desarrollo

El código del backend no se desarrolla directamente en el servidor.

Proceso previsto de trabajo:

1. Desarrollo del backend en entorno local.
2. Pruebas funcionales en el equipo de desarrollo.
3. Despliegue del código a VM_CORE.
4. Verificación final dentro de la infraestructura real.

Este enfoque permite mantener el servidor como entorno estable y reducir errores en producción.

---

# 8. Rol en el sistema global

VM_CORE actúa como el **centro de decisión del sistema**.

Principio fundamental:

El servidor decide.  
Los dispositivos ejecutan.

Esto permite centralizar el control del sistema, registrar acciones críticas y mantener la lógica fuera de los dispositivos físicos.

---

# 9. Estado actual de la máquina

En el estado actual de la infraestructura, VM_CORE dispone de:

- Nginx operativo
- PHP 8.3 y PHP-FPM operativos
- Redis operativo
- conectividad con MariaDB en VM_DATA
- conectividad con Mosquitto en LXC_MQTT
- acceso web permitido desde LAN y desde la red VPN

La máquina queda preparada para recibir el backend desarrollado externamente y desplegarlo cuando el código esté listo.