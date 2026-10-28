// The current wind: the tile (lead, name, "speed · direction", label pill), the flow tile (the
// band behind arrow, name, "label · gusts" and the big value), the hero lead (big value and
// "label · from SW · gusts") and the poster (label pill, big value, "from SW · gusts"). Built once per row; every render updates texts and CSS variables so
// the running animations keep their phase.
import type { EntityItem } from "../../shared/entity/config.ts";
import { tplOf, unitOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
import { COMPASS } from "../../shared/flow/constants.ts";
import {
  buildRow,
  builtLead,
  leadSize,
  fillFlowTexts,
  rowBuilt,
  setRate,
  type RowKind,
  type TextPart,
} from "../../shared/flow/dom.ts";
import { compassIndex, parseBearing, toKmh } from "../../shared/flow/maths.ts";
import { fmtNumber } from "../../shared/format.ts";
import { t, type StringKey } from "../../shared/i18n.ts";
import type { WindConfig } from "../config.ts";
import { leadDuration, pxps } from "../flow.ts";
import { setAngles } from "./flow.ts";
import { animatedLead, arrowLead } from "./lead.ts";

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
  const size = leadSize(kind);
  return cfg.lead === "arrow"
    ? arrowLead(size, cfg.entities[cfg.speedIdx].iconStyle)
    : animatedLead(cfg.flow.style, size);
};

export const updateCurrent = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: WindConfig,
  cm: CurrentModels,
  kind: RowKind,
  now: WindNow,
) => {
  if (!rowBuilt(row)) buildRow(row, kind, leadOf(cfg, kind));
  const ent = cfg.entities[cfg.speedIdx];
  const px = pxps(now.kmh);
  setAngles(row, now.bearing);
  const built = builtLead(row, "px", px, leadDuration(px));
  const lead = row.querySelector<HTMLElement>(".lead");
  if (lead) setRate(lead, px / built);
  row.classList.toggle("nodir", now.bearing === null);

  const sec = tplOf(ctx, ent.secondary);
  const label = cm.speed.look.label;
  const wide: TextPart[] = [];
  if (sec) wide.push({ text: sec });
  else if (kind === "tile") {
    wide.push({ text: cm.speed.fmt.text });
    if (now.dirText) wide.push({ text: now.dirText });
  } else {
    // a poster shows the label in its pill
    if (label && kind !== "poster") wide.push({ text: label, accent: cm.speed.model.avail });
    if (kind !== "flowtile" && now.dirText)
      wide.push({ text: t(ctx.hass, "wind.from", { dir: now.dirText }) });
    if (cm.gust && cm.gust.model.avail)
      wide.push({ text: t(ctx.hass, "wind.gusts", { v: cm.gust.fmt.text }) });
  }
  const narrow = sec
    ? [{ text: sec }]
    : [{ text: cm.speed.fmt.text }, ...(now.dirText ? [{ text: now.dirText }] : [])];
  fillFlowTexts(ctx, row, ent, cm.speed, kind, wide, narrow);
};
