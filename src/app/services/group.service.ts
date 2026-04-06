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

export interface GroupMember {
  groupMemebrId?: number;
  name: string;
  email: string;
  phone?: string;
  groupId: number | string;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = `${environment.apiUrl}/groups`;
  private membersUrl = `${environment.apiUrl}/group-members`;

  constructor(private http: HttpClient) {}

  getGroupsByUser(userId: number | string): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}?userId=${userId}`);
  }

  createGroup(payload: any): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, payload);
  }

  deleteGroup(groupId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}?groupId=${groupId}`);
  }

  addGroupMember(payload: GroupMember): Observable<GroupMember> {
    return this.http.post<GroupMember>(this.membersUrl, payload);
  }

  getGroupMembers(groupId: number | string): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${this.membersUrl}/${groupId}`);
  }

  deleteGroupMember(groupMemberId: number): Observable<any> {
    return this.http.delete<any>(`${this.membersUrl}?groupMemberId=${groupMemberId}`);
  }
}
