import { BUILD_END, dayToText, FrostCounty, FrostData, TEST_START } from "@/lib/frost";

// A simple line-dot chart: the last spring frost of every year, with the planting date as a dashed line.
// Dots above the line in the test years are frosts that came after planting.
export default function FrostChart({
  data,
  county,
  plantDay,
  other,
}: {
  data: FrostData;
  county: FrostCounty;
  plantDay: number;
  other?: { county: FrostCounty; plantDay: number }; // a second county to compare (optional)
}) {
  const width = 720;
  const height = 280;
  const left = 56;
  const right = 16;
  const top = 16;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  // Work out the top and bottom of the chart
  let allDays = county.lastFrost.filter((day) => day > 0).concat([plantDay]);
  if (other) {
    allDays = allDays.concat(other.county.lastFrost.filter((day) => day > 0)).concat([other.plantDay]);
  }
  const minDay = Math.min(...allDays) - 5;
  const maxDay = Math.max(...allDays) + 5;
  const firstYear = data.years[0];
  const lastYear = data.years[data.years.length - 1];

  function xFor(year: number) {
    return left + ((year - firstYear) / (lastYear - firstYear)) * plotWidth;
  }
  function yFor(day: number) {
    return top + ((maxDay - day) / (maxDay - minDay)) * plotHeight;
  }

  // Labels along the left side: the 1st and 15th of each month that fit
  const labelDays = [1, 15, 32, 46, 60, 74, 91, 105, 121, 135, 152, 166];
  const yLabels = labelDays.filter((day) => day >= minDay && day <= maxDay);
  const xLabels = [2000, 2005, 2010, 2015, 2020, 2025];

  return (
    <svg className="frost-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Last spring frost by year compared with the planting date">
      {/* shaded box behind the test years */}
      <rect x={xFor(TEST_START) - 6} y={top} width={xFor(lastYear) - xFor(TEST_START) + 12} height={plotHeight} fill="#eef4ec" />
      <text x={xFor(TEST_START) - 2} y={top + 14} fontSize="13" fill="#587062">Test years</text>

      {/* grid lines and labels */}
      {yLabels.map((day) => (
        <g key={day}>
          <line x1={left} x2={width - right} y1={yFor(day)} y2={yFor(day)} stroke="#e1e8de" />
          <text x={left - 8} y={yFor(day) + 4} fontSize="13" textAnchor="end" fill="#587062">{dayToText(day)}</text>
        </g>
      ))}
      {xLabels.map((year) => (
        <text key={year} x={xFor(year)} y={height - 12} fontSize="13" textAnchor="middle" fill="#587062">{year}</text>
      ))}

      {/* the planting date */}
      <line x1={left} x2={width - right} y1={yFor(plantDay)} y2={yFor(plantDay)} stroke="#2c5e43" strokeWidth="2" strokeDasharray="6 5" />
      <text x={left + 6} y={yFor(plantDay) - 7} fontSize="14" fontWeight="700" fill="#2c5e43">Planting date {dayToText(plantDay)}</text>

      {/* the second county, if there is one: blue rings and a blue dashed line */}
      {other && (
        <g>
          <line x1={left} x2={width - right} y1={yFor(other.plantDay)} y2={yFor(other.plantDay)} stroke="#347ba0" strokeWidth="2" strokeDasharray="2 5" />
          {data.years.map((year, index) => {
            const lastFrost = other.county.lastFrost[index];
            if (lastFrost < 0) return null;
            return (
              <circle key={year} cx={xFor(year)} cy={yFor(lastFrost)} r="5" fill="#ffffff" stroke="#347ba0" strokeWidth="2.5">
                <title>{other.county.name + " " + year + ": last frost " + dayToText(lastFrost)}</title>
              </circle>
            );
          })}
        </g>
      )}

      {/* one dot per year */}
      {data.years.map((year, index) => {
        const lastFrost = county.lastFrost[index];
        if (lastFrost < 0) return null; // no frost that year
        const isTestYear = year > BUILD_END;
        const frostAfterPlanting = isTestYear && lastFrost > plantDay;
        return (
          <circle
            key={year}
            cx={xFor(year)}
            cy={yFor(lastFrost)}
            r="5.5"
            fill={frostAfterPlanting ? "#d98467" : isTestYear ? "#4f8a63" : "#9bb5a3"}
          >
            <title>{year + ": last frost " + dayToText(lastFrost)}</title>
          </circle>
        );
      })}
    </svg>
  );
}
