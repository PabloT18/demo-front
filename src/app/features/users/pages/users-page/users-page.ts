import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { UserListHeaderComponent } from '../../components/user-list-header/user-list-header';
import { UserSearchFormComponent } from '../../components/user-search-form/user-search-form';
import { UserFiltersComponent } from '../../components/user-filters/user-filters';
import { UserTableComponent } from '../../components/user-table/user-table';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-users-page',
    imports: [
        PaginationComponent,
        UserListHeaderComponent,
        UserSearchFormComponent,
        UserFiltersComponent,
        UserTableComponent,
        RouterLink,
    ],
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

    readonly searchName = signal<string>('');

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading.set(true);
        this.error.set(null);

        const name = this.searchName() || undefined;
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
            error: (error: HttpErrorResponse) => {
                // El interceptor maneja automáticamente errores 401 (logout)
                // Aquí solo manejamos otros tipos de errores

                if (error.status === 0) {
                    // Error de red o CORS
                    this.error.set('No se puede conectar con el servidor. Verifique su conexión a internet.');
                } else if (error.status >= 500) {
                    // Error del servidor
                    this.error.set('Error del servidor. Por favor, intente nuevamente más tarde.');
                } else if (error.status === 401) {
                    // El usuario será redirigido al login por el interceptor
                    // Este mensaje probablemente no se verá
                    this.error.set('Sesión expirada. Redirigiendo al login...');
                } else {
                    // Otros errores
                    this.error.set('No fue posible cargar los usuarios. Por favor, intente nuevamente.');
                }

                this.loading.set(false);
            },
        });
    }

    onSearch(searchValue: string): void {
        this.searchName.set(searchValue);
        this.currentPage.set(0);
        this.loadUsers();
    }

    clearSearch(): void {
        this.searchName.set('');
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

    onUserClick(user: User): void {
        // Aquí puedes agregar lógica para cuando se hace clic en un usuario
    }
}
