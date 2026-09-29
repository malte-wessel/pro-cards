// Formatting and the per-entity render model. Every function takes the card context
// ctx = { hass, tplResult, ... } so it runs without a DOM element.
import { asText, progressOf, readValue, resolveLook, type Look, type ValueModel } from "./look.ts";
import type { EntityCardConfig, EntityItem } from "./config.ts";
import { fmtNumber as fmtNum, fmtTime as fmtT, langOf as lang } from "../shared/format.ts";
import type { HassEntity, HomeAssistant } from "../shared/ha.ts";
import type { Point } from "../shared/history.ts";
import { decimalsOf, isTemplate } from "../shared/util.ts";

// the card's bound pointer handlers for the history plots
export interface PlotHandlers {
  move: (ev: PointerEvent) => void;
  up: (ev: PointerEvent) => void;
  leave: (ev: PointerEvent) => void;
}
// what the formatting helpers need; the render helpers need the whole `RenderCtx`
export interface FormatCtx {
  hass: HomeAssistant | undefined;
  tplResult: Map<string, unknown>;
}
export interface RenderCtx extends FormatCtx {
  series: Map<string, Point[]>;
  fetched: boolean;
  cfg: EntityCardConfig;
  now: number;
  t0: number;
  plotHandlers: PlotHandlers;
}
export interface FmtValue {
  text: string;
  num: string;
  unit: string;
}
// everything a fill function needs for one entity
export interface EntityModel {
  st: HassEntity | undefined;
  model: ValueModel;
  look: Look;
  fmt: FmtValue;
  progress: number | null;
}

export const langOf = (ctx: FormatCtx) => lang(ctx.hass);
export const tplGetter = (ctx: FormatCtx) => (t: string) => ctx.tplResult.get(t) ?? null;
// a config string: the rendered result for templates (null until Home Assistant answered)
export const tplOf = (ctx: FormatCtx, t: string | null): string | null =>
  isTemplate(t) ? asText(ctx.tplResult.get(t)) : t;
export const stateOf = (ctx: FormatCtx, ent: EntityItem) =>
  ent.entity ? ctx.hass?.states[ent.entity] : undefined;
export const nameOf = (ctx: FormatCtx, ent: EntityItem, st: HassEntity | undefined): string =>
  tplOf(ctx, ent.name) || st?.attributes?.friendly_name || ent.entity || "";
export const fmtTime = (ctx: FormatCtx, t: number | Date) => fmtT(ctx.hass, t);

export const fmtNumber = (
  ctx: FormatCtx,
  ent: EntityItem,
  v: number,
  st: HassEntity | undefined,
  withUnit = true,
) => {
  const dec =
    ent.decimals ?? Math.min(2, decimalsOf(ent.valueSrc.kind === "state" ? st?.state : v));
  const n = fmtNum(ctx.hass, v, dec);
  const unit: string = withUnit
    ? (ent.unit ??
      (ent.valueSrc.kind === "state" ? st?.attributes?.unit_of_measurement : null) ??
      "")
    : "";
  return unit ? `${n} ${unit}` : n;
};
// formatted value: { text, num, unit } — num / unit split for the hero and cell "big" value
export const fmtValue = (
  ctx: FormatCtx,
  ent: EntityItem,
  model: ValueModel,
  st: HassEntity | undefined,
): FmtValue => {
  if (!model.avail) return { text: "–", num: "–", unit: "" };
  const hass = ctx.hass;
  if (model.num !== null) {
    const useHa =
      ent.valueSrc.kind === "state" &&
      ent.decimals === null &&
      ent.unit === null &&
      st &&
      typeof hass?.formatEntityState === "function";
    let num: string,
      unit: string =
        ent.unit ??
        (ent.valueSrc.kind === "state" ? st?.attributes?.unit_of_measurement : null) ??
        "";
    if (useHa && hass?.formatEntityState && st) {
      let s: string;
      try {
        s = hass.formatEntityState(st);
      } catch {
        s = "";
      }
      if (unit && s.endsWith(unit)) num = s.slice(0, -unit.length).trim();
      else {
        num = s || fmtNumber(ctx, ent, model.num, st, false);
        unit = s ? "" : unit || "";
      }
    } else num = fmtNumber(ctx, ent, model.num, st, false);
    return {
      text: `${ent.prefix}${num}${unit ? " " + unit : ""}${ent.suffix}`,
      num: `${ent.prefix}${num}${ent.suffix}`,
      unit,
    };
  }
  let txt = model.raw;
  if (ent.valueSrc.kind === "state" && st && typeof hass?.formatEntityState === "function") {
    try {
      txt = hass.formatEntityState(st);
    } catch {
      txt = model.raw;
    }
  }
  const text = `${ent.prefix}${txt}${ent.suffix}`;
  return { text, num: text, unit: "" };
};

export const modelOf = (ctx: FormatCtx, ent: EntityItem): EntityModel => {
  const st = stateOf(ctx, ent);
  const tplGet = tplGetter(ctx);
  const model = readValue(ent, st, tplGet);
  if (ent.entity && !st) {
    model.avail = false;
    model.missing = true;
  }
  const look = resolveLook(ent, model, st, tplGet);
  if (model.missing) look.label = `${ent.entity} not found`;
  return {
    st,
    model,
    look,
    fmt: fmtValue(ctx, ent, model, st),
    progress: progressOf(ent, model.num, st),
  };
};
