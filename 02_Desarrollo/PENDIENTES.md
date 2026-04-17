## FRONTEND
La estructura de la pagina de administracion de la tienda será asi: 
- INICIO: Inicio (Muestra: Stream de la camara, Maquinas en funcionamiento y caja del dia). 
- DOMÓMOTICA: 
    **Nivel de liquidos ya no estará** 
    **Maquinas** (Muestra todas las maquinas, su estado y las opciones que se pueden hacer con ellas)
    **Programador** (Muestra estado de Puerta, luces y ventilacion y permite encender o apagar y programar individualmente cuando se enciende y cuando se apaga automaticamente Ejemplo: En el programador de puerta se puede poner que se abra a las 9:00AM y se cierre a las 22:00PM)
    **Camara** (Muestra el stream de la camara de la tinda)(La camara es de una empresa que se dedica a eso y utiliza la url http://es1034.c14.ovh:1055/control/faststream.jpg?stream=full&fps=16&rand=882006 pero requiere loguin)

- CONTABILIDAD: 
    **Caja** (Tiene tres vistas que permiten ver la caja diaria, la caja semanal, la caja acumulada)(La caja acumulada permite elgir un rango de x dia a x dia, por defecto muestra un rango de un mes)(La caja diaria permite elegir el dia, por defecto muestra el dia actual)(La caja semanal permite elegir la semana, po defecto muestra la semana actual)
    **Informes** (Permite ver las estadisticas de la tienda) 
        + Ciclos (Una tabla con todos los ciclos de la tienda)
        + Evolucion (Tiene una vista para cada tabla un selector de rango y un grafico)
            - Tabla de evolucion semanal (Compara dos semanas, permite seleccionar la semana que se quiere comparar con la anterior)
            - Tabla de evolucion mensual (Compara dos meses, permite seleccionar los meses que se van a comparar)
            - Tabla de evolucion Anual (Compara dos años, permite seleccionar los años que se van a comparar)
        + Estadisticas (Tiene una vista para cada tabla un selector de rango y un grafico)
            - Tabla de tramos diaria (muestra una tabla que muestra facturacion de cada maquina por horas, con los totales y los ciclos de la maquina ese dia: Horizontal {Hora|L1|L2|L3|L4|S1|S2|S3|Total/Hora} Vertical{Horas{facturacion |L1|L2|L3|L4|S1|S2|S3|Total/Hora }|Total/Dia|Ciclos/Dia})
            - Tabla de tramos mensual
            - Tabla de tramos anual
- GESTION: 
    **Usuarios** (Realmente poder gestionar usuarios en Usuarios, solo siendo admin, sino esa vista no sale.)
    **Logs** (Tablas con los logs)
    **Publicaciones**  (Un gestor de la web publica que permita cambiar cosas como horario, about US, contacto y faqs sin tener que tocar codigo)

## Gestion de camara
Loguin: Aun no creado pero se debe loguear para poder acceder a las opciones
Stream: http://es1034.c14.ovh:1055/control/faststream.jpg?stream=full
Implementa soporte de zoom/PTZ para una cámara MOBOTIX.

Base URL:
`http://es1034.c14.ovh:1055`

No expongas credenciales en frontend. Todas las llamadas a la cámara deben salir desde el backend con Basic Auth.

Rutas backend a crear:

* `GET /api/camera/ptz/status`
* `POST /api/camera/zoom`
* `POST /api/camera/ptz/center`

Mapeos reales hacia MOBOTIX:

1. Estado PTZ:

* `GET /control/click.cgi?query`

2. Zoom absoluto:

* `GET /control/click.cgi?zoom=<value>`
* rango válido: `1000..8000`

3. Zoom relativo:

* `GET /control/click.cgi?zoomrel=<value>`
* rango válido: `-10000..10000`
* por seguridad, limitar en la API propia a `-1000..1000`

4. Centrar vista:

* `GET /control/click.cgi?center`

Contrato de `POST /api/camera/zoom`:

* body `{ "mode": "absolute", "value": number }`
* body `{ "mode": "relative", "value": number }`

Validaciones:

* rechazar valores fuera de rango
* devolver errores claros en JSON
* registrar auditoría de acciones PTZ
* proteger las rutas con sesión autenticada de la aplicación

Añadir también helper interno para construir URLs MOBOTIX y reutilizar autenticación.
