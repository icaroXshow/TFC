# Reglas API

## Reglas generales

1. Toda acción crítica requiere autenticación.
2. Toda acción crítica debe validar permisos por rol.
3. Toda acción crítica debe registrarse en auditoría.
4. La API no debe exponer detalles internos innecesarios del broker o de Redis.
5. La API debe trabajar con identificadores claros y nombres coherentes con el dominio.
6. La API debe devolver respuestas consistentes.
7. Las operaciones de alta de lavandería deben quedar restringidas a superadmin.

---

## Reglas de ejecución

1. Si una acción implica hardware, la API no ejecuta el hardware directamente; publica el comando correspondiente.
2. Si una acción modifica el estado del negocio, el backend debe actualizar persistencia e índice rápido cuando corresponda.
3. La API debe distinguir entre:
   - histórico persistente
   - estado actual visible
4. La API no debe asumir que el dispositivo ha ejecutado una orden hasta recibir confirmación o evento.
5. Las rutas de cámara con token en query deben validar acceso del usuario a la lavandería solicitada.
6. Los cambios de tarifa deben crear nueva vigencia y no modificar ciclos históricos.

---

## Reglas de tiempo real

1. El frontend obtiene una carga inicial por API.
2. Las actualizaciones posteriores se refrescan por polling HTTP en el panel admin.
3. Redis puede usarse como apoyo para estado operativo rápido, pero el sistema debe funcionar con `REDIS_ENABLED=false`.
4. WebSocket queda como evolución futura, no como requisito funcional del MVP actual.
