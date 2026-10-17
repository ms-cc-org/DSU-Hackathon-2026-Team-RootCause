"""Local FastAPI inference endpoint for the notebook's crop yield model."""

from __future__ import annotations

import os
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = Path(os.getenv("YIELD_MODEL_PATH", ROOT / "model_api/artifacts/yield_model.joblib"))

app = FastAPI(title="Fieldwise Crop Yield Predictor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictionPayload(BaseModel):
    county_name: str = Field(min_length=1, max_length=120)
    crop: str = Field(min_length=1, max_length=40)
    precip_mm: float = Field(ge=0, le=10000)
    precip_anomaly_pct: float = Field(ge=-100, le=1000)
    tavg_c: float = Field(ge=-50, le=60)
    extreme_heat_days: float = Field(ge=0, le=366)
    gdd: float = Field(ge=0, le=10000)
    mean_dsci: float = Field(ge=0, le=500)
    aws_100cm_mm: float = Field(ge=0, le=2000)
    droughty_pct: float = Field(ge=0, le=100)


def load_artifact():
    if not ARTIFACT.exists():
        raise RuntimeError(
            f"Model artifact not found at {ARTIFACT}. Run: python -m model_api.train_model"
        )
    return joblib.load(ARTIFACT)


try:
    artifact = load_artifact()
except RuntimeError as error:
    artifact = None
    startup_error = str(error)
else:
    startup_error = ""


@app.get("/")
def health():
    return {"status": "ready" if artifact is not None else "model_missing", "model": "crop-yield-xgboost"}


@app.post("/predict-yield")
def predict_yield(payload: PredictionPayload):
    if artifact is None:
        raise HTTPException(status_code=503, detail=startup_error)
    crop = payload.crop.upper()
    values = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    values["crop"] = crop
    features = artifact["features"]
    frame = pd.DataFrame([{key: values[key] for key in ["crop", *features]}])
    try:
        predicted = max(0.0, float(artifact["model"].predict(frame)[0]))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {error}") from error

    quantiles = artifact["crop_yield_quantiles"].get(crop)
    if quantiles is None:
        raise HTTPException(status_code=422, detail=f"No training records are available for crop {crop}.")
    risk = "High" if predicted < quantiles["q25"] else "Low" if predicted >= quantiles["q75"] else "Medium"
    return {
        "county_name": payload.county_name,
        "crop": crop,
        "predicted_yield_per_acre": round(predicted, 2),
        "yield_unit": "bu/ac",
        "risk_category": risk,
    }
