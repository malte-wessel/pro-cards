// The flow animation's maths (pure): units, bearings, the mapping from wind to motion and the
// geometry of every animation style. The DOM and the CSS live in render/flow.ts and styles.ts.
//
// A field is a square of `size` px centred in the band and rotated so that +x is where the wind
// blows. Particles travel along wave lanes (a sine through a smooth path) from x = -40 to
// size + 40. Every element carries a phase `p0` in [0, 1) and a duration factor `k`; the band sets
// the base duration from the speed the field was built for, and a later speed change scales the
// playback rate of the running animations (`rateOf`), so nothing restarts or jumps. The spec is
// deterministic (seeded PRNG) so a paused frame is reproducible.
import { smoothPath } from "../shared/history.ts";
import {
  COMPASS,
  DEFAULTS,
  DENSITY,
  UNIT_TO_KMH,
  type Density,
  type FlowStyle,
} from "./constants.ts";

// ----- units and directions -----

export const toKmh = (v: number, unit: string | null | undefined): number =>
  v * (UNIT_TO_KMH[(unit ?? "").trim().toLowerCase()] ?? 1);

const norm = (deg: number) => ((deg % 360) + 360) % 360;

// a bearing in degrees from a number or an English compass point (N, NNE …); null otherwise
export const parseBearing = (raw: string | number | null | undefined): number | null => {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  const n = Number(s);
  if (Number.isFinite(n)) return norm(n);
  const i = (COMPASS as readonly string[]).indexOf(s.toUpperCase());
  return i < 0 ? null : i * 22.5;
};
export const compassIndex = (deg: number) => Math.round(norm(deg) / 22.5) % 16;
// the field's rotation: +x is where the wind blows (bearing = where it comes from)
export const fieldRotation = (bearing: number) => norm(bearing + 90);
// mdi:navigation points up; turned to where the wind blows
export const arrowRotation = (bearing: number) => norm(bearing + 180);

// ----- wind → motion -----

// travel speed on screen in px/s
export const pxps = (kmh: number) => 16 + Math.max(0, kmh) * 5;
// wave amplitude: gusts above the speed raise the waves
export const amplitude = (kmh: number, gustKmh: number | null) =>
  3 + Math.min(16, Math.max(0, (gustKmh ?? kmh) - kmh) * 0.6 + Math.max(0, kmh) * 0.15);
// the field is rebuilt only when the amplitude crosses a 4 px step: ordinary speed changes
// re-time the running animation, a real change in the gusts redraws the waves
// the playback rate of a field built at `builtKmh` and now shown at `kmh`
export const rateOf = (kmh: number, builtKmh: number) => pxps(kmh) / pxps(builtKmh);
// one cycle of the lead animation
export const leadDuration = (px: number) => Math.max(0.35, 90 / px);
// the base duration of the field: one 480 px crossing
export const baseDuration = (kmh: number) => 480 / pxps(kmh);
export const gustCount = (gustKmh: number | null) =>
  gustKmh !== null && gustKmh > 12 ? Math.min(6, Math.round(gustKmh / 10)) : 0;
export const gustDuration = (gustKmh: number | null) => (480 / pxps(gustKmh ?? 0)) * 3.2;

// ----- geometry -----

// a seeded linear congruential generator (Park–Miller), values in [0, 1)
export const prng = (seed = 11) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};
const f1 = (v: number) => Math.round(v * 10) / 10;
// a wave lane: points every L / 4 from x0 to x1 through a smooth path
export const wavePath = (y: number, L: number, a: number, ph: number, x0: number, x1: number) => {
  const pts: number[][] = [];
  for (let x = x0; x <= x1 + 1; x += L / 4)
    pts.push([f1(x), f1(y + a * Math.sin(ph + (x / L) * Math.PI * 2))]);
  return smoothPath(pts, false);
};
// the square that covers a band of w × h at any rotation, in steps, within the limits
export const fieldSize = (w: number, h: number) =>
  Math.max(
    DEFAULTS.fieldMin,
    Math.min(
      DEFAULTS.fieldMax,
      Math.ceil(Math.hypot(w, h) / DEFAULTS.fieldStep) * DEFAULTS.fieldStep,
    ),
  );
// the geometry a field was built for: a change rebuilds it
export const fieldKey = (style: FlowStyle, density: Density, size: number) =>
  `${style}/${density}/${size}`;
// the waves a field was drawn with. Redrawing restarts every particle, so noise in the sensors
// must not trigger it: the amplitude has to move by 4 px, the streaks by two (or from none to some)
export interface Waves {
  amp: number;
  gusts: number;
}
export const needsRedraw = (built: Waves | null, now: Waves) =>
  !built ||
  Math.abs(now.amp - built.amp) >= 4 ||
  Math.abs(now.gusts - built.gusts) >= 2 ||
  (now.gusts === 0) !== (built.gusts === 0);

// a particle on a lane: phase, duration factor, opacity and size (dot diameter or arrow width)
export interface Particle {
  p0: number;
  k: number;
  o: number;
  s: number;
}
export interface Lane {
  d: string;
  parts: Particle[];
}
// a gust streak: fast, visible for a third of its cycle
export interface Streak {
  d: string;
  w: number;
  p0: number;
}
// a streamline dash: dasharray `dash 200`, offset from `from` to -100
export interface StreamLine {
  d: string;
  dash: number;
  w: number;
  o: number;
  k: number;
  p0: number;
}
export interface Swoosh {
  d: string;
  w: number;
  o: number;
  k: number;
  p0: number;
}
export type FieldSpec =
  | { style: "dots" | "vectors"; size: number; lanes: Lane[]; streaks: Streak[] }
  | { style: "lines"; size: number; lines: StreamLine[]; streaks: Streak[] }
  | { style: "swoosh"; size: number; strokes: Swoosh[]; streaks: Streak[] };

// the head dot and its two trailing dots: relative size, opacity and lag (share of a third cycle)
const PACKET = [
  [2.8, 0.85, 0],
  [2.1, 0.5, 0.07],
  [1.5, 0.28, 0.14],
] as const;
const frac = (x: number) => ((x % 1) + 1) % 1;

const streaksOf = (rnd: () => number, size: number, amp: number, gustKmh: number | null) => {
  const out: Streak[] = [];
  const n = gustCount(gustKmh);
  const w = Math.round(14 + (gustKmh ?? 0) * 0.5);
  for (let g = 0; g < n; g++)
    out.push({
      d: wavePath(40 + rnd() * (size - 80), 180 + rnd() * 80, amp * 0.7, 0, -40, size + 40),
      w,
      p0: rnd(),
    });
  return out;
};

export const fieldSpec = (
  style: FlowStyle,
  density: Density,
  size: number,
  amp: number,
  gustKmh: number | null,
  speedKmh: number,
): FieldSpec => {
  const rnd = prng(11);
  const scale = size / 480;
  const { lanes: n0, packets: per } = DENSITY[density];
  const n = Math.round(n0 * scale);
  // one crossing is 560 px of path against the 480 px base duration
  const laneK = () => (560 / 480) * (0.85 + rnd() * 0.3);
  if (style === "dots" || style === "vectors") {
    const lanes: Lane[] = [];
    const arrowW = 7 + Math.min(10, speedKmh * 0.25);
    for (let i = 0; i < n; i++) {
      const y = ((i + 0.5) * size) / n + (rnd() - 0.5) * (style === "dots" ? 21 : 14);
      const k = laneK();
      const parts: Particle[] = [];
      for (let p = 0; p < per; p++) {
        const head = p / per + (rnd() * (style === "dots" ? 0.6 : 0.1)) / per;
        const ks = style === "dots" ? 0.75 + rnd() * 0.5 : 0.7 + rnd() * 0.6;
        if (style === "dots")
          for (const [s, o, lag] of PACKET)
            parts.push({ p0: frac(head - lag / 3), k, o, s: f1(s * ks) });
        else
          parts.push({ p0: frac(head), k, o: f1(0.4 + rnd() * 0.5), s: Math.round(arrowW * ks) });
      }
      lanes.push({ d: wavePath(y, 150 + rnd() * 110, amp, i * 0.45, -40, size + 40), parts });
    }
    return { style, size, lanes, streaks: streaksOf(rnd, size, amp, gustKmh) };
  }
  if (style === "lines") {
    const lines: StreamLine[] = [];
    const nl = Math.round((22 * n) / 18);
    for (let i = 0; i < nl; i++) {
      const y = ((i + 0.5) * size) / nl + (rnd() - 0.5) * 12;
      const k = laneK();
      const dash = f1(6 + rnd() * 10);
      const d = wavePath(y, 170 + rnd() * 90, amp, i * 0.45, -40, size + 40);
      const w = f1(1 + rnd() * 1.2),
        o = f1(0.35 + rnd() * 0.55);
      lines.push({ d, dash, w, o, k, p0: rnd() }, { d, dash, w, o, k, p0: rnd() });
    }
    return { style, size, lines, streaks: streaksOf(rnd, size, amp, gustKmh) };
  }
  // swoosh: curly strokes in the middle third of the field, ending in a three-quarter curl
  const strokes: Swoosh[] = [];
  const ns = Math.round((9 * n) / 18);
  const mid = size / 2;
  for (let i = 0; i < ns; i++) {
    const y = mid - 70 + rnd() * 140,
      x0 = mid - 180 + rnd() * 120,
      len = 190 + rnd() * 90,
      r = 9 + rnd() * 9;
    const pts: number[][] = [];
    for (let x = x0; x <= x0 + len; x += 24)
      pts.push([f1(x), f1(y + amp * 0.6 * Math.sin(x / 90 + i))]);
    let d = smoothPath(pts, false);
    const ex = x0 + len,
      ey = pts[pts.length - 1][1],
      up = rnd() > 0.5 ? -1 : 1;
    const c = (...v: number[]) => v.map(f1).join(" ");
    d += ` C${c(ex + r * 0.9, ey, ex + r * 1.2, ey + up * r * 1.3, ex + r * 0.3, ey + up * r * 1.5)}`;
    d += ` C${c(ex - r * 0.5, ey + up * r * 1.6, ex - r * 0.6, ey + up * r * 0.6, ex, ey + up * r * 0.5)}`;
    // duration (len + 60) / pxps × 1.8, plus 1.2 s added in the CSS
    strokes.push({
      d,
      w: f1(1.6 + rnd()),
      o: f1(0.45 + rnd() * 0.5),
      k: ((len + 60) / 480) * 1.8,
      p0: rnd(),
    });
  }
  return { style: "swoosh", size, strokes, streaks: streaksOf(rnd, size, amp, gustKmh) };
};
