// The schedule kind: a schedule helper (On while a block of its week runs). When it changes next
// as the secondary ("until 22:30 · 21 °C", "next Fri 06:00 · 20 min", the block's data as `data`
// names it), how soon on a poster's corner, and the week's lane below the texts: today from
// midnight to midnight, the next 24 hours from now, or a ribbon along the card's bottom edge. Its
// week is read once per page (schedule/feed.ts); the cards read it, the schedule card edits it.
import { cssColor, stateColorCss } from "../color.ts";
import { tplOf } from "../entity/model.ts";
import { secondaryEl } from "../entity/render/lead.ts";
import { t } from "../i18n.ts";
import { normalizeData } from "../schedule/data.ts";
import { aheadAxisHtml, dayAxisHtml, laneHtml } from "../schedule/lane.ts";
import {
  aheadWindow,
  currentBlock,
  DAY_MIN,
  dayWindow,
  nextChange,
  weekPos,
  type Placed,
  type Week,
} from "../schedule/model.ts";
import {
  blockText,
  changeText,
  dataText,
  dayNames,
  scheduleZone,
  soonText,
} from "../schedule/text.ts";
import { escapeHtml } from "../util.ts";
import { div, partOf } from "./dom.ts";
import type { Kind, KindCtx } from "./types.ts";

// the colour the card writes (its look is the inactive grey while the schedule is off), else Home
// Assistant's for a schedule that is on
export const onColor = (c: KindCtx) =>
  cssColor(tplOf(c.ctx, c.ent.color)) ?? stateColorCss(c.m.st, "on") ?? "var(--primary-color)";

// the window of a visual: its variant
type Window = "day" | "ahead" | "edge";
const windowOf = (c: KindCtx): Window => {
  const v = c.place.visual;
  return v && v.type === "schedule" && (v.variant === "ahead" || v.variant === "edge")
    ? v.variant
    : "day";
};
const specsOf = (c: KindCtx) => {
  try {
    return normalizeData(c.opts.data, `${c.card}-card-pro`);
  } catch {
    return [];
  }
};

// the blocks the lane shows, in minutes from its start, and where now is on it
const placedOf = (week: Week, c: KindCtx, w: Window): { placed: Placed[]; now: number | null } => {
  const pos = weekPos(c.ctx.now, scheduleZone(c.ctx.hass));
  if (w === "ahead") return { placed: aheadWindow(week, pos), now: null };
  return { placed: dayWindow(week, pos.day), now: pos.min };
};

// the next change, and the block whose data goes with it (the one that runs, else the next)
const changeOf = (c: KindCtx, week: Week) => {
  const pos = weekPos(c.ctx.now, scheduleZone(c.ctx.hass));
  const ch = nextChange(week, pos);
  const cur = currentBlock(week, pos);
  const next = ch && !ch.on ? week[ch.day].find((b) => b.from === ch.min) : null;
  return { pos, ch, block: cur ?? next ?? null };
};

// the lane below the texts (or along the edge), its axis and its tooltip
const laneEl = (c: KindCtx, week: Week | null | undefined) => {
  const w = windowOf(c);
  const el = div(`psched sbox${w === "edge" ? " edge" : ""}`);
  // the blocks in the schedule's colour while on, also while it is off now (the card's colour
  // where it names one)
  el.style.setProperty("--fe-color", onColor(c));
  const hass = c.ctx.hass;
  let blocks = "";
  if (week) {
    const { placed, now } = placedOf(week, c, w);
    const cur = now === null ? null : placed.find((p) => p.from <= now && now < p.to);
    blocks = laneHtml(
      placed.map((p) => ({ from: p.from, to: p.to, cur: p === cur })),
      w === "edge" ? null : now,
      w !== "edge",
    );
  } else if (week === undefined && w !== "edge")
    blocks = `<span class="sph">${escapeHtml(t(hass, "common.loading"))}</span>`;
  const axis =
    w === "edge"
      ? ""
      : `<div class="saxis">${w === "ahead" ? aheadAxisHtml(hass) : dayAxisHtml(hass)}</div>`;
  el.innerHTML = `<div class="slane">${blocks}</div>${axis}<div class="tip"></div>`;
  if (week)
    c.host.hover(
      el,
      (ev) => {
        const r = el.getBoundingClientRect();
        return Math.max(0, Math.min(DAY_MIN, ((ev.clientX - r.left) / (r.width || 1)) * DAY_MIN));
      },
      (t) => showTip(c, el, week, t),
    );
  return el;
};

// the block under minute `m` of the lane in its tooltip ("Fri 17:00 – 22:30 · 21 °C" ahead)
const showTip = (c: KindCtx, el: HTMLElement, week: Week, m: number): boolean => {
  const w = windowOf(c);
  const tip = el.querySelector<HTMLElement>(":scope > .tip");
  if (!tip) return false;
  const { placed } = placedOf(week, c, w);
  const p = placed.find((x) => x.from <= m && m < x.to);
  if (!p) return false;
  const today = weekPos(c.ctx.now, scheduleZone(c.ctx.hass)).day;
  const day = w === "ahead" && p.day !== today ? dayNames(c.ctx.hass, "short")[p.day] : null;
  tip.textContent = blockText(c.ctx.hass, p.block, specsOf(c), day);
  tip.classList.add("on");
  const W = el.clientWidth,
    tw = tip.offsetWidth;
  const x = ((p.from + p.to) / 2 / DAY_MIN) * W;
  tip.style.left = `${Math.round(Math.max(0, Math.min(W - tw, x - tw / 2)))}px`;
  return true;
};

export const SCHEDULE: Kind = {
  name: "schedule",
  domains: ["schedule"],
  reads: ["schedule"],
  readsText: "a schedule helper",
  fills: ["secondary"],
  keys: ["data"],
  timed: true,
  visual: { type: "schedule" },
  draws: ["schedule"],
  // `data` as written: checked with the card's config (the kind reads it on every render)
  main: (_entity, _raw, opts) => {
    normalizeData(opts.data, "schedule kind");
    return {};
  },
  // how soon it changes, on a poster's corner (a tile's line says when)
  status: (c) => {
    const week = c.host.schedule();
    if (c.card !== "poster" || !week || c.m.st?.state === "unavailable") return null;
    const { ch } = changeOf(c, week);
    return ch ? soonText(c.ctx.hass, ch) : null;
  },
  slots: (c) => {
    const week = c.host.schedule();
    const st = c.m.st;
    let secondary: HTMLElement | null = null;
    if (week && st && st.state !== "unavailable") {
      const { pos, ch, block } = changeOf(c, week);
      const parts = [
        ch ? changeText(c.ctx.hass, ch, pos.day) : "",
        block ? dataText(c.ctx.hass, block, specsOf(c)) : "",
      ].filter(Boolean);
      if (parts.length) secondary = secondaryEl(parts.map((text) => ({ text })));
    }
    return { secondary, picture: laneEl(c, week) };
  },
  // a tooltip shown before the card drew itself again stays
  live: (c, row) => {
    const el = partOf(row, ".psched");
    const week = c.host.schedule();
    if (el && week && c.host.hoverT !== null && !showTip(c, el, week, c.host.hoverT))
      el.querySelector(".tip")?.classList.remove("on");
  },
  // the week (its identity: a new answer is a new week) and the minute
  extra: (c) => [c.host.schedule(), Math.floor(c.ctx.now / 60e3)],
};
