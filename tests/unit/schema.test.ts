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

// every card config the docs site renders: ::: live fences, DashboardGrid sections, home page LiveCard :config props are JS (skipped)
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
    const EC = "custom:entity-card",
      EGC = "custom:entity-group-card",
      ESC = "custom:entity-sections-card";
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
    expect(validate({ type: "custom:multi-trend-card" })).toMatch(/entities/);
    expect(validate({ type: "custom:sun-path-card", labels: { midnight: "x" } })).toBeTruthy();
    expect(validate({ type: "custom:illuminance-card", entity: "sensor.lx", mode: "bar" })).toMatch(
      /enum|allowed/,
    );
    expect(
      validate({
        type: "custom:illuminance-card",
        entity: "sensor.lx",
        zones: { dusk: { label: "x" } },
      }),
    ).toBeTruthy();
    const WC = "custom:weather-card";
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
  it("accept the documented edge cases", () => {
    const EC = "custom:entity-card",
      EGC = "custom:entity-group-card",
      ESC = "custom:entity-sections-card";
    expect(validate({ type: "custom:weather-card", entity: "weather.home" })).toBeNull();
    expect(
      validate({
        type: "custom:weather-card",
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
            hours_to_show: 6,
            rules: [{ state: "rainy", icon: "mdi:umbrella" }],
          },
          {
            type: "trend",
            mode: "hourly",
            hours_to_show: 24,
            title: "Trend",
            show: ["temperature", { quantity: "wind", name: "Breeze", color: "teal" }],
            layout: "overlay",
            x_axis: false,
            y_axis: true,
            show_legend: false,
          },
          { type: "trend", mode: "daily", days: 5, show: ["temperature", "precipitation"] },
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
        type: "custom:multi-trend-card",
        entities: ["sensor.a", { entity: "sensor.b", color: "#abc" }],
        layout: "lanes",
        y_axis: true,
      }),
    ).toBeNull();
    expect(validate({ type: "custom:sun-path-card" })).toBeNull();
    expect(
      validate({
        type: "custom:illuminance-card",
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
