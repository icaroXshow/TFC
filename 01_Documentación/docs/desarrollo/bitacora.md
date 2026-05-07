# Bitácora de implementación (TFC)

Este documento guarda **qué se ha creado**, **cómo se ha hecho** y **por qué**,
de forma que pueda copiarse/adaptarse en la memoria del TFC.

## 2026-04-17 — Frontend: separación público/privado y mejoras responsive

### Qué

- Se reorganiza el frontend para que la web pública viva en `app/frontend/public/`.
- Se crea el panel privado (admin) en `app/frontend/public/admin/index.html`.
- Se añade un visor de PDFs legales en `app/frontend/public/legal/`.

### Cómo

- Se mueve el `index.html` principal a `app/frontend/public/index.html` y se deja
  `app/frontend/index.html` como redirección para no romper accesos antiguos.
- El botón de login del modal redirige a `admin/index.html` (zona privada).
- Se ajustan CSS existentes para mejorar responsive (topbar/nav/hero/modal auth).
- Los enlaces del footer (“cookies/privacidad/aviso legal”) apuntan a páginas
  visor que embeben un PDF con `<object>`.
- En la vista móvil, el botón “X” del modal deja de ser un enlace (`<a href=...>`)
  para evitar que navegue al inicio: ahora solo cierra el modal.

### Por qué

- Separar “público” y “admin” evita mezclar requisitos y permite aplicar auth
  solo al área privada.
- El frontend público debe ser estético y usable en móvil (profes lo verán en
  pantallas distintas).
- El visor legal permite cumplir el requisito “mostrar PDFs” sin bloquear el
  desarrollo (aunque aún no existan los ficheros).

### Archivos clave

- Público: `app/frontend/public/index.html`
- Admin: `app/frontend/public/admin/index.html`
- Legal: `app/frontend/public/legal/*.html`

## 2026-04-17 — Backend: base API + auth + lectura MariaDB (MVP)

### Qué

- Se crea un backend Node.js (Express) en `app/backend/` con:
  - `GET /health`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/maquinas` (ya lee desde MariaDB si existe)
- Se añade capa MariaDB (pool) y variables de entorno.

### Cómo

- Express + middlewares (helmet/cors/morgan) para API básica.
- Autenticación con token estilo JWT (HMAC SHA-256) y middleware `requireAuth`.
- Login consulta la tabla `usuario` y valida password:
  - si hay hash bcrypt → compara bcrypt
  - si no hay hash → comparación directa (fallback MVP, para no bloquear)
- `GET /health` intenta `SELECT 1` para reportar `db: ok|down`.
- `GET /api/maquinas` consulta la tabla `maquina` filtrando por lavandería.
  La lavandería se envía en cabecera `x-lavanderia-id` (si no, usa `1`).
- CORS se adapta a desarrollo local: se permite `Origin: null` para soportar
  abrir el frontend con `file://` (útil en demo/evaluación).

### Ampliación: primer flujo operativo (arranque de máquina)

- Se implementa `POST /api/maquinas/{id}/iniciar` (MVP):
  - requiere auth y rol `ADMIN`
  - valida máquina activa y estado `STOP`
  - obtiene tarifa vigente
  - crea `ciclo` con valores congelados
  - registra `movimiento_maquina` (ARRANQUE, WEB_MANUAL, bonificación MVP)
  - registra `auditoria` y `log_maquina`
  - actualiza `maquina.estado_actual` a `EN_MARCHA`

- Se implementa `POST /api/maquinas/{id}/detener` (MVP):
  - requiere auth y rol `ADMIN`
  - cierra el ciclo abierto (`INICIADO` → `FINALIZADO`, `fecha_hora_fin = NOW()`)
  - registra `auditoria` y `log_maquina` (`CICLO_FINALIZADO`)
  - actualiza `maquina.estado_actual` a `STOP`

- Se implementa `POST /api/maquinas/{id}/ampliar` (MVP):
  - requiere auth y rol `ADMIN`
  - valida ciclo abierto (`estado_ciclo = INICIADO`)
  - calcula incrementos según tarifa aplicada (`importe_incremento` / `minutos_por_incremento`)
  - registra `movimiento_maquina` (AMPLIACION_TIEMPO, WEB_MANUAL, bonificación MVP)
  - actualiza acumulados del `ciclo` (minutos extra, importes, duración programada)
  - registra `auditoria` y `log_maquina` (`AMPLIACION_APLICADA`)

### Por qué

- Permite demostrar el flujo “frontend → API → backend decide” aunque todavía no
  esté MQTT/Redis/WebSocket.
- Conectar a la BD pronto reduce incoherencias con `context/` y acelera el resto
  del dominio (máquinas, ciclos, auditoría, etc.).

### Archivos clave

- Entrada: `app/backend/src/server.ts`
- Enrutado: `app/backend/src/web/api.ts`
- Auth: `app/backend/src/web/auth/*`
- DB pool: `app/backend/src/db/pool.ts`

## 2026-04-17 — Deploy demo: MariaDB con schema + seed

### Qué

- Se crea un despliegue demo para MariaDB en `deploy/demo/`:
  - `deploy/demo/docker-compose.yml`
  - `deploy/demo/db/init/02_seed.sql`

### Cómo

- MariaDB en contenedor con init SQL:
  - `context/db/BD_modelo_fisico.sql` (schema, “fuente de verdad”)
  - `02_seed.sql` (datos mínimos: lavandería, usuario admin, máquinas)

### Por qué

- Los profesores deben poder levantar el sistema en local sin tocar infra real.
- Seed mínimo permite probar login y endpoints sin depender de UI completa.

### Nota de entorno

En WSL hace falta Docker Desktop con integración WSL. Si no, no se puede usar
`docker compose` desde esta distro.

En esta máquina, el puerto `3306` dio conflicto/forward error, así que el demo
publica MariaDB en `3307` (host) → `3306` (contenedor).

Verificación:

- `docker compose up -d` levanta MariaDB demo.
- `GET /health` del backend devuelve `db: ok` cuando la BD está disponible.

## 2026-04-17 — Modo demo “en vivo” (servicios levantados en local)

### Qué

- Se deja el sistema demo levantado para ver cambios del frontend “sobre la marcha”.

### Cómo

- MariaDB: `deploy/demo` con `docker compose up -d` (puerto host `3307`).
- Backend: proceso Node escuchando en `http://127.0.0.1:8080`.
- Frontend: servidor estático simple con `python -m http.server` en `http://127.0.0.1:8081`.

### Por qué

- Abrir HTML con `file://` da fricción (CORS/orígenes). Servirlo por HTTP hace el flujo más
  parecido a producción y facilita ver cambios sin pasos extra.

## 2026-04-17 — Frontend admin: login + consumo de API (primer wiring)

### Qué

- El panel admin deja de ser “solo maqueta”: ahora puede hacer login contra el
  backend y cargar la lista de máquinas.
  Además, se unifica el flujo para que exista **un único login** (el de la web pública).

### Cómo

- Login único en público (`app/frontend/public/js/app.js`):
  - el modal llama `POST /api/auth/login`
  - guarda token en `localStorage` (`kwl_auth`)
  - redirige a `app/frontend/public/admin/index.html`
- En admin (`app/frontend/public/js/admin.js`):
  - si no hay token, redirige a `../index.html#login` (abre el modal automáticamente)
  - si hay token, carga `GET /api/maquinas` y renderiza tarjetas
- “Salir” borra token (`localStorage`) para forzar re-login.

### Ampliación: acción “Iniciar” desde el panel

- En la rejilla de máquinas, el botón “Iniciar” se habilita cuando el estado es `STOP`.
- Al pulsar:
  - llama `POST /api/maquinas/{id}/iniciar`
  - recarga `GET /api/maquinas` para reflejar el nuevo estado

### Ampliación: acción “Detener” desde el panel

- El botón “Detener” se habilita cuando el estado es `EN_MARCHA` (o `PAUSADA`).
- Al pulsar:
  - llama `POST /api/maquinas/{id}/detener`
  - recarga `GET /api/maquinas` para reflejar el estado `STOP`

### Ampliación: acción “Ampliar” desde el panel

- El botón “Ampliar” se habilita cuando el estado es `EN_MARCHA` (o `PAUSADA`).
- Al pulsar:
  - pide un importe en euros (prompt MVP)
  - llama `POST /api/maquinas/{id}/ampliar` con `{ importe }`
  - recarga `GET /api/maquinas`

### Por qué

- Permite demostrar el flujo MVP “panel privado → API → datos reales de BD”
  antes de implementar MQTT/Redis/WebSockets.
- Evita que se vea el panel privado (aunque sea estático) sin autenticación,
  manteniendo la separación pública/privada coherente.
- Evita duplicar formularios de login y reduce confusión en la demo.

## 2026-04-17 — Admin: una vista por pantalla + breadcrumbs dinámicos

### Qué

- El panel admin pasa de “secciones en una página” a **vistas separadas** (una pantalla por apartado),
  como en el panel de referencia.
- La barra superior muestra la ruta tipo explorador: `Inicio › ... › ...` según la vista actual.

### Cómo

- Se crean páginas en `app/frontend/public/admin/`:
  - `maquinas.html`, `iot.html`, `camara.html`, `niveles.html`, `caja.html`, `informes.html`, `usuarios.html`, `logs.html`
- El JS `app/frontend/public/js/admin.js`:
  - redirige a `/index.html#login` si no hay token
  - marca el ítem activo del menú lateral según la URL
  - renderiza breadcrumbs a partir de `body[data-breadcrumb="Grupo|Vista"]`
- El login público redirige a `admin/maquinas.html` tras autenticación.

## 2026-04-17 — Admin: lavandería activa (multi-lavandería)

### Qué

- La UI deja de mostrar una dirección fija. Ahora la ubicación depende de la **lavandería activa**.

### Cómo

- Backend: `GET /api/lavanderias` devuelve las lavanderías asociadas al usuario (`usuario_lavanderia`).
- Front admin:
  - selector de lavandería en topbar (`#adminLavSelect`)
  - guarda la lavandería activa en `localStorage` (`kwl_lavanderia_activa`)
  - envía `x-lavanderia-id` en llamadas API (`/api/maquinas`, acciones)
  - muestra dirección/ciudad/provincia en `#adminLocation`

## 2026-04-17 — Admin: INICIO + menús según PENDIENTES

### Qué

- Se añade la vista `Inicio` (cámara + máquinas en marcha + caja del día).
- Se elimina “Nivel de líquidos” del panel admin (ya no aplica al MVP actual).
- Se reestructura el menú lateral en grupos: Domótica / Contabilidad / Gestión.

### Cómo

- Nueva vista: `app/frontend/public/admin/inicio.html`
- Redirección post-login a `admin/inicio.html`.
- Menú actualizado en vistas existentes.
- `niveles.html` se elimina.

## 2026-04-17 — Cámara MOBOTIX: proxy backend + controles PTZ/zoom (MVP)

### Qué

- Se implementa un proxy en backend para consumir la cámara sin exponer credenciales en el frontend.
- Se añaden endpoints de control PTZ/zoom y stream.

### Cómo

- Variables env:
  - `CAMERA_BASE_URL`, `CAMERA_USER`, `CAMERA_PASS`
- Rutas backend:
  - `GET /api/camera/ptz/status`
  - `POST /api/camera/zoom`
  - `POST /api/camera/ptz/center`
  - `GET /api/camera/stream.jpg`
- Validaciones:
  - zoom absoluto `1000..8000`
  - zoom relativo limitado en API propia a `-1000..1000`
- Auditoría:
  - acciones PTZ/zoom registradas en `auditoria`

### Por qué

- La cámara requiere autenticación. Si se llama desde frontend, se filtran credenciales.
- El backend actúa como “puente seguro” y centraliza reglas/validación.

## 2026-04-17 — Login público solo para admins (sin registro)

### Qué

- Se elimina el registro y la recuperación de contraseña del modal de login público.
  El login queda solo para admins y usa correo + password.

### Cómo

- Se quita la vista `view-register` de los HTML públicos.
- Se quita la vista/acción de “He olvidado mi contraseña”.
- Se ajusta el JS para no manejar vistas inexistentes.
- En demo, el admin se representa como correo: `admin@gmail.com` (seed).

### Por qué

- En el MVP el login es solo para administración (no hay cuentas de cliente final).
- El reset por email requiere infraestructura (SMTP/API) y se pospone.

## 2026-04-17 — Gestión de usuarios (CRUD) en panel admin

### Qué

- La vista `Usuarios` deja de ser un placeholder y pasa a gestionar usuarios reales.
- Solo el rol `ADMIN` puede ver y usar esta sección.
- Se permite: listar, crear, editar y activar/desactivar usuarios.

### Cómo

- Backend:
  - `GET /api/usuarios` (lista por lavandería activa)
  - `POST /api/usuarios` (crea usuario y lo asocia a la lavandería activa)
  - `PUT /api/usuarios/:id` (edita datos y opcionalmente password)
  - `POST /api/usuarios/:id/activar`
  - `POST /api/usuarios/:id/desactivar` (no permite desactivarte a ti mismo)
- Frontend:
  - `app/frontend/public/admin/usuarios.html` con tabla, buscador y modal (crear/editar)
  - `app/frontend/public/js/admin.js` llama a la API y renderiza; oculta la entrada de menú si no eres `ADMIN`
- Auditoría:
  - Las acciones se registran en la tabla `auditoria` con entidad `usuario`.

### Por qué

- En el sistema habrá varias lavanderías y distintos perfiles (admin/operador).
  Necesitamos control de acceso y gestión de cuentas desde el propio panel.

## 2026-04-17 — Programador IoT (Puerta/Luces/Ventilación) (MVP)

### Qué

- La vista `Programador` permite controlar manualmente puerta/luces/ventilación.
- Se añaden horarios (encender/apagar) por lavandería.
- Se ejecuta un scheduler en backend que aplica los horarios y deja rastro en auditoría.

### Cómo

- Backend:
  - Nuevas rutas en `app/backend/src/web/routes/iot.ts`:
    - `GET /api/iot/state`, `PUT /api/iot/state`
    - `GET /api/iot/schedule`, `PUT /api/iot/schedule`
  - Persistencia en tabla `configuracion` (ámbito `LAVANDERIA`) con claves:
    - `iot_state` (JSON)
    - `iot_schedule` (JSON)
    - `iot_last` (JSON, evita re-ejecuciones repetidas el mismo minuto)
  - Scheduler en `app/backend/src/iot/scheduler.ts` (tick cada 30s) que aplica el horario y audita.
  - Seguridad:
    - lectura (`GET`) requiere sesión
    - escritura (`PUT`) requiere rol `ADMIN`
- Frontend:
  - `app/frontend/public/admin/iot.html` con estado, botones y campos `time`.
  - `app/frontend/public/js/admin.js` consume la API y refresca la UI.

### Por qué

- Se necesita automatizar horarios de apertura/iluminación/ventilación.
- Para el MVP no hay hardware real: se simula guardando estados y auditando acciones.

## 2026-04-17 — Caja (diaria / semanal / acumulada) (MVP)

### Qué

- Se implementa la sección `Caja` con 3 vistas: diaria, semanal y rango (acumulada).
- Se muestra el total y el desglose por máquina.

### Cómo

- Backend:
  - `app/backend/src/web/routes/caja.ts`
  - Endpoints:
    - `GET /api/caja/dia?date=YYYY-MM-DD`
    - `GET /api/caja/semana?date=YYYY-MM-DD` (semana lunes→domingo del día elegido)
    - `GET /api/caja/rango?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Fuente de datos: `movimiento_maquina` (solo `es_bonificacion = 0`) + join con `maquina` para `codigo_visible`.
- Frontend:
  - `app/frontend/public/admin/caja.html` con tabs + filtros + tabla.
  - `app/frontend/public/js/admin.js` consume la API y renderiza.

### Por qué

- Permite al admin ver facturación operativa sin entrar a consultas manuales.
- Encaja con el objetivo de “contabilidad” del panel y prepara la base para “Informes”.

## 2026-04-17 — Informes: Ciclos (lista + filtros + paginación) (MVP)

### Qué

- Se implementa la primera parte de `Informes`: listado real de ciclos.
- Permite filtrar por rango de fechas, máquina y estado, con paginación.

### Cómo

- Backend:
  - `app/backend/src/web/routes/informes.ts`
  - Endpoint: `GET /api/informes/ciclos?from=YYYY-MM-DD&to=YYYY-MM-DD&id_maquina=&estado=&limit=&offset=`
  - Join con `maquina` para mostrar `codigo_visible` y limitar por `id_lavanderia`.
- Frontend:
  - `app/frontend/public/admin/informes.html` con pestañas (Ciclos/Evolución/Estadísticas).
  - `app/frontend/public/js/admin.js` renderiza la tabla, aplica filtros y controla paginación.

### Por qué

- La tabla de ciclos es la base para “Evolución” y “Estadísticas”.
- Evita depender de consultas manuales a BD para el análisis del TFC.

## 2026-04-27 — Cierre de funcionalidades pedidas (Informes + Publicaciones + Redis)

### Qué

- Se completa `Informes` con:
  - `Ciclos` (ya existente)
  - `Evolución` semanal/mensual/anual (comparativa con periodo anterior)
  - `Estadísticas` de tramos diario/mensual/anual (tabla por tramo/máquina + totales)
- Se amplía `Editor Web` para cubrir también textos de `Sobre nosotros` y `FAQs` (además de header/footer/contacto).
- Se integra Redis real en backend como caché operativa en rutas IoT con fallback a BD.

### Cómo

- Backend:
  - `app/backend/src/web/routes/informes.ts`
    - Nuevos endpoints:
      - `GET /api/informes/evolucion/semanal?date=YYYY-MM-DD`
      - `GET /api/informes/evolucion/mensual?month=YYYY-MM`
      - `GET /api/informes/evolucion/anual?year=YYYY`
      - `GET /api/informes/tramos/diario?date=YYYY-MM-DD`
      - `GET /api/informes/tramos/mensual?month=YYYY-MM`
      - `GET /api/informes/tramos/anual?year=YYYY`
  - `app/backend/src/web/routes/configuracion.ts`
    - `web_public_content` ampliado con claves para `about_*` y `faq_q*/faq_a*`.
  - Redis:
    - `app/backend/src/cache/redis.ts` (cliente RESP mínimo sobre `node:net`)
    - `app/backend/src/system/env.ts` (variables `REDIS_*`)
    - `app/backend/src/web/routes/iot.ts` (cache de estado/config IoT + invalidación)
    - `app/backend/src/server.ts` (`/health` reporta `redis`).

- Frontend:
  - `app/frontend/public/admin/informes.html`:
    - vistas reales para Evolución y Estadísticas.
  - `app/frontend/public/js/admin.js`:
    - carga de endpoints nuevos y render de tablas/gráficos simples.
  - `app/frontend/public/admin/editor-web.html`:
    - campos nuevos para About y FAQs.
  - `app/frontend/public/about.html` y `app/frontend/public/faqs.html`:
    - `data-web-key` para contenido editable.

### Por qué

- Alinea implementación real con el bloque `# IMPLEMENTACIONES PEDIDAS POR USUARIO`.
- Reduce edición manual de HTML para contenido público.
- Mejora rendimiento/latencia de lecturas IoT con Redis sin perder robustez (fallback a MariaDB).

## 2026-04-28 — Cierre de regresiones runtime (demo)

### Qué

- Se corrigen y validan regresiones de arranque/parada de máquinas.
- Se estabiliza la validación de deriva de temporizador tras ampliación.
- Se endurece el arranque de stack demo para evitar 502 por dependencia temprana de BD.

### Cómo

- Backend:
  - `requireLavanderia` devuelve `503 DB_UNAVAILABLE` ante caída/transitorio de BD, evitando crash del proceso.
  - `POST /api/maquinas/:id/iniciar` ahora también confirma inicio cuando la máquina está en `PAUSADA` (envía `confirmar_inicio` al simulador).
  - Bridge MQTT: en evento `CICLO_FINALIZADO`, si `payload.motivo = stop_manual`, estado final `STOP`; en fin natural, `PAUSADA`.
- Deploy demo:
  - `docker-compose.yml` con `healthcheck` de MariaDB y `depends_on: condition: service_healthy` para `core-node`.
- Scripts de validación:
  - `timer_drift_check.sh`: no considera deriva el salto positivo de segundos por ampliación.
  - `machine_regression_check.sh`: usa crédito mínimo configurable (`START_MIN_CREDIT`, por defecto `4`) para transición a `EN_MARCHA`.

### Resultado validado

- `soft_load_test.sh`: PASS (`360/360` OK).
- `timer_drift_check.sh`: PASS (drift máximo observado `1s`).
- `machine_regression_check.sh`: PASS (`STOP -> PAUSADA -> EN_MARCHA -> STOP`).

### Por qué

- Garantiza consistencia entre estado de máquina en backend/simulador y comportamiento esperado en panel admin.
- Evita falsos negativos en pruebas de temporizador y transiciones operativas.
- Deja una base defendible para demo y memoria del TFC.

## 2026-05-07 — Errores corregidos (auditoría TODO)

### Qué

- Se corrigen fallos críticos detectados en `02_Desarrollo/TODO.md`:
  - WS `admin-live` sin autenticación/autorización por tienda.
  - Incongruencia de permisos de cámara para `OPERADOR`.
  - Dependencia de IDs mágicos en simulador/cámara.
  - `API_BASE` frágil por hardcode a `:8080`.
  - Timeout Redis demasiado agresivo.

### Cómo

- Backend WS:
  - `app/backend/src/server.ts`
  - `ws://.../ws/admin-live` ahora exige token JWT en query (`t`), valida rol (`ADMIN`/`OPERADOR`) y acceso a `lav` en `usuario_lavanderia`.
  - Cierre de conexión con código/política cuando no cumple permisos.

- Cámara:
  - `app/backend/src/web/routes/camera.ts`
  - Stream ahora acepta `OPERADOR` con acceso a lavandería (ya no solo `ADMIN`).
  - Se elimina mapeo rígido por ID (`idLav===2`), resolviendo cámara por configuración por tienda (`env_settings`: `CAMERA_SLOT`/`CAMERA_ID`) con fallback.

- Frontend admin:
  - `app/frontend/public/js/admin/nucleo-dashboard-maquinas.js`
  - WS `admin-live` envía token y `lav`.
  - `API_BASE` adaptado al origen/puerto real en lugar de asumir siempre `:8080`.
  - Limpieza de referencias residuales de zoom fijo (`1x/2x/4x/8x`).

- Configuración:
  - `app/backend/src/system/env.ts` → `REDIS_TIMEOUT_MS` por defecto de `500` a `1500`.
  - Sincronizado en:
    - `app/backend/.env.example`
    - `deploy/demo/.env`
    - `deploy/demo/.env.example`
  - Simulador demo configurado por defecto a lavandería simulador (seed limpio):
    - `SIM_LAV_IDS=3`
    - `SIM_LAV_ID=3`

### Resultado

- Admin realtime protegido por auth y alcance de tienda.
- Cámara consistente con permisos de UI para `OPERADOR`.
- Menos roturas por IDs variables tras reseed/redeploy.
- Mejor tolerancia a latencia de Redis en demo.
- Conectividad web/simulador más estable por alineación de `lav_id`.

## 2026-05-07 — Separación de programadores IoT (Inicio vs Programador)

### Qué

- Se separa la programación IoT global de tienda (vista `Inicio`) de la programación IoT individual (vista `Programador`).
- Se evita que una vista sobrescriba la configuración de la otra.

### Cómo

- Backend:
  - `app/backend/src/web/routes/iot.ts`
  - Nuevos endpoints:
    - `GET /api/iot/store-schedule`
    - `PUT /api/iot/store-schedule`
  - `iot_schedule` queda reservado para programación individual.
  - `iot_store_schedule` gestiona apertura/cierre global de tienda.

- Scheduler:
  - `app/backend/src/iot/scheduler.ts`
  - Ejecuta de forma independiente:
    - `iot_schedule` (individual: puerta/luces/ventilación)
    - `iot_store_schedule` + `iot_store_actions` + listas de máquinas (global tienda)
  - Mantiene marcadores separados en `iot_last` para no duplicar ejecuciones por minuto.

- Frontend:
  - `app/frontend/public/js/admin/nucleo-dashboard-maquinas.js`
    - `Inicio` guarda/carga horario de tienda con `/api/iot/store-schedule`.
  - `app/frontend/public/js/admin/editor-camara-iot-usuarios.js`
    - `Programador` guarda únicamente `/api/iot/schedule`.
    - Deja de modificar listas de máquinas de apertura/cierre de tienda.

### Resultado

- `Inicio` funciona como escena global configurable de tienda.
- `Programador` conserva automatizaciones IoT individuales.

## 2026-05-07 — Alta de lavanderías (superadmin) + tarifas desde Ajustes

### Qué

- Se añade alta de lavanderías desde panel para superadmin.
- Se añade formulario de tarifas operativas en `Ajustes` (precio ciclo, tiempo ciclo, precio/minutos de ampliación).

### Cómo

- Backend:
  - `POST /api/lavanderias` (solo superadmin) crea tienda y configuración mínima IoT/entorno.
  - `GET /api/configuracion/tarifa-actual` y `PUT /api/configuracion/tarifa-actual`.
  - El guardado de tarifa cierra la vigente e inserta una nueva con vigencia desde `NOW()`.
- Frontend:
  - Botón `+ Lavandería` junto al selector de tienda (solo superadmin).
  - Formulario de tarifa en `admin/ajustes.html` conectado a los endpoints nuevos.

### Resultado

- El dueño puede dar de alta nuevas tiendas sin Adminer.
- Puede ajustar precios y tiempos sin tocar código.
- Se mantiene consistencia histórica: cambios solo para ciclos nuevos.
- Ambas configuraciones coexisten sin pisarse.
