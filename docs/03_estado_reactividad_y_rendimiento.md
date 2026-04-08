# 03 — Estado, Reactividad y Rendimiento

## Modelo de Reactividad: Angular Signals

Este proyecto **no usa RxJS para estado interno** (no hay BehaviorSubject, no hay stores). Toda la reactividad del estado de la UI se maneja con la API de **Signals** de Angular.

---

## Tipos de Signals Usados

### 1. `signal()` — Estado Mutable

Almacena un valor que puede cambiar. Los componentes que lo leen se actualizan automáticamente.

```typescript
// AuthService — estado global de autenticación
readonly currentUser = signal<AuthUser | null>(this.restoreUser());

// UsersPageComponent — estado local de la página
readonly users = signal<User[]>([]);
readonly loading = signal(true);
readonly error = signal<string | null>(null);
readonly currentPage = signal(0);
readonly pageSize = signal(5);
readonly showAll = signal(false);
readonly searchName = signal<string>('');

// LoginPageComponent — estado del formulario
readonly loading = signal(false);
readonly errorMessage = signal<string | null>(null);

// ThemeSwitcherComponent — tema actual
readonly currentTheme = signal<string>(this.getStoredTheme());
```

### 2. `computed()` — Estado Derivado

Calcula un valor a partir de otros signals. Se recalcula automáticamente cuando sus dependencias cambian.

```typescript
// AuthService — derivado de currentUser + token
readonly isAuthenticated = computed(() =>
    this.currentUser() !== null && this.hasValidToken()
);

// UsersPageComponent — total dinámico según modo
readonly total = computed(() =>
    this.showAll() ? this.users().length : this.totalElements()
);

// PaginationComponent — listas de páginas y estados
getPagesList = computed(() => { /* cálculo de ventana de páginas */ });
canGoPrevious = computed(() => this.activePage() > 0);
canGoNext = computed(() => this.activePage() < this.totalPages() - 1);
```

### 3. `linkedSignal()` — Signal Vinculado a Input

Un signal que se sincroniza automáticamente con un `input()` pero también puede ser modificado internamente.

```typescript
// PaginationComponent — la página activa sigue al input del padre,
// pero también puede cambiar localmente al hacer clic
activePage = linkedSignal(() => this.currentPage());
```

Cuando el padre cambia `currentPage`, `activePage` se actualiza. Pero cuando el usuario hace clic en un botón de página, `activePage` se modifica directamente con `.set()`, y luego emite el evento al padre.

### 4. `input()` / `input.required()` — Inputs Reactivos

Reemplazan al decorador `@Input()`. Son signals de solo lectura.

```typescript
// UserTableComponent
readonly users = input.required<User[]>();
readonly loading = input<boolean>(false);

// UserListHeaderComponent
readonly title = input<string>('Gestión de Usuarios');
readonly total = input.required<number>();

// UserFiltersComponent
readonly pageSize = input.required<number>();
readonly showAll = input.required<boolean>();
readonly pageSizeOptions = input<number[]>([5, 10]);
```

### 5. `output()` — Eventos de Salida

Reemplazan al decorador `@Output() + EventEmitter`. Emiten eventos al padre.

```typescript
// UserSearchFormComponent
readonly search = output<string>();
readonly clear = output<void>();

// UserFiltersComponent
readonly sizeChange = output<number>();
readonly showAllChange = output<boolean>();

// UserTableComponent
readonly userClick = output<User>();
```

---

## Mapa de Reactividad por Componente

```
AuthService (Singleton)
├── currentUser: signal<AuthUser | null>     ← source of truth
├── isAuthenticated: computed                ← derivado
│
├──→ NavbarComponent (lee signals directamente)
│    ├── isAuthenticated = authService.isAuthenticated
│    └── currentUser = authService.currentUser
│
├──→ authGuard (lee isAuthenticated + getToken)
└──→ authInterceptor (lee getToken)

UsersPageComponent (Smart Component)
├── users: signal<User[]>
├── loading: signal<boolean>
├── error: signal<string | null>
├── currentPage: signal<number>
├── pageSize: signal<number>
├── showAll: signal<boolean>
├── searchName: signal<string>
├── total: computed (showAll ? users.length : totalElements)
│
├──→ UserListHeaderComponent    [total]
├──→ UserSearchFormComponent    (search), (clear)
├──→ UserFiltersComponent       [pageSize, showAll, loading] → (sizeChange, showAllChange)
├──→ UserTableComponent         [users] → (userClick)
└──→ PaginationComponent        [totalPages, currentPage] → (pageChange)

ThemeSwitcherComponent (Independiente)
├── currentTheme: signal<string>          ← localStorage
└── effect(() => applyTheme())            ← side effect
```

---

## OnPush — Estrategia de Detección de Cambio

**Todos los componentes** del proyecto usan `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### ¿Qué implica OnPush?

| Escenario                              | ¿Se ejecuta detección? |
| -------------------------------------- | ---------------------- |
| Signal cambia (con `.set()` / `.update()`) | ✅ Sí                |
| `computed()` se recalcula              | ✅ Sí                 |
| Input del padre cambia por referencia  | ✅ Sí                 |
| Output emite un evento                 | ✅ Sí                 |
| Mutación interna de un objeto          | ❌ No                 |
| Timer / setTimeout                     | ❌ No (sin markForCheck) |

### ¿Por qué funciona bien con Signals?

Cuando un signal cambia su valor, Angular marca automáticamente el componente como "dirty" y ejecuta la detección solo donde es necesario. No hay que llamar `markForCheck()` manualmente.

---

## `effect()` — Efectos Secundarios

Se usa una vez en el proyecto, en `ThemeSwitcherComponent`:

```typescript
constructor() {
    this.applyTheme(this.currentTheme());

    effect(() => {
        this.applyTheme(this.currentTheme());
    });
}
```

Cuando `currentTheme` cambia, el effect aplica el nuevo tema al DOM (`document.documentElement.setAttribute('data-theme', ...)`).

---

## Persistencia en localStorage

Dos áreas del proyecto usan localStorage:

| Dato           | Key            | Componente/Servicio      |
| -------------- | -------------- | ------------------------ |
| JWT Token      | `auth_token`   | `AuthService`            |
| Datos usuario  | `auth_user`    | `AuthService`            |
| Tema activo    | `theme`        | `ThemeSwitcherComponent` |

Ambos servicios restauran el estado desde localStorage al iniciar, lo que permite:
- **Sesión persistente** — el usuario no necesita re-loguearse al recargar
- **Tema persistente** — el tema elegido se mantiene entre sesiones

---

## RxJS — Uso Limitado

RxJS se usa **solo para llamadas HTTP** (donde Angular HttpClient lo requiere):

```typescript
// AuthService
login(request): Observable<AuthUser> { ... }

// UsersService
getUsers(params): Observable<User[] | PageResponse<User>> { ... }
```

Patrón: los Observables se suscriben manualmente (`.subscribe()`) dentro de los componentes y los resultados se almacenan en signals. No se usa `async pipe` porque el estado pasa por signals, no por Observables.
