# Justificación del Diseño de Base de Datos

## Requisitos cubiertos

El modelo se diseñó para cubrir los requisitos funcionales del sistema real:

- varias lavanderías
- varias máquinas por lavandería
- tarifas modificables sin romper histórico
- ciclos con ampliaciones
- operaciones manuales desde panel
- contabilidad separando cliente y bonificación
- auditoría y trazabilidad técnica

---

## Decisiones clave

### 1. Separar ciclo y movimiento económico

Se eligió separar:

- `ciclo` (hecho operativo)
- `movimiento_maquina` (hecho económico)

Motivo:

- permite registrar múltiples aportaciones por ciclo
- diferencia origen (`MONEDERO` vs `WEB_MANUAL`)
- mejora precisión contable y de informes

### 2. Guardar snapshot tarifario en ciclo

Aunque exista `tarifa_maquina`, el ciclo almacena los importes y tiempos aplicados.

Motivo:

- protege histórico ante cambios de tarifas
- evita recalcular condiciones antiguas

### 3. Mantener trazabilidad explícita

Se separan `auditoria` y `log_maquina`.

Motivo:

- `auditoria`: acciones humanas/administrativas
- `log_maquina`: eventos técnicos/operativos

Esto simplifica análisis de incidencias y responsabilidades.

### 4. Configuración por ámbito

La tabla `configuracion` soporta claves `GLOBAL` y `LAVANDERIA`.

Motivo:

- permite parametrización sin cambios de esquema
- facilita ajustes por tienda

---

## Beneficios del modelo

- consistencia operativa
- histórico fiable
- consultas de informes directas
- escalabilidad a múltiples lavanderías
- desacoplo entre lógica de negocio y persistencia

---

## Trade-offs asumidos

- Se acepta redundancia controlada en `ciclo` para preservar histórico y rendimiento.
- El modelo prioriza trazabilidad y claridad de negocio frente a máxima compacidad.
