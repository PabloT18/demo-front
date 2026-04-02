import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [publicGuard],
        loadComponent: () =>
            import('./features/auth/pages/login-page/login-page').then(
                (m) => m.LoginPageComponent
            ),
    },
    {
        path: 'users',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/users/pages/users-page/users-page').then(
                (m) => m.UsersPageComponent
            ),
    },
    { path: '', redirectTo: 'users', pathMatch: 'full' },
    { path: '**', redirectTo: 'users' },
];
