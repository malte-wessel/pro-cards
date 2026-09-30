// Illuminance zones and the log scale (pure).
import { mixHex } from "../shared/color.ts";

export type ZoneKey = "night" | "twilight" | "overcast" | "day" | "sun";
export interface Zone {
  key: ZoneKey;
  label: string;
  max: number;
  color: string;
  // the colour resolved against the live theme (set by the card, used for blending)
  hex?: string;
}
// a zone override as written in YAML (`zones: { day: { label, max, color } }`)
export interface ZoneOverride {
  label?: string | null;
  max?: number | string | null;
  color?: string | null;
}
export type ZoneOverrides = Partial<Record<ZoneKey, ZoneOverride | null>>;
export interface ColorAnchor {
  p: number;
  color: string;
}

// Zone colours are HA theme tokens (any HA colour name or a hex value works in config)
export const DEFAULT_ZONES: readonly Zone[] = [
  { key: "night", label: "Night", max: 1, color: "indigo" },
  { key: "twilight", label: "Twilight", max: 100, color: "blue" },
  { key: "overcast", label: "Overcast", max: 10000, color: "blue-grey" },
  { key: "day", label: "Day", max: 30000, color: "amber" },
  { key: "sun", label: "Sun", max: Infinity, color: "orange" },
];

export const mergeZones = (overrides?: ZoneOverrides | null): Zone[] =>
  DEFAULT_ZONES.map((z) => {
    const o = overrides?.[z.key] || {};
    const max = o.max === undefined || o.max === null || o.max === "" ? z.max : Number(o.max);
    return {
      ...z,
      label: o.label || z.label,
      max: Number.isFinite(max) ? max : z.max,
      color: o.color || z.color,
    };
  });
export const zoneOf = (zones: readonly Zone[], v: number): Zone =>
  zones.find((z) => v < z.max) || zones[zones.length - 1];
export const logOf = (v: number) => Math.log10(Math.max(v, 0.1));
// the smallest of 1 / 2 / 5 x 10^n that is >= v (154652 -> 200000)
export const niceCeilLog = (v: number) => {
  if (!(v > 0)) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const r = v / mag;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag;
};
// top of the trend scale: `maxLx` unless the window's peak is higher, then a nice ceiling above it
export const scaleTop = (maxLx: number, peak: number) => (peak > maxLx ? niceCeilLog(peak) : maxLx);
// compact lux text for the axis: 1, 100, 10k, 30k, 1.5k
export const fmtAxisLx = (v: number) =>
  v >= 1000 ? `${Math.round((v / 1000) * 10) / 10}k` : String(v);
// y axis labels: the zone thresholds strictly inside (min, max)
export const yLabels = (zones: readonly Zone[], min: number, max: number) =>
  zones
    .filter((z) => z.max > min && z.max < max)
    .map((z) => ({ val: z.max, txt: fmtAxisLx(z.max) }));
// 0..1 position of v on the log scale [min, max]
export const posOf = (v: number, min: number, max: number) =>
  Math.max(0, Math.min(1, (logOf(v) - logOf(min)) / (logOf(max) - logOf(min))));
// colour anchors: each zone's colour at the log-midpoint of its range (clamped to the scale)
export const colorAnchors = (zones: readonly Zone[], min: number, max: number): ColorAnchor[] => {
  let lo = logOf(min);
  const hi = logOf(max);
  return zones.map((z) => {
    const zhi = Math.min(logOf(z.max), hi);
    const mid = (lo + zhi) / 2;
    lo = zhi;
    return { p: (mid - logOf(min)) / (hi - logOf(min)), color: z.hex || z.color };
  });
};
export const colorAt = (anchors: readonly ColorAnchor[], p: number): string => {
  if (p <= anchors[0].p) return anchors[0].color;
  for (let i = 1; i < anchors.length; i++) {
    if (p <= anchors[i].p) {
      const a = anchors[i - 1],
        b = anchors[i];
      return mixHex(a.color, b.color, (p - a.p) / (b.p - a.p));
    }
  }
  return anchors[anchors.length - 1].color;
};
