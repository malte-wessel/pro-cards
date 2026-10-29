// The current rain: the tile (lead, name, "rate · total today", label pill), the flow tile (the
// band behind icon, name, "label · total today" and the big rate) and the hero lead (big rate and
// "label · total today"). Built once per row; every render updates texts and CSS variables so
// the running animations keep their phase.
import { tplOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
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
import type { RainConfig } from "../config.ts";
import { fallRate, isWet, leadFall, levelOf, tanOf } from "../../shared/rain/rain.ts";
import { rainNow as sharedRainNow, type RainNow } from "../../shared/rain/now.ts";
import { animatedLead, rainLead } from "../../shared/rain/lead.ts";

export interface CurrentModels {
  rate: EntityModel;
  today: EntityModel | null;
  wind: EntityModel | null;
  dir: EntityModel | null;
}

export const rainNow = (ctx: RenderCtx, cfg: RainConfig, cm: CurrentModels): RainNow => {
  const read = (i: number | null, m: EntityModel | null) =>
    i === null || !m ? null : { ent: cfg.entities[i], m };
  return sharedRainNow(
    ctx,
    { ent: cfg.entities[cfg.rateIdx], m: cm.rate },
    read(cfg.todayIdx, cm.today),
    read(cfg.windIdx, cm.wind),
    read(cfg.dirIdx, cm.dir),
  );
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
    if (label) wide.push({ text: label, accent: cm.rate.model.avail });
    if (todayText) wide.push({ text: todayText });
  }
  const narrow = sec
    ? [{ text: sec }]
    : [{ text: cm.rate.fmt.text }, ...(todayText ? [{ text: todayText }] : [])];
  fillFlowTexts(ctx, row, ent, cm.rate, kind, wide, narrow);
};

export type { RainNow };
