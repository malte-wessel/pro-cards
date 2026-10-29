// Config types of the sun path card and what its plot module reads from the card element.
import type { CardConfigBase } from "../shared/ha.ts";
import type { SunCurveHost } from "../shared/sun/curve.ts";
import type { SunEvent, SunLabels } from "../shared/sun/events.ts";
import type { TextCache } from "../shared/typography.ts";

export interface SunPathCardConfig extends CardConfigBase {
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
  title?: string;
  icon?: string;
  show_dawn_dusk: boolean;
  show_tooltip: boolean;
  day_color: string;
  night_color: string;
  sun_color: string;
  labels?: Partial<SunLabels>;
}
// what the events row reads from the card element (the curve's part: SunCurveHost)
export interface SunPathHost extends SunCurveHost {
  _config: SunPathConfig;
  _textCache?: TextCache;
  // the label of an event: the config override or the default in the user's language
  _label(key: SunEvent): string;
  _root?: HTMLElement;
}
