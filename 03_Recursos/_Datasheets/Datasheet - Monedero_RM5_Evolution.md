# DATASHEET – Monedero Comestero RM5 Evolution

---

## 1. Identificación
- Modelo: RM5 Evolution
- Fabricante: Comestero
- Categoría: Monedero electrónico
- Ubicación física: Panel frontal de las máquinas
- Nivel de criticidad: Crítico

---

## 2. Descripción y Función en el Sistema
El Comestero RM5 Evolution es un sistema electrónico de aceptación de monedas utilizado en máquinas automáticas.

En el sistema LAVANDERÍA KWL su función es:

- detectar monedas introducidas por el usuario
- validar su autenticidad
- enviar señal de crédito al sistema mediante interfaz MPS1

---

## 3. Especificaciones Técnicas (Fabricante)
Tipo: Monedero electrónico programable  
Monedas soportadas: configurables según país  
Interfaces: Serial / Pulse output  
Alimentación: 24V DC  
Consumo aproximado: <3W

---

## 4. Implementación en LAVANDERÍA KWL
Cada máquina dispone de:

- 1 monedero RM5 Evolution
- 1 interfaz MPS1

Flujo de operación:

Usuario introduce moneda  
→ monedero valida moneda  
→ señal enviada al MPS1  
→ MPS1 genera pulso de crédito para la máquina

---

## 5. Seguridad y Dependencias
Dependencias:

- interfaz MPS1
- alimentación estable
- correcta calibración de monedas

---

## 6. Riesgos y Consideraciones Técnicas
Posibles fallos:

- rechazo incorrecto de monedas
- bloqueo mecánico
- fallo de comunicación con interfaz

Impacto:

- imposibilidad de introducir créditos.