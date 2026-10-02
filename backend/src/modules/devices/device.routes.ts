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

export default router;
