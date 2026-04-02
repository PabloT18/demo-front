import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';

@Component({
    selector: 'app-pagination',
    imports: [],
    templateUrl: './pagination.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
    totalPages = input(0);
    currentPage = input(0);

    pageChange = output<number>();

    activePage = linkedSignal(() => this.currentPage());

    getPagesList = computed(() => {
        const total = this.totalPages();
        const current = this.activePage();
        const maxVisible = 5;

        if (total <= maxVisible) {
            return Array.from({ length: total }, (_, i) => i);
        }

        const halfVisible = Math.floor(maxVisible / 2);
        let start = Math.max(0, current - halfVisible);
        let end = Math.min(total, start + maxVisible);

        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible);
        }

        return Array.from({ length: end - start }, (_, i) => start + i);
    });

    canGoPrevious = computed(() => this.activePage() > 0);
    canGoNext = computed(() => this.activePage() < this.totalPages() - 1);

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.activePage.set(page);
            this.pageChange.emit(page);
        }
    }

    previousPage(): void {
        if (this.canGoPrevious()) {
            this.goToPage(this.activePage() - 1);
        }
    }

    nextPage(): void {
        if (this.canGoNext()) {
            this.goToPage(this.activePage() + 1);
        }
    }
}
