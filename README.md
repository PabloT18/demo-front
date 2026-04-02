# My Page — Angular 21 + Signals + DaisyUI

Frontend SPA para la demostración de arquitectura en capas con consumo de API REST.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (standalone components) |
| Estado | Signals + computed |
| Estilos | TailwindCSS 4 + DaisyUI 5 |
| HTTP | HttpClient con interceptor JWT |
| Routing | Lazy loading + functional guards |
| Build | esbuild vía Angular CLI |
| Package manager | pnpm |

## Inicio rápido

```bash
pnpm install
pnpm start
```

La app inicia en **http://localhost:4200**.  
Requiere el backend corriendo en `http://localhost:8080`.

## Rutas

| Ruta | Componente | Guard | Descripción |
|------|-----------|-------|-------------|
| `/login` | LoginPageComponent | publicGuard | Formulario de login |
| `/users` | UsersPageComponent | authGuard | Tabla de usuarios |
| `/` | — | — | Redirige a `/users` |

## Arquitectura

```
src/app/
  core/
    guards/          → authGuard, publicGuard (CanActivateFn)
    interceptors/    → authInterceptor (HttpInterceptorFn)
    models/          → AuthUser, LoginRequest
    services/        → AuthService (signals + localStorage)

  features/
    auth/pages/      → LoginPageComponent (reactive form)
    users/
      models/        → User
      pages/         → UsersPageComponent (signals, búsqueda)
      services/      → UsersService

  shared/
    components/      → NavbarComponent (auth state, dropdown)
```

## Patrones usados

- **Signals** para estado reactivo (`signal`, `computed`)
- **@if / @for** control flow nativo (sin `*ngIf`, `*ngFor`)
- **Reactive Forms** con validaciones
- **Functional guards e interceptors** (sin clases)
- **Lazy loading** de rutas con `loadComponent`
- **OnPush** change detection en todos los componentes
- **inject()** en vez de constructor injection
