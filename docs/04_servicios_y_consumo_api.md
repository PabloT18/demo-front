# 04 — Servicios y Consumo de API

## Visión General

El frontend consume una API REST en `http://localhost:8080` (configurada en `environments/`). Hay dos servicios inyectables:

| Servicio        | Scope            | Endpoints                | Responsabilidad             |
| --------------- | ---------------- | ------------------------ | --------------------------- |
| `AuthService`   | `providedIn: 'root'` | `POST /auth/login`   | Autenticación y estado JWT  |
| `UsersService`  | `providedIn: 'root'` | `GET /api/users`     | Consulta de usuarios        |

---

## AuthService

**Archivo:** `src/app/core/services/auth.service.ts`

### Endpoint

```
POST /auth/login
Content-Type: application/json

{
    "email": "admin@test.com",
    "password": "secret123"
}
```

### Respuesta esperada

```json
{
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "admin@test.com",
    "name": "Admin",
    "roles": ["ROLE_ADMIN"]
}
```

### Implementación

```typescript
login(request: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(
        `${environment.apiUrl}/auth/login`,
        request
    ).pipe(
        catchError((error: HttpErrorResponse) => {
            this.clearAuthData();
            return throwError(() => error);
        })
    );
}
```

- Usa `catchError` para limpiar datos corruptos si el login falla
- El componente que llama a `login()` se encarga de `.subscribe()` y manejar los estados de UI

### Persistencia

| Operación        | localStorage                              | Signal                    |
| ---------------- | ----------------------------------------- | ------------------------- |
| Login exitoso    | `setItem('auth_token')`, `setItem('auth_user')` | `currentUser.set(user)` |
| Logout           | `removeItem('auth_token')`, `removeItem('auth_user')` | `currentUser.set(null)` |
| Arranque de app  | `getItem('auth_user')` → parse → validar  | Valor inicial del signal  |

---

## UsersService

**Archivo:** `src/app/features/users/services/users.service.ts`

### Endpoint

```
GET /api/users
Authorization: Bearer <token>
```

### Parámetros de Query

| Parámetro | Tipo     | Descripción                            |
| --------- | -------- | -------------------------------------- |
| `name`    | `string` | Filtro por nombre (búsqueda parcial)   |
| `all`     | `"true"` | Si presente, retorna todos sin paginar |
| `page`    | `number` | Número de página (0-indexed)           |
| `size`    | `number` | Elementos por página                   |

### Respuestas

**Con paginación** (sin `all=true`):

```json
{
    "content": [
        { "id": 1, "name": "Admin", "email": "admin@test.com", "roles": ["ROLE_ADMIN"] }
    ],
    "totalPages": 3,
    "totalElements": 15,
    "number": 0,
    "size": 5,
    "first": true,
    "last": false,
    "empty": false
}
```

**Sin paginación** (con `all=true`):

```json
[
    { "id": 1, "name": "Admin", "email": "admin@test.com", "roles": ["ROLE_ADMIN"] },
    { "id": 2, "name": "User", "email": "user@test.com", "roles": ["ROLE_USER"] }
]
```

### Implementación

```typescript
getUsers(params: {
    name?: string;
    all?: boolean;
    page?: number;
    size?: number;
}): Observable<User[] | PageResponse<User>> {
    let httpParams = new HttpParams();

    if (params.name?.trim()) {
        httpParams = httpParams.set('name', params.name.trim());
    }

    if (params.all) {
        httpParams = httpParams.set('all', 'true');
        return this.http.get<User[]>(this.apiUrl, { params: httpParams });
    }

    if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
        httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<PageResponse<User>>(this.apiUrl, { params: httpParams });
}
```

**Puntos clave:**
- El tipo de retorno es un **union type**: `Observable<User[] | PageResponse<User>>`
- Si `all=true`, retorna un array plano; si no, retorna un objeto paginado
- El componente (`UsersPageComponent`) discrimina con `Array.isArray(data)`

---

## Modelos de Datos

### AuthUser

```typescript
export interface AuthUser {
    token: string;
    email: string;
    name: string;
    roles: string[];
}
```

### LoginRequest

```typescript
export interface LoginRequest {
    email: string;
    password: string;
}
```

### User

```typescript
export interface User {
    id: number;
    name: string;
    email: string;
    roles: string[];
}
```

### PageResponse\<T\>

```typescript
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;        // página actual
    size: number;          // tamaño de página
    first: boolean;
    last: boolean;
    empty: boolean;
    pageable: { ... };     // metadata de Spring Data
    sort: { ... };
    numberOfElements: number;
}
```

> **Nota:** Este modelo existe duplicado en `features/users/models/page.model.ts` y `shared/models/page.model.ts`.

---

## Flujo de Datos: Petición Completa

```
UsersPageComponent.loadUsers()
    │
    ├── Construye params: { name, all, page, size }
    │
    ├── usersService.getUsers(params).subscribe()
    │   │
    │   │  ┌── authInterceptor ──┐
    │   │  │ Agrega Bearer token │
    │   │  └─────────────────────┘
    │   │
    │   ├── GET /api/users?page=0&size=5
    │   │
    │   │  ┌── Backend responde ─┐
    │   │  │ 200 OK + JSON       │
    │   │  └─────────────────────┘
    │   │
    │   ├── next: (data) =>
    │   │   ├── Array.isArray(data)?
    │   │   │   ├── Sí: users.set(data), totalPages.set(1)
    │   │   │   └── No: users.set(data.content), totalPages.set(data.totalPages)
    │   │   └── loading.set(false)
    │   │
    │   └── error: (error) =>
    │       ├── status 0:   "No se puede conectar con el servidor"
    │       ├── status 401: Interceptor ya ejecutó logout
    │       ├── status 500+: "Error del servidor"
    │       └── loading.set(false)
    │
    └── Los signals se actualizan → OnPush re-renderiza
```

---

## Interceptor: Inyección de Token

El `authInterceptor` actúa como middleware para todas las peticiones HTTP:

```
Petición saliente
    │
    ├── ¿URL contiene environment.apiUrl?
    │   └── No → pasa sin modificar
    │
    ├── ¿URL es /auth/login?
    │   └── Sí → pasa sin modificar (login no necesita token)
    │
    ├── ¿Hay token en localStorage?
    │   └── Sí → clona request con header:
    │           Authorization: Bearer eyJhbG...
    │
    └── Respuesta:
        ├── ¿Error 401?
        │   └── authService.logout() (con anti-loop)
        └── ¿Otro error?
            └── Propaga al componente
```

---

## Environments

| Variable     | Desarrollo                       | Producción                       |
| ------------ | -------------------------------- | -------------------------------- |
| `production` | `false`                          | `true`                           |
| `apiUrl`     | `http://localhost:8080`          | `http://localhost:8080`          |

> Ambos entornos apuntan al mismo URL. En un despliegue real, el entorno de producción debería apuntar al servidor de producción.
