# Aquasense Technologies ESP32 Water Quality Monitoring System

This code measures water quality parameters and uploads data to Firebase. It supports both WPA2 Enterprise (e.g., Eduroam) and standard WiFi connections.

Developed by **Judas Sithole**

## Overview
Aquasense Technologies' ESP32-based Water Quality Monitoring System is designed to measure and log key water parameters including temperature, pH, turbidity, TDS (Total Dissolved Solids), and EC (Electrical Conductivity). The system features a menu-driven LCD interface, power-saving modes, and real-time data upload to Firebase for remote monitoring.

## Features
- **WiFi WPA2 Enterprise** support (Eduroam/school networks)
- **Firebase Realtime Database** integration
- **Menu-driven LCD interface** with navigation buttons
- **Sensor readings:**
  - Temperature (DS18B20)
  - pH
  - Turbidity
  - TDS (Total Dissolved Solids)
  - EC (Electrical Conductivity, calculated from TDS)
- **Power save mode** and deep sleep
- **Persistent calibration storage** using ESP32 Preferences (NVS)

## Hardware Requirements
- ESP32 Dev Board
- DS18B20 temperature sensor
- pH sensor
- Turbidity sensor
- TDS/EC sensor
- I2C LCD (16x2, address 0x27)
- 4x push buttons (Up, Down, Select, Back)
- Pull-up resistors for buttons (if not using internal)
- Breadboard, jumper wires, power supply

## Pin Connections
| Function      | ESP32 Pin |
|--------------|-----------|
| pH Sensor    | 34        |
| Turbidity    | 35        |
| TDS/EC       | 36        |
| DS18B20      | 4         |
| LCD SDA      | 21        |
| LCD SCL      | 22        |
| Button Up    | 14        |
| Button Down  | 27        |
| Button Select| 26        |
| Button Back  | 25        |

## Wiring Diagram
- Connect sensors to their respective analog pins.
- Connect DS18B20 data to pin 4 (with 4.7k pull-up resistor to 3.3V).
- Connect LCD via I2C (SDA: 21, SCL: 22).
- Connect buttons to digital pins with pull-ups.

## Software Setup
1. **Install Arduino IDE** (or PlatformIO)
2. **Install ESP32 board support**
3. **Install required libraries:**
   - WiFi.h
   - FirebaseESP32.h
   - OneWire.h
   - DallasTemperature.h
   - Wire.h
   - LiquidCrystal_I2C_STEM.h (or LiquidCrystal_I2C.h)
   - Preferences.h (built-in)
4. **Clone or copy this repository**
5. **Configure your credentials in `main.cpp`:**
   - `WIFI_SSID`, `WIFI_IDENTITY`, `WIFI_EAP_PASSWORD`
   - `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`
6. **Upload the code to your ESP32**

## Calibration
- **pH Sensor:** Calibrate using standard buffer solutions (e.g., pH 4, 7, 10). Update `ph_slope` and `ph_intercept` in code or via calibration routine.
- **TDS/EC Sensor:** Calibrate using a standard EC solution (e.g., 1413 μS/cm). Update `tds_k` in code or via calibration routine.
- **Turbidity:** Calibrate using known NTU samples.
- Calibration values are stored in ESP32's NVS using the Preferences library and loaded at startup.

## Usage
- On power-up, the system connects to WiFi and Firebase.
- Use the buttons to navigate the menu and view sensor readings.
- Data is sent to Firebase automatically every 15 seconds (unless in power save mode) or manually via the menu.
- Power save mode dims the LCD and can put the ESP32 into deep sleep after inactivity.

## Data Format (Firebase)
Each data entry is stored as a JSON object with:
- `t`: Temperature (°C)
- `p`: pH
- `n`: Turbidity (NTU)
- `d`: TDS (ppm)
- `ec`: EC (μS/cm)
- `timestamp`: Server timestamp

## Credits
Developed by **Judas Sithole** for Aquasense Technologies.

---
For questions, improvements, or contributions, please contact Judas Sithole or open an issue in this repository. 