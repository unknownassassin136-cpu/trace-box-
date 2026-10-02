import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'TraceNode Backend' });
});

import authRoutes from './modules/auth/auth.routes';
import deviceRoutes from './modules/devices/device.routes';
import telemetryRoutes from './modules/telemetry/telemetry.routes';
import { authMiddleware } from './middleware/auth.middleware';

// Setup API routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Setup Socket.io and Supabase Realtime Broadcasting
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://takqjthgdwuqavnvyoxb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRha3FqdGhnZHd1cWF2bnZ5b3hiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM4NDU0OCwiZXhwIjoyMTA1OTYwNTQ4fQ.6cGWT1N58sgPiCcwMxGSPDemyXTSgp5Z3LKroFtdrpk'
);

io.on('connection', (socket) => {
  console.log('Client connected to websocket:', socket.id);
  // Ideally, verify JWT auth.token here for strict security on websockets
});

// Listen to Supabase Database changes securely on the server
supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'telemetry' },
    (payload) => {
      // Format payload to match frontend expectations
      const formatted = {
        ...payload.new,
        device_id: payload.new.device_id,
      };
      // Broadcast to all connected authenticated clients
      io.emit('new_telemetry', formatted);
    }
  )
  .subscribe();

// We export both app and httpServer now
export { app, httpServer };
