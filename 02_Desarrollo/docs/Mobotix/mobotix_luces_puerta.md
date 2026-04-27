# Luces y puerta

> Base URL: `http://CAMERA_HOST:PORT`
>
> Los endpoints están escritos en formato relativo.

## CONTROL DE SALIDAS FÍSICAS

### Puerta

#### Abrir puerta
- Endpoint: `/control/rcontrol?action=sigouthigh&time=3&outmask=0x2`
- Resultado: Activa la salida física asociada a la puerta durante 3 segundos.

### Luces

#### Activar luces
- Endpoint: `/control/rcontrol?action=sigouthigh&time=1&outmask=0x1`
- Resultado: Activa la salida física asociada a las luces durante 1 segundo.

## NOTAS

### Máscara de salida
- `outmask=0x1`: salida usada por la interfaz para luces.
- `outmask=0x2`: salida usada por la interfaz para puerta.

### Tiempo de activación
- `time=1`: pulso de 1 segundo.
- `time=3`: pulso de 3 segundos.
