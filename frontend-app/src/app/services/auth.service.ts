import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private sessionSubject = new BehaviorSubject<any>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check local storage for existing session
    const stored = localStorage.getItem('traceNodeSession');
    if (stored) {
      this.sessionSubject.next(JSON.parse(stored));
    }
  }

  async signIn(email: string, password: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      );
      
      if (response && response.session) {
        this.sessionSubject.next(response.session);
        localStorage.setItem('traceNodeSession', JSON.stringify(response.session));
      }
      return response;
    } catch (error: any) {
      return { error: { message: error.error?.error || 'Login failed' } };
    }
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/logout`, {}));
    } catch (e) {
      // Ignore errors on logout
    } finally {
      this.sessionSubject.next(null);
      localStorage.removeItem('traceNodeSession');
    }
  }

  getSession() {
    return this.sessionSubject.value;
  }
}
