// Formatting and the per-entity render model. Every function takes the card context
// ctx = { hass, tplResult, ... } so it runs without a DOM element.
import { asText, progressOf, readValue, resolveLook, type Look, type ValueModel } from "./look.ts";
import type { EntityCardConfig, EntityItem } from "./config.ts";
import type { ControlHost } from "./control.ts";
import { fmtNumber as fmtNum, fmtTime as fmtT, langOf as lang } from "../format.ts";
import type { HassEntity, HomeAssistant } from "../ha.ts";
import type { Point } from "../history.ts";
import { t } from "../i18n.ts";
import { decimalsOf, isTemplate } from "../util.ts";

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
  // the controls' host (pending calls, drag state); cards without controls leave it out
  ctl?: ControlHost;
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
// the name: the config name (template allowed), a translated default (attribute items of the
// weather card), the friendly name, the entity id
export const nameOf = (ctx: FormatCtx, ent: EntityItem, st: HassEntity | undefined): string =>
  tplOf(ctx, ent.name) ||
  (ent.nameKey ? t(ctx.hass, ent.nameKey) : null) ||
  st?.attributes?.friendly_name ||
  ent.entity ||
  "";
// the unit: the config unit, the entity's unit for the state, `<attribute>_unit` for an attribute
// (how weather entities carry temperature_unit, wind_speed_unit …)
export const unitOf = (ent: EntityItem, st: HassEntity | undefined): string => {
  if (ent.unit !== null) return ent.unit;
  const a = st?.attributes;
  if (!a) return "";
  const k = ent.valueSrc.kind;
  const u = ent.unitAttr
    ? a[ent.unitAttr]
    : k === "state"
      ? a.unit_of_measurement
      : k === "attribute"
        ? a[`${ent.valueSrc.key}_unit`]
        : null;
  return typeof u === "string" ? u : "";
};
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
  const unit = withUnit ? unitOf(ent, st) : "";
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
      unit = unitOf(ent, st);
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
  const look = resolveLook(ent, model, st, tplGet, ctx.hass);
  if (model.missing) look.label = t(ctx.hass, "common.not_found", { entity: ent.entity ?? "" });
  return {
    st,
    model,
    look,
    fmt: fmtValue(ctx, ent, model, st),
    progress: progressOf(ent, model.num, st),
  };
};
