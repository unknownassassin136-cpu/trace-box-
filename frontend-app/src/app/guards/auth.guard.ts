import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  const session = await supabase.getSession();
  if (session) {
    return true; // Authenticated
  } else {
    // Redirect to login if not authenticated
    return router.parseUrl('/login');
  }
};
