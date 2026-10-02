// The sky dial seen from above, pure geometry in a 300 box: the horizon is the outer ring, the
// zenith the centre, so a point of the sky lands at a radius that follows its elevation.
import { DIAL, PATH_STEP } from "./constants.ts";
import type { SunDay, SunSample } from "./day.ts";
import type { Side } from "./sides.ts";

const RAD = Math.PI / 180;
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
type Pt = [number, number];
const P = (p: Pt) => `${f1(p[0])} ${f1(p[1])}`;
const pathOf = (pts: Pt[]) => pts.map((p, i) => (i ? "L" : "M") + P(p)).join(" ");

export interface DialGeometry {
  size: number;
  r: number;
  ticks: string;
  dayArc: string; // the daylight sector on the rim, sunrise bearing → sunset bearing
  beam: string; // from the sun to the house
  past: string;
  future: string;
  housePoly: string;
  edges: { d: string; lit: boolean }[]; // one per side, in the sides' order
  sun: Pt;
  rise: Pt | null;
  set: Pt | null;
  labels: { bearing: number; x: number; y: number }[]; // N, E, S, W around the rim
}

const { size, r: R, house: HW } = DIAL;
const C = size / 2;
// a sky point at bearing az and elevation el (below the horizon lands on the rim)
export const polar = (az: number, el: number, radius = R): Pt => {
  const r = (radius * (90 - Math.max(0, el))) / 90;
  return [C + r * Math.sin(az * RAD), C - r * Math.cos(az * RAD)];
};
const rim = (az: number, radius: number): Pt => [
  C + radius * Math.sin(az * RAD),
  C - radius * Math.cos(az * RAD),
];
const arc = (a1: number, a2: number, radius: number) => {
  const sweep = (a2 - a1 + 360) % 360;
  return `M${P(rim(a1, radius))} A${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${P(rim(a2, radius))}`;
};

export const dialGeometry = (
  day: SunDay,
  now: SunSample,
  rotation: number,
  sides: Side[],
): DialGeometry => {
  let ticks = "";
  for (let a = 0; a < 360; a += 10) {
    const len = a % 90 === 0 ? 10 : a % 30 === 0 ? 7 : 4;
    ticks += `M${P(rim(a, R))} L${P(rim(a, R - len))} `;
  }
  // today's path above the horizon, split at now
  const past: Pt[] = [],
    future: Pt[] = [];
  for (let i = 0; i < day.samples.length; i += PATH_STEP) {
    const s = day.samples[i];
    if (s.el <= 0) continue;
    (s.t <= now.t ? past : future).push(polar(s.az, s.el));
  }
  const up = now.el > 0;
  if (up) {
    past.push(polar(now.az, now.el));
    future.unshift(polar(now.az, now.el));
  }
  const sun = polar(now.az, now.el);
  // the house footprint, rotated with the house; its edges follow the sides' order
  const a = rotation * RAD;
  const corner = (dx: number, dy: number): Pt => [
    C + dx * Math.cos(a) - dy * Math.sin(a),
    C + dx * Math.sin(a) + dy * Math.cos(a),
  ];
  const corners = [corner(-HW, -HW), corner(HW, -HW), corner(HW, HW), corner(-HW, HW)];
  const edges = sides.map((side, i) => ({
    d: `M${P(corners[i])} L${P(corners[(i + 1) % 4])}`,
    lit: side.litNow,
  }));
  const labels = [0, 90, 180, 270].map((bearing) => {
    const p = rim(bearing, R + 18);
    return { bearing, x: p[0], y: p[1] };
  });
  return {
    size,
    r: R,
    ticks,
    dayArc: day.sunrise && day.sunset ? arc(day.sunrise.az, day.sunset.az, R + 7) : "",
    beam: up ? `M${P(sun)} L${C} ${C}` : "",
    past: past.length > 1 ? pathOf(past) : "",
    future: future.length > 1 ? pathOf(future) : "",
    housePoly: pathOf(corners) + " Z",
    edges,
    sun,
    rise: day.sunrise ? polar(day.sunrise.az, 0) : null,
    set: day.sunset ? polar(day.sunset.az, 0) : null,
    labels,
  };
};
