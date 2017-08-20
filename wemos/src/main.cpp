#include <Arduino.h>

#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino

//needed for library
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>         //https://github.com/tzapu/WiFiManager
#include <ESP8266HTTPClient.h>

#include <LinkedList.h>
#include <ArduinoJson.h>

// Uncomment the ones supported.
#define USE_TEMPERATURE

#define USE_LIGHT

#ifdef USE_TEMPERATURE

#include <OneWire.h>
#include <DallasTemperature.h>
#define ONE_WIRE_BUS D4

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

#endif

#ifdef USE_LIGHT

#include <Wire.h>
#include <BH1750.h>
#define SDA D2
#define SCL D1

BH1750 lightMeter;

#endif

HTTPClient http;

struct measurement {
    float temperature;
    uint16_t light;
};

LinkedList<struct measurement> measurements;

int counter = 0;

String mac;

// Steps to perform.

// login and get token, store token
// register sensor
// push data

// Credentials for the backend API:

#define API_HOSTNAME    "imegumii.space"
#define API_PROTOCOL    "http"
#define API_PORT        3030
#define API_USERNAME    ""
#define API_PASS        ""

int userId = -1;
int sensorId = -1; // the ID of this sensor;
String token;

enum states {
    LOGIN_STATE,
    REGISTER_STATE,
    RETRIEVING_STATE,
    SENDING_STATE
};

enum ret_codes {
    STATUS_OK,
    STATUS_ERROR_RETRY,
    STATUS_ERROR
};

enum states current_state = LOGIN_STATE;

void setup() {
    Serial.begin(115200);

    #ifdef USE_LIGHT
    Wire.begin(SDA, SCL); // actually pretty important
    lightMeter.begin();
    #endif

    #ifdef USE_TEMPERATURE
    sensors.begin();
    #endif

    WiFiManager wifiManager;
    wifiManager.autoConnect("Wemos D1 mini");
    mac = WiFi.macAddress();
}

String url() {
    return String(API_PROTOCOL) + "://" + String(API_HOSTNAME) + ":" + String(API_PORT);
}

String post_request(String url, const char buffer[]) {
    http.begin(url); //HTTP
    http.addHeader("Content-Type", "application/json", true, true);
    if (token.length() > 0) {
        http.addHeader("X-Access-Token", token, true, true);
    }
    int httpCode = http.POST(buffer);
    String payload = http.getString();
    if (httpCode > 0) {
        Serial.printf("[HTTP] POST... code: %d\n", httpCode);
        return payload; // TODO: catch various http codes.
        // if (httpCode == HTTP_CODE_OK) {
        //     http.end();
        //     return true;
        // }
    } else {
        Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
    return "";
}

bool send_measurements_to_api() {
    StaticJsonBuffer<1024> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    root["sensorId"] = sensorId;

    JsonArray& data = root.createNestedArray("measurements");
    for (int i = 0; i < measurements.size(); i++) {
        JsonObject& nestedObject = data.createNestedObject();
        struct measurement m = measurements.get(i);
        #ifdef USE_LIGHT
        nestedObject["light"] = m.light;
        #endif

        #ifdef USE_TEMPERATURE
        nestedObject["temperature"] = m.temperature;
        #endif
    }

    String buffer;
    root.printTo(buffer);

    Serial.print("Buffer is ");
    Serial.println(buffer);
    String baseUrl = url() + "/api/data/measurement";
    String payload = post_request(baseUrl, buffer.c_str());
    Serial.println("Payload is ");
    Serial.println(payload);

    StaticJsonBuffer<200> jsonBuffer2;
    JsonObject &root2 = jsonBuffer2.parseObject(payload);
    if (!root2.success()) {
        // Parsing failed, error.
        Serial.println("Parsing json in send_measurements_to_api failed");
        return false;
    }
    bool success = root2["success"];
    return success;
}

bool retrieve_data() {
    unsigned long startTime = millis();
    struct measurement m = { 0.0, 0};

    #ifdef USE_TEMPERATURE
    sensors.requestTemperatures(); // Send the command to get temperatures
    float temperature = sensors.getTempCByIndex(0);
    m.temperature = temperature;

    #endif

    #ifdef USE_LIGHT
    uint16_t light = lightMeter.readLightLevel();
    m.light = light;

    #endif

    Serial.print("Measured the following: ");
    Serial.print(m.temperature);
    Serial.print(" ");
    Serial.println(m.light);
    if (m.light > 20000) {
        // discard
        m.light = 0;
    }
    measurements.add(m);
    counter++;

    if (counter >= 12) { // send 12 measurements, once every 5 seconds
        // Serial.print("Measurements contains ");
        // Serial.println(measurements.size());
        // for (int i = 0; i < measurements.size(); i++) {
        //     printMeasurement(measurements.get(i), i);
        // }
        if (!send_measurements_to_api()) {
            // something went wrong sending data to api.
            counter = 0;
            measurements.clear();
            return false;
        } else {
            // all is ok, stuff has been sent.
            counter = 0;
            measurements.clear();
        }

    }

    Serial.print("Free heap: ");
    Serial.println(ESP.getFreeHeap());

    unsigned long delta = millis() - startTime;
    delay(5000 - delta);
    return true;
};

bool log_in() {
    // URL: http://imegumii.space:3030/api/user/login
    String baseUrl = url() + "/api/user/login";
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject &root = jsonBuffer.createObject();
    root["username"] = "yorickr";
    root["password"] = "kaas";
    String jsonToSend;
    root.printTo(jsonToSend);
    String payload = post_request(baseUrl, jsonToSend.c_str());
    Serial.print("Received payload is ");
    Serial.println(payload);

    StaticJsonBuffer<512> buffer;
    JsonObject &root2 = buffer.parseObject(payload);
    if (!root2.success()) {
        // Parsing failed, error.
        Serial.println("Parsing json in log_in failed");
        return false;
    }

    // get token from payload.
    bool success = root2["success"];
    if (success) {
        // request is succesful, get token.
        int id = root2["data"]["userId"];
        String tk = root2["data"]["token"];
        token = tk;
        userId = id;
        return true;
    } else {
        Serial.println("Logging in was unsuccesful!");
        return false;
    }
}

bool register_sensor() {
    Serial.println("Registering sensor!");
    Serial.print("Token is ");
    Serial.println(token);
    Serial.print("UserId is ");
    Serial.println(userId);

    String baseUrl = url() + "/api/sensor/register";
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject &root = jsonBuffer.createObject();
    root["userId"] = userId;
    root["mac"] = mac;
    String jsonToSend;
    root.printTo(jsonToSend);
    String payload = post_request(baseUrl, jsonToSend.c_str());
    Serial.print("Received payload is ");
    Serial.println(payload);

    StaticJsonBuffer<200> buffer;
    JsonObject &root2 = buffer.parseObject(payload);
    if (!root2.success()) {
        // Parsing failed, error.
        Serial.println("Parsing json in register_sensor failed");
        return false;
    }
    bool success = root2["success"];
    if (success) {
        int id = root2["data"]["sensorId"];
        Serial.println("Setting sensorId to ");
        Serial.println(id);
        sensorId = id;
        return true;
    }
    return false;
}

void loop() {
    switch (current_state) {
        case LOGIN_STATE:
            // login and get a token. if we ever get an invalid token error, then go back to this state to login again.
            if (log_in()) {
                // go to next state
                current_state = REGISTER_STATE;
            }
            break;
        case REGISTER_STATE:
            // register this sensor with the api.
            // if it goes wrong, it might be already registered, check for this and catch accordingly.
            if (register_sensor()) {
                current_state = RETRIEVING_STATE;
            } else {
                // fall back to login state.
                current_state = LOGIN_STATE;
            }
            break;
        case RETRIEVING_STATE:
            // retrieve sensor data. if > 12 times then send data.
            if (!retrieve_data()) {
                // if this returns false, something has gone wrong, go back to login state.
                current_state = LOGIN_STATE;
            }
            break;
    }
}
