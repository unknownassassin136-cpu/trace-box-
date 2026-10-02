import 'dotenv/config';
import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;
