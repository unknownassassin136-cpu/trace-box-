import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

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
  
  constructor(private router: Router, private auth: AuthService) {}

  async login() {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      // Backend Auth Proxy Integration
      const response = await this.auth.signIn(this.email, this.password);
      
      if (response && response.error) {
        throw new Error(response.error.message);
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
