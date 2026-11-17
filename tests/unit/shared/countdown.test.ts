import { describe, it, expect } from "vitest";
import {
  clockText,
  leftAt,
  momentAhead,
  parseHms,
  shareLeft,
  timerClock,
} from "../../../src/shared/countdown.ts";
import type { HassEntity } from "../../../src/shared/ha.ts";

const NOW = Date.parse("2026-06-21T10:00:00Z");
const timer = (state: string, attributes: Record<string, unknown>, changed = NOW) =>
  ({
    entity_id: "timer.t",
    state,
    attributes,
    last_changed: new Date(changed).toISOString(),
  }) as unknown as HassEntity;

describe("parseHms", () => {
  it("reads Home Assistant's spans", () => {
    expect(parseHms("0:45:00")).toBe(2700);
    expect(parseHms("1:02:03")).toBe(3723);
    expect(parseHms("0:00:05.5")).toBe(5.5);
    expect(parseHms("1 day, 2:00:00")).toBe(93600);
    expect(parseHms("3 days, 0:00:01")).toBe(259201);
    expect(parseHms(90)).toBe(90);
  });
  it("reads nothing else", () => {
    for (const v of ["", "45", "soon", null, undefined, -1, NaN]) expect(parseHms(v)).toBeNull();
  });
});

describe("clockText", () => {
  it("writes minutes and seconds, hours where there are", () => {
    expect(clockText(0)).toBe("0:00");
    expect(clockText(59)).toBe("0:59");
    expect(clockText(754)).toBe("12:34");
    expect(clockText(3599)).toBe("59:59");
    expect(clockText(3600)).toBe("1:00:00");
    expect(clockText(93784)).toBe("26:03:04");
  });
  it("counts a part of a second as a whole one, so it reaches 0:00 at the end", () => {
    expect(clockText(753.2)).toBe("12:34");
    expect(clockText(0.4)).toBe("0:01");
    expect(clockText(-3)).toBe("0:00");
  });
});

describe("timerClock", () => {
  const fin = new Date(NOW + 754e3).toISOString();
  it("runs until finishes_at while active", () => {
    const cd = timerClock(timer("active", { duration: "0:45:00", finishes_at: fin }), NOW)!;
    expect(cd).toEqual({ ends: NOW + 754e3, left: 754, total: 2700 });
    expect(leftAt(cd, NOW + 4000)).toBe(750);
    expect(shareLeft(cd, NOW)).toBeCloseTo(754 / 2700);
    expect(leftAt(cd, NOW + 999e3)).toBe(0);
  });
  it("takes its remaining from its last change without finishes_at", () => {
    const st = timer("active", { duration: "0:45:00", remaining: "0:10:00" }, NOW - 60e3);
    expect(timerClock(st, NOW)).toEqual({ ends: NOW + 540e3, left: 540, total: 2700 });
  });
  it("stands at its remaining while paused", () => {
    const cd = timerClock(timer("paused", { duration: "0:45:00", remaining: "0:12:34" }), NOW)!;
    expect(cd).toEqual({ ends: null, left: 754, total: 2700 });
    expect(leftAt(cd, NOW + 60e3)).toBe(754);
  });
  it("has none while idle or not known", () => {
    expect(timerClock(timer("idle", { duration: "0:45:00", remaining: "0:45:00" }), NOW)).toBe(
      null,
    );
    expect(timerClock(timer("unavailable", {}), NOW)).toBeNull();
    expect(timerClock(timer("active", {}), NOW)).toBeNull();
    expect(timerClock(undefined, NOW)).toBeNull();
  });
  it("has no whole without a duration", () => {
    const cd = timerClock(timer("active", { finishes_at: fin }), NOW)!;
    expect(cd.total).toBeNull();
    expect(shareLeft(cd, NOW)).toBeNull();
  });
});

describe("momentAhead", () => {
  it("runs until a date ahead, stands at zero past it", () => {
    expect(momentAhead(new Date(NOW + 90e3).toISOString(), NOW)).toEqual({
      ends: NOW + 90e3,
      left: 90,
      total: null,
    });
    expect(momentAhead(new Date(NOW - 90e3).toISOString(), NOW)).toEqual({
      ends: null,
      left: 0,
      total: null,
    });
  });
  it("is none for what is no date", () => {
    for (const v of ["12", "active", "", null, 5]) expect(momentAhead(v, NOW)).toBeNull();
  });
});
