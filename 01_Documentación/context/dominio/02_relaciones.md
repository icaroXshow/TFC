# Relaciones del dominio

## Relaciones principales

- Lavanderia 1 --- N Maquina
- Lavanderia 1 --- N TarifaMaquina
- Lavanderia 1 --- N MovimientoMaquina
- Lavanderia 1 --- N Auditoria
- Lavanderia 1 --- N Configuracion

- Usuario 1 --- N Auditoria
- Usuario 1 --- N MovimientoMaquina
- Usuario N --- N Lavanderia (mediante UsuarioLavanderia)

- Maquina 1 --- N Ciclo
- Maquina 1 --- N MovimientoMaquina
- Maquina 1 --- N LogMaquina

- TarifaMaquina 1 --- N Ciclo

- Ciclo 1 --- N MovimientoMaquina
- Ciclo 1 --- N LogMaquina

---

## Interpretación funcional

- una máquina pertenece a una lavandería
- una lavandería puede tener varias máquinas
- una máquina puede tener muchos ciclos a lo largo del tiempo
- un ciclo puede recibir varios movimientos económicos
- un ciclo puede tener varios eventos técnicos asociados
- la tarifa aplicada al ciclo queda congelada en el momento del arranque
- la auditoría registra acciones sobre distintas entidades
