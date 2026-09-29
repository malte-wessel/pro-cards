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
// whether `v` is one of the literals in `list` (narrows to the literal union)
export const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);
// the first element matching `sel`; the caller knows the markup, so a missing element is a bug
export const qs = <E extends Element = HTMLElement>(root: ParentNode, sel: string): E =>
  root.querySelector(sel) as E;
