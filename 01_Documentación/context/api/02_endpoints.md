# Endpoints API

## Autenticación

### POST /api/auth/login
Inicia sesión en el panel.

### POST /api/auth/logout
Cierra sesión.

### GET /api/auth/me
Devuelve el usuario autenticado.

---

## Máquinas

### GET /api/maquinas
Lista de máquinas visibles para la lavandería activa.

### GET /api/maquinas/{id}
Detalle de una máquina.

### POST /api/maquinas/{id}/iniciar
Si está en `STOP`, enciende relé y deja la máquina en `PAUSADA`.
Si está en `PAUSADA`, confirma inicio de ciclo (`EN_MARCHA`).

### POST /api/maquinas/{id}/detener
Solicita parada manual y deja la máquina en `STOP`.

### POST /api/maquinas/{id}/reiniciar
Solicita reinicio.

### POST /api/maquinas/{id}/ampliar
Registra ampliación de tiempo (controlada por tarifa).

### POST /api/maquinas/{id}/credito
Inserta crédito cuando la máquina está encendida (`PAUSADA`).

### PUT /api/maquinas/{id}/ventilador-auto
Activa/desactiva ventilador automático por máquina.

---

## Caja e informes

### GET /api/caja/dia?date=YYYY-MM-DD
Caja diaria.

### GET /api/caja/semana?date=YYYY-MM-DD
Caja semanal (lunes a domingo de la fecha indicada).

### GET /api/caja/rango?from=YYYY-MM-DD&to=YYYY-MM-DD
Caja acumulada por rango.

### GET /api/informes/ciclos?from=YYYY-MM-DD&to=YYYY-MM-DD&id_maquina=&estado=&limit=&offset=
Listado de ciclos con filtros.

### GET /api/informes/evolucion/semanal?date=YYYY-MM-DD
Comparativa semanal (semana actual vs anterior).

### GET /api/informes/evolucion/mensual?month=YYYY-MM
Comparativa mensual (mes actual vs anterior).

### GET /api/informes/evolucion/anual?year=YYYY
Comparativa anual (año actual vs anterior).

### GET /api/informes/tramos/diario?date=YYYY-MM-DD
Tramos diarios (por hora y máquina).

### GET /api/informes/tramos/mensual?month=YYYY-MM
Tramos mensuales (por día y máquina).

### GET /api/informes/tramos/anual?year=YYYY
Tramos anuales (por mes y máquina).

---

## IoT

### GET /api/iot/state
Estado actual de relés lógicos de tienda.

### PUT /api/iot/state
Actualiza estado lógico de tienda (admin).

### GET /api/iot/approx-state
Estado aproximado derivado de acción reciente (cacheable).

### GET /api/iot/relay-action-log
Histórico corto de acciones de relés.

### POST /api/iot/relay-action
Registra acción manual de relé (admin).

### GET /api/iot/schedule
Obtiene programación IoT **individual** (sección `Programador`) para puerta/luces/ventilación.

### PUT /api/iot/schedule
Guarda programación IoT **individual** (admin).

### GET /api/iot/store-schedule
Obtiene programación **general de tienda** (sección `Inicio`): hora de apertura y cierre.

### PUT /api/iot/store-schedule
Guarda programación **general de tienda** (admin).

### GET /api/iot/store-actions
Obtiene acciones de abrir/cerrar tienda.

### PUT /api/iot/store-actions
Guarda acciones de abrir/cerrar tienda (admin).

### GET /api/iot/store-open-machines
Obtiene máquinas a encender con botón Abrir tienda.

### PUT /api/iot/store-open-machines
Guarda máquinas a encender con botón Abrir tienda (admin).

### GET /api/iot/store-close-machines
Obtiene máquinas a apagar con botón Cerrar tienda.

### PUT /api/iot/store-close-machines
Guarda máquinas a apagar con botón Cerrar tienda (admin).

### POST /api/iot/store/open
Aplica acción de apertura de tienda (admin).

### POST /api/iot/store/close
Aplica acción de cierre de tienda (admin).

---

## Cámara

### POST /api/camera/ptz/center
Centra la cámara.

### POST /api/camera/zoom
Zoom relativo/absoluto.

### POST /api/camera/display-mode
Cambia modo de visualización.

### POST /api/camera/relay/pulse
Pulso de relé (puerta/luces).

---

## Usuarios

### GET /api/usuarios
Lista usuarios.

### POST /api/usuarios
Crea usuario.

### PUT /api/usuarios/{id}
Edita usuario.

### DELETE /api/usuarios/{id}
Borra usuario (scope lavandería activa).

### POST /api/usuarios/{id}/activar
Activa usuario.

### POST /api/usuarios/{id}/desactivar
Desactiva usuario.

### GET /api/usuarios/{id}/lavanderias
Lista lavanderías asignadas al usuario.

### PUT /api/usuarios/{id}/lavanderias
Actualiza lavanderías asignadas.

---

## Lavanderías, auditoría y configuración

### GET /api/lavanderias
Lista lavanderías permitidas para el usuario autenticado.

### POST /api/lavanderias
Alta de nueva lavandería (solo superadmin).

### GET /api/auditoria
Lista acciones administrativas (logs de auditoría).

### GET /api/configuracion
Consulta configuración operativa por lavandería.

### GET /api/configuracion/{clave}
Consulta una clave concreta.

### PUT /api/configuracion/{clave}
Actualiza una clave permitida (admin).

### GET /api/configuracion/env
Lee ajustes de entorno por lavandería (admin).

### PUT /api/configuracion/env
Guarda ajustes de entorno por lavandería (admin).

### GET /api/configuracion/tarifa-actual
Lee tarifa operativa vigente de la lavandería activa (admin).

### PUT /api/configuracion/tarifa-actual
Crea nueva tarifa vigente desde ahora para nuevos ciclos (admin).

### GET /api/configuracion/web-public
Lee contenido público web (sin login).

### GET /api/configuracion/web-public/admin
Lee contenido público web desde panel admin.

### PUT /api/configuracion/web-public/admin
Guarda contenido público editable (header/footer/about/contacto/faqs).

---

## Salud del servicio

### GET /health
Estado de backend y dependencias (`db`, `redis`, `mqtt`).
