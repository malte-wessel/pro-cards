// The container cards (layout, swipe): `breakpoints`, the options that change once the card spans
// a number of view columns (pure). The top-level options apply in one view column; each
// breakpoint lists only what changes from there, and every one up to the card's view columns
// applies in turn.
import { isObj, type checks } from "./checks.ts";

export interface Breakpoint<O> {
  columns: number; // the view columns it applies from (2 …)
  overrides: Partial<O>;
}

// `breakpoints` of a config, ascending by view columns; `parse` reads the options of one level
// (only the keys it sets), `example` shows the form in the error of a map that is not one
export const breakpointsOf = <O>(
  raw: unknown,
  check: ReturnType<typeof checks>,
  parse: (raw: Record<string, unknown>, at: string) => Partial<O>,
  example: string,
): Breakpoint<O>[] => {
  if (raw === undefined || raw === null) return [];
  if (!isObj(raw)) throw check.err(`'breakpoints' must map view columns to options, as ${example}`);
  return Object.entries(raw)
    .map(([key, v]) => {
      const columns = check.viewColumns(key, "'breakpoints'", 2);
      if (!isObj(v)) throw check.err(`'breakpoints.${key}' must be the options that change there`);
      return { columns, overrides: parse(v, `breakpoints.${key}`) };
    })
    .sort((a, b) => a.columns - b.columns);
};

// The base options, then every breakpoint up to the view columns there are.
export const resolveAt = <O>(
  base: O,
  breakpoints: readonly Breakpoint<O>[],
  columns: number,
): O => {
  const o = { ...base };
  for (const b of breakpoints) if (b.columns <= columns) Object.assign(o as object, b.overrides);
  return o;
};
