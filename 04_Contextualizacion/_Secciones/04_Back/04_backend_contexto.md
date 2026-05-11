# Backend del Sistema KWL

## 1. Rol del backend

El backend es el cerebro operativo del sistema.

Sus funciones principales son:

- exponer API para panel web
- validar acciones de usuario
- consultar y actualizar datos de negocio
- registrar auditoria y trazabilidad
- coordinar comandos hacia IoT via MQTT
- consolidar estado en tiempo real

## 2. Relacion con VM_CORE

El backend se ejecuta en `VM_CORE (192.168.1.51)` junto con Nginx y simulador (perfil opcional).

Esta maquina concentra:

- punto de entrada HTTP del sistema
- logica de aplicacion
- simulacion MQTT para pruebas/control sin hardware

VM_CORE no almacena datos persistentes de negocio; delega ese rol en VM_DATA.

## 3. Relacion con MariaDB, Redis y MQTT

### MariaDB (VM_DATA)

Se utiliza para persistencia transaccional:

- usuarios, maquinas, tarifas, ciclos
- movimientos economicos
- auditoria y logs

### Redis (VM_DATA)

Se utiliza para:

- cache de respuestas frecuentes
- estado transitorio de maquinas
- soporte para notificaciones en tiempo real

### MQTT (LXC_MQTT)

Se utiliza para comunicar backend con ESP32:

- backend publica comandos
- dispositivos publican estado/evento/telemetria

## 4. Filosofia del backend

Principios de implementacion:

- el backend decide, el dispositivo ejecuta
- toda accion critica deja rastro en auditoria
- acciones idempotentes cuando sea posible
- degradacion controlada ante caidas de nodos

## 5. Flujo general de acciones

1. Usuario solicita accion en panel web.
2. Backend valida permisos y reglas de negocio.
3. Backend registra accion en auditoria.
4. Backend publica comando MQTT (o lo cola para worker).
5. ESP32 ejecuta y devuelve estado/evento.
6. Backend refleja estado en panel y en base de datos.

## 6. API prevista

Endpoints base del estado actual:

- `GET /health`: estado de backend, DB, Redis y MQTT
- `POST /api/auth/login`: inicio de sesion
- `GET /api/maquinas`: listado de maquinas y estado
- `POST /api/maquinas/{id}/iniciar`: inicio de ciclo
- `POST /api/maquinas/{id}/detener`: parada de ciclo

Evolucion prevista:

- endpoints de autenticacion
- endpoints de caja/contabilidad
- endpoints de auditoria y reportes

## 7. Autenticacion

Modelo previsto:

- login por usuario interno
- sesion segura (cookie de sesion o JWT interno)
- control por rol (`ADMIN`, `OPERADOR`)
- bloqueo de acciones criticas sin privilegio

## 8. Auditoria

Se registra en tabla `auditoria`:

- usuario origen
- accion ejecutada
- entidad afectada
- fecha y hora
- direccion IP
- detalle de operacion

La auditoria es obligatoria para acciones de control de maquinas y parametros.

## 9. Tiempo real

Estrategia de tiempo real actual:

- backend consume estado de MQTT
- Redis sirve como capa de estado rapido
- frontend admin combina consulta periodica y canal WebSocket

Esto permite observabilidad operativa sin depender de nube externa.
