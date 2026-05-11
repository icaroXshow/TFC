# Contexto de la Base de Datos
## Sistema: LAVANDERÍA KWL

La base de datos es el núcleo de persistencia del sistema KWL.

Almacena la información operativa, económica y de auditoría necesaria para que el backend pueda:

- operar máquinas y ciclos
- registrar movimientos económicos
- consolidar eventos técnicos
- mantener trazabilidad administrativa
- generar informes históricos

---

## Infraestructura real actual

- Motor: `MariaDB`
- Nodo: `VM_DATA`
- IP: `192.168.1.52`
- Publicación actual en host: `13306 -> 3306` (contenedor)
- Esquema principal: `kwl_lavanderia`

La base de datos está separada del backend para aislar persistencia y facilitar mantenimiento/recuperación.

---

## Objetivo funcional del modelo

El modelo está diseñado para soportar:

- múltiples lavanderías
- múltiples máquinas por lavandería
- usuarios con acceso por ámbito de lavandería
- ciclos de uso con histórico tarifario
- contabilidad diferenciando importe cliente y bonificación
- auditoría de acciones críticas
- eventos técnicos de máquina

---

## Principios de diseño

### 1. Separación de responsabilidades

Se distinguen claramente:

- uso operativo (`ciclo`)
- movimientos económicos (`movimiento_maquina`)
- eventos técnicos (`log_maquina`)
- acciones humanas (`auditoria`)
- parámetros auxiliares (`configuracion`)

### 2. Histórico inmutable de negocio

Cada ciclo conserva los valores aplicados en el momento de inicio:

- precio de arranque
- tiempo base
- importe total aplicado
- duración total programada

Esto evita que cambios futuros de tarifas alteren el histórico.

### 3. Trazabilidad completa

Toda acción relevante puede reconstruirse por:

- quién la ejecutó
- cuándo ocurrió
- sobre qué entidad se aplicó
- qué efecto tuvo

---

## Flujo de datos (resumen)

1. Backend valida acción del panel.
2. Backend ejecuta operación de negocio.
3. Se persiste estado y/o movimiento en MariaDB.
4. Se registra auditoría y/o evento técnico.
5. Los informes se calculan sobre tablas base.

---

## Tablas principales

- `lavanderia`
- `usuario`
- `usuario_lavanderia`
- `maquina`
- `tarifa_maquina`
- `ciclo`
- `movimiento_maquina`
- `log_maquina`
- `auditoria`
- `configuracion`

---

## Relación con el backend actual

La API del backend consume este modelo para:

- autenticación y permisos
- control de máquinas
- caja e informes
- configuración por lavandería
- sincronización con MQTT/IoT

La base de datos es la fuente de verdad transaccional del sistema.
