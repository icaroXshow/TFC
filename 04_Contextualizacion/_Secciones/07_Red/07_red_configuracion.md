# README — Configuración de red y acceso remoto con MikroTik + WireGuard

## 1. Propósito del documento

Este documento describe cómo configurar desde cero la red principal del proyecto utilizando un router MikroTik y acceso remoto seguro mediante WireGuard.

Su objetivo es servir como guía práctica para reconstruir la infraestructura de red cuando se sustituya el router actual por el MikroTik.

La configuración está planteada para:

- mantener la red local del sistema
- permitir acceso remoto seguro
- no exponer Proxmox ni los servicios internos directamente a Internet
- integrar correctamente el servidor y los dispositivos IoT

---

# 2. Arquitectura objetivo

La arquitectura final prevista es la siguiente:

Cliente remoto
     │
     │ WireGuard
     ▼
IP pública / DDNS
     │
Router ISP
     │
     ▼
Router MikroTik
     │
Red LAN 192.168.1.0/24
 ├─ Proxmox      192.168.1.50
 ├─ VM_CORE      192.168.1.51
 ├─ VM_DATA      192.168.1.52
 └─ LXC_MQTT     192.168.1.53

El acceso remoto se realizará mediante WireGuard, que MikroTik documenta en RouterOS como su solución VPN moderna y de alto rendimiento. WireGuard está soportado en RouterOS v7. :contentReference[oaicite:0]{index=0}

---

# 3. Datos de red previstos

## Red LAN

- Red: 192.168.1.0/24
- Gateway: 192.168.1.1
- Router: MikroTik hAP ax2

## Direcciones reservadas

| Sistema | IP | Función |
|---------|----|---------|
| Router MikroTik | 192.168.1.1 | Gateway |
| Proxmox | 192.168.1.50 | Host de virtualización |
| VM_CORE | 192.168.1.51 | Backend + Web + Redis |
| VM_DATA | 192.168.1.52 | MariaDB |
| LXC_MQTT | 192.168.1.53 | Broker MQTT |

## Red VPN WireGuard

- Red VPN propuesta: 10.8.0.0/24
- IP del router en WireGuard: 10.8.0.1
- Clientes remotos: 10.8.0.2 en adelante

---

# 4. Requisitos previos

Antes de empezar conviene tener preparado:

- MikroTik conectado y accesible por WinBox o interfaz web
- RouterOS actualizado a una versión v7 estable
- acceso administrativo al router ISP si el MikroTik queda detrás de otro router
- IPs definitivas de la LAN
- lista de clientes WireGuard que se van a crear

MikroTik recomienda mantener RouterOS actualizado y usar WireGuard o IPsec para acceso remoto en lugar de abrir puertos de gestión a Internet. :contentReference[oaicite:1]{index=1}

---

# 5. Paso 1 — Configuración inicial del MikroTik

## Objetivo

Dejar el MikroTik como router principal de la red interna.

## Acciones

1. Conectar un equipo por cable al MikroTik.
2. Acceder mediante WinBox o WebFig.
3. Cambiar la contraseña del usuario administrador.
4. Actualizar RouterOS si es necesario.
5. Confirmar que el MikroTik será el gateway de la LAN.

## Configuración prevista

- IP LAN del MikroTik: 192.168.1.1/24
- DHCP activo para clientes normales
- IPs fijas reservadas para servidor y servicios principales

## Recomendaciones

- no exponer WinBox, WebFig ni SSH al exterior
- mantener activas las reglas de firewall por defecto salvo que se entienda muy bien lo que se toca

MikroTik indica que el firewall preconfigurado bloquea accesos desde WAN y que esto no debe eliminarse sin una alternativa segura. :contentReference[oaicite:2]{index=2}

---

# 6. Paso 2 — Configurar la red LAN

## Objetivo

Establecer la red interna donde vivirán Proxmox, las VMs y los dispositivos IoT.

## Configuración

- Red LAN: 192.168.1.0/24
- Gateway: 192.168.1.1
- DHCP: habilitado para clientes dinámicos
- Servidor: IPs manuales o reservas DHCP

## Distribución recomendada

- 192.168.1.1 → MikroTik
- 192.168.1.2 a 192.168.1.49 → infraestructura auxiliar o gestión
- 192.168.1.50 a 192.168.1.59 → servidor y servicios principales
- resto → clientes, móviles, portátiles, pruebas

## Resultado esperado

Todos los dispositivos del sistema deben poder comunicarse dentro de la red local sin depender de Internet.

---

# 7. Paso 3 — Configurar IPs estáticas del servidor

## Objetivo

Que toda la infraestructura crítica tenga direccionamiento fijo.

## Asignaciones

- Proxmox → 192.168.1.50
- VM_CORE → 192.168.1.51
- VM_DATA → 192.168.1.52
- LXC_MQTT → 192.168.1.53

## Verificaciones

Desde un equipo de la LAN comprobar:

- ping 192.168.1.50
- ping 192.168.1.51
- ping 192.168.1.52
- ping 192.168.1.53

Y acceso web:

- https://192.168.1.50:8006
- http://192.168.1.51

---

# 8. Paso 4 — Configurar WireGuard en MikroTik

## Objetivo

Permitir acceso remoto seguro a la red interna.

WireGuard en MikroTik se configura creando una interfaz, asignándole una clave privada, añadiendo dirección IP a esa interfaz y definiendo peers con sus claves públicas y sus direcciones permitidas. Eso forma parte del flujo oficial de configuración de RouterOS. :contentReference[oaicite:3]{index=3}

## Configuración lógica prevista

### Interfaz WireGuard del router

- Nombre: wg-kwl
- Puerto: 51820/UDP
- Dirección del router en VPN: 10.8.0.1/24

### Clientes

Ejemplo:

- Cliente portátil → 10.8.0.2/32
- Cliente móvil → 10.8.0.3/32
- Cliente profesor 1 → 10.8.0.10/32
- Cliente profesor 2 → 10.8.0.11/32

## Flujo general

1. Crear interfaz WireGuard.
2. Generar clave privada del router.
3. Asignar IP 10.8.0.1/24 a la interfaz.
4. Crear peers para cada cliente.
5. Permitir tráfico UDP 51820 al router.
6. Permitir reenvío desde WireGuard hacia la LAN.
7. Configurar cliente con clave privada, endpoint y allowed IPs.

---

# 9. Paso 5 — Crear los peers de WireGuard

## Objetivo

Dar acceso individual a cada cliente remoto.

Cada cliente debe tener:

- clave privada propia
- clave pública derivada
- una IP VPN exclusiva
- configuración de endpoint apuntando al MikroTik

MikroTik documenta que en cada peer se definen claves públicas y rangos de direcciones permitidas. :contentReference[oaicite:4]{index=4}

## Ejemplo conceptual de reparto

| Cliente | IP VPN | Acceso |
|---------|--------|--------|
| Portátil administración | 10.8.0.2 | Red completa del laboratorio |
| Móvil administración | 10.8.0.3 | Acceso básico |
| Profesor 1 | 10.8.0.10 | Acceso controlado |
| Profesor 2 | 10.8.0.11 | Acceso controlado |

## Recomendación

Usar un peer distinto por dispositivo.  
No reutilizar el mismo perfil para varias personas. Eso luego convierte la auditoría en sopa cósmica.

---

# 10. Paso 6 — Configurar firewall del MikroTik

## Objetivo

Permitir la VPN sin exponer innecesariamente el router.

## Reglas mínimas necesarias

1. Permitir entrada UDP 51820 desde WAN al router.
2. Permitir tráfico desde la interfaz WireGuard hacia la LAN.
3. Mantener bloqueado el acceso directo desde Internet a servicios de gestión.

En RouterOS, el firewall se divide en módulos como filter y nat, y las reglas se organizan por cadenas. Para acceso seguro, MikroTik recomienda proteger el acceso de gestión y usar VPN en vez de abrir puertos administrativos a Internet. :contentReference[oaicite:5]{index=5}

## Importante

No abrir:

- puerto 8006 de Proxmox a Internet
- SSH del servidor a Internet
- panel web a Internet

Todo eso debe seguir yendo por VPN.

---

# 11. Paso 7 — Configurar NAT o no configurarlo

## Escenario A — MikroTik como router directamente conectado a Internet

En este caso normalmente el propio router ya hará NAT de salida para la LAN, según la configuración habitual del equipo. MikroTik indica en Quick Set que NAT suele mantenerse activo en redes domésticas o pequeñas cuando no se dispone de direccionamiento público también para la red interna. :contentReference[oaicite:6]{index=6}

## Escenario B — MikroTik detrás del router del operador

Si el MikroTik queda detrás del router ISP, entonces hay que redirigir el puerto UDP 51820 desde el router ISP hacia la IP WAN del MikroTik.

MikroTik documenta el port forwarding mediante dst-nat hacia una IP y puerto internos concretos. :contentReference[oaicite:7]{index=7}

## Resumen práctico

- si MikroTik recibe Internet directamente → no hay que hacer port forward en otro router
- si MikroTik está detrás del router del operador → sí hay que abrir UDP 51820 hacia él

---

# 12. Paso 8 — Configurar DDNS

## Objetivo

Poder conectar a la VPN aunque cambie la IP pública.

MikroTik dispone de servicio Cloud con DDNS propio; al habilitarlo, el router registra un nombre DNS que apunta a la última IP pública que el equipo haya enviado al servicio. :contentReference[oaicite:8]{index=8}

## Opciones

### Opción 1 — MikroTik Cloud

Ventaja:

- integrado en el router
- simple de mantener

### Opción 2 — servicio externo

También podría usarse otro proveedor DDNS si fuese necesario.

## Recomendación

Usar el DDNS propio del MikroTik salvo que haya una razón concreta para no hacerlo.

---

# 13. Paso 9 — Configurar el cliente WireGuard

## Objetivo

Conectar un portátil o móvil remoto a la red del laboratorio.

## Datos que debe llevar el cliente

- clave privada del cliente
- clave pública del router
- endpoint: dominio DDNS o IP pública del router
- puerto: 51820
- address: IP del cliente en la red VPN
- allowed IPs: al menos 10.8.0.0/24 y 192.168.1.0/24

MikroTik usa el concepto de allowed-address/allowed IPs para definir qué direcciones se enrutan por el túnel y qué IPs se aceptan para cada peer. :contentReference[oaicite:9]{index=9}

## Comportamiento esperado

Tras conectar, el equipo remoto debe poder alcanzar:

- 192.168.1.50
- 192.168.1.51
- 192.168.1.52
- 192.168.1.53

---

# 14. Paso 10 — Verificaciones finales

## Comprobaciones desde cliente remoto

1. El túnel WireGuard conecta correctamente.
2. Se recibe IP de la red 10.8.0.0/24.
3. Responde el router 192.168.1.1.
4. Responde Proxmox 192.168.1.50.
5. Responde VM_CORE 192.168.1.51.
6. Se abre la interfaz web de Proxmox.
7. Se abre el panel web.

## Pruebas recomendadas

- ping 10.8.0.1
- ping 192.168.1.50
- ping 192.168.1.51
- acceso a https://192.168.1.50:8006
- acceso a http://192.168.1.51

---

# 15. Paso 11 — Seguridad mínima recomendada

## Reglas prácticas

- no publicar Proxmox en Internet
- no publicar SSH de las VMs en Internet
- usar un peer distinto por usuario o dispositivo
- revocar peers que ya no se usen
- mantener RouterOS actualizado
- conservar firewall por defecto y añadir solo lo necesario
- usar VPN para administración remota

MikroTik recomienda explícitamente usar WireGuard o IPsec para acceso remoto y no abrir puertos de gestión al exterior sin protección. :contentReference[oaicite:10]{index=10}

---

# 16. Orden recomendado de despliegue

Para evitar liarte con veinte cacharros gritando a la vez, este sería el orden sensato:

1. Configurar MikroTik en LAN local.
2. Confirmar gateway 192.168.1.1.
3. Confirmar acceso a Proxmox y VMs dentro de la LAN.
4. Configurar WireGuard en el MikroTik.
5. Configurar un único cliente de prueba.
6. Validar acceso remoto.
7. Crear el resto de peers.
8. Documentar perfiles y accesos.

---

# 17. Resultado final esperado

La red debe quedar funcionando así:

Cliente remoto
     │
     │ WireGuard
     ▼
DDNS / IP pública
     │
Router ISP
     │
Router MikroTik
     │
LAN 192.168.1.0/24
 ├─ Proxmox      192.168.1.50
 ├─ VM_CORE      192.168.1.51
 ├─ VM_DATA      192.168.1.52
 └─ LXC_MQTT     192.168.1.53

Con este diseño, toda la infraestructura sigue siendo local, el acceso remoto es seguro y los servicios internos no quedan expuestos directamente a Internet.