#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/worker"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  . .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
else
  . .venv/bin/activate
fi

exec python mqtt_db_bridge.py
