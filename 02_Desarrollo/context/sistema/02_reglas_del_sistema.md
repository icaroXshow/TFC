# Reglas del sistema

## Reglas generales

1. El backend es el centro de decisión del sistema.
2. Los dispositivos no contienen lógica de negocio crítica.
3. Toda acción importante debe quedar registrada.
4. Los dispositivos no acceden directamente a la base de datos.
5. La comunicación con dispositivos se realiza mediante MQTT.
6. El frontend no controla hardware directamente; siempre pasa por la API.
7. El sistema debe poder funcionar con hardware real o con simulación.
8. El sistema debe funcionar completamente en infraestructura local.
9. El acceso administrativo remoto se realiza exclusivamente mediante VPN.
10. Redis se usa para caché operativa y soporte de tiempo real.
11. MariaDB se usa para persistencia, histórico, auditoría y contabilidad.
12. El estado rápido del sistema no sustituye al histórico persistente.

---

## Reglas de arquitectura

1. `VM_CORE` sirve panel web, backend, Redis y tiempo real.
2. `VM_DATA` almacena la información persistente.
3. `LXC_MQTT` actúa como broker de mensajería IoT.
4. `LXC_SIM` ejecuta el simulador en el entorno real cuando se necesiten pruebas sin hardware.
5. El sistema debe poder escalar en el futuro a varias lavanderías.

---

## Reglas de trazabilidad

1. Toda acción administrativa relevante debe registrarse en auditoría.
2. Todo evento técnico relevante debe registrarse en log de máquina.
3. Toda entrada económica aplicada a una máquina debe quedar registrada.
4. Los ciclos deben conservar los valores aplicados en el momento del arranque.
5. Un cambio futuro de tarifas no debe romper el histórico.

---

## Reglas de dominio económico

1. Cada máquina pertenece a una lavandería.
2. Cada máquina trabaja con una tarifa aplicable.
3. Un ciclo representa una ejecución real de máquina.
4. El dinero introducido antes del arranque se guarda acumulado, no moneda a moneda.
5. Durante un ciclo, cada incremento económico puede traducirse en tiempo extra.
6. Lo añadido desde web se registra contablemente como bonificación, aunque la máquina lo reciba como saldo normal.
7. Debe distinguirse siempre entre dinero real del cliente y bonificación manual.

---

## Regla de implementación

No se debe programar una parte del sistema contradiciendo lo definido en esta carpeta.
