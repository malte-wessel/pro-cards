// The domain kinds that draw their device: a media player (its cover art behind the poster and its
// colour, the progress along the bottom), a cover (the window itself, its slats or panels at the
// position, dragged to move them) and the robots (a vacuum's or a lawn mower's path drawing itself
// while it works, the dock while it rests).
import type { EntityItem } from "../entity/config.ts";
import { PENDING_MS, serviceFor } from "../entity/control.ts";
import { numAttr as num, pictureOf } from "../entity/look.ts";
import { leadEl, secondaryEl } from "../entity/render/lead.ts";
import type { HassEntity } from "../ha.ts";
import { oneOf } from "../util.ts";
import { artColor } from "./art.ts";
import { div, pctValue, str, SVG, wordValue } from "./dom.ts";
import { place, stateText } from "./domains.ts";
import { attention } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

const artUrl = (c: KindCtx) => {
  const url = pictureOf(c.m.st);
  return url && c.ctx.hass?.hassUrl ? c.ctx.hass.hassUrl(url) : url;
};

// ----- media player -----

// the share of the track played now: from the position Home Assistant last reported and the time
// since, while it plays
const played = (st: HassEntity | undefined, now: number) => {
  const dur = num(st, "media_duration"),
    pos = num(st, "media_position");
  if (!dur || pos === null) return null;
  const at = str(st, "media_position_updated_at");
  const since = st?.state === "playing" && at ? (now - new Date(at).getTime()) / 1000 : 0;
  return { f: Math.min(1, Math.max(0, (pos + since) / dur)), left: Math.max(0, dur - pos - since) };
};

export const MEDIA: Kind = {
  name: "media_player",
  domains: ["media_player"],
  reads: ["media_player"],
  readsText: "a media player",
  keys: [],
  controls: [place("buttons", "end"), place("slider", "block")],
  image: (c) => pictureOf(c.m.st),
  // the art's own colour, once it has been read
  color: (c) => artColor(artUrl(c), c.host.redraw),
  status: (c) => c.m.look.label ?? stateText(c),
  slots: (c) => {
    const st = c.m.st,
      title = str(st, "media_title");
    const by = [str(st, "media_artist"), str(st, "media_album_name")].filter(
      (x): x is string => !!x,
    );
    const progress = played(st, c.ctx.now) ? div("pprog") : null;
    progress?.appendChild(document.createElement("i"));
    return {
      ...(title ? { value: wordValue(title), word: true } : {}),
      secondary: by.length ? secondaryEl(by.map((text) => ({ text }))) : null,
      picture: progress,
    };
  },
  // the bar runs on its own from where the track is to its end while it plays
  live: (c, row) => {
    const bar = row.querySelector<HTMLElement>(":scope > .pbody > .pprog > i");
    const p = played(c.m.st, c.ctx.now);
    if (!bar || !p) return;
    const st = c.m.st;
    const key = `${st?.state}|${num(st, "media_position")}|${str(st, "media_position_updated_at")}`;
    if (bar.dataset.key === key) return;
    bar.dataset.key = key;
    bar.style.animation = "none";
    bar.style.setProperty("--f0", String(p.f));
    const still =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (st?.state === "playing" && p.left > 0 && !still) {
      void bar.offsetWidth;
      bar.style.animation = `pprog ${p.left.toFixed(1)}s linear forwards`;
    }
  },
  extra: (c) => [
    str(c.m.st, "media_title"),
    str(c.m.st, "media_artist"),
    str(c.m.st, "media_album_name"),
    pictureOf(c.m.st),
  ],
};

// ----- cover -----

const COVER_STYLES = ["shutter", "blind", "curtain", "garage", "gate", "awning", "window"] as const;
type CoverStyle = (typeof COVER_STYLES)[number];
const BY_CLASS: Record<string, CoverStyle> = {
  shutter: "shutter",
  blind: "blind",
  shade: "blind",
  curtain: "curtain",
  garage: "garage",
  door: "garage",
  gate: "gate",
  awning: "awning",
  window: "window",
  damper: "window",
};
// `kind: { style }`, else the device class's drawing, else a window pane
const styleOf = (c: KindCtx): CoverStyle =>
  oneOf(COVER_STYLES, c.opts.style)
    ? c.opts.style
    : (BY_CLASS[String(c.m.st?.attributes?.device_class)] ?? "window");
// across: the drawing moves sideways (curtains and gates), else up and down
const across = (s: CoverStyle) => s === "curtain" || s === "gate";
// the position drawn: the one being dragged or sent (pending), else the entity's; a cover without
// a position is open or closed
const positionOf = (c: KindCtx): number | null => {
  const pending = c.ctx.ctl?.pending.get(0)?.value;
  if (typeof pending === "number") return pending;
  const p = num(c.m.st, "current_position");
  if (p !== null) return p;
  const s = c.m.st?.state;
  return s === "open" || s === "opening" ? 100 : s === "closed" || s === "closing" ? 0 : null;
};
const coverEl = (style: CoverStyle) => {
  const el = div(`pcov ${style}`);
  if (style === "curtain") el.append(div("half l"), div("half r"));
  else if (style === "window") el.append(div("pane"));
  else el.append(div("sheet"));
  return el;
};

// the drag on the drawing's edge: the position follows the pointer and is sent on release
interface Drag {
  c: KindCtx;
  value: number | null;
}
const drags = new WeakMap<HTMLElement, Drag>();
const dragValue = (el: HTMLElement, ev: PointerEvent, style: CoverStyle) => {
  const box = (el.parentElement ?? el).getBoundingClientRect();
  const f = across(style)
    ? (ev.clientX - box.left) / Math.max(1, box.width)
    : (ev.clientY - box.top) / Math.max(1, box.height);
  // a curtain's edge sits at half its closed share; the rest close from the top or the left
  const closed = style === "curtain" ? 2 * f : style === "awning" ? 1 - f / 0.6 : f;
  return Math.round(Math.min(100, Math.max(0, 100 - closed * 100)));
};
const handleEl = (style: CoverStyle) => {
  const el = div(`pcovdrag ${across(style) ? "x" : "y"}`);
  el.setAttribute("aria-hidden", "true");
  el.addEventListener("pointerdown", (ev) => {
    const d = drags.get(el);
    const ctl = d?.c.ctx.ctl;
    if (!d || !ctl) return;
    ev.stopPropagation();
    el.setPointerCapture(ev.pointerId);
    ctl.beginDrag(0);
    d.value = dragValue(el, ev, style);
    el.classList.add("dragging");
  });
  el.addEventListener("pointermove", (ev) => {
    const d = drags.get(el);
    if (!d || d.value === null) return;
    d.value = dragValue(el, ev, style);
    // the drawing follows the finger at once
    el.closest(".body")
      ?.querySelector<HTMLElement>(":scope > .pback")
      ?.style.setProperty("--p", String(d.value));
    el.style.setProperty("--p", String(d.value));
  });
  const end = () => {
    const d = drags.get(el);
    const ctl = d?.c.ctx.ctl;
    el.classList.remove("dragging");
    if (!d || !ctl || d.value === null) return;
    const value = d.value;
    d.value = null;
    const ent: EntityItem = d.c.ent;
    ctl.call(el, 0, ent, serviceFor(ent, d.c.m.st, { type: "value", value }), {
      until: Date.now() + PENDING_MS,
      value,
    });
    ctl.endDrag(0);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("click", (ev) => ev.stopPropagation());
  return el;
};

export const COVER: Kind = {
  name: "cover",
  domains: ["cover"],
  reads: ["cover"],
  readsText: "a cover",
  keys: ["style"],
  controls: [place("buttons", "end")],
  status: (c) => c.m.look.label ?? stateText(c),
  slots: (c) => {
    const p = num(c.m.st, "current_position");
    return p === null ? {} : { value: pctValue(c.ctx.hass, p), word: false };
  },
  backdrop: {
    key: (c) => styleOf(c),
    build: (c) => coverEl(styleOf(c)),
    update: (el, c) => {
      const st = c.m.st;
      const p = positionOf(c);
      // the pback holds the variables, so the drag's preview and the drawing read the same
      const back = el.parentElement ?? el;
      back.style.setProperty("--p", String(p ?? 0));
      back.style.setProperty("--tilt", String(num(st, "current_tilt_position") ?? 50));
      el.classList.toggle("unknown", p === null);
    },
  },
  handle: {
    // only a cover that reports a position is dragged
    key: (c) =>
      num(c.m.st, "current_position") !== null && c.ctx.ctl && c.m.model.avail
        ? `drag ${styleOf(c)}`
        : "",
    build: (c) => handleEl(styleOf(c)),
    update: (el, c) => {
      const d = drags.get(el);
      if (d?.value !== null && d?.value !== undefined) return;
      drags.set(el, { c, value: null });
      el.style.setProperty("--p", String(positionOf(c) ?? 0));
    },
  },
  extra: (c) => [num(c.m.st, "current_tilt_position")],
};

// ----- vacuum and lawn mower -----

const WORKING = new Set(["cleaning", "mowing"]);
const robotSvg = () => {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 100 60");
  svg.setAttribute("preserveAspectRatio", "none");
  const d = "M6 52 H94 V42 H6 V32 H94 V22 H6 V12 H94";
  svg.innerHTML = `<defs><mask id="ptrail-m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="60"><path class="reveal" d="${d}" pathLength="100"/></mask></defs><path class="trail" d="${d}" mask="url(#ptrail-m)"/>`;
  return svg;
};
const robot = (name: string, domain: string, readsText: string): Kind => ({
  name,
  domains: [domain],
  reads: [domain],
  readsText,
  keys: [],
  controls: [place("buttons", "end")],
  rules: attention("error"),
  // its battery and the room it is in, where the integration reports them
  slots: (c) => {
    const st = c.m.st;
    const parts: { text: string }[] = [];
    const b = num(st, "battery_level");
    if (b !== null) parts.push({ text: pctValue(c.ctx.hass, b).text });
    const room = str(st, "current_room") ?? str(st, "room");
    if (room) parts.push({ text: room });
    const a = st?.attributes ?? {};
    if (!parts.length && !("battery_level" in a) && !("current_room" in a) && !("room" in a))
      return {};
    return { secondary: parts.length ? secondaryEl(parts) : null };
  },
  lead: {
    key: () => "robot",
    build: (c) => {
      const el = leadEl(c.ctx, c.ent, { ...c.m, look: { ...c.m.look, picture: null } }, 40);
      el.classList.add("probot");
      return el;
    },
    update: (el, c) => el.classList.toggle("working", WORKING.has(String(c.m.st?.state))),
  },
  backdrop: {
    key: () => domain,
    build: () => {
      const el = div(`ppath ${domain === "lawn_mower" ? "lawn" : "floor"}`);
      el.appendChild(robotSvg());
      const dock = document.createElement("ha-icon");
      dock.setAttribute(
        "icon",
        domain === "lawn_mower" ? "mdi:home-roof" : "mdi:home-lightning-bolt-outline",
      );
      dock.className = "pdock";
      el.appendChild(dock);
      return el;
    },
    update: (el, c) => {
      const s = String(c.m.st?.state);
      el.classList.toggle("working", WORKING.has(s));
      el.classList.toggle("docked", s === "docked");
    },
  },
});

export const VACUUM = robot("vacuum", "vacuum", "a vacuum");
export const LAWN_MOWER = robot("lawn_mower", "lawn_mower", "a lawn mower");
