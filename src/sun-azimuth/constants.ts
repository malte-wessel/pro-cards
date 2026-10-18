// Defaults and geometry of the sun azimuth card.
import type { HomeAssistant } from "../shared/ha.ts";
import { t } from "../shared/i18n.ts";

export const VIEWS = ["dial", "3d"] as const;
export type View = (typeof VIEWS)[number];

// the four sides of the house, clockwise from the front as the dial and the 3D scene walk their
// edges; left and right as you stand in front of the house looking at it, so with the front
// facing north the left side faces east
export const SIDES = ["front", "left", "back", "right"] as const;
export type SideKey = (typeof SIDES)[number];
// the bearing of each side's outward normal relative to the front
export const SIDE_ANGLE: Record<SideKey, number> = { front: 0, left: 90, back: 180, right: 270 };
// the order the footer lists them in
export const SIDE_ORDER: readonly SideKey[] = ["front", "right", "back", "left"];

// the nearest of the eight compass points to a bearing: n, ne, e … nw
const POINTS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
export const pointOf = (az: number) => POINTS[Math.round((((az % 360) + 360) % 360) / 45) % 8];
// the default name of a side in the user's language: where it faces ("South-West side")
export const defaultSideName = (hass: HomeAssistant | null | undefined, normal: number) =>
  t(hass, `azimuth.side.${pointOf(normal)}`);

export const DEFAULTS = {
  view: "dial" as View,
  front: 0,
  camera: 180,
  camera_slider: false,
  hover_preview: true,
  show_house: true,
  show_events: false,
  show_sides: false,
  sun_color: "amber",
  night_color: "indigo",
  sky_color: "light-blue",
};

export const SAMPLE_MS = 60000; // one sample per minute over the day
export const PATH_STEP = 10; // the drawn paths use every tenth sample

// the sky dial: a 300 box, the horizon ring at R
export const DIAL = { size: 300, r: 124, house: 20 } as const;
// the 3D scene: an orthographic view of the unit sphere, tilted down by `tilt`. The sphere's
// radius in px is maxScale; a column too narrow for it shrinks it down to minScale (sceneBox); `side` is the
// room beside the E / W labels, `top` above the dome (the sun's halo), `bottom` under the ground's
// labels. `width` stands in for the column until it is laid out
export const SCENE = {
  minScale: 60,
  maxScale: 118,
  side: 14,
  top: 16,
  bottom: 22,
  width: 416,
  tilt: 22,
  houseHalf: 0.1,
  houseHeight: 0.11,
  label: 1.12, // the compass points sit at 1.12 × the radius
} as const;

// the elevation chip of the 3D view: the font the text is measured and drawn with
export const CHIP_FONT = "500 12px Roboto, system-ui, sans-serif";
