# GESTION HOTEL 🏨
Un sistema integral de administración hotelera desarrollado con una arquitectura de microservicios ligera, utilizando C# Minimal APIs para el backend, SQL Server para la persistencia de datos y Vanilla JavaScript + Bootstrap 5 para un frontend dinámico y reactivo.

Este proyecto permite a los recepcionistas de un hotel registrar clientes, crear reservas con múltiples habitaciones y huéspedes, gestionar el ciclo de vida de la estadía (Check-in / Check-out) y consultar el directorio interno del personal.

# 🚀 Arquitectura Utilizada

Se utilizo lo que es el movelo MVC, donde en Vanilla JS aplica para el frontend, la interaccion con el sistema, y el envio de la respectiva de informacion y un leve control para evitar fallos en las otras capas, no fallen, en el backend se realiza la logica de insertado de la tabla, donde se utilizio C# con .Net 10, donde se hace la conexion y el respectivo envio de solicitudes a la base de datos para su llenado, donde en el backend se hace validaciones de la logica del negocio para evitar errores al momento de llenar los datos, y la base de datos donde se uso SQL Server de Microsoft, que se encarga de guardar toda la informacion necesaria para buscar entre la nueva informacion o añadir nueva

<img width="1920" height="1080" alt="Diagrama de Arquitectura" src="https://github.com/user-attachments/assets/7d226d1a-3362-4e0d-b2e7-f8f263be2e36" />

* **Backend: C# (.NET Core)**

* **Base de Datos: Microsoft SQL Server.**

* **Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.**

* **Arquitectura: MVC** 

# 🛠️ Instrucciones de Instalación y Ejecución
Sigue estos pasos para levantar el proyecto en tu entorno local.

<h3>1. Preparar la Base de Datos</h3>

* Abre Microsoft SQL Server Management Studio (SSMS).

* Restaura la base de datos

<h3>2. Configurar y Ejecutar el Backend (C#)</h3>

* Abre una terminal y navega hasta la carpeta de tu backend (ej. cd back).

* Asegúrate de tener instalada la librería de SQL Client. Si no la tienes, ejecuta:

```Bash
dotnet add package Microsoft.Data.SqlClient
```
Ejecuta el servidor:

```Bash
dotnet run
```
**⚠️ IMPORTANTE: El servidor se iniciará. Verifica en la consola que esté corriendo en el puerto 5189 (ej. http://localhost:5189). Si usa otro puerto, deberás actualizar la variable puerto o las URLs de los archivos JavaScript del frontend.**

<h3>3. Ejecutar el Frontend</h3>
* Como el frontend está construido con Vanilla JS y HTML estándar, no requiere compilación.

* Abre la carpeta de tu frontend en Visual Studio Code.

* Utiliza la extensión Live Server haciendo clic derecho sobre el archivo index.html y seleccionando "Open with Live Server".

* Alternativamente, puedes simplemente darle doble clic al archivo index.html para abrirlo en tu navegador web.

# 🗃️ Modelo de base de datos

**El diagrama de base de datos es el siguiente:**
<img width="903" height="717" alt="Diagrama de base de datos" src="https://github.com/user-attachments/assets/e10aa62d-2a83-4e11-9121-e7b856bcbb77" />

El núcleo del sistema es la base de datos HotelDB, diseñada para evitar redundancias y mantener la integridad referencial. A continuación se explican las tablas y vistas principales:

<h3>👤 Gestión de Personas y Personal</h3>

- Usuario: La tabla central de personas. Todo individuo (sea cliente, huésped o empleado) se registra aquí primero con su Nombre, Apellido y Documentacion.

* Cliente: Extensión de Usuario para las personas que son los titulares de una reserva.

* Huesped: Extensión de Usuario para las personas físicas que ocuparán las habitaciones.

* Empleado: Extensión de Usuario. Vincula a una persona con su área de trabajo.

* Departamento: Áreas del hotel (ej. Limpieza, Cocina) y su contacto telefónico interno.

* Rol: Nivel jerárquico dentro de un departamento (ej. 1 = Encargado, 2 = Empleado base).

<h3>🛏️ Gestión de Habitaciones</h3>

- Tipo_Habitacion: Catálogo que define capacidades y precios (Simple, Doble, Suite).

* Estado_Habitacion: Catálogo de estados físicos (1 = Disponible, 2 = Ocupada, 3 = Mantenimiento).

* Habitacion: El inventario físico del hotel. Vincula un número de cuarto con su Tipo y su Estado actual.

<h3>📅 Gestión de Reservas (Estadías)</h3> 

- Estadia: La cabecera de la reserva. Guarda el cliente titular, el estado (Confirmada, Check-in, Check-out), y las fechas programadas y reales.

* Estadia_Habitacion: Tabla puente (Muchos a Muchos). Permite que una misma estadía tenga varias habitaciones rentadas en formato "Carrito de compras".

* Huesped_Habitacion: Tabla puente. Define exactamente qué huésped dormirá en qué habitación rentada.

<h3>👁️ Vistas (Views) Implementadas</h3>
Para optimizar el rendimiento y mantener limpio el código C#, se crearon "tablas virtuales" en SQL Server:

* vw_DirectorioDepartamentos: Encapsula múltiples LEFT JOIN para cruzar Departamentos, Empleados y Usuarios, devolviendo una lista limpia de cada área junto con el nombre de su Encargado actual y su extensión telefónica.

* vw_ResumenEstadias: Centraliza los datos del Titular de la reserva y las fechas de la Estadía. Es utilizada por el backend para llenar el "Panel de Gestión" y procesar las búsquedas globales de manera instantánea.

# 👾 Funcionalidades implementadas

* **Registrar usuarios.-** Puedes agregar algun nuevo cliente llenando sus respectivos datos, se valida que se llenen todos sus datos y tambien se valida su previa existencia para evitar que haya repetidos
* **Realizar reserva para Estadia.-** Utilizando un cliente ya existente puedes realizar la respectiva reserva de distintas habitaciones, donde puedes seleccionar el tipo de habitacion y que habitacion vas a estar, te muestra el precio de cada habitacion, haciendo la validacion de que si ya hay habitaciones reservadas para evitar duplicar habitaciones reservadas el mismo horario, y tambien se hace la validacion de los datos llenados para la respectiva reserva
* **Visualizar las diversas estadias.-** Puedes ver todas las estadias dispoibles y ver su estado actual (Confirmada, Check in o Check Out), y aqui es donde se hace la verificacion de que reservas hay, mostrando lo necesario
* **Filtrar busqueda.-** Puedes filtrar las reservas de estadias ya existentes, pudiendo buscar por nombre del cliente o por su respectiva documentacion, validando con la base de datos para el resultado
* **Visualizar contactos.-** Puedes ver los diferentes departamentos de los empleados con su respectivo contacto y el nombre del encargado
