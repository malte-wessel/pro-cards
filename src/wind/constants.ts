// Constants of the wind card.

export const CARD_TYPE = "wind-card-pro";

import { BAND } from "../shared/flow/constants.ts";

export const LEADS = ["animated", "arrow"] as const;
export type Lead = (typeof LEADS)[number];
export const FLOW_STYLES = ["dots", "lines", "swoosh", "vectors"] as const;
export type FlowStyle = (typeof FLOW_STYLES)[number];
export const DENSITIES = ["sparse", "normal", "dense"] as const;
export type Density = (typeof DENSITIES)[number];
// lanes across a 480 px field and particles per lane (dots and vectors); the other styles scale
// their counts by lanes / 18
export const DENSITY: Record<Density, { lanes: number; packets: number }> = {
  sparse: { lanes: 12, packets: 3 },
  normal: { lanes: 18, packets: 5 },
  dense: { lanes: 22, packets: 6 },
};

export const DEFAULTS = {
  style: "dots",
  density: "normal",
  ...BAND,
  // the field square: at least the design's 480 px, grown to cover wide bands at any rotation
  fieldMin: 480,
  fieldMax: 960,
  fieldStep: 40,
} as const;
