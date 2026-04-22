import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

const STORAGE_KEYS = ['jwt_token', 'user_profile'] as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/login`;
  private userApiUrl = `${environment.apiUrl}/user`;
  
  isAuthenticated = signal(false);
  currentUserId = signal<number | string | null>(null);
  currentUserData = signal<any>(null);
  userDetails = signal<any>(null); // Full database user profile

  constructor(private http: HttpClient) {
    this.checkTokenAndSetState();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private clearAuthState(): void {
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    this.isAuthenticated.set(false);
    this.currentUserId.set(null);
    this.currentUserData.set(null);
    this.userDetails.set(null);
  }

  private checkTokenAndSetState(): void {
    const token = localStorage.getItem('jwt_token');
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticated.set(true);
      this.decodeAndSetUser(token);

      const storedProfile = localStorage.getItem('user_profile');
      if (storedProfile) {
        try {
          this.userDetails.set(JSON.parse(storedProfile));
        } catch {
          localStorage.removeItem('user_profile');
        }
      }
    } else {
      this.clearAuthState();
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
      switchMap(response => {
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

          const userId = this.currentUserId();
          if (userId) {
            // Fetch the user details immediately and hold the login pipeline until done
            return this.http.get<any>(`${this.userApiUrl}/${userId}`).pipe(
              tap(profile => {
                this.userDetails.set(profile);
                localStorage.setItem('user_profile', JSON.stringify(profile));
              }),
              map(() => response) // Return the original login response
            );
          }
        } else {
          console.warn('Login succeeded but no token was found in the response.', response);
        }

        return of(response);
      })
    );
  }

  logout() {
    this.clearAuthState();
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}
