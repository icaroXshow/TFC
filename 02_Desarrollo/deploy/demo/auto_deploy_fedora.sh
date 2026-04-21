#!/usr/bin/env bash
set -Eeuo pipefail

RESET_DB=0
SIN_ABRIR=0

usage() {
  cat <<'AYUDA'
Uso:
  ./auto_deploy_fedora.sh [opciones]

Opciones:
  --reset-db   Borra el volumen de MariaDB y recrea datos demo
  --sin-abrir  No abre el navegador al finalizar
  -h, --help   Muestra esta ayuda
AYUDA
}

while (($#)); do
  case "$1" in
    --reset-db) RESET_DB=1 ;;
    --sin-abrir) SIN_ABRIR=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "[X] Opción no reconocida: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

docker_compose() {
  (cd "$SCRIPT_DIR" && docker compose "$@")
}

wait_http() {
  local url="$1"
  local timeout="$2"
  local start
  start=$(date +%s)
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    if (( $(date +%s) - start > timeout )); then
      return 1
    fi
    sleep 2
  done
}

if [[ "$RESET_DB" -eq 1 ]]; then
  docker_compose down -v
fi

docker_compose up -d --build

if ! wait_http "http://127.0.0.1:8080/health" 180; then
  echo "[X] Backend no responde en /health" >&2
  docker_compose logs --tail=100 core-node core-nginx mariadb >&2 || true
  exit 1
fi

if ! wait_http "http://127.0.0.1:8081/index.html" 90; then
  echo "[X] Frontend no responde en /index.html" >&2
  docker_compose logs --tail=100 core-nginx >&2 || true
  exit 1
fi

echo "[v] Demo levantada"
echo "Frontend: http://127.0.0.1:8081/index.html"
echo "Backend : http://127.0.0.1:8080/health"
echo "Adminer : http://127.0.0.1:8082"
echo "MQTT    : mqtt://127.0.0.1:1883"
echo "Redis   : redis://127.0.0.1:6379"

if [[ "$SIN_ABRIR" -eq 0 ]] && command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:8081/index.html" >/dev/null 2>&1 || true
fi
