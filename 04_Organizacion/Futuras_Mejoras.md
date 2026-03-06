## Arquitectura futura – 2 lavanderías + Alta disponibilidad

Escenario:
- Lavandería A
- Lavandería B
- Cada una con:
  - Router MikroTik
  - Red propia (rangos distintos)
  - Servidor local

Red:

- Lavandería A → 192.168.10.0/24
- Lavandería B → 192.168.20.0/24
- VPN site-to-site entre ambos MikroTik (WireGuard)
- Enrutamiento entre redes a través de la VPN

Servidores:

- Servidor A (Lavandería A)
- Servidor B (Lavandería B)

Configuración en cluster / alta disponibilidad:

- Backend idéntico en ambos
- Mosquitto en ambos
- Base de datos con:
  - Replicación bidireccional o primaria + réplica
- Sincronización de configuración y usuarios

Alta disponibilidad:

- Si cae Servidor A → el sistema continúa en Servidor B.
- Si cae Servidor B → el sistema continúa en Servidor A.
- Los ESP deben:
  - Conectarse a un hostname común (ej: mqtt.sistema.local), o
  - Tener fallback automático (Servidor A → Servidor B).

Claves críticas:

1. Nunca usar el mismo rango IP en ambas sedes.
2. Replicación de datos obligatoria.
3. Sistema automático de detección de caída (failover).
4. DNS interno o mecanismo equivalente para redirigir tráfico.
5. Backups periódicos aunque exista replicación.

Objetivo final:
Infraestructura distribuida donde cada lavandería puede operar de forma autónoma, pero ambas están sincronizadas y pueden asumir la carga si la otra falla.