import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Group {
  id?: number | string;
  name?: string;
  description?: string;
  // Fallbacks if the API uses different naming conventions
  title?: string;
  groupId?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  getGroupsByUser(userId: number | string): Observable<Group[]> {
    // Making a call to /groups?userId=X
    return this.http.get<Group[]>(`${this.apiUrl}?userId=${userId}`);
  }
}
