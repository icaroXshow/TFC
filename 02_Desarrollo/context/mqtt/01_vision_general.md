# Visión general MQTT

## Objetivo

MQTT es el mecanismo de comunicación entre el backend y los dispositivos físicos o simulados.

---

## Rol dentro del sistema

MQTT conecta:

- backend
- ESP32
- simulador
- dispositivos controlados

El backend publica comandos y consume estados/eventos.

Los dispositivos se suscriben a comandos y publican estados/eventos.

---

## Principios

- comunicación ligera
- baja latencia
- arquitectura basada en eventos
- desacoplamiento entre software y hardware
- escalabilidad futura

---

## Seguridad

- broker accesible solo desde red interna y VPN
- autenticación mediante usuario y contraseña
- no exposición directa a Internet
