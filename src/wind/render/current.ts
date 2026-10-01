// The current wind: the tile (lead, name, "speed · direction", label pill), the flow tile (the
// band behind arrow, name, "label · gusts" and the big value) and the hero lead (big value and
// "label · from SW · gusts"). Built once per row; every render updates texts and CSS variables so
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
import { COMPASS } from "../../shared/flow/constants.ts";
import { buildRow, setBig, setRate, type RowKind } from "../../shared/flow/dom.ts";
import { compassIndex, parseBearing, toKmh } from "../../shared/flow/maths.ts";
import { fmtNumber } from "../../shared/format.ts";
import { t, type StringKey } from "../../shared/i18n.ts";
import type { WindConfig } from "../config.ts";
import { DEFAULTS } from "../constants.ts";
import { leadDuration, pxps } from "../flow.ts";
import { setAngles } from "./flow.ts";
import { animatedLead, arrowLead } from "./lead.ts";

export type { RowKind };
export interface CurrentModels {
  speed: EntityModel;
  dir: EntityModel | null;
  gust: EntityModel | null;
}
// the wind as numbers: speeds in km/h for the animation, the bearing and its compass text
export interface WindNow {
  kmh: number;
  gustKmh: number | null;
  bearing: number | null;
  dirText: string | null;
  chip: string | null;
}

const DIR_KEYS = COMPASS.map((c) => `wind.dir.${c.toLowerCase()}` as StringKey);

const kmhOf = (ent: EntityItem | undefined, m: EntityModel | null) =>
  ent && m && m.model.num !== null ? toKmh(m.model.num, unitOf(ent, m.st)) : null;

export const windNow = (ctx: RenderCtx, cfg: WindConfig, cm: CurrentModels): WindNow => {
  const kmh = kmhOf(cfg.entities[cfg.speedIdx], cm.speed) ?? 0;
  const gustKmh = cfg.gustIdx === null ? null : kmhOf(cfg.entities[cfg.gustIdx], cm.gust);
  const bearing = cm.dir && cm.dir.model.avail ? parseBearing(cm.dir.model.raw) : null;
  const dirText = bearing === null ? null : t(ctx.hass, DIR_KEYS[compassIndex(bearing)]);
  const chip =
    bearing === null ? null : `${dirText} ${fmtNumber(ctx.hass, Math.round(bearing), 0)}°`;
  return { kmh, gustKmh, bearing, dirText, chip };
};

const leadOf = (cfg: WindConfig, kind: RowKind) => {
  const size = kind === "hero" ? DEFAULTS.heroLead : DEFAULTS.tileLead;
  return cfg.lead === "arrow" ? arrowLead(size) : animatedLead(cfg.flow.style, size);
};

export const updateCurrent = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: WindConfig,
  cm: CurrentModels,
  kind: RowKind,
) => {
  if (!row.querySelector(".top")) buildRow(row, kind, leadOf(cfg, kind));
  const ent = cfg.entities[cfg.speedIdx];
  const now = windNow(ctx, cfg, cm);
  const px = pxps(now.kmh);
  setAngles(row, now.bearing);
  // the lead's cycle as built; later speeds scale its playback rate
  if (row.dataset.px === undefined) {
    row.style.setProperty("--ldur", `${leadDuration(px).toFixed(3)}s`);
    row.dataset.px = String(px);
  }
  const lead = row.querySelector<HTMLElement>(".lead");
  if (lead) setRate(lead, px / Number(row.dataset.px));
  row.classList.toggle("nodir", now.bearing === null);

  const primary = row.querySelector<HTMLElement>(".primary");
  if (primary) primary.textContent = nameOf(ctx, ent, cm.speed.st);
  const sec = tplOf(ctx, ent.secondary);
  const label = cm.speed.look.label;
  const parts: { text: string; accent?: boolean }[] = [];
  if (sec) parts.push({ text: sec });
  else if (kind === "tile") {
    parts.push({ text: cm.speed.fmt.text });
    if (now.dirText) parts.push({ text: now.dirText });
  } else {
    if (label) parts.push({ text: label, accent: cm.speed.model.avail });
    if (kind === "hero" && now.dirText)
      parts.push({ text: t(ctx.hass, "wind.from", { dir: now.dirText }) });
    if (cm.gust && cm.gust.model.avail)
      parts.push({ text: t(ctx.hass, "wind.gusts", { v: cm.gust.fmt.text }) });
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
        : [{ text: cm.speed.fmt.text }, ...(now.dirText ? [{ text: now.dirText }] : [])],
    );
  setBig(row.querySelector<HTMLElement>(".big"), cm.speed);
  if (kind === "tile") {
    const end = row.querySelector<HTMLElement>(".end");
    let pill = end?.querySelector<HTMLElement>(".pill") ?? null;
    if (label && end) {
      if (!pill) pill = end.appendChild(pillEl(""));
      pill.textContent = label;
    } else pill?.remove();
  }
};
