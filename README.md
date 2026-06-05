#  FarmGuard AI

A web application that helps farmers analyse their land by uploading a farm photo and receiving an AI-powered report on tree count, canopy coverage, tree health, and actionable recommendations.

---

## Overview

FarmGuard AI connects a React frontend to a Node.js backend, which forwards farm images and metadata to the [WeatherAI Trees & Forestry API](https://weather-ai.co). The API uses computer vision and AI to analyse the image and return a detailed farm report.

### What it does

- Accepts a farm photo (drag-and-drop or file picker)
- Collects the farm's location, county, and size in acres
- Sends the data to the WeatherAI API for analysis
- Displays results: tree count, canopy cover, trees per acre, tree health breakdown, observations, and recommendations
- Gracefully handles low-confidence or failed analyses with clear user feedback

---

## Screenshots

### Upload Form
![FarmGuard AI upload form showing photo picker, location, county and farm size fields](./src/assets/upload.png)

### Analysis Results
![FarmGuard AI results screen showing farm stats, low confidence warning, and tree health breakdown](./src/assets/analysis.png)

---

## Project Structure

```
farmguard-ai/
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── API/
│   │   │   └── farmApi.ts     # API call to backend
│   │   ├── App.tsx            # Main app component
│   │   ├── app.css            # All styles
│   │   └── main.tsx
│   ├── .env                   # VITE_API_URL
│   └── vite.config.ts
│
└── backend/                   # Node.js + Express
    ├── config/
    │   └── env.js             # Environment variable config
    ├── controllers/
    │   └── farmController.js  # analyzeFarm, healthCheck
    ├── utils/
    │   └── weatherAiClient.js # Axios instance for WeatherAI
    ├── routes/
    │   └── farm.js
    ├── .env                   # WEATHER_AI_API_KEY, etc.
    └── server.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A WeatherAI API key — sign up at [weather-ai.co](https://weather-ai.co)

---

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
WEATHER_AI_API_KEY=your_api_key_here
WEATHER_AI_BASE_URL=https://weather-ai.co
WEATHER_AI_TREES_ENDPOINT=/trees/analyze
ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE_MB=10
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif
```

Start the server:

```bash
npm run dev
```

The backend will be running at `http://localhost:5000`.

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## API Reference

### `POST /api/farm/analyze`

Accepts a multipart form and forwards it to WeatherAI.

**Form fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File | ✅ | Farm photo (JPEG, PNG, WebP, GIF) |
| `location` | string | ✅ | Town or village name (e.g. `Moiben`) |
| `county` | string | ❌ | County name (e.g. `Uasin Gishu`) |
| `land_acres` | number | ❌ | Farm size in acres |
| `farmer_id` | string | ❌ | Optional farmer identifier |
| `latitude` | number | ❌ | GPS latitude |
| `longitude` | number | ❌ | GPS longitude |

**Success response:**

```json
{
  "success": true,
  "message": "Farm image analysed successfully",
  "data": {
    "analysis_id": "h52eGQVRDXhjjoFa1dT8",
    "timestamp": "2026-06-05T05:41:42.908Z",
    "location": "Moiben",
    "county": "Uasin Gishu",
    "land_acres": 3,
    "total_tree_count": 142,
    "tree_density_per_acre": 47,
    "confidence_score": 0.85,
    "canopy_coverage_pct": 38,
    "tree_health": {
      "healthy": 120,
      "needs_care": 18,
      "needs_replacement": 4
    },
    "low_confidence": false,
    "tree_species_guess": "Eucalyptus",
    "observations": ["Dense canopy in northern section"],
    "recommendations": ["Consider thinning in the northern block"]
  }
}
```

### `GET /api/farm/health`

Returns the service status and confirms the WeatherAI API key is configured.

---

## Frontend API Module

All API calls are made through `src/API/farmApi.ts`:

```ts
import analyseFarm from './API/farmApi';

const data = await analyseFarm(image, location, county, acres);
```

The `BASE_URL` is read from the `VITE_API_URL` environment variable, falling back to `http://localhost:5000/api` in development.

---

## How Analysis Results Are Handled

- **Successful analysis** — displays stats grid, health bar, observations, and recommendations.
- **Low confidence / failed analysis** — when the API returns `low_confidence: true` and `total_tree_count: 0`, the app shows a clear error message asking the user to retry with a better photo, rather than displaying misleading zeros or null values.

This matters for farmers making real decisions — fake or empty data is never shown as if it were real.

---

## Known Limitations

- Analysis quality depends heavily on image quality. Overhead/aerial photos produce the best results.
- The WeatherAI API requires a configured Gemini API key on their server for full AI analysis. If their Gemini key is missing, the API returns nulls with `low_confidence: true` — this is a WeatherAI server-side issue, not a bug in this app.
- Maximum supported image size is 10 MB by default (configurable via `MAX_FILE_SIZE_MB`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Plain CSS (no framework) |
| Backend | Node.js, Express |
| HTTP client | Axios (backend → WeatherAI) |
| AI / CV | WeatherAI Trees & Forestry API |
| Image upload | Multer |

---

## Environment Variables Summary

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEATHER_AI_API_KEY` | ✅ | — | Your WeatherAI API key |
| `WEATHER_AI_BASE_URL` | ❌ | `https://weather-ai.co` | WeatherAI base URL |
| `WEATHER_AI_TREES_ENDPOINT` | ❌ | `/trees/analyze` | Trees API endpoint |
| `PORT` | ❌ | `5000` | Server port |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:3000` | CORS origins |
| `MAX_FILE_SIZE_MB` | ❌ | `10` | Max upload size |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | ❌ | `http://localhost:5000/api` | Backend API base URL |

---

## License

MIT