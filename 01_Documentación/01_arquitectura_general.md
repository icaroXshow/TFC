
# ARQUITECTURA GENERAL DEL SISTEMA

## 1. Visión Global

El sistema está diseñado bajo una arquitectura centralizada local, donde un servidor actúa como núcleo de control y los dispositivos ESP32 ejecutan las acciones físicas.

No se utilizan servicios en la nube. Todo opera dentro de la red local de la lavandería y es accesible remotamente únicamente mediante VPN.

---

## 2. Componentes Principales

### 2.1 Servidor Local (Infraestructura Central)
Ubicación: Proxmox (Servidor físico en lavandería)

Contiene una máquina virtual Linux que ejecuta:

- Nginx (Servidor web)
- PHP (Backend)
- MariaDB (Base de datos)
- Redis (Cache y tiempo real)
- Mosquitto (Broker MQTT)
- WebSocket Server

Función:
- Gestionar usuarios
- Procesar lógica de negocio
- Emitir comandos
- Registrar auditoría
- Mantener estado de tienda
- Servir panel web
- Comunicarse con ESP32

---

### 2.2 Router con VPN
Ubicación: Red local (MikroTik hAP ax3)

Función:
- Gestionar red LAN
- Proveer acceso remoto seguro mediante WireGuard
- No exponer directamente el servidor a Internet

---

### 2.3 Dispositivos IoT (ESP32)
Ubicación: Interior de máquinas / cuadro eléctrico

Funciones:
- Conectarse a la red WiFi local
- Comunicarse con el servidor mediante MQTT
- Ejecutar acciones físicas:
  - Encendido / apagado máquinas
  - Reinicio controlado
  - Inyección de pulsos de crédito
  - Subir / bajar puerta
  - Encender / apagar luces
- Enviar confirmaciones (ACK)
- Reportar estado

---

### 2.4 Sistema de Vigilancia (CCTV)
Ubicación: Red LAN

Componentes:
- Cámaras IP MOBOTIX
- Acceso web mediante dirección interna

Función:
- Supervisión del local
- Visualización desde el panel web (vía iframe o acceso directo)
- Acceso solo mediante VPN

---

## 3. Diagrama Simplificado de Arquitectura



[ Usuario remoto ]
│
(VPN)
│
[ Router MikroTik ]
│
│ LAN
│
[ Servidor Proxmox ]
│
├── VM Linux Debian
│ ├── Nginx + PHP (Backend)
│ ├── MariaDB
│ ├── Redis
│ └── Mosquitto MQTT
│
│ MQTT
│
┌───────────────┬───────────────┬───────────────┐
│ │ │ │
[ ESP32 ] [ ESP32 ] [ Puerta ] [ Luces ]
(Máquina) (Máquina) (Relés motor) (Relés)


---

## 4. Flujo General de Comunicación

1. Usuario interactúa con el panel web.
2. El backend procesa la acción.
3. Si es una acción física:
   - Se publica un mensaje MQTT.
4. El ESP32 recibe el comando.
5. Ejecuta la acción física.
6. Envía confirmación.
7. El backend actualiza estado y lo envía al frontend mediante WebSocket.

---

## 5. Principios Arquitectónicos

- Arquitectura local y autónoma.
- Separación clara entre lógica (servidor) y ejecución física (ESP32).
- Comunicación basada en eventos (MQTT).
- Acceso externo únicamente mediante VPN.
- Sin dependencia de servicios cloud.

---

## 6. Decisiones Técnicas Clave (Versión TFC)

- Todos los servicios se ejecutan en una única VM por simplicidad.
- La VPN se implementa en el router.
- Las cámaras no se gestionan desde el backend, solo se visualizan.
- El sistema está preparado para escalar, pero se implementa una única lavandería.

---
