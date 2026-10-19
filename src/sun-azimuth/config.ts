// Config types of the sun azimuth card and what its render modules read from the card element.
import type { CardConfigBase, HomeAssistant } from "../shared/ha.ts";
import type { Roof, SideKey, View } from "./constants.ts";
import type { SunDay } from "./day.ts";

// a side's own name, or false for a wall that never gets sun (shared with the neighbour)
export type SideNames = Partial<Record<SideKey, string | false>>;

export interface SunAzimuthCardConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  view?: string;
  house?: { front?: number; roof?: string; sides?: SideNames | null } | null;
  camera?: number;
  camera_slider?: boolean;
  hover_preview?: boolean;
  show_summary?: boolean;
  show_sun_times?: boolean;
  show_sides?: boolean;
  sun_color?: string;
  night_color?: string;
  sky_color?: string;
}
export interface SunAzimuthConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  view: View;
  // the bearing the front faces, 0..360
  front: number;
  roof: Roof;
  // own names of the sides; `hidden` lists the ones set to false
  sides: Partial<Record<SideKey, string>>;
  hidden: SideKey[];
  camera: number;
  camera_slider: boolean;
  hover_preview: boolean;
  show_summary: boolean;
  show_sun_times: boolean;
  show_sides: boolean;
  sun_color: string;
  night_color: string;
  sky_color: string;
}
// the day of the home's position
export interface PositionedDay extends SunDay {
  lat: number;
  lon: number;
}
export interface SunAzimuthHost {
  _config: SunAzimuthConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _day: PositionedDay | null;
  _uid?: string;
}
