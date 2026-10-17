# Fieldwise Next.js frontend

This is a standalone Next.js App Router frontend for the evaporation and drought prediction prompt. It sends `county_name`, `max_temp`, `min_temp`, `precip_anomaly`, `aws_100cm_mm`, and `NDVI` to a FastAPI endpoint and expects `predicted_evaporation_demand` plus a `risk_category` of `Low`, `Medium`, or `High` in the JSON response.

The state rail links Nebraska, Iowa, California, and Delaware. Each state view draws clickable county boundaries from `public/county-data.json`; the default map shows 2021–2025 drought intensity from the weekly U.S. Drought Monitor data, which is available across the county boundaries. You can also color by a crop outlook (60% recent yield-anomaly risk plus 40% drought pressure), recent yield anomaly, or soil water capacity. Crop-based shading requires at least 3 valid yield-anomaly reports in 2021–2025; counties below that coverage threshold are hatched as no data. County rankings follow the selected map measure. The legend is below the map.

County report pages show growing-season, soil, MODIS, and yield summaries from the repository's county dataset. Recent crop-season precipitation and temperature summaries are computed from the daily weather panel for all boundary counties, and soil values are joined directly from the county soil table. When the selected county has no reported yield for a crop, the page explains the gap and surfaces available climate and soil metrics rather than presenting empty crop cards. The county data asset includes all 253 boundary counties, with recent drought data from the weekly drought panel and crop records from the master dataset. Iowa uses the dataset's `IA` state code.

To refresh the static map asset after rebuilding the source datasets, run `python frontend/scripts/build_county_data.py` from the repository root. The crop and drought blend is an exploratory county signal, not a validated forecast; only the county report page can receive a model forecast overlay from the live API.

## Run locally

Requires Node.js 20.9 or newer.

```bash
cd frontend
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_PREDICTION_API_URL` in `.env.local` to the current public `/predict-evaporation` URL for the FastAPI service, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart the dev server after changing `.env.local`. The browser calls the endpoint directly, so the API must allow the frontend origin through CORS. Do not put private credentials in a `NEXT_PUBLIC_` variable; Next.js exposes it to the browser.

The live API is not included in this repository. When it is unavailable, the dashboard shows a setup or connection error instead of fabricating a prediction. Its request payload and expected response follow the supplied frontend specification.
