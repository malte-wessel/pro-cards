// Which sides of the house the sun shines on, pure: the lit windows of each side over the day,
// whether it is lit now and how directly, plus the timeline the footer draws them on.
import { SIDE_ANGLE, SIDES, type SideKey } from "./constants.ts";
import { angleDiff, type SunDay, type SunSample } from "./day.ts";

const RAD = Math.PI / 180;
const HOUR = 3600e3;

export interface SideWindow {
  from: number;
  to: number;
}
export interface Side {
  key: SideKey;
  normal: number; // bearing of the outward normal
  windows: SideWindow[]; // when the sun shines on it today (may be two: morning and evening)
  litNow: boolean;
  incidence: number; // 0..1, how directly the sun hits it now
  nextFrom: number | null; // the next window still to come
}

// a side faces the sun when the sun is up and within 90° of its normal
const lit = (s: SunSample, normal: number) => s.el > 0 && angleDiff(s.az, normal) < 90;

export const sidesOf = (day: SunDay, rotation: number, now: SunSample): Side[] =>
  SIDES.map((key) => {
    const normal = (((SIDE_ANGLE[key] + rotation) % 360) + 360) % 360;
    const windows: SideWindow[] = [];
    let open: SideWindow | null = null;
    for (const s of day.samples) {
      if (lit(s, normal)) {
        if (open) open.to = s.t;
        else windows.push((open = { from: s.t, to: s.t }));
      } else open = null;
    }
    const litNow = lit(now, normal);
    const incidence = litNow
      ? Math.cos(angleDiff(now.az, normal) * RAD) * Math.cos(now.el * RAD)
      : 0;
    const next = windows.find((w) => w.from > now.t);
    return { key, normal, windows, litNow, incidence, nextFrom: next ? next.from : null };
  });

// the sides lit now, in the order written
export const litSides = (sides: Side[]) => sides.filter((s) => s.litNow);
// the side whose next window comes first
export const nextSide = (sides: Side[]): Side | null =>
  sides
    .filter((s) => s.nextFrom !== null)
    .sort((a, b) => (a.nextFrom as number) - (b.nextFrom as number))[0] ?? null;

// the footer's timeline: whole hours from half an hour before sunrise to half an hour after
// sunset; the whole day without them (polar day or night)
export const timelineSpan = (day: SunDay): SideWindow => {
  if (!day.sunrise || !day.sunset) return { from: day.start, to: day.end };
  const offset = new Date(day.start).getTimezoneOffset() * 60e3;
  const floor = (t: number) => Math.floor((t - offset) / HOUR) * HOUR + offset;
  const ceil = (t: number) => Math.ceil((t - offset) / HOUR) * HOUR + offset;
  return {
    from: Math.max(day.start, floor(day.sunrise.t - HOUR / 2)),
    to: Math.min(day.end, ceil(day.sunset.t + HOUR / 2)),
  };
};
