import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ne pas déconnecter automatiquement sur 401 pour l'instant :
      // le backend retourne 401 même avec un token valide (config CORS/Security à corriger).
      // Une fois le backend corrigé, décommenter la ligne ci-dessous :
      // if (error.status === 401) { authService.logout(); }
      return throwError(() => error);
    })
  );
};
