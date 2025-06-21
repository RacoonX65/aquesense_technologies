// Aquasense Technologies ESP32 Water Quality Monitoring System
// Developed by Judas Sithole
// This code measures water quality parameters and uploads data to Firebase.
// It supports both WPA2 Enterprise (e.g., Eduroam) and standard WiFi connections.
// Calibration values are stored in ESP32 Preferences (NVS).

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "esp_wpa2.h"
#include <Wire.h>
#include <LiquidCrystal_I2C_STEM.h>
#include <esp_sleep.h>
#include <Preferences.h>

// ===================== USER CONFIGURATION =====================
#define WIFI_SSID "YOUR_WIFI_SSID"                 // WiFi SSID (for both WPA2 Enterprise and normal WiFi)
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"         // WiFi password (for normal WiFi only)
#define WIFI_IDENTITY "YOUR_SCHOOL_USERNAME"      // WPA2 Enterprise identity/username
#define WIFI_EAP_PASSWORD "YOUR_SCHOOL_PASSWORD"  // WPA2 Enterprise password
#define FIREBASE_API_KEY "YOUR_FIREBASE_WEB_API_KEY"
#define FIREBASE_PROJECT_ID "YOUR_FIREBASE_PROJECT_ID"
// =============================================================

// Firebase and LCD objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
LiquidCrystal_I2C_STEM lcd(0x27, 16, 2);
OneWire oneWire(4);
DallasTemperature sensors(&oneWire);
Preferences preferences;

// Pin assignments
const int PH_PIN = 34;      // Analog pin for pH sensor
const int TURB_PIN = 35;    // Analog pin for Turbidity sensor
const int TDS_PIN = 36;     // Analog pin for TDS/EC sensor
const int BTN_UP = 14;      // Button: Up
const int BTN_DOWN = 27;    // Button: Down
const int BTN_SELECT = 26;  // Button: Select
const int BTN_BACK = 25;    // Button: Back

// Menu items
const char* menuItems[] = { "Temperature", "pH", "Turbidity", "TDS", "EC", "Power Save", "Send Data" };
int currentMenuItem = 0;
const int menuItemsCount = 7;
bool inSubMenu = false;
unsigned long lastButtonPress = 0;
unsigned long lastLCDActivity = 0;
bool lcdBacklightOn = true;

// Calibration values (will be loaded from Preferences)
float ph_slope = -1.5;
float ph_intercept = 7.0;
float turb_slope = -50.0;
float turb_intercept = 100.0;
float tds_k = 0.5; // TDS probe constant

// Buffers for sensor averaging
unsigned long lastRead = 0;
float phBuf[3], turbBuf[3], tdsBuf[3];
int phPtr = 0, turbPtr = 0, tdsPtr = 0;
bool powerSaveMode = false;

// ===================== CALIBRATION STORAGE =====================
// Load calibration values from Preferences (NVS)
void loadCalibration() {
  preferences.begin("calib", true); // read-only
  ph_slope = preferences.getFloat("ph_slope", ph_slope);
  ph_intercept = preferences.getFloat("ph_intercept", ph_intercept);
  turb_slope = preferences.getFloat("turb_slope", turb_slope);
  turb_intercept = preferences.getFloat("turb_intercept", turb_intercept);
  tds_k = preferences.getFloat("tds_k", tds_k);
  preferences.end();
}
// Save calibration values to Preferences (NVS)
void saveCalibration() {
  preferences.begin("calib", false); // read-write
  preferences.putFloat("ph_slope", ph_slope);
  preferences.putFloat("ph_intercept", ph_intercept);
  preferences.putFloat("turb_slope", turb_slope);
  preferences.putFloat("turb_intercept", turb_intercept);
  preferences.putFloat("tds_k", tds_k);
  preferences.end();
}
// ==============================================================

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // I2C for LCD
  lcd.begin(16, 2);
  lcd.backlight();
  lcd.print("System Starting");
  lcd.setCursor(0, 1);
  lcd.print("Please wait...");
  delay(1000);

  // Initialize buttons
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_SELECT, INPUT_PULLUP);
  pinMode(BTN_BACK, INPUT_PULLUP);

  // Initialize sensors
  sensors.begin();
  analogSetPinAttenuation(PH_PIN, ADC_11db);
  analogSetPinAttenuation(TURB_PIN, ADC_11db);
  analogSetPinAttenuation(TDS_PIN, ADC_11db);
  analogReadResolution(12);

  // Load calibration values from NVS
  loadCalibration();

  // ===================== WIFI CONNECTION =====================
  // Choose ONE of the following WiFi connection methods:
  // 1. WPA2 Enterprise (Eduroam, school WiFi)
  // 2. Standard WiFi (home, office, hotspot)

  bool useEnterprise = true; // Set to false to use standard WiFi

  Serial.println("Connecting to WiFi...");
  WiFi.mode(WIFI_STA);

  if (useEnterprise) {
    // --- WPA2 Enterprise Connection ---
    // Uncomment and fill in your credentials above
    esp_wifi_sta_wpa2_ent_set_identity((uint8_t*)WIFI_IDENTITY, strlen(WIFI_IDENTITY));
    esp_wifi_sta_wpa2_ent_set_username((uint8_t*)WIFI_IDENTITY, strlen(WIFI_IDENTITY));
    esp_wifi_sta_wpa2_ent_set_password((uint8_t*)WIFI_EAP_PASSWORD, strlen(WIFI_EAP_PASSWORD));
    WiFi.begin(WIFI_SSID);
    esp_wifi_sta_wpa2_ent_enable();
  } else {
    // --- Standard WiFi Connection ---
    // Uncomment and fill in your credentials above
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  // Display WiFi connection status
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    lcd.setCursor(0, 1);
    lcd.print("Status: ");
    lcd.print(WiFi.status());
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  delay(2000);
  // ==========================================================

  // ===================== FIREBASE SETUP =====================
  config.api_key = FIREBASE_API_KEY;
  config.database_url = "https://" + String(FIREBASE_PROJECT_ID) + ".firebaseio.com";
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Signing in anonymously to Firebase...");
  if (Firebase.Auth.signInAnonymously(&auth, &config)) {
    Serial.println("Signed in successfully.");
  } else {
    Serial.printf("Firebase Auth Error: %s\n", auth.error.message.c_str());
  }
  Firebase.setReadTimeout(fbdo, 1000 * 60);
  Firebase.setwriteSizeLimit(fbdo, "tiny");
  // ==========================================================

  displayMenu(); // Show initial menu
}

// ===================== POWER MANAGEMENT =====================
void managePower() {
  if (powerSaveMode) {
    // Turn off LCD backlight after 30 seconds of inactivity
    if (lcdBacklightOn && millis() - lastLCDActivity > 30000) {
      lcd.noBacklight();
      lcdBacklightOn = false;
    }
    // Enter deep sleep after 5 minutes of inactivity
    if (millis() - lastRead > 300000) {
      enterDeepSleep();
    }
  }
}
void enterDeepSleep() {
  lcd.clear();
  lcd.print("Sleeping...");
  lcd.setCursor(0, 1);
  lcd.print("Press SELECT to wake");
  delay(1000);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)BTN_SELECT, 0);
  esp_deep_sleep_start();
}
void wakeLCD() {
  if (!lcdBacklightOn) {
    lcd.backlight();
    lcdBacklightOn = true;
  }
  lastLCDActivity = millis();
}
// ============================================================

// ===================== SENSOR FUNCTIONS =====================
// Read and average voltage from an analog pin
float readVoltage(int pin, float* buf, int* ptr) {
  int adc = analogRead(pin);
  if (adc == 0 || adc == 4095) {
    Serial.printf("Warning: Raw ADC read %d for pin %d, potential sensor issue.\n", adc, pin);
    return -1.0;
  }
  float v = adc * (3.3 / 4095.0);
  buf[*ptr] = v;
  *ptr = (*ptr + 1) % 3;
  float sum = 0;
  for (int i = 0; i < 3; i++) {
    sum += buf[i];
  }
  return sum / 3;
}
// Get temperature from DS18B20
float getTemp() {
  sensors.requestTemperatures();
  float t = sensors.getTempCByIndex(0);
  if (t == -127.00 || t == 85.00) {
    Serial.println("WARNING: DS18B20 sensor error, returning default temp 25C.");
    return 25.0;
  }
  return t;
}
// Get pH value (with temperature compensation)
float getPH() {
  float v = readVoltage(PH_PIN, phBuf, &phPtr);
  if (v < 0) return -1.0;
  float ph = ph_slope * v + ph_intercept;
  float currentTempC = getTemp();
  ph += (0.0198 * (currentTempC - 25.0));
  return constrain(ph, 0.0, 14.0);
}
// Get Turbidity value
float getTurbidity() {
  float v = readVoltage(TURB_PIN, turbBuf, &turbPtr);
  if (v < 0) return -1.0;
  float ntu = turb_slope * v + turb_intercept;
  return constrain(ntu, 0.0, 150.0);
}
// Get TDS value (measured from TDS_PIN)
float getTDS() {
  float v = readVoltage(TDS_PIN, tdsBuf, &tdsPtr);
  if (v < 0) return -1.0;
  float t = getTemp();
  float tds = v * tds_k * (1.0 + 0.02 * (t - 25.0));
  return tds;
}
// Get EC value (calculated from TDS)
float getEC() {
  float tds = getTDS();
  if (tds < 0) return -1.0;
  return tds * 2.0;
}
// ============================================================

// ===================== DISPLAY FUNCTIONS =====================
// Show a value on the LCD
void displayValue(const char* name, float val, const char* unit) {
  wakeLCD();
  lcd.clear();
  lcd.home();
  lcd.print(name);
  lcd.setCursor(0, 1);
  if (val < 0) {
    lcd.print("Error");
    return;
  }
  if (strcmp(name, "pH") == 0) {
    lcd.print("pH: ");
    lcd.print(val, 1);
  } else {
    lcd.print(val, 1);
    lcd.print(" ");
    lcd.print(unit);
  }
}
// Show the menu
void displayMenu() {
  wakeLCD();
  lcd.clear();
  lcd.home();
  lcd.print(">");
  lcd.print(menuItems[currentMenuItem]);
  lcd.setCursor(0, 1);
  if (currentMenuItem < menuItemsCount - 1) {
    lcd.print(" ");
    lcd.print(menuItems[currentMenuItem + 1]);
  } else {
    lcd.print(" ");
    lcd.print(menuItems[0]);
  }
}
// ============================================================

// ===================== FIREBASE UPLOAD =====================
void sendToFirebase() {
  Serial.println("Attempting to send data to Firebase...");
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) {
    Serial.println("Firebase send skipped: WiFi not connected or Firebase not ready.");
    return;
  }
  float temperature = getTemp();
  float ph = getPH();
  float turbidity = getTurbidity();
  float tds = getTDS();
  float ec = (tds < 0) ? -1.0 : tds * 2.0;
  if (temperature < 0 || ph < 0 || turbidity < 0 || tds < 0 || ec < 0) {
    Serial.println("Skipping Firebase send due to sensor error values.");
    return;
  }
  FirebaseJson data;
  data.set("t", String(temperature, 1));
  data.set("p", String(ph, 1));
  data.set("n", String(turbidity, 1));
  data.set("d", String(tds, 1));
  data.set("ec", String(ec, 1));
  data.set("timestamp", Firebase.RTDB.ServerValue.timestamp());
  String databasePath = "/r/" + String(millis() / 1000);
  Serial.print("Sending data to: ");
  Serial.println(databasePath);
  Serial.print("Data: ");
  data.toString(Serial, true);
  Serial.println();
  if (Firebase.setJSON(fbdo, databasePath.c_str(), data)) {
    Serial.println("Realtime Database write successful!");
  } else {
    Serial.print("Realtime Database write FAILED: ");
    Serial.println(fbdo.errorReason());
  }
}
// ============================================================

// ===================== MENU HANDLING =====================
void handleMenu() {
  // Button debounce logic
  if (millis() - lastButtonPress < 200) {
    return;
  }
  bool buttonPressed = false;
  if (!digitalRead(BTN_UP)) {
    currentMenuItem = (currentMenuItem > 0) ? (currentMenuItem - 1) : (menuItemsCount - 1);
    displayMenu();
    buttonPressed = true;
  } else if (!digitalRead(BTN_DOWN)) {
    currentMenuItem = (currentMenuItem < menuItemsCount - 1) ? (currentMenuItem + 1) : 0;
    displayMenu();
    buttonPressed = true;
  } else if (!digitalRead(BTN_SELECT)) {
    buttonPressed = true;
    switch (currentMenuItem) {
      case 0: displayValue("Temp", getTemp(), "C"); break;
      case 1: displayValue("pH", getPH(), ""); break;
      case 2: displayValue("Turbidity", getTurbidity(), "NTU"); break;
      case 3: displayValue("TDS", getTDS(), "ppm"); break;
      case 4: displayValue("EC", getEC(), "uS/cm"); break;
      case 5:
        powerSaveMode = !powerSaveMode;
        lcd.clear();
        lcd.print("Power Save: ");
        lcd.print(powerSaveMode ? "ON" : "OFF");
        delay(1000);
        displayMenu();
        break;
      case 6:
        lcd.clear();
        lcd.print("Sending data...");
        sendToFirebase();
        lcd.clear();
        lcd.print("Data sent!");
        delay(1000);
        displayMenu();
        break;
    }
  } else if (!digitalRead(BTN_BACK)) {
    buttonPressed = true;
    displayMenu();
  }
  if (buttonPressed) {
    lastButtonPress = millis();
  }
}
// ============================================================

void loop() {
  handleMenu();   // Check and handle button presses for the menu
  managePower();  // Handle power saving features (LCD backlight, deep sleep)
  // Automatic data sending every 15 seconds (if not in power save mode)
  if (millis() - lastRead >= 15000) {
    lastRead = millis();
    if (!powerSaveMode) {
      sendToFirebase();
    }
  }
  delay(100);  // Small delay to prevent CPU hogging
} 