export type CropSummary = {
  crop: string;
  yield_history: { year: number; yield_per_acre: number }[];
  reported_years: number;
  latest_year: number | null;
  latest_yield: number | null;
  latest_yield_anomaly_pct: number | null;
  mean_yield: number | null;
  mean_yield_anomaly_pct: number | null;
  recent_yield_count: number;
  recent_yield_anomaly_pct: number | null;
  recent_dsci: number | null;
  mean_precip_mm: number | null;
  mean_tavg_c: number | null;
  mean_dsci: number | null;
};

export type ClimateSummary = {
  crop: string;
  years: number;
  mean_precip_mm: number | null;
  mean_tavg_c: number | null;
};

export type CountyProperties = {
  fips: string;
  county_name: string;
  state_alpha: string;
  mean_dsci: number | null;
  recent_dsci: number | null;
  mean_drought_severity: number | null;
  aws_100cm_mm: number | null;
  droughty_pct: number | null;
  mean_precip_anomaly_pct: number | null;
  mean_extreme_heat_days: number | null;
  ndvi_mean: number | null;
  recent_climate_summaries: ClimateSummary[];
  crop_summaries: CropSummary[];
};

export type CountyFeature = {
  type: "Feature";
  id: string;
  properties: CountyProperties;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type CountyCollection = { type: "FeatureCollection"; features: CountyFeature[] };

export const STATES = [
  { code: "NE", name: "Nebraska", slug: "nebraska" },
  { code: "IA", name: "Iowa", slug: "iowa" },
  { code: "CA", name: "California", slug: "california" },
  { code: "DE", name: "Delaware", slug: "delaware" },
] as const;

export function stateFromSlug(slug: string) {
  return STATES.find((state) => state.slug === slug);
}

export function formatValue(value: number | null | undefined, digits = 1, suffix = "") {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(digits)}${suffix}`;
}

export const STATE_NAMES: Record<string, string> = Object.fromEntries(STATES.map((state) => [state.code, state.name]));
