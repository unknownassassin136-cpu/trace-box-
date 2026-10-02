// TraceNode Master Firmware - Integrating ALL Hardware Components
// Libraries needed in Arduino IDE:
// 1. TinyGSM
// 2. PubSubClient
// 3. TinyGPSPlus
// 4. ArduinoJson
// 5. Adafruit MPU6050
// 6. Adafruit Unified Sensor
// 7. DHT sensor library
// 8. Adafruit SSD1306
// 9. Adafruit GFX Library

#define TINY_GSM_MODEM_A7672X // A7672X driver natively supports the A7670/A7672 family

#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <TinyGPSPlus.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <SD.h>
#include <Preferences.h>

// --- VERIFIED HARDWARE PIN MAP ---
// I2C Bus (MPU6050 & OLED)
#define SDA_PIN 21
#define SCL_PIN 22
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// SD Card Module (SPI)
#define SD_CS_PIN 5

// UART2 for Cellular (A7670C)
#define GSM_RX_PIN 17
#define GSM_TX_PIN 16

// UART1 for GPS (NEO-6M)
#define GPS_TX_PIN 32 // GPS TX -> ESP32 32
#define GPS_RX_PIN 33 // GPS RX -> ESP32 33
#define GPS_BAUD 9600

// Digital/Analog Sensors
#define DHTPIN 25
#define DHTTYPE DHT22
#define REED_SWITCH_PIN 27
#define MQ135_PIN 34 // Analog Input

// --- CONFIGURATION ---
const char apn[]      = "bsnlinet"; // BSNL India APN
const char gprsUser[] = "";
const char gprsPass[] = "";

const char* mqtt_server = "broker.hivemq.com";
const int   mqtt_port = 1883;
const char* mqtt_topic = "tracenode/telemetry";
const char* device_id = "NODE-ESP32-01"; // Unique Hardware ID
const char* mqtt_client_id = "TraceNode_ESP32_01_Demo";
const char* secret_code = "839210";      // Registration PIN

// --- OBJECT INITIALIZATION ---
Preferences preferences;
HardwareSerial SerialGSM(2);
HardwareSerial SerialGPS(1);
TinyGsm modem(SerialGSM);
TinyGsmClient gsmClient(modem);
PubSubClient mqtt(gsmClient);
TinyGPSPlus gps;

Adafruit_MPU6050 mpu;
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- TIMING VARIABLES ---
unsigned long lastSensorRead = 0;
const long sensorInterval = 2000; // Read every 2 seconds

unsigned long lastPublish = 0;
const long publishInterval = 10000; // Publish every 10 seconds

unsigned long lastMqttRetry = 0;
const long mqttRetryInterval = 10000; // Reconnect retry every 10s

unsigned long lastOledChange = 0;
const long oledInterval = 3000; // Rotate screen every 3 seconds
int oledPage = 0;

// --- STATE VARIABLES ---
bool isLinked = false;
bool doorWasOpen = false;
int currentDoorState = LOW;
float lastTemp = 0.0;
float lastHum = 0.0;
int airQuality = 0;
sensors_event_t accel, gyro, mpuTemp;
String csq = "N/A";

// --- HELPER: SEND AT COMMAND ---
void sendATCommand(const char* cmd, unsigned long timeoutMs = 2000) {
  Serial.print("Sending: ");
  Serial.println(cmd);
  SerialGSM.println(cmd);
  
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    while (SerialGSM.available()) {
      Serial.write(SerialGSM.read());
    }
  }
  Serial.println();
}

// --- QUEUE MANAGEMENT (SD Card) ---
void saveToQueue(const String& payload) {
  String filename = "/queue/" + String(millis()) + ".json";
  File file = SD.open(filename, FILE_WRITE);
  if (file) {
    file.print(payload);
    file.close();
    Serial.println("OFFLINE SAVED: " + filename);
  } else {
    Serial.println("FAILED to save offline payload to SD.");
  }
}

void processQueue() {
  File root = SD.open("/queue");
  if (!root || !root.isDirectory()) return;

  File file = root.openNextFile();
  while (file && mqtt.connected()) {
    String filename = file.name();
    String fullPath = filename;
    if (!fullPath.startsWith("/")) {
      fullPath = "/queue/" + filename;
    }
    
    String payload = file.readString();
    file.close();

    Serial.print("Publishing queued: ");
    Serial.println(fullPath);

    if (mqtt.publish(mqtt_topic, payload.c_str())) {
      SD.remove(fullPath);
      Serial.println("Queued publish: OK. Deleted file.");
    } else {
      Serial.println("Queued publish: FAILED.");
      break; // Stop trying if we get a failure, maybe connection dropped
    }
    file = root.openNextFile();
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("MQTT Received on ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(message);

  if (String(topic) == String("tracenode/events/") + device_id) {
    if (message.indexOf("\"type\":\"LINKED\"") != -1 || message.indexOf("\"type\": \"LINKED\"") != -1) {
      Serial.println("Device Linked via Backend!");
      isLinked = true;
      preferences.putBool("isLinked", true);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(10);
  
  preferences.begin("tracenode", false);
  isLinked = preferences.getBool("isLinked", false);

  Serial.println("\n================================");
  Serial.println("TRACENODE TRACEBOX");
  Serial.println("================================");

  // Initialize SD Card
  if (!SD.begin(SD_CS_PIN)) {
    Serial.println("SD Card Mount Failed. Please check wiring.");
  } else {
    if (!SD.exists("/queue")) {
      SD.mkdir("/queue");
    }
  }

  // Initialize Pins
  pinMode(REED_SWITCH_PIN, INPUT_PULLUP);
  
  // Setup I2C & OLED
  Wire.begin(SDA_PIN, SCL_PIN);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("OLED allocation failed"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0,0);
    display.println("TraceNode Booting...");
    display.display();
  }

  // Initialize DHT22
  dht.begin();
  
  // Initialize MPU6050
  if (!mpu.begin(0x68, &Wire)) {
    Serial.println("Failed to find MPU6050 chip");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  }

  // Initialize GPS Serial
  SerialGPS.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // A7670C Modem Initialization
  SerialGSM.begin(115200, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);
  Serial.println("MODEM UART: PASS");
  
  display.clearDisplay(); display.setCursor(0,0);
  display.println("Init Modem AT Cmds...");
  display.display();
  
  // Explicit AT Diagnostic Sequence
  sendATCommand("AT", 1000);
  sendATCommand("ATE0", 1000);
  sendATCommand("AT+CPIN?", 1000);
  sendATCommand("AT+CSQ", 1000);
  sendATCommand("AT+CEREG?", 1000);
  
  SerialGSM.print("AT+CGDCONT=1,\"IP\",\"");
  SerialGSM.print(apn);
  SerialGSM.println("\"");
  delay(1000);
  while (SerialGSM.available()) { Serial.write(SerialGSM.read()); }
  Serial.println();

  sendATCommand("AT+CGATT?", 1000);
  sendATCommand("AT+CGACT?", 1000);
  sendATCommand("AT+CGPADDR=1", 1000);

  // Start TinyGSM after raw AT checks
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    Serial.println("Warning: TinyGSM attach failed, but manual AT cmds may have worked.");
  } else {
    Serial.println("TinyGSM attached to GPRS successfully.");
  }

  // Setup MQTT
  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(mqttCallback);
  mqtt.setBufferSize(512);
  
  display.clearDisplay(); display.setCursor(0,0);
  display.println("System Ready!");
  display.display();
}

void reconnectMqtt() {
  if (millis() - lastMqttRetry > mqttRetryInterval) {
    lastMqttRetry = millis();
    Serial.print("Connecting to MQTT... ");
    if (mqtt.connect(mqtt_client_id)) {
      Serial.println("MQTT: CONNECTED");
      String eventTopic = String("tracenode/events/") + device_id;
      mqtt.subscribe(eventTopic.c_str());
      processQueue(); // Push offline data on reconnect
    } else {
      Serial.print("FAILED, rc=");
      Serial.println(mqtt.state());
    }
  }
}

// Generate UNIX Timestamp from GPS
unsigned long getGpsTimestamp() {
  if (gps.date.isValid() && gps.time.isValid()) {
    // Basic approximation (TinyGPS doesn't output unix epoch natively)
    // Note: To avoid heavy TimeLib dependencies for now, we structure standard Unix conversion or just 0 if not needed.
    // As requested: "generate a Unix UTC timestamp from the NEO-6M GPS date/time. If GPS time is not yet valid, use: timestamp = 0"
    
    int yr = gps.date.year();
    int mo = gps.date.month();
    int dy = gps.date.day();
    int hr = gps.time.hour();
    int mn = gps.time.minute();
    int sc = gps.time.second();

    // Days to beginning of months for non-leap years
    static const int days_before_month[] = {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
    int days = dy - 1 + days_before_month[mo - 1];
    
    // Leap year handling
    if (mo > 2 && ((yr % 4 == 0 && yr % 100 != 0) || yr % 400 == 0)) {
        days++;
    }
    
    // Days from 1970 to beginning of the year
    yr -= 1970;
    days += yr * 365 + (yr + 1) / 4 - (yr + 69) / 100 + (yr + 369) / 400;
    
    unsigned long epoch = ((days * 24UL + hr) * 60 + mn) * 60 + sc;
    return epoch;
  }
  return 0;
}

void displayOLED() {
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextColor(SSD1306_WHITE);

  if (!isLinked) {
    display.setTextSize(2);
    display.println("PAIRING");
    display.setTextSize(1);
    display.println();
    display.print("Code: ");
    display.setTextSize(2);
    display.println(secret_code);
    display.setTextSize(1);
    display.println();
    display.println("Waiting for Backend...");
    display.display();
    return;
  }

  switch(oledPage) {
    case 0:
      display.println("== SYSTEM ==");
      display.print("ID: "); display.println(device_id);
      display.println("Status: ACTIVE");
      break;
    case 1:
      display.println("== TEMP/HUM ==");
      display.print("Temp: "); display.print(lastTemp); display.println(" C");
      display.print("Hum:  "); display.print(lastHum); display.println(" %");
      break;
    case 2:
      display.println("== MOTION ==");
      display.print("Door: "); display.println(currentDoorState == HIGH ? "OPEN!" : "Closed");
      display.print("Accel Z: "); display.println(accel.acceleration.z);
      break;
    case 3:
      display.println("== AIR QUALITY ==");
      display.print("Raw ADC: "); display.println(airQuality);
      break;
    case 4:
      display.println("== GPS ==");
      if(gps.location.isValid()) {
        display.print("Lat: "); display.println(gps.location.lat(), 4);
        display.print("Lng: "); display.println(gps.location.lng(), 4);
      } else {
        display.println("Searching...");
      }
      break;
    case 5:
      display.println("== CELLULAR ==");
      display.print("Modem: "); display.println(modem.isGprsConnected() ? "READY" : "ERROR");
      display.print("CSQ: "); display.println(modem.getSignalQuality());
      break;
    case 6:
      display.println("== MQTT ==");
      display.print("Status: "); display.println(mqtt.connected() ? "ONLINE" : "OFFLINE");
      display.print("Q Size: "); 
      
      int count = 0;
      File root = SD.open("/queue");
      if(root) {
        File file = root.openNextFile();
        while(file) { count++; file = root.openNextFile(); }
      }
      display.println(count);
      break;
  }
  
  display.display();
}

void loop() {
  // Feed GPS Data
  while (SerialGPS.available() > 0) {
    gps.encode(SerialGPS.read());
  }

  // Non-blocking MQTT reconnect
  if (!mqtt.connected()) {
    reconnectMqtt();
  } else {
    mqtt.loop();
  }

  // Read Sensors periodically (2s)
  if (millis() - lastSensorRead > sensorInterval) {
    lastSensorRead = millis();
    
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) lastTemp = t; else Serial.println("DHT read failed, keeping last Temp.");
    if (!isnan(h)) lastHum = h; else Serial.println("DHT read failed, keeping last Hum.");
    
    airQuality = analogRead(MQ135_PIN);
    currentDoorState = digitalRead(REED_SWITCH_PIN);
    
    mpu.getEvent(&accel, &gyro, &mpuTemp);
  }

  // Rotate OLED screen
  if (millis() - lastOledChange > oledInterval) {
    lastOledChange = millis();
    oledPage = (oledPage + 1) % 7;
    displayOLED();
  }

  // Publish telemetry (10s)
  if (millis() - lastPublish > publishInterval) {
    lastPublish = millis();
    
    if (!isLinked) {
      Serial.println("Skipping telemetry publish (Not Linked).");
      return;
    }

    StaticJsonDocument<512> doc;
    doc["deviceId"] = device_id;
    doc["timestamp"] = getGpsTimestamp();
    
    if (gps.location.isValid()) {
      doc["lat"] = gps.location.lat();
      doc["lng"] = gps.location.lng();
      doc["speed"] = gps.speed.kmph();
    } else {
      doc["lat"] = 0;
      doc["lng"] = 0;
      doc["speed"] = 0;
    }
    
    doc["temperature"] = lastTemp;
    doc["humidity"] = lastHum;
    doc["airQuality"] = airQuality;
    
    doc["doorOpen"] = (currentDoorState == HIGH);
    doc["accelX"] = accel.acceleration.x;
    doc["accelY"] = accel.acceleration.y;
    doc["accelZ"] = accel.acceleration.z;

    char payload[512];
    serializeJson(doc, payload);
    
    Serial.println("\n========== TELEMETRY ==========");
    Serial.println(payload);
    Serial.println("================================");
    
    if (mqtt.connected()) {
      if (mqtt.publish(mqtt_topic, payload)) {
        Serial.println("MQTT PUBLISH: OK");
      } else {
        Serial.println("MQTT PUBLISH: FAIL");
        saveToQueue(payload);
      }
    } else {
      Serial.println("MQTT: OFFLINE");
      saveToQueue(payload);
    }
  }
}
