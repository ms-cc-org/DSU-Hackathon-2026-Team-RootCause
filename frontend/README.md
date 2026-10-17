# Fieldwise Next.js frontend

This App Router frontend shows state-level county maps and county reports. The county-page prediction form uses the crop-aware XGBoost model trained from `data/master_dataset.csv`; it sends growing-season weather, drought, and soil inputs to a FastAPI service and receives predicted yield in bushels per acre plus a crop-relative risk label.

The county data and map interactions work without starting the model service. The API is needed only for the live prediction form.

## Run the model and frontend locally

Requires Python 3.10–3.13 and Node.js 20.9+. On macOS, XGBoost also needs Apple's OpenMP runtime:

```bash
brew install libomp
```

In terminal 1, from the repository root, create a Python environment, install model dependencies, train the model once, and start the API:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r model_api/requirements.txt
python -m model_api.train_model
python -m uvicorn model_api.api:app --reload --port 8000
```

The trainer reads `data/master_dataset.csv` and writes the ignored artifact to `model_api/artifacts/yield_model.joblib`. It prints holdout RMSE and R². The API listens at `http://localhost:8000` and accepts `POST /predict-yield`.

In terminal 2:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), open a county, and use **Prediction tool**. The form defaults to that county's available crop, weather, and soil summaries; GDD is editable because it is not currently included in the county summary data. Restart `npm run dev` after changing `.env.local`.

## Run the notebook in Google Colab

Push the updated project to GitHub first so the `model_api/` files are available to Colab. Then open `notebooks/eva.ipynb` in Colab (upload it or open the repository copy) and run its setup cell. It clones this repo into the Colab runtime, installs `model_api/requirements.txt`, and trains the same model. To call that Colab-hosted API from your local frontend, add an `NGROK_AUTHTOKEN` secret in Colab's Secrets panel, enable notebook access to it, and run the API cell. Copy its printed `/predict-yield` URL into `frontend/.env.local`, then restart Next.js. The URL lasts only for the active Colab runtime. The notebook does not store the token.

## Model notes

The notebook's original prototype trained on rows from multiple crops without giving the model a crop feature, so it mixed crop yield scales. The shared trainer uses crop as a one-hot categorical feature, evaluates a held-out split, then fits the saved inference model on all complete records. Low/Medium/High relative yield risk is based on each crop's training-set 25th and 75th yield percentiles. This is a baseline predictive estimate, not a causal estimate of conservation-practice effects.

Refresh the static county map data separately with `python frontend/scripts/build_county_data.py` after rebuilding source datasets.
