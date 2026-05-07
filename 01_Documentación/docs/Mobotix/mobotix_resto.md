# Resto de endpoints detectados

> Base URL: `http://CAMERA_HOST:PORT`
>
> Los endpoints están escritos en formato relativo.
>
> Este archivo agrupa lo que no entra directamente en cámara/audio ni en luces/puerta.

## GRABACIÓN Y EVENTOS

### Activar grabación
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable`
- Resultado: Activa el armado de eventos y la grabación.

### Desactivar grabación
- Endpoint: `/control/control?section=eventcontrol&set&recording_activ=disable`
- Resultado: Desactiva la grabación.

### Grabación por evento
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable&recording=streaming_event`
- Resultado: Configura la grabación para que se haga por eventos.

### Grabación continua a 1 fps
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable&recording=streaming&streamframerate100=100`
- Resultado: Configura grabación continua a 1 fps.

### Grabación continua a 4 fps
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable&recording=streaming&streamframerate100=400`
- Resultado: Configura grabación continua a 4 fps.

### Grabación continua al máximo
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable&recording=streaming&streamframerate100=0`
- Resultado: Configura grabación continua a la máxima tasa posible.

### Añadir ventana de vídeo-movimiento
- Endpoint: `/control/click.cgi?image_on_success&add_vm_win`
- Resultado: Añade una ventana de detección de movimiento.

### Reemplazar ventana de vídeo-movimiento
- Endpoint: `/control/click.cgi?image_on_success&replace_vm_win`
- Resultado: Sustituye la ventana de detección de movimiento actual.

### Grabar imagen completa
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable&recording_fullimage=1`
- Resultado: Configura la grabación de imagen completa.

### Grabar imagen en vivo
- Endpoint: `/control/control?section=eventcontrol&set&edactiv=enable&recording_activ=enable&recording_fullimage=0`
- Resultado: Configura la grabación de imagen en vivo.

### Mostrar símbolos de grabación/evento
- Endpoint: `/control/control?section=quickcontrol&set&imageinfo=1&recsymbol=enable`
- Resultado: Muestra símbolos de grabación y evento sobre la imagen.

### Ocultar símbolos de grabación/evento
- Endpoint: `/control/control?section=quickcontrol&set&imageinfo=0&recsymbol=disable`
- Resultado: Oculta símbolos de grabación y evento sobre la imagen.

## EXPOSICIÓN

### Usar área visible
- Endpoint: `/control/control?section=quickcontrol&set&ca_exp_mode==max`
- Resultado: Cambia el control de exposición al área visible.

### Usar imagen completa
- Endpoint: `/control/control?section=quickcontrol&set&ca_exp_mode==min&ca_exp_window_type==min`
- Resultado: Cambia el control de exposición a imagen completa.

### Añadir ventana de exposición
- Endpoint: `/control/click.cgi?image_on_success&add_exp_win`
- Resultado: Añade una ventana de exposición.

### Reemplazar ventana de exposición
- Endpoint: `/control/click.cgi?image_on_success&replace_exp_win`
- Resultado: Sustituye la ventana de exposición actual.

### Rectángulos de exposición predefinidos
#### Quarter
- Endpoint: `/control/click.cgi?replace_exp_win&rect=quarter`
- Resultado: Define una ventana tipo cuarto.

#### Center
- Endpoint: `/control/click.cgi?replace_exp_win&rect=center`
- Resultado: Define una ventana centrada.

#### Spot
- Endpoint: `/control/click.cgi?replace_exp_win&rect=spot`
- Resultado: Define una ventana puntual.

#### Top
- Endpoint: `/control/click.cgi?replace_exp_win&rect=top`
- Resultado: Define una ventana en la zona superior.

#### Middle
- Endpoint: `/control/click.cgi?replace_exp_win&rect=middle`
- Resultado: Define una ventana horizontal central.

#### Bottom
- Endpoint: `/control/click.cgi?replace_exp_win&rect=bottom`
- Resultado: Define una ventana en la zona inferior.

#### Right
- Endpoint: `/control/click.cgi?replace_exp_win&rect=right`
- Resultado: Define una ventana en la parte derecha.

#### Vertical
- Endpoint: `/control/click.cgi?replace_exp_win&rect=vertical`
- Resultado: Define una ventana vertical.

#### Left
- Endpoint: `/control/click.cgi?replace_exp_win&rect=left`
- Resultado: Define una ventana en la parte izquierda.

### Mostrar ventanas de exposición
- Endpoint: `/control/control?image_on_success&section=quickcontrol&set&ca_exp_window_draw=on+on`
- Resultado: Muestra visualmente las ventanas de exposición.

### Ocultar ventanas de exposición
- Endpoint: `/control/control?image_on_success&section=quickcontrol&set&ca_exp_window_draw=auto+auto`
- Resultado: Oculta visualmente las ventanas de exposición.

## CONFIGURACIÓN Y UTILIDADES

### Descargar imagen actual
- Endpoint: `/cgi-bin/DownloadLiveImage?12345`
- Resultado: Descarga la imagen actual.

### Programa de imagen rápido
- Endpoint: `/cgi-bin/easyinterface?work=3`
- Resultado: Abre la opción de programa de imagen rápido.

### Programa de imagen calidad
- Endpoint: `/cgi-bin/easyinterface?work=4`
- Resultado: Abre la opción de programa de imagen calidad.

### Programa de imagen alta calidad
- Endpoint: `/cgi-bin/easyinterface?work=5`
- Resultado: Abre la opción de programa de imagen alta calidad.

### Programa de seguridad
- Endpoint: `/cgi-bin/easyinterface?work=6`
- Resultado: Abre la opción de aplicación de seguridad.

### Programa webcam
- Endpoint: `/cgi-bin/easyinterface?work=7`
- Resultado: Abre la opción de programa webcam.

### Tamaño personalizado
- Endpoint: `/cgi-bin/easyinterface?work=8`
- Resultado: Abre la configuración de tamaño personalizado.

### Definir norte
- Endpoint: `/cgi-bin/easyinterface?work=9`
- Resultado: Abre la opción para definir el norte.

### Cargar imágenes por defecto
- Endpoint: `/cgi-bin/easyinterface?work=11`
- Resultado: Restaura las imágenes por defecto.

### Restaurar configuración de imagen
- Endpoint: `/cgi-bin/easyinterface?work=12`
- Resultado: Restaura la configuración de imagen.

### Guardar configuración completa en flash
- Endpoint: `/admin/store_to_flash.cgi?doofi`
- Resultado: Guarda la configuración completa en memoria flash.

## ORIENTACIÓN / MONTAJE

### Montaje en pared
- Endpoint: `/admin/mountingangle?set&image_on_success&R_Angle_Y_P_R=0+0`
- Resultado: Configura el montaje como pared.

### Montaje en techo
- Endpoint: `/admin/mountingangle?set&image_on_success&R_Angle_Y_P_R=0+270`
- Resultado: Configura el montaje como techo.

### Montaje en suelo
- Endpoint: `/admin/mountingangle?set&image_on_success&R_Angle_Y_P_R=0+90`
- Resultado: Configura el montaje como suelo.

## NAVEGACIÓN Y PÁGINAS AUXILIARES

### Página live
- Endpoint: `/control/userimage.html`
- Resultado: Abre la pantalla principal de imagen en vivo.

### Reproductor
- Endpoint: `/control/player`
- Resultado: Abre el reproductor de eventos.

### Reproducir último evento
- Endpoint: `/control/player?play_loop`
- Resultado: Reproduce el último evento.

### Lista de eventos
- Endpoint: `/control/player?eventlist`
- Resultado: Abre la lista de eventos.

### Multi vista
- Endpoint: `/control/multiview`
- Resultado: Abre la vista múltiple.

### Multiwatcher
- Endpoint: `/control/multiwatcherproxy`
- Resultado: Abre la utilidad multiwatcher.

### Información de cámara
- Endpoint: `/control/camerainfo`
- Resultado: Muestra información de la cámara.

### Menú setup
- Endpoint: `/control/`
- Resultado: Abre el menú de configuración.

### Menú admin
- Endpoint: `/admin/index.html`
- Resultado: Abre el panel de administración.

### Ayuda
- Endpoint: `/help/help?page-live`
- Resultado: Abre la ayuda de la página live.

## OTROS

### Evento de usuario
- Endpoint: `/control/rcontrol?action=userclick`
- Resultado: Dispara un evento manual de usuario.

### Bloqueo de zoom con rueda
- Endpoint: `/control/control?section=quickcontrol&zoom_lock_wheel=1`
- Resultado: Cambia el comportamiento del zoom con la rueda del ratón.
