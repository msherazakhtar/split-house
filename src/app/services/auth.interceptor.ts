import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Set this token to true on background/silent requests that should not trigger logout on 401
export const SKIP_AUTH_LOGOUT = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const outgoing = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(outgoing).pipe(
    catchError((err) => {
      if ((err.status === 401 || err.status === 403) && !req.context.get(SKIP_AUTH_LOGOUT)) {
        authService.logout();
      }
      return throwError(() => err);
    }),
  );
};
