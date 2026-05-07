# DATASHEET – Lavadora industrial Renzacci 11/13/16/22

---

## 1. Identificación

- Modelo: Renzacci 11 / 13 / 16 / 22  
- Fabricante: Renzacci S.p.A  
- Categoría: Lavadora industrial supercentrifugadora  
- Ubicación física: Zona de lavado – lavandería autoservicio  
- Nivel de criticidad: Crítico  

---

## 2. Descripción y Función en el Sistema

La lavadora Renzacci serie 11/13/16/22 es una lavadora industrial diseñada para lavanderías autoservicio y entornos profesionales.

Estas máquinas están diseñadas para operar de forma continua, con programas de lavado configurables y sistemas de centrifugado de alta velocidad.

Dentro del sistema LAVANDERÍA KWL, estas máquinas constituyen el núcleo del servicio ofrecido al cliente.

Su funcionamiento se activa mediante el sistema de pago compuesto por:

- monedero Comestero RM5 Evolution  
- interfaz Comestero MPS1  

Cuando el sistema de pago valida el crédito, la interfaz habilita el inicio del ciclo de lavado.

---

## 3. Especificaciones Técnicas (Fabricante)

### Tipo de máquina

- Lavadora industrial supercentrifugadora
- Tambor horizontal
- Programas de lavado configurables

### Capacidad de carga

Según modelo:

- 11 kg
- 13 kg
- 16 kg
- 22 kg

### Sistema de lavado

- control electrónico de ciclos
- control automático de nivel de agua
- control de temperatura
- múltiples programas de lavado

### Centrifugado

- centrifugado de alta velocidad
- sistema de equilibrio del tambor

### Conexiones

- alimentación eléctrica industrial
- conexión de agua
- desagüe
- conexión a sistema de pago externo

---

## 4. Implementación en LAVANDERÍA KWL

En el sistema se utilizan:

- 3 lavadoras Renzacci

Cada lavadora está conectada a:

- un monedero Comestero RM5 Evolution
- una interfaz Comestero MPS1

Flujo de funcionamiento:

1. El cliente introduce monedas.
2. El monedero valida el crédito.
3. La interfaz MPS1 comunica el crédito a la máquina.
4. La lavadora habilita el inicio del programa.

El sistema IoT no controla directamente los ciclos internos de lavado.

---

## 5. Seguridad y Dependencias

Dependencias:

- alimentación eléctrica industrial
- suministro de agua
- sistema de desagüe
- interfaz de pago

Seguridad del sistema:

- activación condicionada al sistema de pago
- protección mecánica del tambor
- bloqueo de puerta durante funcionamiento

---

## 6. Riesgos y Consideraciones Técnicas

Posibles fallos:

- fallo del sistema de pago
- bloqueo del tambor
- fallo de bomba o válvulas
- fallo de alimentación eléctrica

Impacto en el sistema:

- la máquina queda fuera de servicio
- pérdida de ingresos en la lavandería

Consideraciones técnicas:

- equipos diseñados para uso intensivo
- mantenimiento periódico necesario
- funcionamiento independiente del sistema IoT
