# Infraestructura del Sistema

## 1. Propósito del documento

Este documento describe la infraestructura completa donde se ejecuta el sistema de gestión y automatización de la lavandería.

Su objetivo es proporcionar contexto suficiente para que un técnico o sistema externo pueda comprender:

- la arquitectura de red
- los componentes físicos del sistema
- la ubicación del servidor
- el acceso remoto
- la relación entre infraestructura y servicios

Este documento **no describe cómo se configuró la infraestructura**, solo explica **qué existe y cómo está organizado el entorno**.

---

# 2. Visión general de la infraestructura

El sistema se ejecuta completamente dentro de la red local de la lavandería.

No depende de servicios cloud ni de infraestructura externa para su funcionamiento.

Toda la lógica del sistema se ejecuta en un **servidor local virtualizado** y se accede remotamente mediante **VPN segura**.

Arquitectura simplificada:

Internet  
│  
Router ISP  
│  
Router interno MikroTik  
│  
Red LAN  
│  
Servidor Proxmox  
│  
Máquinas virtuales y contenedores  
│  
Dispositivos IoT (ESP32)

---

# 3. Red del sistema

La red del sistema utiliza una red privada local.

Red LAN

192.168.1.0/24

Gateway

192.168.1.1

Router

MikroTik hAP ax2

Funciones del router:

- gestión de red local
- asignación DHCP
- firewall
- servidor VPN WireGuard
- acceso remoto seguro

---

# Organización lógica de servicios

Aunque todos los sistemas se encuentran en la misma red LAN, los servicios del sistema están organizados por función:

Infraestructura
- Router MikroTik
- Servidor Proxmox

Servicios de aplicación
- VM_CORE (backend y web)
- VM_DATA (base de datos)

Servicios de comunicación
- LXC_MQTT (broker MQTT)

Dispositivos físicos
- controladores ESP32
- relés y sistemas eléctricos

Esta separación lógica permite escalar el sistema fácilmente en el futuro migrando cada servicio a diferentes máquinas o redes si fuese necesario.

# 4. Acceso remoto

El sistema no expone servicios directamente a Internet.

El acceso remoto se realiza exclusivamente mediante **VPN WireGuard**.

Una vez conectado a la VPN el usuario accede a la red local como si estuviera físicamente dentro del establecimiento.

Esto permite acceder a:

- servidor Proxmox
- panel web del sistema
- servicios internos
- cámaras IP
- dispositivos de red

---

# 5. Servidor principal

El sistema se ejecuta en un servidor físico instalado en la lavandería.

Ubicación

Interior del local técnico de la lavandería.

Hardware

- CHUWI AuBox
- AMD Ryzen 7 8745HS
- 14 GB RAM
- SSD M.2

Sistema de virtualización

Proxmox VE

Acceso al host

https://192.168.1.50:8006

---

# 6. Infraestructura virtual

El servidor ejecuta varias instancias virtualizadas para separar los servicios.

| Sistema | IP | Función |
|-------|------|--------|
| Proxmox | 192.168.1.50  | Host de virtualización |
| VM_CORE | 192.168.1.51  | Backend + Web + Redis |
| VM_DATA | 192.168.1.52  | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |
| LXC_DNS | 192.168.1.5   | Servidor DNS |
---

## VM_CORE

Servicios:

- Nginx
- Backend PHP
- Redis

Función:

- servir el panel web
- ejecutar la lógica del sistema
- gestionar comunicación con IoT

Acceso

http://192.168.1.51

---

## VM_DATA

Servicios:

MariaDB

Función:

- almacenamiento de datos
- auditoría
- estado de máquinas
- historial de eventos

---

## LXC_MQTT

Servicios

Mosquitto MQTT

Función

Gestionar la comunicación en tiempo real entre el servidor y los dispositivos IoT.

---

## Resolución de nombres interna

La infraestructura utiliza DNS interno para facilitar el acceso a los servicios mediante nombres lógicos.

Ejemplos:
- proxmox.kwl
- panel.kwl
- db.kwl
- mqtt.kwl

# 7. Dispositivos IoT

Los dispositivos IoT utilizan microcontroladores ESP32.

Estos dispositivos se conectan por WiFi a la red del local.

Utilizan el protocolo MQTT para comunicarse con el servidor.

Funciones:

- recibir comandos
- controlar relés
- enviar estado
- confirmar acciones

Ejemplos de dispositivos controlados:

- lavadoras
- puerta automática
- iluminación
- ventilación
- monedero

---

# 8. Sistema de vigilancia

El sistema incluye dispositivos MOBOTIX.

Componentes:

- cámaras IP
- altavoz IP

Funcionan dentro de la red LAN y pueden visualizarse desde el panel web.

---

# 9. Flujo general del sistema

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

La comunicación entre servidor y dispositivos se basa en eventos utilizando MQTT.

---

# 10. Principios de diseño de la infraestructura

La infraestructura se diseñó siguiendo los siguientes principios:

- sistema completamente local
- separación de servicios mediante virtualización
- acceso remoto seguro
- arquitectura preparada para crecer
- bajo consumo de recursos
- facilidad de mantenimiento

Este diseño permite ampliar el sistema en el futuro añadiendo nuevas máquinas virtuales o nuevos dispositivos IoT.