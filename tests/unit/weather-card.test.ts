import { describe, it, expect } from "vitest";
import { WeatherCard } from "../../src/weather-card.ts";
import { normalizeWeatherCardConfig, wantedForecasts } from "../../src/weather/config.ts";
import { conditionIcon, conditionText, isNight } from "../../src/weather/conditions.ts";
import {
  dailyRange,
  dailyTypeOf,
  daysOf,
  forecastPoints,
  hourlyWindow,
  hoursIn,
  hoursOf,
  supportsForecast,
} from "../../src/weather/forecast.ts";
import type { ForecastEntry, HassEntity, HomeAssistant } from "../../src/shared/ha.ts";

const W = "weather.home";
const st = (attributes: Record<string, unknown>, state = "sunny") =>
  ({ entity_id: W, state, attributes }) as unknown as HassEntity;
const hass = (states: Record<string, HassEntity>, language = "en") =>
  ({ states, locale: { language } }) as unknown as HomeAssistant;

describe("weather-card config", () => {
  it("is registered and needs a weather entity", () => {
    expect(customElements.get("weather-card")).toBe(WeatherCard);
    expect(window.customCards?.some((c) => c.type === "weather-card")).toBe(true);
    expect(() => normalizeWeatherCardConfig(null)).toThrow(/invalid config/);
    expect(() => normalizeWeatherCardConfig({})).toThrow(/weather entity/);
    expect(() => normalizeWeatherCardConfig({ entity: "sensor.a" })).toThrow(/weather entity/);
  });
  it("is a tile without sections and carries the card's items first", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      name: "Home",
      color: "amber",
      rules: [{ state: "rainy", color: "blue", tint_card: true }],
      temperature_rules: [{ below: 5, color: "indigo", label: "Cold" }],
      tap_action: "none",
    });
    expect(c).toMatchObject({ layout: "tile", hasHeader: false, sections: [], groups: [] });
    expect(c.entities.map((e) => e.valueSrc)).toEqual([
      { kind: "state" },
      { kind: "attribute", key: "temperature" },
      { kind: "attribute", key: "precipitation" },
      { kind: "attribute", key: "precipitation_probability" },
      { kind: "attribute", key: "wind_speed" },
    ]);
    expect(c.entities[c.condIdx]).toMatchObject({
      name: "Home",
      color: "amber",
      rules: [{ state: "rainy", tintCard: true }],
      tap: { action: "none" },
    });
    expect(c.entities[c.tempIdx].rules).toMatchObject([
      { below: 5, color: "indigo", label: "Cold" },
    ]);
    expect(wantedForecasts(c)).toEqual({ hourly: false, daily: true });
    expect(normalizeWeatherCardConfig({ entity: W, title: "x" })).toMatchObject({
      layout: "tile",
      hasHeader: true,
    });
  });
  it("rejects unknown section types and needs a type", () => {
    expect(() => normalizeWeatherCardConfig({ entity: W, sections: [{ type: "hourly" }] })).toThrow(
      /sections\[0\].type must be one of hero \| row/,
    );
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ entities: ["humidity"] }] }),
    ).toThrow(/sections\[0\].type/);
  });
  it("hero sections take name / secondary overrides and their own rules", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      rules: [{ state: "rainy", color: "blue" }],
      sections: [
        { type: "hero" },
        {
          type: "hero",
          title: "Garden",
          name: "Garden",
          secondary: "x",
          temperature_rules: [{ above: 0, color: "red" }],
        },
      ],
    });
    expect(c.layout).toBe("sections");
    expect(c.sections[0]).toEqual({
      kind: "hero",
      title: null,
      name: null,
      secondary: null,
      condIdx: 0,
      tempIdx: 1,
      divider: false,
    });
    expect(c.sections[1]).toMatchObject({
      kind: "hero",
      title: "Garden",
      name: "Garden",
      secondary: "x",
      condIdx: 5,
      tempIdx: 6,
    });
    // the section's pair: the card's condition rules (not overridden) and its own temperature rules
    expect(c.entities[5].rules).toMatchObject([{ state: "rainy" }]);
    expect(c.entities[6].rules).toMatchObject([{ above: 0, color: "red" }]);
    expect(c.entities[6].valueSrc).toEqual({ kind: "attribute", key: "temperature" });
  });
  it("group sections are entity groups whose entries may name weather attributes", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [
        {
          type: "row",
          title: "Now",
          entities: [
            "humidity",
            "apparent_temperature",
            "something_else",
            "sensor.uv_index",
            { attribute: "visibility", decimals: 0 },
            { entity: "sensor.a", name: "A", visual: "ring" },
          ],
        },
        { type: "table", entities: ["pressure"], align: "start" },
        { type: "grid", columns: 3, entities: ["humidity", "wind_speed"] },
        { type: "column", entities: ["cloud_coverage"] },
        { type: "list", divider: true, entities: ["dew_point"] },
      ],
    });
    expect(c.sections.map((s) => s.kind)).toEqual([
      "entities",
      "entities",
      "entities",
      "entities",
      "entities",
    ]);
    const row = c.sections[0];
    if (row.kind !== "entities") throw new Error();
    expect(row.title).toBe("Now");
    expect(row.group).toMatchObject({ layout: "row", align: "stretch", idxs: [5, 6, 7, 8, 9, 10] });
    const [hum, feels, other, uv, vis, a] = row.group.idxs.map((i) => c.entities[i]);
    expect(hum).toMatchObject({
      entity: W,
      valueSrc: { kind: "attribute", key: "humidity" },
      icon: "mdi:water-percent",
      unit: "%",
      nameKey: "weather.attr.humidity",
      item: { showName: true, showValue: true, showIcon: true, namePosition: "below" },
    });
    expect(feels).toMatchObject({ unitAttr: "temperature_unit", unit: null });
    expect(other).toMatchObject({ entity: W, name: "something_else" });
    expect(other.nameKey).toBeUndefined();
    expect(uv).toMatchObject({ entity: "sensor.uv_index", valueSrc: { kind: "state" } });
    expect(vis).toMatchObject({
      entity: W,
      valueSrc: { kind: "attribute", key: "visibility" },
      decimals: 0,
    });
    expect(a).toMatchObject({ entity: "sensor.a", name: "A", visual: "ring" });
    expect(c.groups).toHaveLength(5);
    expect(c.groups[1]).toMatchObject({ layout: "table", align: "start" });
    expect(c.groups[2]).toMatchObject({ layout: "grid", columns: 3 });
    expect(c.groups[4]).toMatchObject({ layout: "list", divider: true });
    expect(() => normalizeWeatherCardConfig({ entity: W, sections: [{ type: "row" }] })).toThrow(
      /entities/,
    );
  });
  it("forecast sections: mode, layout, count, rain figures, rules", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [
        { type: "forecast" },
        {
          type: "forecast",
          mode: "hourly",
          hours_to_show: 99,
          layout: "horizontal",
          show: [],
          divider: true,
        },
        {
          type: "forecast",
          days: 0,
          show: ["precipitation", "nope", "precipitation"],
          rules: [{ state: "rainy", icon: "mdi:umbrella" }],
        },
      ],
    });
    expect(c.sections[0]).toEqual({
      kind: "forecast",
      mode: "daily",
      layout: "vertical",
      count: 7,
      show: ["probability"],
      title: null,
      condIdx: 0,
      tempIdx: 1,
      divider: false,
    });
    expect(c.sections[1]).toMatchObject({
      mode: "hourly",
      layout: "horizontal",
      count: 48,
      show: [],
    });
    expect(c.sections[2]).toMatchObject({
      count: 1,
      show: ["precipitation"],
      condIdx: 5,
      tempIdx: 6,
    });
    expect(c.entities[5].rules).toMatchObject([{ state: "rainy", icon: "mdi:umbrella" }]);
    expect(wantedForecasts(c)).toEqual({ hourly: true, daily: true });
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "forecast", mode: "weekly" }] }),
    ).toThrow(/mode must be one of hourly \| daily/);
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "forecast", layout: "grid" }] }),
    ).toThrow(/layout must be one of vertical \| horizontal/);
  });
  it("trend sections: the multi trend options and show entries", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [
        { type: "trend" },
        {
          type: "trend",
          mode: "hourly",
          hours_to_show: 6,
          title: "Soon",
          layout: "lanes",
          x_axis: false,
          y_axis: true,
          show_legend: false,
          show: [
            { quantity: "wind", name: "Breeze", color: "teal" },
            "temperature",
            { quantity: "nope" },
            "wind",
            { quantity: "temperature", color: 3 },
          ],
          temperature_rules: [{ above: 25, color: "red" }],
        },
      ],
    });
    expect(c.sections[0]).toEqual({
      kind: "trend",
      mode: "daily",
      count: 7,
      show: [
        { quantity: "temperature", name: null, color: null },
        { quantity: "precipitation", name: null, color: null },
      ],
      layout: "auto",
      xAxis: true,
      yAxis: false,
      showLegend: true,
      title: null,
      condIdx: 0,
      tempIdx: 1,
      divider: false,
    });
    expect(c.sections[1]).toMatchObject({
      mode: "hourly",
      count: 6,
      title: "Soon",
      layout: "lanes",
      xAxis: false,
      yAxis: true,
      showLegend: false,
      show: [
        { quantity: "wind", name: "Breeze", color: "teal" },
        { quantity: "temperature", name: null, color: null },
      ],
      tempIdx: 6,
    });
    expect(wantedForecasts(c)).toEqual({ hourly: true, daily: true });
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "trend", layout: "stack" }] }),
    ).toThrow(/layout must be one of auto \| overlay \| lanes/);
  });
  it("puts header entities last", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      header_entities: ["sun.sun"],
      sections: [{ type: "hero" }, { type: "row", entities: ["humidity"] }],
    });
    expect(c.headerIdxs).toEqual([6]);
    expect(c.hasHeader).toBe(true);
  });
});

describe("conditions", () => {
  it("maps conditions to icons with night variants and translated names", () => {
    expect(conditionIcon("rainy")).toBe("mdi:weather-rainy");
    expect(conditionIcon("sunny")).toBe("mdi:weather-sunny");
    expect(conditionIcon("sunny", true)).toBe("mdi:weather-night");
    expect(conditionIcon("partlycloudy", true)).toBe("mdi:weather-night-partly-cloudy");
    expect(conditionIcon("unknown")).toBe("mdi:help-circle-outline");
    expect(conditionText(hass({}), "lightning-rainy")).toBe("Thunderstorms");
    expect(conditionText(hass({}, "de"), "partlycloudy")).toBe("Teilweise bewölkt");
    expect(conditionText(hass({}), "weird")).toBe("weird");
    expect(isNight(hass({ "sun.sun": st({}, "below_horizon") }))).toBe(true);
    expect(isNight(hass({}))).toBe(false);
  });
});

describe("forecast", () => {
  const H = 3600e3;
  const entry = (t: number, extra: Partial<ForecastEntry>): ForecastEntry => ({
    datetime: new Date(t).toISOString(),
    ...extra,
  });
  it("reads the supported forecast types", () => {
    expect(supportsForecast(st({ supported_features: 3 }), "hourly")).toBe(true);
    expect(supportsForecast(st({ supported_features: 1 }), "hourly")).toBe(false);
    expect(dailyTypeOf(st({ supported_features: 3 }))).toBe("daily");
    expect(dailyTypeOf(st({ supported_features: 6 }))).toBe("twice_daily");
    expect(dailyTypeOf(st({ supported_features: 2 }))).toBeNull();
    expect(dailyTypeOf(undefined)).toBeNull();
  });
  it("windows from the current hour and picks the entries inside", () => {
    const now = Date.UTC(2026, 5, 21, 12, 34);
    const { t0, t1 } = hourlyWindow(now, 3);
    expect(t0).toBe(Date.UTC(2026, 5, 21, 12));
    expect(t1).toBe(t0 + 3 * H);
    const fc = [4, 0, 1, 2, 3].map((i) => entry(t0 + i * H, { temperature: 10 + i }));
    expect(hoursIn(fc, t0, t1).map((e) => e.temperature)).toEqual([10, 11, 12]);
    expect(forecastPoints(fc, "temperature").map((p) => p.v)).toEqual([10, 11, 12, 13, 14]);
    expect(forecastPoints([entry(t0, { temperature: null })], "temperature")).toEqual([]);
    expect(forecastPoints(null, "temperature")).toEqual([]);
    expect(hoursOf(fc, now, 2)).toMatchObject([
      { t: t0, hi: 10, lo: null },
      { t: t0 + H, hi: 11, lo: null },
    ]);
    expect(hoursOf(undefined, now, 2)).toEqual([]);
  });
  it("summarises daily and twice-daily forecasts per day", () => {
    const d0 = new Date(2026, 5, 21, 12).getTime();
    const daily = [0, 1, 2].map((i) =>
      entry(d0 + i * 24 * H, {
        temperature: 20 + i,
        templow: 10 + i,
        precipitation_probability: 30,
      }),
    );
    expect(daysOf(daily, "daily", 2)).toMatchObject([
      { hi: 20, lo: 10, probability: 30 },
      { hi: 21, lo: 11 },
    ]);
    const twice = [
      entry(d0, {
        temperature: 20,
        precipitation: 1,
        precipitation_probability: 40,
        is_daytime: true,
        condition: "sunny",
      }),
      entry(d0 + 8 * H, {
        temperature: 9,
        precipitation: 2,
        precipitation_probability: 70,
        is_daytime: false,
        condition: "clear-night",
      }),
      entry(d0 + 24 * H, { temperature: 22, is_daytime: true }),
    ];
    expect(daysOf(twice, "twice_daily", 5)).toEqual([
      { t: d0, condition: "sunny", hi: 20, lo: 9, precipitation: 3, probability: 70, wind: null },
      {
        t: d0 + 24 * H,
        condition: null,
        hi: 22,
        lo: 22,
        precipitation: null,
        probability: null,
        wind: null,
      },
    ]);
    expect(dailyRange(daysOf(daily, "daily", 3))).toEqual({ min: 10, max: 22 });
    expect(dailyRange([])).toBeNull();
  });
});
