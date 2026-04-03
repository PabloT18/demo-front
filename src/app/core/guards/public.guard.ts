import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Si ya está autenticado con token válido, redirigir a users
    if (authService.isAuthenticated() && authService.getToken()) {
        router.navigate(['/users']);
        return false;
    }

    // Permitir acceso a páginas públicas
    return true;
};
