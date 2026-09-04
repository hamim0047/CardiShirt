/*
  ============================================================
  ESP32 Multi-Vital Monitor  --  Continuous ECG streaming
  ------------------------------------------------------------
  - ECG: AD8232, raw, sampled on a micros()-based fixed-step
    accumulator (true 250Hz average rate, doesn't drift even if
    a loop iteration occasionally runs long). Sent as ONE
    WebSocket message per sample - no batching.
  - Heart Rate (BPM): MAX30102
  - Fall Detection: MPU6050, raw I2C (probe checks I2C ACK only -
    NOT WHO_AM_I, since some clone modules report 0x70 instead of
    the standard 0x68 while working fine otherwise)
  - Vitals (BPM/accel/fall) + Serial status: sent once per second,
    independent of the ECG stream.
  ============================================================
*/

#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// ---------------- WiFi Credentials ----------------
const char* WIFI_SSID = "UIU-STUDENT";
const char* WIFI_PASSWORD = "12345678";

// ---------------- Pin Definitions ----------------
#define ECG_OUTPUT_PIN   34
#define ECG_LO_PLUS_PIN  32
#define ECG_LO_MINUS_PIN 33
#define I2C_SDA_PIN      21
#define I2C_SCL_PIN      22

// ---------------- Web Server / WebSocket ----------------
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// ---------------- Sensor Objects ----------------
MAX30105 particleSensor;
bool max30102Available = false;

// ======================================================
// MPU6050 RAW I2C
// ======================================================
#define MPU6050_ADDR              0x68
#define MPU6050_REG_PWR1          0x6B
#define MPU6050_REG_ACCEL_CFG     0x1C
#define MPU6050_REG_ACCEL_XOUT_H  0x3B
const float MPU6050_ACCEL_SCALE = 8192.0; // +-4G range = 8192 LSB/G
bool mpuAvailable = false;

void mpu6050Init() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_REG_PWR1);
  Wire.write(0x00); // wake up
  Wire.endTransmission(true);
  delay(100);

  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_REG_ACCEL_CFG);
  Wire.write(0x08); // +-4g range
  Wire.endTransmission(true);
  delay(50);
}

bool mpu6050Probe() {
  // Only check that the device ACKs at 0x68. Don't check WHO_AM_I -
  // some clone MPU6050 modules return 0x70 there but work fine.
  Wire.beginTransmission(MPU6050_ADDR);
  return (Wire.endTransmission(true) == 0);
}

bool mpu6050ReadAccelG(float &ax_g, float &ay_g, float &az_g) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_REG_ACCEL_XOUT_H);
  if (Wire.endTransmission(false) != 0) return false;

  Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)6, (uint8_t)true);
  if (Wire.available() < 6) return false;

  int16_t rawX = ((int16_t)Wire.read() << 8) | Wire.read();
  int16_t rawY = ((int16_t)Wire.read() << 8) | Wire.read();
  int16_t rawZ = ((int16_t)Wire.read() << 8) | Wire.read();

  ax_g = rawX / MPU6050_ACCEL_SCALE;
  ay_g = rawY / MPU6050_ACCEL_SCALE;
  az_g = rawZ / MPU6050_ACCEL_SCALE;
  return true;
}

// ---------------- Heart Rate (MAX30102) ----------------
const byte RATE_ARRAY_SIZE = 4;
byte rates[RATE_ARRAY_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;

// ---------------- ECG Sampling: fixed-step accumulator, no drift ----------------
unsigned long lastEcgSampleUs = 0;
const unsigned long ECG_SAMPLE_INTERVAL_US = 4000; // 250 Hz
bool leadsOff = false;
int latestEcgValue = 0;

// 3-point median despike filter: only fires when a single sample is an
// outlier relative to BOTH its neighbors (a lone glitch), and leaves
// multi-sample features (the real QRS/T shape) completely untouched
// since those never look like an isolated single-point spike.
int ecgHistory[2] = {2048, 2048};

int despikeEcg(int rawSample) {
  int a = ecgHistory[0], b = ecgHistory[1], c = rawSample;
  int median;
  if ((a <= b && b <= c) || (c <= b && b <= a)) median = b;
  else if ((b <= a && a <= c) || (c <= a && a <= b)) median = a;
  else median = c;

  ecgHistory[0] = ecgHistory[1];
  ecgHistory[1] = rawSample;
  return median; // this is the (n-1)th sample - one sample (4ms) of lag
}

// 50Hz notch filter (mains hum) - the high-frequency jitter you're seeing
// riding on top of the real R-wave spikes is exactly what this targets.
// Coefficients for fs=250Hz, f0=50Hz, Q=5. If you're somewhere on 60Hz
// mains, these need recomputing for f0=60.
const float NOTCH_B0 = 0.9132, NOTCH_B1 = -0.5643, NOTCH_B2 = 0.9132;
const float NOTCH_A1 = -0.5643, NOTCH_A2 = 0.8263;
float notchX1 = 0, notchX2 = 0, notchY1 = 0, notchY2 = 0;

float applyNotchFilter(float x) {
  float y = NOTCH_B0 * x + NOTCH_B1 * notchX1 + NOTCH_B2 * notchX2
            - NOTCH_A1 * notchY1 - NOTCH_A2 * notchY2;
  notchX2 = notchX1; notchX1 = x;
  notchY2 = notchY1; notchY1 = y;
  return y;
}

// Baseline wander removal: tracks a very slow-moving average (breathing/
// movement drift) and subtracts it, re-centering on the ADC midpoint.
// Deliberately slow so it never touches the fast QRS spike itself.
float baselineEstimate = 2048;
const float BASELINE_ALPHA = 0.002;

float removeBaselineWander(float x) {
  baselineEstimate += BASELINE_ALPHA * (x - baselineEstimate);
  return x - baselineEstimate + 2048;
}

int filterEcg(int rawSample) {
  int despiked = despikeEcg(rawSample); // remove single-sample glitches FIRST,
                                         // before they can corrupt the IIR
                                         // filters' internal state below
  float v = applyNotchFilter((float)despiked);
  v = removeBaselineWander(v);
  if (v < 0) v = 0;
  if (v > 4095) v = 4095;
  return (int)v;
}

// ---------------- Fall Detection ----------------
enum FallState { NORMAL, FREE_FALL, CONFIRMING };
FallState fallState = NORMAL;

const float FREE_FALL_THRESHOLD_G  = 0.4;
const float IMPACT_THRESHOLD_G     = 2.5;
const unsigned long FREE_FALL_WINDOW_MS  = 600;
const unsigned long INACTIVITY_WINDOW_MS = 2000;
const float INACTIVITY_BAND_G      = 0.35;

unsigned long freeFallStartTime = 0;
unsigned long impactTime = 0;
float accelMagnitude = 0;
bool fallDetected = false;

// ---------------- Reporting timers ----------------
unsigned long lastVitalsReport = 0;
const unsigned long VITALS_INTERVAL_MS = 1000; // change to 2000 for a 2s cadence
unsigned long lastWsCleanup = 0;

// MPU6050/MAX30102 don't need 250Hz - 50Hz is plenty for accel/PPG.
// Gating them frees the loop to actually reach closer to a true 250Hz
// for the ECG sample instead of being capped by two unconditional I2C
// reads happening on every single iteration.
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_READ_INTERVAL_MS = 20; // 50 Hz

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    Serial.println();
    Serial.println("================================");
    Serial.println("FRONTEND CONNECTED");
    Serial.print("Client ID: "); Serial.println(client->id());
    Serial.print("Client IP: "); Serial.println(client->remoteIP().toString());
    Serial.println("================================");
  } else if (type == WS_EVT_DISCONNECT) {
    Serial.print("Frontend disconnected. Client ID: ");
    Serial.println(client->id());
  }
}

void connectWiFi() {
  Serial.println("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected. ESP32 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("WebSocket URL: ws://");
  Serial.print(WiFi.localIP());
  Serial.println("/ws");
}

void setup() {
  Serial.begin(115200); // fast baud so Serial.print doesn't stall the 250Hz loop
  delay(1000);

  pinMode(ECG_LO_PLUS_PIN, INPUT);
  pinMode(ECG_LO_MINUS_PIN, INPUT);
  analogReadResolution(12);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // ---- MAX30102 ----
  Serial.print("[MAX30102] Checking sensor... ");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("NOT FOUND!");
    max30102Available = false;
  } else {
    Serial.println("OK");
    max30102Available = true;
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  // ---- MPU6050 ----
  Serial.print("[MPU6050] Checking sensor... ");
  if (mpu6050Probe()) {
    Serial.println("FOUND");
    mpu6050Init();
    mpuAvailable = true;
  } else {
    Serial.println("NOT FOUND!");
    mpuAvailable = false;
  }

  connectWiFi();

  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();
  Serial.println("WebSocket server started.");

  lastEcgSampleUs = micros();
}

// One ECG sample per message. Uses a fixed char buffer instead of String
// concatenation - this runs 250 times/sec, so avoiding repeated heap
// allocation here matters for long-running stability.
void sendEcg(unsigned long nowMs) {
  char buf[96];
  snprintf(buf, sizeof(buf),
           "{\"type\":\"ecg\",\"t\":%lu,\"leadsOff\":%s,\"ecg\":%d}",
           nowMs, leadsOff ? "true" : "false", latestEcgValue);
  ws.textAll(buf);
}

void sendVitals(unsigned long now) {
  char buf[128];
  snprintf(buf, sizeof(buf),
           "{\"type\":\"vitals\",\"t\":%lu,\"bpm\":%.1f,\"bpmAvg\":%d,\"accelG\":%.2f,\"fallDetected\":%s}",
           now, beatsPerMinute, beatAvg, accelMagnitude, fallDetected ? "true" : "false");
  ws.textAll(buf);
}

void loop() {
  unsigned long now = millis();

  // ---------------- ECG: fixed-step, drift-free sampling ----------------
  unsigned long nowUs = micros();
  if (nowUs - lastEcgSampleUs >= ECG_SAMPLE_INTERVAL_US) {
    lastEcgSampleUs += ECG_SAMPLE_INTERVAL_US; // accumulate, don't reset to nowUs -
                                                // keeps long-term rate at a true 250Hz
                                                // instead of drifting if a loop iteration
                                                // runs a bit long.

    leadsOff = (digitalRead(ECG_LO_PLUS_PIN) == HIGH) ||
               (digitalRead(ECG_LO_MINUS_PIN) == HIGH);

    latestEcgValue = filterEcg(analogRead(ECG_OUTPUT_PIN));

    Serial.print("ECG: ");
    Serial.println(latestEcgValue);

    sendEcg(now);
  }

  // ---------------- MAX30102 + MPU6050: gated to 50Hz ----------------
  // These used to run unconditionally every loop() call, which - combined
  // with real I2C driver overhead - was capping the WHOLE loop (and
  // therefore the ECG sample rate) at ~51Hz instead of the intended 250Hz.
  // Neither sensor needs faster than 50Hz, so gate them here.
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
    lastSensorRead = now;

    if (max30102Available) {
      long irValue = particleSensor.getIR();
      if (checkForBeat(irValue)) {
        long delta = now - lastBeat;
        lastBeat = now;
        if (delta > 0) beatsPerMinute = 60.0 / (delta / 1000.0);

        if (beatsPerMinute > 20 && beatsPerMinute < 255) {
          rates[rateSpot++] = (byte)beatsPerMinute;
          rateSpot %= RATE_ARRAY_SIZE;
          beatAvg = 0;
          for (byte x = 0; x < RATE_ARRAY_SIZE; x++) beatAvg += rates[x];
          beatAvg /= RATE_ARRAY_SIZE;
        }
      }
    }

    float ax_g = 0, ay_g = 0, az_g = 1.0;
    if (mpuAvailable) {
      mpu6050ReadAccelG(ax_g, ay_g, az_g);
    }
    accelMagnitude = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);
  }

  // ---------------- Fall Detection ----------------
  fallDetected = false;
  switch (fallState) {
    case NORMAL:
      if (accelMagnitude < FREE_FALL_THRESHOLD_G) {
        fallState = FREE_FALL;
        freeFallStartTime = now;
      }
      break;

    case FREE_FALL:
      if (now - freeFallStartTime > FREE_FALL_WINDOW_MS) {
        fallState = NORMAL;
      } else if (accelMagnitude > IMPACT_THRESHOLD_G) {
        fallState = CONFIRMING;
        impactTime = now;
      }
      break;

    case CONFIRMING:
      if (fabs(accelMagnitude - 1.0) > INACTIVITY_BAND_G) {
        fallState = NORMAL;
      } else if (now - impactTime > INACTIVITY_WINDOW_MS) {
        fallDetected = true;
        fallState = NORMAL;
        String msg = "{\"type\":\"fall\",\"t\":" + String(now) + "}";
        ws.textAll(msg);
        Serial.println(">>> FALL DETECTED <<<");
      }
      break;
  }

  // ---------------- Vitals + Serial status: once per second ----------------
  if (now - lastVitalsReport >= VITALS_INTERVAL_MS) {
    lastVitalsReport = now;
    sendVitals(now);

    Serial.println("------------- VITALS -------------");
    if (max30102Available) {
      Serial.print("BPM: "); Serial.println(beatsPerMinute, 1);
      Serial.print("Average BPM: "); Serial.println(beatAvg);
    } else {
      Serial.println("BPM: MAX30102 NOT AVAILABLE");
    }
    if (mpuAvailable) {
      Serial.print("Acceleration: "); Serial.print(accelMagnitude, 2); Serial.println(" G");
    } else {
      Serial.println("Acceleration: MPU6050 NOT AVAILABLE");
    }
    Serial.print("Fall: "); Serial.println(fallDetected ? "DETECTED" : "NO");
    Serial.print("WiFi: ");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("CONNECTED | IP: "); Serial.println(WiFi.localIP());
    } else {
      Serial.println("DISCONNECTED");
    }
    Serial.print("WebSocket clients: "); Serial.println(ws.count());
    Serial.println("---------------------------------");
  }

  // ---------------- WebSocket cleanup ----------------
  if (now - lastWsCleanup > 1000) {
    lastWsCleanup = now;
    ws.cleanupClients();
  }
}
