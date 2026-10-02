import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-white">Hardware Devices</h1>
        <button (click)="showRegisterModal = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <i class="fas fa-microchip"></i> Register Device
        </button>
      </div>

      <!-- Registration Modal -->
      <div *ngIf="showRegisterModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
          <h2 class="text-xl font-bold text-white mb-2">Register Node</h2>
          <p class="text-slate-400 text-sm mb-6">Enter the 6-digit PIN displayed on your TraceNode OLED screen to claim it.</p>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-300 mb-2">Pairing PIN</label>
            <input [(ngModel)]="registrationCode" type="text" placeholder="e.g. 839210" 
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-center tracking-[0.5em] text-xl">
          </div>

          <div *ngIf="registerError" class="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {{ registerError }}
          </div>

          <div class="flex gap-4">
            <button (click)="showRegisterModal = false" class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
            <button (click)="registerDevice()" [disabled]="isRegistering" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
              <span *ngIf="!isRegistering">Link Device</span>
              <i *ngIf="isRegistering" class="fas fa-spinner fa-spin"></i>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="isLoading" class="text-center py-12">
        <i class="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
        <p class="text-slate-400">Loading your devices...</p>
      </div>

      <div *ngIf="!isLoading && devices.length === 0" class="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
        <i class="fas fa-boxes text-6xl text-slate-600 mb-4"></i>
        <p class="text-slate-400 mb-4">You haven't registered any TraceNode devices yet.</p>
        <button (click)="showRegisterModal = true" class="text-blue-400 hover:text-blue-300 font-medium">Register your first device &rarr;</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let device of devices" class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-bold text-white font-mono">{{ device.deviceId }}</h3>
              <p class="text-sm text-slate-400">Firmware: {{ device.firmware || 'v1.0.0' }}</p>
            </div>
            <span class="px-2 py-1 rounded text-xs font-bold"
              [ngClass]="device.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
              <i class="fas" [ngClass]="device.status === 'ONLINE' ? 'fa-wifi' : 'fa-plane'"></i> {{ device.status }}
            </span>
          </div>

          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Battery Level</span>
              <span class="text-white font-medium flex items-center gap-2">
                {{ device.battery || 'N/A' }}%
                <i class="fas fa-battery-three-quarters text-green-400"></i>
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Linked Date</span>
              <span class="text-white font-medium">{{ device.updatedAt | date:'shortDate' }}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">Thresholds</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DevicesComponent implements OnInit {
  devices: any[] = [];
  isLoading = true;
  showRegisterModal = false;
  registrationCode = '';
  isRegistering = false;
  registerError = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.isLoading = true;
    this.api.get('/devices').subscribe({
      next: (res) => {
        this.devices = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load devices', err);
        this.isLoading = false;
      }
    });
  }

  registerDevice() {
    if (!this.registrationCode) {
      this.registerError = 'Please enter a code';
      return;
    }
    
    this.isRegistering = true;
    this.registerError = '';
    
    this.api.post('/devices/register', { registrationCode: this.registrationCode }).subscribe({
      next: (res) => {
        this.isRegistering = false;
        this.showRegisterModal = false;
        this.registrationCode = '';
        this.loadDevices(); // Refresh list
      },
      error: (err) => {
        this.isRegistering = false;
        this.registerError = err.error?.error || 'Registration failed. Check PIN.';
      }
    });
  }
}
