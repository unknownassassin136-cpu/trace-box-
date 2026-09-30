const mqtt = require('mqtt');

const brokerUrl = 'mqtt://broker.hivemq.com:1883';
const topic = 'tracenode/telemetry';

console.log(`Testing TCP reachability and MQTT connection to ${brokerUrl}...`);

const clientId = 'Test_Backend_CLI_' + Math.random().toString(16).substr(2, 8);

const client = mqtt.connect(brokerUrl, {
  clientId: clientId,
  connectTimeout: 10000,
  keepalive: 60
});

client.on('connect', () => {
  console.log('TCP 1883 reachable: PASS');
  console.log('MQTT connection: PASS');
  
  const payload = {
    "deviceId": "NODE-DEMO-01",
    "timestamp": 1760000000,
    "lat": 16.5061,
    "lng": 80.6480,
    "speed": 10,
    "temperature": 24.5,
    "humidity": 60.2,
    "airQuality": 900,
    "doorOpen": false,
    "accelX": 0.05,
    "accelY": -0.12,
    "accelZ": 9.81
  };
  
  client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
    if (err) {
      console.log('MQTT publish: FAIL (' + err.message + ')');
    } else {
      console.log('MQTT publish: PASS');
    }
    setTimeout(() => client.end(), 1000);
  });
});

client.on('error', (err) => {
  console.log('MQTT connection: FAIL (' + err.message + ')');
  client.end();
});
