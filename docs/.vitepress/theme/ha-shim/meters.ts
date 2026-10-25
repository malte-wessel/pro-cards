// The demo home's energy meters: an hour-by-hour simulation from the first of January last year
// (solar with its seasons and cloudy days, a heat pump that works harder in winter, a washer, an
// EV, an office, a 10 kWh battery between them and the grid, the heat the heat pump makes), the
// meters' readings at any moment (live within the hour) and their long-term statistics as
// `recorder/statistics_during_period` returns them. Deterministic: the same hour always gives the
// same numbers.
import { ENERGY_TO_KWH } from "../../../../src/shared/statistics.ts";
import type {
  StatisticMetadata,
  StatisticsResult,
  StatisticValue,
} from "../../../../src/shared/ha.ts";

const HOUR = 3600e3;

// what an hour of the demo home measured, in kWh
interface Hour {
  solar: number;
  home: number;
  import: number;
  export: number;
  charge: number;
  discharge: number;
  heatPump: number;
  washer: number;
  ev: number;
  office: number;
  heat: number;
  ground: number;
  upper: number;
  water: number;
}

export interface MeterDef {
  id: string;
  name: string;
  unit: "Wh" | "kWh" | "MWh";
  of: keyof Hour;
  icon?: string;
}
// the heat pump's power meter counts in Wh, its heat meter in MWh: the cards convert
export const METERS: MeterDef[] = [
  { id: "sensor.solar_energy", name: "Solar energy", unit: "kWh", of: "solar" },
  { id: "sensor.home_energy", name: "Home energy", unit: "kWh", of: "home" },
  { id: "sensor.grid_import_energy", name: "Grid import", unit: "kWh", of: "import" },
  { id: "sensor.grid_export_energy", name: "Grid export", unit: "kWh", of: "export" },
  { id: "sensor.battery_charge_energy", name: "Battery charge", unit: "kWh", of: "charge" },
  {
    id: "sensor.battery_discharge_energy",
    name: "Battery discharge",
    unit: "kWh",
    of: "discharge",
  },
  {
    id: "sensor.heat_pump_energy",
    name: "Heat pump energy",
    unit: "Wh",
    of: "heatPump",
    icon: "mdi:heat-pump",
  },
  {
    id: "sensor.washer_energy",
    name: "Washer energy",
    unit: "kWh",
    of: "washer",
    icon: "mdi:washing-machine",
  },
  {
    id: "sensor.ev_charger_energy",
    name: "EV charger energy",
    unit: "kWh",
    of: "ev",
    icon: "mdi:ev-station",
  },
  {
    id: "sensor.office_energy",
    name: "Office energy",
    unit: "kWh",
    of: "office",
    icon: "mdi:desk",
  },
  {
    id: "sensor.heat_pump_heat_energy",
    name: "Heat pump heat",
    unit: "MWh",
    of: "heat",
    icon: "mdi:heat-pump",
  },
  {
    id: "sensor.heating_ground_floor_energy",
    name: "Ground floor heating",
    unit: "kWh",
    of: "ground",
    icon: "mdi:radiator",
  },
  {
    id: "sensor.heating_upper_floor_energy",
    name: "Upper floor heating",
    unit: "kWh",
    of: "upper",
    icon: "mdi:radiator",
  },
  {
    id: "sensor.hot_water_energy",
    name: "Hot water heat",
    unit: "kWh",
    of: "water",
    icon: "mdi:water-boiler",
  },
];
const BY_ID = new Map(METERS.map((m) => [m.id, m]));
export const isMeter = (id: string) => BY_ID.has(id);

// deterministic pseudo random (as the world's)
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const rand = (s: string) => {
  let seed = hash(s);
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// the simulation's first hour: local midnight on the first of January last year
const ORIGIN = new Date(new Date().getFullYear() - 1, 0, 1).getTime();
const hours: Hour[] = [];
const cum = new Map<keyof Hour, number[]>(); // per quantity: what the meter counted before hour n
let soc = 5; // kWh in the battery

const simulate = (n: number): Hour => {
  const t = ORIGIN + n * HOUR,
    d = new Date(t);
  const h = d.getHours() + 0.5;
  const day = d.toDateString();
  const doy = Math.floor((t - new Date(d.getFullYear(), 0, 1).getTime()) / 86400e3);
  // 1 in midsummer, 0.1 in midwinter
  const season = 0.55 + 0.45 * Math.cos((2 * Math.PI * (doy - 172)) / 365);
  const cloud = rand(`cloud ${day}`);
  const solar =
    Math.max(0, Math.sin(((h - 6) / 13) * Math.PI)) *
    4.2 *
    (0.3 + 0.7 * cloud) *
    (0.2 + 0.8 * season);
  const heatPump =
    (0.15 + (0.3 * (1 + Math.cos((2 * Math.PI * (h - 5)) / 24))) / 2) * (1.7 - 1.4 * season);
  const washer = rand(`washer ${day}`) < 0.45 && Math.floor(h) === 10 ? 0.9 : 0;
  const ev = rand(`ev ${day}`) < 0.3 && h > 19 && h < 22 ? 3.6 : 0;
  const weekday = d.getDay() >= 1 && d.getDay() <= 5;
  const office = weekday && h > 8 && h < 17 ? 0.17 : 0.02;
  const rest = 0.22 + (h > 6 && h < 9 ? 0.54 : h > 17 && h < 22 ? 0.84 : 0);
  const home = heatPump + washer + ev + office + rest;
  const surplus = solar - home;
  const charge = Math.min(Math.max(surplus, 0), 3, 10 - soc);
  const discharge = Math.min(Math.max(-surplus, 0), 3, soc - 1);
  soc += charge * 0.95 - discharge;
  const heat = heatPump * 3.4;
  return {
    solar,
    home,
    import: Math.max(-surplus, 0) - discharge,
    export: Math.max(surplus, 0) - charge,
    charge,
    discharge,
    heatPump,
    washer,
    ev,
    office,
    heat,
    ground: heat * 0.45,
    upper: heat * 0.33,
    water: heat * 0.22,
  };
};
// the hours up to n, simulated once
const upTo = (n: number) => {
  while (hours.length <= n) {
    const hr = simulate(hours.length);
    hours.push(hr);
    for (const k of Object.keys(hr) as (keyof Hour)[]) {
      let c = cum.get(k);
      if (!c) cum.set(k, (c = [0]));
      c.push(c[c.length - 1] + hr[k]);
    }
  }
};
const hourOf = (t: number) => Math.max(0, Math.floor((t - ORIGIN) / HOUR));
// a meter's own offset, so every reading is a plausible lifetime total
const offset = (m: MeterDef) => 1000 + (hash(m.id) % 5000);

// what the meter counted up to an instant (kWh), live within the hour
const countedAt = (m: MeterDef, t: number) => {
  const n = hourOf(t);
  upTo(n);
  const frac = Math.min(1, Math.max(0, (t - (ORIGIN + n * HOUR)) / HOUR));
  return offset(m) + cum.get(m.of)![n] + hours[n][m.of] * frac;
};
// the meter's reading at an instant, in its own unit
export const readingAt = (id: string, t: number) => {
  const m = BY_ID.get(id);
  return m ? countedAt(m, t) / ENERGY_TO_KWH[m.unit] : NaN;
};

// The meters' long-term statistics: the compiled hours (an hour is compiled once it ended) in the
// window, merged into local days, weeks (from Monday) or months; `change` what the meter counted in
// the bucket, `state` / `sum` at its end; in `unit` (the meters' own without one)
export const statistics = (
  ids: string[],
  start: number,
  end: number,
  period: string,
  types: string[],
  unit: string | undefined,
  now: number,
): StatisticsResult => {
  if (!["hour", "day", "week", "month"].includes(period))
    throw new Error(`unsupported period ${period}`);
  const out: StatisticsResult = {};
  const last = Math.min(hourOf(end), hourOf(now)); // the hours before it are compiled
  const first = Math.max(0, Math.ceil((start - ORIGIN) / HOUR));
  if (last <= first) return out;
  upTo(last);
  const bucketOf = (t: number) => {
    const d = new Date(t);
    if (period === "hour") return t;
    if (period === "month") return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const mid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (period === "week") mid.setDate(mid.getDate() - ((d.getDay() + 6) % 7));
    return mid.getTime();
  };
  const endOf = (b: number) => {
    const d = new Date(b);
    if (period === "hour") return b + HOUR;
    if (period === "month") return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() + (period === "week" ? 7 : 1),
    ).getTime();
  };
  for (const id of ids) {
    const m = BY_ID.get(id);
    if (!m) continue;
    const k = unit ? (ENERGY_TO_KWH[unit] ?? 1) : ENERGY_TO_KWH[m.unit];
    const c = cum.get(m.of)!;
    const rows = new Map<number, StatisticValue>();
    for (let n = first; n < last; n++) {
      const t = ORIGIN + n * HOUR;
      const b = bucketOf(t);
      const sum = c[n + 1] / k;
      const row = rows.get(b) ?? { start: b, end: endOf(b), change: 0 };
      row.change = (row.change ?? 0) + hours[n][m.of] / k;
      row.sum = sum;
      row.state = (offset(m) + c[n + 1]) / k;
      rows.set(b, row);
    }
    out[id] = [...rows.values()].map((r) => {
      const v: StatisticValue = { start: r.start, end: r.end };
      if (types.includes("change")) v.change = r.change;
      if (types.includes("state")) v.state = r.state;
      if (types.includes("sum")) v.sum = r.sum;
      return v;
    });
  }
  return out;
};

export const statisticsMetadata = (ids: string[]): StatisticMetadata[] =>
  ids.flatMap((id) => {
    const m = BY_ID.get(id);
    return m ? [{ statistic_id: id, statistics_unit_of_measurement: m.unit, has_sum: true }] : [];
  });
