"use client";

import { useEffect, useState } from "react";
import CountyMap from "@/components/CountyMap";
import Disclaimer from "@/components/Disclaimer";
import FrostChart from "@/components/FrostChart";
import Select from "@/components/Select";
import Sidebar from "@/components/Sidebar";
import type { CountyCollection, CountyFeature } from "@/lib/counties";
import { STATES } from "@/lib/counties";
import { countiesForCrop, CROPS, dayToText, FrostCounty, FrostData, getPlanting, summarize } from "@/lib/frost";

const GOAL = 0.1; // we want a frost after planting in no more than 1 of every 10 years
const MAP_COLORS = ["#347ba0", "#5c9eb7", "#9fc3c1", "#e5d99a", "#df9a69", "#c75b4e"];

// Turn 0.026 into "3%"
function percentText(value: number) {
  return Math.round(value * 100) + "%";
}

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
  const group = summarize(frost, stateCounties, percentile, margin);

  // Planting date for a county on the map (null = frost does not set the date)
  function mapValue(feature: CountyFeature) {
    const item = cropCounties.find((c) => c.fips === feature.properties.fips);
    if (!frost || !item) return null;
    const planting = getPlanting(frost, item, percentile, margin);
    return planting.frostFree ? null : planting.day;
  }
  const mapDays = stateFeatures.map(mapValue).filter((value): value is number => value !== null);

  // One row for every year, newest first, so a farmer can compare with the planting date
  const historyRows = frost.years.map((year, index) => {
    const lastFrost = county.lastFrost[index];
    const daysAfter = lastFrost < 0 ? null : lastFrost - result.day;
    return { year: year, lastFrost: lastFrost, daysAfter: daysAfter, isTestYear: year >= 2019 };
  }).reverse();
  const hitYears = historyRows.filter((row) => row.daysAfter !== null && row.daysAfter > 0).length;


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
                  <div className="frost-bigdate small">No spring frost limit</div>
                  <p className="frost-lead">In most of 2000–2018 this county never dropped to {crop.coldText} before July, so frost does not set a planting date here. Use other limits such as soil temperature or moisture.</p>
                </>
              ) : (
                <>
                  <div className="frost-bigdate">{dayToText(result.day)}</div>
                  <p className="frost-lead">
                    From 2000–2018, the last spring frost came between <strong>{dayToText(result.earliestFrost ?? 0)}</strong> and <strong>{dayToText(result.latestFrost ?? 0)}</strong> (usually around {dayToText(result.medianFrost ?? 0)}). This date covers {percentile}% of those years, plus {margin} extra days.
                  </p>
                </>
              )}

              {!result.frostFree && result.day < 60 && (
                <p className="frost-fine">This date falls in mid-winter. Frost rarely comes late in this county, so frost is unlikely to be what limits planting here. Soil temperature and moisture matter more.</p>
              )}

              <div className="frost-verdict-head">
                <span className="panel-overline">HOW IT HELD UP ON 2019–2025</span>
                {result.hits === 0
                  ? <span className="frost-pill pill-good">No frost after this date</span>
                  : <span className="frost-pill pill-warn">Frost after this date in {result.hits} of {result.testYears.length} years</span>}
              </div>

              <div className="frost-years">
                {result.testYears.map((item) => (
                  <div className={item.hit ? "frost-year hit" : "frost-year ok"} key={item.year}>
                    <strong>{item.year}</strong>
                    <span>{item.lastFrost === null ? "No frost" : "Last frost " + dayToText(item.lastFrost)}</span>
                    <em>{item.hit ? "Frost after planting" : "Safe"}</em>
                  </div>
                ))}
              </div>

              {result.hits > 0 && (
                <p className="frost-fine">One bad year out of {result.testYears.length} is {percentText(1 / result.testYears.length)}, above the 10% goal. A more cautious setting above can bring it down.</p>
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

          {/* Every past year for this county */}
          <section className="panel frost-card frost-history-card">
            <span className="panel-overline">PAST YEARS · {county.name.toUpperCase()}</span>
            <h2>Every year since 2000</h2>
            <p className="frost-fine tight">
              Compare each year with the planting date of {result.frostFree ? "this setting" : dayToText(result.day)}. A frost after that date would have hurt a crop planted on it.
              This date would have been hit in <strong>{hitYears} of {historyRows.length} years</strong>.
            </p>
            <div className="frost-history-scroll">
              <table className="frost-table frost-history">
                <thead>
                  <tr><th>Year</th><th>Last spring frost</th><th>Compared with planting date</th><th>Used for</th></tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.year} className={row.daysAfter !== null && row.daysAfter > 0 ? "hit" : ""}>
                      <td><strong>{row.year}</strong></td>
                      <td>{row.lastFrost < 0 ? "No frost" : dayToText(row.lastFrost)}</td>
                      <td>
                        {row.daysAfter === null && "Safe, no frost this year"}
                        {row.daysAfter !== null && row.daysAfter > 0 && row.daysAfter + " days after. Frost hit a crop planted on the date"}
                        {row.daysAfter !== null && row.daysAfter <= 0 && -row.daysAfter + " days before. Safe"}
                      </td>
                      <td>{row.isTestYear ? "Test year" : "Built the date"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* How the date held up for the whole state */}
          <div>
            <section className="panel frost-card">
              <span className="panel-overline">DID IT WORK? · {stateName.toUpperCase()}</span>
              <div className="frost-stat-row">
                <div className="frost-stat">
                  <strong>{(group.frostRate * 100).toFixed(1)}%</strong>
                  <span>of county-years had a frost after the planting date (2019–2025)</span>
                </div>
                {group.frostRate <= GOAL
                  ? <div className="frost-pill pill-good">Meets the 10% goal</div>
                  : <div className="frost-pill pill-warn">Above the 10% goal</div>}
              </div>
              <p className="frost-fine">{group.countiesWithNoHit} of {group.counties} counties had no frost after their date in any of the 7 test years.</p>

              <div className="frost-bars">
                {group.byYear.map((item) => (
                  <div className="frost-bar-col" key={item.year}>
                    <div className="frost-bar-track">
                      <i style={{ height: Math.min(100, item.rate * 250) + "%" }} className={item.rate > GOAL ? "over" : ""} />
                      <b style={{ bottom: GOAL * 250 + "%" }} />
                    </div>
                    <span>{percentText(item.rate)}</span>
                    <small>{item.year}</small>
                  </div>
                ))}
              </div>
              <p className="frost-fine">Share of counties hit each year. The dashed line marks the 10% goal.</p>
            </section>
          </div>

          <footer className="explorer-footer">
            <span>FIELDWISE <i>·</i> FROST-SAFE PLANTING CALENDAR</span>
            <span>Daily low temperature (ACIS) 2000–2025. A date is the last day before July 1 with a low at or below the crop's cold limit ({crop.coldText}).</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
