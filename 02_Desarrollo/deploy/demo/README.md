# deploy/demo

Despliegue demo local del TFC.

Servicios principales:
- MariaDB
- Core (Nginx + Node + Redis)
- MQTT (Mosquitto)
- Simulador motor (`mqtt-sim`)
- Simulador web (`mqtt-sim-gui`)

## Arranque recomendado (Windows)

```powershell
cd 02_Desarrollo\deploy\demo
.\Launcher.bat
```

Menú actual:
- `1` Instalar WSL + Docker (primera vez)
- `2` Lanzar/reiniciar proyecto
- `3` Estado / logs

## Arranque manual

Windows:

```powershell
cd 02_Desarrollo\deploy\demo
copy .env.example .env
docker compose up -d --build
```

Linux:

```bash
cd 02_Desarrollo/deploy/demo
cp -n .env.example .env
docker compose up -d --build
```

## Endpoints demo

- Frontend: `http://127.0.0.1:8081/index.html`
- Simulador GUI: `http://127.0.0.1:8083`
- Backend health: `http://127.0.0.1:8080/health`
- Adminer: `http://127.0.0.1:8082`

## Puertos

- MariaDB: `3307`
- Redis: `6379`
- MQTT: `1883`

## Notas

- Si no existe `.env`, se puede crear desde `.env.example`.
- Para pruebas seguras usar la tienda `KWL Simulador`.
- En esta demo no se usa botón de puerta en `app/` (eso es solo simulación física).
