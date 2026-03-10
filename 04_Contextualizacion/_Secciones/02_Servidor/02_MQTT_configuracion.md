# mqtt_configuracion.md

# Configuración del servidor MQTT

Este documento explica cómo configurar el broker MQTT utilizado en la infraestructura.

El broker utilizado es **Mosquitto**.

Servidor:
LXC_MQTT 
IP: 192.168.1.53


---

# 1. Crear el contenedor

El broker MQTT se ejecuta en un contenedor LXC dentro de Proxmox.

Configuración recomendada:
CPU: 1
RAM: 512MB
Disco: 4GB
Red: bridge vmbr0
IP: 192.168.1.53

Sistema operativo recomendado: Debian

---

# 2. Actualizar el sistema

Entrar al contenedor.
pct enter <ID_CONTENEDOR>

Actualizar paquetes.
apt update
apt upgrade -y

---

# 3. Instalar Mosquitto

Instalar el broker MQTT y las herramientas cliente.
apt install mosquitto mosquitto-clients -y

Los comandos instalados incluyen:
mosquitto
mosquitto_pub
mosquitto_sub

---

# 4. Crear usuario MQTT

Para evitar accesos anónimos se utiliza autenticación.

Crear archivo de usuarios.
mosquitto_passwd -c /etc/mosquitto/passwd kwl

Introducir contraseña cuando se solicite.

Ajustar permisos:
chown root:mosquitto /etc/mosquitto/passwd
chmod 640 /etc/mosquitto/passwd

---

# 5. Configurar Mosquitto

Crear archivo de configuración personalizado.
nano /etc/mosquitto/conf.d/kwl.conf

Contenido recomendado:
listener 1883 0.0.0.0

allow_anonymous false
password_file /etc/mosquitto/passwd

log_type error
log_type warning
log_type notice
log_type information

autosave_interval 180

---

# 6. Verificar configuración

Antes de arrancar el servicio es recomendable verificar la configuración.
mosquitto -c /etc/mosquitto/mosquitto.conf -v

Si no hay errores, el broker debería iniciar correctamente.

Cancelar con: CTRL + C

---

# 7. Iniciar el servicio

Reiniciar el servicio:
systemctl restart mosquitto

Comprobar estado:
systemctl status mosquitto

Habilitar inicio automático:
systemctl enable mosquitto

---

# 8. Verificar puerto

Comprobar que el broker escucha en el puerto MQTT.
ss -tulpn | grep 1883

---

# 9. Probar funcionamiento

Suscribirse a un topic:
mosquitto_sub -h 192.168.1.53 -u kwl -P PASSWORD -t test/# -v

Publicar mensaje: mosquitto_pub -h 192.168.1.53 -u kwl -P PASSWORD -t test/hola -m "mensaje de prueba"

Si todo funciona, el mensaje aparecerá en la consola del suscriptor.

---

# 10. Probar desde otra máquina

Desde otra máquina de la red instalar clientes MQTT.
apt install mosquitto-clients

Probar conexión con el broker:
mosquitto_sub -h 192.168.1.53 -u kwl -P PASSWORD -t test/# -v

Si recibe mensajes correctamente, el broker está operativo.

---

# 11. Logs del sistema

Ver logs del servicio:
journalctl -u mosquitto -f

Archivo de log:
/var/log/mosquitto/mosquitto.log

---

# 12. Archivos importantes

Configuración principal:
/etc/mosquitto/mosquitto.conf

Configuraciones adicionales:
/etc/mosquitto/conf.d/

Archivo de usuarios:
/etc/mosquitto/passwd

Logs:
/var/log/mosquitto/

---

# 13. Seguridad

El broker debe mantenerse accesible únicamente desde:

- red local
- VPN

No abrir el puerto MQTT en el router.

La comunicación con dispositivos externos debe realizarse siempre a través de la infraestructura segura del sistema.
