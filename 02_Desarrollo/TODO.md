# TODO - Auditoría profunda de fallos, incongruencias y mejoras (TFC)

Fecha de revisión: 2026-05-07  
Alcance revisado: `02_Desarrollo/app/*`, `02_Desarrollo/simulation/*`, `02_Desarrollo/deploy/demo/*`, documentación y configuración runtime.

---

## 1) Crítico (resolver primero)

- [ ] **WS admin-live sin autenticación ni control de acceso por tienda**
  - Evidencia:
    - `app/backend/src/server.ts:90` crea WS en `/ws/admin-live`.
    - `app/backend/src/server.ts:119-128` acepta conexiones y emite snapshot sin validar token/rol.
  - Riesgo:
    - Exposición de datos operativos por lavandería a cualquier cliente de red que conozca endpoint.
  - Acción:
    - Exigir JWT en handshake WS.
    - Validar rol y pertenencia a `usuario_lavanderia` para `lav` solicitada.
    - Rechazar conexión con close code + motivo cuando no cumpla permisos.

- [ ] **Incongruencia rol OPERADOR en Cámara (UI permite, backend bloquea stream)**
  - Evidencia:
    - UI: `app/frontend/public/js/admin/nucleo-dashboard-maquinas.js:282-309` permite `camara` a OPERADOR.
    - Backend stream: `app/backend/src/web/routes/camera.ts:76` exige `payload.rol === "ADMIN"`.
  - Riesgo:
    - Operador ve pantalla de cámara pero el stream falla (blanco/fallback), comportamiento inconsistente.
  - Acción:
    - Decidir política única:
      - O permitir stream para OPERADOR con control por lavandería.
      - O ocultar vista Cámara a OPERADOR en frontend y rutas.

- [ ] **Dependencia frágil de IDs fijos de lavandería (sim/cámara)**
  - Evidencia:
    - `simulation/src/gui-server.js:16` usa `SIM_LAV_ID` por defecto `3`.
    - `app/backend/src/web/routes/camera.ts:52-54` mapea cámara por `idLav === 2`.
    - `deploy/demo/db/init/seed.sql` borra datos (`DELETE`) pero no resetea autoincrement.
  - Riesgo:
    - Tras resiembras/redeploy, IDs pueden variar y romper sincronización simulador/web/cámara.
  - Acción:
    - Dejar de usar IDs mágicos; resolver por `codigo` (`SIM-01`, `FLEM-01`, `PUEB-01`) o config explícita por tienda.
    - Si se necesita ID estable en demo, usar `TRUNCATE` controlado + reseed de autoincrement.

---

## 2) Alto

- [ ] **Coexistencia WS + SSE + polling (deuda técnica y potencial desalineación)**
  - Evidencia:
    - SSE sigue activo en `simulation/src/gui-server.js:225-241` (`/api/stream`).
    - Polling de respaldo en `simulation/public/simulador.js:428-430`.
    - WS activo en `simulation/src/gui-server.js:319` y `simulation/public/simulador.js:321-349`.
  - Riesgo:
    - Complejidad innecesaria, más superficie de fallo, estados duplicados.
  - Acción:
    - Consolidar a WS como transporte principal.
    - Retirar SSE legado si no hay dependencia real.
    - Dejar polling solo como fallback controlado y con backoff.

- [ ] **Timeout Redis demasiado agresivo para entornos reales**
  - Evidencia:
    - `REDIS_TIMEOUT_MS` default 500 ms en `app/backend/src/system/env.ts:75`.
  - Riesgo:
    - Falsos `Redis OFF` por latencia puntual de red/container.
  - Acción:
    - Subir a 1500-3000 ms en demo/producción.
    - Añadir estrategia de reintento corto para health.

- [ ] **`API_BASE` hardcodeado a `:8080` en admin**
  - Evidencia:
    - `app/frontend/public/js/admin/nucleo-dashboard-maquinas.js:4`.
  - Riesgo:
    - Despliegues detrás de proxy/TLS/puerto distinto fallan.
  - Acción:
    - Resolver por origen relativo (`/api`) o variable inyectada por nginx/build.

- [ ] **Riesgo de exposición de secretos por edición de `.env` desde UI**
  - Evidencia:
    - Escritura directa en `.env`: `app/backend/src/web/routes/configuracion.ts:61-86`.
  - Riesgo:
    - Operación sensible en runtime, posibilidad de fuga/errores humanos.
  - Acción:
    - Mantener solo para demo y documentarlo como no recomendado en prod.
    - En prod: secrets manager / variables de entorno externas.

---

## 3) Medio

- [ ] **Código residual de zoom fijo 1x/2x/4x/8x en admin**
  - Evidencia:
    - Referencias a `camZoom1x/2x/4x/8x` en `nucleo-dashboard-maquinas.js:62-65`.
  - Riesgo:
    - Confusión y mantenimiento innecesario.
  - Acción:
    - Eliminar referencias y handlers no usados.

- [ ] **Estado nombrado “sseActiva” pero usado con WS**
  - Evidencia:
    - `simulation/public/simulador.js:21`, `:328-349`, `:429`.
  - Riesgo:
    - Semántica confusa para futuras modificaciones.
  - Acción:
    - Renombrar a `streamActivo` o `wsActivo` y separar flags correctamente.

- [ ] **Uso amplio de `any` en backend crítico**
  - Evidencia:
    - `app/backend/src/server.ts:92`, `camera.ts` varias funciones, `usuarios.ts` auditoría.
  - Riesgo:
    - Menor robustez de tipos, más errores silenciosos.
  - Acción:
    - Tipar requests/payloads/WS clients progresivamente en rutas críticas.

- [ ] **Redacción/consistencia de textos UI**
  - Evidencia:
    - Claves y literales con variantes (“CONTACTANOS”, “Donde encontrarnos”).
  - Riesgo:
    - Calidad visual/UX de entrega final.
  - Acción:
    - Pasada final de copy y ortografía en público/admin/docs.

---

## 4) Bajo

- [ ] **Limpieza de estilos y componentes duplicados frontend**
  - Evidencia:
    - Iteraciones múltiples en CSS público/admin dejan selectores que ya no aplican.
  - Riesgo:
    - Peso extra y dificultad de mantenimiento.
  - Acción:
    - Auditoría de selectores no usados + depuración de CSS por vistas.

- [ ] **Checklist funcional incompleto en documentación de flujos**
  - Evidencia:
    - Documentos de flujo con estados no cerrados.
  - Acción:
    - Marcar por caso: `Implementado`, `Validado`, `Pendiente`, `No aplica`.

---

## 5) Mejoras recomendadas (producción)

- [ ] **Seguridad WS completa**
  - JWT en handshake, validación por tienda, cierre por inactividad, límites por IP.

- [ ] **Observabilidad mínima**
  - Métricas de conexión WS (activos, reconnects, errores).
  - Logs estructurados para eventos MQTT/Redis/Camera.

- [ ] **Sincronización de estado unificada**
  - Definir fuente de verdad por dominio:
    - Máquina: DB + eventos MQTT.
    - IoT tienda: config + eventos MQTT.
    - UI: snapshots WS con versión/ts monotónico.

- [ ] **Política de despliegue**
  - Validación pre-arranque (env required, servicios reachability).
  - Healthchecks compuestos y ready/liveness claros.

---

## 6) Plan de ejecución propuesto (orden)

1. **Fase A (bloqueante)**
   - Cerrar seguridad de `admin-live` WS.
   - Resolver incongruencia rol OPERADOR en Cámara.
   - Quitar lógica por IDs fijos (lav/cámara/sim).

2. **Fase B (estabilidad)**
   - Consolidar transporte realtime (WS principal, retirar SSE legado).
   - Ajustar timeout/reintentos Redis.
   - Parametrizar `API_BASE` para proxy/producción.

3. **Fase C (acabado)**
   - Limpieza de residuos JS/CSS.
   - Tipado progresivo en backend.
   - Cierre de documentación y checklist final.

---

## 7) Observaciones de validación

- En este entorno de revisión no se pudo ejecutar `npm build/typecheck` por falta de `npm` en shell.
- Recomendación de cierre técnico local:
  - Backend: `npm run typecheck && npm run build`
  - Simulation: verificación de arranque + WS en `:8083`
  - End-to-end con `docker compose up -d --build` y pruebas por rol/tienda.
