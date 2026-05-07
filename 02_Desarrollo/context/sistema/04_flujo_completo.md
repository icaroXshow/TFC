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

---

## Flujo IoT general de tienda (Inicio)

1. Usuario configura en `Inicio`:
   - hora apertura/cierre de tienda
   - checkboxes de elementos IoT a afectar (puerta/luces)
   - listas de máquinas a abrir/cerrar
2. Frontend guarda:
   - `store-schedule`
   - `store-actions`
   - `store-open-machines` / `store-close-machines`
3. Scheduler backend:
   - al llegar hora de apertura/cierre ejecuta la escena global de tienda
   - publica comandos MQTT y registra auditoría/log IoT
4. Simulador/dispositivos:
   - ejecutan órdenes
   - reportan estado/eventos
5. Backend:
   - persiste estado resultante
6. Frontend:
   - refleja estado actualizado en `Inicio` y `Programador`

---

## Flujo IoT individual (Programador)

1. Usuario configura horario individual en `Programador` (puerta/luces/ventilación).
2. Frontend guarda `iot_schedule`.
3. Scheduler backend aplica ese horario de forma independiente al de tienda.
4. Si un mismo elemento existe en ambos programadores:
   - ambos conviven
   - se aplica la última acción ejecutada por hora/evento
   - ninguna configuración borra ni reemplaza la otra.
