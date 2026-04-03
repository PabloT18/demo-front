# Manejo de Errores en Users Page

Este documento explica cómo se manejan los diferentes tipos de errores en la aplicación.

## 🔐 Error 401 - Token Expirado o Inválido

**Comportamiento:**
1. El interceptor detecta el error 401
2. Llama automáticamente a `authService.logout()`
3. Elimina el token y datos del usuario del localStorage
4. Redirige al usuario a `/login`
5. El usuario ve la página de login

**Código responsable:**
- `auth.interceptor.ts` - Manejo global de errores 401
- `auth.service.ts` - Método `logout()` que limpia y redirige

**Cuándo ocurre:**
- Token JWT expirado
- Token eliminado del navegador
- Token manipulado o inválido
- Servidor rechaza el token

---

## 🌐 Error 0 - Sin Conexión a Internet

**Mensaje mostrado:**
> "No se puede conectar con el servidor. Verifique su conexión a internet."

**Cuándo ocurre:**
- Sin conexión a internet
- Servidor no accesible
- Error CORS
- DNS no resuelve

---

## 🔥 Error 500+ - Error del Servidor

**Mensaje mostrado:**
> "Error del servidor. Por favor, intente nuevamente más tarde."

**Cuándo ocurre:**
- Error interno del servidor (500)
- Servicio no disponible (503)
- Gateway timeout (504)
- Cualquier error 5xx

---

## ⚠️ Otros Errores (400, 403, 404, etc.)

**Mensaje mostrado:**
> "No fue posible cargar los usuarios. Por favor, intente nuevamente."

**Cuándo ocurre:**
- Bad request (400)
- Forbidden (403)
- Not found (404)
- Otros errores del cliente

---

## 🔄 Botón "Reintentar"

En cualquier error (excepto 401), se muestra un botón "Reintentar" que:
1. Limpia el error actual
2. Activa el estado de carga
3. Vuelve a intentar cargar los usuarios

---

## 📋 Flujo Completo

```
Usuario accede a /users
    ↓
Guard verifica autenticación
    ↓
┌─────────────────┐
│ ¿Autenticado?   │
└────────┬────────┘
         │
    ┌────┴────┐
   NO        SI
    │         │
    ↓         ↓
Redirige  Carga página
a /login  y hace request
    │         │
    │         ↓
    │    ┌──────────────┐
    │    │ HTTP Request │
    │    └──────┬───────┘
    │           │
    │      ┌────┴────┐
    │     200      Error
    │      │         │
    │      ↓         ↓
    │   Muestra   ┌──────────┐
    │   datos    │ ¿Tipo?   │
    │            └────┬─────┘
    │                 │
    │      ┌──────────┼──────────┐
    │     401        0        500+
    │      │         │          │
    │      ↓         ↓          ↓
    │  Interceptor Error de  Error de
    │  hace logout  red     servidor
    │      │         │          │
    │      ↓         ↓          ↓
    │  Redirige  Muestra   Muestra
    │  a /login  mensaje   mensaje
    │      │         │          │
    └──────┴─────────┴──────────┘
              │
              ↓
         Usuario ve
        mensaje/login
```

---

## ✅ Testing Manual

Para probar cada escenario:

### 1. Token Expirado
```javascript
// En la consola del navegador
localStorage.setItem('auth_token', 'token_invalido');
// Luego intentar cargar /users
```

### 2. Sin Conexión
- Desconectar el wifi
- Intentar cargar usuarios

### 3. Servidor Caído
- Detener el backend
- Intentar cargar usuarios

### 4. Token Eliminado
```javascript
// En la consola del navegador
localStorage.removeItem('auth_token');
localStorage.removeItem('auth_user');
// Luego intentar acceder a /users (debe redirigir a /login por el guard)
```
