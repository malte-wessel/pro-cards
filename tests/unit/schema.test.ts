import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { makeValidator } from "../../scripts/schema-validator.ts";
import { PRESETS } from "../../docs/.vitepress/theme/presets.ts";
import { normalizeLayoutConfig } from "../../src/layout/config.ts";
import { normalizeSwipeConfig } from "../../src/swipe/config.ts";

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

// Home Assistant's own cards the docs shim has: not ours to validate
const CORE = new Set(["heading", "energy-date-selection"]);
const core = (c: unknown) => CORE.has(String((c as { type?: unknown } | null)?.type));
// every card config the docs site renders: ::: live fences, DashboardGrid sections, the home page embeds DashboardGrids too,
// the home hero's backdrop (`hero.dashboard` in the frontmatter) and its feature rows (`feature_rows`)
const docExamples = () => {
  const out: { file: string; cfg: unknown }[] = [];
  for (const file of walk("docs")) {
    const md = readFileSync(file, "utf8");
    const front = /^---\n([\s\S]*?)\n---/.exec(md);
    const fm = front
      ? (yaml.load(front[1]) as { hero?: { dashboard?: unknown }; feature_rows?: unknown } | null)
      : null;
    if (Array.isArray(fm?.hero?.dashboard))
      for (const s of fm.hero.dashboard as { cards?: unknown[] }[])
        for (const c of s.cards || []) if (!core(c)) out.push({ file, cfg: c });
    if (Array.isArray(fm?.feature_rows))
      for (const t of fm.feature_rows as { cards?: unknown[] }[])
        for (const c of t.cards || []) if (!core(c)) out.push({ file, cfg: c });
    for (const m of md.matchAll(/^::: live[^\n]*\n\n?```yaml\n([\s\S]*?)```/gm)) {
      const doc = yaml.load(m[1]);
      for (const c of Array.isArray(doc) ? doc : [doc]) if (!core(c)) out.push({ file, cfg: c });
    }
    for (const m of md.matchAll(/<DashboardGrid b64="([A-Za-z0-9+/=]+)"/g)) {
      const sections = yaml.load(Buffer.from(m[1], "base64").toString("utf8")) as {
        cards?: { type?: string }[];
      }[];
      for (const s of sections)
        for (const c of s.cards || []) if (!core(c)) out.push({ file, cfg: c });
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
    expect(validate({ type: EGC, title_tap: "navigate", entities: ["sensor.a"] })).toBeTruthy();
    expect(
      validate({ type: EGC, title_tap_action: { action: "navigate" }, entities: ["sensor.a"] }),
    ).toMatch(/navigation_path/);
    expect(
      validate({
        type: ESC,
        title_tap_action: "more-info",
        sections: [{ entities: ["sensor.a"] }],
      }),
    ).toBeNull();
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
    const MT = "custom:multi-trend-card-pro";
    expect(
      validate({ type: MT, entities: [{ entity: "sensor.a", rules: [{ color: "red" }] }] }),
    ).toBeTruthy();
    expect(
      validate({
        type: MT,
        entities: [{ entity: "sensor.a", rules: [{ above: 1, color: "red", label: "x" }] }],
      }),
    ).toBeTruthy();
    expect(
      validate({ type: MT, entities: [{ entity: "sensor.a", rules: [{ above: 1 }] }] }),
    ).toMatch(/color/);
    expect(
      validate({
        type: MT,
        entities: [{ entity: "sensor.a", rules: [{ above: 1, color: "red" }] }],
      }),
    ).toBeNull();
    expect(validate({ type: "custom:sun-path-card-pro", labels: { midnight: "x" } })).toBeTruthy();
    const SAZ = "custom:sun-azimuth-card-pro";
    expect(validate({ type: SAZ, view: "panorama" })).toMatch(/enum|allowed/);
    expect(validate({ type: SAZ, house: { front: 400 } })).toMatch(/maximum|<=/);
    expect(validate({ type: SAZ, house: { roof: "dome" } })).toMatch(/enum|allowed/);
    // the sides are front / right / back / left, a name or false
    expect(validate({ type: SAZ, house: { sides: { north: "Street" } } })).toMatch(
      /unevaluated|additional/,
    );
    expect(validate({ type: SAZ, house: { sides: { left: true } } })).toMatch(/const|type/);
    expect(validate({ type: SAZ, house: { rotation: 20 } })).toMatch(/unevaluated|additional/);
    expect(validate({ type: SAZ, house: { rotate: 20 } })).toMatch(/unevaluated|additional/);
    expect(validate({ type: SAZ, camera_slider: "yes" })).toMatch(/boolean|type/);
    expect(validate({ type: SAZ, show_side: false })).toMatch(/unevaluated|additional/);
    // the earlier names of the summary and the sun times rows
    expect(validate({ type: SAZ, show_house: false })).toMatch(/unevaluated|additional/);
    expect(validate({ type: SAZ, show_events: true })).toMatch(/unevaluated|additional/);
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
  it("accept hover on the card, a section and an entity, as a boolean, and nowhere else", () => {
    const ok = [
      { type: "custom:entity-card-pro", entity: "light.a", hover: true },
      {
        type: "custom:entity-group-card-pro",
        hover: true,
        header_entities: [{ entity: "sensor.h", hover: false }],
        entities: [{ entity: "light.a", hover: false }],
      },
      {
        type: "custom:entity-sections-card-pro",
        hover: false,
        sections: [{ hover: true, entities: [{ entity: "light.a", hover: false }] }],
      },
      {
        type: "custom:power-flow-card-pro",
        hover: true,
        home: { entity: "sensor.home", hover: false },
        sources: [{ type: "solar", entity: "sensor.solar", hover: false }],
        consumers: [{ entity: "sensor.ev", hover: true }],
      },
      {
        type: "custom:weather-card-pro",
        entity: "weather.home",
        hover: true,
        sections: [{ type: "row", hover: false, entities: ["humidity"] }],
      },
      {
        type: "custom:energy-flow-card-pro",
        hover: true,
        home: { entity: "sensor.home_energy", hover: false },
        sources: [{ type: "solar", entity: "sensor.solar_energy", hover: false }],
        consumers: [{ entity: "sensor.ev_energy", hover: true }],
      },
      { type: "custom:wind-card-pro", entity: "sensor.wind_speed", hover: true },
      { type: "custom:rain-card-pro", entity: "sensor.rain_rate", hover: true },
    ];
    for (const cfg of ok) expect(validate(cfg), cfg.type).toBeNull();
    expect(validate({ type: "custom:entity-card-pro", entity: "light.a", hover: "yes" })).toMatch(
      /boolean/,
    );
    expect(
      validate({
        type: "custom:entity-group-card-pro",
        entities: [{ entity: "light.a", hover: 1 }],
      }),
    ).toMatch(/boolean/);
    // cards without anything to click have no hover
    for (const cfg of [
      { type: "custom:multi-trend-card-pro", entities: ["sensor.a"] },
      { type: "custom:sun-path-card-pro" },
    ]) {
      expect(validate(cfg), cfg.type).toBeNull();
      expect(validate({ ...cfg, hover: true }), cfg.type).toMatch(/unevaluated|additional/);
    }
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

  it("checks the poster card's kind and its flat keys", () => {
    const PC = "custom:poster-card-pro";
    expect(validate({ type: PC, entity: "sensor.a", kind: "room" })).toMatch(/enum|allowed/);
    expect(validate({ type: PC, entity: "sensor.a", kind: "wind" })).toBeNull();
    // the appliances are kinds of their own, a cover's look is its visual's variant
    for (const kind of ["cover", "washer", "heat_pump"])
      expect(validate({ type: PC, entity: "sensor.a", kind }), kind).toBeNull();
    for (const kind of ["garage", "shutter", "blind", "curtain", "gate", "awning", "window"])
      expect(validate({ type: PC, entity: "cover.a", kind }), kind).toMatch(/enum|allowed/);
    expect(validate({ type: PC, kind: "trend" })).toMatch(/series/);
    expect(
      validate({ type: PC, kind: "trend", series: ["sensor.a", { entity: "sensor.b" }] }),
    ).toBeNull();
    expect(
      validate({ type: PC, entity: "sensor.a", gust: false, direction: "sensor.b" }),
    ).toBeNull();
    expect(validate({ type: PC, entity: "sensor.a", gust: "gusty" })).toBeTruthy();
    // a written kind takes none of another kind's keys; a detected one leaves that to the card
    expect(validate({ type: PC, entity: "sensor.r", kind: "rain", gust: "sensor.g" })).toMatch(
      /gust/,
    );
    expect(validate({ type: PC, entity: "sensor.w", kind: "wind", gust: "sensor.g" })).toBeNull();
    expect(validate({ type: PC, kind: "grid", import: "sensor.i", running_above: 5 })).toMatch(
      /running_above/,
    );
    expect(
      validate({ type: PC, entity: "sensor.r", gust: "sensor.g", today: "sensor.t" }),
    ).toBeNull();
    expect(validate({ type: PC, kind: "grid", import: false })).toBeTruthy();
    expect(validate({ type: PC, kind: "washer", entity: "sensor.p", running_above: 8 })).toBeNull();
  });

  it("rejects the keys the places replaced", () => {
    const H = "sensor.living_room_humidity";
    const gone = {
      poster: "wind",
      variant: "lines",
      image: "/local/x.jpg",
      image_opacity: 0.5,
      image_tint: "red",
      image_blur: true,
      icon_image: "/local/x.jpg",
      show_entity_picture: true,
      icon_ring: true,
      icon_style: "plain",
      show_picture: true,
      hours_to_show: 12,
      bucket_minutes: 30,
      smoothing_minutes: 10,
      // control's options, the icon's actions and badge
      control_position: "block",
      control_attribute: "preset_mode",
      control_step: 1,
      control_options: ["eco"],
      control_confirm: true,
      icon_tap_action: "toggle",
      icon_hold_action: "toggle",
      icon_double_tap_action: "toggle",
      icon_badge: false,
    };
    for (const type of ["custom:poster-card-pro", "custom:tile-card-pro"])
      for (const [key, v] of Object.entries(gone)) {
        expect(validate({ type, entity: H, [key]: v }), `${type} ${key}`).toMatch(/unevaluated/);
        if (key === "poster" || key.includes("minutes") || key === "hours_to_show") continue;
        if (key.startsWith("control_") || key.endsWith("_action") || key.endsWith("_badge"))
          continue;
        expect(
          validate({ type, entity: H, rules: [{ above: 1, [key]: v }] }),
          `${type} rules ${key}`,
        ).toMatch(/additional|unevaluated/);
      }
    expect(
      validate({ type: "custom:tile-group-card-pro", tiles: [{ entity: H, poster: "solar" }] }),
    ).toBeTruthy();
    // the group sets nothing on its tiles: a tile's key on the group is unknown
    for (const key of ["hours_to_show", "status", "control", "visual", "entities"])
      expect(validate({ type: "custom:tile-group-card-pro", tiles: [H], [key]: 1 }), key).toMatch(
        /unevaluated/,
      );
    // its layout decides a tile's vertical
    expect(
      validate({ type: "custom:tile-group-card-pro", tiles: [{ entity: H, vertical: true }] }),
    ).toBeTruthy();
    expect(
      validate({
        type: "custom:tile-group-card-pro",
        layout: "row",
        tiles: [
          H,
          {
            entity: "light.kitchen",
            status_badge: true,
            control: { type: "slider", step: 5 },
          },
        ],
      }),
    ).toBeNull();
    // the v2 cards keep the flat keys
    const flat = {
      entity: "climate.living_room",
      control: "segments",
      control_position: "block",
      control_attribute: "preset_mode",
      control_options: ["eco"],
      control_confirm: true,
    };
    expect(validate({ type: "custom:entity-card-pro", ...flat })).toBeNull();
    expect(validate({ type: "custom:entity-group-card-pro", entities: [flat] })).toBeNull();
    expect(
      validate({ type: "custom:entity-card-pro", ...flat, control: { type: "segments" } }),
    ).toBeTruthy();
  });

  it("checks the two places: the icon and the visual", () => {
    const H = "sensor.living_room_humidity";
    for (const type of ["custom:poster-card-pro", "custom:tile-card-pro"]) {
      const ok = (c: object, what: string) => expect(validate({ type, ...c }), what).toBeNull();
      const bad = (c: object, what: string) => expect(validate({ type, ...c }), what).toBeTruthy();
      // a thing's name, false, or the thing with its options
      for (const visual of [
        "sparkline",
        "columns",
        "strip",
        "bar",
        "gauge",
        "segments",
        "glow",
        "image",
        false,
      ])
        ok({ entity: H, visual }, `visual ${visual}`);
      for (const visual of ["none", "ring", "icon", "badge", "trend", true])
        bad({ entity: H, visual }, `visual ${visual}`);
      ok(
        { entity: H, visual: { type: "sparkline", hours: "today", smoothing: 10, axis: true } },
        "sparkline",
      );
      ok(
        { entity: H, visual: { type: "columns", hours: 12, bucket: 30, src: "sensor.b" } },
        "columns",
      );
      ok(
        {
          entity: H,
          visual: { type: "image", src: "/local/x.jpg", opacity: 0.5, tint: "red", blur: true },
        },
        "image",
      );
      bad({ entity: H, visual: { type: "image", hours: 12 } }, "an image has no hours");
      bad({ entity: H, visual: { type: "glow", style: "lines" } }, "a glow has no options");
      bad({ entity: H, visual: { type: "columns", smoothing: 10 } }, "columns are not smoothed");
      bad({ entity: H, visual: { type: "sparkline", hours: 0 } }, "hours above 0");
      bad({ entity: H, visual: { type: "image", opacity: 2 } }, "opacity to 1");
      // without a type, the options merge onto what the place draws: any of them
      ok({ entity: "person.a", visual: { blur: 0 } }, "merge a blur");
      ok({ entity: H, visual: { hours: 6, bucket: 15 } }, "merge a window");
      bad({ entity: H, visual: { size: 2 } }, "no such option");
      // the icon: a name, false, or a thing
      ok({ entity: H, icon: "mdi:sofa" }, "icon name");
      ok({ entity: H, icon: false }, "icon false");
      ok({ entity: H, icon: { ring: true } }, "icon ring");
      ok({ entity: H, icon: { name: "mdi:x", ring: true, style: "plain" } }, "icon options");
      ok({ entity: H, icon: { type: "image", src: "person.a", ring: true } }, "icon image");
      ok({ entity: "sensor.w", icon: { type: "flow", variant: "swoosh" } }, "icon flow");
      ok(
        { entity: "sensor.w", icon: { type: "flow", variant: "swoosh", style: "plain" } },
        "a plain animated icon",
      );
      ok({ entity: "sensor.w", icon: { variant: "lines" } }, "merge a flow's variant");
      bad({ entity: "sensor.w", icon: { type: "flow", style: "swoosh" } }, "a flow's style");
      bad({ entity: "sensor.w", icon: { type: "flow", variant: "garage" } }, "a cover's variant");
      bad({ entity: H, icon: { type: "icon", variant: "dots" } }, "an icon has no variant");
      bad({ entity: H, icon: { type: "image", variant: "dots" } }, "an image has no variant");
      bad({ entity: H, icon: "image" }, "a string is an icon's name");
      bad({ entity: H, icon: { type: "flow", name: "mdi:x" } }, "a flow has no name");
      bad({ entity: H, icon: { name: "mdi:x", src: "/local/x.jpg" } }, "a name makes it an icon");
      bad({ entity: H, icon: { type: "icon", style: "dots" } }, "an icon's style");
      bad({ entity: H, icon: { type: "picture" } }, "no such thing");
      // what only a kind draws fits only that kind
      ok({ entity: "sensor.w", kind: "wind", visual: { type: "flow", variant: "lines" } }, "flow");
      bad({ entity: "sensor.w", visual: { type: "flow", style: "lines" } }, "a flow's style");
      bad(
        { entity: "sensor.w", kind: "wind", visual: { type: "flow", variant: "drops" } },
        "rain's variant",
      );
      bad(
        { entity: "sensor.w", kind: "wind", icon: { type: "flow", variant: "fill" } },
        "rain's variant in the icon",
      );
      ok(
        { entity: "sensor.r", kind: "rain", icon: { type: "flow", variant: "ripples" } },
        "rain icon",
      );
      bad(
        { entity: "sensor.r", kind: "rain", visual: { type: "flow", variant: "swoosh" } },
        "the wind's variant",
      );
      bad({ entity: "light.a", kind: "light", visual: "flow" }, "a light has no flow");
      bad({ entity: "light.a", kind: "light", icon: { type: "flow" } }, "nor in its icon");
      bad({ entity: "sun.sun", kind: "sun", visual: "cover" }, "the sun has no cover");
      ok({ entity: "cover.a", kind: "cover", visual: "cover" }, "a cover's drawing");
      ok({ entity: "cover.a", visual: { type: "cover", variant: "garage" } }, "a garage door");
      ok({ entity: "cover.a", visual: { variant: "gate" } }, "merge a cover's variant");
      bad({ entity: "cover.a", visual: { type: "cover", variant: "lines" } }, "a flow's variant");
      bad({ entity: "cover.a", visual: { type: "cover", style: "garage" } }, "a cover's style");
      bad({ entity: H, visual: { type: "image", variant: "garage" } }, "an image's variant");
      bad({ entity: H, visual: { variant: "plain" } }, "no such variant");
      ok(
        { entity: "weather.home", kind: "weather", visual: { type: "sparkline", hours: 12 } },
        "a weather's sparkline: its forecast",
      );
      bad({ entity: "weather.home", visual: "forecast" }, "forecast is a weather's sparkline");
      // the animation goes in one place
      bad(
        { entity: "sensor.w", icon: { type: "flow" }, visual: { type: "flow" } },
        "a flow in both places",
      );
      bad({ entity: "sensor.w", icon: { type: "flow" }, visual: "flow" }, "a flow in both places");
      // rules: the same places, without the history's window or a plot's src
      ok(
        {
          entity: H,
          rules: [
            { above: 60, color: "red", icon: "mdi:water", visual: { opacity: 0.6 } },
            { above: 40, icon: { ring: true, style: "plain" }, visual: false },
            { below: 20, visual: { type: "image", src: "/local/dry.jpg", blur: 4 } },
            { state: "x", visual: "sparkline" },
          ],
        },
        "rules",
      );
      bad(
        { entity: H, rules: [{ above: 1, visual: { type: "sparkline", hours: 6 } }] },
        "rule hours",
      );
      bad({ entity: H, rules: [{ above: 1, visual: { bucket: 15 } }] }, "rule bucket");
      bad({ entity: H, rules: [{ above: 1, visual: { smoothing: 15 } }] }, "rule smoothing");
      bad(
        { entity: H, rules: [{ above: 1, visual: { type: "columns", src: "sensor.b" } }] },
        "rule plot src",
      );
    }
    // a tile in a group takes the places as a tile card does
    expect(
      validate({
        type: "custom:tile-group-card-pro",
        tiles: [
          { entity: "sensor.a", visual: { type: "sparkline", hours: 6 } },
          { entity: "sensor.b", kind: "solar", visual: false },
        ],
      }),
    ).toBeNull();
  });

  it("checks the tile card: the poster's kinds and keys, less the poster's own parts", () => {
    const TC = "custom:tile-card-pro";
    const H = "sensor.living_room_humidity";
    expect(validate({ type: TC, entity: H })).toBeNull();
    expect(
      validate({
        type: TC,
        entity: "sensor.a",
        kind: "wind",
        visual: { type: "flow", variant: "lines" },
      }),
    ).toBeNull();
    expect(
      validate({ type: TC, entity: "cover.a", visual: { type: "cover", variant: "garage" } }),
    ).toBeNull();
    expect(validate({ type: TC, entity: "cover.a", kind: "garage" })).toMatch(/enum|allowed/);
    expect(validate({ type: TC, entity: "sensor.r", kind: "rain", gust: "sensor.g" })).toMatch(
      /gust/,
    );
    expect(validate({ type: TC, entity: H, vertical: true })).toBeNull();
    expect(validate({ type: TC, entity: H, vertical: "yes" })).toBeTruthy();
    expect(validate({ type: TC, entity: H, status: false })).toBeNull();
    expect(validate({ type: TC, entity: H, status: "{{ 'Dry' }}" })).toBeNull();
    // the status is a text or false: its look is the card's
    for (const status of [{ style: "filled", icon: "mdi:air" }, { badge: true }, { value: "Dry" }])
      expect(validate({ type: TC, entity: H, status }), JSON.stringify(status)).toBeTruthy();
    expect(validate({ type: TC, entity: H, status: true })).toBeTruthy();
    // as a badge before the badges: status_badge
    expect(validate({ type: TC, entity: H, status_badge: true })).toBeNull();
    expect(validate({ type: TC, entity: H, status: "Dry", status_badge: false })).toBeNull();
    expect(validate({ type: TC, entity: H, status_badge: "yes" })).toBeTruthy();
    // the badge on the icon is the icon's, the card's or a rule's
    expect(validate({ type: TC, entity: H, icon: { badge: false } })).toBeNull();
    expect(validate({ type: TC, entity: H, icon: { name: "mdi:x", badge: "auto" } })).toBeNull();
    expect(
      validate({
        type: TC,
        entity: H,
        icon: { badge: { icon: "{{ 'mdi:alert' }}", color: "red" } },
      }),
    ).toBeNull();
    expect(validate({ type: TC, entity: H, icon: { badge: { color: "red" } } })).toBeTruthy();
    expect(
      validate({
        type: TC,
        entity: H,
        rules: [{ above: 80, icon: { badge: { icon: "mdi:water" } } }],
      }),
    ).toBeNull();
    // a poster's status is always a badge; its icon has none
    const PC = "custom:poster-card-pro";
    expect(validate({ type: PC, entity: H, status: "Dry" })).toBeNull();
    expect(validate({ type: PC, entity: H, status: { value: "Dry" } })).toBeTruthy();
    expect(validate({ type: PC, entity: H, status_badge: true })).toMatch(/unevaluated/);
    expect(validate({ type: PC, entity: H, icon: { badge: false } })).toMatch(/unevaluated/);
    expect(
      validate({ type: PC, entity: H, rules: [{ above: 1, icon: { badge: false } }] }),
    ).toBeTruthy();
    expect(validate({ type: TC, entity: H, badges: ["sensor.a", { attribute: "x" }] })).toBeNull();
    // the status is no entry of the badges: it comes first
    for (const type of [TC, PC])
      expect(validate({ type, entity: H, badges: ["sensor.a", "status"] }), type).toBeTruthy();
    // the entity card's toggle is not the tile's
    expect(validate({ type: TC, entity: H, toggle: true })).toMatch(/unevaluated/);
  });

  it("checks the icon's own actions and the control, on the poster and the tile", () => {
    const H = "sensor.living_room_humidity";
    for (const type of ["custom:poster-card-pro", "custom:tile-card-pro"]) {
      // the icon's actions are the icon's, not a rule's
      expect(
        validate({
          type,
          entity: "switch.coffee_machine",
          icon: {
            tap_action: "toggle",
            hold_action: { action: "navigate", navigation_path: "/kitchen" },
            double_tap_action: { action: "more-info" },
          },
        }),
        type,
      ).toBeNull();
      expect(
        validate({ type, entity: H, icon: { name: "mdi:x", tap_action: "toggle" } }),
      ).toBeNull();
      expect(validate({ type, entity: H, icon: { tap_action: "explode" } })).toBeTruthy();
      expect(
        validate({ type, entity: H, rules: [{ above: 1, icon: { tap_action: "toggle" } }] }),
      ).toBeTruthy();
      // control: a name, true or false, or the control and its options
      for (const control of ["slider", "auto", "none", true, false])
        expect(validate({ type, entity: "light.kitchen", control }), String(control)).toBeNull();
      for (const position of ["end", "block"])
        expect(
          validate({ type, entity: "light.kitchen", control: { type: "slider", position } }),
        ).toBeNull();
      expect(
        validate({
          type,
          entity: "climate.living_room",
          control: { type: "segments", attribute: "preset_mode", options: ["eco", "comfort"] },
        }),
      ).toBeNull();
      expect(
        validate({ type, entity: "lock.front_door", control: { type: "button", confirm: true } }),
      ).toBeNull();
      // without a type it changes the kind's own controls
      expect(validate({ type, entity: "climate.living_room", control: { step: 1 } })).toBeNull();
      expect(validate({ type, entity: H, control: { type: "dial" } })).toBeTruthy();
      expect(validate({ type, entity: H, control: { step: 0 } })).toBeTruthy();
      expect(validate({ type, entity: H, control: { size: 2 } })).toBeTruthy();
      expect(
        validate({ type, entity: "lock.front_door", control: { type: "hold", position: "lead" } }),
      ).toBeTruthy();
      expect(validate({ type, entity: H, control: { type: "buttons", options: [] } })).toBeTruthy();
      expect(
        validate({ type, control: { type: "buttons", options: [{ entity: "scene.a" }] } }),
      ).toBeNull();
    }
    const PC = "custom:poster-card-pro";
    // the item's other keys still check as an entity's
    expect(validate({ type: PC, entity: H, decimals: 5 })).toBeTruthy();
    expect(validate({ type: PC, entity: H, rules: [{ color: "red" }] })).toBeTruthy();
    // the badges keep the entity's visuals
    expect(validate({ type: PC, entity: H, badges: [{ entity: H, visual: "ring" }] })).toBeNull();
  });

  it("checks layout cards, their breakpoints and the cards inside", () => {
    const LC = "custom:layout-card-pro";
    const EC = { type: "custom:entity-card-pro", entity: "sensor.outdoor_temperature" };
    expect(
      validate({
        type: LC,
        layout: "grid",
        columns: [320, "1fr", "minmax(200px, 2fr)"],
        gap: [8, 12],
        padding: [0, 16],
        card_style: "seamless",
        align_items: "start",
        breakpoints: { 2: { columns: 2 }, 4: { layout: "masonry", columns: 6 } },
        cards: [
          { ...EC, view_layout: { span: { 1: "full", 3: [2, 2] }, order: -1, align: "center" } },
          { type: "tile", entity: "light.kitchen", view_layout: { column: 2 } },
          { type: "heading", heading: "Rooms" },
          { type: LC, cards: [EC] },
        ],
      }),
    ).toBeNull();
    expect(validate({ type: LC, colums: 2 })).toMatch(/unevaluated/);
    // breakpoints are view columns from 2; the base is one
    for (const key of ["tablet", "phone", "1", "13"])
      expect(validate({ type: LC, breakpoints: { [key]: { columns: 2 } } }), key).not.toBeNull();
    expect(validate({ type: LC, breakpoints: { 2: { colums: 2 } } })).not.toBeNull();
    expect(
      validate({ type: LC, cards: [{ ...EC, view_layout: { span: { desktop: 2 } } }] }),
    ).not.toBeNull();
    // the options the card no longer has
    for (const gone of [
      "fold",
      "min_column_width",
      "max_columns",
      "wrap",
      "margin",
      "density",
      "row_gap",
      "column_gap",
      "media",
      "container",
      "max_width",
      "align",
      "dense",
      "direction",
      "row_height",
    ])
      expect(validate({ type: LC, [gone]: 1 }), gone).toMatch(/unevaluated/);
    expect(validate({ type: LC, layout: "stack" })).not.toBeNull();
    for (const gone of [
      "priority",
      "sticky",
      "bleed",
      "aspect",
      "min_height",
      "max_height",
      "row",
      "show_on",
      "hidden_below",
    ])
      expect(
        validate({ type: LC, cards: [{ ...EC, view_layout: { [gone]: 1 } }] }),
        gone,
      ).not.toBeNull();
    expect(validate({ type: LC, columns: ["minmax(1fr, 2fr)"] })).not.toBeNull();
    expect(validate({ type: LC, columns: ["auto", "1fr"] })).not.toBeNull();
    expect(validate({ type: LC, cards: [{ ...EC, view_layout: { spam: 2 } }] })).not.toBeNull();
    // a Pro card inside is checked against its own schema, any other card loosely
    expect(validate({ type: LC, cards: [{ ...EC, visula: "ring" }] })).not.toBeNull();
    expect(validate({ type: LC, cards: [{ type: "tile", whatever: 1 }] })).toBeNull();
    expect(validate({ type: LC, cards: [{ entity: "light.kitchen" }] })).not.toBeNull();
  });

  it("agrees with the layout and swipe cards on rows, resets and unfold", () => {
    const LC = "custom:layout-card-pro",
      SW = "custom:swipe-card-pro";
    // the schema accepts a value exactly where the card does
    const same = (cfg: Record<string, unknown>, normalize: (c: unknown) => unknown) => {
      let card = true;
      try {
        normalize(cfg);
      } catch {
        card = false;
      }
      expect(validate(cfg) === null, JSON.stringify(cfg)).toBe(card);
      return card;
    };
    const rows = (r: unknown[]) => same({ type: LC, rows: r }, normalizeLayoutConfig);
    for (const ok of [
      ["auto", "1fr"],
      [120, "2.5fr"],
      ["minmax(80px, 1fr)"],
      ["minmax(auto, 1fr)"],
    ])
      expect(rows(ok), String(ok)).toBe(true);
    for (const bad of [
      ["minmax(1fr, auto)"],
      ["minmax(min-content, 1fr)"],
      ["minmax(80px)"],
      ["max-content"],
      [-1],
    ])
      expect(rows(bad), String(bad)).toBe(false);
    const cols = (c: unknown[]) => same({ type: LC, columns: c }, normalizeLayoutConfig);
    expect(cols(["minmax(200px, 1fr)"])).toBe(true);
    expect(cols(["minmax(auto, 1fr)"])).toBe(false);
    // an empty value in a breakpoint goes back to the default
    for (const k of ["gap", "padding", "rows"])
      expect(same({ type: LC, breakpoints: { 2: { [k]: null } } }, normalizeLayoutConfig), k).toBe(
        true,
      );
    for (const k of ["gap", "padding", "unfold"])
      expect(same({ type: SW, breakpoints: { 2: { [k]: null } } }, normalizeSwipeConfig), k).toBe(
        true,
      );
    expect(same({ type: SW, unfold: false }, normalizeSwipeConfig)).toBe(true);
    // the form of the first betas
    expect(same({ type: SW, unfold: { from: 2, columns: 4 } }, normalizeSwipeConfig)).toBe(false);
  });

  it("rejects energy flow cards that read power sensors", () => {
    const EF = "custom:energy-flow-card-pro";
    const ok = {
      type: EF,
      period: "week",
      period_picker: false,
      sources: [
        { type: "solar", entity: "sensor.solar_energy" },
        { type: "battery", charge: "sensor.c", discharge: "sensor.d", charge_from: "solar" },
        { type: "grid", import: "sensor.i", export: "sensor.e" },
      ],
      consumers: ["sensor.ev_charger_energy"],
      other: { name: "Rest", icon: "mdi:home" },
      flow_style: "none",
      decimals: { kwh: 2, mwh: 1 },
      hide_consumers_below: 0.5,
    };
    expect(validate(ok)).toBeNull();
    expect(validate({ ...ok, period: "decade" })).toMatch(/enum|allowed/);
    // the dashboard's period, of its own picker or another one
    expect(validate({ ...ok, period: "dashboard", collection_key: "energy_upstairs" })).toBeNull();
    expect(validate({ ...ok, period: "dashboard", collection_key: "upstairs" })).toBeTruthy();
    expect(validate({ ...ok, collection_key: "energy_upstairs" })).toBeTruthy();
    // what describes a moment is the power flow card's
    for (const src of [
      { type: "battery", power: "sensor.b" },
      { type: "grid", import: "sensor.i", price: "sensor.p" },
      { type: "solar", entity: "sensor.s", peak: 8000 },
      { type: "battery", charge: "sensor.c" },
    ])
      expect(validate({ type: EF, sources: [src] })).toBeTruthy();
    for (const key of ["kw_above", "expensive_above", "animation"])
      expect(validate({ ...ok, [key]: 1 })).toBeTruthy();
    expect(validate({ ...ok, decimals: { w: 1 } })).toBeTruthy();
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
      validate({
        type: PF,
        sources: [{ type: "battery", power: "sensor.b", charge_from: "grid" }],
      }),
    ).toMatch(/enum|allowed/);
    expect(
      validate({
        type: PF,
        sources: [{ type: "solar", entity: "sensor.a", charge_from: "solar" }],
      }),
    ).toBeTruthy();
    expect(
      validate({ type: PF, sources: [{ type: "grid", power: "sensor.g", export: "sensor.e" }] }),
    ).toBeTruthy();
    // charge_from names the panels that feed a battery; both_ways needs an import / export pair
    const battery = (chargeFrom: unknown) =>
      validate({
        type: PF,
        sources: [{ type: "battery", power: "sensor.b", charge_from: chargeFrom }],
      });
    expect(battery("sensor.balcony_solar_power")).toBeNull();
    expect(battery(["sensor.a", "sensor.b"])).toBeNull();
    expect(battery([])).toBeTruthy();
    expect(battery(["Balcony"])).toBeTruthy();
    const grid = (g: Record<string, unknown>) =>
      validate({ type: PF, sources: [{ type: "grid", ...g, both_ways: true }] });
    expect(grid({ import: "sensor.i", export: "sensor.e" })).toBeNull();
    expect(grid({ import: "sensor.i" })).toBeTruthy();
    expect(grid({ power: "sensor.g" })).toBeTruthy();
    expect(validate({ type: PF, sources: src, direction: "up" })).toMatch(/enum|allowed/);
    expect(validate({ type: PF, sources: src, flow_style: "waves" })).toMatch(/enum|allowed/);
    expect(validate({ type: PF, sources: src, idle_links: "none" })).toMatch(/enum|allowed/);
    expect(validate({ type: PF, sources: src, idle_below: -1 })).toBeTruthy();
    expect(
      validate({ type: PF, sources: [{ type: "solar", entity: "sensor.a", peak: 0 }] }),
    ).toBeTruthy();
    expect(validate({ type: PF, sources: src, decimals: 5 })).toBeTruthy();
    expect(validate({ type: PF, sources: src, animation: { speed: 3 } })).toBeTruthy();
    expect(validate({ type: PF, sources: src, consumers: [{ name: "x" }] })).toBeTruthy();
    expect(validate({ type: PF, sources: src, consumers: [{ group: "Room" }] })).toBeTruthy();
    expect(validate({ type: PF, sources: src, flowstyle: "dots" })).toBeTruthy();
    // icon_size on every node, within 16 to 96; icon_style is the entity cards' only
    const cons = (c: Record<string, unknown>) =>
      validate({ type: PF, sources: src, consumers: [{ entity: "sensor.a", ...c }] });
    expect(cons({ icon_size: 40 })).toBeNull();
    expect(cons({ icon_size: 120 })).toBeTruthy();
    expect(cons({ icon_style: "plain" })).toBeTruthy();
    expect(
      validate({ type: PF, sources: src, home: { entity: "sensor.h", icon_style: "plain" } }),
    ).toBeTruthy();
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
        idle_below: 1,
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
    expect(validate({ type: "custom:sun-azimuth-card-pro" })).toBeNull();
    expect(
      validate({
        type: "custom:sun-azimuth-card-pro",
        title: "Sun",
        icon: "mdi:sun-compass",
        view: "3d",
        house: { front: 45, roof: "hip", sides: { front: "Street", back: "Garden", left: false } },
        camera: 150,
        camera_slider: true,
        hover_preview: false,
        show_summary: false,
        show_sun_times: false,
        show_sides: false,
        sun_color: "orange",
        night_color: "#123456",
        sky_color: "rgb(1, 2, 3)",
        grid_options: { columns: 6 },
      }),
    ).toBeNull();
    expect(
      validate({
        type: "custom:illuminance-card-pro",
        entity: "sensor.lx",
        zones: { sun: { label: "Sun", color: "orange" } },
      }),
    ).toBeNull();
  });
  it("take visibility conditions on items, header items, buttons and sections", () => {
    const EGC = "custom:entity-group-card-pro",
      ESC = "custom:entity-sections-card-pro";
    const on = [{ condition: "state", state: "on" }];
    expect(
      validate({
        type: EGC,
        // the card's own visibility is Home Assistant's, with its own conditions
        visibility: [{ condition: "sun", after: "sunset" }],
        header_entities: [{ entity: "sensor.a", visibility: on }],
        entities: [
          {
            entity: "light.a",
            visibility: [
              { condition: "numeric_state", above: 10, below: "sensor.limit" },
              { condition: "screen", media_query: "(min-width: 600px)" },
              { condition: "user", users: ["abc"] },
              { condition: "location", locations: ["home"] },
              { condition: "time", after: "07:00", before: "22:30:00", weekdays: ["mon"] },
              { condition: "template", value_template: "{{ true }}" },
              { condition: "or", conditions: [{ entity: "light.b", state_not: "off" }] },
              { condition: "not", conditions: { condition: "state", state: ["on", "off"] } },
              { condition: "state", entity_id: ["light.a", "light.b"], state: "on" },
              { condition: "state", state: "on", enabled: false },
              { state_not: "unavailable" },
              { entity_id: "light.b", state: "on" },
            ],
          },
          {
            name: "Scenes",
            control: "buttons",
            control_options: [{ entity: "scene.a", visibility: on }],
          },
        ],
      }),
    ).toBeNull();
    expect(
      validate({ type: ESC, sections: [{ entities: ["light.a"], visibility: on }] }),
    ).toBeNull();
    const item = (visibility: unknown) => ({
      type: EGC,
      entities: [{ entity: "light.a", visibility }],
    });
    expect(validate({ type: EGC, entities: [{ entity: "light.a", visibilty: on }] })).toMatch(
      /unevaluated|additional/,
    );
    expect(validate(item([{ condition: "sun" }]))).toBeTruthy();
    expect(validate(item([{ condition: "state" }]))).toBeTruthy();
    expect(validate(item([{ condition: "numeric_state", entity: "light.a" }]))).toBeTruthy();
    expect(validate(item([{ condition: "time", after: "7 am" }]))).toBeTruthy();
    expect(validate(item([{ condition: "time", weekdays: ["monday"] }]))).toBeTruthy();
    expect(validate(item([{ condition: "template", value_template: "true" }]))).toBeTruthy();
    expect(validate(item([{ condition: "screen", media: "(min-width: 1px)" }]))).toBeTruthy();
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
