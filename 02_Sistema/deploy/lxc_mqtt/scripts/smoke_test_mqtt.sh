#!/usr/bin/env bash
set -euo pipefail

BROKER_HOST="${1:-192.168.1.53}"
BROKER_USER="${2:-kwl}"
BROKER_PASS="${3:-change_me}"
TOPIC="kwl/test/smoke"

mosquitto_sub -h "$BROKER_HOST" -u "$BROKER_USER" -P "$BROKER_PASS" -t "$TOPIC" -C 1 &
SUB_PID=$!
sleep 1
mosquitto_pub -h "$BROKER_HOST" -u "$BROKER_USER" -P "$BROKER_PASS" -t "$TOPIC" -m "ok"
wait $SUB_PID

echo "[OK] Smoke test MQTT correcto"
