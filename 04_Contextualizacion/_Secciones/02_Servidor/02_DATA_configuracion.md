# DATA_configuracion.md

# VM_DATA — Configuración del Sistema

## 1. Objetivo

Este documento describe el proceso de configuración de la máquina virtual **VM_DATA**, encargada de almacenar la base de datos del sistema.

El objetivo es dejar preparada una máquina dedicada para el almacenamiento de datos del sistema utilizando MariaDB.

---

# 2. Creación de la máquina virtual

La máquina virtual se crea dentro del servidor Proxmox.

Configuración básica utilizada:

Nombre de la VM

VM_DATA

Sistema operativo

Debian / Ubuntu Server

IP asignada

192.168.1.52

Red del sistema

192.168.1.0/24

La máquina forma parte de la infraestructura virtual del servidor.

---

# 3. Actualización del sistema

Una vez creada la máquina se actualiza el sistema operativo.

sudo apt update  
sudo apt upgrade -y

Esto asegura que el sistema tenga los paquetes más recientes.

---

# 4. Instalación de MariaDB

Instalar el motor de base de datos:

sudo apt install mariadb-server mariadb-client -y

Esto instala:

- servidor MariaDB
- cliente de línea de comandos
- herramientas de administración

---

# 5. Activación del servicio

El servicio se activa automáticamente, pero se puede comprobar con:

sudo systemctl status mariadb

Si fuese necesario se puede iniciar con:

sudo systemctl start mariadb

Y habilitar en el arranque:

sudo systemctl enable mariadb

---

# 6. Configuración inicial de seguridad

MariaDB incluye un asistente de configuración inicial.

sudo mysql_secure_installation

Configuración recomendada:

- establecer contraseña para root
- eliminar usuarios anónimos
- deshabilitar acceso root remoto
- eliminar base de datos de prueba
- recargar privilegios

Esto mejora la seguridad del sistema.

---

# 7. Creación de la base de datos del sistema

Acceder a MariaDB:

sudo mysql

Crear la base de datos principal del sistema:

CREATE DATABASE kwl;

---

# 8. Creación de usuario para el backend

Crear usuario para el backend del sistema:

CREATE USER 'backend'@'%' IDENTIFIED BY 'password_segura';

Dar permisos sobre la base de datos:

GRANT ALL PRIVILEGES ON kwl.* TO 'backend'@'%';

Actualizar permisos:

FLUSH PRIVILEGES;

Salir de MariaDB:

EXIT;

---

# 9. Configuración de acceso remoto

Editar configuración del servidor MariaDB.

sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf

Modificar la línea:

bind-address = 0.0.0.0

Esto permite conexiones desde la red local.

Reiniciar servicio:

sudo systemctl restart mariadb

---

# 10. Configuración del firewall

El firewall de la máquina permite únicamente los accesos necesarios.

Reglas principales:

permitir SSH

sudo ufw allow 22/tcp

permitir acceso a MariaDB desde red local

sudo ufw allow from 192.168.1.0/24 to any port 3306

Comprobar reglas:

sudo ufw status

---

# 11. Herramienta de administración

Para administrar la base de datos se utiliza un cliente gráfico.

Herramienta:

DBeaver

Configuración de conexión:

Host

192.168.1.52

Puerto

3306

Base de datos

kwl

Usuario

backend

Este cliente permite gestionar la base de datos desde el equipo de desarrollo.

---

# 12. Estado final

Tras completar estos pasos la máquina VM_DATA dispone de:

- sistema Linux actualizado
- MariaDB instalado y operativo
- base de datos principal creada
- usuario backend configurado
- acceso desde VM_CORE
- acceso de administración mediante cliente SQL
- firewall configurado

La máquina queda preparada para almacenar toda la información generada por el sistema.