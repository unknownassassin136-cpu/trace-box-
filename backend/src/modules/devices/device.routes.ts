import { Router, Request, Response } from 'express';
import { DeviceService } from './device.service';

const router = Router();
const deviceService = new DeviceService();

router.get('/:deviceId/config', async (req: Request, res: Response) => {
  try {
    const config = await deviceService.getConfig(req.params.deviceId);
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

router.post('/:deviceId/config', async (req: Request, res: Response) => {
  try {
    const config = await deviceService.updateConfig(req.params.deviceId, req.body);
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    // For now we assume we just fetch from DB or a service method
    // I will use direct DB query here for simplicity since it's just a GET
    const userDevices = await require('../../db').db.query.devices.findMany({
      where: require('drizzle-orm').eq(require('../../db/schema').devices.userId, userId)
    });
    res.json(userDevices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { registrationCode } = req.body;
    const userId = (req as any).user.id; // From authMiddleware

    if (!registrationCode) {
      return res.status(400).json({ error: 'Registration code is required' });
    }

    const device = await deviceService.registerDevice(userId, registrationCode);
    
    // Publish MQTT message to notify the ESP32 that it's linked
    const mqttService = require('../../mqtt/mqtt.service').mqttService;
    mqttService.publish(`tracenode/events/${device.deviceId}`, JSON.stringify({
      type: 'LINKED',
      userId: userId,
      timestamp: Date.now()
    }));

    res.json(device);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:deviceId', async (req: Request, res: Response) => {
  try {
    await deviceService.deleteDevice(req.params.deviceId);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router;
