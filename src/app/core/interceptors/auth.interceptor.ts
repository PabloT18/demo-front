import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Solo agregar token si:
    // 1. El token existe y no está vacío
    // 2. La URL es de nuestra API
    // 3. No es una petición de login (para evitar loops)
    let clonedReq = req;
    if (token && req.url.startsWith(environment.apiUrl) && !req.url.includes('/auth/login')) {
        clonedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
    }

    return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Manejar error 401 globalmente
            if (error.status === 401) {
                // Solo hacer logout si estamos autenticados
                // Esto evita loops infinitos en la página de login
                if (authService.isAuthenticated() && !req.url.includes('/auth/login')) {
                    console.warn('Token expirado o inválido, cerrando sesión...');
                    authService.logout();
                }
            }

            return throwError(() => error);
        })
    );
};
