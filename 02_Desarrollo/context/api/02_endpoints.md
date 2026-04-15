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

- crea un nuevo ciclo en la base de datos
- asigna tarifa vigente
- registra auditoría
- envía comando MQTT

### POST /api/maquinas/{id}/detener
Solicita parada manual.

### POST /api/maquinas/{id}/reiniciar
Solicita reinicio.

### POST /api/maquinas/{id}/ampliar
Registra ampliación de tiempo.

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
