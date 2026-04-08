import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-user-profile-card',
    templateUrl: './user-profile-card.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileCardComponent {
    readonly user = input.required<User>();
    readonly viewProfile = output<User>();

    private readonly colorPairs = [
        'bg-primary text-primary-content',
        'bg-secondary text-secondary-content',
        'bg-accent text-accent-content',
        'bg-info text-info-content',
        'bg-success text-success-content',
        'bg-warning text-warning-content',
    ];

    readonly initial = computed(() => this.user().name?.charAt(0)?.toUpperCase() ?? '?');
    readonly avatarClass = computed(() => this.colorPairs[this.user().id % this.colorPairs.length]);

    formatRole(role: string): string {
        return role.replace('ROLE_', '');
    }



    private avatars = [
        'https://i.pravatar.cc/150?img=1',
        'https://i.pravatar.cc/150?img=2',
        'https://i.pravatar.cc/150?img=3',
        'https://i.pravatar.cc/150?img=4',
        'https://i.pravatar.cc/150?img=5',
        'https://i.pravatar.cc/150?img=6',
    ];

    avatarUrl = computed(() => {
        const user = this.user();
        if (!user) return null;

        // determinístico por usuario (no cambia en cada render)
        const index = this.hash(user.email) % this.avatars.length;
        return this.avatars[index];
    });

    private hash(value: string): number {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash = (hash << 5) - hash + value.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
}
