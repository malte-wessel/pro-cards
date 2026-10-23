// Constants of the rain card.
import { BAND } from "../shared/flow/constants.ts";

export const CARD_TYPE = "rain-card-pro";

export const LEADS = ["animated", "icon"] as const;
export type Lead = (typeof LEADS)[number];
export const RAIN_STYLES = ["drops", "ripples", "fill"] as const;
export type RainStyle = (typeof RAIN_STYLES)[number];

export const DEFAULTS = {
  style: "drops",
  ...BAND,
  seed: 5,
  fillMm: 12, // today's total that fills the gauge
  wetMin: 0.1, // the rate from which it rains
} as const;

// Home Assistant's rain rate and rain depth units, as factors to mm/h and mm (the animation's
// reference: the wet threshold, the drop counts and the gauge are set in mm)
export const RATE_TO_MMH: Record<string, number> = {
  "mm/h": 1,
  "in/h": 25.4,
  "mm/d": 1 / 24,
  "in/d": 25.4 / 24,
};
export const DEPTH_TO_MM: Record<string, number> = { mm: 1, cm: 10, in: 25.4 };

export const ICON = "mdi:weather-pouring";
export const LEAD_ICON = "mdi:water";
export const CHIP_ICON = "mdi:umbrella";
