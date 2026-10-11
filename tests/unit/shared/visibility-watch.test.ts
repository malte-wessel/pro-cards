import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeAssistant } from "../../../src/shared/ha.ts";
import { VisibilityWatch } from "../../../src/shared/visibility-watch.ts";
import { normalizeVisibility, type TimeCondition } from "../../../src/shared/visibility.ts";

const hass = { config: { time_zone: "UTC" }, locale: { language: "en", time_zone: "server" } };
const after = (t: string) =>
  normalizeVisibility([{ condition: "time", after: t }], {
    type: "t",
    label: "x",
    entity: null,
  })![0] as TimeCondition;

afterEach(() => vi.useRealTimers());

describe("VisibilityWatch", () => {
  it("fires at the next edge of a time window while connected", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const w = new VisibilityWatch(onChange);
    w.set({ media: new Set(), times: [after("12:30")] });
    const now = Date.UTC(2026, 5, 21, 12, 0, 0);
    w.arm(hass as unknown as HomeAssistant, now);
    vi.advanceTimersByTime(30 * 60e3 + 20);
    expect(onChange).not.toHaveBeenCalled(); // not connected yet
    w.connect();
    w.arm(hass as unknown as HomeAssistant, now);
    vi.advanceTimersByTime(30 * 60e3);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(onChange).toHaveBeenCalledTimes(1);
    w.arm(hass as unknown as HomeAssistant, now);
    w.disconnect();
    vi.advanceTimersByTime(3600e3);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it("listens to its media queries only while connected", () => {
    const listeners = new Map<string, () => void>();
    const mql = (q: string) => ({
      matches: q.includes("600"),
      addEventListener: (_: string, fn: () => void) => listeners.set(q, fn),
      removeEventListener: () => listeners.delete(q),
    });
    vi.stubGlobal("matchMedia", mql);
    const onChange = vi.fn();
    const w = new VisibilityWatch(onChange);
    w.set({ media: new Set(["(min-width: 600px)"]), times: [] });
    expect(listeners.size).toBe(0);
    w.connect();
    expect(listeners.size).toBe(1);
    expect(w.media("(min-width: 600px)")).toBe(true);
    expect(w.media("(min-width: 900px)")).toBe(false);
    listeners.get("(min-width: 600px)")!();
    expect(onChange).toHaveBeenCalledTimes(1);
    // a new config while connected moves the listeners over
    w.set({ media: new Set(["(min-width: 900px)"]), times: [] });
    expect([...listeners.keys()]).toEqual(["(min-width: 900px)"]);
    w.disconnect();
    expect(listeners.size).toBe(0);
    vi.unstubAllGlobals();
  });
});
