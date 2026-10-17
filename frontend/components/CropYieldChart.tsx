import type { CropSummary } from "@/lib/counties";

const CROPS = [
  { name: "CORN", color: "#3f7652" },
  { name: "SOYBEANS", color: "#4381a1" },
  { name: "WHEAT", color: "#c78634" },
  { name: "SORGHUM", color: "#8c69a7" },
] as const;

const WIDTH = 760;
const HEIGHT = 290;
const MARGIN = { top: 12, right: 18, bottom: 45, left: 52 };
const YEAR_TICKS = [2000, 2005, 2010, 2015, 2020, 2025];

export default function CropYieldChart({ summaries }: { summaries: CropSummary[] }) {
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const history = new Map(summaries.map((summary) => [summary.crop, summary.yield_history ?? []]));
  const maxYield = Math.max(50, ...CROPS.flatMap(({ name }) => (history.get(name) ?? []).map((item) => item.yield_per_acre)));
  const yieldStep = maxYield <= 150 ? 25 : maxYield <= 300 ? 50 : 100;
  const yieldMax = Math.ceil(maxYield / yieldStep) * yieldStep;
  const x = (year: number) => MARGIN.left + ((year - 2000) / 25) * plotWidth;
  const y = (value: number) => MARGIN.top + plotHeight - (value / yieldMax) * plotHeight;
  const available = CROPS.some(({ name }) => (history.get(name) ?? []).length > 0);

  return (
    <section className="yield-history-chart" aria-labelledby="yield-history-title">
      <div className="yield-history-heading">
        <div>
          <span className="panel-overline">ANNUAL CROP RECORDS</span>
          <h3 id="yield-history-title">Crop yields over time</h3>
        </div>
        <span className="yield-history-period">2000–2025 · bu/ac</span>
      </div>
      {available ? <>
        <div className="yield-chart-scroll">
          <svg className="yield-chart-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Line chart of annual crop yield from 2000 to 2025. Years are on the horizontal axis and yield in bushels per acre is on the vertical axis.">
            {YEAR_TICKS.map((tick) => (
              <g key={`yield-${tick}`}>
                <line x1={x(tick)} x2={x(tick)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} className="yield-chart-grid" />
                <text x={x(tick)} y={HEIGHT - MARGIN.bottom + 16} className="yield-chart-tick" textAnchor="middle">{tick}</text>
              </g>
            ))}
            {Array.from({ length: Math.floor(yieldMax / yieldStep) + 1 }, (_, index) => index * yieldStep).map((tick) => (
              <g key={`year-${tick}`}>
                <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} className="yield-chart-grid" />
                <text x={MARGIN.left - 9} y={y(tick) + 3} className="yield-chart-tick" textAnchor="end">{tick}</text>
              </g>
            ))}
            <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={MARGIN.top + plotHeight} className="yield-chart-axis" />
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={MARGIN.top + plotHeight} y2={MARGIN.top + plotHeight} className="yield-chart-axis" />
            {CROPS.map(({ name, color }) => {
              const points = history.get(name) ?? [];
              if (!points.length) return null;
              return <g key={name}>
                <path d={points.map((point, index) => `${index ? "L" : "M"}${x(point.year).toFixed(1)},${y(point.yield_per_acre).toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((point) => <circle key={`${point.year}-${point.yield_per_acre}`} cx={x(point.year)} cy={y(point.yield_per_acre)} r="2.3" fill={color}><title>{`${name}: ${point.yield_per_acre.toFixed(1)} bu/ac in ${point.year}`}</title></circle>)}
              </g>;
            })}
            <text x={MARGIN.left + plotWidth / 2} y={HEIGHT - 5} className="yield-chart-axis-label" textAnchor="middle">Year</text>
            <text x="13" y={MARGIN.top + plotHeight / 2} className="yield-chart-axis-label" textAnchor="middle" transform={`rotate(-90 13 ${MARGIN.top + plotHeight / 2})`}>Yield (bushels per acre)</text>
          </svg>
        </div>
        <div className="yield-chart-legend" aria-label="Crop line legend">
          {CROPS.map(({ name, color }) => <span key={name} className={(history.get(name) ?? []).length ? "" : "yield-chart-legend-missing"}><i style={{ background: color }} />{name}</span>)}
        </div>
      </> : <p className="yield-chart-empty">No reported annual crop yields are available for this county.</p>}
    </section>
  );
}
