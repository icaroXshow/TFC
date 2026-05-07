# Decisión técnica: backend en Node.js (no PHP)

## Contexto

En la planificación inicial del TFC se contempló implementar el backend en PHP.

Durante el desarrollo del MVP se decidió implementar el backend con **Node.js + Express**.

## Motivos principales

- **Tiempo real**: el sistema requiere paneles en tiempo real (WebSockets) y una arquitectura basada en eventos. En Node.js la integración WebSocket/HTTP y el modelo asíncrono encajan de forma natural.
- **Integración IoT**: el flujo MQTT (comandos/estados/eventos) se integra de forma directa con Node.js y permite un puente sencillo entre eventos y API.
- **MVP rápido y coherente**: se priorizó levantar un esqueleto funcional (API + auth + BD + endpoints) para demostrar el flujo completo del sistema.
- **Stack homogéneo para servicios**: usar el mismo runtime para API, tiempo real y futuras tareas (workers/eventos) reduce fricción en el MVP.

## Implicaciones en la memoria del TFC

- Actualizar la sección de tecnologías del backend para reflejar **Node.js + Express**.
- Justificar la elección por requisitos de **tiempo real**, **eventos** e **IoT**.
- Mantener como alternativa teórica que el backend podría implementarse en PHP (Laravel/Symfony), pero con un componente adicional para WebSockets/MQTT si se quisiera el mismo nivel de tiempo real.

## Estado actual (MVP)

- Backend: Node.js + Express.
- Persistencia: MariaDB.
- Tiempo real/MQTT/WebSockets: planificados para iteraciones posteriores (se ha priorizado API + BD + flujo de arranque).

