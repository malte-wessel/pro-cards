// Layout Card Pro: lengths, sides and column tracks as CSS (pure). Lengths and sides are the
// container cards' (src/shared/cards/units.ts), with the layout card's name in their errors.
import { checks } from "../shared/cards/checks.ts";
import { lengths } from "../shared/cards/units.ts";
import { CARD_TYPE } from "./type.ts";

export const { cssLength, boxSides } = lengths(CARD_TYPE);
const { err } = checks(CARD_TYPE);

// One track of the grid: `Nfr`, a length, or minmax(a, b) of those (never starting with fr).
// Columns and rows differ in two ways, given by `kind`:
// - a column takes no content-sized track (auto, min-content, max-content): each card contains
//   its inline size (.item), so such a column would shrink to nothing; a row may be `auto`, as
//   tall as its cards (they contain only their width);
// - a column's `Nfr` is minmax(0, Nfr), so a wide card never widens it; a row's stays as written,
//   never shorter than its cards. Several fr rows keep their proportions to each other, as CSS
//   does: without a height of its own the layout makes each as tall as the most any card in them
//   needs per fr.
interface TrackKind {
  auto: boolean;
  fr: (s: string) => string;
  hint: string;
}
const FR_RE = /^\d*\.?\d+fr$/;
const COLUMN: TrackKind = {
  auto: false,
  fr: (s) => `minmax(0, ${s})`,
  hint: "a length or fr, such as 1fr, 320px or minmax(200px, 1fr) (auto and max-content size to nothing here)",
};
const ROW: TrackKind = {
  auto: true,
  fr: (s) => s,
  hint: "auto, fr or a length, such as auto, 1fr, 120px or minmax(80px, 1fr)",
};
const track = (kind: TrackKind, v: unknown, at: string): string => {
  const s = typeof v === "number" ? `${v}px` : typeof v === "string" ? v.trim() : "";
  if (kind.auto && s === "auto") return s;
  if (FR_RE.test(s)) return kind.fr(s);
  const mm = /^minmax\(\s*([^,]+?)\s*,\s*([^,]+?)\s*\)$/.exec(s);
  try {
    if (mm) {
      if (FR_RE.test(mm[1])) throw err(`'${at}' can not start a minmax() with fr`);
      const part = (x: string) =>
        FR_RE.test(x) || (kind.auto && x === "auto") ? x : cssLength(x, at);
      return `minmax(${part(mm[1])}, ${part(mm[2])})`;
    }
    return cssLength(s, at);
  } catch (e) {
    if (mm && FR_RE.test(mm[1])) throw e;
    throw err(`'${at}' must be ${kind.hint}`);
  }
};
export const trackTokens = (v: unknown, at: string): string[] => {
  if (!Array.isArray(v) || !v.length)
    throw err(`'${at}' must be a whole number from 1 to 24 or a list of tracks such as [1fr, 2fr]`);
  return v.map((x, i) => track(COLUMN, x, `${at}[${i}]`));
};
export const rowTokens = (v: unknown, at: string): string[] => {
  if (!Array.isArray(v) || !v.length)
    throw err(`'${at}' must be a list of rows such as [auto, 1fr]`);
  return v.map((x, i) => track(ROW, x, `${at}[${i}]`));
};

// grid-template-columns for a count or a track list
export const trackList = (cols: number | string[]): string =>
  Array.isArray(cols) ? cols.join(" ") : `repeat(${cols}, minmax(0, 1fr))`;
export const trackCountOf = (cols: number | string[]) => (Array.isArray(cols) ? cols.length : cols);
