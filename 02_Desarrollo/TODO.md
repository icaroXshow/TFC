# TODO - Auditoría rápida de errores e incongruencias (TFC)

Fecha de revisión: 2026-05-06
Alcance revisado: `02_Desarrollo/FLUJOS_SIMULADOR_APP.md`, `02_Desarrollo/app/*`, `02_Desarrollo/deploy/demo/*` y variables de entorno asociadas.

## 1) Crítico

- [ ] **Exposición de credenciales reales en archivo versionable**
  - Evidencia: `02_Desarrollo/deploy/demo/.env` contiene `CAMERA_USER=api` y `CAMERA_PASS=...` con valor real.
  - Riesgo: fuga de credenciales en repositorio, backups o compartición del proyecto.
  - Acción:
    - Reemplazar de inmediato por placeholders.
    - Rotar credenciales reales de la cámara.
    - Mantener solo `.env.example` con valores ficticios.

## 2) Alto

- [ ] **Incongruencia funcional entre flujos y nota de deploy sobre puerta**
  - Evidencia A: `02_Desarrollo/FLUJOS_SIMULADOR_APP.md` sección 5 pide visualizar estado de puerta en Admin.
  - Evidencia B: `02_Desarrollo/deploy/demo/README.md` indica que en demo "no se usa botón de puerta en app/".
  - Interpretación: puede confundirse "botón de control" con "visualización de estado".
  - Acción:
    - Aclarar explícitamente en docs:
      - `app/` **no controla** puerta.
      - `app/` **sí puede mostrar** estado de puerta si llega por IoT.

- [ ] **Ruta de arranque posiblemente incorrecta en README de deploy (Windows)**
  - Evidencia: `02_Desarrollo/deploy/demo/README.md` sugiere ejecutar `.
Launcher.bat` dentro de `deploy/demo`, pero el archivo listado está en `02_Desarrollo/Launcher.bat`.
  - Riesgo: primer arranque falla por ruta equivocada.
  - Acción:
    - Corregir instrucción de ruta en README, o
    - mover/copiar launcher a `deploy/demo` si ese era el diseño.

## 3) Medio

- [ ] **Variable duplicada/confusa en entorno del simulador**
  - Evidencia: en `deploy/demo/.env` y `.env.example` coexisten `SIM_LAV_IDS` y `SIM_LAV_ID`.
  - Contexto técnico: `docker-compose.yml` usa `SIM_LAV_IDS` para `mqtt-sim` y `SIM_LAV_ID` para `mqtt-sim-gui`.
  - Riesgo: confusión de configuración (plural vs singular) y errores de mantenimiento.
  - Acción:
    - Documentar mejor la diferencia en README, o
    - normalizar nomenclatura (`SIM_LAV_IDS` / `SIM_GUI_LAV_ID`).

- [ ] **Campos SMTP definidos en `.env.example` pero no visibles en `env.ts` (backend)**
  - Evidencia: `deploy/demo/.env.example` incluye `SMTP_*` y `CONTACT_FORM_TO`; `app/backend/src/system/env.ts` no los expone.
  - Riesgo: deuda técnica/documental (parece soportado, pero no está integrado en runtime).
  - Acción:
    - O implementar lectura/uso real en backend,
    - o eliminar esos campos del `.env.example` de demo hasta que exista funcionalidad.

- [ ] **Flujos funcionales aún en modo "borrador" sin estado de validación real**
  - Evidencia: `FLUJOS_SIMULADOR_APP.md` dice "Documento de trabajo" y contiene checklist completo sin marcar.
  - Riesgo: no se distingue qué está implementado vs pendiente.
  - Acción:
    - Añadir columna/etiqueta por caso: `Implementado`, `Validado`, `Pendiente`, `No aplica`.

## 4) Bajo

- [ ] **Erratas de redacción en petición/documentación operativa**
  - Evidencia: pequeños errores tipográficos (ejemplo externo a docs: "lo qque").
  - Riesgo: menor, pero reduce calidad de entrega TFC.
  - Acción:
    - Pasada final de corrección ortográfica en archivos Markdown principales.

## 5) Coherencia confirmada (sin incidencia)

- [x] `docker-compose.yml` monta correctamente `../../context/db/BD_modelo_fisico.sql` (ruta existe).
- [x] `AUTH_TOKEN_SECRET` tiene validación anti-secreto débil en producción (`env.ts`).
- [x] La regla "ampliación solo secadoras" está alineada entre `app/README.md` y `FLUJOS_SIMULADOR_APP.md`.

## Propuesta de siguientes pasos (orden recomendado)

1. Sanitizar secretos (`.env`) y rotar credenciales.
2. Corregir README de deploy (ruta Launcher + aclaración puerta).
3. Unificar/documentar variables del simulador (`SIM_LAV_ID(S)`).
4. Decidir si SMTP entra ya en alcance o se retira de plantilla.
5. Convertir `FLUJOS_SIMULADOR_APP.md` en matriz de validación real (con estado por caso).
