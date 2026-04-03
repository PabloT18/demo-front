import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    readonly currentUser = signal<AuthUser | null>(this.restoreUser());
    readonly isAuthenticated = computed(() => this.currentUser() !== null && this.hasValidToken());

    constructor() {
        // Validar token al iniciar la aplicación
        this.validateStoredToken();
    }

    login(request: LoginRequest): Observable<AuthUser> {
        return this.http.post<AuthUser>(`${environment.apiUrl}/auth/login`, request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Limpiar datos corruptos si existen
                this.clearAuthData();
                return throwError(() => error);
            })
        );
    }

    handleLoginSuccess(user: AuthUser): void {
        if (!user || !user.token) {
            console.error('Datos de usuario inválidos');
            return;
        }

        try {
            localStorage.setItem(TOKEN_KEY, user.token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            this.currentUser.set(user);
        } catch (error) {
            console.error('Error al guardar datos de autenticación:', error);
            this.clearAuthData();
        }
    }

    logout(): void {
        this.clearAuthData();
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            return token && token.trim() !== '' ? token : null;
        } catch {
            return null;
        }
    }

    private hasValidToken(): boolean {
        const token = this.getToken();
        return token !== null && token.length > 0;
    }

    private validateStoredToken(): void {
        const token = this.getToken();
        const user = this.currentUser();

        // Si hay usuario pero no hay token, o viceversa, limpiar todo
        if ((user && !token) || (!user && token)) {
            this.clearAuthData();
        }

        // Si el token parece corrupto (muy corto o inválido)
        if (token && token.length < 20) {
            console.warn('Token inválido detectado, limpiando...');
            this.clearAuthData();
        }
    }

    private restoreUser(): AuthUser | null {
        try {
            const stored = localStorage.getItem(USER_KEY);
            const token = localStorage.getItem(TOKEN_KEY);

            if (!stored || !token) {
                return null;
            }

            const user = JSON.parse(stored) as AuthUser;

            // Validar que tenga las propiedades necesarias
            if (!user.email || !user.name || !user.token) {
                console.warn('Datos de usuario incompletos, limpiando...');
                this.clearAuthData();
                return null;
            }

            return user;
        } catch (error) {
            console.error('Error al restaurar usuario:', error);
            this.clearAuthData();
            return null;
        }
    }

    private clearAuthData(): void {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            this.currentUser.set(null);
        } catch (error) {
            console.error('Error al limpiar datos de autenticación:', error);
        }
    }
}
