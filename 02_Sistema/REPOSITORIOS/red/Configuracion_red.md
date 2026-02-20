# Configuración completa de red WireGuard para la tienda con acceso SSH a VM Ubuntu

Este documento describe paso a paso cómo configurar la red WireGuard en el MikroTik hAP ac³ de la tienda, cómo dar acceso a compañeros y cómo limitar el acceso únicamente a la VM Ubuntu Server dentro de la red.

Arquitectura de red:
- Red local tienda: 192.168.1.0/24
- Proxmox: 192.168.1.2
- VM Ubuntu Server: 192.168.1.50
- Red WireGuard: 10.10.10.0/24
- IP VPN del compañero: 10.10.10.2
Objetivo: acceso únicamente a la VM Ubuntu, sin permitir acceso a Proxmox ni a otras máquinas.

PASO 1: Configuración del MikroTik
1. Crear interfaz WireGuard (ej: wg-lavanderia)
2. Asignar IP: 10.10.10.1/24
3. Abrir puerto UDP en firewall (ej: 13231)
4. Configurar NAT: chain=srcnat, action=masquerade, out-interface=WAN
5. Crear peer para el compañero: Public Key = (clave pública del compañero), Allowed Address = 10.10.10.2/32, Interface = wg-lavanderia

PASO 2: Configuración que se le entrega al compañero (archivo .conf o QR)
[Interface]
PrivateKey = (clave privada del compañero)
Address = 10.10.10.2/24
DNS = 192.168.1.1
[Peer]
PublicKey = (clave pública del MikroTik)
Endpoint = midominio.sn.mynetname.net:13231
AllowedIPs = 192.168.1.50/32
PersistentKeepalive = 25

PASO 3: Configuración de la VM Ubuntu
1. Instalar SSH si no está presente: sudo apt update && sudo apt install openssh-server
2. Verificar SSH activo: sudo systemctl status ssh
3. Crear usuario para el compañero: sudo adduser nombreusuario && sudo usermod -aG sudo nombreusuario
4. Configurar firewall para permitir SSH solo desde VPN:
sudo apt install ufw
sudo ufw allow from 10.10.10.0/24 to any port 22
sudo ufw enable
sudo ufw status

PASO 4: Instrucciones para el compañero
1. Instalar WireGuard desde https://www.wireguard.com/install/
2. Importar la configuración: escanear QR o importar archivo .conf
3. Activar VPN
4. Conectarse a la VM Ubuntu mediante SSH:
ssh nombreusuario@192.168.1.50

PASO 5: Verificación
- Con VPN activo, hacer ping a la VM: ping 192.168.1.50
- Con VPN activo, conectarse por SSH: ssh nombreusuario@192.168.1.50

SEGURIDAD:
- Acceso solo mediante VPN
- Acceso únicamente a la IP de la VM Ubuntu
- Firewall restringe SSH solo a la red WireGuard
- Proxmox y otras máquinas de la tienda no son accesibles desde el VPN
- Opcional: usar clave SSH en lugar de contraseña para mayor seguridad y desactivar PasswordAuthentication en /etc/ssh/sshd_config
