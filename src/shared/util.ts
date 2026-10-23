// Small pure helpers shared by all cards.

// a number from a state, an attribute or a config value: a finite number, or a string that is
// one; null for anything else (booleans, blanks, objects, "unavailable") – Number() would read
// true as 1 and " " as 0
export const numOrNull = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const isNum = (s: unknown): boolean => numOrNull(s) !== null;
export const isTemplate = (s: unknown): s is string => typeof s === "string" && /\{\{|\{%/.test(s);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const decimalsOf = (s: unknown) => {
  const m = String(s ?? "").match(/\.(\d+)$/);
  return m ? Math.min(m[1].length, 2) : 0;
};
// the decimals a step (or a grid start) is written with, at most four
export const stepDecimals = (n: number) => Math.min(4, (String(n).split(".")[1] || "").length);
// the nearest value on a grid of steps counted from min (min 1, step 2: 1, 3, 5 …), held inside
// the bounds; rounded to the grid's own decimals so float noise never shows
export const snapTo = (v: number, min: number, max: number, step: number) => {
  const dec = Math.max(stepDecimals(step), stepDecimals(min));
  const snapped = min + Math.round((v - min) / step) * step;
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(dec));
};
// whether `v` is one of the literals in `list` (narrows to the literal union)
export const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);
// text for markup built as a string (an SVG label): safe in a text node and in a quoted attribute
export const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
// the first element matching `sel`; the caller knows the markup, so a missing element is a bug
export const qs = <E extends Element = HTMLElement>(root: ParentNode, sel: string): E =>
  root.querySelector(sel) as E;
