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
./auto_deploy_fedora.sh
```

Opciones útiles:

```bash
./auto_deploy_fedora.sh --reset-db
./auto_deploy_fedora.sh --smoke
./auto_deploy_fedora.sh --reset-db --smoke --sin-abrir
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

- Linux/Fedora: `./auto_deploy_fedora.sh [--reset-db] [--smoke] [--sin-abrir]`
- Windows: `powershell -ExecutionPolicy Bypass -File .\\auto_deploy.ps1 [--reset-db] [--smoke] [--sin-abrir]`

Notas:
- Si no existe `.env`, el instalador lo crea automáticamente desde `.env.example`.
- El flag `--smoke` ejecuta `scripts/soft_load_test.sh` al terminar el despliegue.

## Parada

```bash
docker compose down
```

Reset completo de la BD:

```bash
cd deploy/demo
sudo docker compose down -v
sudo docker compose up -d --build
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

## Smoke test manual (web + simulador MQTT)

Objetivo: validar que el flujo base funciona y detectar desincronización web/simulador.

Precondiciones:
- `docker compose up -d --build` levantado.
- `health` OK: `curl http://127.0.0.1:8080/health`.
- Login en `http://127.0.0.1:8081/index.html` con `admin@gmail.com / admin`.
- En admin, seleccionar tienda `KWL Simulador`.

Pasos y resultado esperado:

1. Estado inicial
- Ir a `Máquinas`.
- Esperado: máquinas `L1,L2,L3,S1,S2` visibles; en reposo (STOP o equivalente).

2. Encendido de ciclo
- Pulsar `Encender` en una máquina (por ejemplo `L1`).
- Esperado: pasa a `PAUSADA` o `EN_MARCHA` según reglas actuales; aparece temporizador.

3. Crédito y arranque
- Si queda en `PAUSADA`, aplicar crédito y confirmar arranque.
- Esperado: `EN_MARCHA`, temporizador descendiendo.

4. Ampliación
- Aplicar `Ampliar` una vez durante `EN_MARCHA`.
- Esperado: aumenta tiempo restante y queda auditado en logs.

5. Parada manual
- Pulsar `Apagar`.
- Esperado: estado `STOP`, temporizador detenido.

6. Programador (puerta/luces/ventilación)
- Ir a `Programador`, alternar puerta y luces, guardar horario.
- Esperado: estado visible actualizado y acciones registradas en `Logs`.

7. Caja e informes básicos
- Ir a `Caja` (día actual) y `Informes` (ciclos).
- Esperado: respuesta sin error y datos coherentes con acciones anteriores.

8. Editor Web (publicaciones)
- Ir a `Editor Web`, cambiar `teléfono` o `dirección`, guardar.
- Abrir web pública (`contact.html`/`index.html`) y recargar.
- Esperado: texto actualizado sin tocar código.

Comandos de apoyo (opcional):

```bash
# Estado servicios
docker compose ps

# Logs backend (acciones, errores API)
docker compose logs -f core-node

# Logs simulador MQTT
docker compose logs -f mqtt-sim mqtt-sim-gui
```

Criterio mínimo de aprobación:
- No hay errores 5xx durante los pasos.
- Estados de máquinas cambian acorde a la acción ejecutada.
- El contenido público guardado desde `Editor Web` se refleja en la web pública.

## Scripts automáticos de validación (TODO)

Desde `02_Desarrollo/deploy/demo`:

```bash
# 1) Carga suave API (sin cámara real)
./scripts/soft_load_test.sh

# 2) Deriva de temporizador + ampliación (objetivo <= 1s)
./scripts/timer_drift_check.sh

# 3) Regresión rápida de flujo de máquina
./scripts/machine_regression_check.sh
```

Variables opcionales:
- `API_BASE` (default `http://127.0.0.1:8080`)
- `LOGIN` / `PASSWORD` (default `admin@gmail.com` / `admin`)
- `LAV_ID` (default `3`, tienda simulador)

```bash
cd /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo
sudo docker compose down -v
sudo /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/auto_deploy_fedora.sh

```
