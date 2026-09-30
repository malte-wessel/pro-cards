// Time axis helpers shared by the cards that plot a history window (pure).

// time tick interval (ms) for a window of `hours`
export const timeStep = (hours: number) => {
  const h = 3600e3;
  if (hours <= 3) return 0.5 * h;
  if (hours <= 8) return h;
  if (hours <= 14) return 2 * h;
  if (hours <= 30) return 4 * h;
  if (hours <= 60) return 12 * h;
  return 24 * h;
};

// tick times in [t0, now] snapped to local clock boundaries of `step` (whole hours, midnight...)
export const clockTicks = (t0: number, now: number, step: number): number[] => {
  const tz = new Date(t0).getTimezoneOffset() * 60e3;
  const ticks: number[] = [];
  for (let t = Math.ceil((t0 - tz) / step) * step + tz; t <= now; t += step) ticks.push(t);
  return ticks;
};
