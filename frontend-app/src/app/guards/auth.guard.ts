import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const session = auth.getSession();
  if (session && session.access_token) {
    return true; // Authenticated
  } else {
    // Redirect to login if not authenticated
    return router.parseUrl('/login');
  }
};
