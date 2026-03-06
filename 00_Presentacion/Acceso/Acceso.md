# Acceso SSH a Servidor KWL mediante VPN WireGuard

Este documento explica cómo conectarse por SSH a la máquina Ubuntu Server de la lavanderia usando WireGuard.

Arquitectura:
- Red local tienda: 192.168.1.0/24
- Proxmox: 192.168.1.50 (Vista espectador)
- VM Ubuntu Server: 192.168.1.51 (Vista espectador)
- Red WireGuard: 10.8.0.0/24

# Cliente para cada profesor:
- Sonia: Cliente_1.conf
- Molinero: Cliente_2.conf
- Belkis: Cliente_3.conf
- Javier: Cliente_4.conf
- Elena: Cliente_5.conf

El acceso está limitado únicamente a la VM Ubuntu

## INSTRUCCIONES PARA EL CLIENTE
1️⃣ Instalar WireGuard desde https://www.wireguard.com/install/
2️⃣ Importar configuración: escanear QR o importar archivo .conf
3️⃣ Activar VPN
4️⃣ Conectarse por SSH: ssh vision@192.168.1.51

Flujo de conexión:
1. Activar WireGuard
2. Obtener IP 10.8.0.2
3. Conectarse a 192.168.1.51 por SSH
4. Acceso únicamente a la VM Ubuntu
5. Desde navegador acceder a 192.168.1.50 para entrar en servidor Proxmox

Seguridad:
- Acceso solo mediante VPN
- Acceso solo a una IP específica
- Firewall restringe SSH solo permite desde la red WireGuard
- Proxmox no es accesible

Verificación rápida:
 ping 192.168.1.50
 ping 192.168.1.51
 ssh nombreusuario@192.168.1.51

## Acceso Espectador
usuario: invitado
Clave: POWDERING363-flap363-detection363-algebra363-aptitude363-flier
