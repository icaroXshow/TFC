# Demo local TFC (3 nodos lógicos)

Arquitectura lógica replicada en local:

- Nodo BD: `mariadb`
- Nodo Core: `core-nginx` + `core-node` + `redis`
- Nodo MQTT: `mqtt` (Mosquitto)
- Simulador MQTT: `mqtt-sim` (lavadora)

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
docker compose down -v
docker compose up -d --build
```

```bash
cd /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo
sudo docker compose down -v
sudo /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/auto_deploy_fedora.sh

```
