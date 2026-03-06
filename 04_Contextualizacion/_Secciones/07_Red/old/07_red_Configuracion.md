# README — Configuración de acceso remoto VPN

## 1. Objetivo

Permitir acceso remoto seguro a la infraestructura del laboratorio mediante una VPN basada en **OpenVPN** configurada en el router.

Esto permite acceder a la red interna desde cualquier ubicación como si el equipo estuviera conectado localmente.

Arquitectura de red:

```
Cliente VPN
     │
     │ OpenVPN
     ▼
kwl.ddns.net
     │
Router Movistar
     │ (Port Forward 1194 UDP)
     ▼
Router TP-Link (OpenVPN)
     │
Red interna
 ├─ Proxmox
 ├─ VM_CORE
 ├─ VM_DATA
 └─ LXC_MQTT
```

---

# 2. Componentes utilizados

Router operador:

```
Router Movistar
```

Router VPN:

```
TP-Link TL-MR6400 - Mikrotik
```

Cliente VPN:

```
OpenVPN - Wireguard
```

Sistema cliente:

```
Fedora Linux
```

DNS dinámico:

```
No-IP
```

---

# 3. Configuración de DDNS

Se utiliza **No-IP** para poder acceder a la red doméstica incluso cuando cambia la IP pública.

Dominio configurado:

```
kwl.ddns.net
```

Configuración en el router:

```
Proveedor: No-IP
Host: kwl.ddns.net
Interfaz: WAN
Usuario: usuario No-IP
Contraseña: DDNS Key
```

Esto permite que el dominio siempre apunte a la IP pública del router.

---

# 4. Redirección de puertos

En el router Movistar se configura un **Port Forwarding** hacia el router TP-Link.

Configuración:

```
Puerto externo: 1194
Protocolo: UDP
IP destino: 192.168.0.20
Puerto interno: 1194
```

Esto permite que las conexiones OpenVPN lleguen al router VPN.

---

# 5. Configuración OpenVPN en el router

En el router TP-Link:

```
Advanced → VPN Server → OpenVPN
```

Configuración principal:

```
Puerto: 1194
Protocolo: UDP
Allow clients to access LAN: Enabled
```

Después se exporta el perfil del cliente:

```
client.ovpn
```

---

# 6. Ajuste del archivo client.ovpn

Para evitar problemas cuando cambie la IP pública se modifica la línea:

```
remote 123.123.123.123 1194
```

por

```
remote kwl.ddns.net 1194
```

Esto permite que el cliente utilice el dominio DDNS.

---

# 7. Problema con Fedora y OpenSSL

El router TP-Link genera certificados con:

```
RSA 1024 bits
```

Fedora utiliza **OpenSSL 3**, que por seguridad **rechaza claves menores de 2048 bits**.

Error típico al conectar:

```
OpenSSL: ee key too small
```

Esto impide iniciar la conexión OpenVPN.

---

# 8. Solución: Crypto Policies

Fedora permite modificar la política criptográfica del sistema.

Política por defecto:

```
DEFAULT
```

Política necesaria para aceptar certificados antiguos:

```
LEGACY
```

---

# 9. Activar política LEGACY

Antes de conectar la VPN ejecutar:

```
sudo update-crypto-policies --set LEGACY
```

Esto permite aceptar certificados RSA1024 generados por el router.

---

# 10. Restaurar política segura

Después de usar la VPN se recomienda volver a la política segura:

```
sudo update-crypto-policies --set DEFAULT
```

---

# 11. Comprobar estado de la política

Para ver la política actual:

```
update-crypto-policies --show
```

Ejemplo de salida:

```
DEFAULT
```

---

# 12. Conectar a la VPN

Con la política LEGACY activa se puede iniciar la conexión:

```
sudo openvpn --config client.ovpn
```

Si la conexión es correcta aparecerá:

```
Initialization Sequence Completed
```

Esto crea una interfaz virtual de red:

```
tun0
```

---

# 13. Verificar conexión

Comprobar la interfaz VPN:

```
ip a
```

Probar acceso a la red interna:

```
ping 192.168.0.20
```

Si responde, la VPN está funcionando correctamente.

---

# 14. Seguridad

El uso de la política `LEGACY` reduce la seguridad del sistema porque permite algoritmos criptográficos antiguos.

Por ello se recomienda:

```
activar LEGACY solo mientras se utiliza la VPN
```

y volver después a:

```
DEFAULT
```

---

# 15. Mejora futura

Para la infraestructura final del proyecto se recomienda migrar a:

```
WireGuard
```

Ventajas:

* configuración más simple
* mayor rendimiento
* criptografía moderna
* sin dependencia de certificados antiguos

La implementación futura se realizará en el router MikroTik de la infraestructura final.
