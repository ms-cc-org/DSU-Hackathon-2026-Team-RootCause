"""Train the crop-aware yield model used by the local FastAPI service."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parents[1]
FEATURES = [
    "precip_mm",
    "precip_anomaly_pct",
    "tavg_c",
    "extreme_heat_days",
    "gdd",
    "mean_dsci",
    "aws_100cm_mm",
    "droughty_pct",
]
TARGET = "yield_per_acre"


def create_model() -> Pipeline:
    preprocessor = ColumnTransformer(
        [("crop", OneHotEncoder(handle_unknown="ignore"), ["crop"])],
        remainder="passthrough",
    )
    return Pipeline(
        [
            ("features", preprocessor),
            (
                "regressor",
                XGBRegressor(
                    n_estimators=100,
                    max_depth=5,
                    learning_rate=0.1,
                    random_state=42,
                    objective="reg:squarederror",
                    n_jobs=2,
                ),
            ),
        ]
    )


def train(data_path: Path, artifact_path: Path) -> None:
    import joblib

    data = pd.read_csv(data_path)
    data["crop"] = data["crop"].astype(str).str.upper()
    usable = data.dropna(subset=["crop", TARGET, *FEATURES]).copy()
    usable = usable[usable[TARGET] > 0]
    if len(usable) < 20:
        raise ValueError(f"Only {len(usable)} complete yield rows; at least 20 are needed.")

    x = usable[["crop", *FEATURES]]
    y = usable[TARGET].astype(float)
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )
    evaluator = create_model().fit(x_train, y_train)
    prediction = evaluator.predict(x_test)
    print(f"Holdout rows: {len(y_test)}")
    print(f"Holdout RMSE: {mean_squared_error(y_test, prediction) ** 0.5:.2f} bu/ac")
    print(f"Holdout R²: {r2_score(y_test, prediction):.4f}")

    model = create_model().fit(x, y)
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "features": FEATURES,
            "crop_yield_quantiles": {
                crop: {
                    "q25": float(rows.quantile(0.25)),
                    "q75": float(rows.quantile(0.75)),
                }
                for crop, rows in usable.groupby("crop")[TARGET]
            },
        },
        artifact_path,
    )
    print(f"Saved model: {artifact_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=ROOT / "data/master_dataset.csv")
    parser.add_argument(
        "--output", type=Path, default=ROOT / "model_api/artifacts/yield_model.joblib"
    )
    args = parser.parse_args()
    train(args.data, args.output)


if __name__ == "__main__":
    main()
