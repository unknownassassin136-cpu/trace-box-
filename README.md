# TraceNode: Advanced Supply Chain Telemetry & Event Logging System

## 1. Project Overview
**TraceNode** is an end-to-end, real-time tracking, telemetry, and supply chain security system. Designed for high-value and highly sensitive shipments (such as pharmaceuticals, perishables, and critical components), it combines customized IoT hardware with a modern cloud-native stack to provide continuous visibility into the condition and location of goods in transit. 

---

## 2. Hardware Architecture & Specifications

### 2.1 Core Components
*   **Microcontroller:** ESP32 DevKit V1 (Dual-core, Wi-Fi/Bluetooth, robust processing)
*   **Cellular Connectivity:** KTRON KSTM1009 SIM A7670C 4G LTE Modem (Provides continuous MQTT connectivity even in rural networks)
*   **Location Tracking:** NEO-6M GPS Module
*   **Sensors:**
    *   **DHT22:** Precision Temperature & Humidity monitoring (vital for cold-chain)
    *   **MQ-135:** Analog Air Quality/Ethylene gas detection (proxy for food ripening/spoilage)
    *   **MPU6050:** 6-axis Accelerometer & Gyroscope (detects harsh impacts and drops)
    *   **Magnetic Reed Switch:** Door open/tamper detection
*   **User Interface (On-Device):** SSD1306 0.96" OLED Display (Provides local real-time telemetry readout for on-site personnel)
*   **Offline Redundancy:** LittleFS (Internal Flash) - Caches telemetry locally if the cellular connection drops, synchronizing automatically upon reconnection.

### 2.2 Physical Wiring & Connections Map
*Ensure absolute precision in wiring, particularly cross-connecting RX/TX lines.*

| Component | ESP32 Pin | Component Pin | Protocol/Type |
| :--- | :--- | :--- | :--- |
| **A7670C 4G Modem** | GPIO 17 | RX | UART2 |
| | GPIO 16 | TX | UART2 |
| | GND | GND | Power |
| **NEO-6M GPS** | GPIO 32 | TX | UART1 (9600 Baud) |
| | GPIO 33 | RX | UART1 (9600 Baud) |
| **DHT22** | GPIO 25 | DATA | Digital (1-Wire) |
| **MQ-135** | GPIO 34 | A0 | Analog Input |
| **Reed Switch** | GPIO 27 | PIN 1 (Pin 2 to GND) | Digital Input (PULLUP) |
| **MPU6050 + OLED** | GPIO 21 | SDA | I2C |
| | GPIO 22 | SCL | I2C |

---

## 3. Firmware (ESP32 C++ Code Structure)

The firmware is written using the Arduino framework for ESP32. It uses the `TinyGSM` library with the `TINY_GSM_MODEM_A7672X` driver (natively compatible with the A7670C) to establish an LTE GPRS connection.

**Key Libraries Used:**
`TinyGsmClient.h`, `PubSubClient.h`, `TinyGPSPlus.h`, `ArduinoJson.h`, `Wire.h`, `LittleFS.h`.

**Core Execution Loop Summary:**
1.  **Initialize Hardware:** Boot I2C sensors, analog pins, LittleFS, and the OLED.
2.  **Cellular Handshake:** Connect to the BSNL APN (`bsnlinet`) and wait for the GPRS IP allocation.
3.  **Sensor Read & Aggregation:** Poll GPS, DHT22, MQ-135, MPU6050, and Reed Switch every 2 seconds.
4.  **JSON Serialization:** Pack the data into a strict JSON payload.
5.  **MQTT Publish:** Publish the payload to `tracenode/telemetry`. If the network fails, append the JSON string to a text file in `LittleFS` for a deferred upload queue.

```cpp
// Example Snippet: Payload Construction
StaticJsonDocument<512> doc;
doc["deviceId"] = "NODE-DEMO-01";
doc["timestamp"] = getGpsTimestamp();

if (gps.location.isValid()) {
  doc["lat"] = gps.location.lat();
  doc["lng"] = gps.location.lng();
}

doc["temperature"] = lastTemp;
doc["humidity"] = lastHum;
doc["airQuality"] = airQuality;
doc["doorOpen"] = (currentDoorState == HIGH);
doc["accelX"] = accel.acceleration.x;

String payload;
serializeJson(doc, payload);

if (mqtt.connected()) {
  mqtt.publish("tracenode/telemetry", payload.c_str());
} else {
  // Store offline
  saveToQueue(payload); 
}
```

---

## 4. Backend Architecture

The backend operates as the central nervous system bridging the hardware layer and the end-users.

*   **Runtime:** Node.js with Express.
*   **MQTT Ingestion:** Integrates the `mqtt` library to act as an always-on subscriber. Every time the ESP32 posts to the broker, the backend Node.js listener fires an event.
*   **Database & ORM:** `Drizzle ORM` mapped to a highly scalable **PostgreSQL** database (currently leveraging Supabase).
*   **Schema Logic:** The backend maps the raw incoming hardware payload into highly structured tables (`devices`, `telemetry`, `events`).
*   **Security & Integrity:** Implements cryptographic hashing for critical events (tampering, major impacts) to a cryptographic ledger table, ensuring supply chain auditability and data immutability.

---

## 5. Frontend Architecture

The frontend provides logistics managers and operators with an instant, real-time view of all active shipments.

*   **Framework:** Angular 18 Single Page Application (SPA).
*   **Styling:** Tailwind CSS for a modern, highly responsive design.
*   **Live WebSockets (Supabase Realtime):** The dashboard bypasses standard HTTP polling. By subscribing to the PostgreSQL `telemetry` table using Supabase Realtime, the UI receives pushed updates instantly the moment the backend commits a new row.
*   **Mapping:** `Leaflet.js` integrated with OpenStreetMap tiles. A live vehicle marker updates and centers automatically as GPS coordinates stream in.
*   **Data Visualization:** `Chart.js` is used to plot historical temperature, humidity, and ethylene metrics.

---

## 6. Hosting & Deployment Approach (VPS / Shared Host)

For a production environment or SIH demonstration, hosting the entire stack on a Virtual Private Server (VPS) like AWS EC2, DigitalOcean Droplet, or Hostinger VPS (Ubuntu 22.04) provides maximum control.

### Step-by-Step Deployment Strategy:

1.  **Server Provisioning & Security:**
    *   Deploy an Ubuntu 22.04 LTS instance.
    *   Configure UFW (Uncomplicated Firewall) to allow ports `80` (HTTP), `443` (HTTPS), `1883/8883` (MQTT).
2.  **Self-Hosted MQTT Broker (Mosquitto):**
    *   Install Eclipse Mosquitto: `sudo apt install mosquitto mosquitto-clients`
    *   Edit `/etc/mosquitto/mosquitto.conf` to disable anonymous access and require a `passwd` file.
    *   Update the ESP32 code and Node.js environment variables to point to the VPS IP instead of the public `broker.hivemq.com`.
3.  **Backend Deployment (Node.js):**
    *   Clone the repository to `/var/www/tracenode-backend`.
    *   Run `npm install` and compile the TypeScript code.
    *   Use **PM2** (`npm install -g pm2`) to daemonize the backend process: `pm2 start dist/server.js --name "tracenode-api"`. PM2 ensures the backend restarts automatically if the server reboots.
4.  **Database (PostgreSQL):**
    *   Either install PostgreSQL directly on the VPS or continue using the managed Supabase instance (recommended for built-in Realtime WebSocket capabilities). If self-hosting, use Drizzle Kit (`npx drizzle-kit push`) to deploy the schema to the local Postgres instance.
5.  **Frontend Deployment (Angular):**
    *   On a local development machine, run the production build: `ng build --configuration production`.
    *   Upload the output `dist/` folder to the VPS via SCP/FTP into `/var/www/tracenode-frontend`.
6.  **Nginx Reverse Proxy:**
    *   Install Nginx: `sudo apt install nginx`.
    *   Configure a server block to serve the static Angular files from `/var/www/tracenode-frontend` on port 80.
    *   (Optional) Configure a `/api` location block in Nginx to proxy API requests to the internal PM2 Node.js process running on port 3000.
