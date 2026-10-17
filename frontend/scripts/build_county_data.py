"""Build the static map and county summaries from the repository datasets."""

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "frontend/public/county-data.json"


def rounded_mean(values: pd.Series, digits: int = 1):
    value = pd.to_numeric(values, errors="coerce").mean()
    return round(float(value), digits) if pd.notna(value) else None


def recent_climate_summaries(county_weather: pd.DataFrame):
    """Summarize 2021–2025 weather in each crop's documented season window."""
    windows = {
        "CORN": (5, 1, 9, 30),
        "SOYBEANS": (5, 1, 10, 31),
        "WHEAT": (9, 1, 6, 30),
        "SORGHUM": (6, 1, 10, 31),
    }
    summaries = []
    for crop, (start_month, start_day, end_month, end_day) in windows.items():
        precip_by_year = []
        temp_by_year = []
        for harvest_year in range(2021, 2026):
            start_year = harvest_year - 1 if crop == "WHEAT" else harvest_year
            start = pd.Timestamp(start_year, start_month, start_day)
            end = pd.Timestamp(harvest_year, end_month, end_day)
            season = county_weather[county_weather["date"].between(start, end)]
            if season.empty:
                continue
            precip = pd.to_numeric(season["pcpn_mm"], errors="coerce").sum(min_count=1)
            daily_temp = (pd.to_numeric(season["tmax_c"], errors="coerce") + pd.to_numeric(season["tmin_c"], errors="coerce")) / 2
            temperature = daily_temp.mean()
            if pd.notna(precip):
                precip_by_year.append(float(precip))
            if pd.notna(temperature):
                temp_by_year.append(float(temperature))
        summaries.append({
            "crop": crop,
            "years": min(len(precip_by_year), len(temp_by_year)),
            "mean_precip_mm": round(sum(precip_by_year) / len(precip_by_year), 1) if precip_by_year else None,
            "mean_tavg_c": round(sum(temp_by_year) / len(temp_by_year), 1) if temp_by_year else None,
        })
    return summaries


def main():
    master = pd.read_csv(ROOT / "data/master_dataset.csv", dtype={"fips": str})
    master["fips"] = master["fips"].str.zfill(5)
    ndvi = pd.read_csv(ROOT / "data/processed/modis/modis_ndvi_county.csv", dtype={"fips": str})
    ndvi["fips"] = ndvi["fips"].str.zfill(5)
    drought = pd.read_parquet(ROOT / "data/processed/drought/drought_weekly.parquet")
    drought["fips"] = drought["fips"].astype(str).str.zfill(5)
    drought["map_date"] = pd.to_datetime(drought["map_date"])
    recent_drought = (
        drought[drought["map_date"].dt.year.between(2021, 2025)]
        .groupby("fips")["dsci"]
        .mean()
    )
    soil = pd.read_parquet(ROOT / "data/processed/soil/soil_county.parquet")
    soil["fips"] = soil["fips"].astype(str).str.zfill(5)
    soil_by_fips = soil.set_index("fips")
    weather = pd.read_parquet(ROOT / "data/processed/acis/weather_daily.parquet")
    weather["fips"] = weather["fips"].astype(str).str.zfill(5)
    weather["date"] = pd.to_datetime(weather["date"])
    recent_weather = weather[weather["date"].between("2020-09-01", "2025-10-31")]
    weather_by_fips = {fips: frame for fips, frame in recent_weather.groupby("fips")}
    boundaries = json.loads((ROOT / "data/counties.geojson").read_text())["features"]
    output_features = []

    for feature in boundaries:
        properties = feature["properties"]
        fips = str(feature["id"]).zfill(5)
        rows = master[master["fips"].eq(fips)]
        drought_value = recent_drought.get(fips)
        soil_row = soil_by_fips.loc[fips] if fips in soil_by_fips.index else None
        county_weather = weather_by_fips.get(fips, weather.iloc[0:0])
        summary = {
            **properties,
            "fips": fips,
            "mean_dsci": None,
            "recent_dsci": round(float(drought_value), 1) if pd.notna(drought_value) else None,
            "mean_drought_severity": None,
            "aws_100cm_mm": round(float(soil_row["aws_100cm_mm"]), 2) if soil_row is not None and pd.notna(soil_row["aws_100cm_mm"]) else None,
            "droughty_pct": round(float(soil_row["droughty_pct"]), 2) if soil_row is not None and pd.notna(soil_row["droughty_pct"]) else None,
            "mean_precip_anomaly_pct": None,
            "mean_extreme_heat_days": None,
            "ndvi_mean": None,
            "recent_climate_summaries": recent_climate_summaries(county_weather),
            "crop_summaries": [],
        }

        if not rows.empty:
            for output_name, column in [
                ("mean_dsci", "mean_dsci"),
                ("mean_drought_severity", "max_drought_severity"),
                ("aws_100cm_mm", "aws_100cm_mm"),
                ("droughty_pct", "droughty_pct"),
                ("mean_precip_anomaly_pct", "precip_anomaly_pct"),
                ("mean_extreme_heat_days", "extreme_heat_days"),
            ]:
                value = pd.to_numeric(rows[column], errors="coerce").mean()
                summary[output_name] = round(float(value), 2) if pd.notna(value) else None

            for crop, crop_rows in rows.groupby("crop"):
                reported = crop_rows[crop_rows["yield_status"].eq("reported")].sort_values("year")
                latest = reported.iloc[-1] if not reported.empty else None
                recent = crop_rows[crop_rows["year"].between(2021, 2025)]
                recent_reported = recent[recent["yield_status"].eq("reported")]
                summary["crop_summaries"].append(
                    {
                        "crop": crop,
                        "reported_years": int(len(reported)),
                        "latest_year": int(latest["year"]) if latest is not None else None,
                        "latest_yield": round(float(latest["yield_per_acre"]), 1)
                        if latest is not None and pd.notna(latest["yield_per_acre"])
                        else None,
                        "latest_yield_anomaly_pct": round(float(latest["yield_anomaly_pct"]), 1)
                        if latest is not None and pd.notna(latest["yield_anomaly_pct"])
                        else None,
                        "mean_yield": rounded_mean(reported["yield_per_acre"]),
                        "mean_yield_anomaly_pct": rounded_mean(reported["yield_anomaly_pct"]),
                        "recent_yield_count": int(recent_reported["yield_anomaly_pct"].notna().sum()),
                        "recent_yield_anomaly_pct": rounded_mean(recent_reported["yield_anomaly_pct"]),
                        "recent_dsci": rounded_mean(recent["mean_dsci"]),
                        "mean_precip_mm": rounded_mean(crop_rows["precip_mm"]),
                        "mean_tavg_c": rounded_mean(crop_rows["tavg_c"]),
                        "mean_dsci": rounded_mean(crop_rows["mean_dsci"]),
                    }
                )

        vegetation = ndvi[ndvi["fips"].eq(fips)]
        if not vegetation.empty:
            summary["ndvi_mean"] = rounded_mean(vegetation["ndvi_mean"], 3)

        output_features.append(
            {
                "type": feature["type"],
                "id": fips,
                "properties": summary,
                "geometry": feature["geometry"],
            }
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"type": "FeatureCollection", "features": output_features}, separators=(",", ":")))
    print(f"Wrote {len(output_features)} county features to {OUTPUT}")


if __name__ == "__main__":
    main()
