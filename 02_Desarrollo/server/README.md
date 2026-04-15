# server

## Descripción

Contiene la configuración específica de la infraestructura real.

Cada carpeta representa una máquina virtual o contenedor del sistema.

---

## Estructura

* `vm_core/` → backend, frontend y Redis
* `vm_data/` → base de datos (MariaDB)
* `lxc_mqtt/`→ broker MQTT
* `lxc_sim/` → ejecución del simulador

---

## Objetivo

Definir cómo se ejecuta el sistema en el entorno real.

Incluye:

* configuraciones
* scripts específicos
* notas de cada servicio

---

## Notas

* No contiene código del sistema
* No contiene lógica de negocio
* No contiene despliegue completo (eso está en `deploy/`)
