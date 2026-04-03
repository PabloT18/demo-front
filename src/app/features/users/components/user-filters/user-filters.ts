import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
    selector: 'app-user-filters',
    imports: [],
    templateUrl: './user-filters.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFiltersComponent {
    readonly pageSize = input.required<number>();
    readonly showAll = input.required<boolean>();
    readonly loading = input<boolean>(false);
    readonly pageSizeOptions = input<number[]>([5, 10]);

    readonly sizeChange = output<number>();
    readonly showAllChange = output<boolean>();

    onSizeChange(value: number): void {
        this.sizeChange.emit(value);
    }

    onShowAllChange(checked: boolean): void {
        this.showAllChange.emit(checked);
    }
}
