"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountyMap, { countyMetric, MapMetric, MetricLegend } from "@/components/CountyMap";
import Sidebar from "@/components/Sidebar";
import type { CountyCollection, CountyFeature } from "@/lib/counties";
import { formatValue, STATES } from "@/lib/counties";

const CROPS = ["CORN", "SOYBEANS", "WHEAT", "SORGHUM"];
const metricOptions: { value: MapMetric; label: string }[] = [
  { value: "county_outlook", label: "Crop performance + drought risk" },
  { value: "yield_anomaly", label: "Recent crop performance" },
  { value: "mean_dsci", label: "Recent drought intensity" },
  { value: "aws_100cm_mm", label: "Soil water capacity" },
];

export default function StateExplorer({ stateCode }: { stateCode: string }) {
  const router = useRouter();
  const state = STATES.find((item) => item.code === stateCode)!;
  const [allFeatures, setAllFeatures] = useState<CountyFeature[]>([]);
  const [metric, setMetric] = useState<MapMetric>("mean_dsci");
  const [crop, setCrop] = useState("CORN");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/county-data.json")
      .then((response) => { if (!response.ok) throw new Error("Unable to load county data."); return response.json() as Promise<CountyCollection>; })
      .then((data) => { if (live) setAllFeatures(data.features); })
      .catch(() => { if (live) setError("County reference data could not be loaded."); })
      .finally(() => { if (live) setLoadingData(false); });
    return () => { live = false; };
  }, []);

  const features = useMemo(() => allFeatures.filter((feature) => feature.properties.state_alpha === stateCode), [allFeatures, stateCode]);
  const ranked = useMemo(() => {
    const bestHigh = metric === "yield_anomaly" || metric === "aws_100cm_mm";
    return features
      .map((feature) => ({ feature, value: countyMetric(feature, metric, crop) }))
      .sort((a, b) => {
        if (a.value == null) return b.value == null ? a.feature.properties.county_name.localeCompare(b.feature.properties.county_name) : 1;
        if (b.value == null) return -1;
        return bestHigh ? b.value - a.value : a.value - b.value;
      });
  }, [features, metric, crop]);
  const dataCountyCount = features.filter((feature) => feature.properties.crop_summaries.length > 0).length;
  const mapDescription = metric === "mean_dsci"
    ? "Recent drought intensity from the U.S. Drought Monitor: blue means lower drought pressure; red means higher drought pressure."
    : metric === "aws_100cm_mm"
      ? "Soil water capacity: blue means more water storage; red means less. This is soil context, not a yield estimate."
      : metric === "yield_anomaly"
        ? `Recent ${crop.toLowerCase()} yield anomaly: blue is above county trend; red is below. Counties need 3 valid reports in 2021–2025.`
        : `Crop outlook combines recent ${crop.toLowerCase()} yield anomaly and drought pressure. Counties need 3 valid reports in 2021–2025; others are hatched as no data.`;

  return (
    <main className="explorer-shell">
      <Sidebar activeSlug={state.slug} />
      <section className="explorer-workspace">
        <header className="explorer-topbar"><div className="breadcrumb"><span>Fieldwise</span><span className="crumb-slash">/</span><strong>County explorer</strong></div><span className="topbar-tag"><i /> COUNTY DATASET · 2000–2025</span></header>
        <div className="explorer-content">
          <div className="explorer-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> AGRICULTURAL CLIMATE INTELLIGENCE</div><h1>{state.name} county outlook</h1><p>Compare county crop and drought conditions. Select a county on the map or ranking to open its report.</p></div><div className="state-heading-chip"><span className="state-monogram">{state.code}</span><span><strong>{state.name}</strong><small>{features.length} counties mapped · {dataCountyCount} with crop data</small></span></div></div>

          <div className="explorer-grid state-map-grid">
            <section className="panel map-panel">
              <div className="map-panel-head"><div><span className="panel-overline">COUNTY OUTLOOK MAP</span><h2>{state.name}</h2><p>{mapDescription}</p></div><div className="map-controls"><label htmlFor="map-metric">COLOR COUNTIES BY</label><select id="map-metric" value={metric} onChange={(event) => setMetric(event.target.value as MapMetric)}>{metricOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>{(metric === "yield_anomaly" || metric === "county_outlook") && <select aria-label="Crop for county map" value={crop} onChange={(event) => setCrop(event.target.value)}>{CROPS.map((value) => <option key={value}>{value}</option>)}</select>}</div></div>
              <div className="map-canvas">{loadingData ? <div className="map-loading"><span className="spinner dark-spinner" /> Loading county boundaries…</div> : features.length ? <CountyMap features={features} metric={metric} crop={crop} onSelect={(feature) => router.push(`/states/${state.slug}/counties/${feature.properties.fips}`)} /> : <div className="map-loading">{error || `No county boundary records for ${state.name}.`}</div>}</div>
              <div className="map-panel-foot"><span><i className="map-foot-dot" /> Interactive county boundaries</span>{!loadingData && features.length > 0 && <div className="map-key-corner"><MetricLegend features={features} metric={metric} crop={crop} /></div>}<span>Source: U.S. Census county boundaries</span></div>
            </section>

            <aside className="panel county-ranking-panel">
              <div className="ranking-heading"><div><span className="panel-overline">COUNTY RANKING</span><h2>Best to worst</h2><p>{state.name} · {metric === "county_outlook" || metric === "yield_anomaly" ? crop : "All counties"}</p></div><span className="ranking-count">{features.length}</span></div>
              <p className="ranking-explainer">{metric === "yield_anomaly" ? "Higher recent yield anomaly ranks better." : metric === "aws_100cm_mm" ? "Higher soil water capacity ranks better." : metric === "mean_dsci" ? "Lower recent drought intensity ranks better." : "Lower crop-stress and drought signal ranks better."}</p>
              <div className="county-ranking-list" aria-label={`${state.name} counties ranked best to worst`}>
                {loadingData ? <div className="ranking-empty">Loading county ranking…</div> : ranked.map(({ feature, value }, index) => (
                  <Link className="ranking-row" href={`/states/${state.slug}/counties/${feature.properties.fips}`} key={feature.properties.fips}>
                    <span className="ranking-position">{String(index + 1).padStart(2, "0")}</span>
                    <span className="ranking-county-name">{feature.properties.county_name}</span>
                    <span className={`ranking-signal ${value == null ? "signal-missing" : ""}`}>{formatValue(value, 1, metric === "yield_anomaly" ? "%" : metric === "aws_100cm_mm" ? " mm" : "")}</span>
                    <span className="ranking-arrow">↗</span>
                  </Link>
                ))}
              </div>
              <div className="ranking-footnote">Ranked by the selected map measure. Counties without data appear last. Click any county for its records and predictor.</div>
            </aside>
          </div>
          <footer className="explorer-footer"><span>FIELDWISE <i>·</i> AGRICULTURAL RESILIENCE TOOLS</span><span>County summaries use available records from 2000–2025. Missing values are left blank.</span></footer>
        </div>
      </section>
    </main>
  );
}
