# WSL · Cómo seguir testeando (demo)

## 1) Base de datos (MariaDB en Docker)

```bash
cd deploy/demo
docker compose up -d
docker compose ps
```

Puerto host: `3307` (ya está configurado en `app/backend/.env`).

### Adminer (panel web para la BD)

Arranca con el mismo compose:

```bash
cd deploy/demo
docker compose up -d
```

Entra en: `http://127.0.0.1:8082`

Datos:

- Sistema: `MariaDB`
- Servidor: `mariadb`
- Usuario: `root`
- Contraseña: `demo`
- Base de datos: `kwl_lavanderia`

## 2) Backend (Node)

```bash
cd app/backend
npm ci
npm run build
node --env-file=.env dist/server.js
```

Backend: `http://127.0.0.1:8080/health`

Si lo quieres en segundo plano:

```bash
cd app/backend
setsid node --env-file=.env dist/server.js > /tmp/kwl_backend.out 2>&1 & echo $! > /tmp/kwl_backend.pid
tail -f /tmp/kwl_backend.out
```

Parar:

```bash
kill $(cat /tmp/kwl_backend.pid)
```

## 3) Frontend (estático)

```bash
cd app/frontend/public
python3 -m http.server 8081 --bind 0.0.0.0
```

Web: `http://127.0.0.1:8081/index.html`

## 4) Login demo

- Email: `admin@gmail.com`
- Password: `admin`

## 5) Actualizar cambios (cuando edites código)

Backend (TS → dist):

```bash
cd app/backend
npm run build
kill $(cat /tmp/kwl_backend.pid) 2>/dev/null || true
setsid node --env-file=.env dist/server.js > /tmp/kwl_backend.out 2>&1 & echo $! > /tmp/kwl_backend.pid
```

Frontend: no compila nada (recarga el navegador).
