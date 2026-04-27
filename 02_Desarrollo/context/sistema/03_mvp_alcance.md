# Alcance del MVP

## Objetivo del MVP

Construir una versión funcional mínima que permita validar la arquitectura completa del sistema sobre un caso real de lavandería.

---

## Incluye

- panel web responsive
- autenticación de usuarios
- gestión básica de usuarios y roles
- control de al menos una máquina real o simulada
- gestión de créditos aplicada a máquina
- apertura y cierre de tienda
- control de puerta
- control de luces
- control de ventilación
- comunicación MQTT
- simulador de dispositivos
- auditoría de acciones críticas
- registro técnico de eventos
- contabilidad operativa en base de datos
- refresco de estado en panel por API (polling)
- caché operativa con Redis para estado/configuración IoT
- despliegue en entorno real y entorno demo

---

## No incluye por ahora

- pagos online
- cliente final con cuenta o monedero persistente
- integración cloud
- multitienda operativa completa
- IA productiva en producción
- automatizaciones avanzadas fuera del núcleo del MVP
- alta disponibilidad o tolerancia a fallos compleja

---

## Criterio de éxito

El MVP se considera válido si permite demostrar el flujo completo:

1. el usuario opera desde la web
2. el backend valida y decide
3. se envía un comando al dispositivo
4. el dispositivo responde con estado/evento
5. el backend registra y actualiza
6. el frontend refleja el cambio por refresco API (y WebSocket como evolución)
