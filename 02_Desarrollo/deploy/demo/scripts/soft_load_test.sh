#!/usr/bin/env sh
set -eu

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
LOGIN="${LOGIN:-admin@gmail.com}"
PASSWORD="${PASSWORD:-admin}"
LAV_ID="${LAV_ID:-3}"
ROUNDS="${ROUNDS:-60}"
PARALLEL="${PARALLEL:-6}"
SLEEP_SEC="${SLEEP_SEC:-0.2}"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

extract_token() {
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

http_code() {
  url="$1"
  auth="$2"
  curl -sS -o /dev/null -w "%{http_code}" \
    -H "authorization: Bearer $auth" \
    -H "x-lavanderia-id: $LAV_ID" \
    "$url" || printf '000'
}

payload="{\"login\":\"$(json_escape "$LOGIN")\",\"password\":\"$(json_escape "$PASSWORD")\"}"
login_resp="$(curl -sS -X POST "$API_BASE/api/auth/login" -H 'content-type: application/json' -d "$payload" || true)"
TOKEN="$(printf '%s' "$login_resp" | extract_token)"

if [ -z "$TOKEN" ]; then
  echo "[soft-load] ERROR: login falló en $API_BASE (usuario $LOGIN)" >&2
  exit 1
fi

ok=0
fail=0
round=1

echo "[soft-load] inicio: rounds=$ROUNDS parallel=$PARALLEL api=$API_BASE lav=$LAV_ID"

while [ "$round" -le "$ROUNDS" ]; do
  i=1
  while [ "$i" -le "$PARALLEL" ]; do
    (
      c1="$(http_code "$API_BASE/api/maquinas" "$TOKEN")"
      c2="$(http_code "$API_BASE/api/iot/approx-state" "$TOKEN")"
      c3="$(http_code "$API_BASE/api/caja/dia?date=$(date +%F)" "$TOKEN")"
      if [ "$c1" = "200" ] && [ "$c2" = "200" ] && [ "$c3" = "200" ]; then
        echo ok
      else
        echo "fail $c1/$c2/$c3"
      fi
    ) &
    i=$((i + 1))
  done

  wait

  batch_result="$(
    i=1
    while [ "$i" -le "$PARALLEL" ]; do
      c1="$(http_code "$API_BASE/api/maquinas" "$TOKEN")"
      c2="$(http_code "$API_BASE/api/iot/approx-state" "$TOKEN")"
      c3="$(http_code "$API_BASE/api/caja/dia?date=$(date +%F)" "$TOKEN")"
      if [ "$c1" = "200" ] && [ "$c2" = "200" ] && [ "$c3" = "200" ]; then
        echo ok
      else
        echo fail
      fi
      i=$((i + 1))
    done
  )"

  batch_ok="$(printf '%s\n' "$batch_result" | grep -c '^ok$' || true)"
  batch_fail="$(printf '%s\n' "$batch_result" | grep -c '^fail$' || true)"

  ok=$((ok + batch_ok))
  fail=$((fail + batch_fail))

  printf '[soft-load] ronda %s/%s -> ok=%s fail=%s\n' "$round" "$ROUNDS" "$batch_ok" "$batch_fail"
  sleep "$SLEEP_SEC"
  round=$((round + 1))
done

total=$((ok + fail))
if [ "$total" -eq 0 ]; then
  echo "[soft-load] ERROR: sin muestras"
  exit 1
fi

fail_pct=$((fail * 100 / total))
printf '[soft-load] resultado final -> total=%s ok=%s fail=%s fail_pct=%s%%\n' "$total" "$ok" "$fail" "$fail_pct"

if [ "$fail" -gt 0 ]; then
  echo "[soft-load] FAIL: hubo errores HTTP durante la carga suave"
  exit 2
fi

echo "[soft-load] PASS"
