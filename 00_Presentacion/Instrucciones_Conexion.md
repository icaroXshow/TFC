# Guía para conectarse a la VPN de la lavandería usando **WireGuard**

Esta guía te ayudará a conectarte de forma segura a la red interna de la lavandería desde fuera usando **WireGuard**. WireGuard es una VPN rápida y fácil de usar. Aquí te explicamos los pasos para conectarte desde tu **PC** y tu **móvil**.

## 1. **Instrucciones para conectarse desde tu PC**

### Paso 1: Instalar **WireGuard** en tu PC
1. Dirígete a [WireGuard - Página de descarga](https://www.wireguard.com/install/) y selecciona la versión adecuada para tu sistema operativo.
2. Descarga e instala el cliente WireGuard.

### Paso 2: Configuración de WireGuard
1. Recibirás un archivo de configuración llamado `wg0.conf` (o un nombre similar). Este archivo contiene toda la configuración necesaria para que puedas conectarte de forma segura a la red.
2. Abre el cliente de **WireGuard** en tu PC.
3. Haz clic en **"Importar configuración"** y selecciona el archivo `wg0.conf` que te hemos enviado.
4. Una vez importado, verás el perfil de conexión en la interfaz de WireGuard.

### Paso 3: Conectar a la VPN
1. Haz clic en **"Activar"** (o **"Conectar"**) para iniciar la conexión VPN.
2. WireGuard se conectará y te asignará una IP en la red interna de la lavandería.
3. **¡Listo!** Ahora puedes acceder a la red de la lavandería como si estuvieras dentro de la misma.

### Paso 4: Acceder a tu servidor Proxmox
1. Abre tu navegador y escribe la dirección IP de tu servidor Proxmox:
   - https://192.168.2.10:8006

   - **Nota:** La dirección `192.168.2.10` es solo un ejemplo. La IP de tu servidor puede ser diferente, asegúrate de que tienes la     correcta.
2. Inicia sesión con tus credenciales de **Proxmox**.

---

## 2. **Instrucciones para conectarse desde tu móvil (Android / iOS)**

### Paso 1: Instalar **WireGuard** en tu móvil
1. Ve a la **Play Store** (Android) o **App Store** (iOS) y descarga la aplicación **WireGuard**.
- [WireGuard en Google Play](https://play.google.com/store/apps/details?id=com.wireguard.android)
- [WireGuard en App Store](https://apps.apple.com/us/app/wireguard/id1441195209)

### Paso 2: Configuración de WireGuard en el móvil
1. Recibirás el mismo archivo de configuración `wg0.conf`.
2. Abre la app de **WireGuard** en tu móvil.
3. En la app, haz clic en **"Importar"** y selecciona el archivo `wg0.conf` que te hemos enviado.
4. Una vez importado, verás el perfil de conexión en la app.

### Paso 3: Conectar a la VPN
1. Dentro de la app de **WireGuard**, haz clic en **"Activar"** (o **"Conectar"**) para iniciar la conexión VPN.
2. WireGuard se conectará y te asignará una IP en la red interna de la lavandería.
3. **¡Listo!** Ahora tienes acceso seguro a la red de la lavandería.

### Paso 4: Acceder a tu servidor Proxmox
1. Abre tu navegador móvil y escribe la dirección IP de tu servidor Proxmox:
   - https://192.168.2.10:8006
2. Inicia sesión con tus credenciales de **Proxmox**.

---

## Consejos adicionales

- **Verificación de la conexión**: Si en algún momento no puedes conectarte, revisa que la VPN esté activa en el cliente y que tu dispositivo esté conectado correctamente.
- **Seguridad**: Asegúrate de desconectar la VPN cuando ya no la necesites. No dejes la conexión VPN activa innecesariamente.
- **Redirección de puertos**: Si tienes problemas para conectarte, asegúrate de que el **Router 1** esté configurado para redirigir el puerto **WireGuard** (51820 por defecto) a **Router 2**.

---

¡Listo! Con estos pasos podrás acceder a tu red y servidor Proxmox de forma segura desde cualquier lugar.
