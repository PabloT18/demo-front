import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.model';
import { PageResponse } from '../../../../shared/models/page.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';

@Component({
    selector: 'app-users-page',
    imports: [ReactiveFormsModule, PaginationComponent],
    templateUrl: './users-page.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent implements OnInit {
    private readonly usersService = inject(UsersService);

    readonly users = signal<User[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    readonly currentPage = signal(0);
    readonly pageSize = signal(5);
    readonly totalPages = signal(0);
    readonly totalElements = signal(0);
    readonly showAll = signal(false);

    readonly total = computed(() => this.showAll() ? this.users().length : this.totalElements());

    readonly searchControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] });

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading.set(true);
        this.error.set(null);

        const name = this.searchControl.value.trim() || undefined;
        const params = {
            name,
            all: this.showAll(),
            page: this.currentPage(),
            size: this.pageSize(),
        };

        this.usersService.getUsers(params).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.users.set(data);
                    this.totalElements.set(data.length);
                    this.totalPages.set(1);
                } else {
                    this.users.set(data.content);
                    this.totalElements.set(data.totalElements);
                    this.totalPages.set(data.totalPages);
                }
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No fue posible cargar los usuarios. Verifique que el servidor esté activo.');
                this.loading.set(false);
            },
        });
    }

    onSearch(): void {
        this.currentPage.set(0);
        this.loadUsers();
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        this.currentPage.set(0);
        this.loadUsers();
    }

    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadUsers();
    }

    onSizeChange(size: number): void {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadUsers();
    }

    onShowAllChange(showAll: boolean): void {
        this.showAll.set(showAll);
        this.currentPage.set(0);
        this.loadUsers();
    }
}
