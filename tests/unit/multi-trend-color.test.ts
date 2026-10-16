import { describe, it, expect } from "vitest";
import { seriesColor } from "../../src/multi-trend/color.ts";
import type { TrendEntity } from "../../src/multi-trend/config.ts";
import { normalizeRules } from "../../src/shared/entity/config.ts";
import type { HassEntity } from "../../src/shared/ha.ts";

const ent = (o: Partial<Omit<TrendEntity, "rules">> & { rules?: unknown } = {}): TrendEntity => ({
  entity: "sensor.t",
  fallbackCss: "var(--primary-color)",
  visibility: null,
  ...o,
  rules: normalizeRules(o.rules),
});
const st = (state: string) =>
  ({ entity_id: "sensor.t", state, attributes: {}, last_updated: "" }) as unknown as HassEntity;
const none = () => null;
const rules = [
  { below: 10, color: "blue" },
  { below: 20, color: "teal" },
  { above: 20, color: "orange" },
];

describe("multi trend series colour", () => {
  it("takes the first matching rule, below exclusive and above inclusive", () => {
    const e = ent({ rules });
    expect(seriesColor(e, st("5"), none)).toBe("var(--blue-color)");
    expect(seriesColor(e, st("10"), none)).toBe("var(--teal-color)");
    expect(seriesColor(e, st("19.9"), none)).toBe("var(--teal-color)");
    expect(seriesColor(e, st("20"), none)).toBe("var(--orange-color)");
  });
  it("falls back to the palette colour when no rule matches or the state is missing", () => {
    const e = ent({ rules: [{ above: 30, color: "red" }] });
    expect(seriesColor(e, st("12"), none)).toBe("var(--primary-color)");
    expect(seriesColor(e, undefined, none)).toBe("var(--primary-color)");
    expect(seriesColor(ent(), st("12"), none)).toBe("var(--primary-color)");
  });
  it("matches no rule while the value is unavailable, like the entity cards", () => {
    const e = ent({
      rules: [
        { below: 100, color: "green" },
        { state: "unavailable", color: "grey" },
      ],
    });
    expect(seriesColor(e, st("unavailable"), none)).toBe("var(--primary-color)");
    expect(seriesColor(e, st("unknown"), none)).toBe("var(--primary-color)");
    expect(seriesColor(e, st("3"), none)).toBe("var(--green-color)");
  });
  it("lets an explicit colour win over the rules", () => {
    expect(seriesColor(ent({ color: "red", rules }), st("5"), none)).toBe("var(--red-color)");
    expect(seriesColor(ent({ color: "#abc", rules }), st("5"), none)).toBe("#abc");
  });
  it("reads a template colour from its rendered result", () => {
    const e = ent({ color: "{{ 'amber' if is_state('x', 'on') else 'grey' }}", rules });
    expect(seriesColor(e, st("5"), () => "amber")).toBe("var(--amber-color)");
    expect(seriesColor(e, st("5"), () => "rgb(1, 2, 3)")).toBe("rgb(1, 2, 3)");
    // not rendered yet or empty: the rules decide, as on the entity cards
    expect(seriesColor(e, st("5"), none)).toBe("var(--blue-color)");
    expect(seriesColor(e, st("5"), () => "")).toBe("var(--blue-color)");
    expect(seriesColor(ent({ color: "{{ x }}" }), st("5"), none)).toBe("var(--primary-color)");
    // a result that is no colour token never reaches the SVG markup
    expect(seriesColor(e, st("5"), () => 'red" onload="x')).toBe("var(--blue-color)");
  });
});
