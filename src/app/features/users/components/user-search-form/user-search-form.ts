import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-user-search-form',
    imports: [ReactiveFormsModule],
    templateUrl: './user-search-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearchFormComponent {
    readonly searchControl = input.required<FormControl<string>>();
    readonly loading = input<boolean>(false);

    readonly search = output<void>();
    readonly clear = output<void>();

    onSubmit(): void {
        this.search.emit();
    }

    onClear(): void {
        this.clear.emit();
    }
}
