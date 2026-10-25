import { describe, expect, it, vi } from "vitest";
import { rangeAt, zonedMidnight } from "../../../src/shared/calendar.ts";
import type { HomeAssistant, StatisticsResult } from "../../../src/shared/ha.ts";
import {
  ENERGY_TO_KWH,
  fetchCounted,
  fetchMeterPeriods,
  liveTail,
} from "../../../src/shared/statistics.ts";

const BERLIN = "Europe/Berlin";
const HOUR = 3600e3;

// a hass whose callWS answers each call with the next answer
const hassAnswering = (...answers: unknown[]) => {
  const callWS = vi.fn();
  for (const a of answers) callWS.mockResolvedValueOnce(a);
  return { hass: { callWS } as unknown as HomeAssistant, callWS };
};

describe("statistics: the live tail", () => {
  it("is what the meter counted since its last compiled reading", () => {
    expect(liveTail(100, 103.5)).toBe(3.5);
    expect(liveTail(100, 100)).toBe(0);
  });

  it("counts from 0 after a reset and ignores a small dip", () => {
    // a daily meter at midnight, a replaced device: down by more than a tenth
    expect(liveTail(100, 2)).toBe(2);
    expect(liveTail(100, 0)).toBe(0);
    // noise
    expect(liveTail(100, 99.5)).toBe(0);
  });

  it("is nothing without a reading on either side", () => {
    expect(liveTail(null, 5)).toBe(0);
    expect(liveTail(5, null)).toBe(0);
    expect(liveTail(5, Number.NaN)).toBe(0);
  });

  it("knows the energy units in kWh", () => {
    expect(ENERGY_TO_KWH.Wh).toBe(1e-3);
    expect(ENERGY_TO_KWH.MWh).toBe(1e3);
    expect(ENERGY_TO_KWH.GJ).toBeCloseTo(277.78, 2);
  });
});

describe("statistics: fetching a period", () => {
  const now = new Date("2026-06-21T10:30:00Z").getTime();
  const today = rangeAt("day", now, now, BERLIN);

  it("asks for the period's buckets in kWh, open to now while it runs", async () => {
    const rows: StatisticsResult = {
      "sensor.a": [
        { start: today.start, end: today.start + HOUR, change: 1.5, state: 101.5 },
        { start: today.start + HOUR, end: today.start + 2 * HOUR, change: 0.5, state: 102 },
      ],
    };
    const { hass, callWS } = hassAnswering(rows);
    const out = await fetchMeterPeriods(hass, ["sensor.a"], today);
    expect(callWS).toHaveBeenCalledTimes(1);
    expect(callWS.mock.calls[0][0]).toEqual({
      type: "recorder/statistics_during_period",
      start_time: new Date(today.start).toISOString(),
      statistic_ids: ["sensor.a"],
      period: "hour",
      types: ["change", "state"],
      units: { energy: "kWh" },
    });
    // the last compiled reading is the base of the live tail
    expect(out.get("sensor.a")).toEqual({
      rows: [
        { start: today.start, end: today.start + HOUR, change: 1.5 },
        { start: today.start + HOUR, end: today.start + 2 * HOUR, change: 0.5 },
      ],
      base: 102,
    });
  });

  it("ends a closed period at its end", async () => {
    const yesterday = rangeAt("day", today.start - 1, now, BERLIN);
    const { hass, callWS } = hassAnswering({});
    await fetchMeterPeriods(hass, ["sensor.a"], yesterday);
    expect(callWS.mock.calls[0][0]).toMatchObject({
      start_time: new Date(yesterday.start).toISOString(),
      end_time: new Date(yesterday.end).toISOString(),
    });
  });

  it("reads the start of a period whose first hour is not compiled from the hour before", async () => {
    const { hass, callWS } = hassAnswering(
      {},
      { "sensor.a": [{ start: today.start - HOUR, end: today.start, state: 99 }] },
    );
    const out = await fetchMeterPeriods(hass, ["sensor.a", "sensor.b"], today);
    expect(callWS.mock.calls[1][0]).toMatchObject({
      start_time: new Date(today.start - HOUR).toISOString(),
      end_time: new Date(today.start).toISOString(),
      statistic_ids: ["sensor.a", "sensor.b"],
      period: "hour",
      types: ["state"],
    });
    expect(out.get("sensor.a")).toEqual({ rows: [], base: 99 });
    // a meter with nothing at all yet: no base
    expect(out.get("sensor.b")).toEqual({ rows: [], base: null });
  });

  it("buckets a week by its days", async () => {
    const week = rangeAt("week", now, now, BERLIN);
    const { hass, callWS } = hassAnswering({});
    await fetchMeterPeriods(hass, ["sensor.a"], week);
    expect(callWS.mock.calls[0][0]).toMatchObject({
      start_time: new Date(zonedMidnight(2026, 6, 15, BERLIN)).toISOString(),
      period: "day",
    });
  });

  it("knows the meters that have long-term statistics", async () => {
    const { hass } = hassAnswering([
      { statistic_id: "sensor.a", has_sum: true, statistics_unit_of_measurement: "kWh" },
      { statistic_id: "sensor.b", has_sum: false, statistics_unit_of_measurement: "W" },
    ]);
    expect([...(await fetchCounted(hass, ["sensor.a", "sensor.b", "sensor.c"]))]).toEqual([
      "sensor.a",
    ]);
  });
});
