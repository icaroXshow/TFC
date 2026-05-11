# Servidor del Sistema

## 1. Objetivo

El servidor actúa como núcleo del sistema de gestión de la lavandería.

En él se ejecutan todos los servicios necesarios para el funcionamiento del sistema:

- backend
- base de datos
- comunicación IoT
- cache y tiempo real

Para mejorar la organización y la seguridad, los servicios se separan utilizando virtualización mediante Proxmox.

---

# 2. Hardware del servidor

Ubicación

Servidor físico instalado en la lavandería.

Hardware

- CHUWI AuBox
- AMD Ryzen 7 8745HS
- 14 GB RAM
- SSD M.2

Sistema de virtualización

Proxmox VE

Acceso

https://192.168.1.50:8006

---

# 3. Infraestructura virtual

| Sistema | IP | Función |
|-------|------|--------|
| Proxmox | 192.168.1.50 | Host |
| VM_CORE | 192.168.1.51 | Backend + Web |
| VM_DATA | 192.168.1.52 | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |
| LXC_DNS | 192.168.1.5 | Servidor DNS |
---

# 4. Distribución de servicios

VM_CORE

- Nginx
- Backend Node.js
- Redis

VM_DATA

- MariaDB

LXC_MQTT

- Mosquitto MQTT

---

# 5. Principios de diseño

- separación de servicios
- facilidad de mantenimiento
- bajo consumo de recursos
- arquitectura preparada para escalar

Esta estructura permite ampliar el sistema en el futuro separando más servicios si fuese necesario.