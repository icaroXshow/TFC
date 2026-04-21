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

Acciones:

- enciende relé de la máquina
- pasa la máquina a estado `PAUSADA`
- registra auditoría
- envía comando MQTT

### POST /api/maquinas/{id}/detener
Solicita parada manual.

### POST /api/maquinas/{id}/reiniciar
Solicita reinicio.

### POST /api/maquinas/{id}/ampliar
Registra ampliación de tiempo.

### POST /api/maquinas/{id}/credito
Inserta crédito cuando la máquina está encendida (`PAUSADA`) para iniciar lavado.

---

## Tienda y dispositivos

### POST /api/tienda/abrir
Ejecuta apertura de tienda.

### POST /api/tienda/cerrar
Ejecuta cierre de tienda.

### POST /api/puerta/abrir
Abre puerta.

### POST /api/puerta/cerrar
Cierra puerta.

### POST /api/luces/encender
Enciende luces.

### POST /api/luces/apagar
Apaga luces.

### POST /api/ventilacion/encender
Enciende ventilación.

### POST /api/ventilacion/apagar
Apaga ventilación.

---

## Eventos y logs

### GET /api/eventos
Lista eventos técnicos recientes.

### GET /api/auditoria
Lista acciones administrativas.

---

## Usuarios

### GET /api/usuarios
Lista usuarios.

### POST /api/usuarios
Crea usuario.

### PUT /api/usuarios/{id}
Edita usuario.

### POST /api/usuarios/{id}/activar
Activa usuario.

### POST /api/usuarios/{id}/desactivar
Desactiva usuario.

---

## Panel / dashboard

### GET /api/dashboard/resumen
Devuelve estado resumido para panel principal.

### GET /api/dashboard/tiempo-real
Devuelve estado operativo actual apoyado en Redis.

---

## Configuración

### GET /api/configuracion
Consulta configuración operativa.

### PUT /api/configuracion/{clave}
Actualiza parámetro permitido.

### GET /api/configuracion/env
Lee ajustes de entorno por lavandería (admin).

### PUT /api/configuracion/env
Guarda ajustes de entorno por lavandería (admin).

---

## IoT

### GET /api/iot/state
Estado actual de relés lógicos de tienda.

### PUT /api/iot/state
Actualiza estado lógico de tienda (admin).

### GET /api/iot/schedule
Obtiene programación.

### PUT /api/iot/schedule
Guarda programación (admin).

### GET /api/iot/store-actions
Obtiene acciones de abrir/cerrar tienda.

### PUT /api/iot/store-actions
Guarda acciones de abrir/cerrar tienda (admin).

### GET /api/iot/store-open-machines
Obtiene máquinas a encender con botón Abrir tienda.

### PUT /api/iot/store-open-machines
Guarda máquinas a encender con botón Abrir tienda (admin).
