import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { User } from '../../models/user.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state';

@Component({
    selector: 'app-user-table',
    imports: [
        EmptyStateComponent,
    ],
    templateUrl: './user-table.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent {
    readonly users = input.required<User[]>();
    readonly loading = input<boolean>(false);

    readonly userClick = output<User>();

    onUserClick(user: User): void {
        this.userClick.emit(user);
    }
}
