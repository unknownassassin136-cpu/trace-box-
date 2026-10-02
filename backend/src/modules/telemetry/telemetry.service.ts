import { db } from '../../db';
import { telemetry } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export class TelemetryService {
  async getTelemetry(deviceId: string) {
    const data = await db.query.telemetry.findMany({
      where: eq(telemetry.deviceId, deviceId),
      orderBy: [desc(telemetry.timestamp)],
      limit: 20
    });
    
    // Format keys to match frontend expectations (which historically matched Supabase JSON output)
    return data.map(item => ({
      ...item,
      device_id: item.deviceId,
      shipment_id: item.shipmentId,
    }));
  }
}
