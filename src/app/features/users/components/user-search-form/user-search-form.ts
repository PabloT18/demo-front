import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-user-search-form',
    imports: [ReactiveFormsModule],
    templateUrl: './user-search-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearchFormComponent {
    readonly loading = input<boolean>(false);

    readonly searchControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] });

    readonly search = output<string>();
    readonly clear = output<void>();

    onSubmit(): void {
        const searchValue = this.searchControl.value.trim();
        this.search.emit(searchValue);
    }

    onClear(): void {
        this.searchControl.setValue('');
        this.clear.emit();
    }
}
