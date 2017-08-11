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

// #define USE_LIGHT

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

enum states {
    LOGIN_STATE,
    REGISTER_STATE,
    RETRIEVING_STATE,
    SENDING_STATE
};

enum ret_codes {
    OK,
    ERROR_RETRY,
    ERROR
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

void post_request() {

}

bool send_measurements_to_api() {
    StaticJsonBuffer<1024> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();

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

    char buffer[1024];
    root.printTo(buffer, sizeof(buffer));
    int len = root.measureLength();
    Serial.print("Buffer is ");
    Serial.println(buffer);

    http.begin("http://imegumii.space:3030/api/measurement"); //HTTP
    http.addHeader("Content-Type", "application/json", true, true);
    int httpCode = http.POST(buffer);
    if (httpCode > 0) {
        Serial.printf("[HTTP] POST... code: %d\n", httpCode);

        if (httpCode == HTTP_CODE_OK) {
            http.end();
            return true;
        }
    } else {
        Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
    return false;
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
        send_measurements_to_api();
        counter = 0;
        measurements.clear();
    }

    unsigned long delta = millis() - startTime;
    delay(5000 - delta);
};

void loop() {
    switch (current_state) {
        case LOGIN_STATE:
            // login and get a token. if we ever get an invalid token error, then go back to this state to login again.
            break;
        case REGISTER_STATE:
            // register this sensor with the api.
            // if it goes wrong, it might be already registered, check for this and catch accordingly.
            break;
        case RETRIEVING_STATE:
            // retrieve sensor data. if > 12 times then send data.
            retrieve_data();
            break;
        case SENDING_STATE:
            // send using wifi
            break;
    }
}
