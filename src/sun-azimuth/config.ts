// Config types of the sun azimuth card and what its render modules read from the card element.
import type { CardConfigBase, HomeAssistant } from "../shared/ha.ts";
import type { SideKey, View } from "./constants.ts";
import type { SunDay } from "./day.ts";

export type SideNames = Partial<Record<SideKey, string>>;

export interface SunAzimuthCardConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  view?: string;
  house?: { rotation?: number; sides?: SideNames | null } | null;
  camera?: number;
  camera_slider?: boolean;
  hover_preview?: boolean;
  show_house?: boolean;
  show_events?: boolean;
  show_sides?: boolean;
  sun_color?: string;
  night_color?: string;
  sky_color?: string;
}
export interface SunAzimuthConfig extends CardConfigBase {
  title?: string;
  icon?: string;
  view: View;
  rotation: number;
  sides: SideNames;
  camera: number;
  camera_slider: boolean;
  hover_preview: boolean;
  show_house: boolean;
  show_events: boolean;
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
