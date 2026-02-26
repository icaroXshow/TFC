# 02 - INFRAESTRUCTURA DEL SISTEMA

## 1. Objetivo de la Infraestructura

La infraestructura del sistema LAVANDERÍA KWL está diseñada bajo un modelo de arquitectura local centralizada, donde todos los servicios críticos se ejecutan dentro de la propia lavandería.

El objetivo principal es:

- Garantizar autonomía total del sistema.
- Evitar dependencia de servicios cloud.
- Aumentar seguridad y control.
- Reducir puntos externos de fallo.
- Permitir acceso remoto exclusivamente mediante VPN.

---

## 2. Infraestructura Física

### 2.1 Servidor Principal

- Hardware: Intel i9
- RAM: 16GB
- Almacenamiento: SSD
- Sistema de virtualización: Proxmox VE

Función:
El servidor actúa como núcleo del sistema ejecutando una máquina virtual Linux que contiene todos los servicios necesarios para el funcionamiento del proyecto.

---

### 2.2 Router y Red

- Modelo: MikroTik hAP ax2
- Función:
  - Gestión de red LAN interna
  - Implementación de VPN mediante WireGuard
  - Aislamiento del servidor de acceso público directo

El servidor no está expuesto a Internet.  
Todo acceso remoto se realiza exclusivamente a través de la VPN.

---

### 2.3 Dispositivos IoT

- Microcontroladores ESP32
- Conectividad WiFi
- Integración mediante protocolo MQTT

Cada ESP32 está instalado en:

- Lavadoras
- Sistema de puerta motorizada
- Sistema de iluminación
- Sistema de ventilación

Los dispositivos ejecutan únicamente acciones físicas, sin lógica de negocio.

---

### 2.4 Sistema de Vigilancia

- Cámaras IP MOBOTIX
- Integradas en la red LAN
- Acceso interno mediante IP local
- Visualización desde el panel web vía iframe

El sistema de cámaras no depende del backend para su funcionamiento, únicamente se integra visualmente en el panel.

---

## 3. Infraestructura Virtual

El servidor ejecuta una única máquina virtual Linux (Debian) que contiene:

- Nginx (Servidor Web)
- PHP (Backend)
- MariaDB (Base de datos)
- Redis (Cache y gestión en tiempo real)
- Mosquitto (Broker MQTT)
- Servidor WebSocket

Esta decisión simplifica la implementación del TFC manteniendo separación lógica entre componentes.

---

## 4. Red Interna

Estructura simplificada:

[ Usuario remoto ]
        │
      (VPN)
        │
[ Router MikroTik ]
        │
       LAN
        │
[ Servidor Proxmox ]
        │
        ├── VM Linux
        │     ├── Backend
        │     ├── Base de Datos
        │     ├── MQTT
        │     └── WebSocket
        │
        └── Comunicación MQTT
                │
        ┌───────────────┬───────────────┬───────────────┐
        │               │               │
     [ESP32]        [ESP32]         [Relés]
     (Lavadora)     (Puerta)        (Luces)

---

## 5. Principios de Infraestructura

- Arquitectura 100% local.
- Separación entre lógica (servidor) y ejecución física (ESP32).
- Comunicación basada en eventos (MQTT).
- Acceso externo únicamente mediante VPN.
- No exposición directa de puertos a Internet.
- Registro de acciones críticas en base de datos.

---

## 6. Decisiones Técnicas para el TFC

Para la versión de TFC:

- Todos los servicios se ejecutan en una única VM.
- Se controla una única máquina física.
- No se implementa redundancia.
- No se implementa balanceo de carga.
- La arquitectura está preparada para escalar, pero no se despliega escalabilidad en esta fase.

---

## 7. Escalabilidad Futura

En la versión completa (8 meses) se contemplan:

- Separación de servicios en múltiples VMs.
- Alta disponibilidad.
- Sistema de backup automatizado.
- Segmentación avanzada de red.
- Monitorización avanzada.
- Soporte para múltiples lavanderías sincronizadas.
