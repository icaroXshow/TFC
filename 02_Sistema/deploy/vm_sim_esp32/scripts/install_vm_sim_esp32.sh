#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-/opt/kwl/02_Sistema}"

echo "[VM_SIM_ESP32] Actualizando sistema"
sudo apt update
sudo apt upgrade -y

sudo apt install -y python3 python3-venv python3-pip rsync mosquitto-clients

if ! id -u kwl >/dev/null 2>&1; then
  sudo useradd -m -s /bin/bash kwl
fi

sudo mkdir -p /opt/kwl
sudo rsync -av --delete "$SRC_ROOT/sim_esp32/" /opt/kwl/02_Sistema/sim_esp32/
sudo chown -R kwl:kwl /opt/kwl

if [[ ! -f /opt/kwl/02_Sistema/sim_esp32/.env ]]; then
  sudo -u kwl cp /opt/kwl/02_Sistema/sim_esp32/.env.example /opt/kwl/02_Sistema/sim_esp32/.env
fi

sudo cp "$SRC_ROOT/deploy/vm_sim_esp32/systemd/kwl-esp32-sim.service" /etc/systemd/system/kwl-esp32-sim.service
sudo systemctl daemon-reload
sudo systemctl enable --now kwl-esp32-sim.service
sudo systemctl status kwl-esp32-sim.service --no-pager || true

echo "[OK] VM_SIM_ESP32 lista"
