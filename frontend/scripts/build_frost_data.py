# Builds frontend/public/frost-data.json for the Frost-Safe Planting Calendar page.
#
# For every county and year (2000-2025) we find the last day before July 1
# when the low temperature was at or below a cold limit. We do this for three
# cold limits, one for each crop group on the page:
#    0 C  (32 F)  soybeans, the most sensitive
#   -2 C  (28 F)  corn
#   -4 C  (24 F)  spring-planted wheat
# The web page uses those days to work out planting dates, so the sliders
# can change them instantly.
#
# This script also picks the starting percentile and safety margin for each
# cold limit. It only uses 2000-2012 (build) and 2013-2018 (check), never
# the 2019-2025 test years.
#
# Run it with:  python frontend/scripts/build_frost_data.py

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
WEATHER_FILE = ROOT / "data/processed/acis/weather_daily.parquet"
COUNTY_FILE = ROOT / "frontend/public/county-data.json"
OUTPUT_FILE = ROOT / "frontend/public/frost-data.json"

YEARS = list(range(2000, 2026))
COLD_LIMITS = [0, -2, -4]  # degrees C
PERCENTILES = [75, 80, 85, 90, 95, 100]
MARGINS = [0, 2, 4, 7, 10, 14]
GOAL = 0.10  # frost after planting in no more than 1 of 10 county-years


def find_last_frosts(weather, cold_limit):
    """Return a table: one row per county, one column per year, value = day of year of the last frost."""
    # Keep only frost days (at or below the cold limit) before July
    frost = weather[(weather["tmin_c"] <= cold_limit) & (weather["month"] <= 6) & (weather["year"] >= 2000)].copy()

    # Day of year. In leap years, subtract 1 after February so dates line up.
    frost["day"] = frost["date"].dt.dayofyear
    is_late_leap_day = frost["date"].dt.is_leap_year & (frost["month"] >= 3)
    frost.loc[is_late_leap_day, "day"] = frost.loc[is_late_leap_day, "day"] - 1

    # The last frost of each county and year
    table = frost.groupby(["fips", "year"])["day"].max().unstack("year")

    # Make sure every county is in the table, even ones with no frost at all
    all_counties = sorted(weather["fips"].unique())
    return table.reindex(index=all_counties, columns=YEARS)


def planting_days(frost, build_years, percentile, margin):
    """Planting day for every county. Years with no frost count as day 0."""
    columns = [YEARS.index(y) for y in build_years]
    days = np.nan_to_num(frost[:, columns], nan=0)
    base = np.percentile(days, percentile, axis=1, method="higher")
    return base + margin


def frost_after_rate(frost, check_years, plant_days):
    """Share of county-years where the last frost came after the planting day."""
    columns = [YEARS.index(y) for y in check_years]
    days = np.nan_to_num(frost[:, columns], nan=0)
    return float((days > plant_days[:, None]).mean())


def pick_setting(frost):
    """Try every percentile and margin: build on 2000-2012, check on 2013-2018."""
    options = []
    for percentile in PERCENTILES:
        for margin in MARGINS:
            plant = planting_days(frost, range(2000, 2013), percentile, margin)
            rate = frost_after_rate(frost, range(2013, 2019), plant)
            options.append({"percentile": percentile, "margin": margin, "average_day": float(plant.mean()), "rate": rate})

    # Keep the earliest planting date that still meets the goal
    good = [o for o in options if o["rate"] <= GOAL]
    if good:
        return min(good, key=lambda o: o["average_day"])
    # If nothing meets the goal, use the safest option
    return min(options, key=lambda o: o["rate"])


def main():
    weather = pd.read_parquet(WEATHER_FILE, columns=["fips", "date", "tmin_c"])
    weather["year"] = weather["date"].dt.year
    weather["month"] = weather["date"].dt.month

    last_frost = {}  # cold limit -> table of last frost days
    defaults = {}    # cold limit -> chosen percentile and margin
    for limit in COLD_LIMITS:
        table = find_last_frosts(weather, limit)
        last_frost[str(limit)] = table
        best = pick_setting(table.to_numpy(dtype=float))
        defaults[str(limit)] = {"percentile": best["percentile"], "margin": best["margin"]}
        print("Cold limit", limit, "C -> chosen setting:", best)

    # County names come from the county file the website already uses
    names = {}
    with open(COUNTY_FILE) as f:
        for feature in json.load(f)["features"]:
            props = feature["properties"]
            names[props["fips"]] = props

    counties = []
    for fips in last_frost["0"].index:
        info = names.get(fips, {"county_name": fips, "state_alpha": ""})
        by_limit = {}
        for limit, table in last_frost.items():
            row = table.loc[fips].to_numpy(dtype=float)
            # -1 means no frost at or below the cold limit before July that year
            by_limit[limit] = [-1 if np.isnan(day) else int(day) for day in row]
        counties.append({"fips": fips, "name": info["county_name"], "state": info["state_alpha"], "lastFrost": by_limit})

    output = {
        "years": YEARS,
        "defaults": defaults,
        "selectionNote": "The starting percentile and margin were picked by building on 2000-2012 and checking on 2013-2018. The 2019-2025 test years were never used to choose them. Rule: the earliest average planting date whose 2013-2018 frost-after-planting rate was 10% or less.",
        "counties": counties,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, separators=(",", ":"))
    print("Wrote", OUTPUT_FILE, "with", len(counties), "counties")


main()
