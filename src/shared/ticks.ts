// Time axis helpers shared by the cards that plot a history window (pure).
import { zonedMidnight, zonedParts } from "./calendar.ts";
import { LOCAL_ZONE } from "./format.ts";

// time tick interval (ms) for a window of `hours`
export const timeStep = (hours: number) => {
  const h = 3600e3;
  if (hours <= 3) return 0.5 * h;
  if (hours <= 8) return h;
  if (hours <= 14) return 2 * h;
  if (hours <= 30) return 4 * h;
  if (hours <= 60) return 12 * h;
  return 24 * h;
};

// tick times in [t0, now] on local clock boundaries of `step` (whole hours, midnight...). Stepped
// in wall-clock time from the local midnight of t0's day, so a DST change inside the window keeps
// the ticks on the boundaries (the Date constructor carries over days and moves a time in a
// skipped hour forward; a tick that lands on the one before it is dropped)
// `tz`: the zone the axis labels are written in (the profile's); left out or the browser's own,
// the browser's calendar. In another zone the steps count from that zone's midnight, so a label
// reads a whole hour of that zone's clock
export const clockTicks = (t0: number, now: number, step: number, tz?: string): number[] => {
  // a time that is not one (a forecast date that did not parse) has no ticks: the loop below ends
  // only by passing `now`
  if (!Number.isFinite(t0) || !Number.isFinite(now) || !(step > 0) || now < t0) return [];
  if (tz && tz !== LOCAL_ZONE) {
    const p = zonedParts(t0, tz);
    const midnight = zonedMidnight(p.y, p.m, p.d, tz);
    const ms = Math.max(1, Math.round(step / 60e3)) * 60e3;
    const out: number[] = [];
    for (let t = midnight + Math.max(0, Math.ceil((t0 - midnight) / ms)) * ms; t <= now; t += ms)
      out.push(t);
    return out;
  }
  const start = new Date(t0);
  const y = start.getFullYear(),
    m = start.getMonth(),
    d = start.getDate();
  const min = Math.max(1, Math.round(step / 60e3));
  const ticks: number[] = [];
  // and never more steps than the window holds, from the midnight before it (a day of steps more)
  const most = Math.ceil((now - t0) / (min * 60e3)) + Math.ceil(1500 / min) + 2;
  for (let k = 0; k <= most; k++) {
    const t = new Date(y, m, d, 0, k * min).getTime();
    if (t > now) break;
    if (t >= t0 && (ticks.length === 0 || t > ticks[ticks.length - 1])) ticks.push(t);
  }
  return ticks;
};
