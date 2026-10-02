import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private socket: Socket;

  constructor(private http: HttpClient) {
    // The socket will connect to the same host as the Angular app or the proxy
    this.socket = io(environment.apiUrl || '', {
      path: '/socket.io',
      autoConnect: true,
      auth: {
        token: localStorage.getItem('traceNodeSession') ? JSON.parse(localStorage.getItem('traceNodeSession')!).access_token : null
      }
    });
  }

  async getTelemetry(deviceId: string) {
    return firstValueFrom(
      this.http.get<any[]>(`/api/telemetry/${deviceId}`)
    );
  }

  subscribeToTelemetry(callback: (payload: any) => void) {
    this.socket.on('new_telemetry', callback);
    return {
      unsubscribe: () => {
        this.socket.off('new_telemetry', callback);
      }
    };
  }
}
