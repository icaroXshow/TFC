# DATASHEET – Router Movistar HGU Mitrastar GPT-2541GNAC

## 1. Identificación

- **Modelo:** Smart WiFi HGU GPT-2541GNAC
- **Fabricante:** Mitrastar
- **Categoría:** Router ISP / Gateway de Internet
- **Ubicación física:** Infraestructura de red de la lavandería
- **Nivel de criticidad:** Medio

---

## 2. Descripción y Función en el Sistema

El router **Movistar HGU** es el dispositivo proporcionado por el proveedor de Internet y actúa como **puerta de enlace entre la red local de la lavandería e Internet**.

Este equipo integra:

- ONT de fibra óptica
- router NAT
- punto de acceso WiFi

Dentro del sistema **LAVANDERÍA KWL**, su función es proporcionar conectividad a Internet tanto para:

- el router interno MikroTik
- la red WiFi de clientes de la lavandería

El sistema de control de la lavandería **no depende directamente de este router para funcionar localmente**, ya que todos los servicios críticos se ejecutan en la red interna.

---

## 3. Especificaciones Técnicas (Fabricante)

- **Tipo:** Router HGU (Home Gateway Unit)
- **Conectividad WAN:** Fibra óptica FTTH integrada
- **Puertos Ethernet:** 4 × Gigabit Ethernet
- **WiFi:** Dual Band 2.4 GHz / 5 GHz
- **NAT:** Soportado
- **DHCP:** Integrado
- **Firewall:** Básico
- **Alimentación:** Adaptador externo

---

## 4. Implementación en LAVANDERÍA KWL

Topología de red:

Internet  
→ Router Movistar HGU  
→ Router MikroTik hAP ax2  
→ Red LAN interna  
→ Servidor + dispositivos IoT

Configuración utilizada:

- WiFi activo para clientes
- Puerto abierto hacia el MikroTik para acceso VPN
- MikroTik utilizado como router interno y control de red

---

## 5. Seguridad y Dependencias

- Exposición directa a Internet
- Seguridad principal delegada al router MikroTik
- Acceso remoto al sistema únicamente mediante VPN

Dependencias:

- conexión de fibra óptica
- alimentación eléctrica

---

## 6. Riesgos y Consideraciones Técnicas

Posibles fallos:

- caída de conexión a Internet
- reinicio del router
- fallo de red WiFi

Impacto en el sistema:

- pérdida de acceso remoto
- el sistema local de control continúa funcionando dentro de la red LAN
