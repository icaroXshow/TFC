# Frontend del Sistema KWL

## 1. Objetivo del panel web

El panel web es la interfaz operativa del sistema para control diario de lavanderia.

Debe permitir al usuario:

- ver estado de maquinas en tiempo real
- lanzar acciones operativas autorizadas
- revisar actividad, auditoria y eventos
- consultar informacion de caja

## 2. Usuarios del sistema

Perfiles en MVP:

- cliente final: solo consume landing publica informativa
- `ADMIN`: unico perfil con inicio de sesion y control operativo

El frontend separa claramente zona publica y zona privada de administracion.

## 3. Vistas principales del MVP

Pantallas prioritarias:

- dashboard general de estado
- control de maquinas
- control de tienda (puerta y luces)
- camaras IP del local
- resumen de movimientos/caja del dia

## 4. Relacion con backend

El frontend no ejecuta logica critica.

Su responsabilidad es:

- consumir API HTTP del backend
- representar estado de forma clara
- enviar solicitudes de accion con trazabilidad

Toda validacion critica se realiza en backend.

## 5. Tiempo real

En MVP se plantea actualizacion periodica de datos via polling.

En fase posterior se migrara a WebSocket para:

- reducir latencia visual
- actualizar panel sin recargar
- mejorar experiencia en eventos de maquina

## 6. Diseno responsive

Criterios de diseno:

- uso principal en escritorio del operador
- compatibilidad funcional en movil/tablet
- jerarquia visual orientada a accion rapida
- estados criticos claramente identificables

El objetivo no es solo estetica, sino reaccion operativa rapida.

## 7. Prioridad del MVP

Prioridades de entrega:

1. control funcional de maquinas
2. estado del sistema visible
3. acciones criticas registradas
4. interfaz sencilla y robusta

Se deja para fase posterior:

- analitica avanzada
- personalizacion de interfaz
- automatizaciones complejas multi-sede
