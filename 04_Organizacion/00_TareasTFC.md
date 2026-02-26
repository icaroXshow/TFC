🔵 INFRAESTRUCTURA

Instalar Proxmox en servidor físico
Crear VM Ubuntu Server
Configurar red LAN en VM
Configurar acceso SSH seguro

Configurar WireGuard en MikroTik
Verificar acceso remoto por VPN

Instalar Nginx
Instalar PHP
Instalar MariaDB
Instalar Redis
Instalar Mosquitto

Configurar firewall básico en VM

🔵 BACKEND BASE

Crear estructura inicial del proyecto PHP
Configurar conexión a base de datos
Crear tabla usuarios

Implementar sistema de login
Implementar sistema de roles

Crear middleware de autenticación

Crear tabla máquinas
Crear tabla comandos
Crear tabla auditoría
Crear tabla créditos

Implementar endpoint emitir comando
Implementar registro automático de auditoría

🔵 MQTT

Definir estructura de topics
Implementar publicador MQTT en backend
Implementar listener MQTT en backend
Registrar ACK recibido en base de datos
Probar envío y recepción con cliente MQTT de prueba

🔵 ESP32 (IoT)

Configurar entorno ESP32

Conectar ESP32 a WiFi
Conectar ESP32 a Mosquitto

Implementar recepción de comandos
Implementar envío de ACK
Implementar control relé ON/OFF
Implementar reinicio con temporizador
Implementar pulsos de crédito
Implementar control puerta subir/bajar
Implementar control luces

Añadir watchdog básico

🔵 FRONTEND

Crear estructura HTML base
Crear layout principal

Implementar pantalla login

Crear dashboard principal
Mostrar estado máquinas

Implementar botones control máquinas
Implementar control puerta
Implementar control luces
Implementar vista cámaras
Implementar sección usuarios
Implementar indicadores tienda abierta/cerrada

Conectar WebSocket para tiempo real

🔵 OPERACIÓN TIENDA

Crear tabla estado tienda
Implementar endpoint abrir tienda
Implementar endpoint cerrar tienda
Automatizar puerta al abrir/cerrar
Automatizar luces al abrir/cerrar
Automatizar ventilación al encender/apagar
Bloquear créditos si tienda cerrada

Configurar acceso a cámaras en red local
Probar acceso vía VPN
Integrar vista iframe en panel
Restringir acceso por rol

🔵 DOCUMENTACIÓN

Crear diagrama arquitectura general
Crear diagrama red
Crear diagrama MER
Diagrama VMs
Diagrama flujo MQTT
Crear esquema eléctrico básico

Documentar instalación servidor
Documentar estructura backend
Documentar arquitectura IoT
Documentar seguridad aplicada
Documentar pruebas funcionales
Documentar limitaciones

Redactar conclusiones