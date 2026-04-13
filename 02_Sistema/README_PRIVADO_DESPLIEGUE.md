# README PRIVADO - Despliegue completo KWL

Guia personal para dejar todo operativo y enseñarlo al cliente.

## 0. Orden recomendado

1. VM_DATA
2. LXC_MQTT
3. VM_CORE
4. VM_SIM_ESP32
5. Pruebas de demo

## 1. VM_DATA (192.168.1.52)

```bash
cd /opt/kwl/02_Sistema
bash deploy/vm_data/scripts/install_vm_data.sh
bash deploy/vm_data/scripts/init_db.sh /opt/kwl/02_Sistema
```

Comprueba:

```bash
sudo mariadb -e "SHOW DATABASES LIKE 'kwl_lavanderia';"
sudo mariadb -e "SELECT COUNT(*) FROM kwl_lavanderia.maquina;"
```

## 2. LXC_MQTT (192.168.1.53)

Edita credencial en `deploy/lxc_mqtt/scripts/install_lxc_mqtt.sh` (`MQTT_PASS`) y ejecuta:

```bash
cd /opt/kwl/02_Sistema
bash deploy/lxc_mqtt/scripts/install_lxc_mqtt.sh /opt/kwl/02_Sistema
```

Prueba:

```bash
bash deploy/lxc_mqtt/scripts/smoke_test_mqtt.sh 192.168.1.53 kwl TU_PASS_MQTT
```

## 3. VM_CORE (192.168.1.51)

```bash
cd /opt/kwl/02_Sistema
bash deploy/vm_core/scripts/install_vm_core.sh
bash deploy/vm_core/scripts/deploy_vm_core.sh /opt/kwl/02_Sistema
```

Configura entorno:

```bash
sudo cp /var/www/kwl/backend/.env.example /var/www/kwl/backend/.env
sudo nano /var/www/kwl/backend/.env
```

Valores obligatorios:

- `DB_HOST=192.168.1.52`
- `DB_NAME=kwl_lavanderia`
- `DB_USER=backend`
- `DB_PASS=<real>`
- `MQTT_HOST=192.168.1.53`
- `MQTT_USER=kwl`
- `MQTT_PASS=<real>`

Reinicia bridge tras tocar `.env`:

```bash
sudo systemctl restart kwl-mqtt-bridge.service
sudo systemctl status kwl-mqtt-bridge.service --no-pager
```

Pruebas API:

```bash
curl http://192.168.1.51/api/health
curl http://192.168.1.51/api/dashboard
```

Panel:

- landing cliente: `http://192.168.1.51/frontend/`
- login admin: `http://192.168.1.51/frontend/login.html`
- panel admin: `http://192.168.1.51/frontend/admin.html`

## 4. VM_SIM_ESP32 (ej. 192.168.1.54)

Sube `02_Sistema` a `/opt/kwl/02_Sistema`.

```bash
cd /opt/kwl/02_Sistema
bash deploy/vm_sim_esp32/scripts/install_vm_sim_esp32.sh /opt/kwl/02_Sistema
```

Ajusta simulador:

```bash
sudo -u kwl nano /opt/kwl/02_Sistema/sim_esp32/.env
```

Valores clave:

- `MQTT_HOST=192.168.1.53`
- `MQTT_USER=kwl`
- `MQTT_PASS=<real>`
- `SIM_MACHINE_DEVICE=lavadora1`

Reinicia simulador:

```bash
sudo systemctl restart kwl-esp32-sim.service
sudo systemctl status kwl-esp32-sim.service --no-pager
```

## 5. Demo en vivo al cliente

1. Abre landing cliente `http://192.168.1.51/frontend/`.
2. Entra a `http://192.168.1.51/frontend/login.html` con `admin / admin123` (solo acceso admin).
3. Valida que abre `admin.html` y muestra usuario de sesion.
4. Muestra salud (`DB/Redis/MQTT`).
5. Pulsa `Start` en `L1`, espera cambio de estado.
6. Pulsa `Restart` y enseña eventos.
7. Abre/cierra puerta y luz.
8. Enseña lista de eventos recientes actualizando sola.

## 6. Comandos de diagnostico rapidos

En `LXC_MQTT`:

```bash
mosquitto_sub -h 192.168.1.53 -u kwl -P TU_PASS_MQTT -t 'kwl/#' -v
```

En `VM_CORE`:

```bash
sudo journalctl -u kwl-mqtt-bridge.service -f
```

En `VM_SIM_ESP32`:

```bash
sudo journalctl -u kwl-esp32-sim.service -f
```

## 7. Hardware real opcional

Si usas ESP32 real, el firmware esta en:

- `esp32/sketch_sep3a.ino`

Si no hay hardware, el simulador VM cubre la demo completa.
