import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-users-page',
    imports: [ReactiveFormsModule],
    templateUrl: './users-page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent implements OnInit {
    private readonly usersService = inject(UsersService);

    readonly users = signal<User[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly total = computed(() => this.users().length);

    readonly searchControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] });

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading.set(true);
        this.error.set(null);

        const name = this.searchControl.value.trim() || undefined;

        this.usersService.getUsers(name).subscribe({
            next: (data) => {
                this.users.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No fue posible cargar los usuarios. Verifique que el servidor esté activo.');
                this.loading.set(false);
            },
        });
    }

    onSearch(): void {
        this.loadUsers();
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        this.loadUsers();
    }
}
