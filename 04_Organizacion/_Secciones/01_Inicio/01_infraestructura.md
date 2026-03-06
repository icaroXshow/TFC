# INFRAESTRUCTURA DEL SISTEMA

## 1. Objetivo

La infraestructura del sistema está diseñada para ejecutar todos los servicios dentro de la propia lavandería.

Esto permite:

- autonomía total del sistema
- mayor seguridad
- independencia de servicios cloud
- control completo de la red

El acceso remoto se realiza exclusivamente mediante VPN.

---

# 2. Infraestructura Física

## Servidor

Ubicación: lavandería.

Hardware:

- CHUWI AuBox
- AMD Ryzen 7 8745HS
- 14 GB RAM
- SSD M.2

Sistema de virtualización:

Proxmox VE

El servidor actúa como núcleo del sistema ejecutando varias máquinas virtuales y contenedores.

---

# 3. Infraestructura Virtual

Dirección del host Proxmox:

192.168.1.50

El servidor ejecuta los siguientes sistemas virtuales:

---

## VM_CORE

IP: 192.168.1.51

Servicios:

- Nginx
- Backend PHP
- Redis

Función:

- Servir la aplicación web
- Gestionar la lógica del sistema
- Comunicarse con MQTT
- Gestionar eventos en tiempo real

---

## VM_DATA

IP: 192.168.1.52

Servicios:

- MariaDB

Función:

- almacenar información persistente
- registros de auditoría
- estado de máquinas
- historial del sistema

Separar la base de datos permite mejorar la estabilidad y facilita futuras ampliaciones.

---

## LXC_MQTT

IP: 192.168.1.53

Servicios:

- Mosquitto MQTT

Función:

gestionar la comunicación entre el servidor y los dispositivos IoT.

---

# 4. Red del Sistema

Red LAN:

192.168.1.0/24

Direcciones principales:

| Dispositivo | IP | Función |
|--------------|------|-----------|
| Router MikroTik | 192.168.1.1 | Gateway |
| Proxmox | 192.168.1.50 | Host virtualización |
| VM_CORE | 192.168.1.51 | Backend |
| VM_DATA | 192.168.1.52 | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |

---

# 5. Comunicación del Sistema

La comunicación se basa en eventos mediante MQTT.

Arquitectura simplificada:

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
Relés / Máquinas

---

# 6. Principios de Infraestructura

- sistema completamente local
- servicios separados mediante virtualización
- comunicación basada en eventos
- acceso remoto solo mediante VPN
- servidor no expuesto directamente a Internet