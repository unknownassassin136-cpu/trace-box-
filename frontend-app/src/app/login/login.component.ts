import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  
  constructor(private router: Router, private supabase: SupabaseService) {}

  async login() {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      // Real Supabase Auth Integration
      const { error } = await this.supabase.signIn(this.email, this.password);
      
      if (error) {
        throw error;
      }

      // Success!
      this.router.navigate(['/app/dashboard']);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to authenticate.';
    } finally {
      this.isLoading = false;
    }
  }
}
