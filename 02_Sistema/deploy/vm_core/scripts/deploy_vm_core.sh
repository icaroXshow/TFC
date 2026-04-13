#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-$(pwd)/02_Sistema}"

if [[ ! -d "$SRC_ROOT/kwl/backend" ]]; then
  echo "No encuentro backend en $SRC_ROOT/kwl/backend"
  exit 1
fi

echo "[VM_CORE] Copiando backend y frontend"
sudo rsync -av --delete "$SRC_ROOT/kwl/backend/" /var/www/kwl/backend/
sudo rsync -av --delete "$SRC_ROOT/kwl/frontend/" /var/www/kwl/frontend/

if [[ ! -f /var/www/kwl/backend/.env ]]; then
  echo "[VM_CORE] Creando .env inicial desde plantilla"
  sudo cp /var/www/kwl/backend/.env.example /var/www/kwl/backend/.env
fi

echo "[VM_CORE] Instalando nginx site"
sudo cp "$SRC_ROOT/deploy/vm_core/nginx/kwl.conf" /etc/nginx/sites-available/kwl.conf
sudo ln -sf /etc/nginx/sites-available/kwl.conf /etc/nginx/sites-enabled/kwl.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "[VM_CORE] Configurando servicio bridge MQTT -> DB"
sudo chown -R www-data:www-data /var/www/kwl
sudo cp "$SRC_ROOT/deploy/vm_core/systemd/kwl-mqtt-bridge.service" /etc/systemd/system/kwl-mqtt-bridge.service
sudo systemctl daemon-reload
sudo systemctl enable --now kwl-mqtt-bridge.service

sudo systemctl restart kwl-mqtt-bridge.service

echo "[OK] Despliegue VM_CORE completado"
