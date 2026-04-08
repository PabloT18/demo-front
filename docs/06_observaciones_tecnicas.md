# 06 — Observaciones Técnicas

## Fortalezas del Proyecto

### 1. Angular Moderno al 100%

El proyecto aprovecha las APIs más recientes de Angular 21:

| Característica                     | Estado |
| ---------------------------------- | ------ |
| Standalone components (sin NgModules) | ✅     |
| Signals para estado                | ✅     |
| `input()` / `output()` funcionales | ✅     |
| `computed()` para derivados        | ✅     |
| `linkedSignal()` para bidireccionalidad | ✅ |
| Control de flujo nativo (`@if`, `@for`, `@switch`) | ✅ |
| Guards funcionales (`CanActivateFn`) | ✅     |
| Interceptores funcionales (`HttpInterceptorFn`) | ✅ |
| `inject()` en vez de constructor injection | ✅ |
| Lazy loading con `loadComponent`   | ✅     |
| `OnPush` global                    | ✅     |

### 2. Separación Clara de Responsabilidades

- **Smart components** manejan estado y lógica (UsersPage, LoginPage)
- **Dumb components** solo reciben datos y emiten eventos (UserTable, UserFilters)
- **Services** encapsulan HTTP y estado global (AuthService, UsersService)
- **Guards/Interceptors** manejan preocupaciones transversales

### 3. Manejo de Errores HTTP Consistente

Tres niveles de manejo:

1. **Interceptor** — manejo global de 401 (logout automático)
2. **Servicio** — `catchError` limpia datos corruptos en el login
3. **Componente** — mensajes diferenciados por status code (0, 400/401, 500+)

### 4. UX con Estados de Carga

- Skeletons durante carga de datos (no spinners genéricos)
- Spinner en botón de login durante autenticación
- Empty state con icono SVG cuando la tabla está vacía
- Alert con botón "Reintentar" en caso de error

### 5. Sistema de Temas Completo

7 temas de daisyUI configurados con persistencia en localStorage y cambio dinámico sin recarga de página.

---

## Áreas de Mejora

### 1. Modelo Duplicado `PageResponse<T>`

El mismo interface existe en **dos ubicaciones**:

- `features/users/models/page.model.ts`
- `shared/models/page.model.ts`

**Impacto:** Si se cambia uno, el otro queda desactualizado. Se debería usar solo la versión de `shared/` e importarla desde allí.

### 2. Suscripciones Manuales sin `takeUntilDestroyed`

Los componentes usan `.subscribe()` directamente:

```typescript
this.usersService.getUsers(params).subscribe({
    next: (data) => { ... },
    error: (error) => { ... },
});
```

En este proyecto no causa memory leaks porque las peticiones HTTP se completan y se limpian solas. Sin embargo, si se agregan Observables de larga duración (WebSockets, intervalos), la falta de `takeUntilDestroyed()` o `DestroyRef` podría causar fugas de memoria.

### 3. Environments Idénticos

Tanto `environment.ts` como `environment.development.ts` apuntan al mismo `apiUrl`:

```typescript
// Ambos:
apiUrl: 'http://localhost:8080'
```

En un proyecto real, producción debería apuntar a un dominio diferente.

### 4. `onUserClick` Sin Implementar

```typescript
onUserClick(user: User): void {
    // Aquí puedes agregar lógica para cuando se hace clic en un usuario
}
```

El evento se emite y se captura, pero no hace nada. Podría navegar a un detalle del usuario o abrir un modal.

### 5. Input `loading` No Usado en UserTableComponent

```typescript
// Declarado en el componente:
readonly loading = input<boolean>(false);

// Pero nunca se lee en el template user-table.html
```

### 6. Seguridad del Token — Solo Validación de Longitud

La validación del token es básica:

```typescript
if (token && token.length < 20) {
    console.warn('Token inválido detectado, limpiando...');
    this.clearAuthData();
}
```

No verifica estructura JWT (header.payload.signature) ni fecha de expiración. Un token expirado se seguirá usando hasta que el backend retorne 401.

### 7. Sin Manejo de Expiración Proactiva

El token JWT tiene fecha de expiración, pero el frontend no la lee. El usuario seguirá navegando con un token expirado hasta que una petición falle con 401 y el interceptor fuerce el logout.

**Mejora posible:** Decodificar el payload del JWT, leer `exp`, y programar un logout automático o un refresh antes de expirar.

---

## Decisiones de Diseño Notables

### RxJS Mínimo + Signals

A diferencia de proyectos Angular tradicionales que dependen de RxJS para todo el estado (BehaviorSubject, combineLatest, switchMap), este proyecto:

- Usa **Signals para estado** → reactivo, sincrónico, sin boilerplate
- Usa **RxJS solo para HTTP** → donde Angular lo requiere nativamente
- **No usa** NgRx, NGXS ni stores globales

Esto reduce la complejidad significativamente pero limita patrones avanzados como debounce en búsquedas o cancelación automática de peticiones.

### `linkedSignal` para Paginación

`PaginationComponent` usa `linkedSignal` — una API que permite que un signal siga a un input pero también pueda ser escrito localmente. Este es un caso de uso ideal porque:

- El padre define la página actual
- El usuario puede hacer clic en una página (escritura local)
- Cuando el padre cambia la página (ej: al buscar), el signal se re-sincroniza

### HttpClient con `withFetch()`

```typescript
provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
```

Usa la Fetch API del navegador en lugar de XMLHttpRequest. Beneficios:
- Mejor rendimiento en streams
- Soporte nativo para Server-Side Rendering
- API más moderna

---

## Resumen de Tecnologías Usadas Correctamente

| Práctica                                    | Verificación |
| ------------------------------------------- | ------------ |
| TypeScript estricto (`strict: true`)        | ✅            |
| Standalone components (sin NgModules)       | ✅            |
| OnPush en todos los componentes             | ✅            |
| Signals para estado reactivo                | ✅            |
| Lazy loading en todas las rutas de feature  | ✅            |
| Guards funcionales                          | ✅            |
| Interceptores funcionales                   | ✅            |
| Reactive forms (no template-driven)         | ✅            |
| Separación Smart/Dumb components            | ✅            |
| Control de flujo nativo (`@if`, `@for`)     | ✅            |
| daisyUI con colores semánticos (no hardcoded) | ✅          |
| Temas respetuosos de dark mode              | ✅            |
| Responsive design                           | ✅            |
