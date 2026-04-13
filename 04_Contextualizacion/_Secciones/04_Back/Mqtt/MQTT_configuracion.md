# MQTT en Back - Configuracion

## 1. Objetivo

Este documento define la configuracion practica de MQTT para que el backend KWL opere con la capa IoT en produccion local.

Broker objetivo:

- nodo: `LXC_MQTT`
- IP: `192.168.1.53`
- puerto: `1883`

## 2. Requisitos previos

- `VM_CORE (192.168.1.51)` operativo con backend desplegado
- `LXC_MQTT (192.168.1.53)` dentro de LAN `192.168.1.0/24`
- acceso administrativo por VPN o LAN interna
- scripts de despliegue disponibles en `02_Sistema/deploy/lxc_mqtt`

## 3. Configuracion del broker (LXC_MQTT)

Archivo de referencia del proyecto:

- `02_Sistema/deploy/lxc_mqtt/mosquitto/kwl.conf`

Contenido funcional:

- listener en `1883`
- `allow_anonymous false`
- `password_file /etc/mosquitto/passwd`
- persistencia activa
- logging basico

Instalacion recomendada con script:

```bash
cd /opt/kwl/02_Sistema
bash deploy/lxc_mqtt/scripts/install_lxc_mqtt.sh /opt/kwl/02_Sistema
```

## 4. Usuarios y credenciales

Usuario inicial previsto:

- usuario: `kwl`
- clave: definida por administrador

Regla operativa:

- no usar credenciales por defecto en produccion
- rotar clave al pasar de laboratorio a entorno real

## 5. Conectividad de red

Permitir MQTT solo desde red interna:

- origen permitido: `192.168.1.0/24`
- puerto destino: `1883/tcp`

No abrir puerto MQTT en router de Internet.

Verificacion:

```bash
ss -tulpn | grep 1883
```

## 6. Configuracion del backend (VM_CORE)

En el archivo de entorno del backend (`/var/www/kwl/backend/.env`):

```env
MQTT_HOST=192.168.1.53
MQTT_PORT=1883
MQTT_USER=kwl
MQTT_PASS=CAMBIAR_POR_REAL
```

Recomendaciones:

- mantener `.env` fuera de repositorio
- permisos restringidos del archivo en servidor

## 7. Topics operativos del backend

Topics principales consumidos/publicados:

- `kwl/maquinas/lavadora1/comando`
- `kwl/maquinas/lavadora1/estado`
- `kwl/maquinas/lavadora1/evento`
- `kwl/maquinas/lavadora1/telemetria`
- `kwl/maquinas/lavadora1/disponibilidad`
- `kwl/sistema/puerta/comando`
- `kwl/sistema/puerta/estado`
- `kwl/sistema/luces/comando`
- `kwl/sistema/luces/estado`

## 8. Pruebas minimas

Suscriptor:

```bash
mosquitto_sub -h 192.168.1.53 -u kwl -P TU_PASS -t 'kwl/#' -v
```

Publicacion de prueba:

```bash
mosquitto_pub -h 192.168.1.53 -u kwl -P TU_PASS -t kwl/maquinas/lavadora1/comando -m '{"accion":"start"}'
```

Smoke test del script:

```bash
cd /opt/kwl/02_Sistema
bash deploy/lxc_mqtt/scripts/smoke_test_mqtt.sh 192.168.1.53 kwl TU_PASS
```

## 9. Validacion final

Checklist tecnico:

- broker activo y escuchando en `1883`
- autenticacion obligatoria operativa
- backend con variables MQTT correctas
- ESP32 publica `disponibilidad=online`
- comandos enviados desde backend llegan al nodo
- estado/eventos vuelven y quedan trazados en backend

## 10. Incidencias comunes

Problemas habituales y causa probable:

- `Connection Refused`: broker caido o firewall
- `Not authorized`: usuario/clave incorrectos
- sin mensajes en suscriptor: topic incorrecto o nodo desconectado
- desconexiones frecuentes: WiFi inestable o keepalive insuficiente
