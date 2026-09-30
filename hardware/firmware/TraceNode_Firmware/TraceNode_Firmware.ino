// TraceNode Firmware - ESP32 Core Connectivity (WiFi Mode for Testing)
// Install these libraries in Arduino IDE: TinyGPSPlus, PubSubClient, ArduinoJson

#include <WiFi.h>
#include <PubSubClient.h>
#include <TinyGPSPlus.h>
#include <ArduinoJson.h>

// --- HARDWARE WIRING ---
// GPS Module connected to Hardware Serial 1
#define GPS_RX_PIN 18
#define GPS_TX_PIN 19
#define GPS_BAUD 9600

// --- WIFI CONFIGURATION ---
const char* ssid = "YOUR_WIFI_SSID";         // Replace with your WiFi Name
const char* password = "YOUR_WIFI_PASSWORD"; // Replace with your WiFi Password

// --- MQTT CONFIGURATION ---
const char* mqtt_server = "YOUR_PC_IP_ADDRESS"; // E.g., "192.168.1.5" - Find this by typing 'ipconfig' in your PC terminal
const int   mqtt_port = 1883;
const char* mqtt_topic = "tracenode/telemetry";
const char* device_id = "NODE-DEMO-01";

// --- OBJECT INITIALIZATION ---
TinyGPSPlus gps;
HardwareSerial SerialGPS(1);

WiFiClient espClient;
PubSubClient mqtt(espClient);

unsigned long lastPublish = 0;
const long publishInterval = 5000; // Publish every 5 seconds

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  // Debug console
  Serial.begin(115200);
  delay(10);
  Serial.println("\n--- TraceNode ESP32 Booting (WiFi Mode) ---");

  // Initialize GPS Serial
  SerialGPS.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  
  // Connect to WiFi instead of Cellular
  setup_wifi();

  // Setup MQTT
  mqtt.setServer(mqtt_server, mqtt_port);
}

void reconnectMqtt() {
  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqtt.connect(device_id)) {
      Serial.println(" connected");
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void loop() {
  // Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost, reconnecting...");
    setup_wifi();
  }

  // Ensure MQTT connection
  if (!mqtt.connected()) {
    reconnectMqtt();
  }
  mqtt.loop();

  // Feed the GPS parser
  while (SerialGPS.available() > 0) {
    gps.encode(SerialGPS.read());
  }

  // Publish data periodically
  if (millis() - lastPublish > publishInterval) {
    lastPublish = millis();

    // Check if we have a valid GPS lock
    if (gps.location.isValid()) {
      StaticJsonDocument<256> doc;
      doc["deviceId"] = device_id;
      doc["lat"] = gps.location.lat();
      doc["lng"] = gps.location.lng();
      doc["speed"] = gps.speed.kmph();
      doc["timestamp"] = millis(); // Later we can use real Epoch time from network

      char payload[256];
      serializeJson(doc, payload);

      Serial.print("Publishing: ");
      Serial.println(payload);
      
      mqtt.publish(mqtt_topic, payload);
    } else {
      Serial.println("Waiting for valid GPS signal... (Make sure GPS is near a window/outside)");
    }
  }
}
