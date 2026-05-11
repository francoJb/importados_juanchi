# Elda Gestión - Guía de Estructura de Código

Este documento explica la organización actual del proyecto para que otro colega pueda entender rápidamente dónde buscar y cómo trabajar.

## 1. Resumen del proyecto

Elda Gestión es un sistema de gestión de ventas, clientes, productos y empresas con:
- Interfaz web frontend en `index.html` + `js/*.js`
- Backend Node.js con Express en `backend/`
- Base de datos MySQL/TiDB gestionada desde `backend/database/database.js`

## 2. Frontend

### Archivos principales
- `index.html`: contiene la estructura de la aplicación, el sidebar, las secciones por pantalla y los modales.
- `js/app.js`: lógica principal de navegación, configuración general, dashboard y administración de empresas/usuarios.
- `js/ui.js`: utilidades UI genéricas como mostrar/ocultar modales y loaders.

### Flujo de `js/app.js`
- Importaciones y constantes globales.
- Utilidades generales (`esAdmin`, validaciones y formateos).
- Gestión local de configuración de empresa.
- Administración de empresas y usuarios.
- Lógica del dashboard y generación de datos visuales.
- Inicialización de la app y eventos del menú lateral.
- Login y carga inicial de sesión.

## 3. Backend

### Estructura general
- `backend/server.js`: arranca Express y monta las rutas.
- `backend/routes/`: define las rutas disponibles.
- `backend/controllers/`: contiene la lógica asociada a cada ruta.
- `backend/database/database.js`: configura la conexión con MySQL/TiDB y crea tablas si no existen.
- `backend/middlewares/`: contiene los middlewares de autenticación y autorización.

### Rutas de administración
- `backend/routes/adminRoutes.js`: expone rutas para gestionar empresas y usuarios.
  - `/api/admin/companies`
  - `/api/admin/users`

### Controladores
- `backend/controllers/adminController.js`: tiene dos bloques principales:
  - Empresas: `listCompanies`, `createCompany`
  - Usuarios: `listUsers`, `createUser`

## 4. Base de datos

- El archivo `backend/database/database.js` carga variables de entorno y configura la conexión.
- Si falta el certificado SSL local, se avisa, pero la conexión sigue sin modificar variables de acceso.
- La lógica de creación de tablas se ejecuta automáticamente al iniciar el backend.

## 5. Cómo empezar a trabajar

1. Clona o abre este repositorio.
2. Revisa variables de entorno en `.env.local` o `.env`.
3. Inicia el backend con `node backend/server.js`.
4. Abre la aplicación en el navegador y prueba el login.

## 6. Dónde modificar cada parte

- Para cambiar el diseño de la pantalla de configuración: edita `index.html` en la sección `seccionConfig`.
- Para mejorar la administración de empresas/usuarios: edita `js/app.js` en el bloque `ADMINISTRACIÓN DE EMPRESAS Y USUARIOS`.
- Para agregar nuevas rutas de API: añade rutas en `backend/routes/...` y lógica en `backend/controllers/...`.
- Para cambiar la conexión o el esquema de la base de datos: edita `backend/database/database.js`.

## 7. Notas importantes

- No se deben modificar credenciales en los archivos de código.
- La lógica de permisos está basada en `currentSessionUser.role === 'admin'`.
- Los datos de empresa se guardan localmente en la key `empresaConfig` y se usan en el formulario de configuración.
- El backend usa la ruta `/api/admin/` para acciones administrativas.

---

Este archivo puede compartirse con el equipo para una rápida orientación sobre la arquitectura y las responsabilidades clave de cada módulo.
