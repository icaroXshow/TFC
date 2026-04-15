# Flujo completo del sistema

## Caso principal: arranque de máquina

1. Usuario pulsa "Iniciar" en el frontend
2. Frontend llama a la API:
   `POST /api/maquinas/{id}/iniciar`

3. Backend:
   - valida usuario
   - valida estado de máquina
   - crea ciclo en BD
   - registra auditoría
   - publica comando MQTT

4. MQTT:
   - envía comando al dispositivo

5. Dispositivo (ESP32 o simulador):
   - recibe comando
   - ejecuta acción
   - publica estado (`EN_MARCHA`)
   - publica evento (`CICLO_INICIADO`)

6. Backend:
   - recibe estado/evento
   - actualiza estado en Redis
   - registra evento en `log_maquina`

7. WebSocket:
   - backend emite actualización

8. Frontend:
   - actualiza panel en tiempo real
