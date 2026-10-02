import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-white">Active Shipments</h1>
        <button (click)="openCreateModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <i class="fas fa-plus"></i> New Shipment
        </button>
      </div>

      <!-- Create Shipment Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div class="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl">
          <h2 class="text-xl font-bold text-white mb-6">Create New Shipment</h2>
          
          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Shipment ID</label>
              <input [(ngModel)]="newShipment.shipmentId" type="text" placeholder="e.g. SHIP-9901" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Select Hardware Node</label>
              <select [(ngModel)]="newShipment.deviceId" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                <option value="">-- Choose a Device --</option>
                <option *ngFor="let dev of availableDevices" [value]="dev.deviceId">{{ dev.deviceId }} ({{ dev.status }})</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Origin City/Address</label>
              <input [(ngModel)]="newShipment.origin" type="text" placeholder="e.g. Mumbai, India" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1">Destination City/Address</label>
              <input [(ngModel)]="newShipment.destination" type="text" placeholder="e.g. Delhi, India" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            </div>
          </div>

          <div *ngIf="createError" class="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {{ createError }}
          </div>

          <div class="flex gap-4">
            <button (click)="showModal = false" class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
            <button (click)="createShipment()" [disabled]="isCreating" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
              <span *ngIf="!isCreating">Create Route</span>
              <i *ngIf="isCreating" class="fas fa-spinner fa-spin"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Shipments Table -->
      <div *ngIf="isLoading" class="text-center py-12">
        <i class="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
        <p class="text-slate-400">Loading shipments...</p>
      </div>

      <div *ngIf="!isLoading && shipments.length === 0" class="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
        <i class="fas fa-truck-loading text-6xl text-slate-600 mb-4"></i>
        <p class="text-slate-400 mb-4">No shipments have been created yet.</p>
      </div>

      <div *ngIf="!isLoading && shipments.length > 0" class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
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
                <td class="px-6 py-4 font-medium text-white">{{ shipment.shipmentId }}</td>
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
                <td class="px-6 py-4">{{ shipment.startedAt | date:'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ShipmentsComponent implements OnInit {
  shipments: any[] = [];
  availableDevices: any[] = [];
  isLoading = true;
  
  showModal = false;
  isCreating = false;
  createError = '';
  newShipment = {
    shipmentId: '',
    deviceId: '',
    origin: '',
    destination: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.api.get('/shipments').subscribe({
      next: (res) => {
        this.shipments = res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  openCreateModal() {
    this.api.get('/devices').subscribe(res => {
      this.availableDevices = res;
      this.showModal = true;
    });
  }

  createShipment() {
    if (!this.newShipment.shipmentId || !this.newShipment.deviceId || !this.newShipment.origin || !this.newShipment.destination) {
      this.createError = 'All fields are required';
      return;
    }

    this.isCreating = true;
    this.createError = '';

    this.api.post('/shipments', this.newShipment).subscribe({
      next: (res) => {
        this.isCreating = false;
        this.showModal = false;
        this.newShipment = { shipmentId: '', deviceId: '', origin: '', destination: '' };
        this.loadData(); // Refresh list
      },
      error: (err) => {
        this.isCreating = false;
        this.createError = err.error?.error || 'Failed to create shipment';
      }
    });
  }
}
