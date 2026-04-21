# WSL ·  Despliegue en un unico equipo

## REQUISITOS
- Habilitar virtualizacion en la bios
- Instalar WSL2
- Tener instalado docker (Usando WSL2)
- Tener instalado python

# AUTOMATICO
 - Ejecutar: 
 
 ```bash 
cd 02_Desarrollo/deploy/demo
powershell.exe -ExecutionPolicy Bypass -File auto_deploy.ps1
```
## Windows (PowerShell)

- Instala Python/Docker/Node si hace falta
- Levanta DB/Adminer (docker)
- Prepara y inicia Backend (8080, terminal nueva)
- Inicia Frontend (8081)

**URLs**:
- Frontend: http://localhost:8081/index.html (login admin@gmail.com / admin)
- Adminer: http://localhost:8082
- Backend: http://localhost:8080/health

**Parar**:
- DB: cd deploy/demo && docker compose down
- Backend/Frontend: taskkill /IM node.exe /F ; taskkill /IM python.exe /F ; Ctrl+C terminales

# MANUAL
## 1) Lanzar Base de datos (MariaDB en Docker)

```bash
cd deploy/demo
docker compose up -d
docker compose ps
```

Puerto host: `3307` (ya está configurado en `app/backend/.env`).

### Lanzar Adminer (panel web para la BD)

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

## 2) Lanzar Backend (Node)

```bash
cd app/backend
npm ci
npm run build
node --env-file=.env dist/server.js
```

Backend: `http://127.0.0.1:8080/health`

Mejor que se ejecute en segundo plano:

```bash
cd app/backend
setsid node --env-file=.env dist/server.js > /tmp/kwl_backend.out 2>&1 & echo $! > /tmp/kwl_backend.pid
tail -f /tmp/kwl_backend.out
```

Parar Backend:

```bash
kill $(cat /tmp/kwl_backend.pid)
```

## 3) Lanzar Frontend

```bash
cd app/frontend/public
python3 -m http.server 8081 --bind 0.0.0.0
```

Web: `http://127.0.0.1:8081/index.html`

## 4) Login demo

- Email: `admin@gmail.com`
- Password: `admin`

## 5) Actualizar cambios (solo si se edita codico)

Backend (TS → dist):

```bash
cd app/backend
npm run build
kill $(cat /tmp/kwl_backend.pid) 2>/dev/null || true
setsid node --env-file=.env dist/server.js > /tmp/kwl_backend.out 2>&1 & echo $! > /tmp/kwl_backend.pid
```

- Si el Frontend: no compila nada (recarga el navegador F5).
