# Configuración del Servidor

Este documento describe los pasos realizados para preparar el servidor del sistema.

---

# 1 Instalación de Proxmox

Se instaló Proxmox VE en el servidor físico.

Configuración inicial:

- actualización del sistema
- configuración de red
- activación de repositorios
- configuración de usuarios

---

# 2 Configuración de red

IP del host

192.168.1.50

Gateway

192.168.1.1

Red

192.168.1.0/24

---

# 3 Creación de máquinas virtuales

Se crearon dos máquinas virtuales:

VM_CORE  
IP: 192.168.1.51

VM_DATA  
IP: 192.168.1.52

Ambas basadas en:

Ubuntu Server

---

# 4 Creación de contenedor

Se creó un contenedor LXC para el servicio MQTT.

LXC_MQTT  
IP: 192.168.1.53

Servicio instalado

Mosquitto MQTT

---

# 5 Distribución de servicios

VM_CORE

- Nginx
- Backend Node.js
- Redis

VM_DATA

- MariaDB

LXC_MQTT

- Mosquitto

---

# Criterios de diseño

- VM_CORE separada para aislar la lógica del sistema
- VM_DATA separada para proteger persistencia y facilitar copias
- LXC_MQTT por bajo consumo y simplicidad

# 6 Seguridad

Se aplicaron las siguientes medidas:

- acceso remoto solo mediante VPN
- firewall del servidor activo
- separación de servicios
- usuarios limitados por rol

# 7. Resultado final del host

El host Proxmox queda preparado para alojar los servicios del TFC con separación lógica, bajo consumo y facilidad de mantenimiento.