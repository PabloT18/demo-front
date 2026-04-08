# 05 — Componentes, Tablas y Vistas

## Arquitectura de Componentes

El proyecto sigue el patrón **Smart/Dumb Components** (también llamado Container/Presentational):

| Tipo    | Componente            | Responsabilidad                              |
| ------- | --------------------- | -------------------------------------------- |
| Smart   | `UsersPageComponent`  | Orquesta datos, llama al servicio, gestiona estado |
| Smart   | `LoginPageComponent`  | Gestiona formulario y flujo de autenticación |
| Smart   | `NavbarComponent`     | Lee signals globales de auth                 |
| Smart   | `ThemeSwitcherComponent` | Gestiona tema con localStorage + signal   |
| Dumb    | `UserTableComponent`  | Recibe datos por input, emite clicks         |
| Dumb    | `UserListHeaderComponent` | Muestra título y conteo                  |
| Dumb    | `UserSearchFormComponent` | Input de búsqueda, emite eventos         |
| Dumb    | `UserFiltersComponent` | Select + toggle, emite cambios              |
| Dumb    | `PaginationComponent` | Botones de paginación, emite página          |
| Dumb    | `EmptyStateComponent` | Muestra mensaje con icono SVG               |

Todos usan `ChangeDetectionStrategy.OnPush` y APIs modernas (`input()`, `output()`, `signal()`).

---

## Páginas

### LoginPageComponent

**Archivos:** `features/auth/pages/login-page/login-page.ts` + `.html`

```
┌─────────────────────────────────────┐
│          Pantalla de Login          │
│  ┌───────────────────────────────┐  │
│  │         Card (daisyUI)        │  │
│  │                               │  │
│  │  [Alert Error] (condicional)  │  │
│  │                               │  │
│  │  Email:    [______________]   │  │
│  │  Password: [______________]   │  │
│  │                               │  │
│  │  [  Iniciar Sesión  ]        │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│         bg-base-200 centrado        │
└─────────────────────────────────────┘
```

**Características clave:**
- Formulario reactivo con `FormBuilder.nonNullable`
- Validaciones: `required`, `email`, `minLength(6)`
- Signal `loading` para deshabilitar el botón y mostrar spinner
- Signal `errorMessage` para alert condicional con `@if`
- Manejo de errores HTTP diferenciado (0, 400/401, 500+)
- Clases dinámicas: `[class.input-error]` en campos con error

### UsersPageComponent

**Archivos:** `features/users/pages/users-page/users-page.ts` + `.html`

```
┌─────────────────────────────────────────────────────┐
│  ┌─── UserListHeader ───────────────────────────┐   │
│  │  Gestión de Usuarios       Total: 15          │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─── Controls Panel (bg-base-200) ──────────────┐  │
│  │  ┌─ SearchForm ──────┐  ┌─ Filters ────────┐  │  │
│  │  │ [Buscar...][🔍]   │  │ [5 por pág ▼]   │  │  │
│  │  └───────────────────┘  │ ☑ Mostrar todos  │  │  │
│  │                         └──────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── UserTable ─────────────────────────────────┐  │
│  │ ID │ Nombre        │ Correo          │ Roles  │  │
│  │ 1  │ 🟣 Admin      │ admin@test.com  │ ADMIN  │  │
│  │ 2  │ 🟣 User       │ user@test.com   │ USER   │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─── Pagination ────────────────────────────────┐  │
│  │        « [1] [2] [3] »                         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Características clave:**
- Implementa `OnInit` para cargar usuarios al entrar
- 8 signals para el estado completo de la página
- 1 `computed()` para el total dinámico (depende de si se muestra todo o paginado)
- Estado de carga con skeletons de daisyUI (`skeleton h-20`)
- Estado de error con alert + botón reintentar
- Grid responsive: `grid-cols-1 md:grid-cols-3`
- Paginación condicional: solo visible si `!showAll() && totalPages() > 1`

**Flujo de comunicación con componentes hijos:**

```
UsersPageComponent
    │
    ├── → UserListHeaderComponent      [total]
    │
    ├── → UserSearchFormComponent      [loading]
    │   ├── ← (search)  → onSearch(value)
    │   └── ← (clear)   → clearSearch()
    │
    ├── → UserFiltersComponent         [pageSize, showAll, loading, pageSizeOptions]
    │   ├── ← (sizeChange)    → onSizeChange(size)
    │   └── ← (showAllChange) → onShowAllChange(bool)
    │
    ├── → UserTableComponent           [users]
    │   └── ← (userClick)     → onUserClick(user)
    │
    └── → PaginationComponent          [totalPages, currentPage]
        └── ← (pageChange)    → onPageChange(page)
```

---

## Componentes del Feature Users

### UserListHeaderComponent

**Archivos:** `components/user-list-header/user-list-header.ts` + `.html`

| Input     | Tipo     | Default                | Descripción               |
| --------- | -------- | ---------------------- | ------------------------- |
| `title`   | `string` | `'Gestión de Usuarios'` | Título principal          |
| `total`   | `number` | (requerido)            | Total de usuarios         |

Presenta un header con gradiente `bg-linear-to-r from-primary to-secondary` y muestra el conteo total.

### UserSearchFormComponent

**Archivos:** `components/user-search-form/user-search-form.ts` + `.html`

| Input      | Tipo      | Default | Descripción             |
| ---------- | --------- | ------- | ----------------------- |
| `loading`  | `boolean` | `false` | Deshabilita el botón    |

| Output   | Tipo     | Cuándo emite                  |
| -------- | -------- | ----------------------------- |
| `search` | `string` | Al hacer clic o Enter         |
| `clear`  | `void`   | Al hacer clic en "Limpiar"    |

- Usa un `FormControl` individual (no un FormGroup)
- Validador `maxLength(100)` en el input
- Botón "Limpiar" aparece condicionalmente: `@if (searchControl.value)`
- Soporta buscar con Enter: `(keyup.enter)="onSubmit()"`

### UserFiltersComponent

**Archivos:** `components/user-filters/user-filters.ts` + `.html`

| Input              | Tipo       | Default   | Descripción                 |
| ------------------ | ---------- | --------- | --------------------------- |
| `pageSize`         | `number`   | (requerido) | Tamaño de página actual   |
| `showAll`          | `boolean`  | (requerido) | Si mostrar todos          |
| `loading`          | `boolean`  | `false`   | Deshabilita controles       |
| `pageSizeOptions`  | `number[]` | `[5, 10]` | Opciones del select         |

| Output          | Tipo      | Cuándo emite                 |
| --------------- | --------- | ---------------------------- |
| `sizeChange`    | `number`  | Al cambiar select            |
| `showAllChange` | `boolean` | Al cambiar checkbox          |

- El select se deshabilita cuando `showAll` está activo
- Template con iteración `@for (size of pageSizeOptions(); track size)`

### UserTableComponent

**Archivos:** `components/user-table/user-table.ts` + `.html`

| Input     | Tipo     | Default   | Descripción                     |
| --------- | -------- | --------- | ------------------------------- |
| `users`   | `User[]` | (requerido) | Lista de usuarios a mostrar  |
| `loading` | `boolean` | `false`  | (declarado pero no usado en template) |

| Output      | Tipo   | Cuándo emite                   |
| ----------- | ------ | ------------------------------ |
| `userClick` | `User` | Al hacer clic en una fila      |

**Características de la tabla:**
- Header con gradiente sutil: `bg-linear-to-r from-primary/10 to-secondary/10`
- Avatar con primera letra del nombre: `user.name.charAt(0).toUpperCase()`
- Roles como badges: `badge badge-primary badge-outline badge-sm`
- Filas con hover: `hover:bg-base-200 transition-colors cursor-pointer`
- Estado vacío con `@empty` de `@for`: muestra `EmptyStateComponent`
- Tracking por `user.id` para optimización: `@for (user of users(); track user.id)`

---

## Componentes Shared

### NavbarComponent

**Archivos:** `shared/components/navbar/navbar.ts` + `.html`

Lee directamente los signals de `AuthService`:

```typescript
readonly isAuthenticated = this.authService.isAuthenticated;
readonly currentUser = this.authService.currentUser;
```

**Layout:**
- `navbar-start`: Logo/brand "Demo PPW" (link a `/`)
- `navbar-center`: Link "Usuarios" (solo si autenticado)
- `navbar-end`: ThemeSwitcher + dropdown de usuario (o botón "Iniciar Sesión")

**Dropdown de usuario:**
- Avatar con primera letra del nombre
- Email visible solo en `sm:` y superior
- Menú con nombre del usuario y botón "Cerrar Sesión" en color `text-error`

### PaginationComponent

**Archivos:** `shared/components/pagination/pagination.ts` + `.html`

| Input         | Tipo     | Default | Descripción               |
| ------------- | -------- | ------- | ------------------------- |
| `totalPages`  | `number` | `0`     | Total de páginas          |
| `currentPage` | `number` | `0`     | Página actual (0-indexed) |

| Output       | Tipo     | Cuándo emite              |
| ------------ | -------- | ------------------------- |
| `pageChange` | `number` | Al seleccionar una página |

**Lógica de ventana deslizante:**
- Muestra máximo 5 botones de página
- Si hay más de 5 páginas, centra la ventana alrededor de la página activa
- Usa `linkedSignal` para sincronizar con el input del padre pero permitir cambios locales
- Botones `«` y `»` con `canGoPrevious` / `canGoNext` computados
- Usa `join` de daisyUI para agrupar botones visualmente

### ThemeSwitcherComponent

**Archivos:** `shared/components/theme-switcher/theme-switcher.ts` + `.html`

**Temas disponibles:** `light`, `dark`, `cupcake`, `cyberpunk`, `synthwave`, `forest`, `sunset`

**Mecanismo:**
1. Lee tema de localStorage al arrancar (fallback: `'light'`)
2. Signal `currentTheme` almacena el tema activo
3. `effect()` aplica el tema al `<html data-theme="...">` cuando cambia
4. Al seleccionar un tema, se guarda en localStorage

**Template:**
- Botón con icono de sol SVG + nombre del tema (visible en `sm:`)
- Dropdown con lista de temas
- Tema activo marcado con check SVG
- Usa `TitleCasePipe` para capitalizar nombres

### EmptyStateComponent

**Archivos:** `shared/components/empty-state/empty-state.ts` + `.html` + `index.ts`

| Input         | Tipo       | Default  | Descripción                    |
| ------------- | ---------- | -------- | ------------------------------ |
| `icon`        | `IconType` | `'info'` | Tipo de icono SVG              |
| `message`     | `string`   | (requerido) | Mensaje principal           |
| `description` | `string`   | —        | Descripción secundaria opcional |

**Tipos de icono:** `'users'`, `'search'`, `'error'`, `'info'`

Usa `@switch (icon())` con control de flujo nativo para renderizar el SVG correcto.

Tiene `index.ts` como barrel export: `export { EmptyStateComponent } from './empty-state'` — permite importar como `from '...shared/components/empty-state'`.

---

## Estilos y UI

### daisyUI 5

Todos los componentes usan clases de daisyUI para la UI:

| Componente daisyUI | Uso en el proyecto                      |
| ------------------- | --------------------------------------- |
| `card`              | Login form container                    |
| `navbar`            | Barra de navegación                     |
| `btn`               | Botones (primario, ghost, outline, etc) |
| `input`             | Campos de formulario                    |
| `select`            | Select de tamaño de página              |
| `checkbox`          | Toggle "mostrar todos"                  |
| `table`             | Tabla de usuarios                       |
| `badge`             | Roles de usuario                        |
| `alert`             | Mensajes de error                       |
| `loading`           | Spinner durante carga                   |
| `skeleton`          | Placeholders durante carga              |
| `dropdown`          | Menú de usuario y temas                 |
| `avatar`            | Iniciales del usuario                   |
| `join`              | Paginación agrupada                     |
| `menu`              | Links de navegación                     |

### Tailwind CSS 4

Se combina con daisyUI para layouts y utilidades:

- Grid responsive: `grid grid-cols-1 md:grid-cols-3`
- Flexbox: `flex items-center gap-3`
- Spacing: `px-4 py-8`, `mb-8`, `gap-2`
- Sombras: `shadow-xl`, `shadow-2xl`, `shadow-lg`
- Transiciones: `transition-colors`, `transition-shadow`, `transition-all`
- Gradientes: `bg-linear-to-r from-primary to-secondary`
- Responsive: `hidden sm:inline`, `max-w-6xl`, `md:col-span-2`
