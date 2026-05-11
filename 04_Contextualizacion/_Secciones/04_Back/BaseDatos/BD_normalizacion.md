# Normalización del Modelo

El modelo de datos de KWL cumple de forma general 1FN, 2FN y 3FN, con redundancia controlada donde aporta valor operativo.

---

## Primera Forma Normal (1FN)

Se cumple porque:

- cada tabla tiene clave primaria
- cada campo almacena valor atómico
- no hay grupos repetidos en una misma fila

Ejemplo:

- cada aportación económica se registra como fila independiente en `movimiento_maquina`.

---

## Segunda Forma Normal (2FN)

Se cumple porque:

- el modelo usa claves primarias simples
- los atributos no clave dependen de la clave completa de su tabla
- no hay dependencias parciales

Ejemplo:

- en `maquina`, `tipo_maquina`, `estado_actual` y `activa` dependen de `id_maquina`.

---

## Tercera Forma Normal (3FN)

Se cumple en términos prácticos porque:

- cada entidad mantiene una responsabilidad clara
- se minimizan dependencias transitivas no necesarias
- se evita mezclar hechos de naturaleza distinta

Separación aplicada:

- operación: `ciclo`
- economía: `movimiento_maquina`
- técnico: `log_maquina`
- administrativo: `auditoria`

---

## Redundancia controlada (decisión consciente)

Se mantiene redundancia en `ciclo` (por ejemplo: importes y duración total aplicada).

Motivo:

- preservar histórico exacto del momento de ejecución
- simplificar informes
- evitar recomputar condiciones tarifarias históricas

Esta redundancia no rompe la coherencia funcional y está justificada por el dominio.
