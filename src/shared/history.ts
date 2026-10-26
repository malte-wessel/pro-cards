// History helpers: series points are { t, v: number|null, s: state }.
import type { HistoryDuringPeriodResult, HomeAssistant } from "./ha.ts";
import { isNum, numOrNull } from "./util.ts";

export interface Point {
  t: number;
  v: number | null;
  s: string;
}
// a bucket of bucketMean: the mean value and the bucket's time range
export interface MeanBucket {
  t: number;
  v: number;
  t1: number;
  t2: number;
}
// a bucket of bucketLast: the last state (and value) in the bucket
export interface LastBucket {
  s: string;
  v: number | null;
  t1: number;
  t2: number;
}

// Catmull-Rom to cubic bezier path (pts = [[x, y], ...] numbers, ascending x).
// With `clamp` (default) the tangents are limited so a control point never leaves its segment's
// x-range or y-range: with unevenly spaced points the plain curve otherwise overshoots and loops
// back in time. `clamp = false` is the plain curve for evenly sampled smooth data (sun path).
export const smoothPath = (pts: readonly (readonly number[])[], clamp = true) => {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    let t1x = (p2[0] - p0[0]) / 6,
      t1y = (p2[1] - p0[1]) / 6;
    let t2x = (p3[0] - p1[0]) / 6,
      t2y = (p3[1] - p1[1]) / 6;
    let c1y = p1[1] + t1y,
      c2y = p2[1] - t2y;
    if (clamp) {
      const lim = (p2[0] - p1[0]) / 2;
      if (t1x > lim) {
        t1y *= lim / t1x;
        t1x = lim;
      } else if (t1x < 0) {
        t1x = 0;
        t1y = 0;
      }
      if (t2x > lim) {
        t2y *= lim / t2x;
        t2x = lim;
      } else if (t2x < 0) {
        t2x = 0;
        t2y = 0;
      }
      const ylo = Math.min(p1[1], p2[1]),
        yhi = Math.max(p1[1], p2[1]);
      c1y = Math.max(ylo, Math.min(yhi, p1[1] + t1y));
      c2y = Math.max(ylo, Math.min(yhi, p2[1] - t2y));
    }
    const c1x = p1[0] + t1x,
      c2x = p2[0] - t2x;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
};

// clamp a series to [t0, now]: carry the last point before t0 to t0 and the last point to now
export const clampedSeries = <P extends { t: number }>(
  series: readonly P[],
  t0: number,
  now: number,
): P[] => {
  let before: P | null = null;
  const pts: P[] = [];
  for (const p of series) {
    if (p.t < t0) {
      before = p;
      continue;
    }
    pts.push(p);
  }
  const first = before || pts[0] || null;
  if (first && (pts.length === 0 || pts[0].t > t0)) pts.unshift({ ...first, t: t0 });
  const last = pts[pts.length - 1];
  if (last && last.t < now) pts.push({ ...last, t: now });
  return pts;
};
// History lines (sparkline, multi trend) are averaged into buckets: `smoothing_minutes` wide when
// set, else one point per LINE_POINT_PX, so the line is equally calm on a small tile and a wide plot.
// Never finer than one point per 2 px, never fewer than 2.
export const LINE_POINT_PX = 12;
export const lineBuckets = (spanMs: number, minutes: number | null, width: number) => {
  const max = Math.max(2, Math.floor(width / 2));
  const n = minutes ? Math.round(spanMs / (minutes * 60e3)) : Math.floor(width / LINE_POINT_PX);
  return Math.max(2, Math.min(max, n));
};
// `smoothing_minutes` as written: null when unset or not positive, else at least 5
export const normalizeSmoothing = (v: unknown) => {
  const n = numOrNull(v);
  return n === null || n <= 0 ? null : Math.max(5, n);
};
// mean of numeric points per bucket over [t0, now]; keepNull → nb entries, empty buckets carry the previous value
type Acc = { sum: number; cnt: number; ts: number };
export function bucketMean(
  pts: readonly { t: number; v: number | null }[],
  t0: number,
  now: number,
  nb: number,
): MeanBucket[];
export function bucketMean(
  pts: readonly { t: number; v: number | null }[],
  t0: number,
  now: number,
  nb: number,
  keepNull: true,
): (MeanBucket | null)[];
export function bucketMean(
  pts: readonly { t: number; v: number | null }[],
  t0: number,
  now: number,
  nb: number,
  keepNull = false,
): (MeanBucket | null)[] {
  const out: (Acc | null)[] = new Array(nb).fill(null);
  const span = now - t0 || 1;
  const num = pts.filter((p): p is { t: number; v: number } => p.v !== null && p.v !== undefined);
  for (const p of num) {
    const b = Math.min(nb - 1, Math.max(0, Math.floor(((p.t - t0) / span) * nb)));
    const o = out[b] || (out[b] = { sum: 0, cnt: 0, ts: 0 });
    o.sum += p.v;
    o.cnt++;
    o.ts += p.t;
  }
  const res: (MeanBucket | null)[] = out.map((o, i) =>
    o
      ? {
          t: keepNull ? t0 + ((i + 0.5) * span) / nb : o.ts / o.cnt,
          v: o.sum / o.cnt,
          t1: t0 + (i * span) / nb,
          t2: t0 + ((i + 1) * span) / nb,
        }
      : null,
  );
  if (keepNull) {
    for (let i = 1; i < res.length; i++) {
      const prev = res[i - 1];
      if (res[i] === null && prev)
        res[i] = {
          ...prev,
          t: t0 + ((i + 0.5) * span) / nb,
          t1: t0 + (i * span) / nb,
          t2: t0 + ((i + 1) * span) / nb,
        };
    }
    return res;
  }
  const filtered = res.filter((b): b is MeanBucket => b !== null);
  if (num.length && filtered.length) {
    filtered[0] = { ...filtered[0], t: num[0].t, v: num[0].v };
    filtered[filtered.length - 1] = {
      ...filtered[filtered.length - 1],
      t: num[num.length - 1].t,
      v: num[num.length - 1].v,
    };
  }
  return filtered;
}
// A smoothed history line: the bucket means at the bucket centres (an empty bucket carries the
// previous mean), the first and last stretched to the window's edges. Means only, never a raw
// reading at the ends: a raw end point would hook away from a line of means by up to one sensor
// step, which the fitted scale stretches to the full height.
export const lineMeans = (
  pts: readonly { t: number; v: number | null }[],
  t0: number,
  now: number,
  nb: number,
): MeanBucket[] => {
  const out = bucketMean(pts, t0, now, nb, true).filter((b): b is MeanBucket => b !== null);
  if (out.length) {
    out[0] = { ...out[0], t: Math.max(t0, out[0].t1) };
    out[out.length - 1] = { ...out[out.length - 1], t: now };
  }
  return out;
};
// the change of a value over the last `hours`: `current` against the last reading at or before
// the span's start (the first reading when the series starts later); null without both
export const trendOf = (
  series: readonly { t: number; v: number | null }[] | undefined,
  now: number,
  hours: number,
  current: number | null,
): number | null => {
  if (!series || current === null) return null;
  const t0 = now - hours * 3600e3;
  let before: number | null = null;
  for (const p of series) {
    if (p.v === null) continue;
    if (p.t > t0 && before !== null) break;
    before = p.v;
    if (p.t > t0) break;
  }
  return before === null ? null : current - before;
};
// last state per bucket (for non-numeric strips), carried forward into empty buckets
export const bucketLast = (
  pts: readonly { t: number; s: string; v?: number | null }[],
  t0: number,
  now: number,
  nb: number,
): (LastBucket | null)[] => {
  const out: ({ t: number; s: string; v?: number | null } | null)[] = new Array(nb).fill(null);
  const span = now - t0 || 1;
  for (const p of pts) out[Math.min(nb - 1, Math.max(0, Math.floor(((p.t - t0) / span) * nb)))] = p;
  for (let i = 1; i < nb; i++) if (!out[i]) out[i] = out[i - 1];
  return out.map((p, i) =>
    p ? { s: p.s, v: p.v ?? null, t1: t0 + (i * span) / nb, t2: t0 + ((i + 1) * span) / nb } : null,
  );
};

// a series point from a state string at time t
export const pointOf = (t: number, state: string): Point => ({
  t,
  v: isNum(state) ? Number(state) : null,
  s: state,
});

// Recorder history of `ids` for the last `hours`, as Map<id, points>; the current state is appended
// when it is newer than the last recorded point. Rejects when the WebSocket call fails.
export const fetchHistory = async (
  hass: HomeAssistant,
  ids: readonly string[],
  hours: number,
): Promise<Map<string, Point[]>> => {
  const end = new Date(),
    start = new Date(end.getTime() - hours * 3600e3);
  const res = await hass.callWS<HistoryDuringPeriodResult | undefined>({
    type: "history/history_during_period",
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    entity_ids: ids,
    minimal_response: true,
    no_attributes: true,
    significant_changes_only: false,
  });
  const out = new Map<string, Point[]>();
  for (const id of ids) {
    const pts: Point[] = [];
    for (const r of res?.[id] || []) {
      if (r.s === undefined || r.lu === undefined) continue;
      pts.push(pointOf(r.lu * 1000, r.s));
    }
    const st = hass.states[id];
    if (st) {
      const t = new Date(st.last_updated).getTime();
      if (pts.length === 0 || t > pts[pts.length - 1].t) pts.push(pointOf(t, st.state));
    }
    out.set(id, pts);
  }
  return out;
};
