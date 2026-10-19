// Defaults and geometry of the sun azimuth card.
import type { HomeAssistant } from "../shared/ha.ts";
import { t } from "../shared/i18n.ts";

export const VIEWS = ["dial", "3d"] as const;
export type View = (typeof VIEWS)[number];
// the roof of the house: a gable with its ridge from left to right (eaves at the front and the
// back), a gable facing the front (ridge from front to back), a hip roof, or a flat one
export const ROOFS = ["gable", "gable_front", "hip", "flat"] as const;
export type Roof = (typeof ROOFS)[number];

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
  view: "3d" as View,
  front: 0,
  roof: "gable" as Roof,
  camera: 180,
  camera_slider: false,
  hover_preview: true,
  show_summary: true,
  show_sun_times: false,
  show_sides: false,
  sun_color: "amber",
  night_color: "indigo",
  sky_color: "light-blue",
};

export const SAMPLE_MS = 60000; // one sample per minute over the day
export const PATH_STEP = 10; // the drawn paths use every tenth sample

// the sky dial at full size: a 300 box, the horizon ring at r (dialBox shrinks it to the column)
export const DIAL = { size: 300, r: 124, house: 20 } as const;
// strokes and dots follow the size of the picture: its radius over the full-size one, but no
// thinner than LINE_MIN, so a narrow card keeps lines that read
export const LINE_MIN = 0.7;
// how thick the walls of the house are drawn, in px at full size: in the sun and in the shade
export const WALL = { lit: 4, plain: 2 } as const;
export const lineScale = (r: number, full: number) => Math.max(LINE_MIN, Math.min(1, r / full));
// the 3D scene: an orthographic view of the unit sphere, tilted down by `tilt`. The sphere's
// radius in px is maxScale; a column too narrow for it shrinks it down to minScale (sceneBox); the
// compass labels sit `labelGap` px outside the rim (on screen, so the gap holds at any size and
// tilt), `side` is the room beside the E / W labels and `bottom` under the front label (each
// about half a letter and a little air), `top` above the dome (the sun's halo). `width` stands in for the column until it is laid out
export const SCENE = {
  minScale: 40,
  maxScale: 118,
  side: 8,
  top: 16,
  bottom: 10,
  width: 416,
  tilt: 22,
  houseHalf: 0.17,
  houseHeight: 0.15,
  labelGap: 10,
} as const;

// the elevation chip of the 3D view: the font the text is measured and drawn with
export const CHIP_FONT = "500 12px Roboto, system-ui, sans-serif";
