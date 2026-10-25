// Energy meters over a period, from the recorder's long-term statistics: what each meter counted
// in the period's buckets (`change`, in kWh whatever the meter's unit: Home Assistant converts) and
// its reading at the end of the last compiled hour (`base`). What the meter counted since then is
// its live state minus that reading (liveTail), so a period total is live without a fetch.
import type { PeriodRange } from "./calendar.ts";
import type { HomeAssistant, StatisticMetadata, StatisticsPeriod, StatisticsResult } from "./ha.ts";

// an energy unit in kWh (the units Home Assistant's energy unit class knows)
export const ENERGY_TO_KWH: Record<string, number> = {
  mWh: 1e-6,
  Wh: 1e-3,
  kWh: 1,
  MWh: 1e3,
  GWh: 1e6,
  TWh: 1e9,
  J: 1 / 3.6e6,
  kJ: 1 / 3600,
  MJ: 1 / 3.6,
  GJ: 1000 / 3.6,
  cal: 1.163e-6,
  kcal: 1.163e-3,
  Mcal: 1.163,
  Gcal: 1163,
};

export interface MeterPeriod {
  rows: { start: number; end: number; change: number }[]; // the period's compiled buckets
  base: number | null; // kWh: the reading at the end of the last compiled hour (null: none yet)
}

export const fetchStatistics = (
  hass: HomeAssistant,
  ids: string[],
  start: number,
  end: number | null,
  period: StatisticsPeriod,
  types: ("change" | "state" | "sum")[],
) =>
  hass.callWS<StatisticsResult | undefined>({
    type: "recorder/statistics_during_period",
    start_time: new Date(start).toISOString(),
    ...(end === null ? {} : { end_time: new Date(end).toISOString() }),
    statistic_ids: ids,
    period,
    types,
    units: { energy: "kWh" },
  });

// the meters that have long-term statistics with a sum (a meter without `state_class` has none)
export const fetchCounted = async (hass: HomeAssistant, ids: string[]) => {
  const res = await hass.callWS<StatisticMetadata[] | undefined>({
    type: "recorder/get_statistics_metadata",
    statistic_ids: ids,
  });
  return new Set((res ?? []).filter((m) => m.has_sum).map((m) => m.statistic_id));
};

// Every meter's buckets in the period and its last compiled reading. A running period whose
// first hour is not compiled yet has no rows: the reading at its start comes from the hour
// before it.
export const fetchMeterPeriods = async (
  hass: HomeAssistant,
  ids: string[],
  r: PeriodRange,
): Promise<Map<string, MeterPeriod>> => {
  const out = new Map<string, MeterPeriod>();
  if (!ids.length) return out;
  const res =
    (await fetchStatistics(hass, ids, r.start, r.open ? null : r.end, r.granularity, [
      "change",
      "state",
    ])) ?? {};
  const missing: string[] = [];
  for (const id of ids) {
    const rows = (res[id] ?? []).filter((v) => v.start < r.end);
    const last = rows[rows.length - 1];
    out.set(id, {
      rows: rows.map((v) => ({ start: v.start, end: v.end, change: v.change ?? 0 })),
      base: last?.state ?? null,
    });
    if (!rows.length && r.open) missing.push(id);
  }
  if (missing.length) {
    const edge =
      (await fetchStatistics(hass, missing, r.start - 3600e3, r.start, "hour", ["state"])) ?? {};
    for (const id of missing) {
      const rows = edge[id] ?? [];
      const state = rows[rows.length - 1]?.state;
      if (state !== undefined && state !== null) out.set(id, { rows: [], base: state });
    }
  }
  return out;
};

// What a meter counted since its last compiled reading. A meter that went down by more than a
// tenth was reset (a daily meter at midnight, a replaced device): it counted from 0 since; a
// smaller dip is noise.
export const liveTail = (base: number | null, cur: number | null): number => {
  if (base === null || cur === null || !Number.isFinite(cur)) return 0;
  const d = cur - base;
  if (d >= 0) return d;
  return cur < base * 0.9 ? Math.max(0, cur) : 0;
};
