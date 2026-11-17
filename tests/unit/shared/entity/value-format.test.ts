import { describe, it, expect } from "vitest";
import {
  normalizeEntity,
  type NormalizeCtx,
  type RawEntity,
} from "../../../../src/shared/entity/config.ts";
import { modelOf, type RenderCtx } from "../../../../src/shared/entity/model.ts";
import { formatValue } from "../../../../src/shared/entity/value-format.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";

const actx: NormalizeCtx = {
  type: "t",
  tap: { action: "more-info" },
  hold: { action: "more-info" },
  dbl: { action: "none" },
  hover: false,
};
const NOW = Date.now();
const st = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state, attributes }) as unknown as HassEntity;
const STATES = {
  "timer.t": st("timer.t", "active", {
    duration: "0:45:00",
    finishes_at: new Date(NOW + 754e3).toISOString(),
  }),
  "timer.p": st("timer.p", "paused", { duration: "0:45:00", remaining: "0:12:34" }),
  "timer.i": st("timer.i", "idle", { duration: "0:45:00", remaining: "0:45:00" }),
  "sensor.ends": st("sensor.ends", new Date(NOW + 90 * 60e3).toISOString(), {
    device_class: "timestamp",
  }),
  "sensor.run": st("sensor.run", "4330", { unit_of_measurement: "s" }),
  "sensor.power": st("sensor.power", "1530", { unit_of_measurement: "W" }),
};
const ctx = {
  hass: { states: STATES, locale: { language: "en-GB" } } as unknown as HomeAssistant,
  tplResult: new Map(),
  now: NOW,
  countdowns: true,
} as unknown as RenderCtx;
// the value an entity's item writes, with `format`
const text = (entity: string, o: RawEntity = {}) => {
  const ent = normalizeEntity({ entity, ...o }, actx, "e");
  return formatValue(ctx, ent, modelOf(ctx, ent));
};

describe("formatValue", () => {
  it("writes a timer's time left as a clock, and keeps it running", () => {
    const v = text("timer.t")!;
    expect(v.text).toBe("12:34");
    expect(v.live?.cd.ends).toBe(NOW + 754e3);
    expect(v.live?.write(61)).toBe("1:01");
  });
  it("writes it as a span, or the time from now", () => {
    expect(text("timer.t", { format: "duration" })?.text).toBe("12m 34s");
    expect(text("timer.t", { format: "relative" })?.text).toBe("in 13 minutes");
    expect(text("timer.t", { format: "relative" })?.live).toBeUndefined();
    expect(text("timer.t", { prefix: "in " })?.text).toBe("in 12:34");
  });
  it("stands a paused timer at its remaining", () => {
    const v = text("timer.p")!;
    expect(v.text).toBe("12:34");
    expect(v.live).toBeUndefined();
    expect(text("timer.p", { format: "relative" })?.text).toBe("12m 34s");
  });
  it("leaves an idle timer to its state", () => {
    expect(text("timer.i")).toBeNull();
    expect(text("timer.i", { format: "duration" })).toBeNull();
  });
  it("counts down to a date with clock or duration, as before otherwise", () => {
    expect(text("sensor.ends", { format: "clock" })?.text).toBe("1:30:00");
    expect(text("sensor.ends", { format: "clock" })?.live?.cd.ends).toBe(NOW + 90 * 60e3);
    expect(text("sensor.ends", { format: "duration" })?.text).toBe("1h 30m");
    expect(text("sensor.ends", { format: "relative" })?.text).toBe("in 2 hours");
    expect(text("sensor.ends")).toBeNull();
  });
  it("writes a duration as a clock or a span, a power in its unit", () => {
    expect(text("sensor.run", { format: "clock" })?.text).toBe("1:12:10");
    expect(text("sensor.run", { format: "duration" })?.text).toBe("1h 12m");
    expect(text("sensor.power", { format: "power" })?.text).toBe("1.53 kW");
    expect(text("sensor.power", { format: "clock" })).toBeNull();
  });
  it("leaves the deprecated cards' header badges as they were", () => {
    const old = { ...ctx, countdowns: false } as RenderCtx;
    const plain = (entity: string, o: RawEntity) => {
      const ent = normalizeEntity({ entity, ...o }, actx, "e");
      return formatValue(old, ent, modelOf(old, ent));
    };
    expect(plain("sensor.ends", { format: "clock" })).toBeNull();
    expect(plain("sensor.ends", { format: "duration" })).toBeNull();
    expect(plain("sensor.run", { format: "clock" })).toBeNull();
    expect(plain("sensor.run", { format: "duration" })?.text).toBe("1h 12m");
    expect(plain("timer.t", {})).toBeNull();
  });
});
