import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/login`;
  
  isAuthenticated = signal(false);
  currentUserId = signal<number | string | null>(null);
  currentUserData = signal<any>(null);

  constructor(private http: HttpClient) {
    this.checkTokenAndSetState();
  }

  private checkTokenAndSetState(): void {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      this.isAuthenticated.set(true);
      this.decodeAndSetUser(token);
    } else {
      this.isAuthenticated.set(false);
      this.currentUserId.set(null);
      this.currentUserData.set(null);
    }
  }

  private decodeAndSetUser(token: string): void {
    try {
      // Decode the payload part of the JWT (part 2)
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decodedJson);
      
      this.currentUserData.set(payload);
      
      // Look for userId, id, or sub in the payload
      const userId = payload.userId || payload.id || payload.sub;
      if (userId) {
        this.currentUserId.set(userId);
      } else {
        console.warn('JWT decoded, but no userId found in payload:', payload);
      }
    } catch (e) {
      console.error('Failed to decode JWT token:', e);
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password }).pipe(
      tap({
        next: (response) => {
          let token = null;
          if (typeof response === 'string') {
            token = response;
          } else if (response && response.token) {
            token = response.token;
          } else if (response && response.jwt) {
            token = response.jwt;
          } else if (response && response.accessToken) {
            token = response.accessToken;
          }
          
          if (token) {
            localStorage.setItem('jwt_token', token);
            this.checkTokenAndSetState();
          } else {
            console.warn('Login succeeded but no token was found in the response.', response);
          }
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.isAuthenticated.set(false);
    this.currentUserId.set(null);
    this.currentUserData.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}
