# CORE_configuracion.md

# VM_CORE — Configuración del Servidor

Este documento describe el proceso de instalación y configuración de la máquina virtual **VM_CORE**, encargada del backend y servidor web del sistema.

---

# 1. Información del sistema

Nombre de la máquina:

VM_CORE

Dirección IP:

192.168.1.51

Sistema operativo:

Ubuntu Server

Rol:

Servidor backend + panel web + Redis.

---

# 2. Actualización inicial del sistema

Actualizar paquetes del sistema:

```bash
sudo apt update
sudo apt upgrade -y
```

Instalar herramientas básicas:

```bash
sudo apt install curl wget git unzip ufw -y
```

---

# 3. Configuración del firewall

Se utiliza **UFW** para controlar el acceso al servidor.

Permitir SSH:

```bash
sudo ufw allow 22/tcp
```

Permitir acceso web desde la red local:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw allow from 192.168.1.0/24 to any port 443
```

Permitir acceso web desde la red VPN:

```bash
sudo ufw allow from 10.8.0.0/24 to any port 80
sudo ufw allow from 10.8.0.0/24 to any port 443
```

Activar firewall:

```bash
sudo ufw enable
```

Comprobar estado:

```bash
sudo ufw status
```

Configuración final esperada:

- acceso SSH permitido
- acceso HTTP/HTTPS permitido desde LAN
- acceso HTTP/HTTPS permitido desde VPN
- sin exposición directa innecesaria a otras redes

---

# 4. Instalación de Nginx

Instalar servidor web:

```bash
sudo apt install nginx -y
```

Habilitar e iniciar servicio:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

Comprobar estado:

```bash
systemctl status nginx
```

Prueba local:

```bash
curl localhost
```

---

# 5. Instalación de PHP

Instalar PHP y módulos necesarios:

```bash
sudo apt install php php-fpm php-mysql php-cli php-curl php-mbstring php-xml php-zip php-redis -y
```

Comprobar versión:

```bash
php -v
```

Comprobar servicio PHP-FPM:

```bash
systemctl status php8.3-fpm
```

Habilitar e iniciar servicio:

```bash
sudo systemctl enable php8.3-fpm
sudo systemctl start php8.3-fpm
```

Verificar socket:

```bash
ls /run/php/
```

Socket esperado:

```
php8.3-fpm.sock
```

---

# 6. Preparación del directorio web

Eliminar contenido por defecto de Nginx:

```bash
sudo rm -rf /var/www/html/*
```

Crear directorio del proyecto:

```bash
sudo mkdir -p /var/www/kwl
sudo chown -R www-data:www-data /var/www/kwl
sudo chmod -R 755 /var/www/kwl
```

Crear archivo de prueba:

```bash
sudo tee /var/www/kwl/index.php > /dev/null <<'PHP'
<?php
echo "Sistema KWL funcionando";
PHP
```

---

# 7. Configuración de Nginx para PHP

Editar archivo de configuración:

```bash
sudo nano /etc/nginx/sites-available/default
```

Configuración utilizada:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/kwl;
    index index.php index.html index.htm;

    server_name _;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Validar configuración:

```bash
sudo nginx -t
```

Reiniciar servicios:

```bash
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
```

Prueba local:

```bash
curl http://localhost/
```

Resultado esperado:

```
Sistema KWL funcionando
```

Prueba remota:

```
http://192.168.1.51/
```

---

# 8. Instalación de Redis

Redis se utiliza para cache, estado del sistema y soporte a funciones en tiempo real.

Instalar:

```bash
sudo apt install redis-server -y
```

Comprobar funcionamiento:

```bash
redis-cli ping
```

Respuesta esperada:

```
PONG
```

---

# 9. Herramientas MQTT

Instalar herramientas MQTT para pruebas:

```bash
sudo apt install mosquitto-clients -y
```

Pruebas típicas:

Suscripción:

```bash
mosquitto_sub -h 192.168.1.53 -t test -u USUARIO -P PASSWORD
```

Publicación:

```bash
mosquitto_pub -h 192.168.1.53 -t test -m "hola" -u USUARIO -P PASSWORD
```

Notas:

- el broker MQTT se encuentra en **LXC_MQTT**
- si aparece `not authorised`, el problema suele ser de credenciales o ACL, no de red
- al finalizar la instalación se comprobó que la comunicación MQTT funciona correctamente

---

# 10. Conexión a la base de datos

La base de datos se encuentra en VM_DATA.

Servidor:

192.168.1.52

Prueba de conexión:

```bash
mysql -h 192.168.1.52 -u usuario -p
```

Resultado esperado:

- acceso correcto al monitor de MariaDB
- conexión remota permitida desde 192.168.1.51

Esto confirma:

- conectividad entre VM_CORE y VM_DATA
- usuario con permisos válidos desde la IP de VM_CORE
- MariaDB accesible dentro de la red interna

---

# 11. Estado final de la máquina

Comprobaciones realizadas:

- Nginx operativo
- PHP 8.3 operativo
- PHP-FPM operativo
- Redis operativo
- conexión a MariaDB operativa
- comunicación MQTT operativa
- acceso HTTP desde LAN operativo
- acceso HTTP desde VPN operativo

Acceso web del servidor:

```
http://192.168.1.51/
```

---

# 12. Criterio de despliegue

VM_CORE queda preparada como infraestructura base.

El backend del sistema se desarrollará en un entorno local y posteriormente se desplegará en este servidor cuando el código esté probado.

De esta forma VM_CORE se mantiene como un entorno limpio, estable y preparado para producción.