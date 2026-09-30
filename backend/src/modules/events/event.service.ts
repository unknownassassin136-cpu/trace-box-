import { db } from '../../db';
import { telemetry, events, devices } from '../../db/schema';
import { LedgerService } from '../ledger/ledger.service';
import { eq } from 'drizzle-orm';

export class EventService {
  /**
   * Processes raw telemetry (temperature, humidity, etc.) and saves it.
   */
  public async processTelemetry(deviceId: string, data: any) {
    try {
      // Upsert device to ensure it exists
      await db.insert(devices).values({
        deviceId: deviceId,
        status: 'ONLINE',
        lastSeen: new Date()
      }).onConflictDoUpdate({
        target: devices.deviceId,
        set: { lastSeen: new Date(), status: 'ONLINE' }
      });

      // Insert telemetry record
      await db.insert(telemetry).values({
        deviceId: deviceId,
        sequence: data.sequence || Math.floor(Date.now() / 1000), // Fallback if no seq
        timestamp: data.timestamp ? new Date(data.timestamp * 1000) : new Date(),
        temperature: data.temperature !== undefined ? data.temperature : null,
        humidity: data.humidity !== undefined ? data.humidity : null,
        ethylene: data.airQuality !== undefined ? data.airQuality : null,
        lat: data.lat !== undefined ? data.lat : null,
        lng: data.lng !== undefined ? data.lng : null,
        battery: data.battery !== undefined ? data.battery : 100
      });

      console.log(`[EventService] Telemetry saved for ${deviceId}`);
    } catch (err) {
      console.error('[EventService] Failed to process telemetry:', err);
    }
  }

  /**
   * Processes critical events (tamper, impact) and appends to the Cryptographic Ledger.
   */
  public async processEvent(deviceId: string, data: any) {
    try {
      const eventId = `EVT-${deviceId}-${data.seq || Date.now()}`;
      
      // 1. Insert the raw event (without hashes initially)
      await db.insert(events).values({
        eventId: eventId,
        deviceId: deviceId,
        sequence: data.seq || Math.floor(Date.now() / 1000),
        eventType: data.type || 'UNKNOWN',
        timestamp: data.ts ? new Date(data.ts * 1000) : new Date(),
        payload: data,
        eventHash: 'PENDING'
      });

      // 2. Append to the cryptographic ledger (this computes hashes and links it)
      const finalHash = await LedgerService.appendToLedger(eventId, data);
      
      console.log(`[EventService] Event secured for ${deviceId} with Hash: ${finalHash}`);
    } catch (err) {
      console.error('[EventService] Failed to process event:', err);
    }
  }

  public async updateDeviceStatus(deviceId: string, data: any) {
    try {
      await db.update(devices)
        .set({ status: data.status, lastSeen: new Date() })
        .where(eq(devices.deviceId, deviceId));
    } catch (err) {
      console.error('[EventService] Failed to update status:', err);
    }
  }
}
