// Defaults and geometry of the sun path card.
import type { HomeAssistant } from "../shared/ha.ts";
import { t } from "../shared/i18n.ts";

export const PLOT_H = 120;
export const HORIZON_MIN = 0.45; // horizon never above 45 % of the plot height
export const HORIZON_MAX = 0.7; // ... and never below 70 %
export const CURVE_STEP_MIN = 10;
export const SUN_EVENTS = ["sunrise", "sunset", "dawn", "noon", "dusk"] as const;
export type SunEvent = (typeof SUN_EVENTS)[number];
export type SunLabels = Record<SunEvent, string>;
// the default label of an event in the user's language
export const defaultLabel = (hass: HomeAssistant | null | undefined, key: SunEvent) =>
  t(hass, `sun.label.${key}`);
export const DEFAULTS = {
  show_dawn_dusk: true,
  show_tooltip: true,
  day_color: "light-blue",
  night_color: "indigo",
  sun_color: "amber",
};
