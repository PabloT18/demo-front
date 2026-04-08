import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    signal,
    viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user.model';
import { PageResponse } from '../../../../shared/models/page.model';
import { UserProfileCardComponent } from '../../components/user-profile-card/user-profile-card';

@Component({
    selector: 'app-community-gallery',
    imports: [UserProfileCardComponent],
    templateUrl: './community-gallery.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityGalleryComponent implements OnInit, OnDestroy {
    private readonly usersService = inject(UsersService);

    readonly users = signal<User[]>([]);
    readonly loading = signal(false);
    readonly initialLoading = signal(true);
    readonly error = signal<string | null>(null);
    readonly currentPage = signal(0);
    readonly hasMore = signal(true);

    private readonly pageSize = 5;
    private observer: IntersectionObserver | null = null;

    readonly scrollSentinel = viewChild<ElementRef>('scrollSentinel');

    readonly isEmpty = computed(() => !this.initialLoading() && !this.error() && this.users().length === 0);
    readonly showLoadingMore = computed(() => this.loading() && !this.initialLoading());

    readonly skeletons = Array(8);
    readonly loadingSkeletons = Array(4);

    constructor() {
        effect(() => {
            const el = this.scrollSentinel();
            if (el) {
                this.observer?.disconnect();
                this.observer = new IntersectionObserver(
                    (entries) => {
                        if (entries[0]?.isIntersecting && this.hasMore() && !this.loading()) {
                            this.loadMore();
                        }
                    },
                    { rootMargin: '200px' }
                );
                this.observer.observe(el.nativeElement);
            } else {
                this.observer?.disconnect();
            }
        });
    }

    ngOnInit(): void {
        this.loadInitial();
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    private loadInitial(): void {
        this.loading.set(true);
        this.initialLoading.set(true);
        this.error.set(null);

        this.usersService.getUsers({ page: 0, size: this.pageSize }).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.users.set(data);
                    this.hasMore.set(false);
                } else {
                    this.users.set(data.content);
                    this.hasMore.set(!data.last);
                    this.currentPage.set(0);
                }
                this.loading.set(false);
                this.initialLoading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.handleError(err);
                this.initialLoading.set(false);
            },
        });
    }

    private loadMore(): void {
        if (this.loading() || !this.hasMore()) return;

        const nextPage = this.currentPage() + 1;
        this.loading.set(true);

        this.usersService.getUsers({ page: nextPage, size: this.pageSize }).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.users.update((current) => [...current, ...data]);
                    this.hasMore.set(false);
                } else {
                    const existingIds = new Set(this.users().map((u) => u.id));
                    const newUsers = data.content.filter((u) => !existingIds.has(u.id));
                    this.users.update((current) => [...current, ...newUsers]);
                    this.hasMore.set(!data.last);
                    this.currentPage.set(nextPage);
                }
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.handleError(err);
            },
        });
    }

    retry(): void {
        if (this.users().length === 0) {
            this.loadInitial();
        } else {
            this.error.set(null);
            this.loadMore();
        }
    }

    onViewProfile(user: User): void {
        // Future: navigate to user detail page
    }

    private handleError(err: HttpErrorResponse): void {
        if (err.status === 0) {
            this.error.set('No se puede conectar con el servidor. Verifique su conexión.');
        } else if (err.status >= 500) {
            this.error.set('Error del servidor. Intente nuevamente más tarde.');
        } else {
            this.error.set('No fue posible cargar los usuarios. Intente nuevamente.');
        }
        this.loading.set(false);
    }
}
