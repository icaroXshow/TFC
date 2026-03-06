# Acceso SSH a Servidor KWL mediante VPN WireGuard
Este documento explica cómo conectarse por SSH a las máquinas Ubuntu Server de la lavanderia usando WireGuard.

# Cliente para cada profesor: (Ver 7z)
- Sonia: Cliente_1.conf
- Molinero: Cliente_2.conf
- Belkis: Cliente_3.conf
- Javier: Cliente_4.conf
- Elena: Cliente_5.conf

 * Nota: El acceso está limitado 

## INSTRUCCIONES PARA EL PROFESOR
1️⃣ Instalar WireGuard desde https://www.wireguard.com/install/
2️⃣ Importar configuración: escanear QR o importar cliente_x.conf
3️⃣ Activar VPN
4️⃣ Conectarse por SSH: ssh invitado@192.168.1.5x

Flujo de conexión:
1. Activar WireGuard
2. Obtener IP 10.8.0.2
3. Conectarse a 192.168.1.5x por SSH
4. Acceso únicamente a las VM Ubuntu y contenedor LXC Debian
5. Desde navegador acceder a 192.168.1.50 para entrar en servidor Proxmox

Seguridad:
- Acceso solo mediante VPN
- Acceso solo a una IP específica
- Firewall restringe SSH solo permite desde la red WireGuard
- Proxmox no es accesible

## Acceso SSH a Maquinas
VM-CORE
 CMD: ssh invitado@192.168.1.51
VM-DATA
 CMD: ssh invitado@192.168.1.52
LXC-MQTT
 CMD: ssh invitado@192.168.1.53

## Acceso Espectador a Proxmox
1️⃣ SSH
 CMD: ssh invitado@192.168.1.50
 Clave: POWDERING363-flap363-detection363-algebra363-aptitude363-flier

2️⃣ NAVEGADOR
URL: https://192.168.1.50:8006

Introducir:
 - usuario: invitado
 - Clave: POWDERING363-flap363-detection363-algebra363-aptitude363-flier
 - Realm: Proxmox VE authentication server