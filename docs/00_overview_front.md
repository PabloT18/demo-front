# 00 — Visión General del Frontend

## ¿Qué es este proyecto?

`my-page` es una **Single Page Application (SPA)** construida con **Angular 21** que consume la API REST del backend Spring Boot. Implementa autenticación JWT, gestión de usuarios con paginación/búsqueda y un sistema de temas dinámicos.

---

## Stack Tecnológico

| Categoría           | Tecnología                          |
| ------------------- | ----------------------------------- |
| Framework           | Angular 21                          |
| Lenguaje            | TypeScript (modo estricto)          |
| Estilos             | Tailwind CSS 4 + daisyUI 5         |
| Gestión de estado   | Angular Signals                     |
| Detección de cambio | OnPush (global)                     |
| Bundler             | esbuild (vía Angular CLI)           |
| Package Manager     | pnpm                                |
| Backend consumido   | Spring Boot 3.5 @ `localhost:8080`  |

---

## Mapa Funcional

```
┌─────────────────────────────────────────────────────────┐
│                    App (Root Component)                  │
│                  Navbar + RouterOutlet                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   /login (publicGuard)        /users (authGuard)        │
│   ┌──────────────────┐       ┌─────────────────────┐    │
│   │  LoginPageComp.  │       │  UsersPageComp.     │    │
│   │  - Formulario    │       │  - Header           │    │
│   │  - Validación    │       │  - Búsqueda         │    │
│   │  - Errores HTTP  │       │  - Filtros          │    │
│   └──────────────────┘       │  - Tabla            │    │
│                              │  - Paginación       │    │
│                              └─────────────────────┘    │
│                                                         │
│   Shared: Navbar · ThemeSwitcher · Pagination ·         │
│           EmptyState                                    │
│                                                         │
│   Core: AuthService · AuthGuard · PublicGuard ·         │
│          AuthInterceptor                                │
└─────────────────────────────────────────────────────────┘
```

---

## Arquitectura General

El proyecto sigue una **arquitectura por features** con tres capas:

| Capa          | Carpeta       | Responsabilidad                                                |
| ------------- | ------------- | -------------------------------------------------------------- |
| **Core**      | `core/`       | Servicios singleton, guards, interceptores, modelos de auth    |
| **Features**  | `features/`   | Módulos funcionales (auth, users) con páginas y componentes    |
| **Shared**    | `shared/`     | Componentes reutilizables (navbar, pagination, theme-switcher) |

### Decisiones arquitectónicas clave

- **100% Standalone Components** — sin NgModules. Angular 21 los hace standalone por defecto.
- **Lazy Loading** — ambas rutas (`/login`, `/users`) cargan sus componentes bajo demanda con `loadComponent`.
- **Signals** — toda la reactividad usa `signal()`, `computed()` y `linkedSignal()`. No se usa BehaviorSubject.
- **OnPush** — todos los componentes usan `ChangeDetectionStrategy.OnPush`.
- **Functional APIs** — guards e interceptores son funciones, no clases.

---

## Flujo de Autenticación (Resumen)

```
Usuario → Login Form → POST /auth/login → JWT token
  ↓
AuthService.handleLoginSuccess() → localStorage + signal
  ↓
Guards + Interceptor manejan acceso y headers automáticamente
  ↓
401 → Interceptor ejecuta logout global
```

---

## Índice de Documentación

| #  | Archivo                               | Contenido                                    |
| -- | ------------------------------------- | -------------------------------------------- |
| 00 | `00_overview_front.md`                | Este archivo — visión general                |
| 01 | `01_estructura_proyecto.md`           | Estructura de carpetas y propósito           |
| 02 | `02_autenticacion_y_rutas.md`        | Login, guards, interceptor, flujo JWT        |
| 03 | `03_estado_reactividad_y_rendimiento.md` | Signals, OnPush, linked signals           |
| 04 | `04_servicios_y_consumo_api.md`      | Servicios, endpoints, patrones de acceso     |
| 05 | `05_componentes_tablas_y_vistas.md`  | Páginas, tablas, componentes reutilizables   |
| 06 | `06_observaciones_tecnicas.md`       | Fortalezas, mejoras posibles, deuda técnica  |
