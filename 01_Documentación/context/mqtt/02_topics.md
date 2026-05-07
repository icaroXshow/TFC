# Topics MQTT

## Convención general

Se usa una estructura jerárquica por ámbito funcional.

Formato base:

kwl/{categoria}/{dispositivo}/...

---

## Topics de máquinas

### Comando
kwl/maquinas/{codigo_visible}/comando

### Estado
kwl/maquinas/{codigo_visible}/estado

### Evento
kwl/maquinas/{codigo_visible}/evento

---

## Topics de puerta

### Comando
kwl/puerta/principal/comando

### Estado
kwl/puerta/principal/estado

### Evento
kwl/puerta/principal/evento

---

## Topics de luces

### Comando
kwl/luces/principales/comando

### Estado
kwl/luces/principales/estado

### Evento
kwl/luces/principales/evento

---

## Topics de ventilación

### Comando
kwl/ventilacion/general/comando

### Estado
kwl/ventilacion/general/estado

### Evento
kwl/ventilacion/general/evento

---

## Topic de disponibilidad opcional

kwl/{categoria}/{dispositivo}/availability

Puede usarse en el futuro para detectar conexión y desconexión de dispositivos.
