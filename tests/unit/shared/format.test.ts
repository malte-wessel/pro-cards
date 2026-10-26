import { describe, it, expect } from "vitest";
import {
  dateFormat,
  durationSeconds,
  fmtDuration,
  fmtNumber,
  fmtPowerAuto,
  fmtRelative,
  fmtTime,
  numberFormat,
} from "../../../src/shared/format.ts";
import type { HomeAssistant } from "../../../src/shared/ha.ts";

const hass = (language: string) => ({ locale: { language } }) as unknown as HomeAssistant;

describe("locale formatting", () => {
  it("keeps one formatter per language and options", () => {
    const a = numberFormat("de", { maximumFractionDigits: 1 });
    expect(numberFormat("de", { maximumFractionDigits: 1 })).toBe(a);
    expect(numberFormat("en", { maximumFractionDigits: 1 })).not.toBe(a);
    expect(numberFormat("de", { maximumFractionDigits: 2 })).not.toBe(a);
    const d = dateFormat("de", { weekday: "short" });
    expect(dateFormat("de", { weekday: "short" })).toBe(d);
  });
  it("formats numbers and times in the user's language", () => {
    expect(fmtNumber(hass("de"), 1234.5, 1)).toBe("1.234,5");
    expect(fmtNumber(hass("en-GB"), 1234.5, 1)).toBe("1,234.5");
    expect(fmtNumber(hass("en-GB"), 2, 2)).toBe("2.00");
    expect(fmtTime(hass("en-GB"), new Date(2026, 5, 21, 9, 5))).toBe("09:05");
  });
});

describe("durations, moments and power", () => {
  it("writes a duration in its two largest units, in the language's symbols", () => {
    expect(fmtDuration(hass("en"), 4320)).toBe("1h 12m");
    expect(fmtDuration(hass("de"), 4320)).toBe("1h 12 Min.");
    expect(fmtDuration(hass("en"), 90000)).toBe("1d 1h");
    expect(fmtDuration(hass("en"), 3600)).toBe("1h");
    expect(fmtDuration(hass("en"), 20)).toBe("20s");
    // an age: the largest unit alone
    expect(fmtDuration(hass("en"), 22000, true)).toBe("6h");
  });
  it("reads a value in a time unit as seconds, and nothing else", () => {
    expect(durationSeconds(42, "min")).toBe(2520);
    expect(durationSeconds(2, "h")).toBe(7200);
    expect(durationSeconds(42, "%")).toBeNull();
  });
  it("writes a moment as its time from now, rounded before the unit is picked", () => {
    const now = Date.UTC(2026, 5, 21, 10);
    const rel = (min: number, lang = "en") => fmtRelative(hass(lang), now + min * 60e3, now);
    expect(rel(38)).toBe("in 38 minutes");
    expect(rel(38, "de")).toBe("in 38 Minuten");
    expect(rel(59.6)).toBe("in 1 hour");
    expect(rel(-120)).toBe("2 hours ago");
    expect(rel(0.3)).toBe("this minute");
    expect(rel(30 * 60)).toBe("tomorrow");
  });
  it("writes a power in the unit that suits it", () => {
    expect(fmtPowerAuto(hass("en"), 980, "W", null)).toBe("980 W");
    expect(fmtPowerAuto(hass("en"), 1240, "W", null)).toBe("1.24 kW");
    expect(fmtPowerAuto(hass("en"), 3.4, "kW", null)).toBe("3.4 kW");
    expect(fmtPowerAuto(hass("en"), 2500000, "W", 1)).toBe("2.5 MW");
    expect(fmtPowerAuto(hass("en"), 5, "%", null)).toBeNull();
  });
});
