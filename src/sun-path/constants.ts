// Defaults and geometry of the sun path card.

export const PLOT_H = 120;
export const HORIZON_MIN = 0.45; // horizon never above 45 % of the plot height
export const HORIZON_MAX = 0.7; // ... and never below 70 %
export const CURVE_STEP_MIN = 10;
export const DEFAULT_LABELS = {
  sunrise: "Sunrise",
  sunset: "Sunset",
  dawn: "Dawn",
  noon: "Solar noon",
  dusk: "Dusk",
};
export type SunEvent = keyof typeof DEFAULT_LABELS;
export type SunLabels = Record<SunEvent, string>;
export const DEFAULTS = {
  show_dawn_dusk: true,
  show_tooltip: true,
  day_color: "light-blue",
  night_color: "indigo",
  sun_color: "amber",
};
