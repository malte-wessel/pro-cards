// Swipe Card Pro: the strip's maths (pure): how wide a card is, where the strip stops, which stop
// is the current one.
import type { Snap } from "./config.ts";

// The width of one card: `perPage` cards across the strip, with the gaps between the whole ones
// (1.15: one card, a gap and the start of the next). Never more per page than there are cards:
// one card fills the strip.
export const slideWidth = (perPage: number, shown: number, gap: string): string => {
  const p = Math.max(1, Math.min(perPage, shown));
  const gaps = Math.ceil(p) - 1;
  return gaps ? `calc((100% - ${gaps} * ${gap}) / ${p})` : `calc(100% / ${p})`;
};

export interface Slide {
  start: number; // from the strip's start edge, as the strip scrolls (offsetLeft)
  width: number;
}

// The scroll positions the strip stops at, one per page: each card's snap position, clamped to
// what the strip can scroll, and the same position only once (the last cards of a strip with
// more than one per page share the end). `padStart` / `padEnd` are the strip's inline padding,
// its scroll padding too.
export const stopsOf = (
  slides: Slide[],
  viewport: number,
  scrollMax: number,
  snap: Snap,
  padStart: number,
  padEnd: number,
): number[] => {
  const out: number[] = [];
  for (const s of slides) {
    const at =
      snap === "center"
        ? s.start + s.width / 2 - (padStart + viewport - padEnd) / 2
        : s.start - padStart;
    const x = Math.round(Math.min(Math.max(0, scrollMax), Math.max(0, at)));
    if (!out.length || x - out[out.length - 1] > 1) out.push(x);
  }
  return out;
};

// the index of the stop nearest to the scroll position
export const nearest = (stops: number[], x: number): number => {
  let best = 0;
  stops.forEach((s, i) => {
    if (Math.abs(s - x) < Math.abs(stops[best] - x)) best = i;
  });
  return best;
};

// getCardSize: rows of `perRow` cards, each row as tall as its tallest card
export const sizeOf = (sizes: number[], perRow: number): number => {
  let n = 0;
  for (let i = 0; i < sizes.length; i += perRow) n += Math.max(...sizes.slice(i, i + perRow));
  return Math.max(1, n);
};
