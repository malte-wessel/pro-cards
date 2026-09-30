// Constants of the rain card.
import { BAND } from "../shared/flow/constants.ts";

export const CARD_TYPE = "rain-card";

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

export const ICON = "mdi:weather-pouring";
export const LEAD_ICON = "mdi:water";
export const CHIP_ICON = "mdi:umbrella";
