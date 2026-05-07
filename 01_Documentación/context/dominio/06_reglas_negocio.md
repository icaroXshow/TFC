# Reglas de negocio

## Objetivo

Este documento define las reglas funcionales del dominio que deben respetar la base de datos, el backend, la simulación y el frontend.

No describe implementación técnica, sino comportamiento esperado del sistema.

---

## 1. Reglas generales

1. El sistema opera sobre lavanderías reales.
2. Cada máquina pertenece a una única lavandería.
3. Toda acción operativa importante debe quedar registrada.
4. Toda acción administrativa crítica debe quedar registrada en auditoría.
5. Toda entrada económica aplicada a una máquina debe quedar registrada como movimiento.
6. Los dispositivos no toman decisiones de negocio; ejecutan órdenes y reportan estados o eventos.
7. El backend es quien valida, decide y coordina.

---

## 2. Reglas sobre máquinas

1. Una máquina puede estar en uno de los estados definidos por el sistema.
2. Una máquina solo puede iniciar un nuevo ciclo si su estado lo permite.
3. Una máquina no debe iniciar un ciclo si está:
   - `EN_MARCHA`
   - `PAUSADA`
   - `FUERA_SERVICIO`
   - `MANTENIMIENTO`
4. Una máquina en `STOP` puede iniciar ciclo si se cumplen las condiciones económicas y operativas necesarias.
5. Una máquina puede marcarse manualmente como `FUERA_SERVICIO` o `MANTENIMIENTO`.
6. Una máquina en mantenimiento o fuera de servicio no debe aceptar nuevas órdenes de inicio de ciclo.
7. Toda acción manual sobre una máquina debe registrarse en auditoría.

---

## 3. Reglas sobre ciclos

1. Un ciclo representa una ejecución real de una máquina.
2. Un ciclo pertenece a una única máquina.
3. Un ciclo se crea cuando el backend valida un arranque y lanza la operación correspondiente.
4. Un ciclo debe guardar congeladas las condiciones aplicadas en el momento del arranque.
5. El ciclo no debe depender de valores futuros de tarifa para interpretar el histórico.
6. Un ciclo puede pasar por estados como:
   - `INICIADO`
   - `FINALIZADO`
   - `CANCELADO`
   - `INCIDENCIA`
7. Un ciclo solo puede estar abierto una vez por máquina.
8. Una máquina no debe tener dos ciclos activos simultáneamente.
9. Cuando el sistema recibe confirmación de finalización, el ciclo debe cerrarse registrando su fin.
10. Si se produce una incidencia grave, el ciclo puede pasar a estado de incidencia sin considerarse finalizado correctamente.

---

## 4. Reglas económicas

### 4.1 Regla base

1. Todo importe aplicado a una máquina debe quedar registrado en `movimiento_maquina`.
2. `movimiento_maquina` es la entidad contable base del sistema.
3. El ciclo acumula resultado económico, pero no sustituye al detalle de movimientos.

### 4.2 Arranque

1. Para iniciar un ciclo debe cumplirse la condición económica mínima exigida.
2. El importe mínimo de arranque viene determinado por la tarifa vigente.
3. El backend decide si el saldo acumulado permite o no iniciar el ciclo.

### 4.3 Ampliaciones

1. Una ampliación representa dinero adicional aplicado a una máquina o a un ciclo.
2. Cada ampliación debe registrarse como movimiento independiente.
3. Una ampliación puede generar minutos extra según la tarifa aplicable.
4. Los minutos extra generados deben poder conservarse de forma trazable.

### 4.4 Bonificaciones

1. Una bonificación aplicada desde web debe registrarse como movimiento.
2. La bonificación debe diferenciarse del dinero real introducido por cliente.
3. Aunque la máquina reciba saldo operativo normal, el sistema debe distinguir contablemente:
   - dinero real
   - bonificación

### 4.5 Histórico económico

1. El histórico económico no debe recalcularse usando tarifas actuales.
2. Los valores aplicados al ciclo deben mantenerse fijos una vez creado.
3. Un cambio de tarifa futura no modifica ciclos pasados.

---

## 5. Reglas sobre tarifas

1. Las tarifas se definen por lavandería.
2. Una tarifa establece como mínimo:
   - precio de arranque
   - tiempo base
   - importe por incremento
   - minutos por incremento
3. Una máquina debe operar usando una tarifa válida para su lavandería.
4. La tarifa aplicada a un ciclo se determina al inicio del ciclo.
5. El ciclo debe almacenar los valores aplicados aunque la tarifa cambie después.
6. No debe existir ambigüedad sobre qué tarifa estaba vigente en el momento del arranque.

---

## 6. Reglas sobre movimientos

1. Cada movimiento pertenece al contexto de una lavandería y una máquina.
2. Un movimiento puede estar asociado a un ciclo si aplica a una ejecución concreta.
3. Un movimiento puede tener origen:
   - cliente
   - sistema
   - usuario web
4. Un movimiento debe dejar claro:
   - importe
   - origen
   - tipo
   - si genera bonificación
   - si genera minutos extra
5. Los movimientos son la base para reconstruir la actividad económica real de una máquina.

---

## 7. Reglas sobre eventos técnicos

1. Todo evento técnico relevante debe registrarse en `log_maquina`.
2. Un evento técnico puede estar asociado a:
   - una máquina
   - un ciclo
   - una lavandería
3. Los eventos técnicos incluyen, entre otros:
   - inicio de ciclo
   - finalización de ciclo
   - error de comunicación
   - cambio de estado
   - conexión o desconexión
4. Los eventos técnicos no sustituyen a la auditoría administrativa.
5. Los eventos técnicos describen hechos operativos o de dispositivo.

---

## 8. Reglas sobre auditoría

1. La auditoría registra acciones de usuario o sistema con relevancia administrativa.
2. Toda acción crítica debe auditarse.
3. Deben auditarse como mínimo:
   - login
   - logout
   - arranque manual
   - parada manual
   - reinicio manual
   - apertura de tienda
   - cierre de tienda
   - cambios de configuración
   - altas y ediciones de usuarios
4. La auditoría debe permitir conocer:
   - quién hizo la acción
   - cuándo la hizo
   - sobre qué entidad actuó
   - detalle mínimo de la acción

---

## 9. Reglas sobre tienda y dispositivos auxiliares

1. La tienda puede ejecutar acciones globales como apertura y cierre.
2. La apertura de tienda puede implicar acciones coordinadas sobre:
   - puerta
   - luces
   - ventilación
3. El cierre de tienda puede implicar acciones coordinadas sobre:
   - puerta
   - luces
   - ventilación
4. Estas acciones deben pasar por backend.
5. Las acciones globales deben quedar registradas en auditoría.
6. Los dispositivos auxiliares reportan estado y eventos, pero no deciden la operación del negocio.

---

## 10. Reglas sobre usuarios y permisos

1. Todo acceso al panel requiere autenticación.
2. Los usuarios tienen rol.
3. Los permisos se aplican según rol.
4. Un usuario solo debe operar dentro del alcance permitido por su rol y lavanderías asociadas.
5. No toda acción disponible en el sistema debe estar disponible para todos los usuarios.
6. Las acciones críticas deben validar autenticación y autorización antes de ejecutarse.

---

## 11. Reglas sobre simulación

1. La simulación debe comportarse como si fuera un dispositivo real a nivel funcional.
2. La simulación debe aceptar los mismos comandos que el dispositivo real correspondiente.
3. La simulación debe publicar estados y eventos coherentes con el dominio.
4. La simulación no debe inventar reglas de negocio nuevas.
5. El backend debe poder trabajar con simulación y hardware real sin cambiar la lógica del dominio.

---

## 12. Reglas sobre tiempo real

1. El frontend obtiene una carga inicial desde la API.
2. Las actualizaciones posteriores se reciben en tiempo real.
3. Redis puede mantener estado operativo rápido, pero no sustituye el histórico.
4. El estado en tiempo real debe ser coherente con los eventos y acciones procesados por backend.
5. Si existe discrepancia entre estado rápido y persistencia, la persistencia es la referencia histórica.

---

## 13. Regla de prioridad

Si alguna implementación contradice estas reglas, la implementación debe corregirse.