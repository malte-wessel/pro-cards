// Config types of the illuminance card and what its render modules read from the card element.
import type { CardConfigBase, HomeAssistant } from "../shared/ha.ts";
import type { MeanBucket } from "../shared/history.ts";
import type { IlluminanceMode } from "./constants.ts";
import type { Zone, ZoneOverrides } from "./zones.ts";

export interface IlluminanceCardConfig extends CardConfigBase {
  entity?: string;
  mode?: string;
  name?: string;
  hours_to_show?: number;
  bucket_minutes?: number;
  min_lx?: number;
  max_lx?: number;
  zones?: ZoneOverrides | null;
}
// a zone with its colours resolved against the live theme: css for fills, hex for blending
export interface ThemedZone extends Zone {
  css?: string;
}
export interface IlluminanceConfig extends CardConfigBase {
  entity: string;
  mode: IlluminanceMode;
  name?: string;
  hours_to_show: number;
  bucket_minutes: number;
  min_lx: number;
  max_lx: number;
  zones?: ZoneOverrides | null;
  // `zones` merged with the defaults; rebuilt on render so the default labels follow the language
  zonesList: ThemedZone[];
}
export interface LxPoint {
  t: number;
  v: number;
}
export type SampledLx = LxPoint | MeanBucket;

// the card element as the render modules see it; the layout results the hover needs are
// stored on it (`_mode`, `_sampled`, `_buckets`, `_xOf`, `_yOf`, `_bw`, `_gutter`, `_plotW`)
export interface IlluminanceHost {
  _config: IlluminanceConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _series: LxPoint[];
  _onPointer: (ev: PointerEvent) => void;
  _onLeave: (ev: PointerEvent) => void;
  _mode?: "trend" | "band";
  _sampled?: SampledLx[];
  _buckets?: (MeanBucket | null)[];
  _xOf?: (t: number) => number;
  _yOf?: (v: number) => number;
  _bw?: number;
  _gutter?: number;
  _plotW?: number;
}
