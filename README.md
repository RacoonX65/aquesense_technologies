<<<<<<< HEAD
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
=======
# Water Quality Monitoring Dashboard

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/developingcourses6501s-projects/v0-version17finaldashboard)

## Overview

This is a modern, full-stack web application for real-time water quality monitoring, analysis, and prediction. It features live dashboards, historical data exploration, machine learning predictions, and an AI assistant for actionable insights. Built for IoT sensor networks, it empowers users to monitor, analyze, and improve water quality using advanced analytics and user-friendly interfaces.

---

## Features

- **Real-Time Dashboard:** Live visualization of pH, TDS, temperature, conductivity, turbidity, anomaly scores, and classification codes from IoT sensors via Firebase Realtime Database.
- **Historical Data Explorer:** Interactive charts and exportable data for any date range, with filtering by parameter.
- **ML Predictions:** On-device LSTM and statistical models for forecasting water quality trends and detecting anomalies.
- **AI Assistant:** Chat-based assistant provides personalized, data-driven water quality analysis and recommendations.
- **Admin Panel:** User management, statistics, and system controls for administrators.
- **Authentication:** Secure login, signup, and password reset via Supabase.
- **Responsive UI:** Beautiful, mobile-friendly design using Tailwind CSS and Radix UI components.
- **Environment Management:** Easy configuration of environment variables for deployment.

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, PostCSS, Radix UI
- **Realtime Data:** Firebase Realtime Database
- **Authentication & Profiles:** Supabase
- **Machine Learning:** TensorFlow.js (LSTM, anomaly detection, classification)
- **Charts:** Recharts
- **Deployment:** Vercel

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <your-fork-url>
cd version17finaldashboard\ (1)
```

### 2. Install Dependencies
```bash
pnpm install
# or
yarn install
# or
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root with your Firebase and Supabase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Run the Development Server
```bash
pnpm dev
# or
yarn dev
# or
npm run dev
```

Visit https://aquesensetechnologies.vercel.app/ to view the app.

---

## Main Scripts
- `pnpm dev` — Start the development server
- `pnpm build` — Build for production
- `pnpm start` — Start the production server
- `pnpm lint` — Lint the codebase

---

## Project Structure
- `app/` — Next.js app directory (pages, layouts, routes)
- `components/` — UI and dashboard components
- `lib/` — Data, ML, and utility libraries
- `hooks/` — Custom React hooks
- `public/` — Static assets
- `styles/` — Global styles

---

## Security & Rules
- **Firebase:** Includes both public and authenticated rules (see `firebase-rules.json` and `firebase-rules-authenticated.json`).
- **Supabase:** Used for secure authentication and user profile management.

---

## Credits

Developed and maintained by **Judas Sithole**.

---

## License

This project is for educational and demonstration purposes. For commercial or production use, please contact the author.

>>>>>>> f5003e506cece76e7c40e8a55d13eb97436dbb98
