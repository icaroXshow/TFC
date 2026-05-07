# mqtt_topics.md

# Arquitectura de Topics MQTT

Este documento define la estructura de topics MQTT del proyecto.

Su objetivo es mantener una organización clara, escalable y consistente para la comunicación entre:

- backend
- broker MQTT
- dispositivos ESP32
- sensores
- actuadores
- eventos del sistema

Una estructura bien definida evita caos futuro, facilita el desarrollo y permite escalar el sistema sin rediseñar toda la comunicación.

---

# 1. Principios de diseño

La arquitectura de topics sigue estos principios:

- jerarquía clara
- nombres consistentes
- separación entre comandos, estados y eventos
- facilidad de depuración
- escalabilidad a múltiples dispositivos
- independencia entre backend y hardware

---

# 2. Prefijo global

Todos los topics del sistema comienzan con un prefijo común:

kwl/

Esto permite:

- identificar fácilmente los topics del proyecto
- evitar conflictos con otros sistemas MQTT
- filtrar mensajes de forma sencilla

---

# 3. Estructura general

La estructura base será:

kwl/<area>/<dispositivo>/<tipo>

Donde:

- <area> = grupo funcional del sistema
- <dispositivo> = dispositivo o entidad concreta
- <tipo> = clase de mensaje

Ejemplo:

kwl/maquinas/lavadora1/comando  
kwl/maquinas/lavadora1/estado  
kwl/maquinas/lavadora1/evento  

---

# 4. Tipos de mensaje

Cada dispositivo o módulo puede usar uno o varios de estos tipos.

---

## 4.1 comando

Se usa para enviar órdenes desde el backend hacia un dispositivo.

Ejemplo:

kwl/maquinas/lavadora1/comando

Ejemplos de payload:

"start"

o preferiblemente en formato estructurado:

{
  "accion": "start"
}

---

## 4.2 estado

Se usa para publicar el estado actual del dispositivo.

Ejemplo:

kwl/maquinas/lavadora1/estado

Ejemplo de payload:

{
  "estado": "running"
}

---

## 4.3 evento

Se usa para informar de sucesos puntuales generados por el dispositivo.

Ejemplo:

kwl/maquinas/lavadora1/evento

Ejemplos de payload:

{
  "evento": "coin_inserted"
}

{
  "evento": "cycle_finished"
}

{
  "evento": "error"
}

---

## 4.4 telemetria

Se usa para datos periódicos o métricas del dispositivo.

Ejemplo:

kwl/maquinas/lavadora1/telemetria

Ejemplo de payload:

{
  "temperatura": 34.2,
  "voltaje": 4.98,
  "rssidb": -61
}

---

## 4.5 disponibilidad

Se usa para indicar si un dispositivo está conectado o desconectado.

Ejemplo:

kwl/maquinas/lavadora1/disponibilidad

Valores típicos:

online  
offline  

Este topic es ideal para usarse junto con Last Will and Testament.

---

# 5. Áreas del sistema

El sistema se divide en áreas funcionales.

---

## 5.1 maquinas

Contiene los dispositivos asociados a lavadoras, secadoras u otras máquinas.

Estructura:

kwl/maquinas/<maquina>/<tipo>

Ejemplos:

kwl/maquinas/lavadora1/comando  
kwl/maquinas/lavadora1/estado  
kwl/maquinas/lavadora1/evento  
kwl/maquinas/lavadora1/telemetria  
kwl/maquinas/lavadora1/disponibilidad  

kwl/maquinas/secadora1/comando  
kwl/maquinas/secadora1/estado  

---

## 5.2 sistema

Contiene elementos generales del sistema.

Ejemplos:

kwl/sistema/puerta/comando  
kwl/sistema/puerta/estado  

kwl/sistema/luces/comando  
kwl/sistema/luces/estado  

kwl/sistema/alarma/evento  

---

## 5.3 sensores

Para sensores independientes del sistema.

Estructura:

kwl/sensores/<sensor>/<tipo>

Ejemplos:

kwl/sensores/temperatura1/estado  
kwl/sensores/humedad1/estado  
kwl/sensores/presencia1/evento  

---

## 5.4 mantenimiento

Para diagnóstico, monitorización y mantenimiento.

Ejemplos:

kwl/mantenimiento/reinicio/comando  
kwl/mantenimiento/logs/evento  

---

# 6. Ejemplo completo de flujo

Un ejemplo típico de funcionamiento sería el siguiente.

1. El usuario inicia una lavadora desde el panel web.

2. El backend publica un comando.

Topic:

kwl/maquinas/lavadora1/comando

Payload:

{
  "accion": "start"
}

3. El ESP32 recibe el mensaje y activa el relé.

4. El dispositivo envía estado al sistema.

Topic:

kwl/maquinas/lavadora1/estado

Payload:

{
  "estado": "running"
}

5. Cuando el ciclo termina, el dispositivo genera un evento.

Topic:

kwl/maquinas/lavadora1/evento

Payload:

{
  "evento": "cycle_finished"
}

---

# 7. Topics de depuración

Durante el desarrollo puede ser útil escuchar todos los topics.

Suscripción global:

#

Esto permite ver todo el tráfico MQTT del sistema.

También es común usar:

kwl/#

para escuchar únicamente los mensajes del proyecto.

---

# 8. Reglas de nomenclatura

Para mantener consistencia en todo el sistema se siguen estas reglas.

- usar minúsculas
- no usar espacios
- separar palabras con guiones o números
- evitar nombres ambiguos
- mantener siempre la misma jerarquía

Ejemplo correcto:

kwl/maquinas/lavadora1/estado

Ejemplo incorrecto:

kwl/Lavadora/Estado

---

# 9. Escalabilidad

La estructura definida permite escalar fácilmente el sistema.

Ejemplos de ampliación:

kwl/maquinas/lavadora2/comando  
kwl/maquinas/lavadora3/comando  
kwl/maquinas/secadora2/estado  

kwl/sensores/temperatura2/estado  

Esto permite añadir nuevos dispositivos sin modificar el backend ni el broker.

---

# 10. Futuras mejoras

La arquitectura puede ampliarse con:

- control de acceso por topics (ACL)
- mensajes retenidos para estado
- Last Will and Testament
- autenticación por dispositivo
- monitorización del broker
- auditoría de eventos

Estas mejoras permitirán mantener un sistema robusto a medida que aumente el número de dispositivos.