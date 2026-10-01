// Constants of the flow engine: the animated cards (wind, rain) share layouts, band and lead
// sizes, the compass points and the speed units.

export const LAYOUTS = ["tile", "hero"] as const;
export type Layout = (typeof LAYOUTS)[number];
// the tile's look: the animation in the lead (`icon`) or as the whole tile's background (`flow`)
export const VISUALS = ["icon", "flow"] as const;
export type FlowVisual = (typeof VISUALS)[number];

export const BAND = {
  tileBandH: 88, // the flow tile's band
  heroBandH: 120,
  minBandH: 40,
  maxBandH: 400,
  tileLead: 40,
  heroLead: 56,
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

// the wind speed units Home Assistant knows, as factors to km/h (the animations' reference)
export const UNIT_TO_KMH: Record<string, number> = {
  "km/h": 1,
  "m/s": 3.6,
  mph: 1.609344,
  kn: 1.852,
  "ft/s": 1.09728,
};
