// Block visuals below the name line: bar, gauge and the plot skeleton for history visuals.
import type { EntityItem } from "../config.ts";
import { HISTORY_VISUALS, PLOT_H, STRIP_AXIS_CSS, type HistoryVisual } from "../constants.ts";
import { numberFormat } from "../../format.ts";
import { scaleOf } from "../look.ts";
import { langOf, type EntityModel, type RenderCtx } from "../model.ts";
import type { PlotCtx, PlotElement } from "./plots.ts";

export const barEl = (m: EntityModel) => {
  const d = document.createElement("div");
  d.className = "bar";
  d.innerHTML = "<i></i>";
  (d.firstChild as HTMLElement).style.width =
    m.progress === null ? "0%" : `${(m.progress * 100).toFixed(1)}%`;
  return d;
};
export const gaugeEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel) => {
  const d = document.createElement("div");
  d.className = "gauge";
  const len = Math.PI * 46,
    p = m.progress;
  const sc = scaleOf(ent, m.st);
  const fmt = (v: number) => numberFormat(langOf(ctx), { maximumFractionDigits: 1 }).format(v);
  d.innerHTML = `<svg viewBox="0 0 120 80">
      <path class="track" d="M14 62 A46 46 0 0 1 106 62" stroke-width="9"/>
      ${p === null ? "" : `<path class="prog" d="M14 62 A46 46 0 0 1 106 62" stroke-width="9" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${(len * (1 - p)).toFixed(1)}"/>`}
      <text class="val" x="60" y="60" text-anchor="middle"></text>
      <text class="sub" x="14" y="78" text-anchor="middle"></text>
      <text class="sub" x="106" y="78" text-anchor="middle"></text>
    </svg>`;
  const ts = d.querySelectorAll("text");
  ts[0].textContent = m.fmt.text;
  ts[1].textContent = fmt(sc.min);
  ts[2].textContent = fmt(sc.max);
  return d;
};
// the visuals whose plot grows into a taller card
export const GROW_VISUALS: ReadonlySet<string> = new Set(["sparkline", "columns"]);
// how many rows of a group hold a growing plot, the share of a taller card the group asks for:
// each list or hero row with one, each grid row (of `columns` cells) with one at least
export const plotRows = (layout: string, columns: number, visuals: string[]) => {
  if (layout === "list" || layout === "hero")
    return visuals.filter((v) => GROW_VISUALS.has(v)).length;
  if (layout !== "grid") return 0;
  let n = 0;
  for (let i = 0; i < visuals.length; i += columns)
    if (visuals.slice(i, i + columns).some((v) => GROW_VISUALS.has(v))) n++;
  return n;
};
// the plot element carries its render context (entity index, kind, height); ctx.plotHandlers
// holds the card's bound pointer handlers. `extra` overrides the kind and the window / series
// (see PlotCtx) for plots that are not the entity's history.
export const plotEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  extra: Partial<PlotCtx> = {},
) => {
  const kind = extra.kind ?? (ent.visual as HistoryVisual);
  const plot = document.createElement("div") as PlotElement;
  // sparkline and columns grow into a taller card; a strip is a timeline and keeps its height
  // (styles: STYLE_PLOT)
  plot.className = GROW_VISUALS.has(kind) ? "plot grow" : "plot";
  plot.style.height =
    kind === "strip" ? `calc(${PLOT_H.strip}px + ${STRIP_AXIS_CSS})` : `${PLOT_H[kind]}px`;
  plot.innerHTML = `<svg class="abs" preserveAspectRatio="none"></svg><div class="labels"></div><div class="tip"></div>`;
  plot._ctx = { ...extra, ent, idx, kind, st: m.st };
  const hs = ctx.plotHandlers;
  plot.addEventListener("pointermove", hs.move);
  plot.addEventListener("pointerdown", hs.move);
  plot.addEventListener("pointerup", hs.up);
  plot.addEventListener("pointerleave", hs.leave);
  return plot;
};
export const blockEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
): HTMLElement | null => {
  if (ent.visual === "bar") return barEl(m);
  if (ent.visual === "gauge") return gaugeEl(ctx, ent, m);
  if (HISTORY_VISUALS.has(ent.visual)) return plotEl(ctx, ent, idx, m);
  return null;
};
