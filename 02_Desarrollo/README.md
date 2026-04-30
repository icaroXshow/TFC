# 02_Sistema

## Descripción general

`02_Sistema` contiene el desarrollo completo del sistema de gestión de la lavandería, incluyendo:

* lógica de negocio (backend)
* interfaz web (frontend)
* simulación de dispositivos fisicos como las lavadora e interruptores para poder testear.
* definición conceptual del sistema
* despliegue en entorno real y entorno de evaluación y testeo

El sistema está diseñado como una arquitectura distribuida basada en eventos, donde los dispositivos físicos (o simulados) se comunican con el backend mediante MQTT. En la versión actual los paneles web consultan la API; Redis se usa para caché de estado/configuración IoT y WebSockets quedan como evolución de tiempo real.

---

## Arquitectura del sistema

El sistema se compone de los siguientes elementos:

* **Backend**: gestiona la lógica, usuarios, máquinas y eventos
* **Frontend**: interfaz web de control y monitorización
* **MariaDB**: persistencia de datos
* **Redis**: caché activa de estado/configuración IoT y base para evolución de tiempo real
* **MQTT**: comunicación con dispositivos (ESP32 o simulador)
* **WebSockets**: previstos para una iteración posterior
* **Simulador**: permite probar el sistema sin hardware físico

### Flujo general

```
Dispositivos (ESP32 / Simulación)
        ↓
       MQTT
        ↓
      Backend
   ├── MariaDB (persistencia)
   └── API HTTP
        ↓
     Frontend

Redis activo para lecturas rápidas de IoT; WebSockets evolución prevista para actualización push.
```

---

## Estructura del proyecto

```text
02_Sistema/
├── context/       → definición conceptual del sistema
├── docs/          → documentación explicativa
├── app/           → código (backend + frontend)
├── simulation/    → simulador de dispositivos
├── server/        → configuración de la infraestructura real
└── deploy/        → despliegue (real y demo)
```

---

## Descripción de carpetas

### `context/`

Define el sistema antes de implementarlo:

* dominio (entidades, estados, eventos, acciones)
* API
* MQTT
* reglas del sistema

Es la fuente de verdad conceptual.

---

### `docs/`

Documentación de apoyo:

* arquitectura
* despliegue
* pruebas
* decisiones técnicas

---

### `app/`

Código del sistema:

* backend (API y lógica)
* frontend (panel web)
* componentes compartidos

No incluye infraestructura ni despliegue.

---

### `simulation/`

Simulador de dispositivos:

* lavadora
* ventilador
* puerta (persiana)
* luces

Permite probar el sistema sin hardware real.

---

### `deploy/`

Despliegue del sistema en distintos entornos:

* entorno real (infraestructura en servidor)
* entorno demo (una sola máquina con simulador para evaluación)

---

## Redis en el sistema

Redis se usa actualmente como caché de apoyo para:

* caché de estados de acceso frecuente
* soporte de tiempo real junto con WebSockets

Redis no sustituye a MariaDB: si Redis falla, el backend sigue operando con BD (fallback).

---

## Objetivo del proyecto

El objetivo es construir un sistema modular, escalable y desacoplado que permita:

* gestionar máquinas de lavandería
* monitorizar estados en tiempo real
* controlar dispositivos físicos o simulados
* facilitar despliegue tanto en entorno real como en entorno de evaluación

---

## Notas

* El sistema está diseñado para funcionar tanto con hardware real (ESP32) como con un simulador.
* La arquitectura prioriza la separación de responsabilidades y la comunicación mediante eventos.
* La versión de evaluación permite ejecutar el sistema completo en una única máquina.

---

## Punto de entrada recomendado

Para entender el sistema, se recomienda seguir este orden:

1. `context/`
2. `docs/`
3. `app/`
4. `simulation/`
5. `deploy/`

---

## Despliegue demo recomendado

Ruta rápida (Windows, recomendado):

```powershell
cd 02_Desarrollo/deploy/demo
.\Launcher.bat
```

En el menú:
- `1` instala WSL + Docker (solo primera vez)
- `2` lanza/reinicia el proyecto
- `3` muestra estado y logs

Ruta manual (Windows PowerShell):

```powershell
cd 02_Desarrollo/deploy/demo
copy .env.example .env
docker compose up -d --build
```

Ruta manual (Linux con sudo):

```bash
cd 02_Desarrollo/deploy/demo
sudo cp -n .env.example .env
sudo docker compose up -d --build
```

El despliegue:
- crea `.env` desde `.env.example` si falta
- levanta `docker compose`
- verifica `health` y frontend
