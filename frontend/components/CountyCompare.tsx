"use client";

import { useState } from "react";
import Select from "@/components/Select";
import type { CountyFeature } from "@/lib/counties";
import { STATES } from "@/lib/counties";

// For each number: how to show it and which direction is better (null = neither is better)
type Row = { label: string; better: "higher" | "lower" | null; suffix: string; digits: number; get: (county: CountyFeature, crop: string) => number | null | undefined };

function cropOf(county: CountyFeature, crop: string) {
  return county.properties.crop_summaries.find((item) => item.crop === crop);
}

const ROWS: Row[] = [
  { label: "Average yield (bu/ac)", better: "higher", suffix: "", digits: 1, get: (c, crop) => cropOf(c, crop)?.mean_yield },
  { label: "Latest yield (bu/ac)", better: "higher", suffix: "", digits: 1, get: (c, crop) => cropOf(c, crop)?.latest_yield },
  { label: "Latest yield vs. county trend", better: "higher", suffix: "%", digits: 1, get: (c, crop) => cropOf(c, crop)?.latest_yield_anomaly_pct },
  { label: "Yield vs. trend, 2021–2025", better: "higher", suffix: "%", digits: 1, get: (c, crop) => cropOf(c, crop)?.recent_yield_anomaly_pct },
  { label: "Average drought score (0–500)", better: "lower", suffix: "", digits: 1, get: (c, crop) => cropOf(c, crop)?.mean_dsci },
  { label: "Recent drought score, 2021–2025", better: "lower", suffix: "", digits: 1, get: (c) => c.properties.recent_dsci },
  { label: "Growing-season rain (mm)", better: null, suffix: "", digits: 0, get: (c, crop) => cropOf(c, crop)?.mean_precip_mm },
  { label: "Growing-season temperature (°C)", better: null, suffix: "", digits: 1, get: (c, crop) => cropOf(c, crop)?.mean_tavg_c },
  { label: "Soil water capacity (mm)", better: "higher", suffix: "", digits: 0, get: (c) => c.properties.aws_100cm_mm },
  { label: "Drought-vulnerable soil", better: "lower", suffix: "%", digits: 1, get: (c) => c.properties.droughty_pct },
  { label: "Vegetation index (NDVI)", better: null, suffix: "", digits: 3, get: (c) => c.properties.ndvi_mean },
];

function show(value: number | null | undefined, row: Row) {
  return value == null || !Number.isFinite(value) ? "No data" : value.toFixed(row.digits) + row.suffix;
}

// Which side has the better value? "a", "b" or "" for a tie, a missing number, or a neutral row
function winner(row: Row, a: number | null | undefined, b: number | null | undefined) {
  if (row.better === null || a == null || b == null || a === b) return "";
  const aIsHigher = a > b;
  if (row.better === "higher") return aIsHigher ? "a" : "b";
  return aIsHigher ? "b" : "a";
}

// A simple line chart of the yield of both counties over the years
function YieldCompareChart({ a, b, crop }: { a: CountyFeature; b: CountyFeature; crop: string }) {
  const width = 720;
  const height = 260;
  const left = 52;
  const right = 16;
  const top = 14;
  const bottom = 32;
  const seriesA = cropOf(a, crop)?.yield_history ?? [];
  const seriesB = cropOf(b, crop)?.yield_history ?? [];
  const all = seriesA.concat(seriesB);
  if (all.length === 0) return <p className="frost-fine">Neither county has yield records for this crop.</p>;

  const minYield = Math.floor(Math.min(...all.map((item) => item.yield_per_acre)) / 10) * 10;
  const maxYield = Math.ceil(Math.max(...all.map((item) => item.yield_per_acre)) / 10) * 10;
  function x(year: number) {
    return left + ((year - 2000) / 25) * (width - left - right);
  }
  function y(value: number) {
    return top + ((maxYield - value) / (maxYield - minYield || 1)) * (height - top - bottom);
  }

  // Join dots with a line only when the years are next to each other
  function lines(series: { year: number; yield_per_acre: number }[], color: string) {
    const sorted = [...series].sort((p, q) => p.year - q.year);
    const pieces = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].year - sorted[i - 1].year === 1) {
        pieces.push(<line key={sorted[i].year} x1={x(sorted[i - 1].year)} y1={y(sorted[i - 1].yield_per_acre)} x2={x(sorted[i].year)} y2={y(sorted[i].yield_per_acre)} stroke={color} strokeWidth="2" />);
      }
    }
    return pieces;
  }

  const yTicks = [minYield, Math.round((minYield + maxYield) / 2), maxYield];
  return (
    <svg className="cmp-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Yield by year for both counties">
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="#e1e8de" />
          <text x={left - 8} y={y(tick) + 4} fontSize="13" textAnchor="end" fill="#587062">{tick}</text>
        </g>
      ))}
      {[2000, 2005, 2010, 2015, 2020, 2025].map((year) => (
        <text key={year} x={x(year)} y={height - 10} fontSize="13" textAnchor="middle" fill="#587062">{year}</text>
      ))}
      {lines(seriesA, "#4f8a63")}
      {lines(seriesB, "#347ba0")}
      {seriesA.map((item) => (
        <circle key={"a" + item.year} cx={x(item.year)} cy={y(item.yield_per_acre)} r="4.5" fill="#4f8a63"><title>{a.properties.county_name + " " + item.year + ": " + item.yield_per_acre.toFixed(1) + " bu/ac"}</title></circle>
      ))}
      {seriesB.map((item) => (
        <circle key={"b" + item.year} cx={x(item.year)} cy={y(item.yield_per_acre)} r="4.5" fill="#ffffff" stroke="#347ba0" strokeWidth="2.5"><title>{b.properties.county_name + " " + item.year + ": " + item.yield_per_acre.toFixed(1) + " bu/ac"}</title></circle>
      ))}
    </svg>
  );
}

export default function CountyCompare({ county, features, crop }: { county: CountyFeature; features: CountyFeature[]; crop: string }) {
  const [open, setOpen] = useState(false);
  const [stateCode, setStateCode] = useState(county.properties.state_alpha);
  const [fips, setFips] = useState("");

  // Counties in the second state, A to Z, without the county we are already looking at
  const choices = features
    .filter((item) => item.properties.state_alpha === stateCode && item.properties.fips !== county.properties.fips)
    .sort((p, q) => p.properties.county_name.localeCompare(q.properties.county_name));
  const other = choices.find((item) => item.properties.fips === fips) ?? choices[0];

  function changeState(code: string) {
    setStateCode(code);
    setFips("");
  }

  const nameA = county.properties.county_name;
  const nameB = other?.properties.county_name ?? "";

  // One sentence about yield and one about drought, only when both counties have the numbers
  const sentences: string[] = [];
  if (other) {
    const yieldA = cropOf(county, crop)?.mean_yield;
    const yieldB = cropOf(other, crop)?.mean_yield;
    if (yieldA != null && yieldB != null) {
      const gap = Math.abs(yieldA - yieldB).toFixed(1);
      sentences.push(yieldA === yieldB ? "Both counties average the same " + crop.toLowerCase() + " yield." : (yieldA > yieldB ? nameA : nameB) + " averages " + gap + " bu/ac more " + crop.toLowerCase() + " than " + (yieldA > yieldB ? nameB : nameA) + ".");
    }
    const droughtA = county.properties.recent_dsci;
    const droughtB = other.properties.recent_dsci;
    if (droughtA != null && droughtB != null) {
      if (Math.abs(droughtA - droughtB) < 5) {
        sentences.push("Recent drought is about the same in both counties.");
      } else {
        sentences.push((droughtA < droughtB ? nameA : nameB) + " has had less drought lately (score " + Math.min(droughtA, droughtB).toFixed(0) + " vs. " + Math.max(droughtA, droughtB).toFixed(0) + ").");
      }
    }
  }

  return (
    <section className="panel cmp-panel">
      <div className="cmp-head">
        <div>
          <span className="panel-overline">COMPARE COUNTIES</span>
          <h2>{open && other ? nameA + " vs. " + nameB : "Compare with another county"}</h2>
        </div>
        <button type="button" className="frost-reset" onClick={() => setOpen(!open)}>{open ? "Hide comparison" : "Compare"}</button>
      </div>

      {open && other && (
        <>
          <div className="cmp-pick">
            <span>Compare {nameA} with</span>
            <Select ariaLabel="Second state" value={stateCode} onChange={changeState} options={STATES.map((item) => ({ value: item.code, label: item.name }))} />
            <Select ariaLabel="Second county" value={other.properties.fips} onChange={setFips} options={choices.map((item) => ({ value: item.properties.fips, label: item.properties.county_name }))} />
          </div>

          {sentences.length > 0 && <p className="cmp-summary">{sentences.join(" ")}</p>}

          <table className="frost-table cmp-table">
            <thead>
              <tr><th>{crop.charAt(0) + crop.slice(1).toLowerCase()}</th><th>{nameA}</th><th>{nameB}</th></tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const valueA = row.get(county, crop);
                const valueB = row.get(other, crop);
                const best = winner(row, valueA, valueB);
                return (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={best === "a" ? "cmp-better" : ""}>{show(valueA, row)}</td>
                    <td className={best === "b" ? "cmp-better" : ""}>{show(valueB, row)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="frost-fine">Green means the better value for a crop. Rain, temperature and the vegetation index are not marked because a higher number is not clearly better.</p>

          <h3 className="cmp-subhead">Yield each year</h3>
          <YieldCompareChart a={county} b={other} crop={crop} />
          <p className="frost-fine">Green dots are {nameA}. Blue rings are {nameB}. Lines only join years that are next to each other, so gaps mean no reported yield.</p>

          <p className="cmp-note">Be careful comparing across states. Nebraska is about half irrigated and California almost entirely, while Iowa and Delaware are rainfed, so irrigation can explain a gap more than weather or soil does.</p>
        </>
      )}
    </section>
  );
}
