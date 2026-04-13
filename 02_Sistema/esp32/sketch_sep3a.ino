#include <WiFi.h>
#include <PubSubClient.h>

// Relay wiring on this board
static const uint8_t RELAY_MAQUINA = 26;
static const uint8_t RELAY_REINICIO = 25;
static const uint8_t RELAY_PUERTA = 33;
static const uint8_t RELAY_LUZ = 32;

// Relay module in this setup is active HIGH
static const uint8_t RELAY_ON = HIGH;
static const uint8_t RELAY_OFF = LOW;

// Network credentials
const char* WIFI_SSID = "CHANGE_ME_WIFI";
const char* WIFI_PASS = "CHANGE_ME_WIFI_PASS";

// MQTT broker
const char* MQTT_HOST = "192.168.1.53";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER = "kwl";
const char* MQTT_PASS = "CHANGE_ME_MQTT_PASS";
const char* NODE_ID = "esp32_kwl_01";

// Topic map (aligned with 02_MQTT_topics.md)
const char* TOPIC_MAQUINA_CMD = "kwl/maquinas/lavadora1/comando";
const char* TOPIC_MAQUINA_ESTADO = "kwl/maquinas/lavadora1/estado";
const char* TOPIC_MAQUINA_EVENTO = "kwl/maquinas/lavadora1/evento";
const char* TOPIC_MAQUINA_TELEMETRIA = "kwl/maquinas/lavadora1/telemetria";
const char* TOPIC_MAQUINA_DISP = "kwl/maquinas/lavadora1/disponibilidad";

const char* TOPIC_PUERTA_CMD = "kwl/sistema/puerta/comando";
const char* TOPIC_PUERTA_ESTADO = "kwl/sistema/puerta/estado";
const char* TOPIC_LUZ_CMD = "kwl/sistema/luces/comando";
const char* TOPIC_LUZ_ESTADO = "kwl/sistema/luces/estado";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastTelemetryMs = 0;
unsigned long lastReconnectTryMs = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 30000;
const unsigned long RECONNECT_INTERVAL_MS = 5000;

String machineState = "STOP";
String doorState = "CERRADA";
String lightState = "OFF";

void applyRelaySafeDefaults() {
  pinMode(RELAY_MAQUINA, OUTPUT);
  pinMode(RELAY_REINICIO, OUTPUT);
  pinMode(RELAY_PUERTA, OUTPUT);
  pinMode(RELAY_LUZ, OUTPUT);

  digitalWrite(RELAY_MAQUINA, RELAY_OFF);
  digitalWrite(RELAY_REINICIO, RELAY_OFF);
  digitalWrite(RELAY_PUERTA, RELAY_OFF);
  digitalWrite(RELAY_LUZ, RELAY_OFF);
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("[WiFi] connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  Serial.print("[WiFi] connected IP=");
  Serial.println(WiFi.localIP());
}

void publish(const char* topic, const String& payload, bool retained = false) {
  mqttClient.publish(topic, payload.c_str(), retained);
}

void publishMachineState() {
  String payload =
    "{\"estado\":\"" + machineState + "\",\"nodo\":\"" + NODE_ID + "\"}";
  publish(TOPIC_MAQUINA_ESTADO, payload, true);
}

void publishDoorState() {
  String payload = "{\"estado\":\"" + doorState + "\"}";
  publish(TOPIC_PUERTA_ESTADO, payload, true);
}

void publishLightState() {
  String payload = "{\"estado\":\"" + lightState + "\"}";
  publish(TOPIC_LUZ_ESTADO, payload, true);
}

void publishEvent(const String& eventName, const String& detail) {
  String payload =
    "{\"evento\":\"" + eventName + "\",\"detalle\":\"" + detail + "\",\"nodo\":\"" + NODE_ID + "\"}";
  publish(TOPIC_MAQUINA_EVENTO, payload, false);
}

void publishTelemetry() {
  long rssi = WiFi.RSSI();
  unsigned long up = millis();
  String payload =
    "{\"rssidb\":" + String(rssi) + ",\"uptime_ms\":" + String(up) + ",\"heap\":" + String(ESP.getFreeHeap()) + "}";
  publish(TOPIC_MAQUINA_TELEMETRIA, payload, false);
}

String toLowerCopy(String value) {
  value.trim();
  value.toLowerCase();
  return value;
}

String parseAction(String payloadRaw) {
  String payload = toLowerCopy(payloadRaw);

  if (payload.startsWith("{")) {
    int key = payload.indexOf("accion");
    if (key >= 0) {
      int colon = payload.indexOf(':', key);
      int firstQuote = payload.indexOf('"', colon);
      int secondQuote = payload.indexOf('"', firstQuote + 1);
      if (firstQuote >= 0 && secondQuote > firstQuote) {
        return payload.substring(firstQuote + 1, secondQuote);
      }
    }
  }

  return payload;
}

void pulseRestartRelay() {
  digitalWrite(RELAY_REINICIO, RELAY_ON);
  delay(1200);
  digitalWrite(RELAY_REINICIO, RELAY_OFF);
}

void handleMachineCommand(const String& action) {
  if (action == "start" || action == "encender") {
    digitalWrite(RELAY_MAQUINA, RELAY_ON);
    machineState = "EN_MARCHA";
    publishMachineState();
    publishEvent("machine_start", "relay maquina ON");
    return;
  }

  if (action == "stop" || action == "apagar") {
    digitalWrite(RELAY_MAQUINA, RELAY_OFF);
    machineState = "STOP";
    publishMachineState();
    publishEvent("machine_stop", "relay maquina OFF");
    return;
  }

  if (action == "restart" || action == "reiniciar") {
    pulseRestartRelay();
    machineState = "RESTART_SIGNAL";
    publishMachineState();
    publishEvent("machine_restart", "restart pulse sent");
    return;
  }

  if (action == "estado" || action == "status") {
    publishMachineState();
    publishDoorState();
    publishLightState();
    publishTelemetry();
    return;
  }

  if (action == "ping") {
    publishEvent("pong", "node alive");
    return;
  }

  publishEvent("command_rejected", action);
}

void handleDoorCommand(const String& action) {
  if (action == "abrir" || action == "open") {
    digitalWrite(RELAY_PUERTA, RELAY_ON);
    doorState = "ABIERTA";
    publishDoorState();
    publishEvent("door_open", "relay puerta ON");
    return;
  }

  if (action == "cerrar" || action == "close") {
    digitalWrite(RELAY_PUERTA, RELAY_OFF);
    doorState = "CERRADA";
    publishDoorState();
    publishEvent("door_close", "relay puerta OFF");
    return;
  }

  publishEvent("door_command_rejected", action);
}

void handleLightCommand(const String& action) {
  if (action == "on" || action == "luz" || action == "light_on") {
    digitalWrite(RELAY_LUZ, RELAY_ON);
    lightState = "ON";
    publishLightState();
    publishEvent("light_on", "relay luz ON");
    return;
  }

  if (action == "off" || action == "sombra" || action == "light_off") {
    digitalWrite(RELAY_LUZ, RELAY_OFF);
    lightState = "OFF";
    publishLightState();
    publishEvent("light_off", "relay luz OFF");
    return;
  }

  publishEvent("light_command_rejected", action);
}

void mqttCallback(char* topic, byte* message, unsigned int length) {
  String payload;
  payload.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    payload += (char)message[i];
  }

  String action = parseAction(payload);
  String topicStr(topic);

  if (topicStr == TOPIC_MAQUINA_CMD) {
    handleMachineCommand(action);
    return;
  }

  if (topicStr == TOPIC_PUERTA_CMD) {
    handleDoorCommand(action);
    return;
  }

  if (topicStr == TOPIC_LUZ_CMD) {
    handleLightCommand(action);
    return;
  }

  publishEvent("unknown_topic", topicStr);
}

bool connectMqtt() {
  if (mqttClient.connected()) {
    return true;
  }

  if (!mqttClient.connect(NODE_ID, MQTT_USER, MQTT_PASS, TOPIC_MAQUINA_DISP, 1, true, "offline")) {
    return false;
  }

  publish(TOPIC_MAQUINA_DISP, "online", true);
  mqttClient.subscribe(TOPIC_MAQUINA_CMD, 1);
  mqttClient.subscribe(TOPIC_PUERTA_CMD, 1);
  mqttClient.subscribe(TOPIC_LUZ_CMD, 1);

  publishMachineState();
  publishDoorState();
  publishLightState();
  publishEvent("mqtt_connected", NODE_ID);
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  applyRelaySafeDefaults();

  connectWifi();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
  mqttClient.setKeepAlive(30);
  mqttClient.setCallback(mqttCallback);

  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }

  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectTryMs >= RECONNECT_INTERVAL_MS) {
      lastReconnectTryMs = now;
      connectMqtt();
    }
  } else {
    mqttClient.loop();
  }

  unsigned long now = millis();
  if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = now;
    publishTelemetry();
  }
}
