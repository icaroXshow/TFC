# Estados del dominio

## Tipos de estado:

- Estado persistente → MariaDB
- Estado operativo → Redis
- Estado físico → dispositivos (MQTT)

## Estados de máquina

Estados alineados con la base de datos:

- STOP
- EN_MARCHA
- PAUSADA
- FUERA_SERVICIO
- MANTENIMIENTO

---

## Estados de ciclo

Estados alineados con la base de datos:

- INICIADO
- FINALIZADO
- CANCELADO
- INCIDENCIA

---

## Estados de dispositivos auxiliares

Estos estados son conceptuales para backend, simulación y frontend.

### Ventilación
- OFF
- ON

### Luces
- OFF
- ON

### Puerta / persiana
- ABIERTA
- CERRADA
- ABRIENDO
- CERRANDO
- ERROR

---

## Estados operativos para tiempo real

Además del histórico persistente, el sistema puede manejar estado rápido en Redis para:

- estado visible actual de máquina
- conectividad del dispositivo
- último evento relevante
- bandera de actualización para paneles
