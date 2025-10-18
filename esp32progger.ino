// WiFi ++
#include <WiFi.h>
#include <WiFiAP.h>
#include <WiFiClient.h>
// WebServer ++
#include <WebServer.h>
// Camera ++
#include <esp32cam.h>

// WebDefs
#define AP_SSID "ESP32CAM_AP_OPEN"
// #define AP_PASS "abcd1234"

WebServer server(80);

void handleCapture() {
  auto img = esp32cam::capture();
  if (img == nullptr) {
    server.send(503, "text/plain", "Camera capture failed");
    return;
  }

  server.setContentLength(img->size());
  server.send(200, "image/jpeg");

  WiFiClient client = server.client();
  img->writeTo(client);   // write JPEG bytes
  client.stop();          // make sure the response is closed
}

void handleRoot() {
  server.send(200, "text/html",
              "<html><body><h1>ESP32-CAM</h1>"
              "<p><a href=\"/capture.jpg\">Capture</a></p></body></html>");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Did begin");
  delay(500);

  // --- Camera config ---
  auto res = esp32cam::Resolution::find(1280, 720); // start small: VGA
  esp32cam::Config cfg;
  cfg.setPins(esp32cam::pins::AiThinker);
  cfg.setResolution(res);
  cfg.setJpeg(80);                // moderate compression to reduce size
  cfg.setBufferCount(1);          // be conservative with RAM

  if (!esp32cam::Camera.begin(cfg)) {
    Serial.println("Camera.begin() FAILED. Check PSRAM power/board/pins.");
    while (true) delay(1000);
  }

  // --- AP mode ---
  WiFi.mode(WIFI_AP);
  bool ok = WiFi.softAP(AP_SSID);
  Serial.printf("AP %s at %s\n", ok ? "started" : "FAILED",
                WiFi.softAPIP().toString().c_str());
  

  Serial.println("SoftAP IP: " + WiFi.softAPIP().toString());
  Serial.println("STA IP: " + WiFi.localIP().toString());


  server.on("/", handleRoot);
  server.on("/ping", []{ server.send(200, "text/plain", "pong"); });
  server.on("/capture.jpg", HTTP_GET, handleCapture);
  server.begin();
}

void loop() {
  server.handleClient();
}
