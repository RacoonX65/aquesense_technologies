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

---

## Links
- [Live Demo](https://vercel.com/developingcourses6501s-projects/v0-version17finaldashboard)
