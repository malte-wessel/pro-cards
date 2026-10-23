import { describe, it, expect } from "vitest";
import { dateFormat, fmtNumber, fmtTime, numberFormat } from "../../../src/shared/format.ts";
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
