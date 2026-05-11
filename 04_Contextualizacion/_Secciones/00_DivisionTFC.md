# División del Proyecto TFC

El proyecto se divide en varias fases que cubren desde la infraestructura hasta el desarrollo del sistema completo.

Para el TFC se implementa una **versión funcional básica**, mientras que la arquitectura está preparada para una versión completa posterior.

---

# 1. Fase Previa

### Identidad Visual
Diseño de interfaz y branding utilizando Penpot.

### Infraestructura de Red
Configuración de acceso remoto seguro mediante VPN WireGuard.

### Configuración del Servidor
Configuración del servidor físico utilizando Proxmox como plataforma de virtualización.

---

# 2. Desarrollo del Sistema

## Frontend
Interfaz web responsive que permite:

- Panel de control
- Visualización de actividad
- Estado de máquinas
- Gestión de usuarios
- Control de automatización de la tienda
- Visualización de cámaras

## Backend
API desarrollada en Node.js + TypeScript que gestiona:

- Lógica del sistema
- Usuarios
- Auditoría
- Comunicación con dispositivos
- Integración con base de datos

Servicios utilizados:

- Nginx
- Node.js
- MariaDB
- Redis
- Mosquitto (MQTT)

## Base de Datos
Base de datos relacional MariaDB encargada de almacenar:

- Usuarios
- Máquinas
- Créditos
- Eventos
- Auditoría

## Domótica / IoT

Controladores ESP32 encargados de:

- Conexión WiFi
- Cliente MQTT
- Recepción de comandos
- Control de relés
- Lectura de pulsos del monedero
- Envío de estado al servidor
- Sistema watchdog

---

# 3. Arquitectura de Comunicación

Frontend (Web)
        │
        ▼
Backend (API Node.js)
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
MariaDB Redis  Mosquitto
                    │
                    ▼
                 ESP32

---

# 4. Entrega del TFC

La entrega incluye:

- Documentación completa
- Diagramas de arquitectura
- Capturas de funcionamiento
- Presentación
- Maquetación final en PDF
