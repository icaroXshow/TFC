# IMPLEMENTACIONES PEDIDAS POR USUARIO
## FRONTEND
La estructura de la pagina de administracion de la tienda será asi: 
- INICIO: Inicio (Muestra: Stream de la camara, Maquinas en funcionamiento y caja del dia). 
- DOMÓMOTICA: 
    **Nivel de liquidos ya no estará** 
    **Maquinas** (Muestra todas las maquinas, su estado y las opciones que se pueden hacer con ellas)
    **Programador** (Muestra estado de Puerta, luces y ventilacion y permite encender o apagar y programar individualmente cuando se enciende y cuando se apaga automaticamente Ejemplo: En el programador de puerta se puede poner que se abra a las 9:00AM y se cierre a las 22:00PM)
    **Camara** (Muestra el stream de la camara de la tinda)(La camara es de una empresa que se dedica a eso y utiliza la url http://es1034.c14.ovh:1055/control/faststream.jpg?stream=full&fps=16&rand=882006 pero requiere loguin)

- CONTABILIDAD: 
    **Caja** (Tiene tres vistas que permiten ver la caja diaria, la caja semanal, la caja acumulada)(La caja acumulada permite elgir un rango de x dia a x dia, por defecto muestra un rango de un mes)(La caja diaria permite elegir el dia, por defecto muestra el dia actual)(La caja semanal permite elegir la semana, po defecto muestra la semana actual)
    **Informes** (Permite ver las estadisticas de la tienda) 
        + Ciclos (Una tabla con todos los ciclos de la tienda)
        + Evolucion (Tiene una vista para cada tabla un selector de rango y un grafico)
            - Tabla de evolucion semanal (Compara dos semanas, permite seleccionar la semana que se quiere comparar con la anterior)
            - Tabla de evolucion mensual (Compara dos meses, permite seleccionar los meses que se van a comparar)
            - Tabla de evolucion Anual (Compara dos años, permite seleccionar los años que se van a comparar)
        + Estadisticas (Tiene una vista para cada tabla un selector de rango y un grafico)
            - Tabla de tramos diaria (muestra una tabla que muestra facturacion de cada maquina por horas, con los totales y los ciclos de la maquina ese dia: Horizontal {Hora|L1|L2|L3|L4|S1|S2|S3|Total/Hora} Vertical{Horas{facturacion |L1|L2|L3|L4|S1|S2|S3|Total/Hora }|Total/Dia|Ciclos/Dia})
            - Tabla de tramos mensual
            - Tabla de tramos anual
- GESTION: 
    **Usuarios** (Realmente poder gestionar usuarios en Usuarios, solo siendo admin, sino esa vista no sale.)
    **Logs** (Tablas con los logs)
    **Publicaciones**  (Un gestor de la web publica que permita cambiar cosas como horario, about US, contacto y faqs sin tener que tocar codigo)

---
## SIMULADOR


# IMPLEMENTACIONES y REVISIONES IMPLEMENTADAS POR CODEX
## REVISIÓN GENERAL (2026-04-27)

### Estado de la revisión
- Se hizo revisión estática completa de `app/` y `simulation/`.
- No se pudo ejecutar `npm run typecheck` ni tests/build en este entorno porque no hay Node operativo (`node: command not found` / WSL1 sin soporte).

### Errores / mejoras detectadas
- [ ] **API hardcodeada** en frontend: hay muchas llamadas a `http://127.0.0.1:8080` en `app/frontend/public/js/admin.js` y `app/frontend/public/js/app.js`. Debe unificarse en `API_BASE`/config para no romper en servidor real.
- [ ] **Confirmaciones inconsistentes**: aún queda `window.confirm` en borrado de usuario (`admin.js`), mientras el resto usa modal bonito. Unificar UX.
- [ ] **Alertas nativas repetidas** (`window.alert`) en varios flujos admin. Sustituir por sistema de notificaciones/modal único.
- [ ] **Validación final de sincronía tiempo real** (web↔simulador): puerta, luces, estado máquina, crédito y ampliación. Confirmar en runtime con logs MQTT.
- [ ] **Verificar regla de ampliación cruzada** (si amplía simulador no amplía web y viceversa) en entorno real tras rebuild.
- [ ] **Checklist de regresión de flujo máquina**:
  - [ ] STOP → Encender → PAUSADA.
  - [ ] PAUSADA + crédito suficiente → EN_MARCHA al confirmar inicio.
  - [ ] Fin ciclo → PAUSADA (no STOP).
  - [ ] Apagar manual → STOP.
- [ ] **Revisar estados clicables** en Programador (`doorState`/`lightsState`): ahora pueden registrar toggle al pulsar la píldora de estado; decidir si se mantiene o se desactiva para evitar cambios accidentales.

### MQTT + simulador (pendiente de cierre)
- [ ] Ejecutar prueba de carga suave (sin cámara real) para verificar que no hay desincronización por polling.
- [ ] Confirmar que temporizadores web/simulador mantienen deriva máxima <= 1s durante ciclo completo y tras ampliación.
- [ ] Añadir script de smoke test manual documentado (pasos + resultados esperados) en `deploy/demo/INSTRUCCIONES.md`.

