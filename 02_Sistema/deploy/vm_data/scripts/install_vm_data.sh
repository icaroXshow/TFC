#!/usr/bin/env bash
set -euo pipefail

echo "[VM_DATA] Actualizando sistema"
sudo apt update
sudo apt upgrade -y

echo "[VM_DATA] Instalando MariaDB"
sudo apt install -y mariadb-server mariadb-client

if [[ -f /etc/mysql/mariadb.conf.d/50-server.cnf ]]; then
  echo "[VM_DATA] Backup configuracion actual"
  sudo cp /etc/mysql/mariadb.conf.d/50-server.cnf /etc/mysql/mariadb.conf.d/50-server.cnf.bak.$(date +%Y%m%d%H%M%S)
fi

echo "[VM_DATA] Seguridad de red"
sudo ufw allow 22/tcp || true
sudo ufw allow from 192.168.1.51 to any port 3306 || true
sudo ufw allow from 192.168.1.0/24 to any port 3306 || true
sudo ufw --force enable

echo "[VM_DATA] Servicio"
sudo systemctl enable --now mariadb

echo "[OK] VM_DATA base instalada"
