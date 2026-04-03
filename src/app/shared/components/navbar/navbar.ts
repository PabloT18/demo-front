import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive, ThemeSwitcherComponent],
    templateUrl: './navbar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
    private readonly authService = inject(AuthService);

    readonly isAuthenticated = this.authService.isAuthenticated;
    readonly currentUser = this.authService.currentUser;

    logout(): void {
        this.authService.logout();
    }
}
