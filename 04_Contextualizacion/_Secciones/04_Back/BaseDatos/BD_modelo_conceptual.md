# Modelo Conceptual — Base de Datos
## Sistema: LAVANDERÍA KWL

Este documento describe el **modelo conceptual de la base de datos** del sistema.

El sistema está diseñado para:
- Gestionar múltiples lavanderías
- Controlar máquinas (lavadoras/secadoras)
- Registrar ciclos de uso
- Registrar aportaciones económicas (monedas o manuales)
- Permitir ampliaciones de tiempo durante el ciclo
- Registrar acciones manuales del administrador
- Mantener histórico económico y técnico

Principios del diseño:
- simplicidad
- trazabilidad
- consistencia contable
- capacidad de crecimiento

---

# Entidades del sistema

## Lavanderia
    Representa cada local físico.

Atributos:
- id_lavanderia
- nombre
- codigo
- direccion
- ciudad
- provincia
- activo
- fecha_alta

Relación: Lavanderia 1 --- N Maquina

---

## Usuario
    Representa a los usuarios que acceden al panel web.

Atributos:
- id_usuario
- nombre
- apellidos
- login
- password_hash
- rol
- activo
- fecha_creacion
- ultimo_acceso

Relaciones:

Usuario 1 --- N MovimientoMaquina  
Usuario 1 --- N Auditoria

---

## Maquina
    Representa cada lavadora o secadora.

Atributos:
- id_maquina
- id_lavanderia
- codigo_visible (L1, L2, S1, etc)
- tipo_maquina
- estado_actual
- activa
- fecha_alta
- observaciones

Relaciones:

Maquina 1 --- N Ciclo  
Maquina 1 --- N MovimientoMaquina  
Maquina 1 --- N LogMaquina

---

## TarifaMaquina
    Define las condiciones económicas vigentes durante un periodo. Permite cambiar precios sin alterar ciclos históricos.

Atributos:
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

TarifaMaquina 1 --- N Ciclo

---

## Ciclo
    Representa una ejecución real de la máquina.

Atributos:
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

Relaciones:

Ciclo 1 --- N MovimientoMaquina  
Ciclo 1 --- N LogMaquina

---

## MovimientoMaquina
    Representa cada entrada económica aplicada a una máquina.

@Tipos de movimiento:
- ARRANQUE
- AMPLIACION_TIEMPO

@Origen del movimiento:
- MONEDERO
- WEB_MANUAL

Atributos:
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

Interpretación:

- `es_bonificacion = false` → dinero real del cliente
- `es_bonificacion = true` → saldo añadido desde la web

---

## LogMaquina
    Eventos técnicos generados por dispositivos o backend.

Atributos:
- id_log
- id_lavanderia
- id_maquina
- id_ciclo
- fecha_hora
- tipo_evento
- nivel
- payload
- procesado

Ejemplos de eventos:
- CICLO_INICIADO
- CICLO_FINALIZADO
- MONEDA_RECIBIDA
- AMPLIACION_APLICADA
- ERROR_COMUNICACION

---

## Auditoria
    Registro de acciones administrativas.

Atributos:
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
    Parámetros auxiliares del sistema.

Atributos:
- id_configuracion
- ambito
- id_lavanderia
- clave
- valor
- descripcion
- fecha_actualizacion

---

# Relaciones globales

Lavanderia 1 --- N Maquina  
Lavanderia 1 --- N TarifaMaquina  
Lavanderia 1 --- N MovimientoMaquina  

Maquina 1 --- N Ciclo  
Maquina 1 --- N MovimientoMaquina  
Maquina 1 --- N LogMaquina  

Ciclo 1 --- N MovimientoMaquina  
Ciclo 1 --- N LogMaquina  

Usuario 1 --- N MovimientoMaquina  
Usuario 1 --- N Auditoria  

TarifaMaquina 1 --- N Ciclo

---

# Reglas de negocio

1. El precio de arranque puede cambiar en el futuro.
2. Cada ciclo guarda los valores aplicados en el momento del arranque.
3. Cada euro añadido durante el ciclo genera minutos extra.
4. Las aportaciones manuales desde la web se consideran bonificaciones.
5. El dinero real del cliente se distingue mediante `es_bonificacion = false`.
6. Los informes de caja se calculan a partir de ciclos y movimientos.
