# DATA_contexto.md

# VM_DATA — Contexto del Sistema

## 1. Propósito

La máquina virtual **VM_DATA** es el sistema encargado de almacenar toda la información persistente del sistema de gestión de la lavandería.

En esta máquina se ejecuta el motor de base de datos que guarda:

- usuarios del sistema
- eventos del sistema
- auditoría de acciones
- estado de máquinas
- contabilidad y créditos
- información operativa de la lavandería

VM_DATA actúa como **memoria del sistema**.

Mientras que VM_CORE ejecuta la lógica del sistema, VM_DATA conserva toda la información necesaria para que el sistema funcione y mantenga historial de actividad.

---

# 2. Ubicación en la Infraestructura

La máquina virtual forma parte de la infraestructura alojada en el servidor Proxmox.

Red del sistema:

192.168.1.0/24

Distribución de máquinas:

| Sistema | IP | Función |
|--------|------|--------|
| Proxmox | 192.168.1.50 | Host |
| VM_CORE | 192.168.1.51 | Backend + Web |
| VM_DATA | 192.168.1.52 | Base de datos |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |

Dentro de esta arquitectura, VM_DATA proporciona el almacenamiento central utilizado por el backend del sistema. :contentReference[oaicite:0]{index=0}

---

# 3. Rol dentro de la Arquitectura

VM_DATA almacena la información utilizada por el sistema.

El flujo típico de información es el siguiente:

Usuario  
│  
Panel Web  
│  
Backend (VM_CORE)  
│  
Base de datos (VM_DATA)

El backend consulta o modifica la información en la base de datos según las acciones realizadas por los usuarios o eventos generados por el sistema.

Los dispositivos IoT **no acceden directamente a la base de datos**.

Todas las operaciones pasan por el backend.

---

# 4. Software instalado

El sistema utiliza el siguiente motor de base de datos:

MariaDB

MariaDB es un sistema de gestión de bases de datos relacional compatible con MySQL y ampliamente utilizado en aplicaciones web.

Ventajas principales:

- estabilidad
- buen rendimiento
- software libre
- integración sencilla con PHP

---

# 5. Tipos de datos almacenados

La base de datos del sistema almacena diferentes tipos de información.

## Usuarios

Información sobre los usuarios que pueden acceder al sistema.

Ejemplos:

- identificador
- nombre
- credenciales
- rol
- permisos

---

## Máquinas

Registro de máquinas controladas por el sistema.

Ejemplos:

- lavadoras
- secadoras
- otros dispositivos controlados

Información almacenada:

- identificador
- tipo de máquina
- estado
- configuración

---

## Créditos

Registro de créditos utilizados en el sistema.

Ejemplos:

- créditos insertados
- créditos utilizados
- saldo disponible
- registro de pulsos del monedero

---

## Eventos

Eventos generados por el sistema o por dispositivos IoT.

Ejemplos:

- inicio de ciclo de lavadora
- finalización de ciclo
- errores de dispositivos
- activación de puerta
- cambios de estado

---

## Auditoría

Registro de acciones críticas realizadas en el sistema.

Ejemplos:

- acciones de administradores
- cambios de configuración
- control de máquinas
- accesos al sistema

Esto permite mantener trazabilidad completa del funcionamiento del sistema.

---

# 6. Comunicación con otros servicios

VM_DATA se comunica principalmente con:

## VM_CORE

IP:

192.168.1.51

VM_CORE utiliza la base de datos para:

- consultar información
- registrar eventos
- actualizar estado del sistema

---

# 7. Acceso a la base de datos

El acceso a la base de datos se realiza desde:

- VM_CORE (backend del sistema)
- herramientas de administración utilizadas por el desarrollador

Para administración y desarrollo se puede utilizar un cliente gráfico de base de datos.

Herramienta utilizada:

DBeaver

Este cliente permite gestionar tablas, ejecutar consultas SQL y administrar la base de datos de forma visual.

---

# 8. Seguridad

VM_DATA sigue varios principios de seguridad:

- la base de datos no está expuesta a Internet
- acceso permitido solo desde red local
- acceso remoto únicamente mediante VPN
- autenticación mediante usuarios de base de datos
- firewall configurado en la máquina

Esto reduce la superficie de ataque del sistema.

---

# 9. Principio de diseño

VM_DATA sigue un principio fundamental de arquitectura:

Separación de responsabilidades.

La base de datos se ejecuta en una máquina dedicada para:

- mejorar estabilidad
- facilitar mantenimiento
- aislar el almacenamiento del resto de servicios

Esta separación permite escalar el sistema en el futuro si fuese necesario.

---

# 10. Estado actual

En el estado actual de la infraestructura VM_DATA dispone de:

- sistema Linux operativo
- MariaDB instalado
- base de datos principal del sistema
- acceso desde VM_CORE
- acceso de administración mediante cliente SQL
- firewall configurado

La máquina queda preparada para almacenar toda la información generada por el sistema.
