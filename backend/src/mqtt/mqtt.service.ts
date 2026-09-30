import mqtt, { MqttClient } from 'mqtt';
import { EventService } from '../modules/events/event.service';

export class MqttService {
  private client: MqttClient | null = null;
  private eventService = new EventService();

  constructor() {
    // connect is called explicitly in server.ts
  }

  public connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
    
    console.log(`[MQTT] Attempting to connect to broker at ${brokerUrl}...`);
    
    this.client = mqtt.connect(brokerUrl, {
      clientId: process.env.MQTT_CLIENT_ID || 'tracenode_backend_001_' + Math.random().toString(16).substr(2, 8),
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      rejectUnauthorized: process.env.MQTT_TLS_ENABLED === 'true',
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      console.log('[MQTT] Successfully connected to broker.');
      this.subscribeToTopics();
    });

    this.client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err);
    });

    this.client.on('offline', () => {
      console.warn('[MQTT] Client went offline. Reconnecting...');
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  private subscribeToTopics() {
    if (!this.client) return;

    const topics = [
      'tracenode/telemetry',
      'tracenode/events'
    ];

    this.client.subscribe(topics, (err, granted) => {
      if (err) {
        console.error('[MQTT] Subscription error:', err);
      } else {
        console.log(`[MQTT] Subscribed to topics:`, granted.map(g => g.topic));
      }
    });
  }

  /**
   * Handles incoming messages from the ESP32 / A7670C hardware
   */
  private async handleMessage(topic: string, payload: Buffer) {
    try {
      const messageStr = payload.toString();
      const data = JSON.parse(messageStr);
      
      console.log(`[MQTT] Received message on topic ${topic}`, data);

      const deviceId = data.deviceId;

      if (!deviceId) {
        throw new Error('Payload missing deviceId');
      }

      // Route message based on type
      if (topic === 'tracenode/telemetry') {
        await this.eventService.processTelemetry(deviceId, data);
      } else if (topic === 'tracenode/events') {
        await this.eventService.processEvent(deviceId, data);
      }



    } catch (error) {
      console.error(`[MQTT] Error processing message on topic ${topic}:`, error);
    }
  }

  /**
   * Publishes an acknowledgment back to the device
   */
  public publishAck(deviceId: string, payload: any) {
    if (!this.client || !this.client.connected) {
      console.warn('[MQTT] Cannot publish ACK, client not connected.');
      return;
    }

    const topic = `tracenode/v1/device/${deviceId}/ack`;
    this.client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Failed to publish ACK to ${deviceId}:`, err);
      } else {
        console.log(`[MQTT] Published ACK to ${topic}`);
      }
    });
  }
}

// Export singleton instance
export const mqttService = new MqttService();
