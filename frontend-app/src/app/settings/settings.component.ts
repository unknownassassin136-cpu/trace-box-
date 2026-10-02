import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  deviceLimits = {
    minTemp: 2.0,
    maxTemp: 8.0,
    minHumidity: 30.0,
    maxHumidity: 65.0,
    minEthylene: 0.0,
    maxEthylene: 150.0,
    minShock: 0.0,
    maxShock: 1.5
  };
  isSavingLimits: boolean = false;
  saveStatus: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchDeviceLimits();
  }

  fetchDeviceLimits() {
    this.http.get<any>('/api/devices/NODE-DEMO-01/config').subscribe({
      next: (config) => {
        if (config) {
          this.deviceLimits = {
            minTemp: config.minTemp ?? 2.0,
            maxTemp: config.maxTemp ?? 8.0,
            minHumidity: config.minHumidity ?? 30.0,
            maxHumidity: config.maxHumidity ?? 65.0,
            minEthylene: config.minEthylene ?? 0.0,
            maxEthylene: config.maxEthylene ?? 150.0,
            minShock: config.minShock ?? 0.0,
            maxShock: config.maxShock ?? 1.5
          };
        }
      },
      error: (err) => console.error('Failed to fetch device config:', err)
    });
  }

  saveDeviceLimits() {
    this.isSavingLimits = true;
    this.saveStatus = 'Saving...';
    
    this.http.post<any>('/api/devices/NODE-DEMO-01/config', this.deviceLimits).subscribe({
      next: (res) => {
        this.isSavingLimits = false;
        this.saveStatus = 'Saved Successfully!';
        setTimeout(() => this.saveStatus = '', 3000);
      },
      error: (err) => {
        this.isSavingLimits = false;
        this.saveStatus = 'Error saving limits';
        setTimeout(() => this.saveStatus = '', 3000);
        console.error('Save error:', err);
      }
    });
  }
}
