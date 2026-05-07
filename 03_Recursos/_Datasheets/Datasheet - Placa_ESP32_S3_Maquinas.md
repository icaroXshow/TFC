
# DATASHEET – ESP32-S3 Industrial 8-DI / 8-DO Controller

## 1. Identificación
- **Modelo:** ESP32-S3-POE-ETH-8DI-8DO
- **Fabricante:** Waveshare
- **Categoría:** Controlador IoT industrial / PLC ligero
- **Ubicación física:** Cuadro eléctrico / interior de máquinas
- **Nivel de criticidad:** Crítico

---

## 2. Descripción y Función en el Sistema

El módulo **ESP32-S3 Industrial IO Controller** es un controlador industrial basado en el microcontrolador **ESP32-S3**, diseñado para aplicaciones IoT y automatización.

Integra conectividad inalámbrica y cableada junto con múltiples interfaces industriales y entradas/salidas digitales aisladas.

Dentro del sistema **LAVANDERÍA KWL**, este dispositivo actúa como nodo ejecutor físico encargado de:

- recibir comandos del servidor central
- activar salidas digitales para control de máquinas
- leer señales de sensores o dispositivos externos
- enviar estados al servidor

Arquitectura básica:

Servidor → MQTT / Red → ESP32 → Ejecución física

---

## 3. Especificaciones Técnicas

### Microcontrolador
- Chip: ESP32-S3-WROOM-1U-N16R8
- CPU: Xtensa LX7 dual-core
- Frecuencia: hasta 240 MHz
- Flash: 16 MB
- PSRAM: 8 MB

### Conectividad inalámbrica
- WiFi 2.4 GHz (802.11 b/g/n)
- Bluetooth 5 LE

### Ethernet
- 10/100 Mbps
- Chip W5500
- Compatible PoE IEEE 802.3af

### Interfaces industriales

#### RS485
- Interfaz aislada
- Protección TVS
- Control automático de dirección
- Terminación 120Ω habilitable

#### CAN
- Interfaz CAN aislada
- Protección TVS
- Terminación 120Ω habilitable

---

## 4. Entradas digitales

- Cantidad: 8 canales
- Voltaje: 5V – 36V
- Tipo:
  - Passive input (dry contact)
  - Active input (NPN / PNP)
- Aislamiento: optoacoplador bidireccional

Aplicaciones:
- botones
- interruptores
- sensores industriales

---

## 5. Salidas digitales

- Cantidad: 8 canales
- Tipo: salida open-drain (Darlington)
- Corriente máxima: 500 mA por canal
- Voltaje de carga: 5V – 40V

Capaz de controlar:
- relés externos
- electroválvulas
- actuadores
- indicadores

---

## 6. Alimentación

- Entrada bornera: 7V – 36V DC
- USB-C: 5V
- PoE: IEEE 802.3af

---

## 7. Interfaces adicionales

- USB-C (programación y alimentación)
- Slot microSD (TF card)
- RTC con batería
- Buzzer
- RGB LED programable
- Conector SMA para antena
- Pin header de expansión

---

## 8. Indicadores LED

- PWR – alimentación
- TXD – transmisión RS485/CAN
- RXD – recepción RS485/CAN
- RGB – estado configurable

---

## 9. Protección eléctrica

- aislamiento por optoacopladores
- aislamiento de potencia
- protección TVS contra picos
- aislamiento digital
- regulador de voltaje industrial

---

## 10. Características físicas

- Montaje: carril DIN
- Dimensiones: 175 × 90 × 40 mm
- Caja industrial protectora

---

## 11. Implementación en LAVANDERÍA KWL

En el sistema se utilizan **5 unidades**.

Funciones:

### Salidas
- generación de pulsos de crédito
- control de funciones de máquina

### Entradas
- lectura de estados
- sensores o señales externas

### Comunicación

Protocolo:

MQTT

Flujo:

Usuario → Panel Web → Servidor → MQTT → ESP32 → Máquina

---

## 12. Seguridad y Dependencias

- conectado únicamente a LAN interna
- acceso remoto mediante VPN
- broker MQTT en servidor local
- aislamiento eléctrico en E/S

Dependencias:
- red LAN
- servidor central
- alimentación estable

---

## 13. Riesgos y Consideraciones Técnicas

Posibles fallos:

- pérdida de red
- fallo de salida digital
- reinicio del microcontrolador

Impacto:

- pérdida temporal de control remoto de máquina

Las máquinas continúan funcionando manualmente.

Mitigaciones:

- reconexión automática
- watchdog del microcontrolador
- arquitectura centralizada robusta
