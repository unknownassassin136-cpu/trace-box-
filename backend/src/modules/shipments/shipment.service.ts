import { db } from '../../db';
import { shipments } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import axios from 'axios';

export class ShipmentService {
  async getShipments() {
    return await db.query.shipments.findMany({
      orderBy: [desc(shipments.createdAt)]
    });
  }

  async getShipmentByDevice(deviceId: string) {
    return await db.query.shipments.findFirst({
      where: eq(shipments.deviceId, deviceId),
      orderBy: [desc(shipments.createdAt)]
    });
  }

  async createShipment(shipmentId: string, deviceId: string, origin: string, destination: string) {
    try {
      let routePolyline = null;
      let finalOrigin = origin;
      let initialStatus = 'IN_TRANSIT';
      
      // If no origin provided, it's a PENDING shipment awaiting live GPS
      if (!origin || origin.trim() === '') {
        finalOrigin = 'PENDING GPS';
        initialStatus = 'PENDING';
      } else {
        // 1. Geocode origin
        const originRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'TraceNodeApp' }
        });
        
        // 2. Geocode destination
        const destRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'TraceNodeApp' }
        });

        if (originRes.data.length > 0 && destRes.data.length > 0) {
          const oLat = originRes.data[0].lat;
          const oLon = originRes.data[0].lon;
          const dLat = destRes.data[0].lat;
          const dLon = destRes.data[0].lon;

          // 3. Get route from OSRM
          const osrmRes = await axios.get(`http://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?geometries=geojson&overview=full`);
          if (osrmRes.data.routes && osrmRes.data.routes.length > 0) {
            routePolyline = JSON.stringify(osrmRes.data.routes[0].geometry);
          }
        }
      }

      // 4. Save to DB
      const inserted = await db.insert(shipments)
        .values({
          shipmentId,
          deviceId,
          origin: finalOrigin,
          destination,
          routePolyline,
          status: initialStatus,
          startedAt: new Date()
        })
        .returning();

      return inserted[0];
    } catch (err: any) {
      console.error('Shipment creation error:', err.message);
      throw new Error('Failed to create shipment and calculate route');
    }
  }
}
