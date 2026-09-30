import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-white">Active Shipments</h1>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <i class="fas fa-plus"></i> New Shipment
        </button>
      </div>

      <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900/50 text-slate-400 uppercase text-xs">
              <tr>
                <th class="px-6 py-4">Shipment ID</th>
                <th class="px-6 py-4">Origin</th>
                <th class="px-6 py-4">Destination</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Device ID</th>
                <th class="px-6 py-4">Start Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700">
              <tr *ngFor="let shipment of shipments" class="hover:bg-slate-700/30 transition-colors">
                <td class="px-6 py-4 font-medium text-white">{{ shipment.id }}</td>
                <td class="px-6 py-4">{{ shipment.origin }}</td>
                <td class="px-6 py-4">{{ shipment.destination }}</td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="{
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20': shipment.status === 'IN_TRANSIT',
                      'bg-green-500/10 text-green-400 border border-green-500/20': shipment.status === 'DELIVERED',
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20': shipment.status === 'PENDING'
                    }">
                    {{ shipment.status.replace('_', ' ') }}
                  </span>
                </td>
                <td class="px-6 py-4 font-mono text-slate-400">{{ shipment.deviceId }}</td>
                <td class="px-6 py-4">{{ shipment.startTime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ShipmentsComponent {
  shipments = [
    { id: 'SHIP-100234', origin: 'Mumbai Port', destination: 'Delhi Hub', status: 'IN_TRANSIT', deviceId: 'NODE-DEMO-01', startTime: '2026-09-26 08:00 AM' },
    { id: 'SHIP-100235', origin: 'Chennai Warehouse', destination: 'Bangalore Store', status: 'DELIVERED', deviceId: 'NODE-DEMO-02', startTime: '2026-09-24 10:30 AM' },
    { id: 'SHIP-100236', origin: 'Kolkata Facility', destination: 'Patna Hub', status: 'PENDING', deviceId: 'NODE-DEMO-03', startTime: '--' }
  ];
}
