// A scrolling row's fades (pure): on the side where more tiles are, by the row's scroll position.
// `at` is how far it has scrolled from its start (the scrollLeft's size: negative in a right-to-left
// language), `max` how far it can; in a right-to-left language its start is on the right.
export const fadesOf = (
  at: number,
  max: number,
  rtl: boolean,
): { left: boolean; right: boolean } => {
  // (a pixel of slack: a snapped position can land a fraction short of either end)
  const fromStart = Math.abs(at);
  const before = max > 1 && fromStart > 1;
  const after = max > 1 && fromStart < max - 1;
  return rtl ? { left: after, right: before } : { left: before, right: after };
};
