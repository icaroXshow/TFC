# 02_Sistema - Kit completo de despliegue KWL

Este directorio contiene una version demo completa del sistema KWL lista para desplegar en maquinas separadas y presentar a cliente.

## 1. Alcance entregado

Incluye una arquitectura funcional end-to-end:

- API backend en PHP con comandos MQTT reales
- panel web separado por roles (landing publica + login admin + panel admin)
- worker MQTT->BD para sincronizar estados/eventos de IoT
- base de datos MariaDB con modelo, semillas y vistas
- broker MQTT Mosquitto
- firmware ESP32 real
- simulador ESP32 en maquina virtual dedicada

## 2. Maquinas objetivo

- `VM_CORE (192.168.1.51)`: Nginx + PHP + Redis + backend + frontend + bridge MQTT/DB
- `VM_DATA (192.168.1.52)`: MariaDB
- `LXC_MQTT (192.168.1.53)`: Mosquitto
- `VM_SIM_ESP32 (ej. 192.168.1.54)`: simulador de dispositivo ESP32

## 3. Estructura principal

- `bd/`: SQL fisico + relleno + vistas + consultas
- `kwl/backend/`: API y worker de sincronizacion MQTT
- `kwl/frontend/`: panel para demo cliente
- `esp32/`: firmware para hardware real
- `sim_esp32/`: simulador de nodo IoT por software
- `deploy/`: scripts por nodo + servicios systemd

## 4. Flujo de demo

1. Panel envia accion a API (`VM_CORE`).
2. API publica comando MQTT en `LXC_MQTT`.
3. ESP32 real o `VM_SIM_ESP32` ejecuta comando.
4. Nodo publica `estado/evento/disponibilidad`.
5. Worker MQTT->BD en `VM_CORE` actualiza MariaDB.
6. Panel refresca y muestra estado y eventos al cliente.

## 5. Scripts de despliegue

### VM_DATA

- `deploy/vm_data/scripts/install_vm_data.sh`
- `deploy/vm_data/scripts/init_db.sh`

### LXC_MQTT

- `deploy/lxc_mqtt/scripts/install_lxc_mqtt.sh`
- `deploy/lxc_mqtt/scripts/smoke_test_mqtt.sh`

### VM_CORE

- `deploy/vm_core/scripts/install_vm_core.sh`
- `deploy/vm_core/scripts/deploy_vm_core.sh`
- `deploy/vm_core/systemd/kwl-mqtt-bridge.service`

### VM_SIM_ESP32

- `deploy/vm_sim_esp32/scripts/install_vm_sim_esp32.sh`
- `deploy/vm_sim_esp32/systemd/kwl-esp32-sim.service`

## 6. Endpoints de demo

- `POST /api/auth/login` (solo acepta rol `ADMIN`)
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`
- `GET /api/machines`
- `GET /api/dashboard`
- `GET /api/events/recent?limit=30`
- `POST /api/machines/{id}/command`
- `POST /api/system/door/command`
- `POST /api/system/light/command`

## 7. Presentacion cliente

URL de panel:

- landing cliente: `http://192.168.1.51/frontend/`
- login admin: `http://192.168.1.51/frontend/login.html`
- panel admin: `http://192.168.1.51/frontend/admin.html`

Checklist minimo para demo:

- salud `DB/Redis/MQTT` en OK
- lista de maquinas visible
- comandos Start/Stop/Restart funcionando
- puerta/luz responden en panel
- eventos recientes se actualizan
