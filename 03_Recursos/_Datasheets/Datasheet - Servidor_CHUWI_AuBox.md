
# DATASHEET – Servidor CHUWI AuBox

---

## 1. Identificación

- **Modelo:** AuBox 8745  
- **Fabricante:** CHUWI  
- **Categoría:** Servidor local / Mini-PC  
- **Ubicación física:** Infraestructura IT de la lavandería  
- **Nivel de criticidad:** Crítico

---

## 2. Descripción y Función en el Sistema

El **CHUWI AuBox** actúa como servidor central del sistema **LAVANDERÍA KWL**.

Este equipo ejecuta el entorno de virtualización y alberga todos los servicios necesarios para el control y gestión del sistema de la lavandería.

Desde este servidor se ejecutan:

- Backend web
- Base de datos
- Broker MQTT
- Sistema de eventos en tiempo real
- Panel web de control
- Sistema de auditoría

Principio arquitectónico:

> El servidor decide, los controladores ejecutan.

---

## 3. Especificaciones Técnicas (Fabricante)

### Procesador
- CPU: AMD Ryzen 7 8745HS
- Arquitectura: Zen 4
- Núcleos / hilos: 8 cores / 16 threads
- Frecuencia turbo aproximada: hasta ~4.9 GHz

### Memoria
- RAM instalada: 14 GB DDR5
- Tipo: DDR5 SO-DIMM

### Almacenamiento
- Disco instalado: 500 GB NVMe SSD
- Interfaz: PCIe NVMe

### Red
- 2 × Ethernet Gigabit
- WiFi integrado (según configuración)
- Bluetooth integrado

### Puertos
- USB 3.x
- USB‑C
- HDMI
- DisplayPort
- Ethernet RJ45
- Jack audio

### Gráficos
- GPU integrada AMD Radeon

### Alimentación
- Adaptador externo DC
- Consumo estimado: 15W – 45W dependiendo de carga

---

## 4. Implementación en LAVANDERÍA KWL

El servidor ejecuta **Proxmox VE** como hipervisor.

### Máquina virtual principal

Sistema operativo:
Debian Linux

Servicios desplegados:

- Nginx
- PHP
- MariaDB
- Redis
- Mosquitto MQTT
- WebSocket server

Funciones dentro del sistema:

- Gestión de usuarios
- Registro de auditoría
- Control de máquinas
- Gestión de créditos
- Automatización del local
- Integración con cámaras IP
- Panel web de control

---

## 5. Seguridad y Dependencias

El servidor **no está expuesto directamente a Internet**.

Acceso remoto únicamente mediante:

- VPN WireGuard

Topología:

Internet  
→ Router Movistar  
→ Router MikroTik (VPN)  
→ LAN interna  
→ Servidor CHUWI AuBox

Medidas de seguridad:

- acceso mediante VPN
- servicios no expuestos públicamente
- registro de acciones críticas en base de datos

---

## 6. Riesgos y Consideraciones Técnicas

### Punto único de fallo

El servidor es el centro del sistema. Su fallo implica:

- pérdida del panel web
- pérdida del control remoto
- pérdida de automatización

Las máquinas seguirían funcionando manualmente.

### Medidas de mitigación

- hardware sobredimensionado
- arquitectura preparada para backups futuros
- sistema completamente local sin dependencia cloud
- Sistema de ventilacion de alto flujo

### Consideraciones térmicas

El equipo opera con consumo relativamente bajo para su potencia, reduciendo generación de calor y mejorando estabilidad.
