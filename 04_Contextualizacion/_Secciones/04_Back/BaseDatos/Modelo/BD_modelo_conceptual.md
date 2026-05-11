# Modelo Conceptual — Base de Datos
## Sistema: LAVANDERÍA KWL

Este documento describe el modelo conceptual de datos del sistema KWL.

El objetivo es representar de forma clara:

- entidades de negocio
- relaciones entre entidades
- reglas funcionales principales

---

## Entidades principales

### Lavanderia
Representa cada local físico gestionado por el sistema.

Atributos clave:

- id_lavanderia
- nombre
- codigo
- direccion
- ciudad
- provincia
- activo

Relaciones:

- Lavanderia 1 --- N Maquina
- Lavanderia 1 --- N TarifaMaquina
- Lavanderia 1 --- N MovimientoMaquina

---

### Usuario
Representa los usuarios con acceso al panel.

Atributos clave:

- id_usuario
- login
- password_hash
- rol
- activo

Relaciones:

- Usuario N --- N Lavanderia (vía UsuarioLavanderia)
- Usuario 1 --- N Auditoria
- Usuario 1 --- N MovimientoMaquina (cuando aplica acción manual)

---

### UsuarioLavanderia
Asociación de permisos por lavandería.

Atributos clave:

- id_usuario
- id_lavanderia

Regla:

- un usuario puede tener acceso a varias lavanderías
- una lavandería puede tener varios usuarios

---

### Maquina
Representa cada lavadora/secadora de una lavandería.

Atributos clave:

- id_maquina
- id_lavanderia
- codigo_visible
- tipo_maquina
- estado_actual
- activa

Relaciones:

- Maquina 1 --- N Ciclo
- Maquina 1 --- N MovimientoMaquina
- Maquina 1 --- N LogMaquina

---

### TarifaMaquina
Define condiciones económicas vigentes por lavandería y periodo.

Atributos clave:

- id_tarifa
- id_lavanderia
- precio_arranque
- tiempo_base_minutos
- importe_incremento
- minutos_por_incremento
- fecha_inicio_vigencia
- fecha_fin_vigencia
- activa

Relación:

- TarifaMaquina 1 --- N Ciclo

---

### Ciclo
Representa una ejecución real de máquina.

Atributos clave:

- id_ciclo
- id_maquina
- id_tarifa_aplicada
- fecha_hora_inicio
- fecha_hora_fin
- estado_ciclo
- precio_arranque_aplicado
- tiempo_base_aplicado_min
- minutos_extra_total
- importe_cliente_total
- importe_bonificado_total
- importe_total_aplicado
- duracion_total_programada_min

Relaciones:

- Ciclo 1 --- N MovimientoMaquina
- Ciclo 1 --- N LogMaquina

---

### MovimientoMaquina
Representa cada movimiento económico aplicado a máquina/ciclo.

Atributos clave:

- id_movimiento
- id_lavanderia
- id_maquina
- id_ciclo
- id_usuario
- tipo_movimiento
- origen_movimiento
- importe
- minutos_extra_generados
- es_bonificacion

Valores de negocio relevantes:

- tipo_movimiento: `ARRANQUE`, `AMPLIACION_TIEMPO`
- origen_movimiento: `MONEDERO`, `WEB_MANUAL`

Interpretación:

- `es_bonificacion = 0` -> importe cliente
- `es_bonificacion = 1` -> importe bonificado/manual

---

### LogMaquina
Registra eventos técnicos/operativos de máquina.

Atributos clave:

- id_log
- id_lavanderia
- id_maquina
- id_ciclo
- tipo_evento
- nivel
- payload
- procesado

---

### Auditoria
Registra acciones administrativas para trazabilidad.

Atributos clave:

- id_auditoria
- id_usuario
- id_lavanderia
- id_maquina
- id_ciclo
- accion
- entidad_afectada
- id_entidad_afectada
- detalle
- ip_origen

---

### Configuracion
Tabla de parámetros auxiliares del sistema.

Atributos clave:

- id_configuracion
- ambito (`GLOBAL` | `LAVANDERIA`)
- id_lavanderia
- clave
- valor

---

## Reglas conceptuales principales

1. El backend decide y persiste; los dispositivos ejecutan.
2. Un ciclo conserva snapshot tarifario para no romper histórico.
3. Se separa contabilidad de cliente y bonificación.
4. Los informes se calculan sobre tablas base, no sobre resúmenes persistidos.
5. Toda acción crítica debe tener trazabilidad (`auditoria` y/o `log_maquina`).
