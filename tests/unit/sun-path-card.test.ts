import { afterEach, describe, it, expect, vi } from "vitest";
import { solarElevation, solarDay, type SolarDay } from "../../src/shared/solar.ts";
import { configToForm, editorSchema, formToConfig } from "../../src/sun-path/editor.ts";
import { fmtEvent, timeAt } from "../../src/sun-path/plot.ts";
import { nextEvent } from "../../src/sun-path/poster.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";
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
      type: "custom:sun-path-card-pro",
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
    expect(formToConfig(d2, cfg)).toEqual({ type: "custom:sun-path-card-pro" });
  });
  it("registers and sizes", () => {
    expect(customElements.get("sun-path-card-pro")).toBe(SunPathCard);
    expect(SunPathCard.getConfigElement().tagName.toLowerCase()).toBe("sun-path-card-pro-editor");
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

describe("the solar day around a moment", async () => {
  const { solarDayAround } = await import("../../src/shared/solar.ts");
  it("takes the calendar day's, or the neighbour's around midnight", () => {
    // a stand-in day: from 01:00 on its date to 01:00 the day after
    const make = (start: Date) => ({
      date: start.getDate(),
      start: start.getTime() + 3600e3,
      end: start.getTime() + 25 * 3600e3,
    });
    expect(solarDayAround(new Date(2026, 5, 21, 12), make).date).toBe(21);
    expect(solarDayAround(new Date(2026, 5, 21, 0, 30), make).date).toBe(20);
    expect(solarDayAround(new Date(2026, 5, 21, 23, 0), make).date).toBe(21);
  });
});

describe("sun-path-card poster: the next event", () => {
  const H = 3600e3;
  // a day with its events at these hours after midnight (null: none that day)
  const day = (sunrise: number | null, sunset: number | null, noon = 12, base = 0) =>
    ({
      sunrise: sunrise === null ? null : base + sunrise * H,
      sunset: sunset === null ? null : base + sunset * H,
      noon: base + noon * H,
    }) as SolarDay;
  const next = day(5, 21, 13, 24 * H);
  it("is today's sunrise before it, then today's sunset", () => {
    const fn = vi.fn(() => next);
    expect(nextEvent(day(6, 20), fn, 3 * H)).toEqual({ key: "sunrise", t: 6 * H });
    expect(nextEvent(day(6, 20), fn, 12 * H)).toEqual({ key: "sunset", t: 20 * H });
    // the moment of an event is past: the next one
    expect(nextEvent(day(6, 20), fn, 6 * H)).toEqual({ key: "sunset", t: 20 * H });
    // the next day is not worked out while today has an event to come
    expect(fn).not.toHaveBeenCalled();
  });
  it("is the next day's sunrise after today's sunset", () => {
    const fn = vi.fn(() => next);
    expect(nextEvent(day(6, 20), fn, 22 * H)).toEqual({ key: "sunrise", t: 29 * H });
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("names the solar noon on a polar day or night, the next day's once it passed", () => {
    const polar = day(null, null, 12);
    const polarNext = day(null, null, 12, 24 * H);
    expect(nextEvent(polar, () => polarNext, 8 * H)).toEqual({ key: "noon", t: 12 * H });
    expect(nextEvent(polar, () => polarNext, 15 * H)).toEqual({ key: "noon", t: 36 * H });
  });
  it("takes the next day's sunrise when the polar night ends tomorrow", () => {
    expect(nextEvent(day(null, null), () => next, 15 * H)).toEqual({ key: "sunrise", t: 29 * H });
  });
});

describe("sun-path-card poster", () => {
  const hass = () =>
    ({
      states: {},
      locale: { language: "en" },
      config: { latitude: LAT, longitude: LON, time_zone: "Europe/Berlin" },
    }) as unknown as HomeAssistant;
  const cards: SunPathCard[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
    vi.useRealTimers();
  });
  const mount = (cfg: Record<string, unknown>, at: Date) => {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    const el = new SunPathCard();
    el.setConfig(cfg);
    document.body.appendChild(el);
    el.hass = hass();
    cards.push(el);
    return el.shadowRoot!.querySelector("ha-card") as HTMLElement;
  };
  it("is three rows high, two at least", () => {
    const el = new SunPathCard();
    el.setConfig({ layout: "poster" });
    expect(el.getGridOptions()).toEqual({ columns: 6, rows: 3, min_columns: 3, min_rows: 2 });
    expect(el.getCardSize()).toBe(3);
    el.setConfig({ layout: "poster", show_dawn_dusk: true });
    expect(el.getCardSize()).toBe(3);
  });
  it("names today's sunset during the day, large, with how soon it comes", () => {
    const now = local(2026, 6, 21, 18);
    const card = mount({ layout: "poster" }, now);
    const sunset = solarDay(local(2026, 6, 21), LAT, LON).sunset!;
    expect(card.classList.contains("layout-poster")).toBe(true);
    const poster = card.querySelector<HTMLElement>(".body > .poster")!;
    expect(poster.querySelector(".pname")!.textContent).toBe("Sunset");
    expect(poster.querySelector(".big b")!.textContent).toBe(fmtEvent(hass(), sunset));
    expect(poster.querySelector(".plabel")!.textContent).toBe("in 4 hours");
    expect(poster.querySelector(".pbody > .plot")).not.toBeNull();
    // the sun is up: its icon and colour
    expect(poster.querySelector(".lead ha-icon")!.getAttribute("icon")).toBe(
      "mdi:white-balance-sunny",
    );
    expect(poster.style.getPropertyValue("--fe-color")).toBe("var(--amber-color)");
    // none of the card layout's rows
    expect(card.querySelector(".events")).toBeNull();
    expect(card.querySelector(".row .ev")).toBeNull();
  });
  it("names tomorrow's sunrise at night, with the night's icon and its own label", () => {
    const now = local(2026, 6, 21, 23);
    const card = mount({ layout: "poster", labels: { sunrise: "Dawn chorus" } }, now);
    const rise = solarDay(local(2026, 6, 22), LAT, LON).sunrise!;
    expect(card.querySelector(".pname")!.textContent).toBe("Dawn chorus");
    expect(card.querySelector(".big b")!.textContent).toBe(fmtEvent(hass(), rise));
    expect(card.querySelector(".plabel")!.textContent).toBe("in 6 hours");
    expect(card.querySelector(".lead ha-icon")!.getAttribute("icon")).toBe("mdi:weather-night");
    expect(card.querySelector<HTMLElement>(".poster")!.style.getPropertyValue("--fe-color")).toBe(
      "var(--indigo-color)",
    );
  });
  it("keeps the card layout's rows without layout: poster", () => {
    const card = mount({}, local(2026, 6, 21, 12));
    expect(card.classList.contains("layout-poster")).toBe(false);
    expect(card.querySelector(".poster")).toBeNull();
    expect(card.querySelectorAll(".row .ev")).toHaveLength(2);
    expect(card.querySelector(".events")).not.toBeNull();
  });
  it("is chosen in the editor: card by default, only a poster written to the config", () => {
    expect(configToForm({}).layout).toBe("card");
    expect(configToForm({ layout: "poster" }).layout).toBe("poster");
    const data = configToForm({ layout: "poster", title: "Sun" });
    expect(formToConfig(data, { layout: "poster", title: "Sun" })).toEqual({
      layout: "poster",
      title: "Sun",
    });
    expect(formToConfig({ ...data, layout: "card" }, { layout: "poster" })).not.toHaveProperty(
      "layout",
    );
    const field = editorSchema().find((f) => f.name === "layout") as unknown as {
      selector: { select: { options: { value: string; label: string }[] } };
    };
    expect(field.selector.select.options.map((o) => o.value)).toEqual(["card", "poster"]);
    expect(field.selector.select.options.every((o) => o.label.length > 0)).toBe(true);
  });
});
