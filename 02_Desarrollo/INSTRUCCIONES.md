# Instrucciones de despliegue

## Opción 1: Lanzamiento automático y udo de app (Windows, recomendado)

### PASO A PASO:

1. Abrir PowerShell.
2. Ir a ` 02_Desarrollo\deploy\demo `.
3. Ejecutar: ` .\Launcher.bat `
4. En el menú usar, en este orden:
    - Instalar WSL + Docker (solo la primera vez)(A veces se cierra, debes relanzar el launcher).
    - Lanzar demo.
    - Estado / logs.
5. Una vez desplegado:
    - Comprobar estado en  `http://127.0.0.1:8080/health`
    - Abrir el frontend `http://127.0.0.1:8081/index.html` y loguearse con:
        User: admin@gmail.com 
        Pass:admin
    - Abrir Adminer `http://127.0.0.1:8082` y loguearse con:
        Server: mariadb
        User: root 
        Pass: demo
        Database: kwl_lavanderia
    - Abrir Simulador en `http://127.0.0.1:8083`
6. Ver la guia de uso `TFC\02_Desarrollo\GUIA.pdf` para entender como funciona y que se puede testear.


Notas:
- Si Docker/WSL no está instalado, primero ejecutar la opción `Instalar WSL + Docker` o para evitar fallos manuales instalalo manualmente.
- Si ya hay contenedores corriendo, la opción `2` los reinicia y vuelve a levantar para refrescar backend y BD.

## Opción 2: Lanzamiento manual (Windows)

### 1) Instalar Docker Desktop + WSL2

1. Instalar Docker Desktop para Windows (descargas el .exe desde su web) y WSL (En el CMD usas WSL --install).
2. Durante la instalación, dejar activado uso de WSL2.
3. Reiniciar Windows si lo pide.
4. Abrir Docker Desktop y esperar a que quede en estado "Running".
    ** Importante: revisar que use el entorno WSL.

### 2) Preparar proyecto

```powershell
cd 02_Desarrollo\deploy\demo
```

Si no existe `.env`, crearlo desde ejemplo:

```powershell
copy .env.example .env
```

### 3) Levantar contenedores

```powershell
docker compose up -d --build
```

### 4) Comprobar estado

```powershell
docker compose ps
curl http://127.0.0.1:8080/health
```

### 5) Abrir la demo

- Frontend: `http://127.0.0.1:8081/index.html`
- Simulador GUI: `http://127.0.0.1:8083`
- Backend health: `http://127.0.0.1:8080/health`
- Adminer: `http://127.0.0.1:8082`

### 6) Parar / reiniciar

Parar:

```powershell
docker compose down
```

Reiniciar con borrado de volúmenes (reset BD):

```powershell
docker compose down -v
docker compose up -d --build
```

## LINUX (usando sudo)

```bash
cd /ruta/02_Desarrollo/deploy/demo
sudo cp -n .env.example .env
sudo docker compose up -d --build
sudo docker compose ps
curl http://127.0.0.1:8080/health
```

Parar:
```bash
sudo docker compose down
```
Reset BD:
```bash
sudo docker compose down -v
sudo docker compose up -d --build
```
En Fedora 43 se puede usar el script de despliegue que esta dentro de deploy/demo

