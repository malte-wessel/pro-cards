// Layout Card Pro: lengths, sides, column tracks and gaps as CSS (pure).
import type { Density, Sides } from "./config.ts";

const err = (msg: string) => new Error(`layout-card-pro: ${msg}`);
const LENGTH_RE = /^-?\d*\.?\d+(px|rem|em|%|vw|vh|svh|dvh)$/;
const FN_RE = /^(var|calc|min|max|clamp)\(.+\)$/;

// a CSS length: a number is px; units px, rem, em, %, vw, vh; var(--x), calc(), min(), max(), clamp()
export const cssLength = (v: unknown, at: string, { negative = false } = {}): string => {
  const bad = () =>
    err(`'${at}' must be a length (8, 0.5rem, 4%, var(--x))${negative ? "" : " of at least 0"}`);
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v < 0 && !negative) throw bad();
    return `${v}px`;
  }
  if (typeof v !== "string") throw bad();
  const s = v.trim();
  if (/^-?\d*\.?\d+$/.test(s)) return cssLength(Number(s), at, { negative });
  if (LENGTH_RE.test(s)) {
    if (s.startsWith("-") && !negative) throw bad();
    return s;
  }
  if (FN_RE.test(s)) return s;
  throw bad();
};

// 1, 2 or 4 values as CSS shorthand does, or { top, right, bottom, left } (missing sides 0)
export const boxSides = (v: unknown, at: string, negative: boolean): Sides => {
  const len = (x: unknown, a = at) => cssLength(x, a, { negative });
  if (Array.isArray(v)) {
    if (v.length === 1) return [len(v[0]), len(v[0]), len(v[0]), len(v[0])];
    if (v.length === 2) {
      const [y, x] = [len(v[0]), len(v[1])];
      return [y, x, y, x];
    }
    if (v.length === 4) return [len(v[0]), len(v[1]), len(v[2]), len(v[3])];
    throw err(`'${at}' takes 1, 2 or 4 values, or { top, right, bottom, left }`);
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of Object.keys(o))
      if (!["top", "right", "bottom", "left"].includes(k))
        throw err(`'${at}.${k}' is not a side (top, right, bottom, left)`);
    const side = (k: string) => (o[k] === undefined ? "0px" : len(o[k], `${at}.${k}`));
    return [side("top"), side("right"), side("bottom"), side("left")];
  }
  const one = len(v);
  return [one, one, one, one];
};

// One column track: `Nfr` (as minmax(0, Nfr), so a wide card never widens its column), a length,
// or minmax(a, b) of those. Content-sized tracks (auto, min-content, max-content) are refused: each
// card contains its inline size (.item), so such a column would shrink to nothing.
const FR_RE = /^\d*\.?\d+fr$/;
const track = (v: unknown, at: string): string => {
  const s = typeof v === "number" ? `${v}px` : typeof v === "string" ? v.trim() : "";
  if (FR_RE.test(s)) return `minmax(0, ${s})`;
  const mm = /^minmax\(\s*([^,]+?)\s*,\s*([^,]+?)\s*\)$/.exec(s);
  if (mm) {
    const part = (x: string) => (FR_RE.test(x) ? x : cssLength(x, at));
    if (FR_RE.test(mm[1])) throw err(`'${at}' can not start a minmax() with fr`);
    return `minmax(${part(mm[1])}, ${part(mm[2])})`;
  }
  try {
    return cssLength(s, at);
  } catch {
    throw err(
      `'${at}' must be a length or fr, such as 1fr, 320px or minmax(200px, 1fr) (auto and max-content size to nothing here)`,
    );
  }
};
export const trackTokens = (v: unknown, at: string): string[] => {
  if (!Array.isArray(v) || !v.length)
    throw err(`'${at}' must be a whole number from 1 to 24 or a list of tracks such as [1fr, 2fr]`);
  return v.map((x, i) => track(x, `${at}[${i}]`));
};

// grid-template-columns for a count or a track list
export const trackList = (cols: number | string[]): string =>
  Array.isArray(cols) ? cols.join(" ") : `repeat(${cols}, minmax(0, 1fr))`;
export const trackCountOf = (cols: number | string[]) => (Array.isArray(cols) ? cols.length : cols);

// As many columns as fit, none narrower than `min` (nor wider than the card) and at most `max`.
// auto-fill keeps the column width when there are fewer cards than columns.
export const autoFitTemplate = (min: string, max: number | null, colGap: string): string => {
  const floor = `min(100%, ${min})`;
  const w = max ? `max(${floor}, calc((100% - ${max - 1} * ${colGap}) / ${max}))` : floor;
  return `repeat(auto-fill, minmax(${w}, 1fr))`;
};

// how many columns of at least `minPx` fit into `width` (masonry, which lays its columns out itself)
export const autoFitCount = (width: number, minPx: number, gapPx: number, max: number | null) => {
  const n = Math.max(1, Math.floor((width + gapPx) / (Math.max(1, minPx) + gapPx)));
  return max ? Math.min(max, n) : n;
};

// a length in px where that can be known without the page (px, and rem / em at 16 px)
export const toPx = (len: string | null): number | null => {
  if (!len) return null;
  const m = /^(-?\d*\.?\d+)(px|rem|em)$/.exec(len);
  if (!m) return null;
  return Number(m[1]) * (m[2] === "px" ? 1 : 16);
};

// the columns of a computed grid-template-columns ("120px 120px 120px"), null when not resolved
export const trackCount = (computed: string | null | undefined): number | null => {
  if (!computed || computed === "none" || /repeat|minmax|fr/.test(computed)) return null;
  // an implicit column a span made (no card in it) is 0 px wide
  const n = computed
    .trim()
    .split(/\s+/)
    .filter((t) => t !== "0px").length;
  return n > 0 ? n : null;
};

// the gap of a density; the default follows the theme's sections grid
export const densityGap = (d: Exclude<Density, "auto">, axis: "row" | "column"): string =>
  d === "compact" ? "4px" : d === "roomy" ? "16px" : `var(--ha-section-grid-${axis}-gap, 8px)`;
