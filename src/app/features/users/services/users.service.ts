import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/users`;

    getUsers(name?: string): Observable<User[]> {
        let params = new HttpParams();
        if (name?.trim()) {
            params = params.set('name', name.trim());
        }
        return this.http.get<User[]>(this.apiUrl, { params });
    }
}
