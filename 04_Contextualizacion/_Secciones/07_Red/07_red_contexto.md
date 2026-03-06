# Red y Acceso Remoto del Sistema

## 1. Objetivo

Este documento describe la arquitectura de red utilizada en el sistema de automatización de la lavandería.

El objetivo es permitir:

- funcionamiento completamente local del sistema
- acceso remoto seguro para administración
- aislamiento del servidor respecto a Internet
- comunicación fiable con los dispositivos IoT

Toda la infraestructura se ejecuta dentro de la red local del establecimiento.

---

# 2. Estructura General de Red

La red del sistema se organiza en tres niveles principales:

Internet  
│  
Router ISP  
│  
Router interno (MikroTik)  
│  
Red LAN del sistema  
│  
Servidor Proxmox + dispositivos IoT

El acceso remoto se realiza exclusivamente mediante **VPN WireGuard**.

---

# 3. Red Local

Subred principal:

192.168.1.0/24

Gateway:

192.168.1.1

Router interno:

MikroTik hAP ax2

Este router gestiona:

- DHCP
- red LAN
- servidor VPN WireGuard
- control de acceso a la red

---

# 4. Infraestructura del Servidor

El servidor principal se encuentra físicamente en la lavandería.

Hardware:

- CHUWI AuBox
- AMD Ryzen 7 8745HS
- 14 GB RAM
- SSD M.2

Sistema de virtualización:

Proxmox VE

Acceso al host:

https://192.168.1.50:8006

---

# 5. Infraestructura Virtual

El servidor ejecuta varios sistemas virtuales para separar los servicios.

## Direccionamiento de red

| Dispositivo | IP | Función |
|-------------|------|--------|
| Router MikroTik | 192.168.1.1 | Gateway |
| Proxmox | 192.168.1.50 | Host |
| VM_CORE | 192.168.1.51 | Backend |
| VM_DATA | 192.168.1.52 | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |

Internet
   │
Router ISP
   │
Router MikroTik
   │
LAN 192.168.1.0/24
   │
Proxmox (192.168.1.50)
   │
 ├ VM_CORE 192.168.1.51
 ├ VM_DATA 192.168.1.52
 └ LXC_MQTT 192.168.1.53
---

## VM_CORE

IP: 192.168.1.51

Servicios:

- Nginx
- Backend PHP
- Redis

Función:

- servir la aplicación web
- ejecutar la lógica del sistema
- coordinar la comunicación entre servicios

Acceso al panel web:

http://192.168.1.51

---

## VM_DATA

IP: 192.168.1.52

Servicios:

- MariaDB

Función:

- almacenar usuarios
- registrar eventos
- guardar auditoría
- mantener el estado del sistema

---

## LXC_MQTT

IP: 192.168.1.53

Servicios:

- Mosquitto MQTT

Función:

gestionar la comunicación en tiempo real con los dispositivos IoT.

---

# 6. Dispositivos IoT

Los dispositivos ESP32 se conectan a la red WiFi del local.

Estos dispositivos utilizan MQTT para comunicarse con el servidor.

Funciones:

- recibir comandos
- ejecutar acciones físicas
- enviar estado del dispositivo
- confirmar ejecución de acciones

Ejemplos de acciones controladas:

- activación de lavadoras
- control de puerta
- iluminación
- ventilación
- lectura de monedero

---

# 7. Comunicación del Sistema

El flujo de comunicación del sistema es el siguiente:

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
Relés / dispositivos físicos

La comunicación se basa en un modelo **basado en eventos** utilizando el protocolo MQTT.

---

# 8. Acceso Remoto

El acceso remoto se realiza mediante **VPN WireGuard** configurada en el router MikroTik.

Esto permite conectarse a la red local de forma segura desde cualquier ubicación.

Una vez conectado a la VPN se puede acceder a:

Proxmox  
https://192.168.1.50:8006

Panel web  
http://192.168.1.51

Servicios internos  
192.168.1.52  
192.168.1.53

---

# 9. Seguridad

El sistema sigue varios principios de seguridad:

- el servidor no está expuesto directamente a Internet
- todos los accesos externos se realizan mediante VPN
- los servicios internos solo son accesibles dentro de la red LAN
- la comunicación con IoT utiliza autenticación MQTT

Esto reduce significativamente la superficie de ataque del sistema.

---

# 10. Principios de diseño

La infraestructura de red se ha diseñado siguiendo los siguientes principios:

- arquitectura local autónoma
- separación de servicios mediante virtualización
- comunicación basada en eventos
- acceso remoto seguro
- facilidad de ampliación futura