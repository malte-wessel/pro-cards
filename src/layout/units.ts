// Layout Card Pro: lengths, sides and column tracks as CSS (pure). Lengths and sides are the
// container cards' (src/shared/cards/units.ts), with the layout card's name in their errors.
import { checks } from "../shared/cards/checks.ts";
import { lengths } from "../shared/cards/units.ts";
import { CARD_TYPE } from "./type.ts";

export const { cssLength, boxSides } = lengths(CARD_TYPE);
const { err } = checks(CARD_TYPE);

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
