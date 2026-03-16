# DATASHEET – ESP32 de Ventilación (2 Relés)

## 1. Identificación

- **Modelo:** Módulo de relé ESP32 WiFi + Bluetooth BLE (versión 2 canales)
- **Fabricante:** Genérico
- **Categoría:** Controlador IoT con relés integrados
- **Ubicación física:** Sistema de ventilación / cuadro eléctrico
- **Nivel de criticidad:** Medio

---

## 2. Descripción y Función en el Sistema

Este módulo es una placa de control basada en **ESP32** con conectividad inalámbrica integrada y **2 salidas por relé**.

Dentro del sistema **LAVANDERÍA KWL**, se utiliza como controlador dedicado del sistema de ventilación, permitiendo activar o desactivar cargas eléctricas asociadas a ventiladores o elementos auxiliares.

El dispositivo actúa como nodo ejecutor simple y depende de la lógica definida en el sistema principal.

---

## 3. Especificaciones Técnicas (Fabricante)

### Controlador
- Basado en sistema **ESP32**
- Conectividad integrada:
  - **WiFi**
  - **Bluetooth clásico**
  - **BLE** (Bluetooth Low Energy)

### Comunicación
- Modos soportados:
  - WiFi
  - Bluetooth clásico
  - BLE
- Permite control LAN y conexión con dispositivos de bajo consumo

### Relés
- **Número de relés:** 2 salidas
- Tipo de control: conmutación por relé integrada

### Alimentación
- **Voltaje de funcionamiento:** DC **5V – 60V**

### Desarrollo
- Compatible con **Arduino IDE**
- Compatible con otros entornos y lenguajes de desarrollo para ESP32

### Seguridad
- Soporta mecanismos de autenticación y cifrado según capacidades del ESP32

### Compatibilidad
- Compatible con sensores, módulos ESP32 y placas de expansión

### Características físicas
- **Dimensiones:** 75 × 48 × 17 mm
- **Peso:** 42 g

---

## 4. Implementación en LAVANDERÍA KWL

En este proyecto se utiliza una unidad como controlador específico del sistema de ventilación.

Funciones previstas:

- activación remota del sistema de ventilación
- desactivación remota del sistema de ventilación
- automatización por lógica definida en servidor o reglas locales
- integración con la red interna del sistema

La placa se integra como nodo periférico simple dentro de la arquitectura general.

---

## 5. Seguridad y Dependencias

- Conectado a red interna de la lavandería
- Acceso remoto únicamente a través de la infraestructura segura del sistema
- Dependencia de alimentación estable
- Dependencia de conectividad inalámbrica si se usa por WiFi

---

## 6. Riesgos y Consideraciones Técnicas

Posibles fallos:

- pérdida de conectividad WiFi
- bloqueo o reinicio del ESP32
- desgaste o fallo de uno de los relés
- activación incorrecta por ruido eléctrico o mala alimentación

Impacto en el sistema:

- pérdida de control remoto sobre la ventilación
- la ventilación puede requerir actuación manual o bypass local

Consideraciones técnicas:

- al ser un módulo genérico, conviene validar la calidad real de relés y aislamiento
- recomendable instalarlo en entorno protegido y con alimentación estable
- adecuado para automatización ligera, no para cargas industriales pesadas sin etapa intermedia de potencia
