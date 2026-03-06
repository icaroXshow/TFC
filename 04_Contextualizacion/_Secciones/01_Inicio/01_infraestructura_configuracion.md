# Configuración de la Infraestructura

## 1. Propósito del documento

Este documento describe el proceso utilizado para configurar la infraestructura del sistema.

Su objetivo es permitir reconstruir el entorno completo del proyecto en caso de:

- reinstalación del sistema
- migración a nuevo hardware
- replicación del proyecto
- auditoría técnica

Incluye la configuración de:

- red
- router
- VPN
- integración del servidor

---

# 2. Preparación de la red local

La red del sistema utiliza la subred:

192.168.1.0/24

Configuración principal:

Gateway  
192.168.1.1

Servidor  
192.168.1.50

Se reservaron direcciones IP estáticas para los sistemas principales.

| Sistema | IP |
|------|------|
| Proxmox | 192.168.1.50 |
| VM_CORE | 192.168.1.51 |
| VM_DATA | 192.168.1.52 |
| LXC_MQTT | 192.168.1.53 |

---

# 3. Configuración del router MikroTik

El router utilizado es:

MikroTik hAP ax2

Configuraciones principales aplicadas:

- red LAN
- DHCP
- firewall
- servidor VPN WireGuard

---

# 4. Configuración de red LAN

Se configuró la red local:

LAN

192.168.1.0/24

Gateway

192.168.1.1

DHCP habilitado para dispositivos cliente.

Las direcciones del servidor se configuraron como **IPs estáticas**.

---

# 5. Configuración de la VPN WireGuard

Se configuró WireGuard en el router MikroTik para permitir acceso remoto seguro.

Red VPN

10.8.0.0/24

Cada cliente VPN recibe una dirección dentro de esta red.

Ejemplo:

10.8.0.2  
10.8.0.3

Configuración básica:

- generación de claves
- creación de interfaz WireGuard
- configuración de peers
- apertura de puerto en firewall

Puerto utilizado

UDP 51820

---

# 6. Configuración de acceso remoto

El router permite acceso remoto únicamente mediante VPN.

Los servicios internos no se exponen directamente a Internet.

Una vez conectado a la VPN se puede acceder a:

Proxmox

https://192.168.1.50:8006

Panel web

http://192.168.1.51

Servicios internos

192.168.1.52  
192.168.1.53

---

# 7. Integración del servidor en la red

El servidor Proxmox se configuró con dirección IP estática.

IP

192.168.1.50

Gateway

192.168.1.1

Red

192.168.1.0/24

Esto permite que el servidor sea accesible desde la red local y desde la VPN.

---

# 8. Integración de dispositivos IoT

Los dispositivos ESP32 se conectan a la red WiFi del router.

Configuración típica:

SSID

Red del local

Conexión MQTT

192.168.1.53

Puerto MQTT

1883

Esto permite que los dispositivos publiquen y reciban eventos desde el servidor.

---

# 9. Verificación de la infraestructura

Para comprobar que la infraestructura funciona correctamente se realizan las siguientes pruebas.

Conectividad:

ping 192.168.1.50  
ping 192.168.1.51  
ping 192.168.1.52  
ping 192.168.1.53

Acceso web:

https://192.168.1.50:8006  
http://192.168.1.51

Prueba MQTT:

conexión de ESP32 al broker.

---

# 10. Resultado final

Una vez completados todos los pasos la infraestructura queda configurada de la siguiente forma:

Internet  
│  
Router ISP  
│  
Router MikroTik  
│  
LAN 192.168.1.0/24  
│  
Servidor Proxmox  
│  
VM_CORE  
VM_DATA  
LXC_MQTT  
│  
ESP32