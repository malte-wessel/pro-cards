import { describe, it, expect } from "vitest";
import { solarPosition } from "../../src/shared/solar.ts";
import {
  angleDiff,
  compassKey,
  directionKey,
  isUp,
  sunAt,
  sunDay,
} from "../../src/sun-azimuth/day.ts";
import { litSides, nextSide, sidesOf, timelineSpan } from "../../src/sun-azimuth/sides.ts";
import { dialBox, dialGeometry, polar } from "../../src/sun-azimuth/dial.ts";
import { wallBands } from "../../src/sun-azimuth/edges.ts";
import { houseSolid } from "../../src/sun-azimuth/house.ts";
import { nearestOnTrack, TRACK_STEP, trackOf } from "../../src/sun-azimuth/track.ts";
import { sceneBox, sceneGeometry } from "../../src/sun-azimuth/scene.ts";
import {
  defaultSideName,
  DIAL,
  LINE_MIN,
  lineScale,
  pointOf,
  SCENE,
} from "../../src/sun-azimuth/constants.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";
import { SunAzimuthCard } from "../../src/sun-azimuth-card.ts";

const LAT = 51.23,
  LON = 6.78; // Düsseldorf
const W = 416; // the 3D scene's column width
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
  it("has small helpers for angles, the horizon and compass points", () => {
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(0, 180)).toBe(180);
    expect(angleDiff(90, 90)).toBe(0);
    expect(compassKey(0)).toBe("wind.dir.n");
    expect(compassKey(137.8)).toBe("wind.dir.se");
    expect(compassKey(359)).toBe("wind.dir.n");
    // the head and the side names round to eight points
    expect([0, 22.4, 22.5, 192, 337.4, 337.6, 359.9, -10, 370].map(pointOf)).toEqual([
      "n",
      "n",
      "ne",
      "s",
      "nw",
      "n",
      "n",
      "n",
      "n",
    ]);
    expect(directionKey(225)).toBe("azimuth.dir.sw");
    expect(isUp({ t: 0, az: 0, el: -0.5 })).toBe(true);
    expect(isUp({ t: 0, az: 0, el: -1 })).toBe(false);
  });
});

describe("sun-azimuth-card sides of the house", () => {
  it("lights the sides the sun faces and finds their windows", () => {
    // the front faces north: clockwise from it the left side (east), the back, the right side
    const sides = sidesOf(summer, 0, forenoon);
    expect(sides.map((s) => s.key)).toEqual(["front", "left", "back", "right"]);
    expect(sides.map((s) => s.normal)).toEqual([0, 90, 180, 270]);
    expect(sides.some((s) => s.hidden)).toBe(false);
    // at 12:00 CEST the sun stands south-east: the east and south sides are lit
    expect(sides.map((s) => s.litNow)).toEqual([false, true, true, false]);
    expect(litSides(sides).map((s) => s.key)).toEqual(["left", "back"]);
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
    expect(nextSide(sides)!.key).toBe("right");
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
    expect(nextSide(sides)!.key).toBe("right"); // the west side
  });
  it("keeps a shared wall dark: no windows, never lit, never next", () => {
    // the left side faces east and would be lit at noon and first to catch the evening sun
    // when it is the right one; hidden, both drop out while the house keeps its four walls
    const sides = sidesOf(summer, 0, forenoon, ["left", "right"]);
    expect(sides.map((s) => s.normal)).toEqual([0, 90, 180, 270]);
    expect(sides.map((s) => s.hidden)).toEqual([false, true, false, true]);
    const [, left, , right] = sides;
    for (const s of [left, right]) {
      expect(s.windows).toEqual([]);
      expect(s.litNow).toBe(false);
      expect(s.incidence).toBe(0);
      expect(s.nextFrom).toBeNull();
    }
    expect(litSides(sides).map((s) => s.key)).toEqual(["back"]);
    expect(nextSide(sides)!.key).toBe("front"); // the north side's evening window
  });
  it("names a side by where it faces", () => {
    const de = { locale: { language: "de" } } as HomeAssistant;
    expect(defaultSideName(undefined, 0)).toBe("North side");
    expect(defaultSideName(undefined, 200)).toBe("South side");
    expect(defaultSideName(undefined, 225)).toBe("South-West side");
    expect(defaultSideName(de, 110)).toBe("Ostseite");
    expect(defaultSideName(de, 290)).toBe("Westseite");
    expect(defaultSideName(de, 315)).toBe("Nordwestseite");
  });
  it("lights nothing at night and after sunset nothing is next", () => {
    const sides = sidesOf(summer, 0, night);
    expect(litSides(sides)).toEqual([]);
    expect(nextSide(sides)!.key).toBe("front"); // the north side, first to catch the rising sun
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

describe("sun-azimuth-card path preview", () => {
  it("lays the day's path above the horizon out with its times", () => {
    const track = trackOf(summer, (s) => [s.az, s.el]);
    expect(track.length).toBeGreaterThan(100);
    expect(track.every((p) => p.y > 0)).toBe(true); // only above the horizon
    expect(track[0].t).toBeGreaterThanOrEqual(summer.sunrise!.t - TRACK_STEP * 60e3);
    // both pictures carry it
    const sides = sidesOf(summer, 20, forenoon);
    expect(dialGeometry(summer, forenoon, 20, sides).track.length).toBe(track.length);
    expect(sceneGeometry(summer, forenoon, LAT, 20, 180, sides, W).track.length).toBe(track.length);
  });
  it("finds the time on the path nearest to the pointer, within reach", () => {
    const step = TRACK_STEP * 60e3;
    const track = [
      { t: 0, x: 0, y: 0 },
      { t: step, x: 10, y: 0 },
      // a gap in time: no segment across it
      { t: 10 * step, x: 30, y: 0 },
    ];
    // between two neighbours: interpolated
    expect(nearestOnTrack(track, 5, 2, 4)).toBeCloseTo(step / 2, 5);
    // too far
    expect(nearestOnTrack(track, 5, 10, 4)).toBeNull();
    // in the gap: the nearer point, not a time in between
    expect(nearestOnTrack(track, 22, 0, 10)).toBe(10 * step);
    expect(nearestOnTrack([], 0, 0, 10)).toBeNull();
  });
});

describe("sun-azimuth-card roofs", () => {
  const corners = (pts: unknown[][]) => pts.map((p) => p.length);
  it("builds each roof on the same four walls", () => {
    const gable = houseSolid("gable", 1, 1, 2);
    // the gables are the left and the right walls, the ridge runs between them
    expect(corners(gable.walls)).toEqual([4, 5, 4, 5]);
    expect(gable.roofs).toHaveLength(2);
    expect(gable.top).toBe(2);
    expect(gable.ridge).toEqual([
      [
        [1, 0],
        [-1, 0],
      ],
    ]);
    // turned: the gables face the front and the back
    const front = houseSolid("gable_front", 1, 1, 2);
    expect(corners(front.walls)).toEqual([5, 4, 5, 4]);
    expect(front.walls[0][3]).toEqual([0, 1, 2]); // the front gable's apex, over its middle
    // a hip roof: no gables, two trapezoids and two triangles, the ridge and four hips from above
    const hip = houseSolid("hip", 1, 1, 2);
    expect(corners(hip.walls)).toEqual([4, 4, 4, 4]);
    expect(corners(hip.roofs)).toEqual([4, 3, 4, 3]);
    expect(hip.ridge).toHaveLength(5);
    // flat: one roof at the walls' height, nothing to draw from above
    const flat = houseSolid("flat", 1, 1, 2);
    expect(flat.roofs).toHaveLength(1);
    expect(flat.top).toBe(1);
    expect(flat.roofs[0].every((p) => p[2] === 1)).toBe(true);
    expect(flat.ridge).toEqual([]);
  });
  it("shows and lights the roof the camera and the sun see", () => {
    const sides = sidesOf(summer, 20, forenoon);
    for (const roof of ["gable", "gable_front", "hip", "flat"] as const)
      for (const camera of [0, 90, 150, 180, 270]) {
        const g = sceneGeometry(summer, forenoon, LAT, 20, camera, sides, W, roof);
        // seen from above, part of the roof always shows; never more than two walls
        expect(g.faces.some((f) => f.roof)).toBe(true);
        expect(g.faces.filter((f) => !f.roof).length).toBeLessThanOrEqual(2);
      }
    // a flat roof faces straight up: hit as directly as the sun is high
    const flat = sceneGeometry(summer, forenoon, LAT, 20, 180, sides, W, "flat");
    const top = flat.faces.find((f) => f.roof)!;
    expect(top.lit).toBe(true);
    expect(top.incidence).toBeCloseTo(Math.sin(forenoon.el * (Math.PI / 180)), 5);
    // the dial draws the roof's lines inside the footprint; a flat roof has none
    expect(dialGeometry(summer, forenoon, 20, sides, 300, "hip").roofLines.split("M")).toHaveLength(
      6,
    );
    expect(dialGeometry(summer, forenoon, 20, sides, 300, "flat").roofLines).toBe("");
  });
});

describe("sun-azimuth-card house walls", () => {
  it("draws the walls as bands inside the outline that meet on the diagonal", () => {
    const b = wallBands(10, [4, 2, 2, 2]);
    expect(b).toHaveLength(4);
    // wall 0 (the top edge, 4 thick): outer corners, then the inner ones 4 in
    expect(b[0]).toEqual([
      [-10, -10],
      [10, -10],
      [8, -6],
      [-8, -6],
    ]);
    // wall 1 (the right edge, 2 thick) shares the corner and the diagonal with wall 0
    expect(b[1][0]).toEqual(b[0][1]);
    expect(b[1][3]).toEqual(b[0][2]);
    // nothing reaches outside the square
    for (const band of b)
      for (const [x, y] of band) expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThanOrEqual(10);
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
    // one band per side, lit like the sides
    expect(g.walls.map((w) => w.lit)).toEqual(sides.map((s) => s.litNow));
    expect(g.walls.every((w) => w.d.endsWith(" Z"))).toBe(true);
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
  it("thins the lines with the picture, never below LINE_MIN", () => {
    expect(lineScale(124, 124)).toBe(1);
    expect(lineScale(200, 124)).toBe(1);
    expect(lineScale(99.2, 124)).toBeCloseTo(0.8, 5);
    expect(lineScale(30, 124)).toBe(LINE_MIN);
  });
  it("draws a narrow column in px: the labels keep their room, the sky shrinks inside", () => {
    // at most 300 px, as before; a wider column centres the same dial
    expect(dialBox(300)).toEqual({ size: 300, r: 124, k: 1 });
    expect(dialBox(400)).toEqual({ size: 300, r: 124, k: 1 });
    expect(dialBox(270)).toMatchObject({ size: 270, r: 109 });
    expect(dialBox(270).k).toBeCloseTo(109 / 124, 5);
    // a narrow column: the rim keeps 26 px for the labels, the lines thin down to LINE_MIN
    expect(dialBox(160)).toEqual({ size: 160, r: 54, k: LINE_MIN });
    const sides = sidesOf(summer, 20, forenoon);
    const g = dialGeometry(summer, forenoon, 20, sides, 160);
    const c = 80;
    expect(g.size).toBe(160);
    expect(g.k).toBe(LINE_MIN);
    expect(g.beam).toContain(`L${c} ${c}`);
    // the labels 18 px outside the rim and inside the box
    for (const l of g.labels) {
      expect(Math.hypot(l.x - c, l.y - c)).toBeCloseTo(g.r + 18, 0);
      expect(Math.min(l.x, l.y)).toBeGreaterThan(0);
      expect(Math.max(l.x, l.y)).toBeLessThan(160);
    }
    // the sunrise mark on the smaller rim, the sun inside it
    expect(Math.hypot(g.rise![0] - c, g.rise![1] - c)).toBeCloseTo(g.r, 0);
    expect(Math.hypot(g.sun[0] - c, g.sun[1] - c)).toBeLessThan(g.r);
  });
});

describe("sun-azimuth-card 3D scene", () => {
  it("sizes the sphere to the column, with room for the labels beside it", () => {
    // a small column: the widest sphere whose E / W labels still fit, the box as wide as the column
    const small = sceneBox(260);
    expect(small).toMatchObject({ w: 260, scale: 112, cx: 130 });
    expect(2 * (small.scale + SCENE.labelGap + SCENE.side)).toBeLessThanOrEqual(260);
    expect(small.cy).toBe(SCENE.top + 112);
    // from about 290 px on: the sphere at its full size, the box as before, centred in wider ones
    expect(sceneBox(416)).toMatchObject({
      w: 416,
      h: 198,
      scale: SCENE.maxScale,
      cx: 208,
      cy: 134,
    });
    expect(sceneBox(800)).toMatchObject({ w: 800, scale: SCENE.maxScale, cx: 400 });
    expect(sceneBox(800).h).toBe(sceneBox(416).h);
    // too narrow: never below minScale, the box gets wider than the column and the SVG shrinks
    // a card of a fixed height: the sphere shrinks until the dome and the labels fit it too
    const short = sceneBox(800, 150);
    expect(short.scale).toBeLessThan(SCENE.maxScale);
    expect(short.h).toBeLessThanOrEqual(150);
    expect(short.w).toBe(800);
    expect(sceneBox(800, 1000)).toEqual(sceneBox(800));
    const tiny = sceneBox(100);
    expect(tiny.scale).toBe(SCENE.minScale);
    expect(tiny.w).toBeGreaterThan(100);
    // the lines follow the sphere: full at full size, LINE_MIN at the smallest
    const sides = sidesOf(summer, 20, forenoon);
    expect(sceneGeometry(summer, forenoon, LAT, 20, 180, sides, W).k).toBe(1);
    expect(sceneGeometry(summer, forenoon, LAT, 20, 180, sides, 100).k).toBe(LINE_MIN);
  });
  it("shows the walls facing the camera and drops the back-most compass point", () => {
    const sides = sidesOf(summer, 20, forenoon);
    const g = sceneGeometry(summer, forenoon, LAT, 20, 180, sides, W);
    expect([g.w, g.h]).toEqual([W, sceneBox(W).h]);
    // from the north looking south, two walls show: the front (20°) and the right gable (290°),
    // both in the shade at noon; of the roof, the slope down to the front, lit by the high sun
    const walls = g.faces.filter((f) => !f.roof),
      roofs = g.faces.filter((f) => f.roof);
    expect(walls).toHaveLength(2);
    expect(walls.every((f) => !f.lit)).toBe(true);
    expect(walls.find((f) => f.d.split(" L").length === 5)).toBeDefined(); // the gable: five corners
    expect(roofs).toHaveLength(1);
    expect(roofs[0].lit).toBe(true);
    expect(roofs[0].incidence).toBeGreaterThan(0);
    expect(roofs[0].incidence).toBeLessThan(1);
    // the soft light tells the shaded surfaces apart
    expect(walls[0].shade).not.toBeCloseTo(walls[1].shade, 2);
    expect(g.cardinals.map((c) => c.bearing)).toEqual([0, 90, 270]);
    // the front label sits labelGap px below the rim on screen, whatever the tilt squashes
    const box = sceneBox(W),
      north = g.cardinals.find((c) => c.bearing === 0)!;
    expect(north.y - (box.cy + box.scale * Math.sin((SCENE.tilt * Math.PI) / 180))).toBeCloseTo(
      SCENE.labelGap,
      5,
    );
    // a diagonal view: the points on the far half (east, south) are left out, not drawn in the dome
    expect(
      sceneGeometry(summer, forenoon, LAT, 20, 150, sides, W).cardinals.map((c) => c.bearing),
    ).toEqual([0, 270]);
    expect(
      sceneGeometry(summer, forenoon, LAT, 20, 0, sides, W).cardinals.map((c) => c.bearing),
    ).toEqual([90, 180, 270]);
    expect(
      sceneGeometry(summer, forenoon, LAT, 20, 90, sides, W).cardinals.map((c) => c.bearing),
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
    for (const [x, y] of nums(g.ground + g.shadow + g.faces.map((f) => f.d).join(" "))) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(g.w);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(g.h);
    }
  });
  it("hides the sun and its lines below the horizon", () => {
    const g = sceneGeometry(summer, night, LAT, 20, 180, sidesOf(summer, 20, night), W);
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
    const high = sceneGeometry(summer, forenoon, LAT, 0, 180, sidesOf(summer, 0, forenoon), W);
    const low = sceneGeometry(summer, morning, LAT, 0, 180, sidesOf(summer, 0, morning), W);
    expect(area(low.shadow)).toBeGreaterThan(area(high.shadow));
  });
});

describe("sun-azimuth-card element", () => {
  it("registers and sizes by view and sections", () => {
    expect(customElements.get("sun-azimuth-card-pro")).toBe(SunAzimuthCard);
    expect(SunAzimuthCard.getStubConfig()).toEqual({ title: "Sun azimuth" });
    const el = new SunAzimuthCard();
    el.setConfig({});
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: "auto", min_columns: 6 });
    expect(el._config.view).toBe("3d"); // the default view
    expect(el.getCardSize()).toBe(7); // 3d 6 + house 1
    el.setConfig({ view: "dial", show_events: true, show_sides: true });
    expect(el.getCardSize()).toBe(14); // dial 7 + house 1 + events 1 + sides 5
    el.setConfig({ view: "ring" as never }); // the ring view is gone: an unknown view is the default
    expect(el._config.view).toBe("3d");
    el.setConfig({ view: "3d", title: "Sun", camera_slider: true });
    expect(el.getCardSize()).toBe(9); // header 1 + 3d 6 + slider 1 + house 1
    el.setConfig({ view: "3d", show_house: false });
    expect(el.getCardSize()).toBe(6);
  });
  it("normalises the config", () => {
    const el = new SunAzimuthCard();
    el.setConfig({});
    expect(el._config).toMatchObject({
      view: "3d",
      front: 0,
      roof: "gable",
      sides: {},
      hidden: [],
      camera: 180,
      camera_slider: false,
      hover_preview: true,
      show_house: true,
      show_events: false,
      show_sides: false,
      sun_color: "amber",
      night_color: "indigo",
      sky_color: "light-blue",
    });
    el.setConfig({
      view: "bogus",
      house: {
        front: 405,
        roof: "pagoda",
        sides: { front: "Street", right: "", back: 3 as never, left: false, north: "x" } as never,
      },
      camera: -90,
      hover_preview: false,
    });
    expect(el._config.view).toBe("3d"); // an unknown view falls back to the default
    expect(el._config.front).toBe(45); // normalised to 0..360
    expect(el._config.roof).toBe("gable"); // an unknown roof falls back
    expect(el._config.sides).toEqual({ front: "Street" }); // only non-empty strings name a side
    expect(el._config.hidden).toEqual(["left"]); // false hides it; other keys are ignored
    expect(el._config.camera).toBe(-90);
    expect(el._camera).toBe(270); // the live camera is normalised to 0..360
    expect(el._config.hover_preview).toBe(false);
    el.setConfig({ view: "3d", house: null, camera: "x" as never });
    expect(el._config.view).toBe("3d");
    expect(el._config.front).toBe(0);
    expect(el._config.hidden).toEqual([]);
    expect(el._config.camera).toBe(180);
  });
});
