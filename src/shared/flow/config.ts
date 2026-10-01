// Config pieces shared by the flow cards (pure): the raw keys every flow card accepts, the
// normalised base and the option checks with the card's type in their messages.
import type { EntityCardConfig, RawEntityCardBase } from "../entity/config.ts";
import { numOrNull, oneOf } from "../util.ts";
import { BAND, type FlowVisual, type Layout } from "./constants.ts";

export interface RawFlowCardBase extends RawEntityCardBase {
  entity?: string | null;
  name?: string | null;
  secondary?: string | null;
  color?: string | null;
  rules?: unknown;
  decimals?: unknown;
  layout?: unknown;
  visual?: unknown;
  lead?: unknown;
  flow?: unknown;
}
export interface FlowCardConfig extends EntityCardConfig {
  layout: Layout;
  visual: FlowVisual; // tile only
  leadIdx: number; // the item the lead row shows: carries name / secondary / color / rules
  flow: { height: number }; // the hero's band; the flow tile's band is BAND.tileBandH
}

export const clampInt = (v: unknown, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(numOrNull(v) ?? fallback)));
export const enumOf = <T extends string>(
  type: string,
  list: readonly T[],
  v: unknown,
  key: string,
  dflt: T,
): T => {
  if (v === undefined || v === null) return dflt;
  if (!oneOf(list, v)) throw new Error(`${type}: ${key} must be one of ${list.join(" | ")}`);
  return v;
};
export const sensorId = (type: string, v: unknown, key: string): string | null => {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !v.startsWith("sensor."))
    throw new Error(`${type}: '${key}' must be a sensor entity (sensor.*)`);
  return v;
};
// the `flow` option object, or an error when it is something else
export const flowObject = (type: string, raw: unknown): Record<string, unknown> => {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw))
    throw new Error(`${type}: 'flow' must be an object`);
  return raw as Record<string, unknown>;
};
export const bandHeight = (fo: { height?: unknown }) =>
  clampInt(fo.height, BAND.heroBandH, BAND.minBandH, BAND.maxBandH);
