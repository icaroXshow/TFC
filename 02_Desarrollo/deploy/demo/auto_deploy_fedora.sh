#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_ONLY=0
LAUNCH_ONLY=0
INSTALL_AND_RUN=0
RESET_DB=0
SIN_ABRIR=0
RUN_SMOKE=0
MENU_MODE=0
ANY_MODE_FLAG=0

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$SCRIPT_DIR/.run"
LOG_FILE="$RUN_DIR/launcher-fedora.log"

mkdir -p "$RUN_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

info() { echo "[INFO] $*"; }
ok() { echo "[OK] $*"; }
warn() { echo "[AVISO] $*"; }
err() { echo "[ERROR] $*"; }

usage() {
  cat <<'AYUDA'
Uso:
  ./auto_deploy_fedora.sh [opciones]

Modos (como auto_deploy.ps1):
  --install-only      Solo instala/verifica prerequisitos
  --launch-only       Solo arranca la demo
  --install-and-run   Instala/verifica y luego arranca
  --menu              Muestra menú interactivo

Opciones comunes:
  --reset-db   Borra el volumen de MariaDB y recrea datos demo
  --sin-abrir  No abre el navegador al finalizar
  --smoke      Ejecuta validación rápida tras levantar
  -h, --help   Muestra esta ayuda
AYUDA
}

while (($#)); do
  case "$1" in
    --install-only) INSTALL_ONLY=1; ANY_MODE_FLAG=1 ;;
    --launch-only) LAUNCH_ONLY=1; ANY_MODE_FLAG=1 ;;
    --install-and-run) INSTALL_AND_RUN=1; ANY_MODE_FLAG=1 ;;
    --menu) MENU_MODE=1; ANY_MODE_FLAG=1 ;;
    --reset-db) RESET_DB=1 ;;
    --sin-abrir) SIN_ABRIR=1 ;;
    --smoke) RUN_SMOKE=1 ;;
    -h|--help) usage; exit 0 ;;
    *) err "Opción no reconocida: $1"; usage; exit 1 ;;
  esac
  shift
done

if (( INSTALL_ONLY + LAUNCH_ONLY + INSTALL_AND_RUN > 1 )); then
  err "No combines --install-only, --launch-only y --install-and-run a la vez."
  exit 1
fi

if (( ANY_MODE_FLAG == 0 )); then
  MENU_MODE=1
fi

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Falta comando requerido: $cmd"
    return 1
  fi
}

ensure_env_file() {
  if [[ -f "$SCRIPT_DIR/.env" ]]; then
    return
  fi
  if [[ -f "$SCRIPT_DIR/.env.example" ]]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    info "Se creó .env desde .env.example"
    return
  fi
  err "No existe .env ni .env.example en $SCRIPT_DIR"
  return 1
}

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

ensure_docker_ready() {
  require_cmd curl

  if ! command -v docker >/dev/null 2>&1; then
    err "Docker no está instalado."
    info "Instala Docker Engine y Docker Compose plugin en Fedora, por ejemplo:"
    info "sudo dnf -y install dnf-plugins-core"
    info "sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo"
    info "sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
    return 1
  fi

  if systemctl list-unit-files | grep -q '^docker\.service'; then
    if ! systemctl is-active --quiet docker; then
      warn "Docker daemon no está activo. Intentando arrancar con sudo..."
      if command -v sudo >/dev/null 2>&1; then
        sudo systemctl start docker || true
      fi
    fi
  fi

  if ! docker info >/dev/null 2>&1; then
    err "No se puede conectar a Docker daemon."
    info "Si es por permisos, añade tu usuario al grupo docker y vuelve a iniciar sesión:"
    info "sudo usermod -aG docker $USER"
    return 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    err "Docker Compose plugin no disponible (docker compose)."
    return 1
  fi

  ok "Docker y Compose listos."
}

run_install_only() {
  info "Modo instalación/verificación de prerequisitos"
  ensure_docker_ready
  ensure_env_file
  ok "Prerequisitos OK."
}

run_launch() {
  info "Modo arranque demo"
  ensure_docker_ready
  ensure_env_file

  if [[ "$RESET_DB" -eq 1 ]]; then
    info "Reset de BD solicitado (down -v)..."
    docker_compose down -v
  fi

  info "Levantando contenedores..."
  docker_compose up -d --build

  if ! wait_http "http://127.0.0.1:8080/health" 180; then
    err "Backend no responde en /health"
    docker_compose logs --tail=150 core-node core-nginx mariadb || true
    return 1
  fi

  if ! wait_http "http://127.0.0.1:8081/index.html" 120; then
    err "Frontend no responde en /index.html"
    docker_compose logs --tail=150 core-nginx || true
    return 1
  fi

  ok "Demo levantada"
  echo "Frontend: http://127.0.0.1:8081/index.html"
  echo "Backend : http://127.0.0.1:8080/health"
  echo "Adminer : http://127.0.0.1:8082"
  echo "Sim GUI : http://127.0.0.1:8083"
  echo "MQTT    : mqtt://127.0.0.1:1883"
  echo "Redis   : redis://127.0.0.1:6379"

  if [[ "$RUN_SMOKE" -eq 1 ]]; then
    local found=0
    if [[ -x "$SCRIPT_DIR/scripts/soft_load_test.sh" ]]; then
      found=1
      info "Ejecutando soft_load_test..."
      (cd "$SCRIPT_DIR" && ./scripts/soft_load_test.sh)
    fi
    if [[ -x "$SCRIPT_DIR/scripts/timer_drift_check.sh" ]]; then
      found=1
      info "Ejecutando timer_drift_check..."
      (cd "$SCRIPT_DIR" && ./scripts/timer_drift_check.sh)
    fi
    if [[ -x "$SCRIPT_DIR/scripts/machine_regression_check.sh" ]]; then
      found=1
      info "Ejecutando machine_regression_check..."
      (cd "$SCRIPT_DIR" && ./scripts/machine_regression_check.sh)
    fi
    if [[ "$found" -eq 0 ]]; then
      warn "No se encontraron scripts smoke ejecutables"
    fi
  fi

  if [[ "$SIN_ABRIR" -eq 0 ]] && command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://127.0.0.1:8081/index.html" >/dev/null 2>&1 || true
  fi
}

show_status_logs() {
  ensure_docker_ready
  info "Estado de contenedores:"
  docker_compose ps || true
  echo
  info "Últimos logs (core-node/core-nginx/mariadb):"
  docker_compose logs --tail=80 core-node core-nginx mariadb || true
}

menu_loop() {
  while true; do
    echo
    echo "=============================================="
    echo " TFC Lavandería · Launcher Fedora"
    echo "=============================================="
    echo "1) Instalar / verificar prerequisitos"
    echo "2) Lanzar demo"
    echo "3) Estado / logs"
    echo "4) Reset BD + lanzar demo"
    echo "5) Lanzar demo + smoke tests"
    echo "0) Salir"
    echo
    read -r -p "Elige una opción: " opt
    case "${opt:-}" in
      1)
        run_install_only
        ;;
      2)
        RESET_DB=0
        RUN_SMOKE=0
        run_launch
        ;;
      3)
        show_status_logs
        ;;
      4)
        RESET_DB=1
        RUN_SMOKE=0
        run_launch
        ;;
      5)
        RESET_DB=0
        RUN_SMOKE=1
        run_launch
        ;;
      0)
        ok "Saliendo."
        break
        ;;
      *)
        warn "Opción inválida."
        ;;
    esac
  done
}

main() {
  if (( MENU_MODE == 1 )); then
    menu_loop
    ok "Finalizado. Log: $LOG_FILE"
    return
  fi

  if (( INSTALL_ONLY == 1 )); then
    run_install_only
  elif (( LAUNCH_ONLY == 1 )); then
    run_launch
  else
    run_install_only
    run_launch
  fi

  ok "Finalizado. Log: $LOG_FILE"
}

main
