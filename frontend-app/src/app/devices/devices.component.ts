import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-white">Hardware Devices</h1>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <i class="fas fa-microchip"></i> Register Device
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let device of devices" class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-bold text-white font-mono">{{ device.id }}</h3>
              <p class="text-sm text-slate-400">Firmware: {{ device.firmware }}</p>
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
                {{ device.battery }}%
                <i class="fas fa-battery-three-quarters text-green-400"></i>
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Last Ping</span>
              <span class="text-white font-medium">{{ device.lastSeen }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Active Shipment</span>
              <span class="text-blue-400 font-medium">{{ device.shipment || 'None' }}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">View Data</button>
            <button class="px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"><i class="fas fa-cog"></i></button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DevicesComponent {
  devices = [
    { id: 'NODE-DEMO-01', status: 'ONLINE', battery: 89, lastSeen: 'Just now', firmware: 'v1.2.0', shipment: 'SHIP-100234' },
    { id: 'NODE-DEMO-02', status: 'OFFLINE', battery: 12, lastSeen: '2 days ago', firmware: 'v1.1.8', shipment: null },
    { id: 'NODE-DEMO-03', status: 'ONLINE', battery: 100, lastSeen: '5 mins ago', firmware: 'v1.2.0', shipment: 'SHIP-100236' },
  ];
}
