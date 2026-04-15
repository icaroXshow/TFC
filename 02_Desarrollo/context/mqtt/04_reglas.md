# Reglas MQTT

## Reglas de comunicación

1. El backend publica comandos.
2. Los dispositivos publican estados.
3. Los dispositivos publican eventos.
4. Los dispositivos no escriben directamente en la base de datos.
5. El backend valida lo recibido antes de persistirlo.
6. Los topics deben mantenerse estables para no romper frontend, backend y simulación.
7. La simulación debe comportarse igual que un dispositivo real a nivel MQTT.

---

## Reglas de diseño

1. El comando debe representar una intención clara.
2. El estado debe representar la situación actual del dispositivo.
3. El evento debe representar un hecho ocurrido.
4. El payload debe ser pequeño y claro.
5. Los nombres usados en MQTT deben ser coherentes con dominio y backend.

---

## Reglas futuras

Quedan previstas, pero no son obligatorias en el MVP:

- ACL por topic
- retained messages de estado
- Last Will and Testament
- TLS interno
