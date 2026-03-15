# Contexto de la Base de Datos
## Sistema: LAVANDERÍA KWL

Sistema integral de gestión, automatización y control de lavanderías autoservicio.

---

# Infraestructura

Motor de base de datos: MariaDB

Servidor de base de datos: VM_DATA  
IP: 192.168.1.52

La base de datos se ejecuta en una máquina virtual dedicada dentro del entorno del sistema.

---

# Objetivo de la base de datos

La base de datos almacena toda la información necesaria para operar, controlar y auditar el sistema de lavanderías.

El sistema debe gestionar:

- múltiples lavanderías
- máquinas asociadas a cada lavandería
- usuarios con acceso a una o varias lavanderías
- ciclos de lavado o secado
- movimientos económicos asociados a cada ciclo
- eventos técnicos generados por las máquinas
- acciones administrativas realizadas desde el panel
- configuración auxiliar del sistema
- histórico de tarifas y cambios de precio

El diseño está pensado para:

- soportar múltiples lavanderías
- registrar histórico completo
- permitir trazabilidad técnica y funcional
- permitir auditoría de acciones
- facilitar la generación de informes operativos y contables
- conservar el histórico aunque cambien precios o reglas de funcionamiento

---

# Principios de diseño

## Claridad

Cada tabla representa un hecho real del sistema.

Ejemplos:

Ciclo → uso real de la máquina  
MovimientoMaquina → dinero o bonificación aplicada a la máquina  
LogMaquina → eventos técnicos  
Auditoria → acciones humanas  
TarifaMaquina → condiciones económicas vigentes en un periodo

---

## Separación de responsabilidades

Las responsabilidades se separan en diferentes entidades para evitar mezclar conceptos distintos dentro de una misma tabla.

Uso de máquina  
→ Ciclo

Registro económico  
→ MovimientoMaquina

Eventos técnicos  
→ LogMaquina

Acciones administrativas  
→ Auditoria

Condiciones económicas históricas  
→ TarifaMaquina

Configuración auxiliar  
→ Configuracion

---

## Histórico

Los cambios de precio no afectan a ciclos antiguos.

Para ello se utiliza la tabla:

TarifaMaquina

Cada ciclo guarda los valores aplicados en el momento de inicio, como el precio de arranque, el tiempo base y la duración total programada.

De esta forma, el histórico económico queda preservado incluso aunque se modifiquen tarifas en el futuro.

---

## Escalabilidad

El sistema está preparado para manejar:

- múltiples lavanderías
- múltiples usuarios con acceso a distintos locales
- miles o millones de ciclos
- grandes volúmenes de logs
- informes históricos
- crecimiento futuro sin rehacer el modelo base

---

# Flujo operativo

1. El cliente introduce dinero en el monedero de la máquina.
2. La máquina acumula el importe necesario para el arranque.
3. Al iniciar el ciclo se registra un movimiento de tipo arranque.
4. El ciclo guarda la tarifa aplicada en ese momento.
5. Si el cliente añade dinero durante el ciclo, se registran ampliaciones de tiempo.
6. Si el administrador añade saldo desde la web:
   - si la máquina está en STOP, se registra un arranque bonificado
   - si la máquina está en marcha, se registra una ampliación bonificada
7. Las acciones manuales relevantes quedan reflejadas en auditoría.
8. Los eventos técnicos enviados por máquinas o backend quedan registrados en log_maquina.

---

# Generación de informes

Los informes no se almacenan en tablas independientes.

Se calculan a partir de las tablas base del sistema, principalmente:

- ciclo
- movimiento_maquina
- log_maquina
- auditoria

Ejemplos de informes:

- caja diaria
- estadísticas por hora
- evolución semanal
- evolución mensual
- comparativas entre máquinas
- bonificaciones aplicadas
- movimientos manuales desde web
- actividad por lavandería
- trazabilidad de incidencias técnicas

---

# Escenarios soportados

El modelo de base de datos permite:

- ampliaciones de tiempo durante el ciclo
- intervenciones manuales del administrador
- separación entre dinero real y bonificaciones
- cambios futuros de precio
- gestión de múltiples lavanderías
- gestión de usuarios con acceso a varios locales
- auditoría completa del sistema
- conservación de histórico operativo y económico

---

# Tablas principales del sistema

El núcleo del sistema está compuesto por las siguientes tablas:

- lavanderia
- usuario
- usuario_lavanderia
- maquina
- tarifa_maquina
- ciclo
- movimiento_maquina
- log_maquina
- auditoria
- configuracion

Estas tablas permiten modelar de forma completa el funcionamiento del sistema.

---

# Idea central del modelo

El diseño se apoya en una separación clara entre cuatro tipos de información:

- uso real de la máquina
- movimientos económicos
- eventos técnicos
- acciones humanas

Esta separación mejora la claridad del sistema, facilita la auditoría, permite construir informes fiables y evita mezclar datos de naturaleza distinta en una misma estructura.