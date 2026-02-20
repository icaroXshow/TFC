# Acceso SSH a Servidor KWL mediante VPN WireGuard

Este documento explica cómo conectarse por SSH a la máquina Ubuntu Server de la tienda usando WireGuard.

Arquitectura:
- Red local tienda: 192.168.1.0/24
- Proxmox: 192.168.1.2 (No accesible)
- VM Ubuntu Server: 192.168.1.50
- Red WireGuard: 10.10.10.0/24

- IP VPN de ejemplo del cliente: 10.10.10.2
El acceso está limitado únicamente a la VM Ubuntu.

## INSTRUCCIONES PARA EL CLIENTE
1️⃣ Instalar WireGuard desde https://www.wireguard.com/install/
2️⃣ Importar configuración: escanear QR o importar archivo .conf
3️⃣ Activar VPN
4️⃣ Conectarse por SSH:
ssh nombreusuario@192.168.1.50

Flujo de conexión:
1. Activar WireGuard
2. Obtener IP 10.10.10.2
3. Conectarse a 192.168.1.50 por SSH
4. Acceso únicamente a la VM Ubuntu
5. Desde navegador acceder a 

Seguridad:
- Acceso solo mediante VPN
- Acceso solo a una IP específica
- Firewall restringe SSH solo permite desde la red WireGuard
- Proxmox no es accesible

Verificación rápida:
 ping 192.168.1.50
 ssh nombreusuario@192.168.1.50
