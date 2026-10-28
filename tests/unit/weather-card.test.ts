import { afterEach, describe, it, expect, vi } from "vitest";
import { WeatherCard } from "../../src/weather-card.ts";
import { normalizeWeatherCardConfig, wantedForecasts } from "../../src/weather/config.ts";
import { PICTURED, pictureSvg } from "../../src/weather/pictures.ts";
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
    expect(customElements.get("weather-card-pro")).toBe(WeatherCard);
    expect(window.customCards?.some((c) => c.type === "weather-card-pro")).toBe(true);
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
    // the tile shows no forecast, the hero does
    expect(wantedForecasts(c)).toEqual({ hourly: false, daily: false });
    expect(
      wantedForecasts(normalizeWeatherCardConfig({ entity: W, sections: [{ type: "hero" }] })),
    ).toEqual({ hourly: false, daily: true });
    expect(normalizeWeatherCardConfig({ entity: W, title: "x" })).toMatchObject({
      layout: "tile",
      hasHeader: true,
    });
  });
  it("rejects unknown section types; a section without type is a group like the sections card", () => {
    expect(() => normalizeWeatherCardConfig({ entity: W, sections: [{ type: "hourly" }] })).toThrow(
      /sections\[0\].type must be one of hero \| row/,
    );
    expect(() => normalizeWeatherCardConfig({ entity: W, sections: [{ title: "x" }] })).toThrow(
      /sections\[0\] needs a 'type' or 'entities'/,
    );
    expect(() =>
      normalizeWeatherCardConfig({
        entity: W,
        sections: [{ layout: "hero", entities: ["humidity"] }],
      }),
    ).toThrow(/sections\[0\].layout must be one of row \| list/);
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [{ entities: ["humidity"] }, { layout: "row", entities: ["wind_speed"] }],
    });
    expect(c.sections[0]).toMatchObject({ kind: "entities", group: { layout: "list" } });
    expect(c.sections[1]).toMatchObject({ kind: "entities", group: { layout: "row" } });
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
      visibility: null,
      kind: "hero",
      title: null,
      name: null,
      secondary: null,
      condIdx: 0,
      tempIdx: 1,
      divider: false,
      iconSize: 56,
      icons: { base: "hass", map: {} },
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
          hours: 99,
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
      visibility: null,
      kind: "forecast",
      mode: "daily",
      layout: "vertical",
      count: 7,
      show: ["probability"],
      title: null,
      condIdx: 0,
      tempIdx: 1,
      divider: false,
      iconSize: 22,
      icons: { base: "hass", map: {} },
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
          hours: 6,
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
      visibility: null,
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
    expect(
      normalizeWeatherCardConfig({
        entity: W,
        sections: [{ type: "trend", show: ["wind_speed", "precipitation_probability"] }],
      }).sections[0],
    ).toMatchObject({
      show: [
        { quantity: "wind", name: null, color: null },
        { quantity: "probability", name: null, color: null },
      ],
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
  it("icons: the hass pictures by default, mdi, or a map, per card or section; icon sizes", () => {
    const dflt = normalizeWeatherCardConfig({
      entity: W,
      sections: [{ type: "hero" }, { type: "forecast", icons: "mdi" }],
    });
    expect(dflt).toMatchObject({ icons: { base: "hass", map: {} }, iconSize: 36 });
    expect(dflt.sections[0]).toMatchObject({ iconSize: 56, icons: { base: "hass", map: {} } });
    expect(dflt.sections[1]).toMatchObject({ iconSize: 22, icons: { base: "mdi", map: {} } });
    // icon_style reaches the condition item, the card's and a section's own
    const plain = normalizeWeatherCardConfig({
      entity: W,
      icon_style: "plain",
      sections: [{ type: "hero", name: "Now" }],
    });
    expect(plain.entities[0].iconStyle).toBe("plain");
    const hero = plain.sections[0];
    expect("condIdx" in hero && hero.condIdx).toBe(5);
    if ("condIdx" in hero) expect(plain.entities[hero.condIdx].iconStyle).toBe("plain");
    const c = normalizeWeatherCardConfig({
      entity: W,
      icons: { rainy: "/local/rain.svg", sunny: "mdi:x", nope: "mdi:y", cloudy: "" },
      icon_size: 999,
      sections: [
        { type: "hero", icon_size: 1 },
        { type: "forecast", icon_size: "30" },
      ],
    });
    expect(c.icons).toEqual({ base: "hass", map: { rainy: "/local/rain.svg", sunny: "mdi:x" } });
    expect(c.iconSize).toBe(160);
    expect(c.sections[0]).toMatchObject({ iconSize: 12 });
    expect(c.sections[1]).toMatchObject({ iconSize: 30 });
    expect(normalizeWeatherCardConfig({ entity: W, icons: "mdi" }).icons).toEqual({
      base: "mdi",
      map: {},
    });
    // a section merges over the card: its map adds to the card's, a preset keeps the card's map
    const merged = normalizeWeatherCardConfig({
      entity: W,
      icons: { rainy: "mdi:r" },
      sections: [
        { type: "hero", icons: { sunny: "mdi:s" } },
        { type: "forecast", icons: "mdi" },
      ],
    });
    expect(merged.sections[0]).toMatchObject({
      icons: { base: "hass", map: { rainy: "mdi:r", sunny: "mdi:s" } },
    });
    expect(merged.sections[1]).toMatchObject({ icons: { base: "mdi", map: { rainy: "mdi:r" } } });
    expect(() => normalizeWeatherCardConfig({ entity: W, icons: "svg" })).toThrow(/icons must be/);
    expect(() => normalizeWeatherCardConfig({ entity: W, icons: ["hass"] })).toThrow(
      /icons must be/,
    );
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
  it("sections take visibility conditions that read the weather entity by default", () => {
    const rainy = [{ condition: "state", state: "rainy" }];
    const c = normalizeWeatherCardConfig({
      entity: W,
      sections: [
        { type: "hero", visibility: rainy },
        { type: "row", entities: ["humidity"], visibility: rainy },
        { type: "forecast", mode: "daily" },
      ],
    });
    const expected = [
      { kind: "state", entity: W, attribute: null, values: ["rainy"], negate: false },
    ];
    expect(c.sections.map((s) => s.visibility)).toEqual([expected, expected, null]);
    // an entity section's conditions are the section's, not its group's
    const group = c.sections[1].kind === "entities" ? c.sections[1].group : null;
    expect(group?.visibility).toBeNull();
    expect(() =>
      normalizeWeatherCardConfig({ entity: W, sections: [{ type: "hero", visibility: [{}] }] }),
    ).toThrow("'sections[0].visibility[0]' needs 'condition'");
  });
});

describe("pictures", () => {
  it("composes the Home Assistant pictures from their parts", () => {
    expect(PICTURED.size).toBe(14);
    expect(pictureSvg("exceptional")).toBeNull();
    expect(pictureSvg("nope")).toBeNull();
    const sunny = pictureSvg("sunny")!;
    expect(sunny).toContain('class="sun"');
    expect(sunny).not.toContain("cloud");
    expect(pictureSvg("sunny", true)).toContain('class="moon"');
    const rainy = pictureSvg("rainy")!;
    expect(rainy).toContain("cloud-back");
    expect(rainy).toContain("cloud-front");
    expect(rainy.match(/class="rain"/g)).toHaveLength(4);
    expect(pictureSvg("pouring")!.match(/class="rain"/g)).toHaveLength(6);
    expect(pictureSvg("lightning-rainy")).toContain('class="sun"');
    expect(pictureSvg("snowy-rainy")!.match(/class="snow"/g)).toHaveLength(3);
    expect(pictureSvg("windy")!.match(/cloud-back/g)).toHaveLength(3);
    expect(pictureSvg("partlycloudy", true)).toContain('class="moon"');
    expect(pictureSvg("clear-night")).not.toContain('class="sun"');
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

describe("weather forecast night icons", async () => {
  const { nightAt, rowNight } = await import("../../src/weather/conditions.ts");
  const LAT = 51.2277,
    LON = 6.7735; // Düsseldorf
  const at = (iso: string) => new Date(iso).getTime();
  const hass = { config: { latitude: LAT, longitude: LON } } as unknown as HomeAssistant;

  it("knows night from the sun's elevation at a place", () => {
    expect(nightAt(at("2026-06-21T12:00:00+02:00"), LAT, LON)).toBe(false);
    expect(nightAt(at("2026-06-21T23:30:00+02:00"), LAT, LON)).toBe(true);
    expect(nightAt(at("2026-12-21T17:30:00+01:00"), LAT, LON)).toBe(true);
  });

  it("gives a forecast day the day icon and an hour the night icon only while the sun is down", () => {
    const evening = at("2026-06-21T23:00:00+02:00"),
      morning = at("2026-06-22T09:00:00+02:00");
    // a day never takes the night variant, whatever the time
    expect(rowNight(hass, true, { t: evening })).toBe(false);
    // an hour follows the sun at that hour
    expect(rowNight(hass, false, { t: evening, daytime: null })).toBe(true);
    expect(rowNight(hass, false, { t: morning, daytime: null })).toBe(false);
    // the forecast's own is_daytime wins
    expect(rowNight(hass, false, { t: morning, daytime: false })).toBe(true);
    expect(rowNight(hass, false, { t: evening, daytime: true })).toBe(false);
    // no location: day
    expect(rowNight({ config: {} } as unknown as HomeAssistant, false, { t: evening })).toBe(false);
  });
});

describe("the date of a forecast day", async () => {
  const { entryDate, isTodayEntry } = await import("../../src/weather/forecast.ts");
  it("reads a stamp at UTC midnight as that UTC date, any other as its local date", () => {
    // the unit tests run in Berlin: UTC midnight is 02:00 there, the same date either way;
    // the e2e tests check New York, where it is the evening before
    expect(entryDate(Date.UTC(2026, 5, 22)).toDateString()).toBe(
      new Date(2026, 5, 22).toDateString(),
    );
    // local midnight (22:00 UTC the day before) and local noon: their local date
    expect(entryDate(new Date(2026, 5, 22).getTime()).getDate()).toBe(22);
    expect(entryDate(new Date(2026, 5, 22, 12).getTime()).getDate()).toBe(22);
    const now = new Date(2026, 5, 22, 10).getTime();
    expect(isTodayEntry(Date.UTC(2026, 5, 22), now)).toBe(true);
    expect(isTodayEntry(Date.UTC(2026, 5, 23), now)).toBe(false);
  });
});

describe("hover", () => {
  it("is the card's default for the condition and every section's entities; a section overrides it", () => {
    const c = normalizeWeatherCardConfig({
      entity: "weather.home",
      hover: true,
      sections: [
        { type: "hero" },
        { type: "row", hover: false, entities: ["humidity", { entity: "sensor.uv", hover: true }] },
      ],
    });
    expect(c.entities[c.condIdx].hover).toBe(true);
    const row = c.sections.find((s) => s.kind === "entities");
    expect(row?.kind === "entities" && row.group.idxs.map((i) => c.entities[i].hover)).toEqual([
      false,
      true,
    ]);
    expect(normalizeWeatherCardConfig({ entity: "weather.home" }).entities[0].hover).toBe(false);
  });
});

describe("weather-card poster", () => {
  it("is a layout with a 40 px lead unless icon_size says otherwise", () => {
    const c = normalizeWeatherCardConfig({ entity: W, layout: "poster" });
    expect(c).toMatchObject({ layout: "poster", iconSize: 40, sections: [] });
    expect(
      normalizeWeatherCardConfig({ entity: W, layout: "poster", icon_size: 64 }).iconSize,
    ).toBe(64);
    expect(normalizeWeatherCardConfig({ entity: W, layout: "tile" }).layout).toBe("tile");
    expect(() => normalizeWeatherCardConfig({ entity: W, layout: "hero" })).toThrow(
      "weather-card-pro: layout must be one of tile | poster",
    );
  });
  it("draws no sections and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = normalizeWeatherCardConfig({
      entity: W,
      layout: "poster",
      sections: [{ type: "hero" }],
    });
    expect(c.layout).toBe("poster");
    expect(warn).toHaveBeenCalledWith(
      "weather-card-pro: sections are not drawn on a poster (layout: poster)",
    );
    warn.mockRestore();
  });
  it("wants the hourly and the daily forecast", () => {
    expect(wantedForecasts(normalizeWeatherCardConfig({ entity: W, layout: "poster" }))).toEqual({
      hourly: true,
      daily: true,
    });
  });
  it("is three rows high, two at least", () => {
    const el = new WeatherCard();
    el.setConfig({ entity: W, layout: "poster" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 3, min_rows: 2 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ entity: W, layout: "poster", title: "Weather" });
    expect(el.getCardSize()).toBe(4);
  });

  // the forecasts the card subscribes to, answered by the test
  const H = 3600e3;
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00+00:00`;
  };
  const hourly = (n: number) => {
    const t0 = Date.now() - (Date.now() % H);
    return [...Array(n).keys()].map((i) => ({
      datetime: new Date(t0 + i * H).toISOString(),
      temperature: 14 + i,
      condition: "cloudy",
    }));
  };
  const daily = () => [{ datetime: today(), temperature: 18.4, templow: 9.2, condition: "rainy" }];
  const cards: WeatherCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  const mount = async (cfg: Record<string, unknown>, features = 3, hours = 4) => {
    const asked: string[] = [];
    const hass = {
      states: {
        [W]: {
          entity_id: W,
          state: "rainy",
          attributes: {
            friendly_name: "Home",
            temperature: 15.6,
            temperature_unit: "°C",
            supported_features: features,
          },
        },
      },
      locale: { language: "en" },
      config: { unit_system: { temperature: "°C" } },
      connection: {
        subscribeMessage: (
          cb: (msg: { forecast: unknown[] }) => void,
          msg: { forecast_type: string },
        ) => {
          asked.push(msg.forecast_type);
          const forecast = msg.forecast_type === "hourly" ? hourly(hours) : daily();
          return Promise.resolve().then(() => {
            cb({ forecast });
            return () => {};
          });
        },
      },
    } as unknown as HomeAssistant;
    const el = new WeatherCard();
    el.setConfig({ entity: W, layout: "poster", ...cfg });
    document.body.appendChild(el);
    el.hass = hass;
    cards.push(el);
    await new Promise((r) => setTimeout(r, 0));
    return { root: el.shadowRoot!.querySelector("ha-card") as HTMLElement, asked, el, hass };
  };
  it("draws the condition in the pill, the big temperature, today's high / low and the next hours", async () => {
    const { root, asked } = await mount({ name: "Garden" });
    expect(asked.sort()).toEqual(["daily", "hourly"]);
    expect(root.classList.contains("layout-poster")).toBe(true);
    const row = root.querySelector<HTMLElement>(".body > .row.poster")!;
    expect(row.querySelector(".ptop > .plead > .lead")).not.toBeNull();
    const pill = row.querySelector<HTMLElement>(".plabel")!;
    expect(pill.textContent).toBe("Rainy");
    expect(pill.hidden).toBe(false);
    expect(row.querySelector(".pname")!.textContent).toBe("Garden");
    expect(row.querySelector(".pvalue .big b")!.textContent).toBe("15.6");
    expect(row.querySelector(".pbody > .secondary")!.textContent).toBe("18° / 9°");
    const plot = row.querySelector<HTMLElement>(".pbody > .plot.ptrend")!;
    expect(plot.dataset.kind).toBe("sparkline");
    // no section of the tile or the sections layout
    expect(root.querySelector(".row.wtile, .row.whero, .section")).toBeNull();
  });
  it("takes the condition rule's label and the temperature rule's label", async () => {
    const { root } = await mount({
      rules: [{ state: "rainy", label: "Wet" }],
      temperature_rules: [{ above: 15, label: "Mild" }],
    });
    expect(root.querySelector(".plabel")!.textContent).toBe("Wet");
    const sec = root.querySelector(".pbody > .secondary")!;
    expect(sec.textContent).toBe("Mild · 18° / 9°");
    expect(sec.querySelector(".accent")!.textContent).toBe("Mild");
  });
  it("keeps its curve through a render that changed nothing it reads", async () => {
    const { root, el, hass } = await mount({});
    const plot = root.querySelector(".plot.ptrend");
    expect(plot).not.toBeNull();
    // a render with nothing new (the refresh tick's): the curve and the condition's colour stay
    el._render();
    expect(root.querySelector(".plot.ptrend")).toBe(plot);
    const row = root.querySelector<HTMLElement>(".row.poster")!;
    expect(row.style.getPropertyValue("--fe-color")).toBe("var(--primary-color)");
    // the temperature changed: the poster is filled again
    const w = hass.states[W];
    el.hass = {
      ...hass,
      states: { ...hass.states, [W]: { ...w, attributes: { ...w.attributes, temperature: 16.2 } } },
    } as never;
    expect(root.querySelector(".pvalue .big b")!.textContent).toBe("16.2");
    expect(root.querySelector(".plot.ptrend")).not.toBe(plot);
  });
  it("draws no curve without an hourly forecast", async () => {
    const { root, asked } = await mount({}, 1);
    expect(asked).toEqual(["daily"]);
    expect(root.querySelector(".plot")).toBeNull();
    expect(root.querySelector(".pbody > .secondary")!.textContent).toBe("18° / 9°");
  });
  it("draws no curve from a single hour", async () => {
    const { root } = await mount({}, 3, 1);
    expect(root.querySelector(".plot")).toBeNull();
  });
  it("draws no high / low without a daily forecast", async () => {
    const { root, asked } = await mount({}, 2);
    expect(asked).toEqual(["hourly"]);
    expect(root.querySelector(".pbody > .secondary")).toBeNull();
    expect(root.querySelector(".plot.ptrend")).not.toBeNull();
  });
});
