# 01 — Estructura del Proyecto

## Árbol de Carpetas

```
src/
├── index.html                  ← HTML raíz (data-theme="light")
├── main.ts                     ← bootstrapApplication(App, appConfig)
├── styles.css                  ← Tailwind CSS 4 + daisyUI 5 plugin
│
├── environments/
│   ├── environment.ts          ← Producción  (apiUrl: localhost:8080)
│   └── environment.development.ts ← Desarrollo (apiUrl: localhost:8080)
│
└── app/
    ├── app.ts                  ← Componente raíz (Navbar + RouterOutlet)
    ├── app.html                ← Template raíz
    ├── app.css                 ← Vacío (estilos globales en styles.css)
    ├── app.config.ts           ← Providers: router, HttpClient, interceptor
    ├── app.routes.ts           ← Definición de rutas con lazy loading
    │
    ├── core/                   ← Servicios singleton y lógica transversal
    │   ├── guards/
    │   │   ├── auth.guard.ts       ← Protege rutas autenticadas
    │   │   └── public.guard.ts     ← Protege rutas públicas
    │   ├── interceptors/
    │   │   └── auth.interceptor.ts ← Inyecta JWT + maneja 401
    │   ├── models/
    │   │   └── auth.model.ts       ← AuthUser, LoginRequest
    │   └── services/
    │       └── auth.service.ts     ← Signal-based auth state
    │
    ├── features/               ← Módulos funcionales por dominio
    │   ├── auth/
    │   │   └── pages/
    │   │       └── login-page/
    │   │           ├── login-page.ts   ← Reactive form + signals
    │   │           └── login-page.html ← UI con daisyUI card/form
    │   │
    │   └── users/
    │       ├── components/
    │       │   ├── user-filters/       ← Select tamaño + toggle "mostrar todos"
    │       │   ├── user-list-header/   ← Título con badge de conteo
    │       │   ├── user-search-form/   ← Input de búsqueda por nombre
    │       │   └── user-table/         ← Tabla de usuarios + empty state
    │       ├── models/
    │       │   ├── user.model.ts       ← Interface User
    │       │   └── page.model.ts       ← Interface PageResponse<T>
    │       ├── pages/
    │       │   └── users-page/
    │       │       ├── users-page.ts   ← Smart component, orquesta todo
    │       │       └── users-page.html ← Layout con grid responsive
    │       └── services/
    │           └── users.service.ts    ← GET /api/users con params
    │
    └── shared/                 ← Componentes reutilizables
        ├── components/
        │   ├── empty-state/
        │   │   ├── empty-state.ts      ← Componente con iconos por tipo
        │   │   ├── empty-state.html    ← SVG dinámico + mensaje
        │   │   └── index.ts           ← Barrel export
        │   ├── navbar/
        │   │   ├── navbar.ts           ← Usa AuthService signals
        │   │   └── navbar.html         ← Navbar responsive con dropdown
        │   ├── pagination/
        │   │   ├── pagination.ts       ← linkedSignal + computed pages
        │   │   └── pagination.html     ← Join buttons con daisyUI
        │   └── theme-switcher/
        │       ├── theme-switcher.ts   ← 7 temas, localStorage + signal
        │       └── theme-switcher.html ← Dropdown con lista de temas
        └── models/
            └── page.model.ts           ← PageResponse<T> (duplicado)
```

---

## Propósito de Cada Capa

### `core/` — Lógica Transversal

Contiene todo lo que es **singleton** y se usa a nivel de toda la aplicación:

| Elemento             | Archivo               | Descripción                                          |
| -------------------- | --------------------- | ---------------------------------------------------- |
| `AuthService`        | `auth.service.ts`     | Estado de autenticación con signals + localStorage   |
| `authGuard`          | `auth.guard.ts`       | Función que protege rutas que requieren sesión        |
| `publicGuard`        | `public.guard.ts`     | Función que redirige usuarios ya logueados            |
| `authInterceptor`    | `auth.interceptor.ts` | Inyecta header `Authorization` y maneja 401 global   |
| `AuthUser`           | `auth.model.ts`       | Interface del usuario autenticado (token, email, etc) |
| `LoginRequest`       | `auth.model.ts`       | Interface del payload de login                        |

### `features/` — Módulos Funcionales

Cada feature agrupa su página, componentes internos, modelos y servicios:

| Feature   | Responsabilidad                                        |
| --------- | ------------------------------------------------------ |
| `auth/`   | Página de login con formulario reactivo                |
| `users/`  | CRUD de lectura: tabla, búsqueda, filtros, paginación  |

### `shared/` — Componentes Reutilizables

Componentes genéricos que pueden usarse en cualquier feature:

| Componente        | Propósito                                        |
| ----------------- | ------------------------------------------------ |
| `NavbarComponent` | Barra de navegación con estado auth y temas      |
| `PaginationComponent` | Controles de paginación con linkedSignal    |
| `ThemeSwitcherComponent` | Selector de 7 temas con persistencia     |
| `EmptyStateComponent` | Mensaje vacío con icono SVG dinámico         |

---

## Archivos de Configuración Raíz

| Archivo            | Propósito                                          |
| ------------------ | -------------------------------------------------- |
| `main.ts`          | Bootstrap de la app con `appConfig`                |
| `app.config.ts`    | Registro de providers globales                     |
| `app.routes.ts`    | Tabla de rutas con guards y lazy loading           |
| `styles.css`       | Tailwind CSS 4 + daisyUI con 7 temas              |
| `index.html`       | HTML raíz, carga `data-theme="light"` por defecto |
| `angular.json`     | Configuración del CLI (esbuild, paths, budgets)    |
| `tsconfig.json`    | TypeScript estricto (strict, strictTemplates)      |

---

## Convenciones de Nombres

| Tipo                | Convención                              | Ejemplo                    |
| ------------------- | --------------------------------------- | -------------------------- |
| Componentes         | `kebab-case/kebab-case.ts`             | `user-table/user-table.ts` |
| Servicios           | `kebab-case.service.ts`                | `users.service.ts`         |
| Guards              | `kebab-case.guard.ts`                  | `auth.guard.ts`            |
| Interceptores       | `kebab-case.interceptor.ts`            | `auth.interceptor.ts`      |
| Modelos             | `kebab-case.model.ts`                  | `user.model.ts`            |
| Templates           | Mismo nombre que el `.ts`, extensión `.html` | `navbar.html`        |
| Barrel exports      | `index.ts`                             | `empty-state/index.ts`     |
