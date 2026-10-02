import { db } from '../../db';
import { deviceConfig, devices } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class DeviceService {
  async registerDevice(userId: string, registrationCode: string) {
    // Find device by registration code
    const device = await db.query.devices.findFirst({
      where: eq(devices.registrationCode, registrationCode)
    });

    if (!device) {
      throw new Error('Invalid registration code');
    }

    if (device.isLinked) {
      throw new Error('Device is already registered');
    }

    // Link device to user
    const updated = await db.update(devices)
      .set({ isLinked: true, userId: userId, updatedAt: new Date() })
      .where(eq(devices.deviceId, device.deviceId))
      .returning();

    return updated[0];
  }
  async getConfig(deviceId: string) {
    const config = await db.query.deviceConfig.findFirst({
      where: eq(deviceConfig.deviceId, deviceId)
    });
    
    if (!config) {
      // Return defaults if none exists
      return {
        deviceId,
        minTemp: 2.0,
        maxTemp: 8.0,
        minHumidity: 30.0,
        maxHumidity: 65.0,
        minEthylene: 0.0,
        maxEthylene: 150.0,
        minShock: 0.0,
        maxShock: 1.5
      };
    }
    return config;
  }

  async updateConfig(deviceId: string, payload: { 
    minTemp: number, maxTemp: number, 
    minHumidity: number, maxHumidity: number, 
    minEthylene: number, maxEthylene: number, 
    minShock: number, maxShock: number 
  }) {
    const existing = await db.query.deviceConfig.findFirst({
      where: eq(deviceConfig.deviceId, deviceId)
    });

    if (existing) {
      const updated = await db.update(deviceConfig)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(deviceConfig.deviceId, deviceId))
        .returning();
      return updated[0];
    } else {
      const inserted = await db.insert(deviceConfig)
        .values({
          deviceId,
          ...payload
        })
        .returning();
      return inserted[0];
    }
  }

  async deleteDevice(deviceId: string) {
    // Delete config first (manual cascade)
    await db.delete(deviceConfig).where(eq(deviceConfig.deviceId, deviceId));
    
    // Unlink device (rather than deleting the telemetry/events, we can just unlink it or hard delete it)
    // If the user wants to truly delete, we can delete the device record. Note: this might fail if there are telemetry rows.
    // For now, let's just mark it as unlinked and unowned.
    const updated = await db.update(devices)
      .set({ isLinked: false, userId: null })
      .where(eq(devices.deviceId, deviceId))
      .returning();
      
    return updated[0];
  }
}
