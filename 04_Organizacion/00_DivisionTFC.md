
Como para el TFC tengo 2 meses y para el proyecto real 8 meses haremos solo una version basica para el TFC. 
Esta version debe tener: 

## DIVISION PROYECTO
Previo:
- Identidad Visual - Penpot
- Infraestructura Red - WireGuard
- Configuración Servidor - Proxmox
Dev:
- Desarrollo Frontend
- Desarrollo Backend
- Desarrollo BaseDatos - MariaDB
- Desarrollo Domotica - ArduinoIDE<>Clone5<>Mosquitto

Frontend (Web Responsive)
        │
        ▼
Backend (API PHP)
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
MariaDB Redis  Mosquitto
                    │
                    ▼
                 ESP32
                 
Entrega:
- Documentacion - Office365
- Maquetacion - Drawio<>HTML
- PDF
## HARWARE
- Controladores Lavadora (ESP32 + optoacopldores + Mosfet + Monedero + Fuente 24V + Antena wifi)
- Servidor ( ThinkCenter: Intel i5 + 16Gb Ram + Proxmox)
- Router VPN y 2 SSDI (MicroTik hAP ax2)
- Vigilancia (MOBOTIX Ip CAM + MOBOTIX Ip SPEAKER)
- Puerta y Luces (Rele puerta + Reles luces + Rele Ventilación)

## SOFTWARE
Responsive Frontend:
 + Panel control 
 + Datos de actividad 
 + Vista CAM 
 + Estado y control maquinas 
 + Gestion Usuarios 
 + Control y automatización de Tienda
Backend:
 + Sevidor Nginx 
 + Base datos MariaDB 
 + Cache Redis 
 + Servicio Comunicacion Mosquitto
IoT (ESP32):
 + Conexión WiFi
 + Cliente MQTT
 + Gestión de comandos
 + Control relés
 + Pulsos monedero 
 + Envío estado y ACK
 + Watchdog


## TECNOLOGÍAS 
- VPN (WireGuard)
- Proxmox + VM (UbuntuServer)
- Nginx
- PHP + HTML/CSS/JS
- MariaDB
- Mosquitto (MQTT)
- Redis
- ESP32
- WebSockets

## SECCIONES

_Secciones/
│
├── 00_resumen_proyecto.md
├── 01_Inicio/
│   ├── 01_arquitectura_general.md
│   └── 01_infraestructura.md
│ 
├── 02_Servidor/
│   ├── 02_01_sistema_operativo.md
│   ├── 02_02_instalacion_servicios.md
│   ├── 02_03_configuracion_nginx.md
│   ├── 02_04_configuracion_mariadb.md
│   ├── 02_05_configuracion_redis.md
│   ├── 02_06_configuracion_mosquitto.md
│   ├── 02_07_configuracion_websocket.md
│   ├── 02_08_seguridad_servidor.md
│   └── 02_09_backups_y_mantenimiento.md
│
├── 03_Back/
│   ├── 03_01_estructura_backend.md
│   ├── 03_02_autenticacion.md
│   ├── 03_03_maquinas.md
│   ├── 03_04_creditos.md
│   ├── 03_05_auditoria.md
│   ├── 03_06_mqtt.md
│   ├── 03_07_websocket.md
│   └── 03_08_api_endpoints.md
│
├── 04_Front/
│   ├── 04_01_estructura_frontend.md
│   ├── 04_02_layout_general.md
│   ├── 04_03_panel_control.md
│   ├── 04_04_estado_maquinas.md
│   ├── 04_05_vista_camaras.md
│   ├── 04_06_gestion_usuarios.md
│   └── 04_07_tiempo_real.md
│
├── 05_BaseDatos/
│   ├── 05_01_modelo_relacional.md
│   ├── 05_02_tablas.md
│   ├── 05_03_relaciones.md
│   └── 05_04_justificacion_diseño.md
│
├── 06_Domotica/
│   ├── 06_01_arquitectura_iot.md
│   ├── 06_02_esp32_configuracion.md
│   ├── 06_03_relés_y_pulsos.md
│   └── 06_04_protocolo_mqtt.md
│
├── 07_RED/
│   ├── 07_01_topologia_red.md
│   ├── 07_02_configuracion_vpn.md
│   ├── 07_03_segmentacion.md
│   └── 07_04_politicas_acceso.md
.
