import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  isSidebarOpen = true;

  constructor(private router: Router, private supabase: SupabaseService) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
