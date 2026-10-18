# 🌱 FieldWise: End-to-End Agricultural Resilience

### Spring Planting & Summer Drought Intelligence Across California, Delaware, Iowa, and Nebraska

## 📖 Overview

FieldWise is an interactive agricultural decision-support platform designed to help agricultural professionals explore historical weather, drought, soil, and crop data. By making agricultural data easier to access, compare, and understand, FieldWise supports informed decisions about county-level drought vulnerability, spring planting dates, and evaporation rates.

The platform focuses on three key areas: summer drought analysis, spring frost-risk assessment, and AI-powered evaporation-rate prediction.

## ❗ Problem Statement

Agricultural risks vary by location and season. Differences in rainfall, temperature, soil conditions, and frost exposure can affect crop production, making it difficult for agricultural professionals to identify risks and make informed decisions.

Historical agricultural and weather data can help professionals better understand these challenges, but accessing and comparing information across locations can be difficult. FieldWise aims to make this information more accessible through an interactive platform.

## 💡 Our Solution

FieldWise provides an interactive platform for exploring historical agricultural and weather data through two main features, supported by AI-powered evaporation prediction.

### 🗺️ County Explorer

The County Explorer helps users compare agricultural conditions across counties by exploring:

- Drought conditions and vulnerability.
- Soil characteristics.
- Crop-yield trends.

These comparisons can help agricultural and conservation officers identify areas that may require additional assessment, attention, or conservation support.

### 🌡️ Spring Frost Calendar

The Spring Frost Calendar uses historical temperature data to help identify planting dates with lower historical frost risk.

This feature is designed to help extension agronomists provide farmers with more informed planting guidance based on historical temperature patterns.

### 🤖 AI-Powered Evaporation Prediction

FieldWise incorporates AI-based evaporation-rate prediction to estimate evaporation rates using the data provided through the hackathon.

This feature aims to provide additional insight into environmental conditions that may affect agricultural water availability. Evaporation predictions complement the platform's weather and drought analysis to support a better understanding of agricultural conditions.

## 🎯 Target Users

### Primary Users: Agricultural and Conservation Officers

Professionals who need to compare county-level drought vulnerability to help prioritize further assessment and conservation planning.

**Primary need:** Understand how drought conditions, soil characteristics, and crop-yield trends vary across counties.

### Secondary Users: Extension Agronomists

Professionals who help farmers evaluate planting dates and understand seasonal frost risks.

**Primary need:** Identify planting dates with lower historical frost risk to provide farmers with more informed planting guidance.

## 👤 User Stories

### Summer Drought

As an agricultural or conservation officer, I want to compare drought conditions, soil characteristics, and crop-yield trends across counties so I can identify areas that may need additional attention or conservation support.

### Spring Frost

As an extension agronomist, I want to identify planting dates with lower historical frost risk so I can provide farmers with more informed planting guidance.

## 🔍 Main Research Question

**How can historical agricultural and weather data help professionals understand county-level drought risks and make more informed planting decisions?**

This question guides the development of FieldWise and its agricultural analysis and prediction features.

## 🎯 Project Objective

The objective of FieldWise is to make agricultural data more accessible and understandable so agricultural professionals can better evaluate seasonal risks and make informed decisions about drought vulnerability, conservation planning, spring planting dates, and evaporation rates.

## 🗺️ Geographic Coverage

FieldWise focuses on four U.S. states:

- **California (CA)**
- **Delaware (DE)**
- **Iowa (IA)**
- **Nebraska (NE)**

This geographic scope allows users to explore agricultural and weather conditions across different regions.

## 🛠️ Technology Stack

### Programming Languages and Frameworks

- **Next.js** — Framework used to build the web application and interactive user interface.
- **Python** — Used for data processing, analysis, and evaporation-rate prediction.

### Development Tools

- **OpenAI Codex** — AI-assisted coding and development.
- **Visual Studio Code (VS Code)** — Code editor used for project development.

## 📊 Data Sources

FieldWise uses datasets provided by the hackathon organizers to support its agricultural analysis and prediction features.

The provided data supports:

- **Drought Analysis:** Exploring drought conditions, soil characteristics, and crop-yield trends across counties.
- **Spring Frost Analysis:** Using historical temperature data to explore frost risk and potential planting dates.
- **Evaporation Prediction:** Supporting AI-based evaporation-rate estimates.

Specific dataset names, file formats, and original sources can be documented once confirmed from the hackathon materials.

## 🚀 Key Features

| Feature | Description |
|---|---|
| County Explorer | Compare drought conditions, soil characteristics, and crop-yield trends across counties. |
| Spring Frost Calendar | Explore historical temperature data to identify planting dates with lower frost risk. |
| AI Evaporation Prediction | Estimate evaporation rates using the provided data. |
| Historical Data Exploration | Make agricultural and weather information easier to access and interpret. |
| County-Level Comparison | Help identify areas that may need further drought assessment or conservation planning. |

## 👥 Project Team

This project was developed collaboratively by:

- Amari Majette
- Brianna Snell
- Habibah Kashmiri
- Hafsah Kashmiri
- Ebonee Kent

## 📌 Project Status

FieldWise brings together agricultural data exploration, seasonal frost-risk assessment, and AI-powered evaporation prediction to support agricultural resilience.

Additional documentation about installation, usage, model implementation, and evaluation can be added as the project develops.

---

*FieldWise — Making agricultural data more accessible for informed planting decisions and agricultural resilience.*

User: Extension Agronomist and Conservation Officer
problem statement: 

---

## What you'll do

1. **Pick a user and a decision.** Choose one of the directions below or bring your own. By checkpoint 1 (Saturday afternoon), name your user and the decision your tool helps them make.
2. **Find the evidence.** Use the data to answer the question behind that decision. Test your answer on years you didn't use to build it.
3. **Build a tool for your user.** It shows them the evidence and what to decide. It can be a **Streamlit app** (a starter app is included), a **Jupyter notebook** (a starter notebook is included), or another **Python app**. Your user should be able to use it without reading your code.
4. **Present it.** About 5 minutes of pitch and live demo, then 3 minutes of judges' questions. Explain who your user is, what they decide, what evidence you used, and how you know it works.

### Minimum deliverable

Every team must finish:
- one named user and decision;
- one piece of evidence, checked on years not used to build it (or an honest statement of why it can't be);
- a tool the user can use;
- a 5-minute pitch with a live demo.

You don't need to complete every item in the **Success looks like** column below. That column describes a strong finished project; the minimum deliverable is what this hackathon requires. Each direction's own minimum is listed under the table.

---

## Choose a direction

Each direction names a user, their decision, and what success means. Pick one, combine two, or bring your own idea. Combining two only works if each stays at its minimum.

| Direction | Who decides | Their decision | Success looks like | Start → Go further |
|---|---|---|---|---|
| **Crop Loss Early Warning** | Crop insurance office | Which counties to inspect first, on August 1 | Flags more real losses than "all counties in severe drought" (or shows why it can't) | **Start:** severe-drought counties on the last weekly map before August 1 → **Further:** a model with weather up to August 1 from the daily panel (not the master's season totals) |
| **Drought Assistance Targeting** | State drought program | Which counties get help first, and what triggers it | A 2-minute county report card; a 2000–2015 ranking that beats chance on 2016–2025 | **Start:** report card from the drought, yield and soil fields (don't rank by average `yield_anomaly_pct`) → **Further:** test trigger rules on the weekly panel |
| **Heat-Stress Advisory** | Extension crop specialist | When to warn corn and soybean growers about heat | A heat rule that beats "days at 35 °C or hotter" on unseen years | **Start:** yields in years with many vs few `extreme_heat_days` → **Further:** your own heat measures from the daily panel, allowing for drought |
| **Soil and Crop Resilience Planning** | Soil conservation office | Where soil programs cut drought losses most | A priority map and a soil-effect estimate with a range ("no clear effect" counts) | **Start:** drought-year losses for high vs low soil water storage → **Further:** model drought × soil; check by state and time period |
| **Grain Supply Outlook** | Iowa ethanol plant | Whether to buy corn from outside its area | A production estimate with a range that beats the trend | **Start:** yield × harvested acres for counties that report every year → **Further:** add weather and drought; check your range |
| **Frost-Safe Planting Calendar** | Extension agronomist | The earliest safe planting date per county | A date built on 2000–2018 that sees frost after it in no more than 1 in 10 years of 2019–2025 | **Start:** each county's last spring day at or below 0 °C (daily panel), then a high percentile → **Further:** a safety margin, a map, fall frost (county averages miss low-lying fields) |
| **Drought Category Reality Check** | State drought task force | Whether a drought level such as D3 should mean the same in Iowa and Nebraska | A drought level → yield loss table from 2000–2012 that predicts 2013–2025 within about 4 points (Iowa, Nebraska corn and soybeans) | **Start:** average `yield_anomaly_pct` by `max_drought_severity` (4 = D3), state and crop → **Further:** drought timing from the weekly panel; split by `irrigated_share` |
| **AgriAdvisor** *(optional, built on another direction)* | County extension agent | How to answer a farmer's question | Right answers on hand-checked questions; "the data can't answer that" when it can't | **Start:** Python functions that answer questions and show the rows behind them → **Further:** let an AI model call them (needs your own API key or a local model) |

**Minimum to finish, per direction:**

| Direction | Minimum to finish |
|---|---|
| Crop Loss Early Warning | The D2+ watch list for any chosen year (last weekly map before August 1), its hit rate over 2000–2025, and a tool that shows the list with the reason for each county. Needs date handling on the weekly panel: intermediate. |
| Drought Assistance Targeting | The county report card (drought frequency, drought-year losses, soil) for any county, plus the 2000–2015 → 2016–2025 ranking check. |
| Heat-Stress Advisory | One heat rule chosen on 2000–2018 and checked on 2019–2025 (hit rate and false-alarm rate), compared with the master's `extreme_heat_days`, shown in a simple tool. |
| Soil and Crop Resilience Planning | A map of soil water storage with priority counties, and one comparison of drought-year losses between high- and low-storage counties with a range (for example a bootstrap), stating which counties and years it covers. |
| Grain Supply Outlook | Production for a group of counties that report every year, a trend-only estimate with a range from past trend errors, and a check on held-out years of how often the real value fell inside the range. |
| Frost-Safe Planting Calendar | A planting date per county built on 2000–2018, its frost rate on 2019–2025, a map, and the safety margin with its trade-off. |
| Drought Category Reality Check | The table, its 2013–2025 check, and a one-sentence recommendation, shown in a simple tool. |
| AgriAdvisor | Only on top of another direction's minimum. 3–5 Python functions that answer common questions from the data and show the rows behind each answer, and a set of hand-checked test questions, including some the data can't answer. No language model needed. |
| Your own idea | The four items in the minimum deliverable above. |

---

## Team setup and submission

### 1. Get your team's repository

Each team works in its own public GitHub repository under the official DSU Hackathon organization ([ms-cc-org](https://github.com/ms-cc-org)), made from the [starter project](https://github.com/ms-cc-org/DSU-Hackathon). Use the team repository the organizers give you, for example `DSU-Hackathon-Team-alpha`; don't work directly in the shared starter repository. [Get set up](#get-set-up) shows how to download it.

Your team repository already has the starter files. Add your code, notebooks, documentation and other deliverables to it. It is public, so never commit passwords or API keys.

### 2. Minimum deliverable

Complete the [minimum deliverable](#minimum-deliverable). Make sure your repository contains the work needed to demonstrate it.

### 3. Submit your work

**Deadline: Sunday, October 18, 2026, 12:00 PM (noon) Eastern Time.**

Submit by filling in the [**submission form**](https://github.com/ms-cc-org/DSU-Hackathon/issues/new?template=submission.yml) (a GitHub issue on the starter repository). One submission per team. It asks for:
- your team name;
- the names and GitHub usernames of all team members;
- the URL of your team's repository;
- the full commit SHA of the exact version you want judged.

To find your final commit SHA: open your team's repository on GitHub, open the commit history, select the commit with your final submission, and copy the full SHA (40 characters). Check that this commit contains your completed minimum deliverable.

### 4. After submitting

The organizers save a copy of the submitted commit for judging and records. The SHA identifies the version that is judged; changes pushed after you submit are not included. Keep your repository available until the organizers confirm your submission was recorded.

### 5. Final checklist

- You are working in your team's repository.
- Your team has completed the minimum deliverable.
- All team members are listed in the submission.
- Your repository URL is correct.
- Your final commit SHA is correct.
- Your submission is in before the deadline.

---

## What we provide

### The master dataset

One table where **each row is one county, one crop, one year**. For example, the row for Polk County, Iowa, corn, 2012 holds that year's corn yield (149.1 bushels per acre, 15.5% below the county's normal), the drought and weather during that growing season, and the county's soil.

- **4 states:** California (irrigated), Iowa (rainfed), Nebraska (part irrigated), Delaware (rainfed, small)
- **4 crops:** corn grain, soybeans, winter wheat, grain sorghum
- **26 years:** 2000–2025
- **21 columns** of yield, weather, drought and soil, in 17,056 rows

Only 68% of rows have a reported yield. The well-covered part is **Iowa and Nebraska corn and soybeans**, plus Nebraska wheat. California, Delaware, sorghum, and Iowa and Delaware wheat are thin. Check the coverage table in the data dictionary before you pick a project.

### County codes (FIPS)

Every county has a 5-digit code called a **FIPS code**: `19153` is Polk County, Iowa, and `06001` is Alameda County, California. Every file uses it, so it's how you combine tables: matching the FIPS code (plus the year, when both tables have one) lines up the rows for the same county.

Keep it as text. If it's read as a number, `06001` becomes `6001` and California rows stop matching anything, with no error.

### More detailed data

- **Daily weather** (temperature and rain per county per day), **weekly drought maps**, **soil per county**, and the raw **NASS crop records**. Use these to build your own measures, for example heat in July only.
- **Satellite greenness (MODIS)**: one value per county per year, matched to the master by county and year.
- **Irrigation**: the share of each crop that was irrigated and irrigated vs. dryland yields, mostly for Nebraska 2000–2018, matched by county, crop and year.
- **County boundaries** for maps.

Every column, every gap and every known limitation is explained in the [**data dictionary**](data/data_dictionary.md). Read it before you start.

---

## Get set up

You need Python, the code and data from this repo, and the Python packages the code uses. The install downloads about 200 MB and uses about 900 MB of disk, so do it before the event, not on event wifi.

### 1. Check your Python

You need **Python 3.11 or newer** (3.12 recommended). In a terminal, run `python3 --version` (Windows: `py --version`). If it's older, install 3.12 from [python.org](https://www.python.org/downloads/). The `python3` that comes with macOS is 3.9 and won't work.

### 2. Download the repo and install the packages

These commands copy your team's repository (see [Team setup and submission](#team-setup-and-submission)) to your computer, create a **virtual environment** (a private folder, `.venv`, that holds this project's packages so they don't clash with anything else on your computer), turn it on, and install the packages listed in `requirements.txt`.

**macOS / Linux:**
```bash
git clone https://github.com/ms-cc-org/YOUR-TEAM-REPO.git
cd YOUR-TEAM-REPO
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/ms-cc-org/YOUR-TEAM-REPO.git
cd YOUR-TEAM-REPO
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Replace `YOUR-TEAM-REPO` with your team repository's name, for example `DSU-Hackathon-Team-alpha`, or copy the whole URL from the green **Code** button on your team's GitHub page.

It worked if your prompt starts with `(.venv)`. Each time you open a new terminal, `cd` into your repo folder and run the activate line again.

If something goes wrong:
- **PowerShell says running scripts is disabled:** run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then activate again. In Command Prompt (cmd), activate with `.venv\Scripts\activate.bat` instead.
- **pip says `No matching distribution found for numpy==2.4.6`:** the venv was made with Python older than 3.11. Delete the `.venv` folder and create it again with a newer Python.

### 3. Run the starter app

```bash
streamlit run app.py
```

The first time, Streamlit asks for an email address in the terminal. Press Enter to skip it; the app then opens in your browser. It has filters for state, crop and years, a working yield chart in the Overview tab, and three empty tabs (Weather & Yield, Drought Analysis, Soil & Risk) for you to build on.

### 4. Open the starter notebook

From the repo root, with the venv active, run `jupyter lab` and open `notebooks/starter_notebook.ipynb` (or open it in VS Code and pick the `.venv` kernel). It loads the data, walks through the 2012 Iowa drought, and gives three questions to start from.

No install? Open the starter notebook in Google Colab and run its first cell, which fetches the data. Colab doesn't save to your team's repository: to keep your work, download it (**File → Download → Download .ipynb**) and add it to your team's repository on GitHub (**Add file → Upload files**).

### Optional Next.js prediction frontend

The standalone `frontend/` app provides a client-side evaporation and drought outlook dashboard for a FastAPI prediction endpoint. It is separate from the included Streamlit app and needs a running API that accepts the documented feature payload. See [frontend/README.md](frontend/README.md) for setup and endpoint configuration.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ms-cc-org/DSU-Hackathon/blob/main/notebooks/starter_notebook.ipynb)

---

## Load the data in your own code

The data loader handles file paths and data types for you. Run these from the repo root. From a subfolder such as `notebooks/`, add `import sys; sys.path.insert(0, "..")` first, as the starter notebook does.

If your Streamlit app is in a subfolder (for example `team_x/app.py`), start it from the repo root with `python -m streamlit run team_x/app.py`. Plain `streamlit run team_x/app.py` fails with `No module named 'src'`.

```python
from src.data_loader import load_master

df = load_master()          # 17,056 rows x 21 columns, fips is already a string
```

The detailed data:

```python
from src.data_loader import load_nass_raw, load_daily_weather, load_weekly_drought, load_soil, load_modis, load_irrigation, load_counties

nass    = load_nass_raw()         # 35K rows, yield/acres in long format per county
weather = load_daily_weather()    # 2.5M rows, daily tmax/tmin/precip per county
drought = load_weekly_drought()   # 343K rows, weekly D0-D4 per county
soil    = load_soil()             # 253 rows, one per county (static)
modis   = load_modis()            # 5,980 rows, annual NDVI/EVI per county (extension)
irrigation = load_irrigation()    # 3,716 rows, irrigated share and yields per county x crop x year (extension)
counties = load_counties()        # GeoJSON boundaries for maps, feature id = fips
```

To read the files directly instead:

```python
import pandas as pd

df = pd.read_parquet("data/master_dataset.parquet")
# or
df = pd.read_csv("data/master_dataset.csv", dtype={"fips": str})
```

With `read_csv`, always pass `dtype={"fips": str}`. With `read_parquet`, three count columns come back as pandas `Int64`, whose missing values some numpy calls don't see (`np.isnan(df["weeks_in_d2_plus"]).sum()` gives 0, not 150); `load_master()` converts them to float.

For maps, the notebook's worked example shows `px.choropleth` with `load_counties()`. Plotly 7 removed `px.choropleth_mapbox` and `px.scatter_mapbox`, which older tutorials use; use `px.choropleth` or `px.choropleth_map` instead.

---

## Test on past years

Build your tool on some years and test it on years it hasn't seen (for example, build on 2000–2018 and test on 2019–2025). That's how you show it would have worked in a real season. `yield_anomaly_pct` comes from a trend fitted on all of 2000–2025, including your test years; for a strict test, refit each county's trend on your training years only. `precip_anomaly_pct` is the same: its average uses all 26 years.

Use only what your user would know on the day they decide. On August 1, for example, `acres_harvested` and the master's season totals (weather and drought to the end of the season) aren't known yet; build those measures from the daily and weekly panels up to your decision date.

**Optional, advanced: the 2026 season.** The dataset ends in 2025, but the ACIS and Drought Monitor APIs serve 2026 data with no key. `src/build/ACIS_data_pull.py` and `USDM_data_pull.py` show the requests (the drought API's JSON uses lowercase `d0`–`d4`). USDA's monthly *Crop Production* reports give official 2026 state yield forecasts to compare against.

---

## Research questions the data can answer

If you want a question to explore before choosing a user:

1. When a county is in D2+ drought during its growing season, how far does yield fall below trend?
2. In rainfed Iowa, do counties with higher soil water storage (`aws_100cm_mm`) lose less yield in drought years? (Don't pool Nebraska: its lowest-storage counties are the most heavily irrigated, so they look drought-resistant for reasons the soil fields can't show.)
3. In Nebraska, sorghum's yield falls further below trend than corn's in drought years, even though sorghum is the "drought-tolerant" crop. What could explain that? (Hint: which crop is usually irrigated? Check how many sorghum counties report after 2010.)
4. Is precipitation a stronger yield predictor in rainfed Iowa than in irrigated California?
5. Is there an extreme heat threshold above which yield drops sharply? Does it differ by crop?
6. Once you control for soil quality (`nccpi_crop`), how much of the yield gap is left for drought to explain?

---

### Credits

If you publish or present results from this data, credit the sources:

- **U.S. Drought Monitor:** The U.S. Drought Monitor is jointly produced by the National Drought Mitigation Center at the University of Nebraska-Lincoln, the United States Department of Agriculture, and the National Oceanic and Atmospheric Administration.
- **USDA NASS:** This product uses the NASS API but is not endorsed or certified by NASS.
- **NOAA ACIS:** Weather data from the Applied Climate Information System (ACIS), NOAA Regional Climate Centers.
- **Soil:** Soil Survey Staff, Natural Resources Conservation Service, United States Department of Agriculture. Soil Survey Geographic (SSURGO) Database, via Soil Data Access.
- **MODIS:** Didan, K. (2021). MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid V061. NASA EOSDIS Land Processes DAAC. https://doi.org/10.5067/MODIS/MOD13Q1.061
- **County boundaries** (`data/counties.geojson`): U.S. Census Bureau county boundaries, from the [plotly/datasets](https://github.com/plotly/datasets) county GeoJSON.

The code and documentation in this repo are under the [MIT License](LICENSE).

## Rebuilding the data (organizers only)

<details>
You never need to rebuild the data for the hackathon. Everything is already in `data/`. This section is for organizers refreshing it.

Get a free [NASS API key](https://quickstats.nass.usda.gov/api) and add it to a `.env` file in the repo root:

```
NASS_API_KEY=your_key_here
```

Then run the scripts in `src/build/` in this order:

1. `NASS_data_pull.py`
2. `USDM_data_pull.py`
3. `ACIS_data_pull.py`
4. `SSURGO_data_pull.py`
5. `validate_sources.py`: checks the four source files
6. `build_master.py`: builds `data/master_dataset.csv` and `.parquet`

The scripts work from any directory. USDM, ACIS and SSURGO cache API responses in `data/raw/`, so a re-run only downloads what's missing. `data/raw/` is not in the repo, so on a fresh clone every script downloads everything. NASS always downloads fresh.

**Irrigation extension.** `NASS_irrigation_pull.py` runs after `NASS_data_pull.py` and uses the same NASS key.

**MODIS extension (organizer only).** `MODIS_gee_pull.py` runs after `build_master.py` and needs a Google Earth Engine account linked to a Google Cloud project:

```bash
pip install earthengine-api
earthengine authenticate
```

Then add `EE_PROJECT=your-cloud-project-id` to `.env`.

Never commit `.env`.
</details>
