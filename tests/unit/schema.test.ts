import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { makeValidator } from "../../scripts/schema-validator.ts";
import { PRESETS } from "../../docs/.vitepress/theme/presets.ts";

const validate = makeValidator();
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory()
      ? f.startsWith(".")
        ? []
        : walk(p)
      : p.endsWith(".md")
        ? [p]
        : [];
  });

// every card config the docs site renders: ::: live fences, DashboardGrid sections, the home page embeds DashboardGrids too
const docExamples = () => {
  const out: { file: string; cfg: unknown }[] = [];
  for (const file of walk("docs")) {
    const md = readFileSync(file, "utf8");
    for (const m of md.matchAll(/^::: live[^\n]*\n\n?```yaml\n([\s\S]*?)```/gm)) {
      const doc = yaml.load(m[1]);
      for (const c of Array.isArray(doc) ? doc : [doc]) out.push({ file, cfg: c });
    }
    for (const m of md.matchAll(/<DashboardGrid b64="([A-Za-z0-9+/=]+)"/g)) {
      const sections = yaml.load(Buffer.from(m[1], "base64").toString("utf8")) as {
        cards?: { type?: string }[];
      }[];
      for (const s of sections)
        for (const c of s.cards || []) if (c.type !== "heading") out.push({ file, cfg: c });
    }
  }
  return out;
};

describe("card config schemas", () => {
  it("accept every example on the docs site", () => {
    const ex = docExamples();
    expect(ex.length).toBeGreaterThan(40);
    const failures = ex
      .map(({ file, cfg }) => ({ file, cfg, err: validate(cfg) }))
      .filter((x) => x.err);
    expect(failures.map((f) => `${f.file}: ${f.err}\n${JSON.stringify(f.cfg)}`)).toEqual([]);
  });
  it("accept every playground preset", () => {
    for (const [name, text] of Object.entries(PRESETS))
      expect(validate(yaml.load(text)), name).toBeNull();
  });
  it("reject typos, wrong enums and unknown card types", () => {
    const EC = "custom:entity-card-pro",
      EGC = "custom:entity-group-card-pro",
      ESC = "custom:entity-sections-card-pro";
    expect(validate({ type: EC, entity: "sensor.a", visula: "ring" })).toMatch(
      /unevaluated|additional/,
    );
    expect(validate({ type: EC, name: "x" })).toMatch(/entity|value/);
    expect(validate({ type: EC, entity: "sensor.a", rules: [{ color: "red" }] })).toMatch(
      /state|below|above/,
    );
    expect(validate({ type: EC, entity: "sensor.a", thresholds: [{ below: 1 }] })).toBeTruthy();
    expect(validate({ type: EC, entity: "sensor.a", state_map: { on: "red" } })).toBeTruthy();
    expect(validate({ type: EC, entity: "sensor.a", tint_card: true })).toBeTruthy();
    expect(validate({ type: EC, entity: "sensor.a", layout: "list" })).toBeTruthy();
    expect(validate({ type: EC, entity: "sensor.a", tap_action: { action: "navigate" } })).toMatch(
      /navigation_path/,
    );
    expect(validate({ type: EGC, layout: "tiles", entities: ["sensor.a"] })).toMatch(
      /enum|allowed/,
    );
    expect(validate({ type: EGC, layout: "tile", entities: ["sensor.a"] })).toMatch(/enum|allowed/);
    expect(validate({ type: EGC, entities: [{ entity: "not an id" }] })).toMatch(/pattern/);
    expect(validate({ type: EGC, entities: [] })).toMatch(/fewer|minItems/);
    expect(validate({ type: EGC, layout: "row" })).toMatch(/entities/);
    expect(validate({ type: EGC, entities: [{ entity: "s.a", hours_to_show: 6 }] })).toBeTruthy();
    expect(validate({ type: EGC, entities: ["s.a"], align: "middle" })).toMatch(/enum|allowed/);
    expect(validate({ type: EGC, entities: ["s.a"], name_position: "left" })).toMatch(
      /enum|allowed/,
    );
    expect(validate({ type: EGC, entities: ["s.a"], sections: [] })).toBeTruthy();
    expect(validate({ type: ESC, sections: [] })).toMatch(/fewer|minItems/);
    expect(validate({ type: ESC, entities: ["s.a"] })).toMatch(/sections/);
    expect(validate({ type: ESC, layout: "row", sections: [{ entities: ["s.a"] }] })).toBeTruthy();
    expect(validate({ type: ESC, sections: [{ layout: "row" }] })).toMatch(/entities/);
    expect(validate({ type: ESC, sections: [{ entities: ["s.a"], title: "no" }] })).toMatch(
      /unevaluated|additional/,
    );
    expect(validate({ type: "custom:multi-trend-card-pro" })).toMatch(/entities/);
    expect(validate({ type: "custom:sun-path-card-pro", labels: { midnight: "x" } })).toBeTruthy();
    expect(
      validate({ type: "custom:illuminance-card-pro", entity: "sensor.lx", mode: "bar" }),
    ).toMatch(/enum|allowed/);
    expect(
      validate({
        type: "custom:illuminance-card-pro",
        entity: "sensor.lx",
        zones: { dusk: { label: "x" } },
      }),
    ).toBeTruthy();
    const WC = "custom:weather-card-pro";
    expect(validate({ type: WC })).toMatch(/entity/);
    expect(validate({ type: WC, entity: "sensor.a" })).toMatch(/pattern/);
    expect(validate({ type: WC, entity: "weather.a", layout: "hero" })).toBeTruthy();
    expect(validate({ type: WC, entity: "weather.a", attributes: ["humidity"] })).toBeTruthy();
    expect(validate({ type: WC, entity: "weather.a", sections: [] })).toMatch(/fewer|minItems/);
    expect(
      validate({ type: WC, entity: "weather.a", sections: [{ type: "hourly" }] }),
    ).toBeTruthy();
    expect(validate({ type: WC, entity: "weather.a", sections: [{ type: "row" }] })).toBeTruthy();
    expect(
      validate({ type: WC, entity: "weather.a", sections: [{ type: "forecast", mode: "weekly" }] }),
    ).toBeTruthy();
    expect(
      validate({ type: WC, entity: "weather.a", sections: [{ type: "forecast", layout: "grid" }] }),
    ).toBeTruthy();
    expect(
      validate({
        type: WC,
        entity: "weather.a",
        sections: [{ type: "trend", show: [{ name: "x" }] }],
      }),
    ).toBeTruthy();
    expect(
      validate({ type: WC, entity: "weather.a", sections: [{ type: "trend", layout: "stack" }] }),
    ).toBeTruthy();
    expect(
      validate({
        type: WC,
        entity: "weather.a",
        sections: [{ type: "hero", entities: ["humidity"] }],
      }),
    ).toBeTruthy();
    expect(validate({ type: "custom:flexible-entity-card", entity: "sensor.a" })).toBeTruthy();
    expect(validate({ type: "custom:other-card", entity: "sensor.a" })).toBeTruthy();
  });
  it("rejects wind card typos and wrong enums", () => {
    const WIC = "custom:wind-card-pro";
    expect(validate({ type: WIC })).toMatch(/entity/);
    expect(validate({ type: WIC, entity: "light.a" })).toMatch(/pattern/);
    expect(validate({ type: WIC, entity: "sensor.a", direction: "weather.home" })).toMatch(
      /pattern/,
    );
    expect(validate({ type: WIC, entity: "sensor.a", flow: { style: "waves" } })).toMatch(
      /enum|allowed/,
    );
    expect(validate({ type: WIC, entity: "sensor.a", flow: { height: 10 } })).toMatch(/>= 40/);
    expect(validate({ type: WIC, entity: "sensor.a", flow_style: "dots" })).toBeTruthy();
    expect(validate({ type: WIC, entity: "sensor.a", layout: "compass" })).toMatch(/enum|allowed/);
    expect(validate({ type: WIC, entity: "sensor.a", visual: "ring" })).toMatch(/enum|allowed/);
    expect(
      validate({
        type: WIC,
        entity: "weather.home",
        direction: "sensor.wind_direction",
        gust: "sensor.wind_gust",
        layout: "hero",
        lead: "arrow",
        flow: { style: "vectors", density: "dense", height: 140 },
        rules: [{ above: 50, color: "red", label: "Storm", tint_card: true }],
        title: "Wind",
        header_entities: [{ entity: "sensor.wind_gust" }],
        tap_action: "none",
        grid_options: { columns: 12 },
      }),
    ).toBeNull();
  });

  it("rejects rain card typos and wrong enums", () => {
    const RC = "custom:rain-card-pro";
    expect(validate({ type: RC })).toMatch(/entity/);
    expect(validate({ type: RC, entity: "weather.home" })).toMatch(/pattern/);
    expect(validate({ type: RC, entity: "sensor.a", today: "weather.home" })).toMatch(/pattern/);
    expect(validate({ type: RC, entity: "sensor.a", flow: { style: "snow" } })).toMatch(
      /enum|allowed/,
    );
    expect(validate({ type: RC, entity: "sensor.a", flow: { density: "dense" } })).toBeTruthy();
    expect(validate({ type: RC, entity: "sensor.a", lead: "arrow" })).toMatch(/enum|allowed/);
    expect(validate({ type: RC, entity: "sensor.a", gust: "sensor.b" })).toBeTruthy();
    expect(
      validate({
        type: RC,
        entity: "sensor.rain_rate_roof",
        today: "sensor.rain_today",
        wind: "sensor.wind_speed",
        direction: "sensor.wind_direction",
        layout: "hero",
        lead: "icon",
        flow: { style: "fill", height: 140 },
        rules: [{ above: 50, color: "deep-purple", label: "Violent rain", tint_card: true }],
        title: "Rain",
        header_entities: [{ entity: "sensor.rain_today" }],
        tap_action: "none",
        grid_options: { columns: 12 },
      }),
    ).toBeNull();
  });

  it("rejects power flow card typos and wrong shapes", () => {
    const PF = "custom:power-flow-card-pro";
    const src = [
      { type: "solar", entity: "sensor.solar_power" },
      { type: "battery", power: "sensor.battery_power", soc: "sensor.battery_soc" },
      { type: "grid", power: "sensor.grid_power" },
    ];
    expect(validate({ type: PF })).toMatch(/sources/);
    expect(validate({ type: PF, sources: [] })).toMatch(/fewer|minItems/);
    expect(validate({ type: PF, sources: [{ type: "wind", entity: "sensor.a" }] })).toBeTruthy();
    expect(validate({ type: PF, sources: [{ type: "battery", soc: "sensor.s" }] })).toBeTruthy();
    expect(
      validate({ type: PF, sources: [{ type: "grid", power: "sensor.g", export: "sensor.e" }] }),
    ).toBeTruthy();
    expect(validate({ type: PF, sources: src, direction: "up" })).toMatch(/enum|allowed/);
    expect(validate({ type: PF, sources: src, flow_style: "waves" })).toMatch(/enum|allowed/);
    expect(validate({ type: PF, sources: src, idle_links: "none" })).toMatch(/enum|allowed/);
    expect(validate({ type: PF, sources: src, decimals: 5 })).toBeTruthy();
    expect(validate({ type: PF, sources: src, animation: { speed: 3 } })).toBeTruthy();
    expect(validate({ type: PF, sources: src, consumers: [{ name: "x" }] })).toBeTruthy();
    expect(validate({ type: PF, sources: src, consumers: [{ group: "Room" }] })).toBeTruthy();
    expect(validate({ type: PF, sources: src, flowstyle: "dots" })).toBeTruthy();
    expect(
      validate({
        type: PF,
        title: "Energy",
        home: "sensor.power_consumption",
        sources: [
          { type: "solar", entity: "sensor.solar_east", name: "East", secondary: "roof" },
          {
            type: "battery",
            charge: "sensor.a",
            discharge: "sensor.b",
            soc: "sensor.battery_soc",
            invert: true,
          },
          {
            type: "grid",
            import: "sensor.i",
            export: "sensor.e",
            price: "sensor.electricity_price",
            offline: { entity: "binary_sensor.grid_outage", state: "off" },
            generator: "sensor.generator_power",
            fossil: "sensor.grid_fossil_percentage",
          },
        ],
        consumers: [
          { group: "Laundry", icon: "mdi:washing-machine", entities: ["sensor.washer_power"] },
          { entity: "sensor.ev_charger_power", name: "EV", invert: true, secondary: "{{ 1 }}" },
        ],
        consumer_style: "list",
        other: false,
        direction: "down",
        flow_style: "arrows",
        idle_links: "faint",
        expensive_above: 0.35,
        kw_above: 0,
        decimals: { w: 0, kw: 1 },
        animation: { slow_below: 100, fast_above: 5000 },
        rules: [{ above: 3000, color: "red", label: "Heavy", tint_card: true }],
        header_entities: [{ entity: "sensor.electricity_price" }],
        tap_action: "none",
        grid_options: { columns: 12 },
      }),
    ).toBeNull();
  });

  it("hold custom buttons to what the cards draw", () => {
    const EC = "custom:entity-card-pro",
      EGC = "custom:entity-group-card-pro",
      ESC = "custom:entity-sections-card-pro";
    const scenes = [
      { entity: "scene.a", color: "amber" },
      { icon: "mdi:cog", action: "none" },
    ];
    const row = { name: "Scenes", control: "buttons", control_options: scenes };
    expect(validate({ type: EC, ...row })).toBeNull();
    expect(validate({ type: EGC, entities: [row] })).toBeNull();
    expect(validate({ type: ESC, sections: [{ layout: "grid", entities: [row] }] })).toBeNull();
    // the buttons of control: buttons are button entries, at least one
    for (const control_options of [["scene.a"], [{ value: "a" }], [{ icon: "mdi:x" }], []])
      expect(validate({ type: EC, ...row, control_options })).toBeTruthy();
    // values stay the options of segments and select
    expect(
      validate({ type: EC, entity: "climate.a", control: "segments", control_options: ["eco"] }),
    ).toBeNull();
    // a row layout and the header draw no buttons: an item of buttons alone is invalid there
    expect(validate({ type: EGC, layout: "row", entities: [row] })).toBeTruthy();
    expect(validate({ type: ESC, sections: [{ layout: "row", entities: [row] }] })).toBeTruthy();
    expect(
      validate({ type: EGC, layout: "row", entities: [{ ...row, entity: "light.a" }] }),
    ).toBeNull();
    expect(validate({ type: EGC, entities: ["sensor.a"], header_entities: [row] })).toBeTruthy();
    expect(
      validate({ type: EGC, entities: ["sensor.a"], header_entities: [{ ...row, value: "" }] }),
    ).toBeNull();
  });
  it("accept the documented edge cases", () => {
    const EC = "custom:entity-card-pro",
      EGC = "custom:entity-group-card-pro",
      ESC = "custom:entity-sections-card-pro";
    expect(validate({ type: "custom:weather-card-pro", entity: "weather.home" })).toBeNull();
    expect(
      validate({ type: "custom:weather-card-pro", entity: "weather.home", icons: "hass" }),
    ).toBeNull();
    expect(
      validate({
        type: "custom:weather-card-pro",
        entity: "weather.home",
        title: "Home",
        name: "Home",
        secondary: "{{ states('sensor.a') }}",
        header_entities: [{ entity: "sun.sun", attribute: "next_setting" }],
        rules: [{ state: "rainy", color: "blue", tint_card: true }],
        temperature_rules: [{ below: 5, color: "blue", label: "Cold" }],
        tap_action: "none",
        grid_options: { columns: 12 },
        sections: [
          {
            type: "hero",
            title: "Now",
            name: "Garden",
            secondary: "x",
            rules: [{ state: "sunny", color: "amber" }],
          },
          {
            type: "row",
            title: "Now",
            entities: [
              "humidity",
              "sensor.uv_index",
              { attribute: "visibility", decimals: 0 },
              { entity: "sensor.a", visual: "ring", rules: [{ below: 3, color: "green" }] },
            ],
            align: "stretch",
          },
          { type: "table", entities: ["pressure"], show_icon: true },
          { type: "grid", columns: 3, entities: ["humidity"] },
          { type: "column", entities: ["dew_point"], name_position: "below" },
          { type: "list", divider: true, entities: ["cloud_coverage"] },
          {
            type: "forecast",
            mode: "daily",
            layout: "horizontal",
            days: 5,
            show: [],
            temperature_rules: [{ above: 25, color: "red" }],
          },
          {
            type: "forecast",
            mode: "hourly",
            hours: 6,
            rules: [{ state: "rainy", icon: "mdi:umbrella" }],
          },
          {
            type: "trend",
            mode: "hourly",
            hours: 24,
            title: "Trend",
            show: ["temperature", { quantity: "wind", name: "Breeze", color: "teal" }],
            layout: "overlay",
            x_axis: false,
            y_axis: true,
            show_legend: false,
          },
          {
            type: "trend",
            mode: "daily",
            days: 5,
            show: ["temperature", "precipitation"],
            divider: true,
          },
        ],
      }),
    ).toBeNull();
    expect(
      validate({ type: EC, name: "Text only", value: "Hello", icon: "mdi:x", color: "red" }),
    ).toBeNull();
    expect(validate({ type: EC, value: "{{ states('sensor.a') }}" })).toBeNull();
    expect(
      validate({
        type: EC,
        entity: "light.a",
        toggle: true,
        rules: [
          { state: "on", color: "amber" },
          { state: "off", color: "grey", label: "Off" },
          { below: 5, above: 1, color: "red", tint_card: true },
        ],
        grid_options: { columns: 6, rows: "auto" },
      }),
    ).toBeNull();
    expect(
      validate({
        type: EC,
        entity: "sensor.a",
        attribute: "x",
        tap_action: "toggle",
        hold_action: {
          action: "call-service",
          service: "light.turn_on",
          target: { entity_id: ["light.a"] },
          confirmation: true,
        },
      }),
    ).toBeNull();
    expect(
      validate({
        type: EC,
        entity: "sensor.a",
        icon: "{{ 'mdi:a' if true else 'mdi:b' }}",
        color: "{{ 'red' }}",
        name: "{{ x }}",
        hours_to_show: 6,
        bucket_minutes: 15,
      }),
    ).toBeNull();
    expect(
      validate({
        type: EGC,
        title: "Room",
        layout: "row",
        align: "space-between",
        show_value: true,
        name_position: "below",
        header_entities: ["sensor.a", { entity: "sensor.b", decimals: 1, show_icon: false }],
        entities: ["light.a", { entity: "light.b", show_name: false, attribute: "brightness" }],
      }),
    ).toBeNull();
    expect(validate({ type: EGC, entities: ["light.a"] })).toBeNull();
    expect(validate({ type: EGC, layout: "grid", columns: 3, entities: ["light.a"] })).toBeNull();
    expect(
      validate({
        type: ESC,
        title: "Room",
        show_icon: true,
        align: "start",
        columns: 3,
        header_entities: ["sensor.a"],
        sections: [
          { layout: "table", entities: [{ entity: "sensor.a", name: "A" }] },
          { layout: "row", divider: true, align: "end", show_name: false, entities: ["light.a"] },
          { layout: "grid", columns: 2, entities: ["sensor.a"] },
          { entities: ["sensor.a"] },
        ],
      }),
    ).toBeNull();
    expect(
      validate({
        type: "custom:multi-trend-card-pro",
        entities: ["sensor.a", { entity: "sensor.b", color: "#abc" }],
        layout: "lanes",
        y_axis: true,
      }),
    ).toBeNull();
    expect(validate({ type: "custom:sun-path-card-pro" })).toBeNull();
    expect(
      validate({
        type: "custom:illuminance-card-pro",
        entity: "sensor.lx",
        zones: { sun: { label: "Sun", color: "orange" } },
      }),
    ).toBeNull();
  });
});

describe("docs showcases", () => {
  it("keep the DashboardGrid embed in sync with the readable YAML fence", () => {
    for (const file of walk("docs")) {
      const md = readFileSync(file, "utf8");
      for (const m of md.matchAll(
        /<DashboardGrid b64="([A-Za-z0-9+/=]+)">\s*```yaml\n([\s\S]*?)```\s*<\/DashboardGrid>/g,
      )) {
        expect(Buffer.from(m[1], "base64").toString("utf8"), file).toBe(m[2]);
      }
    }
  });
});
