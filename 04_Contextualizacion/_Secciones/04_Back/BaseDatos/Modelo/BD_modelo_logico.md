# Modelo Lógico — Base de Datos
## Sistema: LAVANDERÍA KWL

Este documento define el **modelo lógico** de la base de datos del sistema KWL sobre **MariaDB**.

Incluye:

- tablas
- columnas
- tipos de datos
- claves primarias
- claves foráneas
- restricciones
- índices

El diseño está pensado para soportar:

- múltiples lavanderías
- histórico de tarifas
- registro económico por máquina
- auditoría y trazabilidad
- generación de informes operativos y contables

---

# 1. Tabla `lavanderia`

Representa cada local físico.

## Campos

- `id_lavanderia` → BIGINT UNSIGNED, PK, autoincrement
- `nombre` → VARCHAR(120), NOT NULL
- `codigo` → VARCHAR(30), NOT NULL, UNIQUE
- `direccion` → VARCHAR(255), NULL
- `ciudad` → VARCHAR(100), NULL
- `provincia` → VARCHAR(100), NULL
- `activo` → TINYINT(1), NOT NULL, DEFAULT 1
- `fecha_alta` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- `fecha_actualizacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Índices

- PK (`id_lavanderia`)
- UNIQUE (`codigo`)
- INDEX (`activo`)

---

# 2. Tabla `usuario`

Representa los usuarios del panel web.

## Campos

- `id_usuario` → BIGINT UNSIGNED, PK, autoincrement
- `nombre` → VARCHAR(80), NOT NULL
- `apellidos` → VARCHAR(120), NULL
- `login` → VARCHAR(80), NOT NULL, UNIQUE
- `password_hash` → VARCHAR(255), NOT NULL
- `rol` → VARCHAR(30), NOT NULL
- `activo` → TINYINT(1), NOT NULL, DEFAULT 1
- `fecha_creacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- `ultimo_acceso` → DATETIME, NULL
- `fecha_actualizacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Observaciones

`rol` se deja como VARCHAR para no rigidizar demasiado el MVP.
Valores esperados inicialmente:

- `ADMIN`
- `OPERADOR`
- `TECNICO`

## Índices

- PK (`id_usuario`)
- UNIQUE (`login`)
- INDEX (`rol`)
- INDEX (`activo`)

---

# 3. Tabla `usuario_lavanderia`

Tabla puente para asociar usuarios a una o varias lavanderías.

## Campos

- `id_usuario_lavanderia` → BIGINT UNSIGNED, PK, autoincrement
- `id_usuario` → BIGINT UNSIGNED, NOT NULL, FK
- `id_lavanderia` → BIGINT UNSIGNED, NOT NULL, FK
- `fecha_alta` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP

## Restricciones

- UNIQUE (`id_usuario`, `id_lavanderia`)

## Índices

- PK (`id_usuario_lavanderia`)
- UNIQUE (`id_usuario`, `id_lavanderia`)
- INDEX (`id_lavanderia`)

---

# 4. Tabla `maquina`

Representa cada lavadora o secadora.

## Campos

- `id_maquina` → BIGINT UNSIGNED, PK, autoincrement
- `id_lavanderia` → BIGINT UNSIGNED, NOT NULL, FK
- `codigo_visible` → VARCHAR(20), NOT NULL
- `tipo_maquina` → VARCHAR(20), NOT NULL
- `estado_actual` → VARCHAR(30), NOT NULL, DEFAULT 'STOP'
- `activa` → TINYINT(1), NOT NULL, DEFAULT 1
- `fecha_alta` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- `observaciones` → TEXT, NULL
- `fecha_actualizacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Restricciones

- UNIQUE (`id_lavanderia`, `codigo_visible`)

## Valores esperados

### `tipo_maquina`
- `LAVADORA`
- `SECADORA`

### `estado_actual`
- `STOP`
- `EN_MARCHA`
- `PAUSADA`
- `FUERA_SERVICIO`
- `MANTENIMIENTO`

## Índices

- PK (`id_maquina`)
- UNIQUE (`id_lavanderia`, `codigo_visible`)
- INDEX (`id_lavanderia`, `tipo_maquina`)
- INDEX (`id_lavanderia`, `estado_actual`)
- INDEX (`activa`)

---

# 5. Tabla `tarifa_maquina`

Define la tarifa vigente en un periodo para una lavandería.

## Campos

- `id_tarifa` → BIGINT UNSIGNED, PK, autoincrement
- `id_lavanderia` → BIGINT UNSIGNED, NOT NULL, FK
- `nombre` → VARCHAR(100), NOT NULL
- `precio_arranque` → DECIMAL(10,2), NOT NULL
- `tiempo_base_minutos` → SMALLINT UNSIGNED, NOT NULL
- `importe_incremento` → DECIMAL(10,2), NOT NULL
- `minutos_por_incremento` → SMALLINT UNSIGNED, NOT NULL
- `fecha_inicio_vigencia` → DATETIME, NOT NULL
- `fecha_fin_vigencia` → DATETIME, NULL
- `activa` → TINYINT(1), NOT NULL, DEFAULT 1
- `fecha_creacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- `fecha_actualizacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Reglas

- una tarifa puede quedar activa sin fecha fin
- al crear una nueva tarifa, la anterior debe cerrarse a nivel de aplicación
- los ciclos guardan copia de los importes aplicados, por lo que el histórico queda protegido

## Índices

- PK (`id_tarifa`)
- INDEX (`id_lavanderia`, `activa`)
- INDEX (`id_lavanderia`, `fecha_inicio_vigencia`)
- INDEX (`id_lavanderia`, `fecha_fin_vigencia`)

---

# 6. Tabla `ciclo`

Representa una ejecución real de una máquina.

## Campos

- `id_ciclo` → BIGINT UNSIGNED, PK, autoincrement
- `id_maquina` → BIGINT UNSIGNED, NOT NULL, FK
- `id_tarifa_aplicada` → BIGINT UNSIGNED, NOT NULL, FK
- `fecha_hora_inicio` → DATETIME, NOT NULL
- `fecha_hora_fin` → DATETIME, NULL
- `estado_ciclo` → VARCHAR(30), NOT NULL, DEFAULT 'INICIADO'
- `precio_arranque_aplicado` → DECIMAL(10,2), NOT NULL
- `tiempo_base_aplicado_min` → SMALLINT UNSIGNED, NOT NULL
- `minutos_extra_total` → SMALLINT UNSIGNED, NOT NULL, DEFAULT 0
- `importe_cliente_total` → DECIMAL(10,2), NOT NULL, DEFAULT 0.00
- `importe_bonificado_total` → DECIMAL(10,2), NOT NULL, DEFAULT 0.00
- `importe_total_aplicado` → DECIMAL(10,2), NOT NULL, DEFAULT 0.00
- `duracion_total_programada_min` → SMALLINT UNSIGNED, NOT NULL
- `observaciones` → TEXT, NULL
- `fecha_creacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
- `fecha_actualizacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Valores esperados para `estado_ciclo`

- `INICIADO`
- `FINALIZADO`
- `CANCELADO`
- `INCIDENCIA`

## Índices

- PK (`id_ciclo`)
- INDEX (`id_maquina`, `fecha_hora_inicio`)
- INDEX (`id_maquina`, `estado_ciclo`)
- INDEX (`id_tarifa_aplicada`)
- INDEX (`fecha_hora_inicio`)
- INDEX (`fecha_hora_fin`)

---

# 7. Tabla `movimiento_maquina`

Registra cada aportación económica aplicada a la máquina.

## Campos

- `id_movimiento` → BIGINT UNSIGNED, PK, autoincrement
- `id_lavanderia` → BIGINT UNSIGNED, NOT NULL, FK
- `id_maquina` → BIGINT UNSIGNED, NOT NULL, FK
- `id_ciclo` → BIGINT UNSIGNED, NULL, FK
- `id_usuario` → BIGINT UNSIGNED, NULL, FK
- `fecha_hora` → DATETIME, NOT NULL
- `tipo_movimiento` → VARCHAR(30), NOT NULL
- `origen_movimiento` → VARCHAR(30), NOT NULL
- `importe` → DECIMAL(10,2), NOT NULL
- `minutos_extra_generados` → SMALLINT UNSIGNED, NOT NULL, DEFAULT 0
- `es_bonificacion` → TINYINT(1), NOT NULL, DEFAULT 0
- `descripcion` → VARCHAR(255), NULL
- `fecha_creacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP

## Valores esperados

### `tipo_movimiento`
- `ARRANQUE`
- `AMPLIACION_TIEMPO`

### `origen_movimiento`
- `MONEDERO`
- `WEB_MANUAL`

## Reglas

- un arranque normal del cliente: `ARRANQUE`, `MONEDERO`, `es_bonificacion = 0`
- una ampliación del cliente: `AMPLIACION_TIEMPO`, `MONEDERO`, `es_bonificacion = 0`
- un arranque concedido desde web: `ARRANQUE`, `WEB_MANUAL`, `es_bonificacion = 1`
- una ampliación concedida desde web: `AMPLIACION_TIEMPO`, `WEB_MANUAL`, `es_bonificacion = 1`

## Índices

- PK (`id_movimiento`)
- INDEX (`id_lavanderia`, `fecha_hora`)
- INDEX (`id_maquina`, `fecha_hora`)
- INDEX (`id_ciclo`, `fecha_hora`)
- INDEX (`id_usuario`, `fecha_hora`)
- INDEX (`tipo_movimiento`)
- INDEX (`origen_movimiento`)
- INDEX (`es_bonificacion`)

---

# 8. Tabla `log_maquina`

Registra eventos técnicos generados por backend o dispositivos.

## Campos

- `id_log` → BIGINT UNSIGNED, PK, autoincrement
- `id_lavanderia` → BIGINT UNSIGNED, NOT NULL, FK
- `id_maquina` → BIGINT UNSIGNED, NOT NULL, FK
- `id_ciclo` → BIGINT UNSIGNED, NULL, FK
- `fecha_hora` → DATETIME, NOT NULL
- `tipo_evento` → VARCHAR(50), NOT NULL
- `nivel` → VARCHAR(20), NOT NULL, DEFAULT 'INFO'
- `payload` → JSON, NULL
- `procesado` → TINYINT(1), NOT NULL, DEFAULT 0
- `fecha_creacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP

## Valores esperados para `nivel`

- `DEBUG`
- `INFO`
- `WARNING`
- `ERROR`
- `CRITICAL`

## Índices

- PK (`id_log`)
- INDEX (`id_lavanderia`, `fecha_hora`)
- INDEX (`id_maquina`, `fecha_hora`)
- INDEX (`id_ciclo`, `fecha_hora`)
- INDEX (`tipo_evento`)
- INDEX (`nivel`)
- INDEX (`procesado`)

---

# 9. Tabla `auditoria`

Registra acciones humanas relevantes para trazabilidad.

## Campos

- `id_auditoria` → BIGINT UNSIGNED, PK, autoincrement
- `id_usuario` → BIGINT UNSIGNED, NOT NULL, FK
- `id_lavanderia` → BIGINT UNSIGNED, NULL, FK
- `id_maquina` → BIGINT UNSIGNED, NULL, FK
- `id_ciclo` → BIGINT UNSIGNED, NULL, FK
- `fecha_hora` → DATETIME, NOT NULL
- `accion` → VARCHAR(100), NOT NULL
- `entidad_afectada` → VARCHAR(50), NOT NULL
- `id_entidad_afectada` → BIGINT UNSIGNED, NULL
- `detalle` → TEXT, NULL
- `ip_origen` → VARCHAR(45), NULL
- `fecha_creacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP

## Índices

- PK (`id_auditoria`)
- INDEX (`id_usuario`, `fecha_hora`)
- INDEX (`id_lavanderia`, `fecha_hora`)
- INDEX (`id_maquina`, `fecha_hora`)
- INDEX (`id_ciclo`, `fecha_hora`)
- INDEX (`accion`)
- INDEX (`entidad_afectada`, `id_entidad_afectada`)

---

# 10. Tabla `configuracion`

Guarda parámetros auxiliares del sistema.

## Campos

- `id_configuracion` → BIGINT UNSIGNED, PK, autoincrement
- `ambito` → VARCHAR(20), NOT NULL
- `id_lavanderia` → BIGINT UNSIGNED, NULL, FK
- `clave` → VARCHAR(100), NOT NULL
- `valor` → TEXT, NOT NULL
- `descripcion` → VARCHAR(255), NULL
- `fecha_actualizacion` → DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Valores esperados para `ambito`

- `GLOBAL`
- `LAVANDERIA`

## Restricciones

- UNIQUE (`ambito`, `id_lavanderia`, `clave`)

## Índices

- PK (`id_configuracion`)
- UNIQUE (`ambito`, `id_lavanderia`, `clave`)
- INDEX (`id_lavanderia`)

---

# Resumen de relaciones

- `maquina.id_lavanderia` → `lavanderia.id_lavanderia`
- `usuario_lavanderia.id_usuario` → `usuario.id_usuario`
- `usuario_lavanderia.id_lavanderia` → `lavanderia.id_lavanderia`
- `tarifa_maquina.id_lavanderia` → `lavanderia.id_lavanderia`
- `ciclo.id_maquina` → `maquina.id_maquina`
- `ciclo.id_tarifa_aplicada` → `tarifa_maquina.id_tarifa`
- `movimiento_maquina.id_lavanderia` → `lavanderia.id_lavanderia`
- `movimiento_maquina.id_maquina` → `maquina.id_maquina`
- `movimiento_maquina.id_ciclo` → `ciclo.id_ciclo`
- `movimiento_maquina.id_usuario` → `usuario.id_usuario`
- `log_maquina.id_lavanderia` → `lavanderia.id_lavanderia`
- `log_maquina.id_maquina` → `maquina.id_maquina`
- `log_maquina.id_ciclo` → `ciclo.id_ciclo`
- `auditoria.id_usuario` → `usuario.id_usuario`
- `auditoria.id_lavanderia` → `lavanderia.id_lavanderia`
- `auditoria.id_maquina` → `maquina.id_maquina`
- `auditoria.id_ciclo` → `ciclo.id_ciclo`
- `configuracion.id_lavanderia` → `lavanderia.id_lavanderia`

---

# Notas finales de diseño

1. `ciclo` y `movimiento_maquina` están separados a propósito.
2. Los informes deben construirse desde estas tablas base, no desde tablas resumen.
3. El histórico de precios queda protegido gracias a `tarifa_maquina` y a la copia de importes en `ciclo`.
4. Las bonificaciones manuales no se modelan como “promociones”, sino como movimientos bonificados.
5. Este modelo está pensado para ser simple en el TFC pero suficientemente serio para escalar.
