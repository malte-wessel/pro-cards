// The badges of the v3 cards: written as the cards are (the icon place, a visual after the value,
// a switch, rules whose colour wins and whose text is a value) and drawn with their entity's kind
// colours. The entity cards' badges keep their old keys (tests/unit/shared/entity/config.test.ts).
import { resetDeprecatedKeys } from "../../../../src/shared/card.ts";
import { describe, it, expect, vi } from "vitest";
import type { NormalizeCtx } from "../../../../src/shared/entity/config.ts";
import { modelOf, type FormatCtx } from "../../../../src/shared/entity/model.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import { badgeHours, normalizePill } from "../../../../src/shared/kinds/badge.ts";

const ctx: NormalizeCtx = {
  type: "poster-card-pro",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
  hover: false,
};
const pill = (raw: unknown) =>
  normalizePill(raw as never, ctx, "badges[0]", { style: "outline", size: "s" }, "the corner");
const fails = (raw: unknown, msg: string) =>
  expect(() => pill(raw)).toThrow(`poster-card-pro: badges[0]${msg}`);

const st = (id: string, state: string | number, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state: String(state), attributes }) as unknown as HassEntity;
const look = (raw: unknown, states: HassEntity[], tpl: Record<string, unknown> = {}) => {
  const fctx: FormatCtx = {
    hass: {
      states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
      locale: { language: "en" },
    } as unknown as HomeAssistant,
    tplResult: new Map(Object.entries(tpl)),
  };
  return modelOf(fctx, pill(raw)).look;
};
const BATTERY = { device_class: "battery", unit_of_measurement: "%" };

describe("a v3 badge as written", () => {
  it("takes the icon place: a name, an image, a dot, a ring, or none", () => {
    expect(pill("sensor.x").pill?.icon).toEqual({ type: "icon", ring: false, src: null });
    expect(pill({ entity: "sensor.x", icon: "mdi:water" }).icon).toBe("mdi:water");
    expect(pill({ entity: "sensor.x", icon: { ring: true } }).pill?.icon.ring).toBe(true);
    expect(pill({ entity: "sensor.x", icon: { type: "dot" } }).pill?.icon.type).toBe("dot");
    expect(pill({ entity: "sensor.x", icon: false }).pill?.icon.type).toBe("none");
    expect(
      pill({ entity: "person.malte", icon: { type: "image", src: "/local/m.jpg", ring: true } })
        .pill?.icon,
    ).toEqual({ type: "image", ring: true, src: { kind: "url", url: "/local/m.jpg" } });
    // an icon has no circle on a badge, a dot no ring
    fails({ entity: "sensor.x", icon: { style: "plain" } }, ".icon: style is no option here");
    fails({ entity: "sensor.x", icon: { type: "dot", ring: true } }, ".icon: dot takes no options");
  });

  it("draws bar, sparkline and trend after the value, each over its own window", () => {
    expect(pill({ entity: "sensor.x", visual: "bar" }).visual).toBe("bar");
    const spark = pill({ entity: "sensor.x", visual: "sparkline" });
    expect([spark.visual, spark.pill?.hours]).toEqual(["sparkline", 24]);
    const trend = pill({ entity: "sensor.x", visual: { type: "trend", hours: 6 } });
    expect([trend.visual, trend.pill?.hours]).toEqual(["trend", 6]);
    expect(pill({ entity: "sensor.x", visual: "trend" }).pill?.hours).toBe(1);
    expect(pill({ entity: "sensor.x", visual: false }).visual).toBe("icon");
    fails(
      { entity: "sensor.x", visual: { type: "bar", hours: 2 } },
      ".visual: bar takes no options",
    );
  });

  it("names the new spelling of the old keys", () => {
    fails({ entity: "sensor.x", visual: "ring" }, ".visual: visual: ring is icon: { ring: true }");
    fails({ entity: "sensor.x", visual: "dot" }, ".visual: visual: dot is icon: { type: dot }");
    fails({ entity: "sensor.x", visual: "badge" }, ".visual: visual: badge is style: soft");
    fails({ entity: "sensor.x", visual: "none" }, ".visual: visual: none is false (no visual)");
    fails(
      { entity: "group.lights", visual: "count" },
      `.visual: visual: count is a template in value: "{{ expand('group.lights') | selectattr('state', 'eq', 'on') | list | count }}"`,
    );
    fails({ entity: "sensor.x", show_icon: false }, ": show_icon: false is icon: false");
    fails(
      { entity: "person.malte", show_entity_picture: true },
      ": show_entity_picture: true is icon: { type: image }",
    );
    fails(
      { entity: "sensor.x", trend_hours: 6 },
      ": trend_hours: 6 is visual: { type: trend, hours: 6 }",
    );
    fails({ entity: "light.x", toggle: true }, ": toggle is control: toggle");
    fails(
      { entity: "sensor.x", secondary: "x" },
      ": secondary is gone: a badge has no second line",
    );
    fails({ entity: "sensor.x", inputs: {} }, ": inputs is the card's");
  });

  it("holds a switch alone, which does not confirm", () => {
    expect(pill({ entity: "light.x", control: "toggle" }).control?.kind).toBe("toggle");
    expect(pill({ entity: "light.x", control: { type: "toggle" } }).control?.kind).toBe("toggle");
    expect(pill({ entity: "light.x", control: false }).control).toBeNull();
    fails(
      { entity: "light.x", control: "auto" },
      ".control: a badge holds only a switch: control takes toggle or false, not auto",
    );
    fails(
      { entity: "light.x", control: "slider" },
      ".control: a badge holds only a switch: control takes toggle or false, not slider",
    );
    fails(
      { entity: "light.x", control: { type: "toggle", confirm: true } },
      ".control: a badge's switch does not confirm: control: toggle",
    );
  });

  it("writes a rule's text as its value, and a rule's icon as an icon place", () => {
    const b = pill({
      entity: "binary_sensor.w",
      rules: [
        { state: "on", color: "red", value: "Open", icon: { type: "dot" } },
        { state: "off", icon: "mdi:window-closed" },
      ],
    });
    expect(b.rules.map((r) => [r.label, r.icon])).toEqual([
      ["Open", null],
      [null, "mdi:window-closed"],
    ]);
    expect(b.pill?.ruleIcons.get(b.rules[0])?.type).toBe("dot");
    expect(b.pill?.ruleIcons.get(b.rules[1])?.type).toBe("icon");
    // the 2.9 betas' `label` is read as the value until 4.0, said once; both is an error
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      resetDeprecatedKeys();
      const old = pill({ entity: "sensor.x", rules: [{ state: "on", label: "Open" }] });
      expect(old.rules[0].label).toBe("Open");
      expect(warn.mock.calls.map((c) => String(c[0])).join()).toMatch(
        /a badge rule's label is deprecated and goes in 4.0: write value/,
      );
    } finally {
      warn.mockRestore();
    }
    fails(
      { entity: "sensor.x", rules: [{ state: "on", label: "Open", value: "Open" }] },
      ".rules[0]: label is value: write value only",
    );
    fails(
      { entity: "sensor.x", rules: [{ state: "on", tint_card: true }] },
      ".rules[0]: a badge's rule tints no card (the card's own rules do)",
    );
  });

  it("takes texts, styles and rules as written, never a word YAML read as true", () => {
    fails(
      { entity: "sensor.x", value: true },
      '.value takes a text, not true (to hide the value: show_value: false; a word such as On or Yes is read as true unless quoted: "On")',
    );
    fails(
      { entity: "sensor.x", rules: [{ state: "on", value: false }] },
      ".rules[0].value takes a text, not false",
    );
    fails(
      { entity: "sensor.x", style: "pill" },
      ": style must be one of outline, soft, filled, plain, tag, not pill",
    );
    fails({ entity: "sensor.x", size: "xl" }, ": size must be one of s, m, l, not xl");
    fails({ entity: "sensor.x", rules: ["on"] }, ".rules[0] must be a rule");
    fails(
      { entity: "sensor.x", rules: [{ state: "on", style: "x" }] },
      ".rules[0]: style must be one of",
    );
  });

  it("merges a src onto a picture, and only there", () => {
    const b = pill({
      entity: "person.malte",
      icon: { type: "image" },
      rules: [{ state: "not_home", icon: { src: "/local/away.jpg" } }],
    });
    expect(b.pill?.ruleIcons.get(b.rules[0])).toEqual({
      type: "image",
      ring: false,
      src: { kind: "url", url: "/local/away.jpg" },
    });
    fails(
      { entity: "person.malte", icon: { src: "/local/m.jpg" } },
      ".icon: src is a picture's: icon: { type: image, src: /local/m.jpg }",
    );
  });

  it("knows the window its badges draw", () => {
    expect(badgeHours([pill("sensor.x")])).toBe(0);
    expect(
      badgeHours([
        pill({ entity: "sensor.x", visual: "trend" }),
        pill({ entity: "sensor.x", visual: { type: "sparkline", hours: "today" } }),
      ]),
    ).toBe(24);
  });
});

describe("a v3 badge as drawn", () => {
  it("lets a matching rule's colour and icon win over its own", () => {
    const raw = {
      entity: "sensor.co2",
      color: "grey",
      icon: "mdi:molecule",
      rules: [{ above: 1000, color: "red", icon: "mdi:alert" }],
    };
    expect(look(raw, [st("sensor.co2", 1200)])).toMatchObject({ color: "red", icon: "mdi:alert" });
    expect(look(raw, [st("sensor.co2", 600)])).toMatchObject({
      color: "grey",
      icon: "mdi:molecule",
    });
  });

  it("writes a rule's value, a template too, in place of the value", () => {
    const raw = { entity: "binary_sensor.w", rules: [{ state: "on", value: "{{ 'Open' }}" }] };
    expect(look(raw, [st("binary_sensor.w", "on")], { "{{ 'Open' }}": "Open" }).label).toBe("Open");
    expect(look(raw, [st("binary_sensor.w", "off")]).label).toBeNull();
  });

  it("takes its kind's colours without its texts", () => {
    // a battery: Home Assistant's low colour below 30 %, its value stays the number
    const low = look("sensor.robot_battery", [st("sensor.robot_battery", 6, BATTERY)]);
    expect(low).toMatchObject({ color: expect.stringContaining("battery-low"), label: null });
    // a light in its own colour, a thermostat warm while it heats
    const light = st("light.desk", "on", { rgb_color: [255, 120, 0] });
    expect(look("light.desk", [light]).color).toBe("#ff7800");
    const climate = st("climate.living", "heat", { hvac_action: "heating" });
    expect(look("climate.living", [climate]).color).toContain("--state-climate-heat-color");
    // a wind sensor in m/s matches the kind's km/h bands
    const wind = { device_class: "wind_speed", unit_of_measurement: "m/s" };
    expect(look("sensor.wind", [st("sensor.wind", 20, wind)]).rule).not.toBeNull();
  });

  it("leaves its kind out where it says so, shows something else, or writes rules", () => {
    const co2 = st("sensor.co2", 1180, {
      device_class: "carbon_dioxide",
      unit_of_measurement: "ppm",
    });
    expect(look("sensor.co2", [co2]).color).toBe("amber");
    // (without it, the primary colour, as Home Assistant's badge)
    expect(look({ entity: "sensor.co2", kind: "none" }, [co2]).color).toBe("primary");
    // without its kind a battery keeps Home Assistant's own state colour, the kind's in its place
    const low = st("sensor.robot_battery", 15, BATTERY);
    // (15 %: Home Assistant's low band, red below 30 %, the same colour either way)
    expect(look("sensor.robot_battery", [low]).color).toContain("battery-low");
    expect(look({ entity: "sensor.robot_battery", kind: "none" }, [low]).color).toBe(
      "var(--state-sensor-battery-low-color)",
    );
    // an attribute reads no kind's thresholds
    const withAttr = st("sensor.co2", 1180, { device_class: "carbon_dioxide", level: 1180 });
    expect(look({ entity: "sensor.co2", attribute: "level" }, [withAttr]).color).toBe("primary");
    // its own rules replace the kind's
    const own = { entity: "sensor.robot_battery", rules: [{ below: 50, color: "blue" }] };
    expect(look(own, [low]).color).toBe("blue");
    // a written kind reads a sensor without a device class
    const plain = st("sensor.cells", 6, { unit_of_measurement: "%" });
    expect(look({ entity: "sensor.cells", kind: "battery" }, [plain]).color).toContain(
      "battery-low",
    );
    expect(() => pill({ entity: "light.x", kind: "battery" })).toThrow(
      "poster-card-pro: the battery kind reads",
    );
  });

  it("switches its icon place with the matching rule, and shows a picture", () => {
    const raw = {
      entity: "binary_sensor.w",
      rules: [{ state: "on", icon: { type: "dot" } }],
    };
    expect(look(raw, [st("binary_sensor.w", "on")]).badgeIcon?.type).toBe("dot");
    expect(look(raw, [st("binary_sensor.w", "off")]).badgeIcon?.type).toBe("icon");
    const malte = st("person.malte", "home", { entity_picture: "/local/m.jpg" });
    expect(look({ entity: "person.malte", icon: { type: "image" } }, [malte]).picture).toBe(
      "/local/m.jpg",
    );
    expect(look("person.malte", [malte]).picture).toBeNull();
  });
});
