import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    readonly currentUser = signal<AuthUser | null>(this.restoreUser());
    readonly isAuthenticated = computed(() => this.currentUser() !== null);

    login(request: LoginRequest) {
        return this.http.post<AuthUser>(`${environment.apiUrl}/auth/login`, request);
    }

    handleLoginSuccess(user: AuthUser): void {
        localStorage.setItem(TOKEN_KEY, user.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    private restoreUser(): AuthUser | null {
        const stored = localStorage.getItem(USER_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored) as AuthUser;
        } catch {
            return null;
        }
    }
}
