// Helpers for the frost planting calendar.
// Frost dates are stored as "day of the year" numbers (Jan 1 = 1).
// A value of -1 means there was no frost that year.

// One county, with the last-frost days for a single crop
export type FrostCounty = {
  fips: string;
  name: string;
  state: string;
  lastFrost: number[]; // one number per year, starting at 2000
};

// One county as it is stored in frost-data.json (a list of days for each cold limit)
export type RawFrostCounty = {
  fips: string;
  name: string;
  state: string;
  lastFrost: Record<string, number[]>;
};

export type FrostData = {
  years: number[];
  defaults: Record<string, { percentile: number; margin: number }>; // one per cold limit
  selectionNote: string;
  counties: RawFrostCounty[];
};

// The crops on the page. Each crop has its own cold limit (in degrees C).
// These are rules of thumb from extension guidance, not exact values.
export type Crop = { id: string; label: string; coldLimit: string; coldText: string; note: string };

export const CROPS: Crop[] = [
  {
    id: "soybeans",
    label: "Soybeans",
    coldLimit: "0",
    coldText: "0 °C (32 °F)",
    note: "Soybeans are the most sensitive. Their growing point is above the ground as soon as they come up, so even a light frost can kill a seedling.",
  },
  {
    id: "corn",
    label: "Corn",
    coldLimit: "-2",
    coldText: "-2 °C (28 °F)",
    note: "Corn can handle a light frost because its growing point stays under the soil until about the 6-leaf stage. A hard freeze, about 28 °F or colder for 2 hours, does the damage.",
  },
  {
    id: "wheat",
    label: "Wheat (spring-planted)",
    coldLimit: "-4",
    coldText: "-4 °C (24 °F)",
    note: "Wheat is hardy when it is young. Injury starts near 24 °F once it reaches the jointing stage, and much colder before that. Winter wheat is planted in the fall, so this is for wheat planted in spring.",
  },
];

// Get the counties ready for one crop
export function countiesForCrop(data: FrostData, crop: Crop): FrostCounty[] {
  return data.counties.map((county) => ({
    fips: county.fips,
    name: county.name,
    state: county.state,
    lastFrost: county.lastFrost[crop.coldLimit],
  }));
}

// How many years (out of every year since 2000) had a frost after this planting day
export function yearsHit(county: FrostCounty, day: number): number {
  return county.lastFrost.filter((last) => last > day).length;
}

// Years used to build the planting date, and years used to test it
export const BUILD_START = 2000;
export const BUILD_END = 2018;
export const TEST_START = 2019;
export const TEST_END = 2025;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Turn a day number into text, like 120 -> "Apr 30"
export function dayToText(day: number): string {
  let daysLeft = Math.round(day);
  for (let i = 0; i < 12; i++) {
    if (daysLeft <= monthLengths[i]) {
      return monthNames[i] + " " + Math.max(daysLeft, 1);
    }
    daysLeft = daysLeft - monthLengths[i];
  }
  return "Dec 31";
}

export type TestYear = {
  year: number;
  lastFrost: number | null;
  hit: boolean; // true if frost came after the planting date
};

export type Planting = {
  day: number;
  frostFree: boolean; // true if most years had no frost at all
  earliestFrost: number | null;
  medianFrost: number | null;
  latestFrost: number | null;
  testYears: TestYear[];
  hits: number;
};

// Work out the planting date for one county
export function getPlanting(data: FrostData, county: FrostCounty, percentile: number, margin: number): Planting {
  // Collect the last-frost day for each build year (no frost counts as 0)
  const buildDays: number[] = [];
  for (let year = BUILD_START; year <= BUILD_END; year++) {
    const last = county.lastFrost[data.years.indexOf(year)];
    buildDays.push(Math.max(last, 0));
  }
  buildDays.sort((a, b) => a - b);

  // Pick the day at the chosen percentile, then add the safety margin
  const position = Math.ceil(((buildDays.length - 1) * percentile) / 100 - 0.000001);
  const baseDay = buildDays[position];
  const day = baseDay + margin;

  // Only the years that really had a frost, for the history sentence
  const frostDays = buildDays.filter((d) => d > 0);

  // Check each test year: did a frost come after the planting date?
  const testYears: TestYear[] = [];
  for (let year = TEST_START; year <= TEST_END; year++) {
    const last = county.lastFrost[data.years.indexOf(year)];
    testYears.push({ year: year, lastFrost: last < 0 ? null : last, hit: last > day });
  }
  const hits = testYears.filter((t) => t.hit).length;

  return {
    day: day,
    frostFree: baseDay === 0,
    earliestFrost: frostDays.length > 0 ? frostDays[0] : null,
    medianFrost: frostDays.length > 0 ? frostDays[Math.floor((frostDays.length - 1) / 2)] : null,
    latestFrost: frostDays.length > 0 ? frostDays[frostDays.length - 1] : null,
    testYears: testYears,
    hits: hits,
  };
}

export type Summary = {
  averageDay: number;
  frostRate: number; // share of county-years with a frost after planting
  countiesWithNoHit: number;
  counties: number;
  byYear: { year: number; rate: number }[];
};

// Add up the results for a group of counties (for example one state)
export function summarize(data: FrostData, counties: FrostCounty[], percentile: number, margin: number): Summary {
  const results = counties.map((county) => getPlanting(data, county, percentile, margin));
  const yearCount = TEST_END - TEST_START + 1;

  let totalDays = 0;
  let totalHits = 0;
  let noHit = 0;
  for (const result of results) {
    totalDays = totalDays + result.day;
    totalHits = totalHits + result.hits;
    if (result.hits === 0) noHit = noHit + 1;
  }

  const byYear = [];
  for (let i = 0; i < yearCount; i++) {
    const hitCount = results.filter((r) => r.testYears[i].hit).length;
    byYear.push({ year: TEST_START + i, rate: results.length > 0 ? hitCount / results.length : 0 });
  }

  return {
    averageDay: results.length > 0 ? totalDays / results.length : 0,
    frostRate: results.length > 0 ? totalHits / (results.length * yearCount) : 0,
    countiesWithNoHit: noHit,
    counties: results.length,
    byYear: byYear,
  };
}
