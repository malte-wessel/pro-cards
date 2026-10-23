// Pure helpers of the flow engine: units, bearings and a seeded random generator, so every
// animation is deterministic and a paused frame reproducible.
import { COMPASS, UNIT_TO_KMH } from "./constants.ts";

// a speed in km/h; Beaufort is a scale, not a unit: its force B is about 0.836 · B^1.5 m/s
export const toKmh = (v: number, unit: string | null | undefined): number => {
  const u = (unit ?? "").trim().toLowerCase();
  if (u === "beaufort" || u === "bft") return 0.836 * Math.pow(Math.max(0, v), 1.5) * 3.6;
  return v * (UNIT_TO_KMH[u] ?? 1);
};

export const norm = (deg: number) => ((deg % 360) + 360) % 360;

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
// the angle equal to `next` (mod 360) nearest to `prev`, so a CSS transition turns the short way
// and never spins back across 0°: prev 350, next 10 → 370
export const unwrapAngle = (prev: number | null, next: number) => {
  if (prev === null) return next;
  const d = (((next - prev) % 360) + 360) % 360;
  return prev + (d > 180 ? d - 360 : d);
};

// a seeded linear congruential generator (Park–Miller), values in [0, 1)
export const prng = (seed = 11) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};
