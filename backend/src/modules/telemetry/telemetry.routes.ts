import { Router, Request, Response } from 'express';
import { TelemetryService } from './telemetry.service';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const telemetryService = new TelemetryService();

// Apply auth middleware to all telemetry routes
router.use(authMiddleware);

router.get('/:deviceId', async (req: Request, res: Response) => {
  try {
    const data = await telemetryService.getTelemetry(req.params.deviceId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

export default router;
