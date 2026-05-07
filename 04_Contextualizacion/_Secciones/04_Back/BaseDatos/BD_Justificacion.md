@Requisitos:
- varias lavanderías
- varias máquinas por lavandería
- ciclos con precio base configurable
- ampliaciones durante el ciclo
- intervenciones manuales desde web
- contabilidad separando dinero real de bonificaciones
- histórico y auditoría
- posibilidad de subir precios en el futuro sin romper el histórico

@Reglas de negocio 

Estas son las que doy por cerradas para el diseño:

- Operación de máquina
- Cada máquina pertenece a una lavandería.
- Cada máquina tiene un precio de arranque.
- Cada arranque da un tiempo base.
- Durante el ciclo, cada 1 euro añade 9 minutos.
- El tiempo extra es igual para todas las máquinas.
- El precio base actual es 4,50 €.
- El tiempo base actual es 37 min.
- Los precios pueden cambiar en el futuro.

@Registro económico

- El dinero introducido antes del arranque se guarda acumulado, no moneda a moneda.

- Si el dueño añade saldo desde web:

    con máquina en STOP: añade el importe de arranque completo
    con máquina en EN_MARCHA: añade 1 euro

- Lo añadido desde web, aunque la máquina lo reciba como saldo normal, contablemente se registra como bonificación/descuento manual.
- El cliente paga por ciclo, no existe monedero de cliente ni saldo persistente de cliente.

@Idea central del diseño

La base de datos se apoya en dos hechos principales:

1. ciclo: Representa una ejecución real de máquina.
2. movimiento_maquina: Representa cada entrada económica aplicada a la máquina. Ese segundo punto es la clave del invento. 
Porque ahí distinguimos:
   - dinero real del cliente
   - bonificación manual del dueño
   - aporte de arranque
   - aporte durante el ciclo