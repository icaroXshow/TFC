# ARQUITECTURA GENERAL DEL SISTEMA

## 1. Visión Global

El sistema está diseñado bajo una arquitectura local centralizada basada en virtualización.

Todos los servicios del sistema se ejecutan dentro de un servidor físico instalado en la lavandería.  
Este servidor utiliza **Proxmox VE** como plataforma de virtualización para separar los diferentes servicios del sistema.

El sistema no depende de servicios en la nube.  
Todo opera dentro de la red local y el acceso remoto se realiza exclusivamente mediante VPN.

---

# 2. Componentes Principales

## 2.1 Servidor de Infraestructura

Ubicación: Servidor físico en la lavandería.

Hardware:

- CHUWI AuBox
- AMD Ryzen 7 8745HS
- 14 GB RAM
- SSD M.2

El servidor ejecuta **Proxmox VE**, que permite crear máquinas virtuales y contenedores para separar los distintos servicios del sistema.

Dirección del host:

Proxmox  
https://192.168.1.50:8006

---

# 3. Infraestructura Virtual

El servidor Proxmox ejecuta varias instancias virtualizadas.

## VM_CORE

IP: 192.168.1.51

Servicios:

- Nginx
- Backend PHP
- Redis

Función:

Gestionar la lógica del sistema, servir el panel web y coordinar la comunicación con los dispositivos IoT.

Acceso al panel web:

http://192.168.1.51

---

## VM_DATA

IP: 192.168.1.52

Servicios:

- MariaDB

Función:

Almacenar toda la información persistente del sistema:

- usuarios
- máquinas
- créditos
- auditoría
- eventos

Separar la base de datos en una VM independiente mejora la organización y permite escalar el sistema en el futuro.

---

## LXC_MQTT

IP: 192.168.1.53

Servicios:

- Mosquitto MQTT

Función:

Gestionar la comunicación en tiempo real entre el servidor y los dispositivos ESP32 mediante el protocolo MQTT.

El uso de un contenedor permite un consumo reducido de recursos.

---

# 4. Router y Red

Dispositivo:

MikroTik hAP ax2

Funciones:

- gestión de la red LAN
- servidor VPN WireGuard
- control de acceso a la red interna

El servidor no está expuesto directamente a Internet.  
Todo acceso externo se realiza únicamente mediante VPN.

---

# 5. Dispositivos IoT

Los dispositivos ESP32 se instalan dentro de las máquinas y sistemas del local.

Funciones:

- conexión WiFi
- cliente MQTT
- ejecución de acciones físicas
- envío de estado al servidor

Las acciones físicas incluyen:

- control de máquinas
- control de puerta
- control de luces
- control de ventilación
- gestión de pulsos del monedero

---

# 6. Sistema de Vigilancia

El sistema incluye dispositivos MOBOTIX:

- cámaras IP
- altavoz IP

Estos dispositivos funcionan dentro de la red local y pueden visualizarse desde el panel web.

---

# 7. Flujo General del Sistema

1. El usuario interactúa con el panel web.
2. El backend procesa la acción.
3. Si se requiere una acción física, el backend publica un mensaje MQTT.
4. El ESP32 recibe el comando.
5. Ejecuta la acción.
6. Envía confirmación al servidor.
7. El backend actualiza el estado del sistema.