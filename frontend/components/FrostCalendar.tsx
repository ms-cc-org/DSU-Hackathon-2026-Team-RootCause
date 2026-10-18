"use client";

import { useEffect, useState } from "react";
import CountyMap from "@/components/CountyMap";
import Disclaimer from "@/components/Disclaimer";
import FrostChart from "@/components/FrostChart";
import Select from "@/components/Select";
import Sidebar from "@/components/Sidebar";
import type { CountyCollection, CountyFeature } from "@/lib/counties";
import { STATES } from "@/lib/counties";
import { countiesForCrop, CROPS, dayToText, FrostCounty, FrostData, getPlanting } from "@/lib/frost";

const MAP_COLORS = ["#347ba0", "#5c9eb7", "#9fc3c1", "#e5d99a", "#df9a69", "#c75b4e"];

// All counties in a state, A to Z
function countiesInState(list: FrostCounty[], code: string): FrostCounty[] {
  return list.filter((county) => county.state === code).sort((a, b) => a.name.localeCompare(b.name));
}

export default function FrostCalendar() {
  const [frost, setFrost] = useState<FrostData | null>(null);
  const [features, setFeatures] = useState<CountyFeature[]>([]);
  const [error, setError] = useState("");
  const [stateCode, setStateCode] = useState("IA");
  const [fips, setFips] = useState("");
  const [cropId, setCropId] = useState("soybeans");
  const [percentile, setPercentile] = useState(75);
  const [margin, setMargin] = useState(10);

  // Load the frost numbers and the county shapes when the page opens
  useEffect(() => {
    Promise.all([
      fetch("/frost-data.json").then((response) => response.json() as Promise<FrostData>),
      fetch("/county-data.json").then((response) => response.json() as Promise<CountyCollection>),
    ])
      .then(([frostData, counties]) => {
        setFrost(frostData);
        setFeatures(counties.features);
        const firstCrop = CROPS[0];
        const list = countiesForCrop(frostData, firstCrop);
        setPercentile(frostData.defaults[firstCrop.coldLimit].percentile);
        setMargin(frostData.defaults[firstCrop.coldLimit].margin);
        setFips(countiesInState(list, "IA")[0].fips);
      })
      .catch(() => {
        setError("The frost data could not be loaded. Run frontend/scripts/build_frost_data.py to create it.");
      });
  }, []);

  // The crop that is picked right now
  const crop = CROPS.find((item) => item.id === cropId) ?? CROPS[0];

  function changeState(code: string) {
    setStateCode(code);
    if (frost) setFips(countiesInState(countiesForCrop(frost, crop), code)[0].fips);
  }

  // Each crop has its own recommended settings, so switching crops loads them
  function changeCrop(id: string) {
    setCropId(id);
    const newCrop = CROPS.find((item) => item.id === id) ?? CROPS[0];
    if (!frost) return;
    setPercentile(frost.defaults[newCrop.coldLimit].percentile);
    setMargin(frost.defaults[newCrop.coldLimit].margin);
  }

  function resetSettings() {
    if (!frost) return;
    setPercentile(frost.defaults[crop.coldLimit].percentile);
    setMargin(frost.defaults[crop.coldLimit].margin);
  }

  // Show a message while loading, or if something went wrong
  if (error) {
    return <main className="explorer-shell"><Sidebar activePage="frost" /><div className="explorer-workspace"><div className="panel frost-note">{error}</div></div></main>;
  }
  if (!frost) {
    return <main className="explorer-shell"><Sidebar activePage="frost" /><div className="explorer-workspace"><div className="panel frost-note"><span className="spinner dark-spinner" /> Loading frost history…</div></div></main>;
  }

  // Everything below uses the data, so it is loaded by now
  const stateName = STATES.find((item) => item.code === stateCode)?.name ?? stateCode;
  const cropCounties = countiesForCrop(frost, crop);
  const stateCounties = countiesInState(cropCounties, stateCode);
  const stateFeatures = features.filter((feature) => feature.properties.state_alpha === stateCode);
  const county = stateCounties.find((item) => item.fips === fips) ?? stateCounties[0];
  const result = getPlanting(frost, county, percentile, margin);

  // Planting date for a county on the map (null = frost does not set the date)
  function mapValue(feature: CountyFeature) {
    const item = cropCounties.find((c) => c.fips === feature.properties.fips);
    if (!frost || !item) return null;
    const planting = getPlanting(frost, item, percentile, margin);
    return planting.frostFree ? null : planting.day;
  }
  const mapDays = stateFeatures.map(mapValue).filter((value): value is number => value !== null);

  return (
    <main className="explorer-shell">
      <Sidebar activePage="frost" />
      <section className="explorer-workspace">
        <header className="explorer-topbar">
          <div className="breadcrumb"><span>Fieldwise</span><span className="crumb-slash">/</span><strong>Frost-safe planting calendar</strong></div>
          <span className="topbar-tag"><i /> DAILY WEATHER · 2000–2025</span>
        </header>

        <div className="explorer-content">
          <div className="explorer-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> FOR EXTENSION AGRONOMISTS</div>
              <h1>Frost-safe planting calendar</h1>
              <p>The earliest date each county can plant and rarely see a spring frost afterward. Built from 2000–2018 weather and checked on 2019–2025, years it never saw.</p>
            </div>
          </div>

          <Disclaimer />

          {/* Controls */}
          <section className="panel frost-crops">
            <span className="panel-overline">CROP</span>
            <div className="frost-crop-buttons" role="group" aria-label="Crop">
              {CROPS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === cropId ? "frost-crop is-selected" : "frost-crop"}
                  onClick={() => changeCrop(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>Cold limit {item.coldText}</span>
                </button>
              ))}
            </div>
            <p className="frost-fine tight">{crop.note} The cold limit is a rule of thumb, so check your local extension guidance too.</p>
          </section>

          <section className="panel frost-controls">
            <div className="frost-field">
              <label>STATE</label>
              <Select ariaLabel="State" value={stateCode} onChange={changeState} options={STATES.map((item) => ({ value: item.code, label: item.name }))} />
            </div>
            <div className="frost-field frost-field-wide">
              <label>COUNTY</label>
              <Select ariaLabel="County" value={county.fips} onChange={setFips} options={stateCounties.map((item) => ({ value: item.fips, label: item.name }))} />
            </div>
            <div className="frost-field frost-slider">
              <label htmlFor="frost-percentile">PAST YEARS COVERED <strong>{percentile}%</strong></label>
              <input id="frost-percentile" type="range" min={50} max={100} step={5} value={percentile} onChange={(event) => setPercentile(Number(event.target.value))} />
              <small>{percentile}% means the date is later than the last frost in about {percentile} of every 100 past years.</small>
            </div>
            <div className="frost-field frost-slider">
              <label htmlFor="frost-margin">EXTRA SAFETY DAYS <strong>+{margin}</strong></label>
              <input id="frost-margin" type="range" min={0} max={21} step={1} value={margin} onChange={(event) => setMargin(Number(event.target.value))} />
              <small>More days is safer but plants later.</small>
            </div>
            <button type="button" className="frost-reset" onClick={resetSettings}>Reset to recommended</button>
          </section>

          {/* The date for one county, and the state map */}
          <div className="explorer-grid state-map-grid frost-grid">
            <section className="panel frost-result">
              <span className="panel-overline">EARLIEST SAFE DATE TO PLANT {crop.label.toUpperCase()}</span>
              <h2>{county.name}, {stateName}</h2>

              {result.frostFree ? (
                <>
                  <div className="frost-bigdate small">No frost limit</div>
                  <p className="frost-lead">Frost almost never comes late in this county, so it does not decide when to plant here. Soil temperature and moisture matter more.</p>
                </>
              ) : (
                <>
                  <div className="frost-bigdate">{dayToText(result.day)}</div>
                  <p className="frost-lead">Plant on or after this date and a late spring frost is unlikely to hurt your crop.</p>

                  <div className="frost-verdict-head">
                    {result.hits === 0
                      ? <span className="frost-pill pill-good">Safe in all {result.testYears.length} test years</span>
                      : <span className="frost-pill pill-warn">Frost hit in {result.hits} of {result.testYears.length} test years</span>}
                    <small>Test years are 2019–2025.</small>
                  </div>

                  {result.hits > 0 && (
                    <p className="frost-fine">That is above our 10% goal. Try adding more safety days above.</p>
                  )}

                  <p className="frost-fine">
                    How we picked it: in 2000–2018 the last spring frost came between {dayToText(result.earliestFrost ?? 0)} and {dayToText(result.latestFrost ?? 0)}, usually around {dayToText(result.medianFrost ?? 0)}. This date is later than the last frost in {percentile} of every 100 of those years, plus {margin} extra days.
                  </p>
                </>
              )}

              {!result.frostFree && result.day < 60 && (
                <p className="frost-fine">This date is in mid-winter, so frost is not what limits planting here. Soil temperature matters more.</p>
              )}
            </section>

            <section className="panel map-panel frost-map">
              <div className="map-panel-head">
                <div>
                  <span className="panel-overline">PLANTING DATE MAP</span>
                  <h2>{stateName}</h2>
                  <p>Earlier dates are blue and later dates are red. Hover a county for its date and test result, or click to select it.</p>
                </div>
              </div>
              <div className="map-canvas">
                <CountyMap
                  features={stateFeatures}
                  metric="mean_dsci"
                  crop="CORN"
                  selectedFips={county.fips}
                  getValue={mapValue}
                  paletteOverride={MAP_COLORS}
                  onSelect={(feature) => setFips(feature.properties.fips)}
                  tooltip={(feature) => {
                    const item = cropCounties.find((c) => c.fips === feature.properties.fips);
                    if (!item) return <div className="county-tip-sub">No frost data</div>;
                    const planting = getPlanting(frost, item, percentile, margin);
                    return (
                      <>
                        <div className="county-tip-head"><strong>{item.name}</strong><span>{stateName}</span></div>
                        <div className="county-tip-row">
                          <span className="county-tip-crop">Plant on</span>
                          <span className="county-tip-pct">{planting.frostFree ? "Any time" : dayToText(planting.day)}</span>
                        </div>
                        <div className="county-tip-sub">
                          {planting.frostFree ? "No spring frost limit" : "Frost after this date in " + planting.hits + " of " + planting.testYears.length + " test years"}
                        </div>
                      </>
                    );
                  }}
                />
              </div>
              <div className="frost-legend">
                <span>{mapDays.length > 0 ? "Earliest " + dayToText(Math.min(...mapDays)) : "Earlier"}</span>
                <div className="legend-swatches">
                  {MAP_COLORS.map((color) => <span key={color} style={{ background: color }} />)}
                  <span className="legend-missing" />
                </div>
                <span>{mapDays.length > 0 ? "Latest " + dayToText(Math.max(...mapDays)) : "Later"}</span>
                <small>Hatched counties had no spring frost in most years.</small>
              </div>
            </section>
          </div>

          {/* Graph for the selected county */}
          <section className="panel frost-card frost-chart-card">
            <span className="panel-overline">YEAR BY YEAR · {county.name.toUpperCase()}</span>
            <h2>Last spring frost vs. the planting date</h2>
            <p className="frost-fine tight">Each dot is the last day that year with a low at or below {crop.coldText}. A dot above the dashed line in the test years (green box) means a frost came after planting. Years with no frost are not shown.</p>
            <FrostChart data={frost} county={county} plantDay={result.day} />
          </section>

          <footer className="explorer-footer">
            <span>FIELDWISE <i>·</i> FROST-SAFE PLANTING CALENDAR</span>
            <span>Daily low temperature (ACIS) 2000–2025. A date is the last day before July 1 with a low at or below the crop's cold limit ({crop.coldText}).</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
