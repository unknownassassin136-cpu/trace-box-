import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription: any;

  // Real-time Metrics
  metrics = {
    temperature: { value: '--', unit: '°C', status: 'Pending' },
    humidity: { value: '--', unit: '%', status: 'Pending' },
    ethylene: { value: '--', unit: 'ppm', status: 'Pending' },
    battery: { value: '--', unit: '%', status: 'Pending' },
    network: { value: 'OFFLINE', status: 'Inactive' },
    pendingSync: { value: '0', status: 'Synced' },
    ledger: { value: 'PENDING', status: 'Checking' }
  };

  gpsStatus: string = 'Initializing...';
  lastUpdated: string = '--';


  // Common Chart Options
  public commonLineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  // Temperature Chart
  public tempChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Temperature (°C)',
      fill: true,
      tension: 0.4,
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    }]
  };

  // Humidity Chart
  public humChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Humidity (%)',
      fill: true,
      tension: 0.4,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  };

  // Ethylene Chart
  public ethChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ethylene (ppm)',
      fill: true,
      tension: 0.4,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)'
    }]
  };

  // Event Distribution Chart (Keeping mock for now as requested by previous instructions)
  public eventPieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Normal', 'Temperature Breach', 'Tamper Detected'],
    datasets: [{
      data: [300, 15, 2],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
    }]
  };
  
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.loadInitialData();
    
    // Subscribe to live telemetry inserts
    this.subscription = this.apiService.subscribeToTelemetry((payload) => {
      // payload format will be the raw object emitted from socket.io
      if (payload && payload.device_id === 'NODE-DEMO-01') {
        this.handleNewTelemetry(payload);
      }
    });
  }

  ngAfterViewInit() {
    // Map removed from dashboard
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  async loadInitialData() {
    try {
      const data = await this.apiService.getTelemetry('NODE-DEMO-01');
      if (data && data.length > 0) {
        // Reverse to get chronological order for charts (oldest first)
        const chronologicalData = [...data].reverse();
        
        chronologicalData.forEach(reading => {
          this.updateChartData(reading);
        });

        // Update cards and map with the most recent reading (index 0)
        this.updateCards(data[0]);
      } else {
        this.gpsStatus = 'No data available';
      }
    } catch (error) {
      console.error("Error loading initial telemetry", error);
      this.gpsStatus = 'Error loading data';
    }
  }

  handleNewTelemetry(reading: any) {
    this.updateCards(reading);
    this.updateChartData(reading);
  }

  updateCards(reading: any) {
    if (reading.temperature !== null && reading.temperature !== undefined) {
      this.metrics.temperature.value = reading.temperature.toFixed(1);
      this.metrics.temperature.status = 'Normal';
    }
    
    if (reading.humidity !== null && reading.humidity !== undefined) {
      this.metrics.humidity.value = reading.humidity.toFixed(1);
      this.metrics.humidity.status = 'Normal';
    }
    
    // Binding Ethylene to DB (whether it's air_quality or ethylene in payload)
    const ethValue = reading.ethylene ?? reading.air_quality;
    if (ethValue !== null && ethValue !== undefined) {
      this.metrics.ethylene.value = ethValue.toString();
      this.metrics.ethylene.status = 'Normal';
    }

    if (reading.battery !== null && reading.battery !== undefined) {
      this.metrics.battery.value = reading.battery.toString();
      this.metrics.battery.status = 'Good';
    } else {
      this.metrics.battery.value = '100'; // Default fallback if field doesn't exist
      this.metrics.battery.status = 'Good';
    }
    
    this.metrics.network.value = 'ONLINE';
    this.metrics.network.status = 'Active';
    this.metrics.ledger.value = 'VERIFIED';
    this.metrics.ledger.status = 'Secure';
    
    if (reading.timestamp) {
      // Supabase returns Postgres timestamps without timezone as ISO strings (e.g. '2026-09-30T07:04:12')
      // We append 'Z' to explicitly tell the browser this is UTC time, so it converts to local IST.
      const tsStr = typeof reading.timestamp === 'string' && !reading.timestamp.endsWith('Z') ? reading.timestamp + 'Z' : reading.timestamp;
      const date = new Date(tsStr);
      // Fallback if it's somehow a unix epoch number
      if (isNaN(date.getTime()) && !isNaN(Number(reading.timestamp))) {
        const ts = Number(reading.timestamp);
        this.lastUpdated = new Date(ts > 9999999999 ? ts : ts * 1000).toLocaleString();
      } else {
        this.lastUpdated = date.toLocaleString();
      }
    } else {
      this.lastUpdated = new Date().toLocaleString();
    }
  }

  updateChartData(reading: any) {
    let timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    if (reading.timestamp) {
      const tsStr = typeof reading.timestamp === 'string' && !reading.timestamp.endsWith('Z') ? reading.timestamp + 'Z' : reading.timestamp;
      const date = new Date(tsStr);
      if (isNaN(date.getTime()) && !isNaN(Number(reading.timestamp))) {
        const ts = Number(reading.timestamp);
        timeStr = new Date(ts > 9999999999 ? ts : ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
      } else {
        timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
      }
    }
    
    // Update Temp
    if (reading.temperature !== null && reading.temperature !== undefined) {
      this.tempChartData.labels?.push(timeStr);
      this.tempChartData.datasets[0].data.push(reading.temperature);
      if (this.tempChartData.labels!.length > 20) {
        this.tempChartData.labels?.shift();
        this.tempChartData.datasets[0].data.shift();
      }
    }

    // Update Hum
    if (reading.humidity !== null && reading.humidity !== undefined) {
      this.humChartData.labels?.push(timeStr);
      this.humChartData.datasets[0].data.push(reading.humidity);
      if (this.humChartData.labels!.length > 20) {
        this.humChartData.labels?.shift();
        this.humChartData.datasets[0].data.shift();
      }
    }

    // Update Ethylene
    const ethValue = reading.ethylene ?? reading.air_quality;
    if (ethValue !== null && ethValue !== undefined) {
      this.ethChartData.labels?.push(timeStr);
      this.ethChartData.datasets[0].data.push(ethValue);
      if (this.ethChartData.labels!.length > 20) {
        this.ethChartData.labels?.shift();
        this.ethChartData.datasets[0].data.shift();
      }
    }
    
    // Trigger change detection for charts
    this.tempChartData = { ...this.tempChartData };
    this.humChartData = { ...this.humChartData };
    this.ethChartData = { ...this.ethChartData };
  }

}
