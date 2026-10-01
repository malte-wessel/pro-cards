// The rain animation's maths (pure): how the rate and today's total map to drops, ripples and
// the gauge, and the geometry of every style. Every element carries a phase `p0` in [0, 1) and,
// for the drops, a duration factor `k`; the band sets the fall duration for the rate the field
// was built for and a later rate scales the playback rate (`fallRate`), so nothing restarts.
// Deterministic (seeded PRNG) so a paused frame is reproducible.
import { prng } from "../shared/flow/maths.ts";
import { DEFAULTS, type RainStyle } from "./constants.ts";

export const isWet = (rate: number) => rate >= DEFAULTS.wetMin;
// the drops lean away from where the wind comes from: +1 leans to the right
export const slantSide = (bearing: number | null) =>
  bearing === null ? 1 : Math.sin(((bearing + 180) * Math.PI) / 180) >= 0 ? 1 : -1;
// degrees from vertical, positive to the right, up to 32°
export const slantOf = (bearing: number | null, windKmh: number | null) =>
  slantSide(bearing) * Math.min(32, Math.max(0, windKmh ?? 0) * 0.9);
export const tanOf = (slantDeg: number) => Math.tan((slantDeg * Math.PI) / 180);
// seconds for a drop to cross ~120 px
export const fallOf = (rate: number) => Math.max(0.38, 0.95 - Math.max(0, rate) * 0.01);
export const leadFall = (rate: number) => fallOf(rate) * 0.55;
// the playback rate of a field built at `builtRate` and now shown at `rate`
export const fallRate = (rate: number, builtRate: number) => fallOf(builtRate) / fallOf(rate);
export const dropCount = (rate: number) =>
  isWet(rate) ? Math.min(140, Math.round(6 + rate * 9)) : 0;
export const rippleCount = (rate: number) =>
  isWet(rate) ? Math.min(44, Math.round(4 + rate * 3.5)) : 0;
export const fillDropCount = (rate: number) => Math.round(dropCount(rate) / 3);
export const countOf = (style: RainStyle, rate: number) =>
  style === "ripples"
    ? rippleCount(rate)
    : style === "fill"
      ? fillDropCount(rate)
      : dropCount(rate);
// the gauge's water level, 0..1: 8 % when dry, DEFAULTS.fillMm fills it (82 %)
export const levelOf = (todayMm: number | null) =>
  Math.min(0.82, 0.08 + (Math.max(0, todayMm ?? 0) / DEFAULTS.fillMm) * 0.74);
export const waveAmp = (rate: number) => Math.min(6, 1.5 + Math.max(0, rate) * 0.15);
export const wavePeriod = (rate: number) => Math.max(0.8, 3.2 - Math.max(0, rate) * 0.05);
// the surface: ten periods of a quadratic wave across 600 × 16 around the midline 8, filled down
// to the troughs (8 + a), where the water starts
export const wavePathD = (a: number) => {
  let d = "M0,8";
  for (let k = 0; k < 10; k++) {
    const x = k * 60;
    d += ` Q${x + 15},${8 - a} ${x + 30},8 Q${x + 45},${8 + a} ${x + 60},8`;
  }
  return d + ` V${8 + a} H0 Z`;
};

export interface Drop {
  x: number; // % of the width, may start off the edge so slanted drops cover it
  k: number; // duration factor
  p0: number;
  h: number;
  w: number;
  o: number;
  splash: boolean;
}
export interface Ripple {
  x: number;
  y: number;
  dur: number;
  p0: number;
  w: number;
  h: number;
}
export type RainSpec =
  | { style: "drops"; drops: Drop[] }
  | { style: "ripples"; ripples: Ripple[] }
  | { style: "fill"; drops: Drop[]; level: number; amp: number; period: number };

const f1 = (v: number) => Math.round(v * 10) / 10;
const f2 = (v: number) => Math.round(v * 100) / 100;

export const dropSpec = (n: number, rate: number, rnd = prng(DEFAULTS.seed)): Drop[] => {
  const out: Drop[] = [];
  for (let i = 0; i < n; i++)
    out.push({
      x: f1(-12 + rnd() * 124),
      k: f2(0.85 + rnd() * 0.3),
      p0: f2(rnd()),
      h: Math.round(7 + Math.min(10, rate * 0.4) + rnd() * 6),
      w: f1(1.2 + rnd() * 0.8),
      o: f2(0.45 + rnd() * 0.5),
      splash: rnd() < 0.6,
    });
  return out;
};
export const rippleSpec = (n: number, rate: number, rnd = prng(DEFAULTS.seed)): Ripple[] => {
  const out: Ripple[] = [];
  for (let i = 0; i < n; i++) {
    const w = Math.round(16 + rnd() * 26 + Math.min(14, rate * 0.4));
    out.push({
      x: f1(4 + rnd() * 92),
      y: f1(10 + rnd() * 80),
      dur: f2(1.3 + rnd() * 0.8),
      p0: f2(rnd()),
      w,
      h: Math.round(w * 0.42),
    });
  }
  return out;
};
export const rainSpec = (style: RainStyle, rate: number, todayMm: number | null): RainSpec => {
  if (style === "ripples") return { style, ripples: rippleSpec(rippleCount(rate), rate) };
  if (style === "fill")
    return {
      style,
      drops: dropSpec(fillDropCount(rate), rate),
      level: levelOf(todayMm),
      amp: waveAmp(rate),
      period: wavePeriod(rate),
    };
  return { style, drops: dropSpec(dropCount(rate), rate) };
};

// what a field was built with; a rebuild restarts every drop, so only a real change triggers it:
// rain starting or stopping, or the count moving by a quarter (at least two)
export interface Built {
  n: number;
  wet: boolean;
}
export const needsRebuild = (built: Built | null, now: Built) =>
  !built || built.wet !== now.wet || Math.abs(now.n - built.n) >= Math.max(2, built.n * 0.25);
