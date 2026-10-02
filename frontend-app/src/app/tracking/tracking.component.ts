import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../services/api.service';

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
          <select (change)="onShipmentChange($event)" class="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
            <option *ngIf="shipments.length === 0" value="">No active shipments</option>
            <option *ngFor="let s of shipments" [value]="s.shipmentId">
              {{ s.shipmentId }} ({{ s.origin }} &rarr; {{ s.destination }})
            </option>
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
export class TrackingComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private marker!: L.Marker;
  private polyline!: L.Polyline;
  private originMarker!: L.Marker;
  private destMarker!: L.Marker;
  shipments: any[] = [];
  selectedShipmentId: string = '';
  
  // IMU Data Chart (X, Y, Z forces)
  public accelChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['-30s', '-25s', '-20s', '-15s', '-10s', '-5s', 'Now'],
    datasets: [
      { data: [0, 0, 0, 0, 0, 0, 0], label: 'Z-Axis (G)', borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 },
      { data: [0, 0, 0, 0, 0, 0, 0], label: 'X-Axis (G)', borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 },
      { data: [0, 0, 0, 0, 0, 0, 0], label: 'Y-Axis (G)', borderColor: '#f59e0b', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 }
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

  constructor(private api: ApiService) {}

  private pollingInterval: any;
  private lastReadingId: any = null;

  ngOnInit() {
    this.api.get('/shipments').subscribe({
      next: (res) => {
        this.shipments = res;
        if (this.shipments.length > 0) {
          this.selectedShipmentId = this.shipments[0].shipmentId;
          this.loadShipmentRoute(this.shipments[0]);
          this.pollTelemetryData(); // Initial fetch
        }
      }
    });

    // Fallback: Polling every 10 seconds for Vercel deployments where WebSockets fail
    this.pollingInterval = setInterval(() => {
      this.pollTelemetryData();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  async pollTelemetryData() {
    if (!this.selectedShipmentId) return;
    
    const activeShipment = this.shipments.find(s => s.shipmentId === this.selectedShipmentId);
    if (!activeShipment) return;

    try {
      const data = await this.api.getTelemetry(activeShipment.deviceId);
      if (data && data.length > 0) {
        const latest = data[0];
        
        if (latest.id !== this.lastReadingId) {
          this.lastReadingId = latest.id;
          
          // Update Marker
          if (this.marker && latest.lat !== null && latest.lng !== null) {
            this.marker.setLatLng([latest.lat, latest.lng]);
            this.marker.getPopup()?.setContent(`<b class="text-slate-800">${activeShipment.deviceId}</b><br>Speed: ${latest.speed || 0} km/h`);
            this.map.panTo([latest.lat, latest.lng]);
          }
          
          // Update Chart
          this.updateChart(latest.accelX || 0, latest.accelY || 0, latest.accelZ || 0);
        }
      }
    } catch (err) {
      console.error('Failed to poll tracking telemetry', err);
    }
  }

  onShipmentChange(event: any) {
    const sId = event.target.value;
    const s = this.shipments.find(x => x.shipmentId === sId);
    if(s) {
      this.selectedShipmentId = sId;
      this.loadShipmentRoute(s);
    }
  }

  loadShipmentRoute(shipment: any) {
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
    }
    // Remove previous origin/dest markers
    if (this.originMarker) this.map.removeLayer(this.originMarker);
    if (this.destMarker) this.map.removeLayer(this.destMarker);
    
    if (shipment.routePolyline) {
      try {
        const geojson = JSON.parse(shipment.routePolyline);
        // OSRM coordinates are [lon, lat], Leaflet expects [lat, lon]
        const latlngs = geojson.coordinates.map((c: any) => [c[1], c[0]]);
        this.polyline = L.polyline(latlngs, { color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '10, 10' }).addTo(this.map);
        
        // Add start and end pins
        if (latlngs.length > 0) {
          const startHtml = `<div class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white"><i class="fas fa-play text-[10px]"></i></div>`;
          const endHtml = `<div class="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white"><i class="fas fa-flag-checkered text-[10px]"></i></div>`;
          
          this.originMarker = L.marker(latlngs[0], {
            icon: L.divIcon({ className: 'custom-div-icon', html: startHtml, iconSize: [24, 24], iconAnchor: [12, 12] })
          }).addTo(this.map).bindPopup('<b>Origin</b>');
          
          this.destMarker = L.marker(latlngs[latlngs.length - 1], {
            icon: L.divIcon({ className: 'custom-div-icon', html: endHtml, iconSize: [24, 24], iconAnchor: [12, 12] })
          }).addTo(this.map).bindPopup('<b>Destination</b>');
        }
        
        this.map.fitBounds(this.polyline.getBounds(), { padding: [50, 50] });
      } catch (e) {
        console.error('Failed to parse route polyline');
      }
    }
  }

  updateChart(x: number, y: number, z: number) {
    const ds = this.accelChartData.datasets;
    // Shift data left
    ds[0].data.shift(); ds[0].data.push(z);
    ds[1].data.shift(); ds[1].data.push(x);
    ds[2].data.shift(); ds[2].data.push(y);
    // Angular/Chart.js requires a new reference to update
    this.accelChartData = { ...this.accelChartData };
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([19.0760, 72.8777], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const truckIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-blue-500/30 animate-pulse">
              <i class="fas fa-truck text-xs"></i>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.marker = L.marker([19.0760, 72.8777], { icon: truckIcon }).addTo(this.map)
      .bindPopup('<b class="text-slate-800">Waiting for data...</b>');
  }
}
