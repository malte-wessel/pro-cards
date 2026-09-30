import { describe, it, expect } from "vitest";
import { normalizeEntity, type NormalizeCtx, type RawEntity } from "../../../src/entity/config.ts";
import { fmtValue, modelOf, nameOf, tplOf, type FormatCtx } from "../../../src/entity/model.ts";
import type { HassEntity, HomeAssistant } from "../../../src/shared/ha.ts";

const actx: NormalizeCtx = {
  type: "t",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
};
const ent = (o: RawEntity) => normalizeEntity({ entity: "sensor.x", ...o }, actx, "e");
const st = (state: string | number, attributes: Record<string, unknown> = {}): HassEntity =>
  ({
    entity_id: "sensor.x",
    state: String(state),
    attributes,
  }) as unknown as HassEntity;
const ctx = (
  states: Record<string, HassEntity> = {},
  extra: Partial<HomeAssistant> = {},
): FormatCtx => ({
  hass: { states, locale: { language: "en-GB" }, ...extra } as unknown as HomeAssistant,
  tplResult: new Map<string, unknown>([["{{ t }}", "rendered"]]),
});

describe("formatting", () => {
  it("splits number and unit, honouring decimals, unit, prefix and suffix", () => {
    const s = st("21.456", { unit_of_measurement: "°C" });
    expect(fmtValue(ctx(), ent({}), { raw: "21.456", num: 21.456, avail: true }, s)).toEqual({
      text: "21.46 °C",
      num: "21.46",
      unit: "°C",
    });
    expect(
      fmtValue(
        ctx(),
        ent({ decimals: 0, unit: "K", prefix: "~", suffix: "!" }),
        { raw: "21.456", num: 21.456, avail: true },
        s,
      ),
    ).toEqual({
      text: "~21 K!",
      num: "~21!",
      unit: "K",
    });
    expect(fmtValue(ctx(), ent({}), { raw: null, num: null, avail: false }, s)).toEqual({
      text: "–",
      num: "–",
      unit: "",
    });
    expect(
      fmtValue(ctx(), ent({ value: "Run" }), { raw: "Run", num: null, avail: true }, undefined)
        .text,
    ).toBe("Run");
  });
  it("uses Home Assistant's formatter when the state is shown as is", () => {
    const s = st("21.4", { unit_of_measurement: "°C" });
    const c = ctx({}, { formatEntityState: () => "21,4 °C" });
    expect(fmtValue(c, ent({}), { raw: "21.4", num: 21.4, avail: true }, s)).toEqual({
      text: "21,4 °C",
      num: "21,4",
      unit: "°C",
    });
    // explicit decimals bypass the formatter
    expect(fmtValue(c, ent({ decimals: 0 }), { raw: "21.4", num: 21.4, avail: true }, s).text).toBe(
      "21 °C",
    );
    const light = st("on");
    expect(
      fmtValue(
        ctx({}, { formatEntityState: () => "On" }),
        ent({}),
        { raw: "on", num: null, avail: true },
        light,
      ).text,
    ).toBe("On");
  });
  it("resolves names and templates", () => {
    expect(nameOf(ctx(), ent({}), st("1", { friendly_name: "Sensor X" }))).toBe("Sensor X");
    expect(nameOf(ctx(), ent({ name: "Fixed" }), st("1", { friendly_name: "Sensor X" }))).toBe(
      "Fixed",
    );
    expect(nameOf(ctx(), ent({ name: "{{ t }}" }), undefined)).toBe("rendered");
    expect(nameOf(ctx(), ent({}), undefined)).toBe("sensor.x");
    expect(tplOf(ctx(), "{{ unknown }}")).toBeNull();
    expect(tplOf(ctx(), "plain")).toBe("plain");
  });
});

describe("model", () => {
  it("builds the render model and flags missing entities", () => {
    const m = modelOf(
      ctx({ "sensor.x": st("42", { unit_of_measurement: "%" }) }),
      ent({ rules: [{ above: 40, color: "red", label: "High" }] }),
    );
    expect(m.model).toEqual({ raw: "42", num: 42, avail: true });
    expect(m.look).toMatchObject({ color: "red", label: "High" });
    expect(m.fmt.text).toBe("42 %");
    expect(m.progress).toBe(0.42);
    const missing = modelOf(ctx({}), ent({}));
    expect(missing.model).toMatchObject({ avail: false, missing: true });
    expect(missing.look).toMatchObject({ color: "grey", label: "sensor.x not found" });
    expect(missing.fmt.text).toBe("–");
    const german = modelOf(ctx({}, { locale: { language: "de" } }), ent({}));
    expect(german.look.label).toBe("sensor.x nicht gefunden");
  });
});
