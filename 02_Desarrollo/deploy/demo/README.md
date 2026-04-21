# deploy/demo

Despliegue **demo/evaluación** (Para poder ejecutar en Windows local).

- Ejecutar (Varias veces si es necesario): 

 ```bash 
cd 02_Desarrollo/deploy/demo
powershell.exe -ExecutionPolicy Bypass -File auto_deploy.ps1
```
## MariaDB (demo)

Levanta MariaDB con el esquema desde `context/db/BD_modelo_fisico.sql` y datos mínimos de ejemplo.

1. Arranca:
   - `cd deploy/demo`
   - `docker compose up -d`
2. Comprueba:
   - `docker compose logs -f mariadb`

Credenciales demo (para login bd):

- DB: `kwl_lavanderia`
- User: `root`
- Pass: `demo`
- Host: `127.0.0.1`
- Port: `3307`

Usuario demo (para login backend):

- login: `admin@gmail.com`
- password: `admin`
