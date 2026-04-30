# Flujos esperados (Simulador + App)

Documento de trabajo para validar reglas funcionales.
Marca y edita lo que haga falta. Después lo implemento al detalle.

## 1) Flujo base de arranque de ciclo

### 1.1 Encendido de máquina
- Acción: `Encender`.
- Resultado esperado:
  - Estado pasa de `STOP` a `PAUSADA`.
  - Se permite introducir crédito.

### 1.2 Introducción de crédito (pre-arranque)
- Acción: introducir importe.
- Resultado esperado:
  - Se acumula crédito según reglas de origen (web/admin o cliente/sim).
  - Si hay sobrante, se devuelve según regla definida.

### 1.3 Inicio de ciclo (`START`)
- Acción: `START`.
- Resultado esperado:
  - Solo arranca si cumple condiciones (estado, crédito, puerta, etc.).
  - Al arrancar, estado pasa a `EN_MARCHA`.
  - El temporizador empieza a descontar.

---

## 2) Reglas de crédito (pre-arranque)

## 2.1 Desde web admin (`app/`)
- Caso: se introduce más del coste (ej: 10€ con coste 4€).
- Esperado:
  - Aplicado a máquina: solo coste de arranque.
  - Sobrante: devuelto.
  - En simulador: no debe quedar saldo extra tras `START`.
  - En contabilidad/caja: registrar solo lo aplicado y como bonificación del dueño (impacto negativo).

## 2.2 Desde cliente/simulador físico
- Caso: se introduce más del coste.
- Esperado:
  - La máquina retiene solo lo necesario para arrancar.
  - El resto se devuelve al momento.
  - El saldo acumulado no conserva sobrante.

---

## 3) Reglas de ampliación

### 3.1 Alcance
- Esperado:
  - Solo secadoras pueden ampliar.
  - Lavadoras no deben aceptar ampliación.

### 3.2 Cuándo se aplica
- Esperado:
  - Si se mete crédito de ampliación en marcha, queda acumulado pendiente.
  - No se aplica tiempo hasta pulsar `START`.

### 3.3 Límite de ampliaciones
- Esperado:
  - Sin límite de número de ampliaciones.

### 3.4 Sobrante en ampliación (web admin)
- Caso: importe no exacto a incrementos de tarifa.
- Esperado:
  - Se aplica solo la parte válida.
  - Sobrante devuelto.
  - Caja contabiliza solo aplicado como bonificación (negativo).

---

## 4) Puerta secadora (solo simulador físico)

### 4.1 Botón Abrir/Cerrar puerta (simulador)
- Esperado:
  - Primer toque: solicita apertura.
  - La señal de puerta abierta se envía con retardo de 30 s.

### 4.2 Efecto al abrir
- Esperado:
  - Al llegar señal de puerta abierta:
    - Máquina pasa a `PAUSADA`.
    - Temporizador se congela.

### 4.3 Efecto al cerrar
- Esperado:
  - Al cerrar:
    - Máquina vuelve a `EN_MARCHA`.
    - Temporizador reanuda desde el tiempo congelado.

### 4.4 Restricción de START con puerta
- Esperado:
  - Si puerta está abierta, `START` no debe funcionar.
  - Si apertura está pendiente (ventana de 30 s), `START` tampoco debe funcionar.

---

## 5) Estado de puerta en Admin (`app/frontend`)

### 5.1 Visualización
- Esperado:
  - En vista de máquinas se ve estado actual de puerta (`ABIERTA/CERRADA`).
  - Debe refrescarse con polling y al cambiar estado.

### 5.2 Fuente de datos
- Esperado (confirmar):
  - `iot/state` o `iot/approx-state` (indicar preferida).

---

## 6) Caja/contabilidad

### 6.1 Regla general
- Esperado:
  - Cliente real suma positivo.
  - Bonificación del dueño resta (negativo en caja).

### 6.2 Crédito web admin pre-arranque
- Ejemplo: meto 10€, coste 4€.
- Esperado:
  - Aplicado: 4€.
  - Devuelto: 6€.
  - Caja: `-4€`.

### 6.3 Ampliación web admin
- Esperado:
  - Solo se contabiliza lo aplicado.
  - Cualquier sobrante no aplicado se devuelve y no suma caja.

---

## 7) Matriz rápida de casos (checklist)

Marca con ✅/❌ y añade observaciones.

- [ ] L1 lavadora: crédito > coste pre-arranque devuelve sobrante correctamente.
- [ ] L1 lavadora: no permite ampliación en marcha.
- [ ] S1 secadora: crédito ampliación en marcha queda pendiente hasta `START`.
- [ ] S1 secadora: `START` aplica ampliación pendiente y limpia saldo pendiente.
- [ ] S1 secadora: apertura puerta tras 30s pausa ciclo.
- [ ] S1 secadora: cierre puerta reanuda ciclo.
- [ ] S1 secadora: con puerta abierta no permite `START`.
- [ ] Admin máquinas: estado puerta se actualiza bien.
- [ ] Caja día/semana/rango refleja bonificaciones en negativo.

---

## 8) Dudas a confirmar (edita aquí)

- ¿Crédito web admin pre-arranque debe verse temporalmente en UI antes de `START` o directamente capado al coste?
- ¿En ampliación de secadora, si hay saldo acumulado y se apaga máquina, ese saldo se pierde o se devuelve?
- ¿La puerta bloquea solo `START` o también `encender_rele`?

