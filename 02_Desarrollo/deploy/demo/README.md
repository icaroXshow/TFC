# deploy/demo

Despliegue demo local del TFC replicando 3 nodos lógicos:

- Nodo BD: MariaDB
- Nodo Core: Nginx + Node.js + Redis incluido para la demo
- Nodo MQTT: broker MQTT (Mosquitto)
- Simulador motor: `mqtt-sim` (lavandería ficticia `KWL Simulador`: `L1,L2,L3,S1,S2` + relés por MQTT)
- Simulador GUI independiente: `mqtt-sim-gui`

## Arranque

```bash
cd 02_Desarrollo/deploy/demo
./auto_deploy_fedora.sh
```

Opciones:

```bash
./auto_deploy_fedora.sh --reset-db
./auto_deploy_fedora.sh --smoke
./auto_deploy_fedora.sh --reset-db --smoke --sin-abrir
```

## URLs / puertos

- Frontend (Nginx/Core): `http://127.0.0.1:8081/index.html`
- Simulador GUI (docker): `http://127.0.0.1:8083`
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

## Redis opcional

- El backend funciona con `REDIS_ENABLED=false` (fallback a BD para configuración/estado IoT).
- En demo, Redis viene habilitado por defecto para mejorar latencia de lecturas repetidas.
- Si se deshabilita Redis:
  - `health` mostrará Redis como desactivado/no operativo.
  - La funcionalidad principal debe seguir operativa (con más lecturas directas a BD).

## Scripts

- Linux/Fedora: `./auto_deploy_fedora.sh [--reset-db] [--smoke] [--sin-abrir]`
- Windows: `powershell -ExecutionPolicy Bypass -File .\\auto_deploy.ps1 [--reset-db] [--smoke] [--sin-abrir]`

Los instaladores validan dependencias mínimas, crean `.env` desde `.env.example` si falta, levantan la demo y validan disponibilidad básica (`/health` + `index.html`).

Con `--smoke` ejecutan además validación completa:

- `scripts/soft_load_test.sh`
- `scripts/timer_drift_check.sh`
- `scripts/machine_regression_check.sh`

## Nota de arquitectura lógica

En demo local, el nodo lógico **Core** se implementa con 3 contenedores (`core-nginx`, `core-node`, `redis`) dentro de la misma red docker, conservando la separación técnica sin cambiar la arquitectura funcional.

El simulador MQTT se ejecuta como dos servicios:
- `mqtt-sim`: motor de simulación (headless)
- `mqtt-sim-gui`: interfaz web independiente para interactuar como hardware real

Uso recomendado:
- Tienda `KWL Simulador` => pruebas seguras (MQTT simulado, sin hardware real).
- Tiendas reales => configurar desde botón `Ajustes` (`CAMERA_BASE_URL`, `CAMERA_USER`, `CAMERA_PASS`, `MQTT_URL`).


## Datos demo ampliados

El seed incluye dataset masivo de ciclos/movimientos del simulador (~180 días) para probar:

- Caja diaria/semanal/acumulada con datos reales en diferentes rangos.
- Informes de ciclos, evolución y estadísticas por tramos.

## Credenciales demo

- `admin@gmail.com` / `admin` (ADMIN, Ponferrada)
- `operador@gmail.com` / `admin` (OPERADOR, Ponferrada)
- `operador2@gmail.com` / `admin` (OPERADOR, Bembibre)


En despliegue real, el simulador irá en una VM separada (como controlador); en demo local se representa con el contenedor `mqtt-sim`.
