# Cambios simulador

Cambios realizados sin modificar la lógica MQTT/backend del simulador:

- Rediseñada la interfaz pública del simulador.
- Separado el JavaScript de `index.html` a `public/simulador.js`.
- Añadido panel de alarmas/eventos recientes.
- Añadidas notificaciones flotantes para acciones y errores.
- Añadidas alarmas visuales para:
  - MQTT conectado/desconectado.
  - cambios de estado de máquinas.
  - crédito suficiente para START.
  - máquina a menos de 1 minuto de terminar.
  - puerta/luces de tienda.
  - errores de API.
- Mejorada la maquetación responsive.
- Mejorada la accesibilidad básica con `aria-live`, `role=status` y etiquetas.

No se han cambiado endpoints, tópicos MQTT ni comportamiento del proceso de simulación.
