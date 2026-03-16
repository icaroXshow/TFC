# DATASHEET – Router MikroTik hAP ax2

---

## 1. Identificación
- Modelo: hAP ax2
- Fabricante: MikroTik
- Categoría: Router / Gateway de red
- Ubicación física: Infraestructura de red de la lavandería
- Nivel de criticidad: Crítico

---

## 2. Descripción y Función en el Sistema
El MikroTik hAP ax2 actúa como router interno del sistema LAVANDERÍA KWL.
Gestiona la red LAN interna y proporciona acceso remoto seguro mediante VPN.

Funciones principales:
- Segmentación de red
- Acceso remoto mediante WireGuard
- Firewall
- Enrutamiento LAN

---

## 3. Especificaciones Técnicas (Fabricante)
CPU: ARM quad‑core 864 MHz  
RAM: 1 GB  
Ethernet: 5 × Gigabit Ethernet  
WiFi: WiFi 6 (802.11ax)  
Sistema operativo: RouterOS  
Alimentación: 12‑28V DC  
Consumo aproximado: ~10W

---

## 4. Implementación en LAVANDERÍA KWL
El router se utiliza para:
- gestionar la red LAN interna
- proporcionar acceso remoto seguro mediante VPN WireGuard
- aislar el servidor de acceso directo desde Internet

Topología simplificada:

Internet  
→ Router Movistar  
→ MikroTik hAP ax2  
→ Red LAN  
→ Servidor + dispositivos IoT

---

## 5. Seguridad y Dependencias
- Firewall configurado
- Acceso remoto únicamente mediante VPN
- Servidor no expuesto a Internet

---

## 6. Riesgos y Consideraciones Técnicas
Si el router falla:

- se pierde acceso remoto
- los dispositivos LAN podrían quedar incomunicados

Las máquinas seguirían funcionando manualmente.