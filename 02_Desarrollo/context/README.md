# context

## Descripción

Esta carpeta contiene la definición conceptual del sistema KWL.

Aquí se describe qué es el sistema, qué entidades existen, cómo se comunican sus componentes y cuáles son las reglas funcionales que deben respetar el backend, el frontend, la simulación y el despliegue.

`context/` es la fuente de verdad lógica del proyecto.

---

## Estructura

- `sistema/` → visión general, reglas y alcance
- `dominio/` → entidades, estados, eventos y acciones
- `mqtt/` → contrato de comunicación con dispositivos
- `api/` → contrato de comunicación entre frontend y backend

---

## Objetivo

Evitar incoherencias entre:

- documentación
- base de datos
- backend
- frontend
- simulador

Todo desarrollo posterior debe basarse en lo definido aquí.
