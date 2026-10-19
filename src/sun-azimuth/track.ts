// The sun's track in a picture, pure: the day's samples above the horizon as points on screen
// with their times, and the time on it nearest to the pointer, for the hover preview.
import { SAMPLE_MS } from "./constants.ts";
import type { SunDay, SunSample } from "./day.ts";

export interface TrackPoint {
  t: number;
  x: number;
  y: number;
}

// every few samples is plenty: the nearest point is interpolated along the segments
export const TRACK_STEP = 3;

// the track above the horizon through `at` (a picture's projection of a sample)
export const trackOf = (day: SunDay, at: (s: SunSample) => [number, number]): TrackPoint[] => {
  const out: TrackPoint[] = [];
  for (let i = 0; i < day.samples.length; i += TRACK_STEP) {
    const s = day.samples[i];
    if (s.el <= 0) continue;
    const [x, y] = at(s);
    out.push({ t: s.t, x, y });
  }
  return out;
};

// the time on the track nearest to (x, y), or null when the track is farther than `reach`; two
// points are joined only when they are neighbours in time (no segment across the night)
export const nearestOnTrack = (
  track: readonly TrackPoint[],
  x: number,
  y: number,
  reach: number,
): number | null => {
  let best: number | null = null,
    bestD = reach;
  const consider = (t: number, px: number, py: number) => {
    const d = Math.hypot(px - x, py - y);
    if (d <= bestD) {
      bestD = d;
      best = t;
    }
  };
  for (let i = 0; i < track.length; i++) {
    const a = track[i];
    consider(a.t, a.x, a.y);
    const b = track[i + 1];
    if (!b || b.t - a.t > TRACK_STEP * SAMPLE_MS * 1.5) continue;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = dx * dx + dy * dy;
    if (!len) continue;
    const f = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len));
    consider(a.t + f * (b.t - a.t), a.x + f * dx, a.y + f * dy);
  }
  return best;
};
