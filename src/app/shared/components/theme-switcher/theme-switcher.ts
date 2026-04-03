import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';

@Component({
    selector: 'app-theme-switcher',
    imports: [TitleCasePipe],
    templateUrl: './theme-switcher.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcherComponent {
    // Temas disponibles
    readonly themes = ['light', 'dark', 'cupcake', 'cyberpunk', 'synthwave', 'forest', 'sunset'];

    // Tema actual reactivo
    readonly currentTheme = signal<string>(this.getStoredTheme());

    constructor() {
        // Aplicar el tema inicial
        this.applyTheme(this.currentTheme());

        // Actualizar el tema cuando cambie
        effect(() => {
            this.applyTheme(this.currentTheme());
        });
    }

    // Obtiene el tema guardado o el predeterminado
    private getStoredTheme(): string {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') ?? 'light';
        }
        return 'light';
    }

    // Cambia el tema y lo guarda
    setTheme(theme: string): void {
        this.currentTheme.set(theme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', theme);
        }
    }

    // Aplica el tema al documento
    private applyTheme(theme: string): void {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
}
