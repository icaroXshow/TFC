#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-$(pwd)/02_Sistema}"
DB_NAME="kwl_lavanderia"
DB_USER="backend"
DB_PASS="change_me"

echo "[VM_DATA] Aplicando ajuste de servidor"
sudo cp "$SRC_ROOT/deploy/vm_data/mariadb/50-server.cnf.fragment" /etc/mysql/mariadb.conf.d/60-kwl.cnf
sudo systemctl restart mariadb

echo "[VM_DATA] Creando usuario backend si no existe"
sudo mariadb -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';"
sudo mariadb -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;"

echo "[VM_DATA] Cargando esquema"
sudo mariadb < "$SRC_ROOT/bd/BD_modelo_fisico.sql"
sudo mariadb < "$SRC_ROOT/bd/Relleno.sql"
sudo mariadb < "$SRC_ROOT/bd/Vistas.sql"

echo "[OK] Base de datos inicializada"
