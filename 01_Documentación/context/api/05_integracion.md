# Integración API

## Flujo estándar

API → BD (persistencia) + MQTT (comandos/eventos) + Redis (cache operativa)

---

## Ejemplo: iniciar máquina

API:
- valida usuario
- valida estado

BD:
- crea ciclo

MQTT:
- envía comando

Redis:
- cachea estado/configuración de consulta frecuente
- fallback a BD si Redis no responde

---

## Regla clave

La API no espera a que el dispositivo confirme.

El estado real llega después vía MQTT y se refleja en consultas de API.

---

## Estado operativo validado (2026-04-28)

- Flujo de máquina validado en demo:
  - `STOP -> iniciar -> PAUSADA`
  - `PAUSADA + crédito mínimo -> iniciar -> EN_MARCHA`
  - `detener -> STOP`
- Deriva de temporizador validada con máximo `1s` incluyendo evento de ampliación de tiempo.
