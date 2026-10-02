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
      
      // Check for PENDING dynamic shipments
      if (data.lat !== undefined && data.lat !== 0 && data.lng !== undefined && data.lng !== 0) {
        const { shipments } = await import('../../db/schema');
        const pendingShipment = await db.query.shipments.findFirst({
          where: (s, { eq, and }) => and(eq(s.deviceId, deviceId), eq(s.status, 'PENDING'))
        });

        if (pendingShipment) {
          console.log(`[EventService] Found PENDING shipment ${pendingShipment.shipmentId}. Activating route...`);
          try {
            const axios = (await import('axios')).default;
            const destRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pendingShipment.destination)}&format=json&limit=1`, {
              headers: { 'User-Agent': 'TraceNodeApp' }
            });
            
            if (destRes.data.length > 0) {
              const dLat = destRes.data[0].lat;
              const dLon = destRes.data[0].lon;
              const oLat = data.lat;
              const oLon = data.lng;

              const osrmRes = await axios.get(`http://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?geometries=geojson&overview=full`);
              let routePolyline = null;
              if (osrmRes.data.routes && osrmRes.data.routes.length > 0) {
                routePolyline = JSON.stringify(osrmRes.data.routes[0].geometry);
              }

              await db.update(shipments)
                .set({
                  origin: `${oLat.toFixed(5)}, ${oLon.toFixed(5)}`,
                  routePolyline,
                  status: 'IN_TRANSIT'
                })
                .where(eq(shipments.shipmentId, pendingShipment.shipmentId));
              console.log(`[EventService] Activated shipment ${pendingShipment.shipmentId} with live GPS`);
            }
          } catch (e: any) {
            console.error('[EventService] Failed to activate dynamic shipment:', e.message);
          }
        }
      }

      // Evaluate Thresholds
      await this.evaluateThresholds(deviceId, data);

    } catch (err) {
      console.error('[EventService] Failed to process telemetry:', err);
    }
  }

  private async evaluateThresholds(deviceId: string, data: any) {
    try {
      const { deviceConfig } = await import('../../db/schema');
      const configs = await db.select().from(deviceConfig).where(eq(deviceConfig.deviceId, deviceId));
      
      // Default thresholds if not configured
      const config = configs.length > 0 ? configs[0] : {
        maxTemp: 8.0, minTemp: 2.0, maxHumidity: 65.0, minHumidity: 30.0
      };

      const now = Math.floor(Date.now() / 1000);

      // Temperature Breach
      if (data.temperature !== undefined && (data.temperature > config.maxTemp || data.temperature < config.minTemp)) {
        await this.processEvent(deviceId, {
          seq: now, type: 'TEMP_BREACH', ts: now, 
          value: data.temperature, limit: data.temperature > config.maxTemp ? config.maxTemp : config.minTemp
        });
      }

      // Humidity Breach
      if (data.humidity !== undefined && (data.humidity > config.maxHumidity || data.humidity < config.minHumidity)) {
        await this.processEvent(deviceId, {
          seq: now + 1, type: 'HUMIDITY_BREACH', ts: now, 
          value: data.humidity, limit: data.humidity > config.maxHumidity ? config.maxHumidity : config.minHumidity
        });
      }
    } catch (err) {
      console.error('[EventService] Failed to evaluate thresholds:', err);
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
