# Guía completa para configurar VPN en Router Mikrotik y acceder a Proxmox

## 1. **Configurar Router 1 (Movistar)**

### Paso 1: Configurar DynDNS
1. **Accede a la interfaz de administración de Router 1** (Movistar) a través de su IP local, normalmente `192.168.1.1` o `192.168.0.1`.
2. En el menú de **Red** o **WAN**, busca la opción de **DynDNS**.
3. Configura un servicio de DynDNS con un proveedor gratuito o de pago, como `No-IP` o `DynDNS`.
4. Introduce tus credenciales de DynDNS (nombre de usuario, contraseña y dominio) para que se actualice automáticamente la IP pública de tu router.
5. Guarda la configuración. Ahora podrás acceder a tu red interna con un nombre de dominio fijo, como `midominio.ddns.net`.

### Paso 2: Configurar el reenvío de puertos (port forwarding)
1. Accede a la configuración de **NAT/Puertos** en Router 1.
2. Crea una nueva regla de **port forwarding** que redirija el puerto de la VPN (por ejemplo, **UDP 51820** si usas WireGuard) hacia la IP interna de **Mikrotik**.
3. Asegúrate de que el puerto que has configurado en Router 1 (por ejemplo, 51820) se redirige al mismo puerto en Router 2.
4. Guarda los cambios.

---

## 2. **Configurar Router 2 (Mikrotik)**

### Paso 1: Configurar la red interna de Router 2
1. Accede a la interfaz de administración de Router 2 (a través de su IP interna, por ejemplo, `192.168.2.1`).
2. Asegúrate de que **Router 2** está en una subred diferente a Router 1, por ejemplo, **192.168.2.x**.
3. Configura el **DHCP** en Router 2 para asignar direcciones IP dentro de esa subred (por ejemplo, rango `192.168.2.100 - 192.168.2.200`).
4. Asegúrate de que la IP del **servidor Proxmox** esté dentro de esa subred (por ejemplo, `192.168.2.10`).

### Paso 2: Configurar VPN en Router 2
1. **Accede a Router 2** y busca la sección de **VPN** o **WireGuard**.
2. Si Router 2 soporta WireGuard nativamente, habilita y configura un servidor VPN:
   - **Genera las claves** públicas y privadas para el servidor y el cliente (esto puede ser generado desde la interfaz del router o con herramientas como `wg genkey`).
   - **Configura el puerto de la VPN** (por ejemplo, UDP 51820 para WireGuard) y las direcciones IP que recibirán los clientes VPN (ejemplo: `10.8.0.0/24`).
   - Añade la **IP interna de tu servidor Proxmox** (ejemplo: `192.168.2.10`) como una red accesible para la VPN.
   - Guarda la configuración.
   
3. Si Router 2 **no soporta WireGuard**, puedes instalar **WireGuard** en un **dispositivo en la red de Router 2**, como un **PC** o un **Raspberry Pi**. Asegúrate de que este dispositivo tenga una IP estática (ejemplo: `192.168.2.5`).

### Paso 3: Configurar la conexión de cliente VPN
1. Genera un archivo de configuración para el **cliente WireGuard** (el archivo `.conf`) que incluya:
   - La **clave pública del servidor VPN**.
   - La **dirección de tu DynDNS** (`midominio.ddns.net`).
   - El **puerto VPN** que configuraste en el router (ej. 51820).
   - La **clave privada** del cliente.
   - La **dirección IP interna** de la red VPN (ej. `10.8.0.x`).
2. Envía este archivo al administrador (o al dueño de la lavandería) para que lo use en su dispositivo cliente (PC o móvil).

---

## 3. **Configurar servidor (Proxmox)**

1. Conéctate a **Proxmox** a través de la IP interna de la red de Router 2 (ej. `192.168.2.10`).
2. Si aún no lo has hecho, asigna una **IP estática** a la interfaz de red de Proxmox dentro de la subred de Router 2:
   - Edita el archivo `/etc/network/interfaces` y agrega:
     ```bash
     auto eth0
     iface eth0 inet static
     address 192.168.2.10
     netmask 255.255.255.0
     gateway 192.168.2.1
     ```
3. Reinicia la red o el servidor Proxmox:
     ```bash
     systemctl restart networking
     ```
## 4. Acceso remoto a Proxmox
Paso 1: Conectarse desde fuera a través de la VPN

    1. Conéctate a la VPN desde tu PC o móvil utilizando el perfil de cliente VPN que configuraste previamente.

        En PC: Usa WireGuard para importar el archivo de configuración .conf y conectar.
        En móvil: Usa la app WireGuard y carga el archivo de configuración .conf que te envíen.

    2. Verifica la conexión:
        Realiza un ping desde tu dispositivo conectado a la VPN a la IP de Proxmox (192.168.2.10): 
        ping 192.168.2.10
        
    3. Si el ping tiene éxito, abre el navegador y accede a Proxmox:
       https://192.168.2.10:8006

## Consideraciones adicionales

- Seguridad: Asegúrate de que tu servidor Proxmox esté protegido con un firewall y no se exponga directamente a Internet. Solo debe ser accesible a través de la VPN.

- Redirección de puertos: Si estás usando un dispositivo externo para el servidor VPN (en caso de que Router 2 no lo soporte), asegúrate de que Router 1 redirija el puerto correspondiente (por ejemplo, 51820 UDP) hacia el dispositivo con WireGuard.

- DynDNS: Si no has configurado un servicio de DynDNS correctamente, no podrás acceder a la VPN desde fuera, ya que la IP de Router 1 cambiará cada vez que se reinicie.

- Redireccionamiento NAT: El reenvío de puertos en Router 1 debe estar correctamente configurado para que las conexiones entrantes al puerto de la VPN (51820) sean redirigidas hacia Router 2.
