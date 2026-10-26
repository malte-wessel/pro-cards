// The header badges (header_entities, the heading card's badges): one row each, holding the icon
// (a ring around it, or a dot or a sparkline in its place), the name, the value and what the visual
// adds beside it (a bar, the trend, a switch). The row itself is the pill of its style and size; a
// plain badge has none and draws as the header always drew its items.
import { clampedSeries, lineBuckets, lineMeans, smoothPath, trendOf } from "../../history.ts";
import {
  durationSeconds,
  fmtDuration,
  fmtNumber,
  fmtPowerAuto,
  fmtRelative,
} from "../../format.ts";
import { decimalsOf } from "../../util.ts";
import type { EntityItem } from "../config.ts";
import { placementsOf } from "../control.ts";
import { nameOf, unitOf, type EntityModel, type RenderCtx } from "../model.ts";
import { appendControls } from "./controls.ts";
import { headerBadgeEl, iconOrPictureEl, ringSvg } from "./lead.ts";

// the sparkline in the icon's place, in viewBox units (CSS sizes it with the badge)
const SPARK_W = 34;
const SPARK_H = 16;
// a ring around the icon fits the badge's height with a little room
const RING_PX = { s: 20, m: 24, l: 28 } as const;

const span = (cls: string, text?: string) => {
  const s = document.createElement("span");
  s.className = cls;
  if (text !== undefined) s.textContent = text;
  return s;
};
const icon = (name: string) => {
  const el = document.createElement("ha-icon");
  el.setAttribute("icon", name);
  return el;
};

// how long the entity has not reported, in ms, once that is longer than `stale_after` (else null)
export const staleAge = (ctx: RenderCtx, ent: EntityItem, m: EntityModel): number | null => {
  if (ent.staleMin === null || !m.st || !m.model.avail) return null;
  const age = ctx.now - new Date(m.st.last_updated).getTime();
  return age > ent.staleMin * 60e3 ? age : null;
};

// the value as `format` writes it; the entity's own formatting where the format does not apply
// (a power format on a value without a power unit, a date that does not parse)
export const badgeText = (ctx: RenderCtx, ent: EntityItem, m: EntityModel): string => {
  const { model } = m;
  if (!model.avail || ent.format === "auto") return m.fmt.text;
  const wrap = (s: string) => `${ent.prefix}${s}${ent.suffix}`;
  if (ent.format === "relative") {
    const t = new Date(model.raw ?? "").getTime();
    return Number.isNaN(t) ? m.fmt.text : wrap(fmtRelative(ctx.hass, t, ctx.now));
  }
  if (model.num === null) return m.fmt.text;
  const unit = unitOf(ent, m.st);
  if (ent.format === "power") {
    const s = fmtPowerAuto(ctx.hass, model.num, unit, ent.decimals);
    return s === null ? m.fmt.text : wrap(s);
  }
  const sec = durationSeconds(model.num, unit);
  return sec === null ? m.fmt.text : wrap(fmtDuration(ctx.hass, sec));
};

// the history of the card's window as a line, scaled to its own range; empty until it arrived
const sparkEl = (ctx: RenderCtx, ent: EntityItem) => {
  const el = span("bspark");
  const series = ent.entity ? ctx.series.get(ent.entity) : undefined;
  let d = "";
  if (series) {
    const { t0, now } = ctx;
    const pts = clampedSeries(
      series.filter((p) => p.v !== null),
      t0,
      now,
    );
    // a few points more than its width alone allows: two would draw a straight line
    const nb = lineBuckets(now - t0, ctx.cfg.smoothMin, SPARK_W * 3);
    const sampled = lineMeans(pts, t0, now, nb);
    if (sampled.length >= 2) {
      let lo = Infinity,
        hi = -Infinity;
      for (const p of sampled) {
        lo = Math.min(lo, p.v);
        hi = Math.max(hi, p.v);
      }
      if (hi === lo) {
        hi += 1;
        lo -= 1;
      }
      const xy = sampled.map((p) => [
        +(((p.t - t0) / (now - t0)) * SPARK_W).toFixed(1),
        +(1.5 + (SPARK_H - 3) * (1 - (p.v - lo) / (hi - lo))).toFixed(1),
      ]);
      d = smoothPath(xy);
    }
  }
  el.innerHTML = `<svg viewBox="0 0 ${SPARK_W} ${SPARK_H}" preserveAspectRatio="none"><path d="${d}"/></svg>`;
  return el;
};

// the change over trend_hours (at most the card's window): an arrow and the difference
const trendEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel) => {
  const series = ent.entity ? ctx.series.get(ent.entity) : undefined;
  const hours = Math.min(ent.trendHours, ctx.cfg.hours);
  const d = trendOf(series, ctx.now, hours, m.model.num);
  if (d === null) return null;
  const dec = ent.decimals ?? Math.min(2, decimalsOf(m.st?.state));
  const r = Number(d.toFixed(dec));
  const dir = r > 0 ? "up" : r < 0 ? "down" : "flat";
  const el = span(`btr ${dir}`);
  el.appendChild(
    icon(
      dir === "up"
        ? "mdi:trending-up"
        : dir === "down"
          ? "mdi:trending-down"
          : "mdi:trending-neutral",
    ),
  );
  el.appendChild(span("", fmtNumber(ctx.hass, Math.abs(r), dec)));
  return el;
};

// what stands in the icon's place
const leadOf = (ctx: RenderCtx, ent: EntityItem, m: EntityModel): HTMLElement | null => {
  switch (ent.visual) {
    case "dot":
      return span("bdot");
    case "sparkline":
      return sparkEl(ctx, ent);
    case "ring": {
      const el = span("bring");
      el.innerHTML = ringSvg(RING_PX[ent.badge.size], m.progress, 2.5);
      if (ent.item.showIcon) el.appendChild(iconOrPictureEl(ctx, m.look, m.st));
      return el;
    }
    default:
      return ent.item.showIcon ? iconOrPictureEl(ctx, m.look, m.st) : null;
  }
};

export const fillBadge = (
  ctx: RenderCtx,
  el: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  el.replaceChildren();
  const { item } = ent;
  const name = nameOf(ctx, ent, m.st);
  el.title = m.look.label ? `${name} · ${m.look.label}` : name;
  for (const c of [...el.classList]) if (c.startsWith("b-")) el.classList.remove(c);
  // the old `visual: badge`: the soft pill inside the row, the name before it
  if (ent.visual === "badge") {
    el.classList.remove("pb", "pulse", "stale");
    if (item.showName) el.appendChild(span("secondary", name));
    const b = headerBadgeEl(ctx, ent, m);
    if (b) el.appendChild(b);
    return;
  }
  const style = m.look.style ?? ent.badge.style;
  const age = staleAge(ctx, ent, m);
  el.classList.add(`b-${style}`, `b-${ent.badge.size}`);
  el.classList.toggle("pb", style !== "plain");
  el.classList.toggle("pulse", !!m.look.pulse);
  el.classList.toggle("stale", age !== null);
  const lead = leadOf(ctx, ent, m);
  if (lead) el.appendChild(lead);
  if (item.showName) el.appendChild(span("secondary", name));
  if (ent.visual === "bar") {
    const bar = span("bbar");
    const fill = document.createElement("i");
    fill.style.width = m.progress === null ? "0%" : `${(m.progress * 100).toFixed(1)}%`;
    bar.appendChild(fill);
    el.appendChild(bar);
  }
  if (item.showValue) {
    // a rule's label stands in for the value, in the rule's colour
    const s = span("state");
    if (m.look.label) {
      s.classList.add("accent");
      s.textContent = m.look.label;
    } else {
      const text = badgeText(ctx, ent, m);
      s.textContent = age === null ? text : `${text} · ${fmtDuration(ctx.hass, age / 1000, true)}`;
    }
    el.appendChild(s);
  }
  if (ent.visual === "trend") {
    const tr = trendEl(ctx, ent, m);
    if (tr) el.appendChild(tr);
  }
  appendControls(ctx, ent, idx, m, ctx.ctl ? placementsOf(ent, "hval") : [], el);
};
