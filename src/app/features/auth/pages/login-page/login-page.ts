import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule],
    templateUrl: './login-page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly loading = signal(false);
    readonly errorMessage = signal<string | null>(null);

    readonly loginForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });

    onSubmit(): void {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        const { email, password } = this.loginForm.getRawValue();

        this.authService.login({ email, password }).subscribe({
            next: (user) => {
                this.authService.handleLoginSuccess(user);
                this.loading.set(false);
                this.router.navigate(['/users']);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);

                // Mensajes específicos según el tipo de error
                if (error.status === 0) {
                    this.errorMessage.set('No se puede conectar con el servidor. Verifique su conexión.');
                } else if (error.status === 401 || error.status === 400) {
                    this.errorMessage.set('Credenciales incorrectas. Verifique su email y contraseña.');
                } else if (error.status >= 500) {
                    this.errorMessage.set('Error del servidor. Intente nuevamente más tarde.');
                } else {
                    this.errorMessage.set('Error al iniciar sesión. Por favor, intente nuevamente.');
                }
            },
        });
    }
}
