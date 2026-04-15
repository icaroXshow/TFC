# Respuestas API

## Formato general correcto

```json
{
  "ok": true,
  "data": {},
  "message": "Operación realizada correctamente"
}
```

## Formato general de error

```json
{
  "ok": false,
  "error": {
    "code": "ACCION_NO_PERMITIDA",
    "message": "El usuario no tiene permisos para ejecutar esta acción"
  }
}
```

---

## Criterios

- las respuestas deben ser claras y estables
- los códigos de error deben ser previsibles
- el frontend no debe depender de textos ambiguos
