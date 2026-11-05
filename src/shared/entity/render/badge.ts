// The badges: one row each. The entity cards' (header_entities) hold the icon (a ring around it,
// or a dot or a sparkline in its place), the name, the value and what the visual adds beside it
// (a bar, the trend, a switch); a v3 card's (a pill, src/shared/kinds/badge.ts) its icon place,
// the name, the value, the visual after it and the switch. The row itself is the pill of its style and size; a
// plain badge's pill draws nothing, but keeps its height, padding and shape.
import { clampedSeries, lineBuckets, lineMeans, smoothPath, trendOf } from "../../history.ts";
import {
  durationSeconds,
  fmtDuration,
  fmtNumber,
  fmtPowerAuto,
  fmtRelative,
} from "../../format.ts";
import { decimalsOf, startOfDay } from "../../util.ts";
import type { EntityItem } from "../config.ts";
import { placementsOf } from "../control.ts";
import { staleAge } from "../look.ts";
import { nameOf, unitOf, type EntityModel, type RenderCtx } from "../model.ts";
import { appendControls } from "./controls.ts";
import { headerBadgeEl, iconOrPictureEl, ringSvg } from "./lead.ts";

// the sparkline in the icon's place, in viewBox units (CSS sizes it with the badge)
const SPARK_W = 34;
const SPARK_H = 16;
// a ring around the icon: in the pill's rounded end, 4, 5 or 6 px from its edge (the CSS --b-ring)
const RING_PX = { s: 16, m: 20, l: 24 } as const;

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

// the history from t0 as a line, scaled to its own range; empty until it arrived (the entity
// cards' badges draw the card's window, a v3 badge its own)
const sparkEl = (ctx: RenderCtx, ent: EntityItem, t0: number, smoothMin: number | null) => {
  const el = span("bspark");
  const series = ent.entity ? ctx.series.get(ent.entity) : undefined;
  let d = "";
  if (series) {
    const { now } = ctx;
    const pts = clampedSeries(
      series.filter((p) => p.v !== null),
      t0,
      now,
    );
    // a few points more than its width alone allows: two would draw a straight line
    const nb = lineBuckets(now - t0, smoothMin, SPARK_W * 3);
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

// the change over `hours` (the entity cards' trend_hours, at most the card's window; a v3 badge's
// own): an arrow and the difference
const trendEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel, hours: number) => {
  const series = ent.entity ? ctx.series.get(ent.entity) : undefined;
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

// a ring of the value around the icon
const ringEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel, withIcon: boolean) => {
  const el = span("bring");
  el.innerHTML = ringSvg(RING_PX[ent.badge.size], m.progress, ent.badge.size === "s" ? 1.75 : 2);
  if (withIcon) el.appendChild(iconOrPictureEl(ctx, m.look, m.st));
  return el;
};
// a short bar of the value
const barEl = (m: EntityModel) => {
  const bar = span("bbar");
  const fill = document.createElement("i");
  fill.style.width = m.progress === null ? "0%" : `${(m.progress * 100).toFixed(1)}%`;
  bar.appendChild(fill);
  return bar;
};
// the value; a rule's text stands in for it, in the rule's colour
const valueEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel, age: number | null) => {
  const s = span("state");
  if (m.look.label) {
    s.classList.add("accent");
    s.textContent = m.look.label;
  } else {
    const text = badgeText(ctx, ent, m);
    s.textContent = age === null ? text : `${text} · ${fmtDuration(ctx.hass, age / 1000, true)}`;
  }
  return s;
};
// the pill of its style and size (plain draws none, but keeps its shape: its hover layer is a pill
// too), pulsing and greyed as the look and the entity's last report say; how long ago it reported
const pillOf = (ctx: RenderCtx, el: HTMLElement, ent: EntityItem, m: EntityModel) => {
  const style = m.look.style ?? ent.badge.style;
  const age = m.model.avail ? staleAge(m.st, ent.staleMin, ctx.now) : null;
  el.classList.add(`b-${style}`, `b-${ent.badge.size}`);
  el.classList.add("pb");
  el.classList.toggle("pulse", !!m.look.pulse);
  el.classList.toggle("stale", age !== null);
  return age;
};
// the start of a v3 badge's window: its hours back, or midnight
const startOf = (now: number, hours: number | "today") =>
  hours === "today" ? startOfDay(now) : now - hours * 3600e3;

// a v3 card's badge: its icon place, the name, the value, the visual after it, the switch
const fillPill = (
  ctx: RenderCtx,
  el: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  const pill = ent.pill as NonNullable<EntityItem["pill"]>;
  const age = pillOf(ctx, el, ent, m);
  const icon = m.look.badgeIcon ?? pill.icon;
  if (icon.type === "dot") el.appendChild(span("bdot"));
  else if (icon.type !== "none")
    el.appendChild(icon.ring ? ringEl(ctx, ent, m, true) : iconOrPictureEl(ctx, m.look, m.st));
  if (ent.item.showName) el.appendChild(span("secondary", nameOf(ctx, ent, m.st)));
  if (ent.item.showValue) el.appendChild(valueEl(ctx, ent, m, age));
  if (ent.visual === "bar") el.appendChild(barEl(m));
  else if (ent.visual === "sparkline")
    el.appendChild(sparkEl(ctx, ent, startOf(ctx.now, pill.hours), null));
  else if (ent.visual === "trend") {
    const t0 = startOf(ctx.now, pill.hours);
    const tr = trendEl(ctx, ent, m, (ctx.now - t0) / 3600e3);
    if (tr) el.appendChild(tr);
  }
  appendControls(ctx, ent, idx, m, ctx.ctl ? placementsOf(ent, "hval") : [], el);
};

// what stands in the icon's place
const leadOf = (ctx: RenderCtx, ent: EntityItem, m: EntityModel): HTMLElement | null => {
  switch (ent.visual) {
    case "dot":
      return span("bdot");
    case "sparkline":
      return sparkEl(ctx, ent, ctx.t0, ctx.cfg.smoothMin);
    case "ring":
      return ringEl(ctx, ent, m, ent.item.showIcon);
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
  if (ent.pill) return fillPill(ctx, el, ent, idx, m);
  // the old `visual: badge`: the soft pill inside the row, the name before it
  if (ent.visual === "badge") {
    el.classList.remove("pb", "pulse", "stale");
    if (item.showName) el.appendChild(span("secondary", name));
    const b = headerBadgeEl(ctx, ent, m);
    if (b) el.appendChild(b);
    return;
  }
  const age = pillOf(ctx, el, ent, m);
  const lead = leadOf(ctx, ent, m);
  if (lead) el.appendChild(lead);
  if (item.showName) el.appendChild(span("secondary", name));
  if (ent.visual === "bar") el.appendChild(barEl(m));
  if (item.showValue) el.appendChild(valueEl(ctx, ent, m, age));
  if (ent.visual === "trend") {
    const tr = trendEl(ctx, ent, m, Math.min(ent.trendHours, ctx.cfg.hours));
    if (tr) el.appendChild(tr);
  }
  appendControls(ctx, ent, idx, m, ctx.ctl ? placementsOf(ent, "hval") : [], el);
};
