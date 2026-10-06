// Small pure helpers shared by all cards.
export const isNum = (s: unknown): boolean =>
  s !== undefined &&
  s !== null &&
  s !== "unavailable" &&
  s !== "unknown" &&
  s !== "" &&
  typeof s !== "object" &&
  !Number.isNaN(Number(s));
export const isTemplate = (s: unknown): s is string => typeof s === "string" && /\{\{|\{%/.test(s);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const numOrNull = (v: unknown): number | null =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
export const decimalsOf = (s: unknown) => {
  const m = String(s ?? "").match(/\.(\d+)$/);
  return m ? Math.min(m[1].length, 2) : 0;
};
// the nearest value on a grid of steps counted from min (min 1, step 2: 1, 3, 5 …), held inside
// the bounds; rounded to the grid's own decimals so float noise never shows
const gridDecimals = (n: number) => Math.min(4, (String(n).split(".")[1] || "").length);
export const snapTo = (v: number, min: number, max: number, step: number) => {
  const dec = Math.max(gridDecimals(step), gridDecimals(min));
  const snapped = min + Math.round((v - min) / step) * step;
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(dec));
};
// whether `v` is one of the literals in `list` (narrows to the literal union)
export const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);
// the first element matching `sel`; the caller knows the markup, so a missing element is a bug
export const qs = <E extends Element = HTMLElement>(root: ParentNode, sel: string): E =>
  root.querySelector(sel) as E;
