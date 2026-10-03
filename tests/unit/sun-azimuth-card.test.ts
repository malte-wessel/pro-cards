import { describe, it, expect } from "vitest";
import { solarPosition } from "../../src/shared/solar.ts";
import {
  angleDiff,
  compassKey,
  isUp,
  shadowRatio,
  sunAt,
  sunDay,
} from "../../src/sun-azimuth/day.ts";
import { litSides, nextSide, sidesOf, timelineSpan } from "../../src/sun-azimuth/sides.ts";
import { dialGeometry, polar } from "../../src/sun-azimuth/dial.ts";
import { sceneGeometry } from "../../src/sun-azimuth/scene.ts";
import { DIAL, SCENE } from "../../src/sun-azimuth/constants.ts";
import { SunAzimuthCard } from "../../src/sun-azimuth-card.ts";

const LAT = 51.23,
  LON = 6.78; // Düsseldorf
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const utc = (y: number, m: number, d: number, h: number, min = 0) => Date.UTC(y, m - 1, d, h, min);
const HOUR = 3600e3;

// the local calendar day of 21 June and a few instants of it (built in UTC, so the bearings hold
// on any machine; the day window itself follows the machine's zone like the card's)
const summer = sunDay(local(2026, 6, 21), LAT, LON);
const winter = sunDay(local(2026, 12, 21), LAT, LON);
const morning = sunAt(utc(2026, 6, 21, 4), LAT, LON); // 06:00 CEST, just after sunrise
const forenoon = sunAt(utc(2026, 6, 21, 10), LAT, LON); // 12:00 CEST, the frozen test time
const evening = sunAt(utc(2026, 6, 21, 16), LAT, LON); // 18:00 CEST
const night = sunAt(utc(2026, 6, 21, 0), LAT, LON); // 02:00 CEST

describe("sun-azimuth-card solar position", () => {
  it("gives the azimuth clockwise from north", () => {
    // solar noon: due south, at 90 - 51.23 + 23.44 ≈ 62.2°
    const noon = solarPosition(new Date(utc(2026, 6, 21, 11, 33)), LAT, LON);
    expect(noon.azimuth).toBeGreaterThan(178);
    expect(noon.azimuth).toBeLessThan(182);
    expect(noon.elevation).toBeCloseTo(62.2, 0);
    // a summer morning: the sun stands east
    const am = solarPosition(new Date(utc(2026, 6, 21, 6)), LAT, LON);
    expect(am.azimuth).toBeGreaterThan(70);
    expect(am.azimuth).toBeLessThan(90);
    // an evening: west
    expect(evening.az).toBeGreaterThan(260);
    expect(evening.az).toBeLessThan(275);
    // around midnight: north, well below the horizon
    expect(Math.min(night.az, 360 - night.az)).toBeLessThan(15);
    expect(night.el).toBeLessThan(-10);
  });
  it("finds the day's events with their bearings", () => {
    expect(summer.samples.length).toBe(24 * 60 + 1);
    expect(summer.samples[0].t).toBe(summer.start);
    expect(summer.end - summer.start).toBe(24 * HOUR);
    const { sunrise, sunset, noon } = summer;
    expect(sunrise!.t).toBeLessThan(noon.t);
    expect(noon.t).toBeLessThan(sunset!.t);
    // the long day: ~16.6 h, rising in the north-east and setting in the north-west
    expect(sunset!.t - sunrise!.t).toBeGreaterThan(16 * HOUR);
    expect(sunset!.t - sunrise!.t).toBeLessThan(17 * HOUR);
    expect(sunrise!.az).toBeCloseTo(49, 0);
    expect(sunset!.az).toBeCloseTo(311, 0);
    expect(noon.az).toBeCloseTo(180, 0);
    expect(noon.el).toBeCloseTo(62.2, 0);
    // the events sit on the refracted horizon, interpolated between the minute samples
    expect(sunrise!.el).toBeCloseTo(-0.833, 2);
    expect(sunset!.el).toBeCloseTo(-0.833, 2);
    // the short day: ~8 h, rising in the south-east
    expect(winter.sunset!.t - winter.sunrise!.t).toBeLessThan(8 * HOUR);
    expect(winter.sunrise!.az).toBeCloseTo(128, 0);
    expect(winter.sunset!.az).toBeCloseTo(232, 0);
    expect(winter.noon.el).toBeCloseTo(15, 0);
  });
  it("has no sunrise or sunset in polar day and night", () => {
    const polarDay = sunDay(local(2026, 6, 21), 80, 20);
    expect(polarDay.sunrise).toBeNull();
    expect(polarDay.sunset).toBeNull();
    expect(polarDay.noon.el).toBeGreaterThan(0);
    const polarNight = sunDay(local(2026, 12, 21), 80, 20);
    expect(polarNight.sunrise).toBeNull();
    expect(polarNight.noon.el).toBeLessThan(0);
  });
  it("has small helpers for angles, the horizon and shadows", () => {
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(0, 180)).toBe(180);
    expect(angleDiff(90, 90)).toBe(0);
    expect(compassKey(0)).toBe("wind.dir.n");
    expect(compassKey(137.8)).toBe("wind.dir.se");
    expect(compassKey(359)).toBe("wind.dir.n");
    expect(isUp({ t: 0, az: 0, el: -0.5 })).toBe(true);
    expect(isUp({ t: 0, az: 0, el: -1 })).toBe(false);
    expect(shadowRatio(45)).toBeCloseTo(1, 5);
    expect(shadowRatio(26.57)).toBeCloseTo(2, 1);
    expect(shadowRatio(0.2)).toBeNull();
    expect(shadowRatio(-5)).toBeNull();
  });
});

describe("sun-azimuth-card sides of the house", () => {
  it("lights the sides the sun faces and finds their windows", () => {
    const sides = sidesOf(summer, 0, forenoon);
    expect(sides.map((s) => s.key)).toEqual(["north", "east", "south", "west"]);
    expect(sides.map((s) => s.normal)).toEqual([0, 90, 180, 270]);
    // at 12:00 CEST the sun stands south-east: the east and south sides are lit
    expect(sides.map((s) => s.litNow)).toEqual([false, true, true, false]);
    expect(litSides(sides).map((s) => s.key)).toEqual(["east", "south"]);
    // the midsummer sun rises and sets north of east / west: the north side gets sun twice
    const [north, east, south, west] = sides;
    expect(north.windows.length).toBe(2);
    expect(north.windows[0].from).toBeLessThan(summer.noon.t);
    expect(north.windows[1].from).toBeGreaterThan(summer.noon.t);
    expect(east.windows.length).toBe(1);
    expect(south.windows.length).toBe(1);
    expect(west.windows.length).toBe(1);
    // the east side's window ends around solar noon, the west side's begins there
    expect(Math.abs(east.windows[0].to - summer.noon.t)).toBeLessThan(5 * 60e3);
    expect(Math.abs(west.windows[0].from - summer.noon.t)).toBeLessThan(5 * 60e3);
    // the next window still to come, per side and for the house
    expect(west.nextFrom).toBe(west.windows[0].from);
    expect(north.nextFrom).toBe(north.windows[1].from);
    expect(east.nextFrom).toBeNull();
    expect(nextSide(sides)!.key).toBe("west");
    // how directly the sun hits: a lit side between 0 and 1, an unlit one 0
    expect(east.incidence).toBeGreaterThan(0);
    expect(east.incidence).toBeLessThan(1);
    expect(south.incidence).toBeGreaterThan(east.incidence);
    expect(north.incidence).toBe(0);
  });
  it("turns with the house", () => {
    const sides = sidesOf(summer, 90, forenoon);
    expect(sides.map((s) => s.normal)).toEqual([90, 180, 270, 0]);
    expect(sides.map((s) => s.litNow)).toEqual([true, true, false, false]);
    expect(sidesOf(summer, -90, forenoon).map((s) => s.normal)).toEqual([270, 0, 90, 180]);
    expect(sidesOf(summer, 380, forenoon)[0].normal).toBe(20);
  });
  it("gives the north side no sun in winter", () => {
    const sides = sidesOf(winter, 0, sunAt(utc(2026, 12, 21, 11), LAT, LON));
    expect(sides[0].windows).toEqual([]);
    expect(sides[0].nextFrom).toBeNull();
    expect(sides[2].litNow).toBe(true);
    expect(nextSide(sides)!.key).toBe("west");
  });
  it("lights nothing at night and after sunset nothing is next", () => {
    const sides = sidesOf(summer, 0, night);
    expect(litSides(sides)).toEqual([]);
    expect(nextSide(sides)!.key).toBe("north"); // the first to catch the rising sun
    const late = sidesOf(summer, 0, sunAt(utc(2026, 6, 21, 21), LAT, LON));
    expect(nextSide(late)).toBeNull();
  });
  it("draws the timeline from the hour before sunrise to the hour after sunset", () => {
    const span = timelineSpan(summer);
    const minutes = (t: number) => new Date(t).getMinutes();
    expect(minutes(span.from)).toBe(0);
    expect(minutes(span.to)).toBe(0);
    expect(span.from).toBeLessThanOrEqual(summer.sunrise!.t - HOUR / 2);
    expect(span.from).toBeGreaterThan(summer.sunrise!.t - 1.5 * HOUR);
    expect(span.to).toBeGreaterThanOrEqual(summer.sunset!.t + HOUR / 2);
    expect(span.to).toBeLessThan(summer.sunset!.t + 1.5 * HOUR);
    expect(span.from).toBeGreaterThanOrEqual(summer.start);
    expect(span.to).toBeLessThanOrEqual(summer.end);
    // polar day: the whole day
    const polar = sunDay(local(2026, 6, 21), 80, 20);
    expect(timelineSpan(polar)).toEqual({ from: polar.start, to: polar.end });
  });
});

describe("sun-azimuth-card sky dial", () => {
  const C = DIAL.size / 2;
  it("maps the sky to the disc: zenith at the centre, horizon on the rim", () => {
    expect(polar(0, 90)).toEqual([C, C]);
    expect(polar(0, 0)).toEqual([C, C - DIAL.r]);
    expect(polar(90, 0)[0]).toBeCloseTo(C + DIAL.r, 5);
    expect(polar(180, 45)[1]).toBeCloseTo(C + DIAL.r / 2, 5);
    // below the horizon lands on the rim, not outside
    expect(polar(270, -20)[0]).toBeCloseTo(C - DIAL.r, 5);
  });
  it("draws the day: path split at now, daylight arc, lit edges", () => {
    const sides = sidesOf(summer, 20, forenoon);
    const g = dialGeometry(summer, forenoon, 20, sides);
    expect(g.size).toBe(DIAL.size);
    expect(g.past.startsWith("M")).toBe(true);
    expect(g.future.startsWith("M")).toBe(true);
    expect(g.beam).toContain(`L${C} ${C}`);
    expect(g.azArc.startsWith("M")).toBe(true);
    expect(g.azChip).not.toBeNull();
    expect(g.dayArc.startsWith("M")).toBe(true);
    // the sun in the south-east quadrant, high up (close to the centre)
    expect(g.sun[0]).toBeGreaterThan(C);
    expect(g.sun[1]).toBeGreaterThan(C);
    expect(Math.hypot(g.sun[0] - C, g.sun[1] - C)).toBeLessThan(DIAL.r / 2);
    // sunrise mark in the north-east, sunset mark in the north-west, both on the rim
    expect(g.rise![0]).toBeGreaterThan(C);
    expect(g.rise![1]).toBeLessThan(C);
    expect(g.set![0]).toBeLessThan(C);
    expect(Math.hypot(g.rise![0] - C, g.rise![1] - C)).toBeCloseTo(DIAL.r, 5);
    // one edge per side, lit like the sides
    expect(g.edges.length).toBe(4);
    expect(g.edges.map((e) => e.lit)).toEqual(sides.map((s) => s.litNow));
    expect(g.labels.map((l) => l.bearing)).toEqual([0, 90, 180, 270]);
    expect(g.ticks.split("M").length - 1).toBe(36);
  });
  it("draws the night: no beam, no azimuth arc, the whole path still to come", () => {
    const g = dialGeometry(summer, night, 20, sidesOf(summer, 20, night));
    expect(g.beam).toBe("");
    expect(g.azArc).toBe("");
    expect(g.azChip).toBeNull();
    expect(g.past).toBe("");
    expect(g.future.startsWith("M")).toBe(true);
    // the sun sits on the rim in the north
    expect(Math.hypot(g.sun[0] - C, g.sun[1] - C)).toBeCloseTo(DIAL.r, 5);
    expect(g.sun[1]).toBeLessThan(C - DIAL.r / 2);
  });
  it("has no daylight arc and no marks in polar day", () => {
    const polar = sunDay(local(2026, 6, 21), 80, 20);
    const now = sunAt(utc(2026, 6, 21, 10), 80, 20);
    const g = dialGeometry(polar, now, 0, sidesOf(polar, 0, now));
    expect(g.dayArc).toBe("");
    expect(g.rise).toBeNull();
    expect(g.set).toBeNull();
    expect(g.past.length).toBeGreaterThan(0);
  });
});

describe("sun-azimuth-card 3D scene", () => {
  it("shows the walls facing the camera and drops the back-most compass point", () => {
    const sides = sidesOf(summer, 20, forenoon);
    const g = sceneGeometry(summer, forenoon, LAT, 20, 180, sides);
    expect(g.w).toBe(SCENE.w);
    expect(g.h).toBe(SCENE.h);
    // from the north looking south, two walls show: the north and one of east / west
    expect(g.faces.length).toBe(2);
    expect(g.roofEdges.length).toBe(4);
    expect(g.cardinals.map((c) => c.bearing)).toEqual([0, 90, 270]);
    expect(
      sceneGeometry(summer, forenoon, LAT, 20, 0, sides).cardinals.map((c) => c.bearing),
    ).toEqual([90, 180, 270]);
    expect(
      sceneGeometry(summer, forenoon, LAT, 20, 90, sides).cardinals.map((c) => c.bearing),
    ).toEqual([0, 180, 270]);
    // the sun is up: drawn with its drop line, ground dot, chips and the shadow
    expect(g.sun).not.toBeNull();
    expect(g.groundDot).not.toBeNull();
    expect(g.chip).not.toBeNull();
    expect(g.azChip).not.toBeNull();
    expect(g.drop.startsWith("M")).toBe(true);
    expect(g.ray.startsWith("M")).toBe(true);
    expect(g.shadow.endsWith("Z")).toBe(true);
    expect(g.pathFrontPast + g.pathFrontFuture + g.pathBackPast + g.pathBackFuture).toContain("M");
    // everything drawn stays inside the box
    const nums = (d: string) =>
      [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]);
    for (const [x, y] of nums(g.ground + g.shadow + g.roof)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(SCENE.w);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(SCENE.h);
    }
  });
  it("hides the sun and its lines below the horizon", () => {
    const g = sceneGeometry(summer, night, LAT, 20, 180, sidesOf(summer, 20, night));
    expect(g.sun).toBeNull();
    expect(g.groundDot).toBeNull();
    expect(g.chip).toBeNull();
    expect(g.azChip).toBeNull();
    expect(g.drop).toBe("");
    expect(g.ray).toBe("");
    expect(g.shadow).toBe("");
    expect(g.azArc).toBe("");
    expect(g.faces.every((f) => !f.lit)).toBe(true);
    // the path is all still to come
    expect(g.pathFrontPast + g.pathBackPast).toBe("");
    expect(g.pathFrontFuture + g.pathBackFuture).toContain("M");
  });
  it("casts a longer shadow when the sun is low", () => {
    const area = (d: string) => {
      const pts = [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]);
      let a = 0;
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i],
          [x2, y2] = pts[(i + 1) % pts.length];
        a += x1 * y2 - x2 * y1;
      }
      return Math.abs(a) / 2;
    };
    const high = sceneGeometry(summer, forenoon, LAT, 0, 180, sidesOf(summer, 0, forenoon));
    const low = sceneGeometry(summer, morning, LAT, 0, 180, sidesOf(summer, 0, morning));
    expect(area(low.shadow)).toBeGreaterThan(area(high.shadow));
  });
});

describe("sun-azimuth-card element", () => {
  it("registers and sizes by view and sections", () => {
    expect(customElements.get("sun-azimuth-card")).toBe(SunAzimuthCard);
    expect(SunAzimuthCard.getStubConfig()).toEqual({ title: "Sun azimuth" });
    const el = new SunAzimuthCard();
    el.setConfig({});
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: "auto", min_columns: 6 });
    expect(el.getCardSize()).toBe(14); // dial 7 + house 1 + events 1 + sides 5
    el.setConfig({ view: "ring" });
    expect(el.getCardSize()).toBe(8); // ring 3 + sides 5
    el.setConfig({ view: "3d", title: "Sun", camera_slider: true });
    expect(el.getCardSize()).toBe(15);
    el.setConfig({ view: "3d", show_sides: false, show_house: false, show_events: false });
    expect(el.getCardSize()).toBe(6);
  });
  it("normalises the config", () => {
    const el = new SunAzimuthCard();
    el.setConfig({});
    expect(el._config).toMatchObject({
      view: "dial",
      rotation: 0,
      sides: {},
      camera: 180,
      camera_slider: false,
      hover_preview: true,
      show_house: true,
      show_events: true,
      show_sides: true,
      sun_color: "amber",
      night_color: "indigo",
      sky_color: "light-blue",
    });
    el.setConfig({
      view: "bogus",
      house: { rotation: 45, sides: { north: "Street", east: "", south: 3 as never } },
      camera: -90,
      hover_preview: false,
    });
    expect(el._config.view).toBe("dial"); // an unknown view falls back
    expect(el._config.rotation).toBe(45);
    expect(el._config.sides).toEqual({ north: "Street" }); // only non-empty strings count
    expect(el._config.camera).toBe(-90);
    expect(el._camera).toBe(270); // the live camera is normalised to 0..360
    expect(el._config.hover_preview).toBe(false);
    el.setConfig({ view: "3d", house: null, camera: "x" as never });
    expect(el._config.view).toBe("3d");
    expect(el._config.rotation).toBe(0);
    expect(el._config.camera).toBe(180);
  });
});
