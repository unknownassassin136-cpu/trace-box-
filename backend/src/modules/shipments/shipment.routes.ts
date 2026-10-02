import { Router, Request, Response } from 'express';
import { ShipmentService } from './shipment.service';

const router = Router();
const shipmentService = new ShipmentService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const shipments = await shipmentService.getShipments();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

router.get('/device/:deviceId', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentService.getShipmentByDevice(req.params.deviceId);
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { shipmentId, deviceId, origin, destination } = req.body;
    if (!shipmentId || !deviceId || !origin || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const shipment = await shipmentService.createShipment(shipmentId, deviceId, origin, destination);
    res.json(shipment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
