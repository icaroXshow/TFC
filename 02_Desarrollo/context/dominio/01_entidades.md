# Entidades del dominio

## Lavanderia

Representa cada local físico gestionado por el sistema.

Campos conceptuales principales:
- id_lavanderia
- nombre
- codigo
- direccion
- ciudad
- provincia
- activo

---

## Usuario

Representa un usuario del panel web.

Campos conceptuales principales:
- id_usuario
- nombre
- apellidos
- login
- password_hash
- rol
- activo
- ultimo_acceso

---

## UsuarioLavanderia

Relaciona usuarios con una o varias lavanderías.

Campos conceptuales principales:
- id_usuario_lavanderia
- id_usuario
- id_lavanderia

---

## Maquina

Representa cada lavadora o secadora gestionada por el sistema.

Campos conceptuales principales:
- id_maquina
- id_lavanderia
- codigo_visible
- tipo_maquina
- estado_actual
- activa
- observaciones

---

## TarifaMaquina

Define las condiciones económicas vigentes por lavandería durante un periodo.

Campos conceptuales principales:
- id_tarifa
- id_lavanderia
- nombre
- precio_arranque
- tiempo_base_minutos
- importe_incremento
- minutos_por_incremento
- fecha_inicio_vigencia
- fecha_fin_vigencia
- activa

---

## Ciclo

Representa una ejecución real de máquina.

Campos conceptuales principales:
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
- observaciones

---

## MovimientoMaquina

Representa cada entrada económica aplicada a una máquina.

Campos conceptuales principales:
- id_movimiento
- id_lavanderia
- id_maquina
- id_ciclo
- id_usuario
- fecha_hora
- tipo_movimiento
- origen_movimiento
- importe
- minutos_extra_generados
- es_bonificacion
- descripcion

Es la entidad contable clave del sistema.

MovimientoMaquina es la única entidad que representa entradas económicas reales en el sistema.

Todos los importes aplicados a una máquina deben registrarse en esta tabla, independientemente de su origen (cliente o sistema).

El ciclo actúa como acumulador de estos movimientos.
---

## LogMaquina

Representa eventos técnicos generados por backend o dispositivos.

Campos conceptuales principales:
- id_log
- id_lavanderia
- id_maquina
- id_ciclo
- fecha_hora
- tipo_evento
- nivel
- payload
- procesado

---

## Auditoria

Representa acciones administrativas y operativas críticas.

Campos conceptuales principales:
- id_auditoria
- id_usuario
- id_lavanderia
- id_maquina
- id_ciclo
- fecha_hora
- accion
- entidad_afectada
- id_entidad_afectada
- detalle
- ip_origen

---

## Configuracion

Representa parámetros auxiliares del sistema.

Campos conceptuales principales:
- id_configuracion
- ambito
- id_lavanderia
- clave
- valor
- descripcion
- fecha_actualizacion
