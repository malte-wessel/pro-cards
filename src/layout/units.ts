// Layout Card Pro: lengths, sides, column tracks and gaps as CSS (pure).
import type { Sides } from "./config.ts";

const err = (msg: string) => new Error(`layout-card-pro: ${msg}`);
const LENGTH_RE = /^-?\d*\.?\d+(px|rem|em|%|vw|vh|svh|dvh)$/;
const FN_RE = /^(var|calc|min|max|clamp)\(.+\)$/;

// a CSS length: a number is px; units px, rem, em, %, vw, vh; var(--x), calc(), min(), max(), clamp()
export const cssLength = (v: unknown, at: string): string => {
  const bad = () => err(`'${at}' must be a length (8, 0.5rem, 4%, var(--x)) of at least 0`);
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v < 0) throw bad();
    return `${v}px`;
  }
  if (typeof v !== "string") throw bad();
  const s = v.trim();
  if (/^-?\d*\.?\d+$/.test(s)) return cssLength(Number(s), at);
  if (LENGTH_RE.test(s)) {
    if (s.startsWith("-")) throw bad();
    return s;
  }
  if (FN_RE.test(s)) return s;
  throw bad();
};

// 1, 2 or 4 values as CSS shorthand does, or { top, right, bottom, left } (missing sides 0)
export const boxSides = (v: unknown, at: string): Sides => {
  const len = (x: unknown, a = at) => cssLength(x, a);
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

// the gap without one of the layout's own: the theme's sections grid gap
export const themeGap = (axis: "row" | "column"): string =>
  `var(--ha-section-grid-${axis}-gap, 8px)`;
