# Filmate Admin Frontend

Aplicacion frontend de Filmate enfocada directamente al administrador y al personal. Este proyecto incluye el flujo de gestion interna para el control de la cartelera, peliculas, dulceria y administracion general de las salas.

## Descripcion

Filmate Admin es una interfaz web orientada a proporcionar herramientas de gestion eficientes para el personal administrativo. El frontend esta organizado por componentes reutilizables y utiliza:

- React 19
- Vite
- React Router
- Tailwind CSS 4
- Lucide React para iconos

## Funcionalidades

- Pantalla de inicio de sesion exclusiva para administradores y personal.
- Dashboard principal con resumen operativo y metricas.
- Gestion de catalogo de peliculas.
- Gestion y visualizacion de ventas y tickets.
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

````bash
npm install
## Scripts disponibles

### Desarrollo

```bash
npm run dev
````

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
FILMATE_AdminFrontend/
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── solicitud-de-cambio--rfc-.md
├── dist/
├── node_modules/
├── src/
│   ├── Component/
│   │   ├── Admin/
│   │   │   ├── CatalogoPeliculas.css
│   │   │   ├── CatalogoPeliculas.jsx
│   │   │   └── VentasYTickets.jsx
│   │   ├── Header.jsx
│   │   ├── MainLayout.jsx
│   │   └── MenuPrincipal.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitattributes
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

## Rutas principales

- `/` -> Inicio de sesion administrativo
- `/dashboard` -> Dashboard principal
- `/catalogoPeliculas` -> Gestion de catalogo de peliculas
- `/ventasTickets` -> Gestion de ventas y tickets

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
