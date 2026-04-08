# 02 — Autenticación y Rutas

## Flujo Completo de Autenticación

```
┌───────────┐     POST /auth/login      ┌───────────┐
│  Login    │ ─────────────────────────→ │  Backend  │
│  Form     │ ←───────────────────────── │  (JWT)    │
└───────────┘     { token, email,        └───────────┘
      │            name, roles }
      ▼
┌─────────────────────────────────────┐
│  AuthService.handleLoginSuccess()   │
│  ┌─────────────────────────────┐    │
│  │ localStorage.setItem(token) │    │
│  │ localStorage.setItem(user)  │    │
│  │ currentUser.set(user)       │ ←── Signal actualizado
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
      │
      ▼
  Router → /users (authGuard permite acceso)
      │
      ▼
  Interceptor agrega: Authorization: Bearer <token>
      │
      ▼
  Si 401 → authService.logout() → /login
```

---

## AuthService — Estado Central

**Archivo:** `src/app/core/services/auth.service.ts`

El servicio es el **único punto de verdad** para el estado de autenticación. Usa signals en lugar de BehaviorSubject.

### Signals Expuestos

```typescript
// Estado reactivo
readonly currentUser = signal<AuthUser | null>(this.restoreUser());
readonly isAuthenticated = computed(() =>
    this.currentUser() !== null && this.hasValidToken()
);
```

- `currentUser` — se inicializa leyendo de `localStorage` (persistencia entre recargas)
- `isAuthenticated` — derivado: hay usuario **Y** hay token válido

### Métodos Principales

| Método                 | Responsabilidad                                           |
| ---------------------- | --------------------------------------------------------- |
| `login(request)`       | POST a `/auth/login`, retorna `Observable<AuthUser>`      |
| `handleLoginSuccess()` | Guarda en localStorage + actualiza signal                 |
| `logout()`             | Limpia localStorage + signal, navega a `/login`           |
| `getToken()`           | Lee token de localStorage (con manejo de errores)         |
| `validateStoredToken()` | Verifica consistencia usuario↔token al iniciar           |
| `restoreUser()`        | Lee y parsea usuario de localStorage al arrancar          |
| `clearAuthData()`      | Limpia todo: localStorage + signal a null                 |

### Validaciones de Seguridad

El servicio implementa varias capas de validación:

1. **Validación al arranque** (`validateStoredToken`) — si hay usuario sin token o viceversa, limpia todo
2. **Token corrupto** — si el token tiene menos de 20 caracteres, se descarta
3. **Datos incompletos** (`restoreUser`) — si el usuario parseado no tiene `email`, `name` o `token`, se descarta
4. **Error de parseo** — si `JSON.parse` falla, se ejecuta `clearAuthData()`

---

## Guards — Control de Acceso a Rutas

### `authGuard` (rutas protegidas)

**Archivo:** `src/app/core/guards/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.getToken()) {
        return true;
    }

    return router.createUrlTree(['/login']);
};
```

- Verifica **dos condiciones**: el signal `isAuthenticated()` Y que exista un token real en localStorage
- Si falla → redirige a `/login`

### `publicGuard` (rutas públicas)

**Archivo:** `src/app/core/guards/public.guard.ts`

```typescript
export const publicGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return router.createUrlTree(['/users']);
    }

    return true;
};
```

- Si el usuario **ya está autenticado**, lo redirige a `/users`
- Evita que un usuario logueado vuelva a ver la pantalla de login

### Patrón

Ambos guards son **funciones** (`CanActivateFn`), no clases. Usan `inject()` para obtener dependencias. Esto es el patrón moderno en Angular.

---

## Interceptor HTTP — Bearer Token + 401

**Archivo:** `src/app/core/interceptors/auth.interceptor.ts`

### Comportamiento

```
Request saliente:
  ¿Es para la API Y no es /auth/login?
    → Sí: agrega header Authorization: Bearer <token>
    → No: pasa sin modificar

Response entrante:
  ¿Es error 401?
    → Sí: ejecuta authService.logout() (con protección anti-loop)
    → No: propaga el error normalmente
```

### Protección Anti-Loop

El interceptor evita un ciclo infinito donde el `logout()` en un 401 podría disparar otra petición que también falle:

```typescript
// Evitar bucle infinito de logouts
if (!isLoggingOut) {
    isLoggingOut = true;
    authService.logout();
    isLoggingOut = false;
}
```

Usa una variable de módulo (`isLoggingOut`) como flag de protección.

---

## Tabla de Rutas

**Archivo:** `src/app/app.routes.ts`

| Path     | Componente           | Guard         | Carga        |
| -------- | -------------------- | ------------- | ------------ |
| `/login` | `LoginPageComponent` | `publicGuard` | Lazy loading |
| `/users` | `UsersPageComponent` | `authGuard`   | Lazy loading |
| `""`     | —                    | —             | Redirect → `/users` |
| `**`     | —                    | —             | Redirect → `/users` |

### Lazy Loading

Ambas rutas usan `loadComponent` con `import()` dinámico:

```typescript
{
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
        import('./features/auth/pages/login-page/login-page').then(
            (m) => m.LoginPageComponent
        ),
},
```

Esto genera **chunks separados** que solo se descargan cuando el usuario navega a esa ruta.

---

## LoginPageComponent — Formulario de Acceso

**Archivo:** `src/app/features/auth/pages/login-page/login-page.ts`

### Formulario Reactivo

```typescript
readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
});
```

- Usa `nonNullable` para evitar valores nulos
- Validaciones: email obligatorio + formato, contraseña obligatoria + mínimo 6 caracteres

### Signals de UI

```typescript
readonly loading = signal(false);
readonly errorMessage = signal<string | null>(null);
```

### Manejo de Errores HTTP

El componente traduce códigos de estado a mensajes legibles:

| Status | Mensaje                                                        |
| ------ | -------------------------------------------------------------- |
| `0`    | "No se puede conectar con el servidor"                         |
| `400` / `401` | "Credenciales incorrectas"                              |
| `500+` | "Error del servidor"                                           |
| Otro   | "Error al iniciar sesión"                                      |

### Template

El template usa daisyUI `card`, `input`, `alert`, `loading` y control de flujo nativo (`@if`, `@else`). Incluye validación visual con `input-error` al tocar campos inválidos.

---

## Configuración de Providers

**Archivo:** `src/app/app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    ],
};
```

| Provider                            | Propósito                                          |
| ----------------------------------- | -------------------------------------------------- |
| `provideBrowserGlobalErrorListeners()` | Captura errores globales del navegador           |
| `provideRouter(routes)`            | Registra la tabla de rutas                          |
| `provideHttpClient(withFetch())`   | HttpClient usando Fetch API (no XMLHttpRequest)     |
| `withInterceptors([authInterceptor])` | Registra el interceptor funcional de auth        |
