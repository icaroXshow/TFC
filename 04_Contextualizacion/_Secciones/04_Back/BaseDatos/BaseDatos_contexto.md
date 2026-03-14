# Contexto de la Base de Datos
## Sistema: LAVANDERÍA KWL

Sistema integral de gestión, automatización y control de lavanderías autoservicio.

---

# Infraestructura

Motor de base de datos: MariaDB

Servidor de base de datos: VM_DATA  IP: 192.168.1.52

La base de datos se ejecuta en una máquina virtual dedicada dentro del entorno del sistema.

---

# Objetivo de la base de datos

La base de datos almacena toda la información necesaria para operar y auditar el sistema de lavanderías:

- lavanderías
- máquinas
- ciclos de lavado o secado
- movimientos económicos
- eventos técnicos de las máquinas
- acciones administrativas
- configuración del sistema

El diseño está pensado para:

- soportar múltiples lavanderías
- registrar histórico completo
- permitir auditoría de acciones
- facilitar generación de informes

---

# Principios de diseño

## Claridad

Cada tabla representa un hecho real del sistema.

Ejemplos:

Ciclo → uso real de la máquina  
MovimientoMaquina → dinero aplicado a la máquina  
LogMaquina → eventos técnicos  
Auditoria → acciones humanas

---

## Separación de responsabilidades

Las responsabilidades se separan en diferentes entidades:

Uso de máquina  
→ Ciclo

Registro económico  
→ MovimientoMaquina

Eventos técnicos  
→ LogMaquina

Acciones administrativas  
→ Auditoria

---

## Histórico

Los cambios de precio no afectan a ciclos antiguos.

Para ello se utiliza la tabla:

TarifaMaquina

Cada ciclo guarda los valores aplicados en el momento de inicio.

---

## Escalabilidad

El sistema está preparado para manejar:

- múltiples lavanderías
- miles o millones de ciclos
- grandes volúmenes de logs
- informes históricos

---

# Flujo operativo

1. El cliente introduce dinero en el monedero de la máquina.
2. La máquina acumula el importe necesario para el arranque.
3. Al iniciar el ciclo se registra un movimiento de arranque.
4. Si el cliente añade dinero durante el ciclo se registran ampliaciones.
5. Si el administrador añade saldo desde la web se registra como bonificación.

---

# Generación de informes

Los informes no se almacenan en tablas independientes.

Se calculan a partir de:

- ciclos
- movimientos de máquina

Ejemplos de informes:

- caja diaria
- estadísticas por hora
- evolución semanal
- evolución mensual
- comparativas entre máquinas

---

# Escenarios soportados

El modelo de base de datos permite:

- ampliaciones de tiempo durante el ciclo
- intervenciones manuales del administrador
- cambios futuros de precio
- gestión de múltiples lavanderías
- auditoría completa del sistema

---

# Tablas principales del sistema

El núcleo del sistema está compuesto por las siguientes tablas:

- lavanderia
- usuario
- maquina
- tarifa_maquina
- ciclo
- movimiento_maquina
- log_maquina
- auditoria
- configuracion

Estas tablas permiten modelar completamente el funcionamiento del sistema.