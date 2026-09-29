// Block visuals below the name line: bar, gauge and the plot skeleton for history visuals.
import type { EntityItem } from "../config.ts";
import { HISTORY_VISUALS, PLOT_H, STRIP_AXIS_H, type HistoryVisual } from "../constants.ts";
import { scaleOf } from "../look.ts";
import { langOf, type EntityModel, type RenderCtx } from "../model.ts";
import type { PlotElement } from "./plots.ts";

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
  const fmt = (v: number) =>
    new Intl.NumberFormat(langOf(ctx), { maximumFractionDigits: 1 }).format(v);
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
// the plot element carries its render context (entity index, kind, height); ctx.plotHandlers
// holds the card's bound pointer handlers
export const plotEl = (ctx: RenderCtx, ent: EntityItem, idx: number, m: EntityModel) => {
  const kind = ent.visual as HistoryVisual;
  const plot = document.createElement("div") as PlotElement;
  plot.className = "plot";
  const h = PLOT_H[kind] + (kind === "strip" ? STRIP_AXIS_H : 0);
  plot.style.height = `${h}px`;
  plot.innerHTML = `<svg class="abs" preserveAspectRatio="none"></svg><div class="labels"></div><div class="tip"></div>`;
  plot._ctx = { ent, idx, kind, st: m.st, h };
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
