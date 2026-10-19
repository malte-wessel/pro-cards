// The sky dial seen from above, pure geometry in a px box as wide as the column (at most 300):
// the horizon is the outer ring, the zenith the centre, so a point of the sky lands at a radius
// that follows its elevation. The labels keep their room and size; the picture shrinks inside.
import { DIAL, lineScale, PATH_STEP, WALL, type Roof } from "./constants.ts";
import type { SunDay, SunSample } from "./day.ts";
import { wallBands } from "./edges.ts";
import { houseSolid } from "./house.ts";
import { trackOf, type TrackPoint } from "./track.ts";
import type { Side } from "./sides.ts";

const RAD = Math.PI / 180;
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
type Pt = [number, number];
const P = (p: Pt) => `${f1(p[0])} ${f1(p[1])}`;
const pathOf = (pts: Pt[]) => pts.map((p, i) => (i ? "L" : "M") + P(p)).join(" ");

export interface DialGeometry {
  size: number;
  r: number;
  k: number; // the line scale: strokes and dots follow the size of the picture
  ticks: string;
  dayArc: string; // the daylight sector on the rim, sunrise bearing → sunset bearing
  beam: string; // from the sun to the house
  cardinalLines: string; // from the centre to the N, E, S and W ticks
  azArc: string; // from north clockwise round to the sun's bearing
  azChip: Pt | null; // where the azimuth chip sits, outside the arc on its bisector
  past: string;
  future: string;
  housePoly: string;
  walls: { d: string; lit: boolean }[]; // one band per side, inside the footprint
  roofLines: string; // the roof seen from above: its ridge and, on a hip roof, the hips
  track: TrackPoint[]; // the day's path above the horizon with its times (the hover preview)
  sun: Pt;
  rise: Pt | null;
  set: Pt | null;
  labels: { bearing: number; x: number; y: number }[]; // N, E, S, W around the rim
}

const AZ_R = 56; // the azimuth arc's radius at full size, outside the house footprint
const LABEL_ROOM = DIAL.size / 2 - DIAL.r; // around the rim: the compass labels and the day arc

// the dial's box for a column: at most 300 px; the rim keeps the labels' room, the rest is sky
export const dialBox = (width: number) => {
  const size = Math.floor(Math.max(2 * LABEL_ROOM + 40, Math.min(DIAL.size, width)));
  const r = size / 2 - LABEL_ROOM;
  return { size, r, k: lineScale(r, DIAL.r) };
};

// a sky point at bearing az and elevation el (below the horizon lands on the rim), in a dial of
// the given rim radius and centre (the full-size one by default)
export const polar = (az: number, el: number, radius: number = DIAL.r, c = DIAL.size / 2): Pt => {
  const r = (radius * (90 - Math.max(0, el))) / 90;
  return [c + r * Math.sin(az * RAD), c - r * Math.cos(az * RAD)];
};

// the daylight sector on the rim as bearings to draw clockwise: from sunrise to sunset the way
// the sun goes, through its noon bearing. North of the tropic that is through south; where the
// sun passes north at noon (the southern hemisphere, the tropics in summer) it is the other way
export const daylightArc = (rise: number, set: number, noon: number): [number, number] => {
  const cw = (from: number, to: number) => (((to - from) % 360) + 360) % 360;
  return cw(rise, noon) <= cw(rise, set) ? [rise, set] : [set, rise];
};

export const dialGeometry = (
  day: SunDay,
  now: SunSample,
  front: number, // the bearing the house's front faces
  sides: Side[],
  width: number = DIAL.size,
  roof: Roof = "gable",
): DialGeometry => {
  const { size, r: R, k } = dialBox(width);
  const C = size / 2,
    f = R / DIAL.r, // the picture's scale: the house and the azimuth arc shrink with the sky
    HW = DIAL.house * f,
    azR = AZ_R * f;
  const sky = (az: number, el: number) => polar(az, el, R, C);
  const rim = (az: number, radius: number): Pt => [
    C + radius * Math.sin(az * RAD),
    C - radius * Math.cos(az * RAD),
  ];
  const arc = (a1: number, a2: number, radius: number) => {
    const sweep = (a2 - a1 + 360) % 360;
    return `M${P(rim(a1, radius))} A${f1(radius)} ${f1(radius)} 0 ${sweep > 180 ? 1 : 0} 1 ${P(rim(a2, radius))}`;
  };
  let ticks = "";
  for (let a = 0; a < 360; a += 10) {
    const len = (a % 90 === 0 ? 10 : a % 30 === 0 ? 7 : 4) * k;
    ticks += `M${P(rim(a, R))} L${P(rim(a, R - len))} `;
  }
  // today's path above the horizon, split at now
  const past: Pt[] = [],
    future: Pt[] = [];
  for (let i = 0; i < day.samples.length; i += PATH_STEP) {
    const s = day.samples[i];
    if (s.el <= 0) continue;
    (s.t <= now.t ? past : future).push(sky(s.az, s.el));
  }
  const up = now.el > 0;
  if (up) {
    past.push(sky(now.az, now.el));
    future.unshift(sky(now.az, now.el));
  }
  const sun = sky(now.az, now.el);
  // the house footprint, turned so its first edge faces the front; its edges follow the sides' order
  const a = front * RAD;
  const corner = (dx: number, dy: number): Pt => [
    C + dx * Math.cos(a) - dy * Math.sin(a),
    C + dx * Math.sin(a) + dy * Math.cos(a),
  ];
  const corners = [corner(-HW, -HW), corner(HW, -HW), corner(HW, HW), corner(-HW, HW)];
  const bands = wallBands(
    HW,
    sides.map((s) => (s.litNow ? WALL.lit : WALL.plain) * k),
  );
  const walls = sides.map((side, i) => ({
    d: pathOf(bands[i].map(([dx, dy]) => corner(dx, dy))) + " Z",
    lit: side.litNow,
  }));
  const labels = [0, 90, 180, 270].map((bearing) => {
    const p = rim(bearing, R + 18);
    return { bearing, x: p[0], y: p[1] };
  });
  return {
    size,
    r: R,
    k,
    ticks,
    dayArc:
      day.sunrise && day.sunset
        ? arc(...daylightArc(day.sunrise.az, day.sunset.az, day.noon.az), R + 7)
        : "",
    beam: up ? `M${P(sun)} L${C} ${C}` : "",
    cardinalLines: [0, 90, 180, 270].map((a) => `M${C} ${C} L${P(rim(a, R))}`).join(" "),
    azArc: up ? arc(0, now.az, azR) : "",
    // the chip keeps its text size: in a small dial it stays inside the rim, clear of the labels
    azChip: up ? rim(now.az / 2, Math.min(azR + 22, R - 14)) : null,
    past: past.length > 1 ? pathOf(past) : "",
    future: future.length > 1 ? pathOf(future) : "",
    housePoly: pathOf(corners) + " Z",
    walls,
    track: trackOf(day, (s) => sky(s.az, s.el)),
    // the house's (u, v) is the footprint's (x, -y): v points to the front, up on the page at 0°
    roofLines: houseSolid(roof, HW, 0, 0)
      .ridge.map((l) => pathOf(l.map(([u, v]) => corner(u, -v))))
      .join(" "),
    sun,
    rise: day.sunrise ? sky(day.sunrise.az, 0) : null,
    set: day.sunset ? sky(day.sunset.az, 0) : null,
    labels,
  };
};
