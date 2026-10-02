// Defaults and geometry of the sun azimuth card.
import type { HomeAssistant } from "../shared/ha.ts";
import { t } from "../shared/i18n.ts";

export const VIEWS = ["dial", "3d", "ring"] as const;
export type View = (typeof VIEWS)[number];

// the four sides of the house, clockwise; the outward normal of `north` points to the house rotation
export const SIDES = ["north", "east", "south", "west"] as const;
export type SideKey = (typeof SIDES)[number];
export const SIDE_ANGLE: Record<SideKey, number> = { north: 0, east: 90, south: 180, west: 270 };
// the default name of a side in the user's language
export const defaultSideName = (hass: HomeAssistant | null | undefined, key: SideKey) =>
  t(hass, `azimuth.side.${key}`);

export const DEFAULTS = {
  view: "dial" as View,
  rotation: 0,
  camera: 180,
  camera_slider: false,
  show_house: true,
  show_events: true,
  show_sides: true,
  sun_color: "amber",
  night_color: "indigo",
  sky_color: "light-blue",
};

export const SAMPLE_MS = 60000; // one sample per minute over the day
export const PATH_STEP = 10; // the drawn paths use every tenth sample

// the sky dial: a 300 box, the horizon ring at R
export const DIAL = { size: 300, r: 124, house: 20 } as const;
// the 3D scene: an orthographic view of the unit sphere, tilted down by `tilt`
export const SCENE = {
  w: 416,
  h: 206,
  scale: 118,
  cx: 208,
  cy: 134,
  tilt: 22,
  houseHalf: 0.1,
  houseHeight: 0.11,
} as const;

// the elevation chip of the 3D view: the font the text is measured and drawn with
export const CHIP_FONT = "500 12px Roboto, system-ui, sans-serif";
