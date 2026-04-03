import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar autenticación con validación de token
    if (authService.isAuthenticated() && authService.getToken()) {
        return true;
    }

    // Si no está autenticado o no tiene token, redirigir a login
    console.warn('Acceso denegado: usuario no autenticado');
    router.navigate(['/login']);
    return false;
};
