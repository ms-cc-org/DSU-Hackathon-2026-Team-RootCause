"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import CountyMap, { countyFillColor, countyMetric, MapMetric, MetricLegend } from "@/components/CountyMap";
import CropYieldChart from "@/components/CropYieldChart";
import Sidebar from "@/components/Sidebar";
import type { CountyCollection, CountyFeature } from "@/lib/counties";
import { formatValue, stateFromSlug } from "@/lib/counties";

const METRICS: { value: MapMetric; label: string }[] = [
  { value: "county_outlook", label: "Crop performance + drought risk" },
  { value: "mean_dsci", label: "Drought intensity" },
  { value: "aws_100cm_mm", label: "Soil water capacity" },
  { value: "yield_anomaly", label: "Yield anomaly" },
];
const API_URL = process.env.NEXT_PUBLIC_PREDICTION_API_URL || "http://localhost:8000/predict-yield";
type ModelInputs = { precip_mm: string; precip_anomaly_pct: string; tavg_c: string; extreme_heat_days: string; gdd: string; mean_dsci: string; aws_100cm_mm: string; droughty_pct: string };
const INITIAL: ModelInputs = { precip_mm: "400", precip_anomaly_pct: "0", tavg_c: "20", extreme_heat_days: "5", gdd: "1200", mean_dsci: "100", aws_100cm_mm: "150", droughty_pct: "50" };

export default function CountyReport({ stateSlug, fips }: { stateSlug: string; fips: string }) {
  const state = stateFromSlug(stateSlug)!;
  const [allFeatures, setAllFeatures] = useState<CountyFeature[]>([]);
  const [metric, setMetric] = useState<MapMetric>("county_outlook");
  const [crop, setCrop] = useState("CORN");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState<ModelInputs>(INITIAL);
  const [prediction, setPrediction] = useState<{ yieldPerAcre: number; risk: "Low" | "Medium" | "High" } | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/county-data.json")
      .then((response) => { if (!response.ok) throw new Error("Could not load county data"); return response.json() as Promise<CountyCollection>; })
      .then((data) => { if (live) setAllFeatures(data.features); })
      .catch(() => { if (live) setFailed(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const county = allFeatures.find((feature) => feature.properties.fips === fips && feature.properties.state_alpha === state.code);
  const stateFeatures = useMemo(() => allFeatures.filter((feature) => feature.properties.state_alpha === state.code), [allFeatures, state.code]);
  const cropData = useMemo(() => county?.properties.crop_summaries.find((summary) => summary.crop === crop), [county, crop]);
  const climateData = county?.properties.recent_climate_summaries.find((summary) => summary.crop === crop);
  const hasCropYield = (cropData?.reported_years ?? 0) > 0;
  const selectedCropMapHasData = county ? countyMetric(county, metric, crop) != null : false;

  useEffect(() => {
    if (!county) return;
    setForm({
      precip_mm: String(climateData?.mean_precip_mm ?? cropData?.mean_precip_mm ?? INITIAL.precip_mm),
      precip_anomaly_pct: String(county.properties.mean_precip_anomaly_pct ?? 0),
      tavg_c: String(climateData?.mean_tavg_c ?? cropData?.mean_tavg_c ?? INITIAL.tavg_c),
      extreme_heat_days: String(county.properties.mean_extreme_heat_days ?? INITIAL.extreme_heat_days),
      gdd: INITIAL.gdd,
      mean_dsci: String(cropData?.mean_dsci ?? county.properties.recent_dsci ?? INITIAL.mean_dsci),
      aws_100cm_mm: String(county.properties.aws_100cm_mm ?? INITIAL.aws_100cm_mm),
      droughty_pct: String(county.properties.droughty_pct ?? INITIAL.droughty_pct),
    });
    setPrediction(null);
  }, [county, crop, climateData, cropData]);

  async function submitPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPredictionError(""); setPrediction(null);
    if (!county) return;
    setPredicting(true);
    try {
      const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ county_name: county.properties.county_name, crop, ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)])) }) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = typeof payload === "object" && payload !== null && "detail" in payload ? String((payload as { detail: unknown }).detail) : `Prediction service returned ${response.status}.`;
        throw new Error(detail);
      }
      if (typeof payload !== "object" || payload === null) throw new Error("The prediction API returned an invalid response.");
      const body = payload as Record<string, unknown>;
      const yieldPerAcre = Number(body.predicted_yield_per_acre);
      const risk = String(body.risk_category);
      if (!Number.isFinite(yieldPerAcre) || !["Low", "Medium", "High"].includes(risk)) throw new Error("The API response must include a numeric predicted_yield_per_acre and a Low, Medium, or High risk_category.");
      setPrediction({ yieldPerAcre, risk: risk as "Low" | "Medium" | "High" });
    } catch (caught) {
      setPredictionError(
        caught instanceof TypeError
          ? `Could not reach the model API at ${API_URL}. From the repository root, start it with: .venv/bin/python -m uvicorn model_api.api:app --port 8000`
          : caught instanceof Error ? caught.message : "Prediction request failed.",
      );
    }
    finally { setPredicting(false); }
  }

  return (
    <main className="explorer-shell">
      <Sidebar activeSlug={state.slug} />
      <section className="explorer-workspace">
        <header className="explorer-topbar"><div className="breadcrumb"><Link href={`/states/${state.slug}`}>County explorer</Link><span className="crumb-slash">/</span><strong>{county?.properties.county_name ?? "County report"}</strong></div><span className="topbar-tag"><i /> COUNTY REPORT · 2000–2025</span></header>
        <div className="explorer-content county-report-content">
          <div className="explorer-heading report-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> COUNTY PROFILE <span className="crumb-slash">/</span> {state.name.toUpperCase()}</div><h1>{loading ? "Loading county…" : county?.properties.county_name ?? "County not found"}</h1><p>{county ? `${state.name} · FIPS ${county.properties.fips} · Summary of available county and crop records` : "We could not find this county in the selected state's boundary and data files."}</p></div><Link className="back-link" href={`/states/${state.slug}`}><span>←</span> Back to {state.name} map</Link></div>

          {loading ? <div className="report-loading"><span className="spinner dark-spinner" /> Loading county records…</div> : failed ? <div className="report-error">County data could not be loaded. Try refreshing the page.</div> : county ? (
            <div className="county-report-grid">
              <section className="panel county-map-panel">
                <div className="map-panel-head county-map-head"><div><span className="panel-overline">COUNTY BOUNDARY</span><h2>{county.properties.county_name}</h2><p>County color reflects recent crops and drought conditions.</p></div><div className="map-controls"><label htmlFor="county-map-metric">MAP COLOR</label><select id="county-map-metric" value={metric} onChange={(event) => setMetric(event.target.value as MapMetric)}>{METRICS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{(metric === "yield_anomaly" || metric === "county_outlook") && <select aria-label="Crop for map color" value={crop} onChange={(event) => setCrop(event.target.value)}>{["CORN", "SOYBEANS", "WHEAT", "SORGHUM"].map((value) => <option key={value}>{value}</option>)}</select>}</div></div>
                <div className="county-map-canvas"><CountyMap features={[county]} colorScaleFeatures={stateFeatures} metric={metric} crop={crop} prediction={prediction ? { fips: county.properties.fips, risk: prediction.risk } : null} countyOnly /></div>
                <div className="county-map-foot"><div className="single-map-note"><span className="single-map-swatch" style={{ background: prediction ? prediction.risk === "Low" ? "#347ba0" : prediction.risk === "Medium" ? "#df9a46" : "#c74743" : selectedCropMapHasData ? countyFillColor(county, metric, crop, stateFeatures) : "#edf0ec" }} /> {prediction ? `Live model: ${prediction.risk} risk` : (metric === "county_outlook" || metric === "yield_anomaly") && !selectedCropMapHasData ? `No recent ${crop.toLowerCase()} yield data · hatched` : metric === "mean_dsci" ? `Recent county drought: ${formatValue(county.properties.recent_dsci, 1)} DSCI` : metric === "aws_100cm_mm" ? `Soil capacity: ${formatValue(county.properties.aws_100cm_mm, 1, " mm")}` : metric === "yield_anomaly" ? `${crop} yield anomaly: ${formatValue(cropData?.recent_yield_anomaly_pct, 1, "%")}` : `${crop} county signal · 2021–2025`}</div><div className="county-key-corner"><MetricLegend features={stateFeatures} metric={metric} crop={crop} prediction={prediction ? { fips: county.properties.fips, risk: prediction.risk } : null} /></div></div>
                <CropYieldChart summaries={county.properties.crop_summaries} />
              </section>

              <aside className="panel report-data-panel">
                <div className="report-card-heading"><span className="state-monogram">{state.code}</span><div><span className="panel-overline">COUNTY DATA</span><h2>{county.properties.county_name}</h2><p>Records available, 2000–2025</p></div></div>
                <div className="report-crop-picker"><label htmlFor="report-crop">CROP DETAIL</label><select id="report-crop" value={crop} onChange={(event) => setCrop(event.target.value)}>{["CORN", "SOYBEANS", "WHEAT", "SORGHUM"].map((value) => <option key={value}>{value}</option>)}</select></div>
                {!hasCropYield && <div className="data-availability-alert" role="status"><strong>No historical {crop.toLowerCase()} yield data for {county.properties.county_name}.</strong><span>Choose another crop or use the climate and soil metrics below. The map marks counties without sufficient recent crop records as no data.</span></div>}
                {hasCropYield && (cropData?.recent_yield_count ?? 0) < 3 && <div className="data-availability-alert subtle-alert" role="status"><strong>Limited recent {crop.toLowerCase()} yield coverage.</strong><span>Only {cropData?.recent_yield_count ?? 0} yield-anomaly records are available for 2021–2025. Recent crop-risk map colors require at least 3 years.</span></div>}
                {hasCropYield ? <div className="report-metrics-grid">
                  {cropData?.latest_yield != null && <MetricCard label="Latest reported yield" value={`${formatValue(cropData.latest_yield)} bu/ac`} detail={`${cropData.latest_year ?? "Latest year"} · ${crop}`} />}
                  {cropData?.latest_yield_anomaly_pct != null && <MetricCard label="Latest yield anomaly" value={formatValue(cropData.latest_yield_anomaly_pct, 1, "%")} detail={cropData.latest_year ? `County trend · ${cropData.latest_year}` : "County trend"} />}
                  {cropData?.mean_dsci != null && <MetricCard label="Mean drought intensity" value={formatValue(cropData.mean_dsci, 1)} detail="DSCI · 0 to 500 scale" />}
                  {cropData?.mean_precip_mm != null && <MetricCard label="Mean precipitation" value={formatValue(cropData.mean_precip_mm, 0, " mm")} detail="Growing-season average" />}
                  {county.properties.aws_100cm_mm != null && <MetricCard label="Soil water capacity" value={formatValue(county.properties.aws_100cm_mm, 0, " mm")} detail="Available water, top 100 cm" />}
                  {county.properties.droughty_pct != null && <MetricCard label="Drought-vulnerable soil" value={formatValue(county.properties.droughty_pct, 1, "%")} detail="County area at or below 152 mm" />}
                  {cropData?.mean_tavg_c != null && <MetricCard label="Mean temperature" value={formatValue(cropData.mean_tavg_c, 1, " °C")} detail="Growing-season average" />}
                  {county.properties.ndvi_mean != null && <MetricCard label="Vegetation index" value={formatValue(county.properties.ndvi_mean, 3)} detail="Mean annual NDVI · MODIS" />}
                  {!cropData || (cropData.latest_yield == null && cropData.latest_yield_anomaly_pct == null && cropData.mean_dsci == null && cropData.mean_precip_mm == null && cropData.mean_tavg_c == null && county.properties.aws_100cm_mm == null && county.properties.droughty_pct == null && county.properties.ndvi_mean == null) && <div className="insight-empty">No additional crop, climate, or soil measurements are available.</div>}
                </div> : <div className="report-metrics-grid climate-only-grid">
                  {county.properties.recent_dsci != null && <MetricCard label="Recent county drought index" value={formatValue(county.properties.recent_dsci, 1)} detail="Weekly USDM · 2021–2025 · DSCI" />}
                  {climateData?.mean_precip_mm != null && <MetricCard label={`${crop} season precipitation`} value={formatValue(climateData.mean_precip_mm, 0, " mm")} detail={`Average seasonal total · ${climateData.years} years · 2021–2025`} />}
                  {climateData?.mean_tavg_c != null && <MetricCard label={`${crop} season temperature`} value={formatValue(climateData.mean_tavg_c, 1, " °C")} detail={`Average seasonal mean · ${climateData.years} years · 2021–2025`} />}
                  {county.properties.aws_100cm_mm != null && <MetricCard label="Soil water capacity" value={formatValue(county.properties.aws_100cm_mm, 0, " mm")} detail="Available water, top 100 cm" />}
                  {county.properties.droughty_pct != null && <MetricCard label="Drought-vulnerable soil" value={formatValue(county.properties.droughty_pct, 1, "%")} detail="County area at or below 152 mm" />}
                  {county.properties.ndvi_mean != null && <MetricCard label="Vegetation index" value={formatValue(county.properties.ndvi_mean, 3)} detail="Mean annual NDVI · MODIS" />}
                  {county.properties.recent_dsci == null && climateData?.mean_precip_mm == null && climateData?.mean_tavg_c == null && county.properties.aws_100cm_mm == null && county.properties.droughty_pct == null && county.properties.ndvi_mean == null && <div className="data-availability-alert">No climate, soil, or vegetation measurements are available for this county.</div>}
                </div>}
                <div className="report-footnote">County averages describe the county as a whole and may not represent individual fields. Missing values are not treated as zero.</div>
                <div className="county-predictor">
                  <div className="aside-panel-heading predictor-heading"><div><span className="panel-overline">PREDICTION TOOL</span><h3>{crop} yield outlook</h3></div><span className="small-step">INPUTS</span></div>
                  <p className="predictor-intro">Adjust {crop.toLowerCase()} growing conditions for {county.properties.county_name}. The model estimates yield in bushels per acre and compares it with historical {crop.toLowerCase()} yields.</p>
                  <form onSubmit={submitPrediction} className="predictor-form">
                    <div className="predictor-grid">
                      <PredictionField label="Growing-season precipitation" unit="mm" value={form.precip_mm} onChange={(value) => { setForm({ ...form, precip_mm: value }); setPrediction(null); }} step="1" min="0" />
                      <PredictionField label="Precipitation anomaly" unit="%" value={form.precip_anomaly_pct} onChange={(value) => { setForm({ ...form, precip_anomaly_pct: value }); setPrediction(null); }} step="0.1" />
                      <PredictionField label="Mean temperature" unit="°C" value={form.tavg_c} onChange={(value) => { setForm({ ...form, tavg_c: value }); setPrediction(null); }} step="0.1" />
                      <PredictionField label="Extreme heat days" unit="days" value={form.extreme_heat_days} onChange={(value) => { setForm({ ...form, extreme_heat_days: value }); setPrediction(null); }} step="1" min="0" max="366" />
                      <PredictionField label="Growing degree days" unit="GDD" value={form.gdd} onChange={(value) => { setForm({ ...form, gdd: value }); setPrediction(null); }} step="10" min="0" />
                      <PredictionField label="Mean drought index" unit="DSCI" value={form.mean_dsci} onChange={(value) => { setForm({ ...form, mean_dsci: value }); setPrediction(null); }} step="1" min="0" max="500" />
                      <PredictionField label="Soil water capacity" unit="mm" value={form.aws_100cm_mm} onChange={(value) => { setForm({ ...form, aws_100cm_mm: value }); setPrediction(null); }} step="1" min="0" />
                      <PredictionField label="Drought-vulnerable soil" unit="%" value={form.droughty_pct} onChange={(value) => { setForm({ ...form, droughty_pct: value }); setPrediction(null); }} step="0.1" min="0" max="100" />
                    </div>
                    <button className="submit-button" type="submit" disabled={predicting}>{predicting ? <><span className="spinner" /> Calculating…</> : <>Generate outlook <Arrow /></>}</button>
                  </form>
                  {predictionError && <div className="error-message" role="alert">{predictionError}</div>}
                  {prediction && <div className={`prediction-result risk-${prediction.risk.toLowerCase()}`}><span>{county.properties.county_name}</span><strong>{prediction.yieldPerAcre.toFixed(2)} bu/ac · {prediction.risk} relative yield risk</strong></div>}
                </div>
              </aside>
            </div>
          ) : <div className="report-error">No county record matches FIPS {fips} in {state.name}.</div>}

          {county && <section className="panel crop-history-panel"><div className="crop-history-title"><div><span className="panel-overline">CROP RECORDS</span><h2>Available yield coverage</h2></div><span className="history-period">2000—2025</span></div><div className="crop-table-wrap"><table className="crop-table"><thead><tr><th>Crop</th><th>Reported years</th><th>Mean yield</th><th>Latest yield</th><th>Latest year</th></tr></thead><tbody>{county.properties.crop_summaries.map((summary) => <CropRow key={summary.crop} summary={summary} active={summary.crop === crop} onClick={() => setCrop(summary.crop)} />)}</tbody></table></div></section>}
          <footer className="explorer-footer"><span>FIELDWISE <i>·</i> AGRICULTURAL RESILIENCE TOOLS</span><span>Source: county boundary file, master dataset, and MODIS county summaries.</span></footer>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="report-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function CropRow({ summary, active, onClick }: { summary: CountyFeature["properties"]["crop_summaries"][number]; active: boolean; onClick: () => void }) {
  return <tr className={active ? "active-crop-row" : ""} onClick={onClick} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } }}><td><button type="button" className="crop-name-button" onClick={onClick}>{summary.crop}</button></td><td>{summary.reported_years} / 26</td><td>{formatValue(summary.mean_yield, 1, " bu/ac")}</td><td>{formatValue(summary.latest_yield, 1, " bu/ac")}</td><td>{summary.latest_year ?? "—"}</td></tr>;
}

function PredictionField({ label, unit, value, onChange, step, min, max }: { label: string; unit: string; value: string; onChange: (value: string) => void; step: string; min?: string; max?: string }) {
  return <label className="predictor-field"><span>{label}</span><div className="predictor-input"><input type="number" inputMode="decimal" value={value} step={step} min={min} max={max} required onChange={(event) => onChange(event.target.value)} /><small>{unit}</small></div></label>;
}

function Arrow() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>; }
