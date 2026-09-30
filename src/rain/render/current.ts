// The current rain: the tile (lead, name, "rate · total today", label pill), the flow tile (the
// band behind icon, name, "label · total today" and the big rate) and the hero lead (big rate and
// "label · total today"). Built once per row; every render updates texts and CSS variables so
// the running animations keep their phase.
import type { EntityItem } from "../../shared/entity/config.ts";
import {
  nameOf,
  tplOf,
  unitOf,
  type EntityModel,
  type RenderCtx,
} from "../../shared/entity/model.ts";
import { fillSecondary, pillEl } from "../../shared/entity/render/lead.ts";
import { buildRow, setBig, setRate, vars, type RowKind } from "../../shared/flow/dom.ts";
import { parseBearing, toKmh } from "../../shared/flow/maths.ts";
import { t } from "../../shared/i18n.ts";
import type { RainConfig } from "../config.ts";
import { DEFAULTS } from "../constants.ts";
import { fallRate, isWet, leadFall, levelOf, slantOf, tanOf } from "../rain.ts";
import { animatedLead, rainLead } from "./lead.ts";

export interface CurrentModels {
  rate: EntityModel;
  today: EntityModel | null;
  wind: EntityModel | null;
  dir: EntityModel | null;
}
export interface RainNow {
  rate: number;
  today: number | null;
  slant: number;
  chip: string | null;
}

const numOf = (m: EntityModel | null) => (m && m.model.avail ? m.model.num : null);

export const rainNow = (ctx: RenderCtx, cfg: RainConfig, cm: CurrentModels): RainNow => {
  const rate = numOf(cm.rate) ?? 0;
  const today = numOf(cm.today);
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
  const size = kind === "hero" ? DEFAULTS.heroLead : DEFAULTS.tileLead;
  return cfg.lead === "icon" ? rainLead(size) : animatedLead(cfg.flow.style, size);
};

export const updateCurrent = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: RainConfig,
  cm: CurrentModels,
  kind: RowKind,
) => {
  if (!row.querySelector(".top")) buildRow(row, kind, leadOf(cfg, kind));
  const ent = cfg.entities[cfg.rateIdx];
  const now = rainNow(ctx, cfg, cm);
  const size = kind === "hero" ? DEFAULTS.heroLead : DEFAULTS.tileLead;
  const level = levelOf(now.today);
  vars(row, {
    "--t": tanOf(now.slant).toFixed(4),
    "--sl": `${(-now.slant).toFixed(2)}deg`,
    "--lv": `${(level * 100).toFixed(1)}%`,
    "--H": `${cfg.flow.style === "fill" ? Math.round(size * (1 - level)) : size}px`,
  });
  // the lead's fall as built; later rates scale its playback rate
  if (row.dataset.rate0 === undefined) {
    row.style.setProperty("--ldur", `${leadFall(now.rate).toFixed(3)}s`);
    row.dataset.rate0 = String(now.rate);
  }
  const lead = row.querySelector<HTMLElement>(".lead");
  if (lead) setRate(lead, fallRate(now.rate, Number(row.dataset.rate0)));
  row.classList.toggle("dry", !isWet(now.rate));

  const primary = row.querySelector<HTMLElement>(".primary");
  if (primary) primary.textContent = nameOf(ctx, ent, cm.rate.st);
  const sec = tplOf(ctx, ent.secondary);
  const label = cm.rate.look.label;
  const todayText = now.chip;
  const parts: { text: string; accent?: boolean }[] = [];
  if (sec) parts.push({ text: sec });
  else if (kind === "tile") {
    parts.push({ text: cm.rate.fmt.text });
    if (todayText) parts.push({ text: todayText });
  } else {
    if (label) parts.push({ text: label, accent: cm.rate.model.avail });
    if (todayText) parts.push({ text: todayText });
  }
  const secondary = row.querySelector<HTMLElement>(".secondary:not(.narrow)");
  if (secondary) {
    fillSecondary(secondary, parts);
    secondary.style.display = parts.length ? "" : "none";
  }
  const narrow = row.querySelector<HTMLElement>(".secondary.narrow");
  if (narrow)
    fillSecondary(
      narrow,
      sec
        ? [{ text: sec }]
        : [{ text: cm.rate.fmt.text }, ...(todayText ? [{ text: todayText }] : [])],
    );
  setBig(row.querySelector<HTMLElement>(".big"), cm.rate);
  if (kind === "tile") {
    const end = row.querySelector<HTMLElement>(".end");
    let pill = end?.querySelector<HTMLElement>(".pill") ?? null;
    if (label && end) {
      if (!pill) pill = end.appendChild(pillEl(""));
      pill.textContent = label;
    } else pill?.remove();
  }
};
