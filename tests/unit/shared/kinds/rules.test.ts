import { describe, it, expect } from "vitest";
import { normalizePosterConfig } from "../../../../src/poster/config.ts";
import { modelOf } from "../../../../src/shared/entity/model.ts";
import { mainColor } from "../../../../src/shared/kinds/art.ts";
import {
  AQI_RULES,
  attention,
  CO2_RULES,
  PM25_RULES,
  RAIN_RULES,
  toRule,
  WEATHER_RULES,
  WIND_RULES,
} from "../../../../src/shared/kinds/rules.ts";
import type { KindRule } from "../../../../src/shared/kinds/types.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";

const E = "sensor.x";
// the label and colour a poster of this kind shows for a value in a unit
const look = (kind: string, v: number | string, unit = "", language = "en") => {
  const hass = {
    states: {
      [E]: {
        entity_id: E,
        state: String(v),
        attributes: { unit_of_measurement: unit },
      } as unknown as HassEntity,
    },
    locale: { language },
  } as unknown as HomeAssistant;
  const cfg = normalizePosterConfig({ entity: E, poster: kind }, hass);
  const m = modelOf({ hass, tplResult: new Map() }, cfg.entities[0]);
  return [m.look.label, m.look.color];
};

describe("the kinds' rules", () => {
  it("become the entity layer's rules: no label of their own, quiet, no tint", () => {
    expect(toRule({ below: 10, color: "red", labelKey: "kind.level.critical" })).toEqual({
      state: null,
      below: 10,
      above: null,
      color: "red",
      icon: null,
      label: null,
      tintCard: false,
      style: null,
      pulse: false,
      labelKey: "kind.level.critical",
    });
    expect(toRule({ state: "triggered", pulse: true })).not.toHaveProperty("labelKey");
    expect(attention("triggered").map(toRule)[0]).toMatchObject({
      state: "triggered",
      pulse: true,
    });
  });

  it("cover every value: each band starts where the one before ends", () => {
    const sets: [string, readonly KindRule[]][] = [
      ["co2", CO2_RULES],
      ["pm25", PM25_RULES],
      ["aqi", AQI_RULES],
      ["wind", WIND_RULES],
      ["rain", RAIN_RULES],
    ];
    for (const [name, rules] of sets) {
      const below = rules.filter((r) => r.below !== undefined).map((r) => r.below!);
      expect(below, name).toEqual([...below].sort((a, b) => a - b));
      const last = rules[rules.length - 1];
      expect(last.above, name).toBe(below[below.length - 1]);
      // only the extreme pulses
      expect(rules.filter((r) => r.pulse).length, name).toBeLessThanOrEqual(1);
    }
    expect(WEATHER_RULES.every((r) => r.state && r.color)).toBe(true);
  });

  it("label the air by its bands, translated", () => {
    expect(look("carbon_dioxide", 700)).toEqual(["Good", "green"]);
    expect(look("carbon_dioxide", 1000)).toEqual(["Moderate", "amber"]);
    expect(look("carbon_dioxide", 2400)).toEqual(["Bad", "red"]);
    expect(look("pm25", 30)).toEqual(["Poor", "orange"]);
    expect(look("aqi", 120)[1]).toBe("orange");
    expect(look("carbon_dioxide", 700, "", "de")[0]).not.toBe("Good");
  });

  it("read the wind and the rain in the unit they are written in", () => {
    expect(look("wind", 10, "km/h")[0]).toBe("Light breeze");
    // 10 m/s is 36 km/h
    expect(look("wind", 10, "m/s")[0]).toBe("Fresh breeze");
    expect(look("wind", 10, "kn")[0]).toBe("Moderate breeze");
    expect(look("rain", 0, "mm/h")[0]).toBe("Dry");
    expect(look("rain", 0.5, "in/h")[0]).toBe("Heavy rain");
  });
});

describe("cover art colour", () => {
  // a picture of `n` pixels of each colour
  const px = (n: number, ...rgba: number[][]) =>
    new Uint8ClampedArray(rgba.flatMap((c) => Array.from({ length: n }, () => c).flat()));

  it("is the colourful pixels' colour, held to a readable lightness", () => {
    expect(mainColor(px(4, [200, 30, 30, 255]))).toBe("hsl(0, 74%, 45%)");
    // a pale colour gets darker, keeping its hue
    expect(mainColor(px(400, [255, 230, 230, 255]))).toMatch(/^hsl\(0, \d+%, 60%\)$/);
    // grey and transparent pixels say nothing
    expect(mainColor(px(400, [128, 128, 128, 255]))).toBeNull();
    expect(mainColor(px(400, [200, 30, 30, 0]))).toBeNull();
    // the colourful pixel outweighs many grey ones
    const mixed = new Uint8ClampedArray([
      ...px(2, [30, 30, 200, 255]),
      ...px(40, [120, 120, 120, 255]),
    ]);
    expect(mainColor(mixed)).toMatch(/^hsl\(240,/);
  });
});
