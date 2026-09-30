// Constants of the wind card.

export const CARD_TYPE = "wind-card";

export const LAYOUTS = ["tile", "hero"] as const;
export type Layout = (typeof LAYOUTS)[number];
// the tile's look: the animation in the lead (`icon`) or as the whole tile's background (`flow`)
export const VISUALS = ["icon", "flow"] as const;
export type WindVisual = (typeof VISUALS)[number];
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
  tileBandH: 88, // the flow tile's band
  heroBandH: 120,
  minBandH: 40,
  maxBandH: 400,
  tileLead: 40,
  heroLead: 56,
  // the field square: at least the design's 480 px, grown to cover wide bands at any rotation
  fieldMin: 480,
  fieldMax: 960,
  fieldStep: 40,
} as const;

// the sixteen compass points, clockwise from north; also the accepted direction strings
export const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

// the wind speed units Home Assistant knows, as factors to km/h (the animation's reference)
export const UNIT_TO_KMH: Record<string, number> = {
  "km/h": 1,
  "m/s": 3.6,
  mph: 1.609344,
  kn: 1.852,
  "ft/s": 1.09728,
};
