#!/usr/bin/env bash
set -euo pipefail

echo "[VM_CORE] Actualizando sistema"
sudo apt update
sudo apt upgrade -y

echo "[VM_CORE] Instalando stack web"
sudo apt install -y nginx php php-fpm php-mysql php-cli php-curl php-mbstring php-xml php-zip php-redis redis-server rsync mosquitto-clients python3 python3-venv python3-pip

echo "[VM_CORE] Preparando ruta de despliegue"
sudo mkdir -p /var/www/kwl/backend /var/www/kwl/frontend
sudo chown -R www-data:www-data /var/www/kwl
sudo chmod -R 755 /var/www/kwl

echo "[VM_CORE] Configurando firewall"
sudo ufw allow 22/tcp || true
sudo ufw allow from 192.168.1.0/24 to any port 80 || true
sudo ufw allow from 10.8.0.0/24 to any port 80 || true
sudo ufw --force enable

echo "[VM_CORE] Servicios"
sudo systemctl enable --now nginx
sudo systemctl enable --now redis-server
sudo systemctl enable --now php8.3-fpm

echo "[OK] VM_CORE base instalada"
