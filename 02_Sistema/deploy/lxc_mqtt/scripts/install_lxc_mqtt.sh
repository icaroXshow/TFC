#!/usr/bin/env bash
set -euo pipefail

MQTT_USER="kwl"
MQTT_PASS="change_me"
SRC_ROOT="${1:-$(pwd)/02_Sistema}"

if [[ ! -f "$SRC_ROOT/deploy/lxc_mqtt/mosquitto/kwl.conf" ]]; then
  echo "No encuentro $SRC_ROOT/deploy/lxc_mqtt/mosquitto/kwl.conf"
  exit 1
fi

echo "[LXC_MQTT] Actualizando sistema"
sudo apt update
sudo apt upgrade -y

echo "[LXC_MQTT] Instalando mosquitto"
sudo apt install -y mosquitto mosquitto-clients

echo "[LXC_MQTT] Usuario mqtt"
sudo touch /etc/mosquitto/passwd
if sudo mosquitto_passwd -b /etc/mosquitto/passwd "$MQTT_USER" "$MQTT_PASS"; then
  echo "Usuario MQTT configurado"
fi

echo "[LXC_MQTT] Configuracion"
sudo cp "$SRC_ROOT/deploy/lxc_mqtt/mosquitto/kwl.conf" /etc/mosquitto/conf.d/kwl.conf
sudo chown root:mosquitto /etc/mosquitto/passwd
sudo chmod 640 /etc/mosquitto/passwd

echo "[LXC_MQTT] Firewall"
sudo ufw allow 22/tcp || true
sudo ufw allow from 192.168.1.0/24 to any port 1883 || true
sudo ufw --force enable

echo "[LXC_MQTT] Servicio"
sudo systemctl enable --now mosquitto
sudo systemctl restart mosquitto

ss -tulpn | grep 1883 || true
echo "[OK] LXC_MQTT instalado"
