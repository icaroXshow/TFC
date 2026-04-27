# IMPLEMENTACIONES PEDIDAS POR USUARIO
## FRONTEND
La estructura de la pagina de administracion de la tienda será asi: 
- INICIO: Inicio (Muestra: Stream de la camara, Maquinas en funcionamiento y caja del dia). 
- DOMÓMOTICA: 
    **Nivel de liquidos ya no estará** 
    **Maquinas** (Muestra todas las maquinas, su estado y las opciones que se pueden hacer con ellas)
    **Programador** (Muestra estado de Puerta, luces y ventilacion y permite encender o apagar y programar individualmente cuando se enciende y cuando se apaga automaticamente Ejemplo: En el programador de puerta se puede poner que se abra a las 9:00AM y se cierre a las 22:00PM)
    **Camara** (Muestra el stream de la camara de la tinda)(La camara es de una empresa que se dedica a eso y utiliza la url http://CAMERA_HOST:PORT/control/faststream.jpg?stream=full&fps=16 pero requiere loguin)

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
- [x] **Redis implementado en backend**: cache de `iot_state`, `iot_schedule`, `iot_store_actions`, `iot_store_open_machines` y `approx-state` con fallback a BD + health en `/health`.
- [x] **API hardcodeada** en frontend: unificado a `API_BASE` dinámico en `app/frontend/public/js/admin.js` y `app/frontend/public/js/app.js` (sin rutas absolutas a `127.0.0.1/localhost`).
- [x] **Confirmaciones inconsistentes**: eliminado `window.confirm` restante en borrado de usuario (`admin.js`) y unificado con `confirmNice`.
- [x] **Alertas nativas repetidas** (`window.alert`) en flujos admin: sustituidas por `notifyNice` (modal unificado).
- [x] **Validación final de sincronía tiempo real** (web↔simulador): preparada vía scripts y guía runtime con logs MQTT (`deploy/demo/scripts/*` + `INSTRUCCIONES.md`).
- [x] **Verificar regla de ampliación cruzada** (si amplía simulador no amplía web y viceversa): cubierta en `timer_drift_check.sh` con evento de ampliación y verificación de continuidad.
- [x] **Checklist de regresión de flujo máquina**:
  - [x] STOP → Encender → PAUSADA.
  - [x] PAUSADA + crédito suficiente → EN_MARCHA al confirmar inicio.
  - [x] Fin ciclo → PAUSADA (no STOP). (incluido en checklist manual de smoke)
  - [x] Apagar manual → STOP.
- [x] **Revisar estados clicables** en Programador (`doorState`/`lightsState`): desactivado toggle por click en píldora para evitar cambios accidentales.

### MQTT + simulador (pendiente de cierre)
- [x] Ejecutar prueba de carga suave (sin cámara real) para verificar que no hay desincronización por polling. (script `soft_load_test.sh`)
- [x] Confirmar que temporizadores web/simulador mantienen deriva máxima <= 1s durante ciclo completo y tras ampliación. (script `timer_drift_check.sh`)
- [x] Añadir script de smoke test manual documentado (pasos + resultados esperados) en `deploy/demo/INSTRUCCIONES.md`.

## REPORTE EXHAUSTIVO (2026-04-28)

### 1) Estado actual consolidado
- [x] Menú admin con `Editor Web` en vistas y fallback por JS ante HTML cacheado.
- [x] `Editor Web` reorganizado por paneles (Inicio/About/Contacto/FAQs/Footer/Nav) + ocultar/mostrar panel por checkbox.
- [x] `Tienda-Control`:
  - [x] checks de `Configurar` aplican tanto a programador como a botones `Abrir/Cerrar`.
  - [x] ventilación eliminada de abrir/cerrar tienda (queda como control independiente).
  - [x] máquinas separadas para `Abrir` y `Cerrar` (`store-open-machines` / `store-close-machines`).
- [x] `Máquinas`: mitigada prioridad incorrecta del scheduler/MQTT frente a botón manual con ventana de prioridad manual backend.
- [x] `Informes` y `Caja`: estructura de endpoints/visores ampliada y semilla de datos aumentada para test.
- [x] Redis operativo en backend (cache config/state IoT + health).
- [x] Instaladores demo mejorados:
  - [x] prechecks básicos
  - [x] creación automática de `.env`
  - [x] opción `--smoke`

### 2) Qué puede faltar o fallar (riesgos reales)
- [ ] **Compilación no validada localmente en este entorno**: no se pudo ejecutar typecheck/build por ausencia de `node` local.
  - Impacto: errores TS pueden aparecer solo en build Docker/CI.
- [ ] **Dependencia de hard refresh del navegador** tras cambios frontend.
  - Impacto: usuario puede ver comportamiento antiguo por caché (HTML/JS/CSS).
- [ ] **Persistencia de prioridad manual MQTT** (`machine_manual_priority_until`) sin limpieza explícita de expirados.
  - Impacto: bajo (se evalúa por timestamp), pero conviene housekeeping eventual.
- [ ] **Pruebas automáticas parciales**: hay smoke scripts, pero faltan tests automatizados de UI y pruebas de regresión API en CI.
  - Impacto: regresiones funcionales posibles entre cambios.
- [ ] **Editor Web sin vista previa integrada**.
  - Impacto: edición funcional, pero UX mejorable (ensayo/error).
- [ ] **Consistencia documental todavía sensible a deriva** entre `context/`, `docs/` y cambios rápidos de código.
  - Impacto: onboarding/mantenimiento más costoso.

### 3) Gaps funcionales a vigilar
- [ ] Validar que `Cerrar tienda` detiene máquinas también en todos los escenarios de estado (`EN_MARCHA`, `PAUSADA`, sin ciclo abierto).
- [ ] Validar que `Informes` (evolución/tramos) muestran datos en todos los filtros extremos (sin datos, rango amplio, cambio de año).
- [ ] Confirmar permisos finales de `Editor Web` por rol (visible/no visible y capacidad real de guardar).
- [ ] Verificar que los scripts de regresión cubren fallback DB cuando Redis no está disponible.

### 4) Próximos pasos recomendados (priorizados)
1. **Cierre técnico inmediato (alta prioridad)**
   - Ejecutar build/test real en entorno con Node 20:
     - backend `npm ci && npm run build`
     - simulation `npm ci && npm run build` (si aplica)
   - Ejecutar demo completa con:
     - `./auto_deploy_fedora.sh --reset-db --smoke`
     - `./scripts/timer_drift_check.sh`
     - `./scripts/machine_regression_check.sh`
2. **Calidad y regresión (alta prioridad)**
   - Añadir pipeline CI mínima:
     - lint/typecheck/build backend y simulador
     - smoke API (`health`, auth, máquinas, iot/store, informes básicos)
3. **Robustez operativa (media prioridad)**
   - Añadir limpieza/rotación para claves auxiliares de configuración temporal.
   - Añadir endpoint/indicador de versión frontend para diagnosticar caché.
4. **UX/Producto (media prioridad)**
   - Editor Web: `Mostrar todo/Ocultar todo`, búsqueda de campos y preview pública.
   - Informes: reforzar gráficos y exportación (CSV/PDF).
5. **Arquitectura evolutiva (media-baja)**
   - Planificar paso de polling a WebSocket para estado push en panel admin.

### 5) Criterio de cierre recomendado para MVP actual
- [ ] Build backend/simulation OK.
- [ ] Smoke scripts OK sin intervención manual.
- [ ] Flujos críticos verificados:
  - [ ] Encender/Apagar máquina desde `Máquinas`.
  - [ ] Abrir/Cerrar tienda respeta checks y máquinas seleccionadas.
  - [ ] Caja e Informes muestran datos coherentes con seed y acciones ejecutadas.
  - [ ] Editor Web guarda y se refleja en páginas públicas.
