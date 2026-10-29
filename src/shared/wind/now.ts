// The wind now (pure): the speed and the gusts in km/h for the animation, the bearing and its
// compass text, the chip's text (the wind card, the poster's wind kind).
import type { EntityItem } from "../entity/config.ts";
import { unitOf, type EntityModel, type RenderCtx } from "../entity/model.ts";
import { COMPASS } from "../flow/constants.ts";
import { compassIndex, parseBearing, toKmh } from "../flow/maths.ts";
import { fmtNumber } from "../format.ts";
import { t, type StringKey } from "../i18n.ts";

// an item and its model
export interface Read {
  ent: EntityItem;
  m: EntityModel;
}
export interface WindNow {
  kmh: number;
  gustKmh: number | null;
  bearing: number | null;
  dirText: string | null;
  chip: string | null;
}

const DIR_KEYS = COMPASS.map((c) => `wind.dir.${c.toLowerCase()}` as StringKey);

export const kmhOf = (r: Read | null) =>
  r && r.m.model.num !== null ? toKmh(r.m.model.num, unitOf(r.ent, r.m.st)) : null;

export const windNow = (
  ctx: RenderCtx,
  speed: Read,
  dir: Read | null,
  gust: Read | null,
): WindNow => {
  const kmh = kmhOf(speed) ?? 0;
  const gustKmh = kmhOf(gust);
  const bearing = dir && dir.m.model.avail ? parseBearing(dir.m.model.raw) : null;
  const dirText = bearing === null ? null : t(ctx.hass, DIR_KEYS[compassIndex(bearing)]);
  const chip =
    bearing === null ? null : `${dirText} ${fmtNumber(ctx.hass, Math.round(bearing), 0)}°`;
  return { kmh, gustKmh, bearing, dirText, chip };
};
