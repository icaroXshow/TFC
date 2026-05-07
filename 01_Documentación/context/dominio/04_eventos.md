# Eventos del dominio

## Eventos técnicos de máquina

Ejemplos alineados con las fuentes y la lógica del sistema:

- CICLO_INICIADO
- CICLO_FINALIZADO
- MONEDA_RECIBIDA
- AMPLIACION_APLICADA
- ERROR_COMUNICACION
- MAQUINA_CONECTADA
- MAQUINA_DESCONECTADA
- ESTADO_ACTUALIZADO

---

## Eventos de dispositivos auxiliares

### Puerta
- PUERTA_ABIERTA
- PUERTA_CERRADA
- PUERTA_ABRIENDO
- PUERTA_CERRANDO
- PUERTA_ERROR

### Luces
- LUCES_ENCENDIDAS
- LUCES_APAGADAS

### Ventilación
- VENTILACION_ENCENDIDA
- VENTILACION_APAGADA

---

## Eventos administrativos

Estos no se guardan en log técnico sino en auditoría:

- LOGIN_USUARIO
- LOGOUT_USUARIO
- ARRANQUE_MANUAL_MAQUINA
- PARADA_MANUAL_MAQUINA
- REINICIO_MANUAL_MAQUINA
- APERTURA_TIENDA
- CIERRE_TIENDA
- CAMBIO_CONFIGURACION
- ALTA_USUARIO
- EDICION_USUARIO

---

## Criterio

- los eventos técnicos van a `log_maquina`
- las acciones administrativas van a `auditoria`
