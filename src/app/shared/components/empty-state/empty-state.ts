import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type IconType = 'users' | 'search' | 'error' | 'info';

@Component({
    selector: 'app-empty-state',
    imports: [],
    templateUrl: './empty-state.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
    readonly icon = input<IconType>('info');
    readonly message = input.required<string>();
    readonly description = input<string>();
}
