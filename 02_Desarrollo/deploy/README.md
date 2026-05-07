# deploy

## Descripción

Contiene los scripts y configuraciones necesarias para desplegar el sistema.

---

## Entornos

* `real/` → despliegue en infraestructura Proxmox
* `demo/` → despliegue en una sola máquina (para profesores)

---

## Objetivo

Permitir ejecutar el sistema en distintos entornos sin modificar el código.

---

## Funcionalidad

* instalación de dependencias
* configuración de servicios
* inicialización del sistema
* carga de datos de prueba

---

## Notas

* El código fuente no se encuentra aquí
* Este módulo solo automatiza el despliegue

---

## Gestión operativa desde panel (sin código)

Tras desplegar, un usuario superadmin puede:

* Crear nuevas lavanderías desde el botón `+ Lavandería` junto al selector de tienda.
* Cambiar tarifas en `Admin > Ajustes`:
  * precio de ciclo
  * tiempo base de ciclo
  * precio de ampliación
  * minutos por ampliación

Importante:

* Los cambios de tarifa aplican a ciclos nuevos.
* El histórico de ciclos y contabilidad ya registrados no se recalcula.
