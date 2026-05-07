# DATASHEET – Cámara IP MOBOTIX Q25

---

## 1. Identificación

- Modelo: MOBOTIX Q25
- Fabricante: MOBOTIX AG
- Categoría: Cámara IP de videovigilancia hemisférica
- Ubicación física: Zona interior de la lavandería
- Nivel de criticidad: Medio

---

## 2. Descripción y Función en el Sistema

La MOBOTIX Q25 es una cámara IP de alta resolución diseñada para sistemas de videovigilancia profesional.

Utiliza tecnología hemisférica de 360°, lo que permite monitorizar una habitación completa con una única cámara, reduciendo el número total de dispositivos necesarios en el sistema de vigilancia.

Dentro del sistema LAVANDERÍA KWL, estas cámaras se utilizan para:

- supervisión general del local
- control visual de máquinas y clientes
- revisión de incidencias o fallos
- soporte a seguridad del establecimiento

El sistema funciona de forma independiente del sistema de control IoT.

---

## 3. Especificaciones Técnicas (Fabricante)

### Sensor de imagen

- Sensor CMOS 1/1.8"
- Resolución máxima 6 MP (3072 × 2048)
- Escaneo progresivo

### Óptica

Opciones de lente:

- B016 fisheye – visión horizontal 180°
- B041 gran angular – visión horizontal 90°

Permite visión panorámica completa mediante corrección digital.

### Video

- Resolución hasta 6 megapíxeles
- Streaming de vídeo
- Grabación continua o por eventos
- Codec MxPEG / Motion JPEG

### Funciones de análisis

- detección de movimiento
- MxActivitySensor
- análisis de actividad en zonas definidas
- grabación por eventos
- alarmas de red

### Almacenamiento

- MicroSD integrada
- grabación local
- almacenamiento en red

### Conectividad

- Ethernet 10/100
- Alimentación PoE IEEE 802.3af

Consumo típico:

- aproximadamente 4.5 W

### Interfaces

- Ethernet (PoE)
- MiniUSB
- Slot MicroSD
- altavoz
- micrófono (según modelo)

### Condiciones de operación

- Protección IP65
- Temperatura –30 °C a +50 °C

### Características físicas

- Diámetro: 160 mm
- Altura: 48 mm
- Peso: ~450 g

---

## 4. Implementación en LAVANDERÍA KWL

En el sistema se utilizan 2 cámaras MOBOTIX Q25.

Funciones dentro de la instalación:

- supervisión general de la lavandería
- registro de eventos o incidencias
- monitorización remota del establecimiento

Las cámaras se encuentran conectadas a la red del router principal.

---

## 5. Seguridad y Dependencias

- acceso mediante red IP
- autenticación mediante sistema interno de la cámara
- cifrado HTTPS disponible
- control de acceso por IP

Dependencias:

- red LAN
- alimentación PoE
- infraestructura de red

---

## 6. Riesgos y Consideraciones Técnicas

Posibles fallos:

- pérdida de conectividad de red
- fallo de alimentación PoE
- saturación de almacenamiento

Impacto en el sistema:

- pérdida de vigilancia visual
- no afecta al sistema de control de máquinas

Consideraciones:

- sistema de videovigilancia independiente del sistema IoT
- mantenimiento mínimo gracias a diseño sin partes mecánicas
