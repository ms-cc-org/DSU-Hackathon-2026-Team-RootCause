"use client";

import { ReactNode, useMemo, useState } from "react";
import type { CountyFeature } from "@/lib/counties";
import { STATE_NAMES } from "@/lib/counties";

export type MapMetric = "county_outlook" | "mean_dsci" | "aws_100cm_mm" | "yield_anomaly";

const WIDTH = 800;
const HEIGHT = 400;
const PAD = 24;
const OUTLOOK_PALETTE = ["#347ba0", "#5c9eb7", "#9fc3c1", "#e5d99a", "#df9a69", "#c75b4e"];
const PALETTES: Record<MapMetric, string[]> = {
  county_outlook: OUTLOOK_PALETTE,
  mean_dsci: OUTLOOK_PALETTE,
  aws_100cm_mm: [...OUTLOOK_PALETTE].reverse(),
  yield_anomaly: [...OUTLOOK_PALETTE].reverse(),
};

function points(feature: CountyFeature): number[][] {
  const coords = feature.geometry.coordinates as unknown;
  const found: number[][] = [];
  function walk(value: unknown) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      found.push([value[0], value[1]]);
      return;
    }
    value.forEach(walk);
  }
  walk(coords);
  return found;
}

function projectFeatures(features: CountyFeature[]) {
  // Use a single longitude scale for the whole map. Applying cos(latitude) to
  // every point bends county edges diagonally and makes square counties look
  // like parallelograms. This local equirectangular projection stays flat and
  // keeps north at the top.
  const allCoordinates = features.flatMap(points);
  const centerLatitude = allCoordinates.length
    ? (Math.min(...allCoordinates.map((point) => point[1])) + Math.max(...allCoordinates.map((point) => point[1]))) / 2
    : 0;
  const longitudeScale = Math.cos((centerLatitude * Math.PI) / 180);
  const projected = features.map((feature) => {
    const coords = points(feature).map(([lon, lat]) => [lon * longitudeScale, lat] as [number, number]);
    return { feature, coords };
  });
  const all = projected.flatMap((item) => item.coords);
  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));
  const scale = Math.min((WIDTH - PAD * 2) / Math.max(maxX - minX, 0.01), (HEIGHT - PAD * 2) / Math.max(maxY - minY, 0.01));
  const left = (WIDTH - (maxX - minX) * scale) / 2;
  const top = (HEIGHT - (maxY - minY) * scale) / 2;
  return projected.map(({ feature }) => {
    function ringPath(ring: number[][]) {
      return ring.map(([lon, lat], index) => {
        const x = left + (lon * longitudeScale - minX) * scale;
        const y = HEIGHT - top - (lat - minY) * scale;
        return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join("") + "Z";
    }
    const geometry = feature.geometry;
    const path = geometry.type === "Polygon"
      ? (geometry.coordinates as number[][][]).map(ringPath).join("")
      : (geometry.coordinates as number[][][][]).flatMap((polygon) => polygon.map(ringPath)).join("");
    return { feature, path };
  });
}

export function countyMetric(feature: CountyFeature, metric: MapMetric, crop: string) {
  const summary = feature.properties.crop_summaries.find((item) => item.crop === crop);
  if (metric === "mean_dsci") return feature.properties.recent_dsci ?? feature.properties.mean_dsci;
  if (metric === "aws_100cm_mm") return feature.properties.aws_100cm_mm;
  // Require at least three of the five recent years to avoid painting a
  // crop-risk estimate where the selected crop has little or no yield data.
  if (!summary || summary.recent_yield_count < 3 || summary.recent_yield_anomaly_pct == null) return null;
  if (metric === "yield_anomaly") return summary.recent_yield_anomaly_pct;
  // Put recent yield loss and drought pressure on a common 0–100 risk scale.
  // More negative yield anomalies and higher DSCI produce a redder map shade.
  const yieldRisk = summary.recent_yield_anomaly_pct == null ? null : Math.max(0, Math.min(100, 50 - summary.recent_yield_anomaly_pct * 1.25));
  if (yieldRisk == null) return null;
  const recentDsci = summary.recent_dsci ?? feature.properties.recent_dsci;
  const droughtRisk = recentDsci == null ? null : Math.max(0, Math.min(100, recentDsci / 2.5));
  if (droughtRisk == null) return yieldRisk;
  return yieldRisk * 0.6 + droughtRisk * 0.4;
}

export function metricLabel(metric: MapMetric) {
  if (metric === "county_outlook") return "Crop performance + drought risk · 2021–2025";
  if (metric === "mean_dsci") return "Recent seasonal drought intensity (DSCI)";
  if (metric === "aws_100cm_mm") return "Soil available water capacity (mm)";
  return "Recent yield anomaly · 2021–2025 (%) · minimum 3 reports";
}

function colorFor(value: number | null, min: number, max: number, palette: string[]) {
  if (value == null || !Number.isFinite(value)) return "#e5e9e4";
  const ratio = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  return palette[Math.min(palette.length - 1, Math.floor(ratio * palette.length))];
}

export function countyFillColor(feature: CountyFeature, metric: MapMetric, crop: string, domain: CountyFeature[]) {
  const values = domain.map((item) => countyMetric(item, metric, crop)).filter((value): value is number => value != null && Number.isFinite(value));
  if (!values.length) return "#e5e9e4";
  return colorFor(countyMetric(feature, metric, crop), Math.min(...values), Math.max(...values), PALETTES[metric]);
}

// Turn a yield difference (in %) into a short word and a colour tone
export function conditionFor(anomaly: number): { label: string; tone: "good" | "ok" | "warn" | "bad" } {
  if (anomaly >= 5) return { label: "Well above normal", tone: "good" };
  if (anomaly >= 2) return { label: "Above normal", tone: "good" };
  if (anomaly > -2) return { label: "Near normal", tone: "ok" };
  if (anomaly > -8) return { label: "Below normal", tone: "warn" };
  return { label: "Well below normal", tone: "bad" };
}

// The card that shows when you hover a county: state, county, and how each crop is doing
export function CropConditionTip({ feature }: { feature: CountyFeature }) {
  const { county_name, state_alpha, crop_summaries } = feature.properties;
  const rows = crop_summaries
    .filter((item) => item.recent_yield_count >= 3 && item.recent_yield_anomaly_pct != null)
    .sort((a, b) => a.crop.localeCompare(b.crop));
  return (
    <>
      <div className="county-tip-head"><strong>{county_name}</strong><span>{STATE_NAMES[state_alpha] ?? state_alpha}</span></div>
      {rows.length === 0 && <div className="county-tip-sub">No crop reports for 2021–2025</div>}
      {rows.length > 0 && <div className="county-tip-sub">Crop condition, 2021–2025 yield vs. county normal</div>}
      {rows.map((item) => {
        const anomaly = item.recent_yield_anomaly_pct as number;
        const condition = conditionFor(anomaly);
        return (
          <div className="county-tip-row" key={item.crop}>
            <span className="county-tip-crop">{item.crop.charAt(0) + item.crop.slice(1).toLowerCase()}</span>
            <span className="county-tip-pct">{anomaly > 0 ? "+" : ""}{anomaly.toFixed(1)}%</span>
            <span className={"county-tip-tag tone-" + condition.tone}>{condition.label}</span>
          </div>
        );
      })}
    </>
  );
}

export default function CountyMap({
  features,
  metric,
  crop,
  selectedFips,
  onSelect,
  countyOnly = false,
  colorScaleFeatures,
  prediction,
  getValue,
  paletteOverride,
  tooltip,
}: {
  features: CountyFeature[];
  metric: MapMetric;
  crop: string;
  selectedFips?: string;
  onSelect?: (feature: CountyFeature) => void;
  countyOnly?: boolean;
  colorScaleFeatures?: CountyFeature[];
  prediction?: { fips: string; risk: "Low" | "Medium" | "High" } | null;
  getValue?: (feature: CountyFeature) => number | null; // use your own number for each county
  paletteOverride?: string[]; // use your own colours
  tooltip?: (feature: CountyFeature) => ReactNode; // use your own hover card
}) {
  // The county the mouse is over (null when it is not over a county)
  const [hover, setHover] = useState<{ feature: CountyFeature; x: number; y: number } | null>(null);
  const valueOf = (feature: CountyFeature) => (getValue ? getValue(feature) : countyMetric(feature, metric, crop));
  const shapes = useMemo(() => projectFeatures(features), [features]);
  // Lowest and highest value on the map, used to pick colours
  const values = (colorScaleFeatures ?? features).map(valueOf).filter((value): value is number => value != null && Number.isFinite(value));
  const range = { min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 1 };
  const palette = paletteOverride ?? PALETTES[metric];

  // Put the hover card to the right of the mouse, or to the left near the screen edge
  const tipLeft = hover ? (hover.x > window.innerWidth - 340 ? hover.x - 330 : hover.x + 16) : 0;
  const tipTop = hover ? (hover.y > window.innerHeight - 220 ? hover.y - 150 : hover.y + 16) : 0;

  return (
    <>
    <svg className={`county-map-svg ${countyOnly ? "county-map-single" : ""}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={countyOnly ? "County boundary map" : "Interactive county map. Select a county for its details."}>
      <defs><pattern id="missingPattern" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#edf0ec"/><line x1="0" y1="0" x2="0" y2="6" stroke="#d9dfd8" strokeWidth="1"/></pattern></defs>
      {shapes.map(({ feature, path }) => {
        const value = valueOf(feature);
        const predictedRisk = prediction?.fips === feature.properties.fips ? prediction.risk : null;
        const predictionFill = predictedRisk === "Low" ? "#347ba0" : predictedRisk === "Medium" ? "#df9a46" : predictedRisk === "High" ? "#c74743" : null;
        const fill = predictionFill ?? colorFor(value, range.min, range.max, palette);
        const isSelected = feature.properties.fips === selectedFips;
        return (
          <path
            key={feature.properties.fips}
            d={path}
            fill={predictedRisk ? fill : value == null ? "url(#missingPattern)" : fill}
            className={`county-shape ${onSelect ? "county-clickable" : ""} ${isSelected ? "county-selected" : ""}`}
            onClick={onSelect ? () => onSelect(feature) : undefined}
            onMouseEnter={(event) => setHover({ feature, x: event.clientX, y: event.clientY })}
            onMouseMove={(event) => setHover({ feature, x: event.clientX, y: event.clientY })}
            onMouseLeave={() => setHover(null)}
            aria-label={`${feature.properties.county_name}, ${STATE_NAMES[feature.properties.state_alpha] ?? feature.properties.state_alpha}`}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={onSelect ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(feature); } } : undefined}
          />
        );
      })}
    </svg>
    {hover && (
      <div className="county-tip" role="tooltip" style={{ left: tipLeft, top: tipTop }}>
        {tooltip ? tooltip(hover.feature) : <CropConditionTip feature={hover.feature} />}
      </div>
    )}
    </>
  );
}

export function MetricLegend({ features, metric, crop, prediction }: { features: CountyFeature[]; metric: MapMetric; crop: string; prediction?: { fips: string; risk: "Low" | "Medium" | "High" } | null }) {
  const colors = PALETTES[metric];
  const left = metric === "aws_100cm_mm"
    ? { label: "Lower soil storage", color: "#c75b4e" }
    : metric === "yield_anomaly"
      ? { label: "Below county trend", color: "#c75b4e" }
      : metric === "mean_dsci"
        ? { label: "Lower drought intensity", color: "#347ba0" }
        : { label: "Better crops / lower drought", color: "#347ba0" };
  const right = metric === "aws_100cm_mm"
    ? { label: "Higher soil storage", color: "#347ba0" }
    : metric === "yield_anomaly"
      ? { label: "Above county trend", color: "#347ba0" }
      : metric === "mean_dsci"
        ? { label: "Higher drought intensity", color: "#c75b4e" }
        : { label: "Crop stress / drought likely", color: "#c75b4e" };
  return (
    <div className="map-legend" aria-label={`${metricLabel(metric)} legend`}>
      <div className="legend-label-row"><span>{metricLabel(metric)}</span><span>COUNTY SIGNAL</span></div>
      <div className="legend-swatches">{colors.map((color, index) => <span key={color} style={{ background: color }} title={`Risk band ${index + 1}`} />)}<span className="legend-missing" title="No data" /></div>
      <div className="legend-values"><span><i style={{ background: left.color }} />{left.label}</span><span><i style={{ background: right.color }} />{right.label}</span><span><i /> No data</span></div>
      {prediction && <div className="prediction-key"><span>Live model overlay</span><i className="pred-low" /> Low <i className="pred-medium" /> Medium <i className="pred-high" /> High</div>}
    </div>
  );
}
