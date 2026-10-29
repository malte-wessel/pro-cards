// The rain now (pure): the rate in mm/h and today's total in mm whatever units the sensors report
// (the texts keep theirs), the drops' slant from the wind, the chip's text (the rain card, the
// poster's rain kind).
import { unitOf, type EntityModel, type RenderCtx } from "../entity/model.ts";
import { parseBearing, toKmh } from "../flow/maths.ts";
import { t } from "../i18n.ts";
import type { Read } from "../wind/now.ts";
import { slantOf, toMm, toMmH } from "./rain.ts";

export interface RainNow {
  rate: number;
  today: number | null;
  slant: number;
  chip: string | null;
}

const numOf = (m: EntityModel | null | undefined) => (m && m.model.avail ? m.model.num : null);

export const rainNow = (
  ctx: RenderCtx,
  rate: Read,
  today: Read | null,
  wind: Read | null,
  dir: Read | null,
): RainNow => {
  const rateNum = numOf(rate.m) ?? 0;
  const todayNum = numOf(today?.m);
  const windNum = numOf(wind?.m);
  const windKmh = wind && windNum !== null ? toKmh(windNum, unitOf(wind.ent, wind.m.st)) : null;
  const bearing = dir && dir.m.model.avail ? parseBearing(dir.m.model.raw) : null;
  return {
    rate: toMmH(rateNum, unitOf(rate.ent, rate.m.st)),
    today: today && todayNum !== null ? toMm(todayNum, unitOf(today.ent, today.m.st)) : null,
    slant: slantOf(bearing, windKmh),
    chip: today && today.m.model.avail ? t(ctx.hass, "rain.today", { v: today.m.fmt.text }) : null,
  };
};
