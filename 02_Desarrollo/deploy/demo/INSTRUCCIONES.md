# Demo local TFC (3 nodos lógicos)

Arquitectura lógica replicada en local:

- Nodo BD: `mariadb`
- Nodo Core: `core-nginx` + `core-node` + `redis`
- Nodo MQTT: `mqtt` (Mosquitto)
- Simulador MQTT motor: `mqtt-sim` (lavandería ficticia `KWL Simulador`, completa: `L1,L2,L3,S1,S2` + relés puerta/luces)
- Simulador MQTT GUI (docker independiente): `mqtt-sim-gui`
- Cámara no se simula: sigue siendo la cámara real.

## Arranque rápido

```bash
cd 02_Desarrollo/deploy/demo
docker compose up -d --build
```

## Comprobaciones

```bash
docker compose ps
curl http://127.0.0.1:8080/health
```

## Endpoints

- Frontend: `http://127.0.0.1:8081/index.html`
- GUI Simulador (independiente): `http://127.0.0.1:8083`
- Backend: `http://127.0.0.1:8080/health`
- Adminer: `http://127.0.0.1:8082`

## Puertos técnicos

- MariaDB: `3307`
- Redis: `6379`
- MQTT: `1883`

## Scripts

- Linux/Fedora: `./auto_deploy_fedora.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File .\\auto_deploy.ps1`

## Parada

```bash
docker compose down
```

Reset completo de la BD:

```bash
cd deploy/demo
docker compose down -v
docker compose up -d --build
```

Variables útiles del simulador (en `deploy/demo/.env`):

- `SIM_MACHINE_CODES=L1,L2,L3,S1,S2`
- `SIM_LAV_IDS=3`
- `SIM_LAV_ID=3`
- `SIM_CYCLE_SECONDS=2400` (40 min)
- `SIM_START_MIN_CREDIT=4`
- `SIM_GUI_PORT=8090`

Flujo recomendado de pruebas:

- En panel admin, selecciona tienda `KWL Simulador`: controlas solo simulador (sin tocar hardware real).
- En tiendas reales, usa `Ajustes` para poner `CAMERA_BASE_URL`, `CAMERA_USER`, `CAMERA_PASS` y `MQTT_URL` reales.
- La lógica de backend es la misma; cambia solo la configuración por tienda.

```bash
cd /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo
sudo docker compose down -v
sudo /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/auto_deploy_fedora.sh

```
