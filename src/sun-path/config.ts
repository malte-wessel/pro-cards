// Config types of the sun path card and what its plot module reads from the card element.
import type { CardConfigBase, HomeAssistant } from "../shared/ha.ts";
import type { SunEvent, SunLabels } from "./constants.ts";
import type { SolarDay } from "../shared/solar.ts";
import type { TextCache } from "../shared/typography.ts";

export interface SunPathCardConfig extends CardConfigBase {
  // poster: the next sunrise or sunset large, the curve along the bottom (the entity poster's shape)
  layout?: "card" | "poster";
  title?: string;
  icon?: string;
  show_dawn_dusk?: boolean;
  show_tooltip?: boolean;
  day_color?: string;
  night_color?: string;
  sun_color?: string;
  labels?: Partial<SunLabels>;
}
export interface SunPathConfig extends CardConfigBase {
  layout?: "card" | "poster";
  title?: string;
  icon?: string;
  show_dawn_dusk: boolean;
  show_tooltip: boolean;
  day_color: string;
  night_color: string;
  sun_color: string;
  labels?: Partial<SunLabels>;
}
// the solar day of the home's position
export interface PositionedDay extends SolarDay {
  lat: number;
  lon: number;
}
export interface SunPathHost {
  _config: SunPathConfig;
  _textCache?: TextCache;
  // the label of an event: the config override or the default in the user's language
  _label(key: SunEvent): string;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _uid?: string;
  _day: PositionedDay | null;
  // set by drawCurve for the hover tooltip
  _xOf?: (t: number) => number;
  _yOf?: (e: number) => number;
  _plotW?: number;
}
