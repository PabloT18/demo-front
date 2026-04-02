import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../models/user.model';
import { PageResponse } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/users`;

    getUsers(params: { name?: string; all?: boolean; page?: number; size?: number }): Observable<User[] | PageResponse<User>> {
        let httpParams = new HttpParams();

        if (params.name?.trim()) {
            httpParams = httpParams.set('name', params.name.trim());
        }

        if (params.all) {
            httpParams = httpParams.set('all', 'true');
            return this.http.get<User[]>(this.apiUrl, { params: httpParams });
        }

        if (params.page !== undefined) {
            httpParams = httpParams.set('page', params.page.toString());
        }

        if (params.size !== undefined) {
            httpParams = httpParams.set('size', params.size.toString());
        }

        return this.http.get<PageResponse<User>>(this.apiUrl, { params: httpParams });
    }
}
