import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'app-user-list-header',
    imports: [],
    templateUrl: './user-list-header.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListHeaderComponent {
    readonly title = input<string>('Gestión de Usuarios');
    readonly total = input.required<number>();
}
