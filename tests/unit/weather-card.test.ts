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
  it("is a tile with only the entity and a hero once there is more to show", () => {
    const tile = normalizeWeatherCardConfig({ entity: W, name: "Home" });
    expect(tile).toMatchObject({ layout: "tile", hasHeader: false, attrGroup: null, sections: [] });
    expect(tile.entities.map((e) => e.valueSrc)).toEqual([
      { kind: "state" },
      { kind: "attribute", key: "temperature" },
      { kind: "attribute", key: "precipitation" },
      { kind: "attribute", key: "precipitation_probability" },
      { kind: "attribute", key: "wind_speed" },
    ]);
    expect(normalizeWeatherCardConfig({ entity: W, title: "Home" }).layout).toBe("hero");
    expect(normalizeWeatherCardConfig({ entity: W, attributes: ["humidity"] }).layout).toBe("hero");
    expect(normalizeWeatherCardConfig({ entity: W, sections: [{ type: "daily" }] }).layout).toBe(
      "hero",
    );
    expect(normalizeWeatherCardConfig({ entity: W, title: "x", layout: "tile" }).layout).toBe(
      "tile",
    );
    expect(() => normalizeWeatherCardConfig({ entity: W, layout: "wide" })).toThrow(
      /layout must be one of tile \| hero/,
    );
  });
  it("puts the rules on the condition and the temperature rules on the temperature", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      color: "amber",
      rules: [{ state: "rainy", color: "blue", tint_card: true }],
      temperature_rules: [{ below: 5, color: "indigo", label: "Cold" }],
      tap_action: "none",
    });
    const cond = c.entities[c.condIdx],
      temp = c.entities[c.tempIdx];
    expect(cond).toMatchObject({ color: "amber", rules: [{ state: "rainy", tintCard: true }] });
    expect(cond.tap).toEqual({ action: "none" });
    expect(temp.rules).toEqual([
      {
        below: 5,
        above: null,
        state: null,
        color: "indigo",
        icon: null,
        label: "Cold",
        tintCard: false,
      },
    ]);
  });
  it("turns attribute names into translated items of the weather entity and keeps entities", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      attributes: [
        "humidity",
        "apparent_temperature",
        "something_else",
        { entity: "sensor.uv_index", name: "UV" },
        { attribute: "visibility", decimals: 0 },
      ],
    });
    expect(c.attrGroup).toMatchObject({ layout: "row", idxs: [5, 6, 7, 8, 9], align: "stretch" });
    const [hum, feels, other, uv, vis] = c.attrGroup!.idxs.map((i) => c.entities[i]);
    expect(hum).toMatchObject({
      entity: W,
      valueSrc: { kind: "attribute", key: "humidity" },
      icon: "mdi:water-percent",
      unit: "%",
      nameKey: "weather.attr.humidity",
      item: { showName: true, showValue: true, showIcon: true, namePosition: "below" },
    });
    expect(feels).toMatchObject({ unitAttr: "temperature_unit", unit: null });
    expect(other).toMatchObject({ name: "something_else" });
    expect(other.nameKey).toBeUndefined();
    expect(uv).toMatchObject({ entity: "sensor.uv_index", name: "UV" });
    expect(vis).toMatchObject({ entity: W, valueSrc: { kind: "attribute", key: "visibility" } });
    const list = normalizeWeatherCardConfig({
      entity: W,
      attributes: ["humidity"],
      attributes_layout: "list",
    });
    expect(list.attrGroup).toMatchObject({ layout: "list", align: "start" });
    expect(() =>
      normalizeWeatherCardConfig({
        entity: W,
        attributes: ["humidity"],
        attributes_layout: "grid",
      }),
    ).toThrow(/attributes_layout/);
  });
  it("normalises the sections with their defaults and limits", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [
        { type: "hourly" },
        { type: "hourly", hours_to_show: 99, visual: "columns", show: ["wind", "nope", "wind"] },
        { type: "daily", days: 0, layout: "chart", show: [] },
        { title: "Garden", layout: "row", entities: ["sensor.a"] },
      ],
    });
    expect(c.sections[0]).toEqual({
      kind: "hourly",
      hours: 12,
      bucketMin: 60,
      visual: "chart",
      show: ["temperature", "precipitation"],
      quantity: null,
      title: null,
    });
    expect(c.sections[1]).toMatchObject({ hours: 48, visual: "columns", show: ["wind"] });
    expect(c.sections[2]).toEqual({
      kind: "daily",
      days: 1,
      layout: "chart",
      show: ["probability"],
    });
    expect(c.sections[3]).toMatchObject({
      kind: "entities",
      title: "Garden",
      group: { layout: "row" },
    });
    expect(c.groups).toHaveLength(1);
    expect(
      c.entities[c.sections[3].kind === "entities" ? c.sections[3].group.idxs[0] : 0].entity,
    ).toBe("sensor.a");
    expect(wantedForecasts(c)).toEqual({ hourly: true, daily: true });
    expect(wantedForecasts(normalizeWeatherCardConfig({ entity: W }))).toEqual({
      hourly: false,
      daily: false,
    });
    expect(() => normalizeWeatherCardConfig({ entity: W, sections: [{ type: "weekly" }] })).toThrow(
      /sections\[0\].type/,
    );
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "hourly", visual: "strip" }] }),
    ).toThrow(/visual must be one of/);
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "daily", layout: "table" }] }),
    ).toThrow(/layout must be one of/);
    expect(() => normalizeWeatherCardConfig({ entity: W, sections: [{ layout: "row" }] })).toThrow(
      /entities/,
    );
  });
  it("makes one quantity its own hourly section with a title", () => {
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [
        { type: "temperature" },
        { type: "wind", hours_to_show: 24, visual: "sparkline", title: "Breeze", show: ["rain"] },
        { type: "probability", visual: "columns" },
      ],
    });
    expect(c.sections[0]).toEqual({
      kind: "hourly",
      hours: 12,
      bucketMin: 60,
      visual: "chart",
      show: ["temperature"],
      quantity: "temperature",
      title: null,
    });
    expect(c.sections[1]).toMatchObject({
      kind: "hourly",
      hours: 24,
      visual: "sparkline",
      show: ["wind"],
      quantity: "wind",
      title: "Breeze",
    });
    expect(c.sections[2]).toMatchObject({ show: ["probability"], quantity: "probability" });
    expect(wantedForecasts(c)).toEqual({ hourly: true, daily: true });
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "wind", visual: "strip" }] }),
    ).toThrow(/visual must be one of/);
  });
  it("puts header entities last and makes the header show", () => {
    const c = normalizeWeatherCardConfig({ entity: W, header_entities: ["sun.sun"] });
    expect(c.headerIdxs).toEqual([5]);
    expect(c).toMatchObject({ hasHeader: true, layout: "hero" });
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
