import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">Live Route Tracking & Telemetry</h1>
          <p class="text-slate-400 text-sm">Real-time GPS coordinates and Inertial Measurement Unit (IMU) data</p>
        </div>
        <div class="flex gap-4">
          <select class="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
            <option>SHIP-100234 (Active)</option>
            <option>SHIP-100235 (Delivered)</option>
          </select>
          <button class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700 flex items-center gap-2">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Map Section -->
        <div class="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl flex flex-col h-[600px]">
          <div class="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
            <h2 class="text-white font-semibold flex items-center gap-2">
              <i class="fas fa-map-marker-alt text-blue-500"></i> GPS Location
            </h2>
            <span class="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Updating 1Hz</span>
          </div>
          <div class="flex-1 relative">
            <div id="map" class="absolute inset-0 z-0"></div>
          </div>
        </div>

        <!-- Right Panel: IMU Data & Impact History -->
        <div class="flex flex-col gap-6 h-[600px]">
          <!-- Accelerometer Chart -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-xl flex-1 flex flex-col">
            <h2 class="text-white font-semibold mb-4 flex items-center gap-2">
              <i class="fas fa-wave-square text-green-500"></i> Accelerometer (G-Force)
            </h2>
            <div class="flex-1 relative min-h-[200px]">
              <canvas baseChart
                [data]="accelChartData"
                [options]="accelChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </div>

          <!-- Impact Events -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-xl flex-1 flex flex-col overflow-hidden">
            <h2 class="text-white font-semibold mb-4 flex items-center gap-2">
              <i class="fas fa-car-crash text-red-500"></i> Shock & Impact Events
            </h2>
            <div class="flex-1 overflow-y-auto pr-2 space-y-3">
              <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div class="flex justify-between items-start mb-1">
                  <span class="text-red-400 font-bold text-sm">SEVERE IMPACT</span>
                  <span class="text-slate-500 text-xs">10:42 AM</span>
                </div>
                <p class="text-slate-300 text-sm">Force: 3.2G detected on Z-axis. Potential drop.</p>
              </div>
              
              <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div class="flex justify-between items-start mb-1">
                  <span class="text-amber-400 font-bold text-sm">TILT WARNING</span>
                  <span class="text-slate-500 text-xs">09:15 AM</span>
                </div>
                <p class="text-slate-300 text-sm">Package tilted > 45 degrees.</p>
              </div>
              
              <div class="bg-slate-900/50 rounded-lg p-3">
                <div class="flex justify-between items-start mb-1">
                  <span class="text-slate-400 font-bold text-sm">SYSTEM ARMED</span>
                  <span class="text-slate-500 text-xs">08:00 AM</span>
                </div>
                <p class="text-slate-300 text-sm">Gyroscope calibrated.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Ensure the Leaflet map container has proper styling */
    #map { width: 100%; height: 100%; border-radius: 0 0 0.75rem 0.75rem; }
    /* Dark mode map tiles override */
    ::ng-deep .leaflet-layer,
    ::ng-deep .leaflet-control-zoom-in,
    ::ng-deep .leaflet-control-zoom-out,
    ::ng-deep .leaflet-control-attribution {
      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
    }
  `]
})
export class TrackingComponent implements AfterViewInit {
  private map!: L.Map;

  // IMU Data Chart (X, Y, Z forces)
  public accelChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['-30s', '-25s', '-20s', '-15s', '-10s', '-5s', 'Now'],
    datasets: [
      { data: [0.1, 0.2, 0.1, 0.3, 3.2, 0.5, 0.1], label: 'Z-Axis (G)', borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 },
      { data: [0.0, 0.1, 0.0, -0.1, 0.8, -0.2, 0.0], label: 'X-Axis (G)', borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 },
      { data: [0.0, 0.0, -0.1, 0.1, 1.2, 0.1, 0.0], label: 'Y-Axis (G)', borderColor: '#f59e0b', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 }
    ]
  };
  public accelChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { point: { radius: 2 } },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#94a3b8' } }
    },
    plugins: { legend: { labels: { color: '#cbd5e1' } } }
  };

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    // Initialize map centered roughly in India
    this.map = L.map('map').setView([19.0760, 72.8777], 6);

    // Standard OpenStreetMap tiles (which we invert via CSS for dark mode)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Create a custom icon for the truck/device
    const truckIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-blue-500/30 animate-pulse">
              <i class="fas fa-truck text-xs"></i>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Mock Route line
    const latlngs: L.LatLngExpression[] = [
      [19.0760, 72.8777], // Mumbai
      [21.1458, 79.0882], // Nagpur
      [28.7041, 77.1025]  // Delhi
    ];

    L.polyline(latlngs, { color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '10, 10' }).addTo(this.map);

    // Current location marker (Nagpur)
    L.marker([21.1458, 79.0882], { icon: truckIcon }).addTo(this.map)
      .bindPopup('<b class="text-slate-800">NODE-DEMO-01</b><br>Speed: 45 km/h')
      .openPopup();
  }
}
