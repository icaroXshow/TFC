# deploy/demo

Despliegue demo local del TFC replicando 3 nodos lógicos:

- Nodo BD: MariaDB
- Nodo Core: Nginx + Node.js + Redis (+ soporte WebSocket en proxy)
- Nodo MQTT: broker MQTT (Mosquitto)
- Simulador: `mqtt-sim` (lavadora MQTT)

## Arranque

```bash
cd 02_Desarrollo/deploy/demo
docker compose up -d --build
```

## URLs / puertos

- Frontend (Nginx/Core): `http://127.0.0.1:8081/index.html`
- Backend API (Nginx -> Node/Core): `http://127.0.0.1:8080/health`
- Adminer: `http://127.0.0.1:8082`
- MariaDB host: `127.0.0.1:3307`
- Redis host: `127.0.0.1:6379`
- MQTT host: `127.0.0.1:1883`

## Variables de cámara (doble login opcional)

- `CAMERA_USER` / `CAMERA_PASS`: credenciales para control (PTZ/audio/relés) cámara 1.
- `CAMERA_STREAM_USER` / `CAMERA_STREAM_PASS`: credenciales para stream cámara 1 (si se dejan vacías usa las de control).
- `CAMERA2_USER` / `CAMERA2_PASS`: control cámara 2.
- `CAMERA2_STREAM_USER` / `CAMERA2_STREAM_PASS`: stream cámara 2.

## Scripts

- Linux/Fedora: `./auto_deploy_fedora.sh [--reset-db] [--sin-abrir]`
- Windows: `powershell -ExecutionPolicy Bypass -File .\\auto_deploy.ps1 [--reset-db] [--sin-abrir]`

## Nota de arquitectura lógica

En demo local, el nodo lógico **Core** se implementa con 3 contenedores (`core-nginx`, `core-node`, `redis`) dentro de la misma red docker, conservando la separación técnica sin cambiar la arquitectura funcional.

El simulador MQTT se ejecuta como servicio adicional (`mqtt-sim`) y permite demo de ciclo de máquina sin hardware.


## Credenciales demo

- `admin@gmail.com` / `admin` (ADMIN, Ponferrada)
- `operador@gmail.com` / `admin` (OPERADOR, Ponferrada)
- `admin2@gmail.com` / `admin` (ADMIN, Bembibre)


En despliegue real, el simulador irá en una VM separada (como controlador); en demo local se representa con el contenedor `mqtt-sim`.
