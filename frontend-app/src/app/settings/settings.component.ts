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
  devices: any[] = [];
  selectedDeviceId: string = '';
  
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
    this.fetchDevices();
  }

  fetchDevices() {
    this.http.get<any[]>('/api/devices').subscribe({
      next: (devices) => {
        this.devices = devices;
        if (this.devices.length > 0) {
          this.selectedDeviceId = this.devices[0].deviceId;
          this.fetchDeviceLimits();
        }
      },
      error: (err) => console.error('Failed to fetch devices:', err)
    });
  }

  onDeviceChange() {
    this.fetchDeviceLimits();
  }

  fetchDeviceLimits() {
    if (!this.selectedDeviceId) return;
    
    this.http.get<any>(`/api/devices/${this.selectedDeviceId}/config`).subscribe({
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
    if (!this.selectedDeviceId) return;

    this.isSavingLimits = true;
    this.saveStatus = 'Saving...';
    
    this.http.post<any>(`/api/devices/${this.selectedDeviceId}/config`, this.deviceLimits).subscribe({
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

  unlinkDevice() {
    if (!this.selectedDeviceId) return;
    
    if (confirm('Are you sure you want to unlink and delete config for this device?')) {
      this.http.delete(`/api/devices/${this.selectedDeviceId}`).subscribe({
        next: () => {
          this.fetchDevices(); // Refresh list
        },
        error: (err) => console.error('Failed to unlink device:', err)
      });
    }
  }
}
