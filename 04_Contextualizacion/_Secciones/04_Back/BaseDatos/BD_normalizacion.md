Normalización del modelo

El modelo de datos propuesto cumple de forma general las tres primeras formas normales. En primer lugar, se cumple la primera forma normal al almacenarse únicamente valores atómicos y evitarse grupos repetidos. En segundo lugar, se cumple la segunda forma normal, ya que los atributos no clave dependen completamente de la clave primaria de cada tabla. Finalmente, se cumple la tercera forma normal, al haberse separado las distintas responsabilidades del sistema en entidades independientes, evitando dependencias transitivas innecesarias.

No obstante, se ha introducido redundancia controlada en algunos atributos consolidados de la tabla ciclo, como el importe total aplicado o la duración total programada, con el objetivo de mejorar el rendimiento de consulta, simplificar la generación de informes y preservar el histórico exacto del estado del sistema en el momento de ejecución.

# Primera Forma Normal (1FN)

Se cumple porque:
- todas las tablas tienen clave primaria
- no hay grupos repetidos en una misma fila
- cada campo almacena un valor atómico
- no se guardan listas dentro de una sola columna

@ Ejemplo: en movimiento_maquina cada movimiento se guarda como un registro independiente, en lugar de meter varios movimientos dentro de un solo campo del ciclo.

# Segunda Forma Normal (2FN)

Se cumple porque:
- todas las tablas usan clave primaria simple
- los atributos no clave dependen completamente de su clave primaria
- no hay dependencias parciales

@ Ejemplo: en maquina, atributos como tipo_maquina, estado_actual o activa dependen de id_maquina, no de una parte de una clave compuesta.

# Tercera Forma Normal (3FN)

Se cumple en general porque:
- no se almacenan datos que dependan de otros atributos no clave
- se separan responsabilidades entre tablas
- se evita mezclar información operativa, económica, técnica y de auditoría

@ Ejemplos claros:
   ciclo guarda el uso real de la máquina
   movimiento_maquina guarda el dinero o bonificación aplicada
   log_maquina guarda eventos técnicos
   auditoria guarda acciones humanas
   tarifa_maquina separa la vigencia de precios para conservar histórico