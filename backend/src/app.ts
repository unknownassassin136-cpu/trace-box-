import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'TraceNode Backend' });
});

import deviceRoutes from './modules/devices/device.routes';

// Setup API routes (Placeholders for now)
// app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
// app.use('/api/shipments', shipmentRoutes);
// app.use('/api/telemetry', telemetryRoutes);
// app.use('/api/events', eventRoutes);
// app.use('/api/ledger', ledgerRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
