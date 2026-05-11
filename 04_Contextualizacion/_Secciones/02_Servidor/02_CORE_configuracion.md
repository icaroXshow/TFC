# VM_CORE — Configuración del Servidor (estado actual)

## 1. Rol

`VM_CORE (192.168.1.51)` ejecuta:

- backend Node.js
- frontend web (Nginx)
- simulador MQTT (perfil `sim`)

En esta versión real, Redis se ejecuta en `VM_DATA`.

---

## 2. Base del sistema

- SO: Ubuntu Server
- Runtime: Docker + Docker Compose
- Despliegue: `~/kwl-deploy/real/vm-core`

---

## 3. Servicios desplegados

`docker compose ps` esperado:

- `kwl_backend` en `8080`
- `kwl_frontend` en `8081`
- `kwl_simulator` en `8090` (cuando se levanta con perfil `sim`)

---

## 4. Configuración de entorno clave

Variables relevantes en `.env`:

- `API_PORT=8080`
- `WEB_PORT=8081`
- `DB_HOST=192.168.1.52`
- `DB_PORT=13306`
- `DB_NAME=kwl_lavanderia`
- `DB_USER=kwl`
- `REDIS_HOST=192.168.1.52`
- `REDIS_PORT=6379`
- `MQTT_URL=mqtt://kwl:<pass>@192.168.1.53:1883`
- `AUTH_TOKEN_SECRET=<secreto_fuerte>`
- `CORS_ORIGIN=http://192.168.1.51:8081,http://localhost:8081`

---

## 5. Arranque y operación

Arranque backend/frontend:

```bash
cd ~/kwl-deploy/real/vm-core
docker compose up -d --build
```

Arranque simulador:

```bash
cd ~/kwl-deploy/real/vm-core
docker compose --profile sim up -d simulator
```

Estado:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs --tail=100 backend frontend simulator
```

---

## 6. Verificación rápida

Health backend:

```bash
curl -sS http://127.0.0.1:8080/health
```

Frontend:

```bash
curl -I http://127.0.0.1:8081
```

Simulador:

```bash
curl -sS http://127.0.0.1:8090/health
```

---

## 7. Notas de despliegue real

- `WEB_PORT=8081` se usa para evitar conflicto con `:80` del host.
- `DB_PORT=13306` se usa para evitar conflicto con `:3306` del host.
- Los contenedores se configuran con `restart: unless-stopped`, por lo que reinician automáticamente tras reboot del host.
