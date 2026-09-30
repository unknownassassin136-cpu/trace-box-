import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  // Placeholder data that will later be fetched from the backend APIs
  metrics = {
    temperature: { value: '8.4', unit: '°C', status: 'Normal' },
    humidity: { value: '72', unit: '%', status: 'Normal' },
    ethylene: { value: '0.31', unit: 'ppm', status: 'Normal' },
    battery: { value: '83', unit: '%', status: 'Good' },
    network: { value: 'ONLINE', status: 'Active' },
    pendingSync: { value: '0', status: 'Synced' },
    ledger: { value: 'VERIFIED', status: 'Secure' }
  };
}
