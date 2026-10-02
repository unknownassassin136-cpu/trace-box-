import { app, httpServer } from './app';
import { mqttService } from './mqtt/mqtt.service';

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`TraceNode Backend running on port ${PORT}`);
  // Initialize MQTT subscriber
  mqttService.connect();
});
