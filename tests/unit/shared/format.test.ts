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
import { startOfDay } from "../../../src/shared/util.ts";
import type { HomeAssistant } from "../../../src/shared/ha.ts";

const hass = (language: string) => ({ locale: { language } }) as unknown as HomeAssistant;

describe("locale formatting", () => {
  it("keeps one formatter per language and options", () => {
    const a = numberFormat(hass("de"), { maximumFractionDigits: 1 });
    expect(numberFormat(hass("de"), { maximumFractionDigits: 1 })).toBe(a);
    expect(numberFormat(hass("en"), { maximumFractionDigits: 1 })).not.toBe(a);
    expect(numberFormat(hass("de"), { maximumFractionDigits: 2 })).not.toBe(a);
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

// the profile's settings beside the language (Home Assistant's FrontendLocaleData)
const profile = (locale: Record<string, string>, timeZone?: string) =>
  ({
    locale: { language: "en", ...locale },
    config: { time_zone: timeZone },
  }) as unknown as HomeAssistant;

describe("the profile's number format", () => {
  it("writes numbers with the separators the profile picks, not the language's", () => {
    expect(fmtNumber(profile({ number_format: "decimal_comma" }), 1234.5, 1)).toBe("1.234,5");
    expect(fmtNumber(profile({ number_format: "comma_decimal", language: "de" }), 1234.5, 1)).toBe(
      "1,234.5",
    );
    expect(fmtNumber(profile({ number_format: "space_comma" }), 1234.5, 1)).toMatch(/^1\s234,5$/);
    expect(fmtNumber(profile({ number_format: "quote_decimal" }), 1234.5, 1)).toMatch(
      /^1[’']234\.5$/,
    );
    expect(fmtNumber(profile({ number_format: "none" }), 1234.5, 1)).toBe("1234.5");
    expect(fmtNumber(profile({ number_format: "language", language: "de" }), 1234.5, 1)).toBe(
      "1.234,5",
    );
  });
  it("writes a power with the profile's separators", () => {
    expect(fmtPowerAuto(profile({ number_format: "decimal_comma" }), 1240, "W", null)).toBe(
      "1,24 kW",
    );
  });
  it("keeps the language's unit words in a duration", () => {
    expect(fmtDuration(profile({ number_format: "decimal_comma" }), 4320)).toBe("1h 12m");
  });
});

describe("the profile's time format and time zone", () => {
  const evening = new Date(2026, 5, 21, 20, 30);
  it("writes a time of day with the hours the profile picks", () => {
    expect(fmtTime(profile({}), evening)).toBe("08:30 PM");
    expect(fmtTime(profile({ time_format: "language" }), evening)).toBe("08:30 PM");
    expect(fmtTime(profile({ time_format: "24" }), evening)).toBe("20:30");
    expect(fmtTime(profile({ time_format: "12", language: "en-GB" }), evening)).toMatch(
      /^08:30\s?pm$/i,
    );
  });
  it("writes a time of day in the server's zone when the profile says so", () => {
    const at = Date.UTC(2026, 5, 21, 12, 0);
    const en24 = { language: "en-GB" };
    // the tests run in Europe/Berlin (UTC+2 in June)
    expect(fmtTime(profile(en24, "America/New_York"), at)).toBe("14:00");
    expect(fmtTime(profile({ ...en24, time_zone: "server" }, "America/New_York"), at)).toBe(
      "08:00",
    );
    // an unknown zone: the browser's
    expect(fmtTime(profile({ ...en24, time_zone: "server" }, "Nowhere/Else"), at)).toBe("14:00");
  });
  it("starts today at the midnight of the profile's zone", () => {
    const now = Date.UTC(2026, 5, 21, 3, 0); // 05:00 in Berlin, 23:00 the day before in New York
    expect(startOfDay(now)).toBe(Date.UTC(2026, 5, 20, 22, 0));
    expect(startOfDay(now, "America/New_York")).toBe(Date.UTC(2026, 5, 20, 4, 0));
  });
});

describe("relative days", () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 5, d, h, m).getTime();
  const rel = (t: number, now: number) => fmtRelative(hass("en"), t, now);
  it("counts the calendar days between the two moments", () => {
    // 20:00 → 02:00 the day after tomorrow (30 h)
    expect(rel(at(23, 2), at(21, 20))).toBe("in 2 days");
    // 08:00 → 23:00 two days before (33 h)
    expect(rel(at(19, 23), at(21, 8))).toBe("2 days ago");
    expect(rel(at(22, 18), at(21, 10))).toBe("tomorrow");
    expect(rel(at(20, 2), at(21, 10))).toBe("yesterday");
  });
  it("never says tomorrow for a moment later the same day", () => {
    expect(rel(at(21, 23, 46), at(21, 0, 10))).toBe("in 24 hours");
  });
  it("keeps hours for a moment less than a day away on the next day", () => {
    expect(rel(at(22, 1), at(21, 20))).toBe("in 5 hours");
  });
  it("counts the days in the profile's zone", () => {
    // 20:00 in Berlin is 14:00 in New York; 02:00 in Berlin two days on is 20:00 there tomorrow
    const ny = profile({ time_zone: "server" }, "America/New_York");
    expect(fmtRelative(ny, at(23, 2), at(21, 20))).toBe("tomorrow");
  });
});
