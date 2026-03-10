# mqtt_contexto.md

# MQTT — Infraestructura IoT

## 1. Objetivo

Este módulo gestiona la comunicación entre el servidor del sistema y los dispositivos IoT instalados en la infraestructura.

La comunicación se realiza mediante el protocolo **MQTT**, utilizando el broker **Mosquitto**.

MQTT permite comunicación en tiempo real entre:

- Backend del sistema
- Dispositivos ESP32
- Sensores y actuadores
- Eventos del sistema

Este sistema permite controlar dispositivos físicos y recibir estados de manera eficiente y con baja latencia.

---

# 2. Ubicación en la Infraestructura

Dentro de la infraestructura del proyecto, el broker MQTT se ejecuta en un contenedor dedicado.

Arquitectura simplificada:
Proxmox
│
├─ VM_CORE
│ Backend
│ API
│ Web
│
├─ LXC_DATA
│ MariaDB
│
├─ LXC_MQTT
│ Mosquitto MQTT Broker
│
└─ otros servicios


IP del broker MQTT: 192.168.1.53

El broker está accesible únicamente desde:

- red local
- VPN

No está expuesto a internet.

---

# 3. Rol dentro del sistema

MQTT actúa como intermediario entre el software y el hardware.

Flujo típico del sistema:
Usuario
│
Panel Web
│
Backend (VM_CORE)
│
MQTT Broker
│
ESP32
│
Relés / sensores / dispositivos


Ejemplo:

1. usuario inicia lavadora desde el panel
2. backend publica un mensaje MQTT
3. ESP32 recibe el comando
4. ESP32 activa el relé
5. ESP32 envía estado al broker
6. backend actualiza el sistema

---

# 4. Características de MQTT

MQTT es un protocolo diseñado para IoT.

Ventajas principales:

- protocolo extremadamente ligero
- baja latencia
- comunicación basada en eventos
- escalable
- ideal para microcontroladores

Los dispositivos se comunican mediante **topics**.

Un dispositivo puede:

- **publicar** mensajes
- **suscribirse** a mensajes

---

# 5. Estructura básica de Topics

Para organizar la comunicación se usa una estructura jerárquica.

Ejemplo:
kwl/
maquinas/
lavadora1/
comando
estado
evento

Tipos de topics:

### comandos

Mensajes enviados por el backend.

Ejemplo: kwl/maquinas/lavadora1/comando

---

### estado

Información enviada por el dispositivo.

Ejemplo: kwl/maquinas/lavadora1/estado


---

### eventos

Eventos generados por hardware.

Ejemplos:
coin_inserted
cycle_finished
door_open
error


---

# 6. Seguridad

El broker utiliza autenticación mediante usuario y contraseña.

Medidas de seguridad actuales:

- autenticación obligatoria
- acceso solo desde red interna
- broker no expuesto a internet
- acceso remoto únicamente mediante VPN

Estas medidas reducen significativamente el riesgo de accesos no autorizados.

---

# 7. Uso dentro del proyecto

MQTT se utilizará para:

- control de máquinas
- lectura de sensores
- notificación de eventos
- comunicación con dispositivos ESP32
- automatización del sistema

Permite ampliar el sistema fácilmente con nuevos dispositivos.

---

# 8. Futuras mejoras

Posibles mejoras del sistema MQTT:

- TLS interno
- control de acceso por topics (ACL)
- monitorización del broker
- sistema de eventos centralizado
- retained messages para estados
- Last Will and Testament

Estas mejoras permitirán escalar el sistema a más dispositivos sin modificar la arquitectura base.
