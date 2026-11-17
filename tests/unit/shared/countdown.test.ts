import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clockText,
  leftAt,
  LIVE_GREW,
  liveText,
  liveWidth,
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
  it("has its whole duration while idle, none where not known", () => {
    expect(timerClock(timer("idle", { duration: "0:45:00", remaining: "0:45:00" }), NOW)).toEqual({
      ends: null,
      left: 2700,
      total: 2700,
      idle: true,
    });
    expect(timerClock(timer("idle", {}), NOW)).toBeNull();
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

describe("the page clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });
  const el = () => document.body.appendChild(document.createElement("span"));
  const running = (left: number, total: number | null = 2700) => ({
    ends: NOW + left * 1000,
    left,
    total,
  });

  it("writes a text now and every second while it runs, down to its end", () => {
    const s = el();
    liveText(s, running(3), (l) => clockText(l));
    expect(s.textContent).toBe("0:03");
    // (it ticks just past each whole second left)
    vi.advanceTimersByTime(1100);
    expect(s.textContent).toBe("0:02");
    vi.advanceTimersByTime(5000);
    expect(s.textContent).toBe("0:00");
  });

  it("writes a bar's width for the share left", () => {
    const b = el();
    liveWidth(b, running(1350, 2700));
    expect(b.style.width).toBe("50.00%");
    vi.advanceTimersByTime(27_100);
    expect(parseFloat(b.style.width)).toBeCloseTo(49, 1);
    // no whole: nothing to draw
    const none = el();
    liveWidth(none, running(60, null));
    expect(none.style.width).toBe("");
  });

  it("writes one standing still once, and keeps nothing for it", () => {
    const s = el();
    liveText(s, { ends: null, left: 754, total: 2700 }, (l) => clockText(l));
    expect(s.textContent).toBe("12:34");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("drops what left the page, and stops when nothing is left", () => {
    const s = el();
    liveText(s, running(60), (l) => clockText(l));
    s.remove();
    vi.advanceTimersByTime(1000);
    expect(s.textContent).toBe("1:00");
    vi.advanceTimersByTime(1000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("tells its card when a text grew", () => {
    const s = el();
    let grew = 0;
    document.body.addEventListener(LIVE_GREW, () => grew++);
    // 1h, then 59m 59s
    liveText(s, running(3600.5), (l) => (l > 3599.5 ? "1h" : "59m 59s"));
    expect(s.textContent).toBe("1h");
    vi.advanceTimersByTime(1600);
    expect(s.textContent).toBe("59m 59s");
    expect(grew).toBe(1);
  });
});
