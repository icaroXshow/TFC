# Modelo de estado

## Tipos de estado

El sistema maneja dos tipos de estado:

### 1. Estado persistente (BD)
Guardado en MariaDB:

- ciclos
- movimientos
- logs
- auditoría

Es histórico y trazable.

---

### 2. Estado operativo (Redis)

Guardado en Redis:

- estado actual de máquinas
- estado de dispositivos
- última actualización
- flags de tiempo real

Es rápido y volátil.

---

## Regla clave

Redis NO sustituye a la base de datos.

- BD → verdad histórica
- Redis → estado actual

---

## Ejemplo

Máquina:

- BD:
  - ciclo iniciado
  - movimientos
  - eventos

- Redis:
  - estado = EN_MARCHA
