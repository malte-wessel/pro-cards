// The current rain: the tile (lead, name, "rate · total today", label pill), the flow tile (the
// band behind icon, name, "label · total today" and the big rate), the hero lead (big rate and
// "label · total today") and the poster (label pill, big rate, "total today"). Built once per row; every render updates texts and CSS variables so
// the running animations keep their phase.
import type { EntityItem } from "../../shared/entity/config.ts";
import { tplOf, unitOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
import {
  buildRow,
  builtLead,
  leadSize,
  fillFlowTexts,
  rowBuilt,
  setRate,
  vars,
  type RowKind,
  type TextPart,
} from "../../shared/flow/dom.ts";
import { parseBearing, toKmh } from "../../shared/flow/maths.ts";
import { t } from "../../shared/i18n.ts";
import type { RainConfig } from "../config.ts";
import { fallRate, isWet, leadFall, levelOf, slantOf, tanOf, toMm, toMmH } from "../rain.ts";
import { animatedLead, rainLead } from "./lead.ts";

export interface CurrentModels {
  rate: EntityModel;
  today: EntityModel | null;
  wind: EntityModel | null;
  dir: EntityModel | null;
}
// the rate in mm/h and today's total in mm, whatever unit the sensors report (the texts keep it)
export interface RainNow {
  rate: number;
  today: number | null;
  slant: number;
  chip: string | null;
}

const numOf = (m: EntityModel | null) => (m && m.model.avail ? m.model.num : null);

export const rainNow = (ctx: RenderCtx, cfg: RainConfig, cm: CurrentModels): RainNow => {
  const rateNum = numOf(cm.rate) ?? 0;
  const rate = toMmH(rateNum, unitOf(cfg.entities[cfg.rateIdx], cm.rate.st));
  const todayNum = numOf(cm.today);
  const today =
    todayNum === null || cfg.todayIdx === null
      ? null
      : toMm(todayNum, unitOf(cfg.entities[cfg.todayIdx], cm.today?.st));
  const windEnt: EntityItem | undefined =
    cfg.windIdx === null ? undefined : cfg.entities[cfg.windIdx];
  const windNum = numOf(cm.wind);
  const windKmh = windEnt && windNum !== null ? toKmh(windNum, unitOf(windEnt, cm.wind?.st)) : null;
  const bearing = cm.dir && cm.dir.model.avail ? parseBearing(cm.dir.model.raw) : null;
  const slant = slantOf(bearing, windKmh);
  const chip =
    cm.today && cm.today.model.avail ? t(ctx.hass, "rain.today", { v: cm.today.fmt.text }) : null;
  return { rate, today, slant, chip };
};

const leadOf = (cfg: RainConfig, kind: RowKind) => {
  const size = leadSize(kind);
  return cfg.lead === "icon"
    ? rainLead(size, cfg.entities[cfg.rateIdx].iconStyle)
    : animatedLead(cfg.flow.style, size);
};

export const updateCurrent = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: RainConfig,
  cm: CurrentModels,
  kind: RowKind,
  now: RainNow,
) => {
  if (!rowBuilt(row)) buildRow(row, kind, leadOf(cfg, kind));
  const ent = cfg.entities[cfg.rateIdx];
  const size = leadSize(kind);
  const level = levelOf(now.today);
  vars(row, {
    "--t": tanOf(now.slant).toFixed(4),
    "--sl": `${(-now.slant).toFixed(2)}deg`,
    "--lv": `${(level * 100).toFixed(1)}%`,
    "--H": `${cfg.flow.style === "fill" ? Math.round(size * (1 - level)) : size}px`,
  });
  const built = builtLead(row, "rate0", now.rate, leadFall(now.rate));
  // dry first: a dry lead's drops are not drawn and have no animations to scale, so a lead that
  // gets wet again is scaled once its drops run
  row.classList.toggle("dry", !isWet(now.rate));
  const lead = row.querySelector<HTMLElement>(".lead");
  if (lead) {
    if (!isWet(now.rate)) delete lead.dataset.rate;
    else setRate(lead, fallRate(now.rate, built));
  }

  const sec = tplOf(ctx, ent.secondary);
  const label = cm.rate.look.label;
  const todayText = now.chip;
  const wide: TextPart[] = [];
  if (sec) wide.push({ text: sec });
  else if (kind === "tile") {
    wide.push({ text: cm.rate.fmt.text });
    if (todayText) wide.push({ text: todayText });
  } else {
    // a poster shows the label in its pill
    if (label && kind !== "poster") wide.push({ text: label, accent: cm.rate.model.avail });
    if (todayText) wide.push({ text: todayText });
  }
  const narrow = sec
    ? [{ text: sec }]
    : [{ text: cm.rate.fmt.text }, ...(todayText ? [{ text: todayText }] : [])];
  fillFlowTexts(ctx, row, ent, cm.rate, kind, wide, narrow);
};
