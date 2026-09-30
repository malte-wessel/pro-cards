// Scales and tick helpers of the multi trend card (pure).

export const DEFAULT_HOURS = 6;
export const PALETTE = ["primary", "orange", "green", "purple", "cyan", "pink"];
export const OVERLAY_PLOT_H = 80;
export const LANE_PLOT_H = 60;
export const LANE_LABEL_H = 18; // strip reserved for the lane label; the line never enters it
export const X_AXIS_H = 16; // strip below the plot for time labels

// "nice" step for value ticks: 1, 2, 2.5, 5 x 10^n
export const niceStep = (range: number, target: number) => {
  const rough = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const r = rough / mag;
  const m = r < 1.5 ? 1 : r < 2.25 ? 2 : r < 3.5 ? 2.5 : r < 7.5 ? 5 : 10;
  return m * mag;
};
export const decimalsForStep = (step: number) => {
  let d = 0;
  while (d < 3 && Math.abs(Math.round(step * Math.pow(10, d)) - step * Math.pow(10, d)) > 1e-9) d++;
  return d;
};

// a value → y scale for the band [top, top + h], padded by 10 % and `topPad` px at the top
export interface Scale {
  top: number;
  h: number;
  topPad: number;
  min: number;
  max: number;
  y: (v: number) => number;
}
export const mkScale = (
  min: number,
  max: number,
  top: number,
  h: number,
  topPad: number,
): Scale => {
  if (!Number.isFinite(min)) {
    min = 0;
    max = 1;
  }
  if (max === min) {
    max = min + 1;
    min = min - 1;
  }
  const pad = (max - min) * 0.1;
  min -= pad;
  max += pad;
  const innerTop = top + topPad,
    innerH = h - topPad - 6;
  return {
    top,
    h,
    topPad,
    min,
    max,
    y: (v: number) => innerTop + innerH - ((v - min) / (max - min)) * innerH,
  };
};

// min / max of the values of several series
export const rangeOf = (seriesList: readonly (readonly { v: number }[])[]): [number, number] => {
  let min = Infinity,
    max = -Infinity;
  for (const pts of seriesList)
    for (const p of pts) {
      if (p.v < min) min = p.v;
      if (p.v > max) max = p.v;
    }
  return [min, max];
};
