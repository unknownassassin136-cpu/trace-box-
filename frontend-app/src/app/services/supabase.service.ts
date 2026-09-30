import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getDevices() {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*');
    if (error) throw error;
    return data;
  }

  async getTelemetry(deviceId: string) {
    const { data, error } = await this.supabase
      .from('telemetry')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  }

  subscribeToTelemetry(callback: (payload: any) => void) {
    return this.supabase
      .channel('public:telemetry')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemetry' }, callback)
      .subscribe();
  }
}
