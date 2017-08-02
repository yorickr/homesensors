#include <Arduino.h>

#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino

//needed for library
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>         //https://github.com/tzapu/WiFiManager
#include <ESP8266HTTPClient.h>

#include <LinkedList.h>
#include <ArduinoJson.h>

#include <OneWire.h>
#include <DallasTemperature.h>

#include <Wire.h>
#include <BH1750.h>

#define ONE_WIRE_BUS D4

#define SDA D2
#define SCL D1

OneWire oneWire(ONE_WIRE_BUS);

DallasTemperature sensors(&oneWire);

BH1750 lightMeter;

HTTPClient http;

struct measurement {
    float temperature;
    uint16_t light;
};

LinkedList<struct measurement> measurements;

int counter = 0;

void setup() {
    Serial.begin(115200);
    Wire.begin(SDA, SCL); // actually pretty important
    sensors.begin();
    lightMeter.begin();

    WiFiManager wifiManager;
    wifiManager.autoConnect("Wemos D1 mini");
}

bool sendMeasurementsToApi() {
    StaticJsonBuffer<1024> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();

    JsonArray& data = root.createNestedArray("measurements");
    for (int i = 0; i < measurements.size(); i++) {
        JsonObject& nestedObject = data.createNestedObject();
        struct measurement m = measurements.get(i);
        nestedObject["temperature"] = m.temperature;
        nestedObject["light"] = m.light;
    }

    char buffer[256];
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

void printMeasurement(struct measurement m, int i) {
    Serial.print("Measured: ");
    Serial.print(i);
    Serial.print(" - ");
    Serial.print(m.temperature);
    Serial.print(" ");
    Serial.println(m.light);
}

void loop() {
    unsigned long startTime = millis();

    uint16_t light = lightMeter.readLightLevel();
    sensors.requestTemperatures(); // Send the command to get temperatures
    float temperature = sensors.getTempCByIndex(0);

    struct measurement m = {temperature, light};

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

    if (counter >= 6) {
        // Serial.print("Measurements contains ");
        // Serial.println(measurements.size());
        // for (int i = 0; i < measurements.size(); i++) {
        //     printMeasurement(measurements.get(i), i);
        // }
        sendMeasurementsToApi();
        counter = 0;
        measurements.clear();
    }

    unsigned long delta = millis() - startTime;
    delay(5000 - delta);
}
