// The value as `format` writes it (a badge's, a poster's or a tile's own): in W / kW / MW, a span
// in words or as a clock, the time from now of a date. A time left (a timer's, a moment ahead with
// `clock` or `duration`) carries how it is written as it runs down: the fills hand it to the page
// clock. Null where nothing is written apart: the entity's own formatting stands.
import { clockText, leftAt, liveText, momentAhead, type Countdown } from "../countdown.ts";
import { durationSeconds, fmtDuration, fmtPowerAuto, fmtRelative } from "../format.ts";
import type { EntityItem } from "./config.ts";
import { unitOf, type EntityModel, type FmtValue, type RenderCtx } from "./model.ts";

const word = (text: string, live?: FmtValue["live"]): FmtValue => ({
  text,
  num: text,
  unit: "",
  ...(live ? { live } : {}),
});

export const formatValue = (ctx: RenderCtx, ent: EntityItem, m: EntityModel): FmtValue | null => {
  const { model } = m;
  if (!model.avail) return null;
  // (the deprecated cards' header badges write what they always did: no clock, no time left)
  const v3 = !!ent.pill || !!ctx.countdowns;
  const f = ent.format === "clock" && !v3 ? "auto" : ent.format;
  const wrap = (s: string) => `${ent.prefix}${s}${ent.suffix}`;
  // a time left: a timer's own, else a date ahead that is to be written as a span
  const cd: Countdown | null =
    (m.countdown && !m.countdown.idle ? m.countdown : null) ??
    (v3 && (f === "clock" || f === "duration") ? momentAhead(model.raw, ctx.now) : null);
  if (cd) {
    // the time from now in words while it runs (a minute's steps, as a date's)
    if (f === "relative" && cd.ends !== null)
      return word(wrap(fmtRelative(ctx.hass, cd.ends, ctx.now)));
    const write =
      f === "duration" || f === "relative"
        ? (left: number) => wrap(fmtDuration(ctx.hass, Math.ceil(left - 1e-3)))
        : (left: number) => wrap(clockText(left));
    return word(write(leftAt(cd, ctx.now)), cd.ends === null ? undefined : { cd, write });
  }
  if (f === "auto") return null;
  if (f === "relative") {
    const t = new Date(model.raw ?? "").getTime();
    return Number.isNaN(t) ? null : word(wrap(fmtRelative(ctx.hass, t, ctx.now)));
  }
  if (model.num === null) return null;
  const unit = unitOf(ent, m.st);
  if (f === "power") {
    const s = fmtPowerAuto(ctx.hass, model.num, unit, ent.decimals);
    if (s === null) return null;
    // the number and its unit apart, as every value (a poster draws the unit smaller)
    const parts = /^(.*\d)\s*(\S+)$/.exec(s);
    return parts ? { text: wrap(s), num: wrap(parts[1]), unit: parts[2] } : word(wrap(s));
  }
  const sec = durationSeconds(model.num, unit);
  if (sec === null) return null;
  return word(wrap(f === "clock" ? clockText(Math.round(sec)) : fmtDuration(ctx.hass, sec)));
};

// an element showing a value: its text, kept current while it runs down
export const putValue = (el: HTMLElement, text: string, v: FmtValue | null | undefined) => {
  el.textContent = text;
  if (v?.live) liveText(el, v.live.cd, v.live.write);
};
