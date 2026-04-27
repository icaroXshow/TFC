#!/usr/bin/env sh
set -eu

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
LOGIN="${LOGIN:-admin@gmail.com}"
PASSWORD="${PASSWORD:-admin}"
LAV_ID="${LAV_ID:-3}"
SAMPLES="${SAMPLES:-20}"
SLEEP_SEC="${SLEEP_SEC:-1}"
MAX_DRIFT="${MAX_DRIFT:-1}"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

extract_token() {
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

payload="{\"login\":\"$(json_escape "$LOGIN")\",\"password\":\"$(json_escape "$PASSWORD")\"}"
login_resp="$(curl -sS -X POST "$API_BASE/api/auth/login" -H 'content-type: application/json' -d "$payload" || true)"
TOKEN="$(printf '%s' "$login_resp" | extract_token)"

if [ -z "$TOKEN" ]; then
  echo "[timer-drift] ERROR: login falló" >&2
  exit 1
fi

fetch_maquinas() {
  curl -sS "$API_BASE/api/maquinas" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-lavanderia-id: $LAV_ID"
}

extract_running_id() {
  perl -0777 -ne 'if (/"id_maquina":\s*([0-9]+).*?"estado_actual":"EN_MARCHA"/s) { print "$1\n"; }'
}

extract_sec_for_id() {
  id="$1"
  perl -0777 -ne "if (/\"id_maquina\":\\s*$id.*?\"segundos_restantes_estimados\":\\s*([0-9]+)/s) { print \"\$1\\n\"; }"
}

body='{"importe":1}'

# Intento de preparar una máquina en marcha (best effort).
first_id="$(fetch_maquinas | sed -n 's/.*"id_maquina":\([0-9][0-9]*\).*/\1/p' | head -n 1)"
if [ -n "$first_id" ]; then
  curl -sS -o /dev/null -X POST "$API_BASE/api/maquinas/$first_id/credito" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-lavanderia-id: $LAV_ID" \
    -H 'content-type: application/json' \
    -d "$body" || true
  curl -sS -o /dev/null -X POST "$API_BASE/api/maquinas/$first_id/iniciar" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-lavanderia-id: $LAV_ID" \
    -H 'content-type: application/json' \
    -d '{}' || true
fi

sleep 1
running_id="$(fetch_maquinas | extract_running_id | head -n1)"
if [ -z "$running_id" ]; then
  # espera hasta 30s para transición asíncrona simulador->backend
  t=0
  while [ "$t" -lt 30 ]; do
    running_id="$(fetch_maquinas | extract_running_id | head -n1)"
    [ -n "$running_id" ] && break
    sleep 1
    t=$((t + 1))
  done
  if [ -z "$running_id" ]; then
    echo "[timer-drift] ERROR: no hay máquina EN_MARCHA para medir (tras esperar 30s)"
    exit 2
  fi
fi

prev_sec=""
max_observed=0
i=1

echo "[timer-drift] midiendo id_maquina=$running_id samples=$SAMPLES max_drift=${MAX_DRIFT}s"

while [ "$i" -le "$SAMPLES" ]; do
  resp="$(fetch_maquinas)"
  sec="$(printf '%s' "$resp" | extract_sec_for_id "$running_id")"
  if [ -z "$sec" ]; then
    echo "[timer-drift] ERROR: no se pudo leer segundos_restantes_estimados"
    exit 3
  fi

  if [ -n "$prev_sec" ]; then
    delta=$((prev_sec - sec))
    drift=$((delta - 1))
    if [ "$drift" -lt 0 ]; then drift=$(( -drift )); fi
    if [ "$drift" -gt "$max_observed" ]; then max_observed="$drift"; fi
    printf '[timer-drift] muestra=%s sec=%s delta=%s drift=%s\n' "$i" "$sec" "$delta" "$drift"
  else
    printf '[timer-drift] muestra=%s sec=%s\n' "$i" "$sec"
  fi

  prev_sec="$sec"

  if [ "$i" -eq $((SAMPLES / 2)) ]; then
    curl -sS -o /dev/null -X POST "$API_BASE/api/maquinas/$running_id/ampliar" \
      -H "authorization: Bearer $TOKEN" \
      -H "x-lavanderia-id: $LAV_ID" \
      -H 'content-type: application/json' \
      -d '{"importe":1}' || true
    echo "[timer-drift] ampliación lanzada (muestra media)"
  fi

  sleep "$SLEEP_SEC"
  i=$((i + 1))
done

echo "[timer-drift] drift máximo observado=${max_observed}s"
if [ "$max_observed" -le "$MAX_DRIFT" ]; then
  echo "[timer-drift] PASS"
  exit 0
fi

echo "[timer-drift] FAIL: drift > ${MAX_DRIFT}s"
exit 4
