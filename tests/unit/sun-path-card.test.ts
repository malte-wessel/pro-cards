import { describe, it, expect } from "vitest";
import { solarElevation, solarDay } from "../../src/shared/solar.ts";
import { configToForm, formToConfig } from "../../src/sun-path/editor.ts";
import { timeAt } from "../../src/sun-path/plot.ts";
import { defaultLabel } from "../../src/sun-path/constants.ts";
import { SunPathCard } from "../../src/sun-path-card.ts";

const LAT = 51.23,
  LON = 6.78; // Düsseldorf
const local = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h);

describe("sun-path-card solar math", () => {
  it("computes plausible elevations", () => {
    // summer solstice solar noon ≈ 90 - 51.23 + 23.44 ≈ 62.2°
    const noon = new Date(Date.UTC(2026, 5, 21, 11, 33)); // 13:33 CEST
    expect(solarElevation(noon, LAT, LON)).toBeGreaterThan(61);
    expect(solarElevation(noon, LAT, LON)).toBeLessThan(63);
    const midnight = new Date(Date.UTC(2026, 5, 21, 23, 30));
    expect(solarElevation(midnight, LAT, LON)).toBeLessThan(-10);
    const winterNoon = new Date(Date.UTC(2026, 11, 21, 11, 30));
    expect(solarElevation(winterNoon, LAT, LON)).toBeGreaterThan(14);
    expect(solarElevation(winterNoon, LAT, LON)).toBeLessThan(17);
  });
  it("finds the day's events in order", () => {
    const day = solarDay(local(2026, 6, 21), LAT, LON);
    expect(day.dawn).toBeLessThan(day.sunrise!);
    expect(day.sunrise).toBeLessThan(day.noon);
    expect(day.noon).toBeLessThan(day.sunset!);
    expect(day.sunset).toBeLessThan(day.dusk!);
    expect(day.maxElev).toBeGreaterThan(61);
    expect(day.samples.length).toBe(24 * 60 + 1);
    // the window is centred on solar noon
    expect(day.noon - day.start).toBe(12 * 3600e3);
    expect(day.end - day.noon).toBe(12 * 3600e3);
    expect(day.samples[0].t).toBe(day.start);
    expect(day.samples[day.samples.length - 1].t).toBe(day.end);
    const hh = (t: number) => new Date(t).getHours() + new Date(t).getMinutes() / 60;
    // Düsseldorf on 21 June: sunrise ~05:15, sunset ~21:50 local (CEST); allow for the test machine's zone
    expect(day.sunset! - day.sunrise!).toBeGreaterThan(16 * 3600e3);
    expect(day.sunset! - day.sunrise!).toBeLessThan(17 * 3600e3);
    expect(hh(day.noon) - hh(day.sunrise!)).toBeCloseTo(hh(day.sunset!) - hh(day.noon), 0);
  });
  it("returns null events for polar day and night", () => {
    expect(solarDay(local(2026, 6, 21), 80, 20).sunset).toBeNull();
    expect(solarDay(local(2026, 6, 21), 80, 20).sunrise).toBeNull();
    expect(solarDay(local(2026, 12, 21), 80, 20).sunrise).toBeNull();
  });
});

describe("sun-path-card editor and element", () => {
  it("round-trips the form and drops defaults", () => {
    const cfg = {
      type: "custom:sun-path-card",
      title: "Sun",
      icon: "mdi:weather-sunset",
      show_dawn_dusk: false,
      show_tooltip: false,
      day_color: "orange",
      labels: { sunrise: "Rise" },
    };
    const data = configToForm(cfg);
    expect(data).toMatchObject({
      title: "Sun",
      icon: "mdi:weather-sunset",
      show_dawn_dusk: false,
      show_tooltip: false,
      day_color: "orange",
      night_color: "",
      label_sunrise: "Rise",
      label_noon: "",
    });
    expect(formToConfig(data, cfg)).toEqual(cfg);
    const d2 = {
      ...data,
      day_color: "light-blue",
      show_dawn_dusk: true,
      show_tooltip: true,
      label_sunrise: defaultLabel(undefined, "sunrise"),
      title: "",
      icon: "",
    };
    expect(formToConfig(d2, cfg)).toEqual({ type: "custom:sun-path-card" });
  });
  it("registers and sizes", () => {
    expect(customElements.get("sun-path-card")).toBe(SunPathCard);
    expect(SunPathCard.getConfigElement().tagName.toLowerCase()).toBe("sun-path-card-editor");
    const el = new SunPathCard();
    el.setConfig({});
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: "auto", min_columns: 6 });
    expect(el.getCardSize()).toBe(6);
    el.setConfig({ show_dawn_dusk: false });
    expect(el.getCardSize()).toBe(5);
  });
});

describe("sun-path-card hover", () => {
  it("maps a plot x back to the time of day, clamped to the day", () => {
    const start = local(2026, 6, 21).getTime(),
      end = local(2026, 6, 22).getTime();
    const day = { start, end };
    expect(timeAt(day, 0, 400)).toBe(start);
    expect(timeAt(day, 400, 400)).toBe(end);
    expect(timeAt(day, 200, 400)).toBe((start + end) / 2);
    expect(timeAt(day, -30, 400)).toBe(start);
    expect(timeAt(day, 900, 400)).toBe(end);
  });
});
