import Select from "@/components/Select";
import { STATES } from "@/lib/counties";
import { dayToText, FrostCounty, FrostData, getPlanting, yearsHit } from "@/lib/frost";

// Puts two counties next to each other so a farmer can compare them
export default function FrostCompare({
  data,
  countyA,
  countyB,
  stateB,
  countiesB,
  percentile,
  margin,
  onStateB,
  onCountyB,
}: {
  data: FrostData;
  countyA: FrostCounty;
  countyB: FrostCounty;
  stateB: string;
  countiesB: FrostCounty[];
  percentile: number;
  margin: number;
  onStateB: (code: string) => void;
  onCountyB: (fips: string) => void;
}) {
  const a = getPlanting(data, countyA, percentile, margin);
  const b = getPlanting(data, countyB, percentile, margin);
  const yearCount = data.years.length;

  // Say in words how far apart the two dates are
  const gap = b.day - a.day;
  let gapText = "Both counties have the same planting date.";
  if (gap > 0) gapText = countyB.name + " plants " + gap + " days later than " + countyA.name + ".";
  if (gap < 0) gapText = countyB.name + " plants " + -gap + " days earlier than " + countyA.name + ".";

  // One row of the table, built from a label and two values
  function row(label: string, valueA: string, valueB: string) {
    return (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td>{valueA}</td>
        <td>{valueB}</td>
      </tr>
    );
  }

  const range = (planting: typeof a) =>
    planting.earliestFrost === null ? "No frost" : dayToText(planting.earliestFrost) + " to " + dayToText(planting.latestFrost ?? 0);

  return (
    <section className="panel frost-card frost-compare">
      <span className="panel-overline">COMPARE TWO COUNTIES</span>
      <h2>{countyA.name} vs. {countyB.name}</h2>

      <div className="frost-compare-pick">
        <span>Compare with</span>
        <Select ariaLabel="Second state" value={stateB} onChange={onStateB} options={STATES.map((item) => ({ value: item.code, label: item.name }))} />
        <Select ariaLabel="Second county" value={countyB.fips} onChange={onCountyB} options={countiesB.map((item) => ({ value: item.fips, label: item.name }))} />
      </div>

      <table className="frost-table frost-compare-table">
        <thead>
          <tr>
            <th />
            <th>{countyA.name}</th>
            <th>{countyB.name}</th>
          </tr>
        </thead>
        <tbody>
          {row("Earliest safe planting date", a.frostFree ? "No frost limit" : dayToText(a.day), b.frostFree ? "No frost limit" : dayToText(b.day))}
          {row("Usual last spring frost", a.medianFrost === null ? "No frost" : dayToText(a.medianFrost), b.medianFrost === null ? "No frost" : dayToText(b.medianFrost))}
          {row("Range of last frosts, 2000-2018", range(a), range(b))}
          {row("Years a frost came after the date", yearsHit(countyA, a.day) + " of " + yearCount, yearsHit(countyB, b.day) + " of " + yearCount)}
          {row("Test years hit, 2019-2025", a.hits + " of " + a.testYears.length, b.hits + " of " + b.testYears.length)}
        </tbody>
      </table>
      <p className="frost-fine">{gapText} The chart above shows {countyA.name} as green dots and {countyB.name} as blue rings.</p>
    </section>
  );
}
