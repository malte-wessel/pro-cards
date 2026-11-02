// The domain kinds that draw their device: a media player (its cover art in the icon and blurred
// behind the card, its colour, the progress along the bottom), a cover (the window itself, its
// slats or panels at the position, gliding while they move: `visual: cover`; a kind per look, the
// device class's by default) and the robots (a vacuum's or a lawn mower's path drawing itself while
// it works, the dock while it rests: `visual: path`).
import { numAttr as num, pictureOf } from "../entity/look.ts";
import { leadEl, secondaryEl } from "../entity/render/lead.ts";
import type { HassEntity } from "../ha.ts";
import { artColor, artPending } from "./art.ts";
import { div, partOf, pctValue, str, SVG, wordValue } from "./dom.ts";
import { place, stateText } from "./domains.ts";
import { IMAGE_BLUR } from "./places.ts";
import { attention } from "./rules.ts";
import type { Kind, KindCtx, KindHost } from "./types.ts";

const artUrl = (c: KindCtx) => {
  const url = pictureOf(c.m.st);
  return url && c.ctx.hass?.hassUrl ? c.ctx.hass.hassUrl(url) : url;
};

// ----- media player -----

// each poster's last cover colour: held while the next cover's is read, so the colour fades from
// the one song's to the next one's rather than through the default
const lastArt = new WeakMap<KindHost, string>();
const coverColor = (c: KindCtx) => {
  const url = artUrl(c);
  const color = artColor(url, c.host.redraw);
  if (color) lastArt.set(c.host, color);
  else if (!artPending(url)) lastArt.delete(c.host);
  return color ?? lastArt.get(c.host) ?? null;
};

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
  // the art in the icon, and blurred behind the card
  icon: { type: "image" },
  visual: { type: "image", blur: IMAGE_BLUR },
  // the art's own colour, once it has been read
  color: coverColor,
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
    const bar = partOf(row, ".pprog > i");
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

export const COVER_STYLES = [
  "shutter",
  "blind",
  "curtain",
  "garage",
  "gate",
  "awning",
  "window",
] as const;
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
// the device class's drawing, else a window pane
const classStyle = (c: KindCtx): CoverStyle =>
  BY_CLASS[String(c.m.st?.attributes?.device_class)] ?? "window";
// the position drawn: the entity's, where the cover really is (a cover on its way passes every
// position between); a cover without a position is open or closed
const moving = (c: KindCtx) => c.m.st?.state === "opening" || c.m.st?.state === "closing";
const positionOf = (c: KindCtx): number | null => {
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

// a cover kind: drawn as `look` (null: the device class's look), detected by the domain (the
// generic cover) or named (a garage door whose device class says nothing)
const coverKind = (name: string, look: CoverStyle | null): Kind => {
  const styleOf = (c: KindCtx) => look ?? classStyle(c);
  const drawn = (c: KindCtx) => c.place.visual && c.place.visual.type === "cover";
  return {
    name,
    ...(look ? {} : { domains: ["cover"] }),
    reads: ["cover"],
    readsText: "a cover",
    keys: [],
    controls: [place("buttons", "end")],
    visual: { type: "cover" },
    tileVisual: false,
    draws: ["cover"],
    status: (c) => c.m.look.label ?? stateText(c),
    slots: (c) => {
      const p = num(c.m.st, "current_position");
      return p === null ? {} : { value: pctValue(c.ctx.hass, p), word: false };
    },
    backdrop: {
      key: (c) => (drawn(c) ? styleOf(c) : ""),
      build: (c) => coverEl(styleOf(c)),
      update: (el, c) => {
        const st = c.m.st;
        const p = positionOf(c);
        // the variables sit on the pback, around the drawing
        const back = el.parentElement ?? el;
        back.style.setProperty("--p", String(p ?? 0));
        back.style.setProperty("--tilt", String(num(st, "current_tilt_position") ?? 50));
        el.classList.toggle("unknown", p === null);
        el.classList.toggle("moving", moving(c));
      },
    },
    extra: (c) => [num(c.m.st, "current_tilt_position")],
  };
};
export const COVER = coverKind("cover", null);
export const COVER_KINDS = Object.fromEntries(COVER_STYLES.map((s) => [s, coverKind(s, s)]));

// ----- vacuum and lawn mower -----

const WORKING = new Set(["cleaning", "mowing"]);
// the robot's route, drawn into the largest room the poster's parts leave free (placeRoute):
// lanes back and forth LANE px apart, joined by straight steps at their ends, as squares on a
// grid DOT px apart (the same x in every lane, one halfway down each step); the whole route faint, the
// part it has done revealed over it by a solid stroke along the route drawing itself in a mask
// (half of it while the robot rests)
const LANE = 12,
  DOT = 6;
const robotSvg = () => {
  const svg = document.createElementNS(SVG, "svg");
  svg.innerHTML = `<defs><mask id="proute" maskUnits="userSpaceOnUse"><path class="reveal" pathLength="100"/></mask></defs><path class="route"/><path class="done" mask="url(#proute)"/>`;
  return svg;
};
// the route through a box of w × h px: as many lanes as fit, from the top down, as wide as a whole
// number of squares allows (centred); `path` the line, `dots` its squares (each a square cap)
export const routeOf = (w: number, h: number) => {
  const pad = 2;
  const n = Math.max(1, Math.floor((h - 2 * pad) / LANE) + 1);
  // the squares' centres on whole pixels, so their 2 px land on whole pixels (sharp at 1x)
  const top = Math.floor(h / 2 - ((n - 1) * LANE) / 2);
  const steps = Math.max(1, Math.floor((w - 2 * pad) / DOT));
  const x0 = pad + Math.floor((w - 2 * pad - steps * DOT) / 2),
    x1 = x0 + steps * DOT;
  let path = `M${x0} ${top}`,
    dots = "";
  const dot = (x: number, y: number) => (dots += `${dots ? " " : ""}M${x} ${y}h0`);
  for (let i = 0; i < n; i++) {
    const y = top + i * LANE,
      end = i % 2 === 0 ? x1 : x0;
    for (let k = 0; k <= steps; k++) dot(x0 + k * DOT, y);
    path += ` H${end}`;
    if (i === n - 1) break;
    path += ` V${y + LANE}`;
    dot(end, y + LANE / 2);
  }
  return { path, dots };
};
type Box = { x0: number; y0: number; x1: number; y1: number };
const GAP = 12;
// the room the route leaves at the sides and the bottom of the free box
const INSET = 8;
// the largest room the poster's parts leave: above the name right of the icon (beside the
// corner's badges or under them), or beside the texts above the controls
const freeBox = (row: HTMLElement, back: DOMRect): Box | null => {
  const q = (sel: string) => row.querySelector<HTMLElement>(sel);
  const rect = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
  // a text's own extent, not its box's
  const ink = (el: Element | null) => {
    if (!el) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  };
  const inner = {
    x0: back.left + 16,
    y0: back.top + 16,
    x1: back.right - 16,
    y1: back.bottom - 16,
  };
  const lead = rect(q(":scope > .ptop > .plead")),
    name = rect(q(":scope > .pbody > .pname")),
    corner = rect(q(":scope > .ptop > .corner")),
    main = rect(q(":scope > .pbody > .pmain")),
    end = rect(q(":scope > .pbody > .pmain > .end"));
  const texts = [ink(q(":scope > .pbody > .pname")), ink(q(":scope > .pbody > .pmain > .ptext"))];
  const left = lead ? lead.right + GAP : inner.x0;
  const top = name ? name.top - GAP : inner.y1;
  const badges = corner && corner.width > 0 && corner.height > 0 ? corner : null;
  const boxes: Box[] = [];
  if (badges) {
    boxes.push({ x0: left, y0: inner.y0, x1: badges.left - GAP, y1: top });
    boxes.push({ x0: left, y0: badges.bottom + GAP, x1: inner.x1, y1: top });
  } else boxes.push({ x0: left, y0: inner.y0, x1: inner.x1, y1: top });
  const textRight = Math.max(...texts.map((t) => (t && t.width ? t.right : -Infinity)));
  if (Number.isFinite(textRight)) {
    const bottom = end && end.left > textRight ? end.top - GAP : (main?.bottom ?? inner.y1);
    boxes.push({
      x0: Math.max(textRight + 2 * GAP, left),
      y0: badges ? badges.bottom + GAP : inner.y0,
      x1: inner.x1,
      y1: bottom,
    });
  }
  let best: Box | null = null,
    area = 0;
  for (const room of boxes) {
    // the route keeps clear of the room's sides and bottom (its top is the card's padding)
    const b = { x0: room.x0 + INSET, y0: room.y0, x1: room.x1 - INSET, y1: room.y1 - INSET };
    const w = b.x1 - b.x0,
      h = b.y1 - b.y0;
    if (w < 48 || h < 16 || w * h <= area) continue;
    best = b;
    area = w * h;
  }
  return best;
};
// draws the route into the free room (only again when that room moved or changed size)
const placeRoute = (row: HTMLElement) => {
  const el = row.parentElement?.querySelector<HTMLElement>(":scope > .pback > .ppath");
  const svg = el?.querySelector<SVGSVGElement>(":scope > svg");
  if (!el || !svg) return;
  const back = el.getBoundingClientRect();
  const box = freeBox(row, back);
  const key = box
    ? [box.x0 - back.left, box.y0 - back.top, box.x1 - box.x0, box.y1 - box.y0]
        .map(Math.round)
        .join(",")
    : "";
  if (svg.dataset.key === key) return;
  svg.dataset.key = key;
  svg.toggleAttribute("hidden", !box);
  if (!box) return;
  const [x, y, w, h] = key.split(",").map(Number);
  Object.assign(svg.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const { path, dots } = routeOf(w, h);
  svg.querySelector(".reveal")?.setAttribute("d", path);
  for (const p of svg.querySelectorAll(":scope > path")) p.setAttribute("d", dots);
  const mask = svg.querySelector("mask");
  mask?.setAttribute("x", "-8");
  mask?.setAttribute("y", "-8");
  mask?.setAttribute("width", String(w + 16));
  mask?.setAttribute("height", String(h + 16));
};
const robot = (name: string, domain: string, readsText: string): Kind => ({
  name,
  domains: [domain],
  reads: [domain],
  readsText,
  keys: [],
  controls: [place("buttons", "end")],
  rules: attention("error"),
  // its route behind the card
  visual: { type: "path" },
  tileVisual: false,
  draws: ["path"],
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
      const el = leadEl(c.ctx, c.ent, { ...c.m, look: { ...c.m.look, picture: null } }, c.leadSize);
      el.classList.add("probot");
      return el;
    },
    update: (el, c) => el.classList.toggle("working", WORKING.has(String(c.m.st?.state))),
  },
  backdrop: {
    key: (c) => (c.place.visual && c.place.visual.type === "path" ? domain : ""),
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
  placed: (_c, row) => placeRoute(row),
});

export const VACUUM = robot("vacuum", "vacuum", "a vacuum");
export const LAWN_MOWER = robot("lawn_mower", "lawn_mower", "a lawn mower");
