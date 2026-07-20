# Filmate Admin Frontend

Aplicacion frontend de Filmate enfocada directamente al administrador y al personal. Este proyecto incluye el flujo de gestion interna para el control de la cartelera, peliculas, dulceria y administracion general de las salas.

## Descripcion

Filmate Admin es una interfaz web orientada a proporcionar herramientas de gestion eficientes para el personal administrativo. El frontend esta organizado por componentes reutilizables y utiliza:

- React 19
- Vite
- React Router
- Tailwind CSS 3
- Lucide React para iconos
- Recharts para graficos
- jsPDF para exportacion de reportes

## Funcionalidades

- Pantalla de inicio de sesion exclusiva para administradores y personal.
- Dashboard principal con resumen operativo y metricas.
- Gestion de catalogo de peliculas (busqueda en TMDb, preview, creacion y edicion).
- Gestion de cines, salas y asientos.
- Programacion de funciones.
- Gestion de ventas y tickets (detalle de transacciones, validacion QR).
- Gestion de usuarios y roles (asignacion de permisos).
- Configuracion de precios y parametros del sistema.
- Reportes de taquilla, ocupacion de salas, ventas por horario y analisis de peliculas (exportables a Excel y CSV).
- Modulo de ayuda y soporte.
- Autenticacion basada en roles (Superadmin / Administrador).
- Navegacion entre vistas administrativas con React Router.
- Layout principal reutilizable para todo el entorno administrativo.
- Header y menu principal reutilizables.
- Diseno responsivo para escritorio y dispositivos moviles.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalacion

1. Clona el repositorio.
2. Instala dependencias:

```bash
npm install
```

## Scripts disponibles

### Desarrollo

```bash
npm run dev
```

Inicia Vite en modo desarrollo.

### Compilacion

```bash
npm run build
```

Genera la version de produccion dentro de `dist/`.

### Vista previa

```bash
npm run preview
```

Sirve la build de produccion de forma local.

### Lint

```bash
npm run lint
```

Ejecuta ESLint sobre el proyecto.

## Estructura del proyecto

```text
frontend-admin/
├── docs-manual-admin/
│   ├── capturas/
│   ├── Manual_de_Administrador_FILMATE.docx
│   ├── Manual_de_Administrador_FILMATE.md
│   └── Manual_de_Administrador_FILMATE.pdf
├── src/
│   ├── Component/
│   │   ├── Admin/
│   │   │   ├── AyudaSoporte.jsx
│   │   │   ├── CatalogoPeliculas.css
│   │   │   ├── CatalogoPeliculas.jsx
│   │   │   ├── CinesYSalas.css
│   │   │   ├── CinesYSalas.jsx
│   │   │   ├── ConfiguracionPrecios.jsx
│   │   │   ├── DashboardPrincipal.jsx
│   │   │   ├── GestionUsuarios.jsx
│   │   │   ├── Programacion.css
│   │   │   ├── Programacion.jsx
│   │   │   ├── Reportes.jsx
│   │   │   └── VentasYTickets.jsx
│   │   ├── Header.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MainLayout.jsx
│   │   └── MenuPrincipal.jsx
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── AuthContext.jsx
│   │   └── useAuth.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .eslintrc.json
├── .gitattributes
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── scripts/
├── tailwind.config.js
└── vite.config.js
```

## Vistas del sistema

La navegacion se maneja internamente mediante un menu lateral. Las vistas disponibles son:

| Vista | Descripcion |
|---|---|
| Dashboard Principal | Resumen operativo con metricas y graficos |
| Reportes | Reportes de taquilla, ocupacion, ventas por horario y analisis de peliculas (exportables a Excel/CSV) |
| Catalogo de Peliculas | Gestion del catalogo (busqueda TMDb, preview, creacion, edicion y eliminacion suave) |
| Cines y Salas | Gestion de cines, salas y asientos |
| Programacion | Gestion de funciones |
| Ventas y Tickets | Detalle de transacciones, validacion de tickets QR |
| Usuarios y Roles | Gestion de usuarios, roles y permisos |
| Configuracion y Precios | Parametros del sistema y configuracion de precios |
| Ayuda y Soporte | Manual de administrador y soporte |

### Autenticacion

- `/login` -> Inicio de sesion administrativo

## Estrategia de ramas

Se usa una estrategia basada en ramas de trabajo y consolidacion:

- `main`: reservada exclusivamente para produccion.
- `develop`: linea base donde se integran las tareas del equipo.
- `feature/nombre-tarea`: ramas para desarrollar hitos o funcionalidades.
- `bugfix/nombre-error`: ramas para corregir fallos detectados en `develop`.

### Flujo recomendado

1. Crear una rama `feature/...` desde `develop`.
2. Desarrollar y probar la funcionalidad.
3. Abrir pull request hacia `develop`.
4. Validar y, cuando este estable, fusionar `develop` hacia `main`.

## Convenciones usadas

- Componentes de React organizados en `src/Component/` y subcarpetas como `Admin/`.
- Navegacion centralizada con `react-router-dom`.
- Estilos base con Tailwind CSS complementados con archivos CSS especificos.
- Configuraciones modernas de linting y estilos (`eslint.config.js`, `postcss.config.js`, `tailwind.config.js`).

## Notas

- El proyecto usa componentes reutilizables para facilitar nuevas vistas administrativas.
- Se recomienda mantener la estructura modular para mejorar mantenimiento y escalabilidad.
- Los cambios importantes deben validarse antes de integrarse a `develop`.
