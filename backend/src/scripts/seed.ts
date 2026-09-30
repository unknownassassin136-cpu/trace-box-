import { db } from '../db';
import { devices, telemetry, shipments } from '../db/schema';

async function seed() {
  console.log('Seeding mock data for Dashboard...');

  try {
    // 1. Create a Device
    await db.insert(devices).values({
      deviceId: 'NODE-DEMO-01',
      status: 'ONLINE',
      battery: 89.5,
      lastSeen: new Date(),
    }).onConflictDoNothing();

    // 2. Create a Shipment
    await db.insert(shipments).values({
      shipmentId: 'SHIP-100234',
      origin: 'Mumbai Port',
      destination: 'Delhi Hub',
      deviceId: 'NODE-DEMO-01',
      status: 'IN_TRANSIT',
      startedAt: new Date()
    }).onConflictDoNothing();

    // 3. Generate Mock Telemetry data (last 7 hours)
    for (let i = 0; i < 7; i++) {
      const ts = new Date();
      ts.setHours(ts.getHours() - (6 - i));
      
      await db.insert(telemetry).values({
        deviceId: 'NODE-DEMO-01',
        shipmentId: 'SHIP-100234',
        sequence: 1000 + i,
        timestamp: ts,
        temperature: 8.0 + (Math.random() * 0.5), // around 8.0-8.5
        humidity: 70 + (Math.random() * 5),
        ethylene: 0.2 + (Math.random() * 0.1),
        battery: 90 - i
      }).onConflictDoNothing();
    }

    console.log('Successfully seeded database!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
