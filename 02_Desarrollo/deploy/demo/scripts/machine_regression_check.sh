#!/usr/bin/env sh
set -eu

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
LOGIN="${LOGIN:-admin@gmail.com}"
PASSWORD="${PASSWORD:-admin}"
LAV_ID="${LAV_ID:-3}"
START_MIN_CREDIT="${START_MIN_CREDIT:-4}"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}
extract_token() {
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

payload="{\"login\":\"$(json_escape "$LOGIN")\",\"password\":\"$(json_escape "$PASSWORD")\"}"
login_resp="$(curl -sS -X POST "$API_BASE/api/auth/login" -H 'content-type: application/json' -d "$payload" || true)"
TOKEN="$(printf '%s' "$login_resp" | extract_token)"
[ -n "$TOKEN" ] || { echo "[regression] ERROR login"; exit 1; }

api_get_maquinas() {
  curl -sS "$API_BASE/api/maquinas" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-lavanderia-id: $LAV_ID"
}

machine_id="$(api_get_maquinas | sed -n 's/.*"id_maquina":\([0-9][0-9]*\).*/\1/p' | head -n1)"
[ -n "$machine_id" ] || { echo "[regression] ERROR sin máquinas"; exit 2; }

machine_state() {
  api_get_maquinas | perl -0777 -ne "if (/\"id_maquina\":\\s*$machine_id.*?\"estado_actual\":\"([^\"]+)\"/s) { print \"\$1\\n\"; }"
}

post_json() {
  path="$1"
  body="$2"
  code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API_BASE$path" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-lavanderia-id: $LAV_ID" \
    -H 'content-type: application/json' \
    -d "$body" || printf '000')"
  printf '%s' "$code"
}

put_json() {
  path="$1"
  body="$2"
  code="$(curl -sS -o /dev/null -w "%{http_code}" -X PUT "$API_BASE$path" \
    -H "authorization: Bearer $TOKEN" \
    -H "x-lavanderia-id: $LAV_ID" \
    -H 'content-type: application/json' \
    -d "$body" || printf '000')"
  printf '%s' "$code"
}

# Llevar a STOP conocido (con espera)
post_json "/api/maquinas/$machine_id/detener" '{}' >/dev/null || true
t=0
while [ "$t" -lt 15 ]; do
  s0="$(machine_state)"
  [ "$s0" = "STOP" ] && break
  sleep 1
  t=$((t + 1))
done
echo "[regression] estado inicial=$s0"

# STOP -> iniciar (esperado PAUSADA)
post_json "/api/maquinas/$machine_id/iniciar" '{}' >/dev/null || true
sleep 1
s1="$(machine_state)"

# crédito + iniciar (esperado EN_MARCHA, con espera por sincronía simulador)
post_json "/api/maquinas/$machine_id/credito" "{\"importe\":$START_MIN_CREDIT}" >/dev/null || true
post_json "/api/maquinas/$machine_id/iniciar" '{}' >/dev/null || true
t=0
while [ "$t" -lt 20 ]; do
  s2="$(machine_state)"
  [ "$s2" = "EN_MARCHA" ] && break
  sleep 1
  t=$((t + 1))
done

# apagar manual -> STOP (con espera)
post_json "/api/maquinas/$machine_id/detener" '{}' >/dev/null || true
t=0
while [ "$t" -lt 15 ]; do
  s3="$(machine_state)"
  [ "$s3" = "STOP" ] && break
  sleep 1
  t=$((t + 1))
done

printf '[regression] transición STOP->iniciar=%s, tras crédito+iniciar=%s, detener=%s\n' "$s1" "$s2" "$s3"

ok=0
[ "$s1" = "PAUSADA" ] && ok=$((ok+1)) || true
[ "$s2" = "EN_MARCHA" ] && ok=$((ok+1)) || true
[ "$s3" = "STOP" ] && ok=$((ok+1)) || true

if [ "$ok" -lt 3 ]; then
  echo "[regression] FAIL"
  exit 3
fi

echo "[regression] PASS"
