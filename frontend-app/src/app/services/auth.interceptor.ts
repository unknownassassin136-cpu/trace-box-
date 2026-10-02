import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const session = authService.getSession();
  
  if (session && session.access_token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${session.access_token}`)
    });
    return next(authReq);
  }
  
  return next(req);
};
