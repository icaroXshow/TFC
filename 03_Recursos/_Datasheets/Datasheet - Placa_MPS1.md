# DATASHEET – Interface Comestero MPS1‑N

---

## 1. Identificación
- Modelo: MPS1‑N
- Fabricante: RENZACCI
- Categoría: Interfaz de crédito / generador de pulsos
- Ubicación física: Interior de las máquinas
- Nivel de criticidad: Crítico

---

## 2. Descripción y Función en el Sistema
La interfaz MPS1‑N es un módulo que convierte la señal de crédito generada por el monedero en pulsos eléctricos compatibles con el sistema de control de la máquina.

En LAVANDERÍA KWL el MPS1 actúa como puente entre:
- el sistema de pago (monedero)
- la lógica de control de la máquina

---

## 3. Especificaciones Técnicas (Fabricante)
Tipo: interfaz de crédito programable  
Entradas: señal desde monedero  
Salidas: pulsos de crédito  
Alimentación: 12‑24V DC  
Configuración: mediante programación del módulo

---

## 4. Implementación en LAVANDERÍA KWL
Cada máquina dispone de:
- 1 monedero RM5 Evolution
- 1 interfaz MPS1‑N

Flujo:

Monedero detecta moneda  
→ MPS1 recibe crédito  
→ MPS1 genera pulsos  
→ máquina interpreta crédito

Los ESP32 pueden inyectar pulsos adicionales para créditos remotos.

---

## 5. Seguridad y Dependencias
Dependencias:
- monedero RM5 Evolution
- cableado correcto
- alimentación estable

---

## 6. Riesgos y Consideraciones Técnicas
Posibles fallos:
- generación incorrecta de pulsos
- pérdida de créditos
- fallo eléctrico

Impacto:
- créditos no aplicados correctamente a la máquina.