# Cámara y audio

> Base URL: `http://es1034.c14.ovh:1055`
>
> Los endpoints están escritos en formato relativo.

## CONTROL DE CÁMARA

### Imagen

#### Imagen actual
- Endpoint: `/record/current.jpg`
- Resultado: Devuelve la foto actual de la cámara.

#### Stream rápido
- Endpoint: `/control/faststream.jpg?stream=full&fps=16`
- Resultado: Devuelve vídeo/stream JPEG rápido con los fps indicados.

### Zoom y vista

#### Zoom 1x
- Endpoint: `/control/click.cgi?zoom=1000`
- Resultado: Pone el zoom al nivel 1x.

#### Zoom 1.6x
- Endpoint: `/control/click.cgi?zoom=1600&snap`
- Resultado: Pone el zoom al nivel 1.6x.

#### Zoom 2x
- Endpoint: `/control/click.cgi?zoom=2000&snap`
- Resultado: Pone el zoom al nivel 2x.

#### Zoom 3.2x
- Endpoint: `/control/click.cgi?zoom=3200&snap`
- Resultado: Pone el zoom al nivel 3.2x.

#### Zoom 4x
- Endpoint: `/control/click.cgi?zoom=4000&snap`
- Resultado: Pone el zoom al nivel 4x.

#### Zoom 5.6x
- Endpoint: `/control/click.cgi?zoom=5600&snap`
- Resultado: Pone el zoom al nivel 5.6x.

#### Zoom 8x
- Endpoint: `/control/click.cgi?zoom=8000&snap`
- Resultado: Pone el zoom al nivel 8x.

#### Zoom relativo +
- Endpoint: `/control/click.cgi?zoomrel=250`
- Resultado: Acerca la imagen de forma relativa.

#### Zoom relativo -
- Endpoint: `/control/click.cgi?zoomrel=-200`
- Resultado: Aleja la imagen de forma relativa.

#### Centrar vista
- Endpoint: `/control/click.cgi?center=yes`
- Resultado: Centra la vista actual.

#### Zoom sobre rectángulo
- Endpoint: `/control/click.cgi?zoomrect&image_on_success`
- Resultado: Hace zoom sobre una zona seleccionada.

#### Click en coordenadas
- Endpoint: `/control/click.cgi?x=120&y=80&mode=0&rand=12345`
- Resultado: Envía una acción sobre un punto concreto de la imagen.

### Calidad y resolución

#### Calidad JPEG
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&quality=60`
- Resultado: Cambia la calidad JPEG de la imagen.

#### Tamaño de imagen
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&size=1280x720`
- Resultado: Cambia la resolución de la imagen.

#### Modo de visualización
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&display_mode=surround`
- Resultado: Cambia el modo de visualización de la cámara.

### Ajustes de imagen

#### Brillo
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&brightness=3`
- Resultado: Ajusta el brillo de la imagen.

#### Contraluz
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&backlight=4`
- Resultado: Ajusta la corrección de contraluz.

#### Saturación
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&color=2`
- Resultado: Ajusta la saturación de color.

#### Nitidez
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&sharpen=4`
- Resultado: Ajusta la nitidez de la imagen.

#### Calidad de imagen / velocidad
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&reduced_mode=1`
- Resultado: Cambia el modo entre más calidad o más rapidez.

#### Ayuda de enfoque
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&sharpnessadjust=enable`
- Resultado: Activa la ayuda de enfoque.

### Vistas guardadas

#### Cargar vista
- Endpoint: `/control/click.cgi?image_on_success&loadview=139`
- Resultado: Carga una vista guardada.

#### Guardar vista
- Endpoint: `/control/click.cgi?image_on_success&setview=139`
- Resultado: Guarda la vista actual.

#### Borrar todas las vistas
- Endpoint: `/control/click.cgi?image_on_success&delete_all_views`
- Resultado: Elimina todas las vistas guardadas.

#### Guardar vista por defecto
- Endpoint: `/control/click.cgi?setview=yes`
- Resultado: Guarda la vista actual como vista por defecto.

#### Cargar vista por defecto
- Endpoint: `/control/click.cgi?loadview=yes`
- Resultado: Carga la vista por defecto.

### Movimiento automático

#### Activar auto move
- Endpoint: `/control/click.cgi?image_on_success&moveauto&views=139,140,142,141`
- Resultado: Activa el movimiento automático entre vistas guardadas.

#### Desactivar auto move
- Endpoint: `/control/click.cgi?image_on_success&moveauto`
- Resultado: Desactiva el movimiento automático.

## CONTROL DE AUDIO

### Ajustes de audio

#### Volumen del altavoz
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&SPEAKERLEVEL=0`
- Resultado: Ajusta el volumen del altavoz.

#### Sensibilidad del micrófono
- Endpoint: `/control/control?no_http_header&set&section=quickcontrol&PREAMPLIFIER=2`
- Resultado: Ajusta la sensibilidad del micrófono.

### Reproducción de sonidos

#### Reproducir sonido
- Endpoint: `/control/rcontrol?action=sound&soundfile=PUBLICIDAD`
- Resultado: Reproduce un audio pregrabado en la cámara.

#### Sonidos detectados
- `Alarm`
- `AnsKeyNoFunction`
- `AnsMsgBell`
- `AnsMsgKeypad`
- `AnsMsgNoAnswer`
- `Beep`
- `Busy`
- `CERRAR`
- `Cuckooclock`
- `Default`
- `DoorBell`
- `NOGOLPEE`
- `PUBLICIDAD`
- `Phonering`
- `RESPETE`
- `Standard`
