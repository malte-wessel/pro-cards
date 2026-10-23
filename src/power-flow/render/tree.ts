// The tree's DOM: the tracks (one SVG path per link), the flow lanes (the particles of the active
// links), the nodes, their labels and the list rows. Built once from the config; the geometry is
// redone when the diagram's size, direction or style changes, and every render updates texts,
// colours, rings and the flow: a link whose load changed a little keeps its particles and only
// plays faster or slower (`setRate`), a link that switched on or off, or whose particle count
// moved by two, gets its lane rebuilt.
import { cssColor } from "../../shared/color.ts";
import type { EntityItem } from "../../shared/entity/config.ts";
import type { Look } from "../../shared/entity/look.ts";
import { nameOf, tplOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
import { iconEl, textEl } from "../../shared/entity/render/lead.ts";
import { el as iEl, setRate, vars } from "../../shared/flow/dom.ts";
import { fmtNumber, textWidth } from "../../shared/format.ts";
import { t } from "../../shared/i18n.ts";
import { measure, type TextCache } from "../../shared/typography.ts";
import { qs } from "../../shared/util.ts";
import { leavesOf, twoValued, type PowerFlowConfig } from "../config.ts";
import { COLORS, ICONS, type LabelLines } from "../constants.ts";
import {
  arrowLength,
  dashOf,
  duration,
  isActive,
  needsRebuild,
  particles,
  rateOf,
} from "../flow.ts";
import { placeLabels, type LabelSize } from "../labels.ts";
import {
  layoutTree,
  linesOf,
  ringWidth,
  type LabelBox,
  type LEdge,
  type LNode,
  type TreeLayout,
} from "../layout.ts";
import { edgeColor, fmtPower, sourceColor, type Flows, type PowerNow } from "../model.ts";
import { arcPath, ringArcs } from "../path.ts";

const SVG = "http://www.w3.org/2000/svg";

export interface TreeState {
  cfg: PowerFlowConfig;
  ctx: RenderCtx;
  models: EntityModel[];
  now: PowerNow;
  flows: Flows;
  layout: TreeLayout;
  homeLook: Look;
  split: ReadonlySet<string>; // the sources that show both their flows
}
interface LabelTexts {
  v: string; // the value
  // a second value line for a source that may run two ways (its out ↑), "" while it shows one:
  // the line is kept, so the tree's height follows the config, never the values
  v2?: string;
  n: string; // the name
  s: string; // the secondary line
}

const svgEl = (tag: string, attrs: Record<string, string | number> = {}) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

// ----- build -----

const RING_SEGMENTS = 5; // solar, battery, generator, low-carbon grid, grid

// the lead; a ring's stroke is `sw` (ringWidth)
const leadEl = (d: number, sw: number | null) => {
  const lead = document.createElement("div");
  lead.className = sw !== null ? "lead ring" : "lead";
  lead.style.setProperty("--lead", `${d}px`);
  if (sw !== null) {
    const r = d / 2 - sw / 2;
    const svg = svgEl("svg", { viewBox: `0 0 ${d} ${d}`, class: "ring" });
    svg.appendChild(
      svgEl("circle", { class: "track", cx: d / 2, cy: d / 2, r, "stroke-width": sw }),
    );
    for (let i = 0; i < RING_SEGMENTS; i++)
      svg.appendChild(svgEl("path", { class: "prog", "stroke-width": sw, d: "" }));
    lead.appendChild(svg);
  }
  const shape = document.createElement("div");
  shape.className = "shape";
  lead.appendChild(shape);
  return lead;
};

const nodeEl = (id: string, d: number, sw: number | null, row: HTMLElement | null) => {
  const el = row ?? document.createElement("div");
  el.classList.add("pnode");
  el.dataset.node = id;
  el.appendChild(leadEl(d, sw));
  return el;
};

const labelEl = (id: string, small: boolean) => {
  const el = document.createElement("div");
  el.className = small ? "plabel small" : "plabel";
  el.dataset.node = id;
  el.appendChild(textEl("state", ""));
  el.appendChild(textEl("v2", ""));
  el.appendChild(textEl("secondary name", ""));
  el.appendChild(textEl("secondary sec2", ""));
  return el;
};

// a list row's lead: its own circle (rowD), within the row's height
const rowEl = (id: string, d: number, row: HTMLElement | null) => {
  const el = row ?? document.createElement("div");
  el.classList.add("plist");
  el.dataset.node = id;
  el.appendChild(leadEl(d, null));
  const texts = document.createElement("div");
  texts.className = "texts";
  const line = document.createElement("div");
  line.className = "line";
  const name = textEl("primary", "");
  name.style.flex = "1";
  line.appendChild(name);
  line.appendChild(textEl("state", ""));
  texts.appendChild(line);
  texts.appendChild(textEl("secondary", ""));
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.appendChild(document.createElement("i"));
  texts.appendChild(bar);
  el.appendChild(texts);
  return el;
};

// the diagram: tracks, lanes, then a node (or a row) and a label per config node
export const buildTree = (
  cfg: PowerFlowConfig,
  rowOf: (idx: number, cls: string) => HTMLElement,
): HTMLElement => {
  const diag = document.createElement("div");
  diag.className = "pdiag";
  // everything drawn sits in one box, scaled down as a whole when a fixed card is too small
  const box = document.createElement("div");
  box.className = "pscale";
  diag.appendChild(box);
  const tracks = svgEl("svg", { class: "abs ptracks" });
  box.appendChild(tracks);
  const flow = document.createElement("div");
  flow.className = "pflow";
  box.appendChild(flow);
  const listRows = cfg.direction === "right" && cfg.consumerStyle === "list";
  cfg.sources.forEach((s, i) => {
    // a ring where there is something to show: the charge, the low-carbon share, the peak
    const ring =
      s.kind === "battery"
        ? s.socIdx !== null
        : s.kind === "grid"
          ? s.fossilIdx !== null
          : s.peak !== null;
    box.appendChild(nodeEl(`s${i}`, s.d, ring ? ringWidth(s.kind, s.d) : null, rowOf(s.idx, "")));
    box.appendChild(labelEl(`s${i}`, false));
  });
  box.appendChild(nodeEl("home", cfg.homeD, ringWidth("home", cfg.homeD), rowOf(cfg.homeIdx, "")));
  box.appendChild(labelEl("home", false));
  for (const c of cfg.consumers)
    if (c.kind === "group") {
      box.appendChild(nodeEl(c.id, c.d, null, null));
      box.appendChild(labelEl(c.id, false));
    }
  for (const leaf of leavesOf(cfg)) {
    const row = leaf.kind === "item" ? rowOf(leaf.idx, "") : null;
    if (listRows) box.appendChild(rowEl(leaf.id, leaf.rowD, row));
    else {
      const device = leaf.id.includes(".");
      box.appendChild(nodeEl(leaf.id, leaf.d, null, row));
      // a device's label is small; a consumer beside the rooms reads like a room
      box.appendChild(labelEl(leaf.id, device || !cfg.hasGroups));
    }
  }
  return diag;
};

// ----- update -----

const laneOf = (st: TreeState, e: LEdge, w: number, color: string) => {
  const a = st.cfg.animation;
  const lane = document.createElement("div");
  lane.className = w < 0 ? "lane back" : "lane";
  const n = particles(e.len, w, a);
  const dur = duration(e.len, w, a);
  vars(lane, { "--p": `path('${e.d}')`, "--pf-c": color, "--dur": `${dur.toFixed(3)}s` });
  lane.dataset.n = String(n);
  lane.dataset.w = String(Math.round(w));
  // the path and its length as built: a moved link changes its path in place (moveLane)
  lane.dataset.d = e.d;
  lane.dataset.len = String(e.len);
  const style = st.cfg.flowStyle;
  if (style === "lines") {
    const svg = svgEl("svg", { class: "abs", viewBox: `0 0 ${st.layout.w} ${st.layout.h}` });
    const per = 100 / n;
    const path = svgEl("path", { class: "sl", pathLength: 100, d: e.d });
    vars(path, {
      "--per": per.toFixed(2), // one dash period in path-length units; the offset runs it down
      "--dash": Math.min(dashOf(e.len), per * 0.55).toFixed(2),
      "animation-duration": `${(dur / n).toFixed(3)}s`,
    });
    svg.appendChild(path);
    lane.appendChild(svg);
  } else {
    for (let i = 0; i < n; i++) {
      const p0 = i / n;
      if (style === "dots") lane.appendChild(iEl("pt", { "--p0": p0.toFixed(3) }));
      else {
        const ar = iEl("fa", { "--p0": p0.toFixed(3) });
        ar.style.width = `${arrowLength(w, a)}px`;
        lane.appendChild(ar);
      }
    }
  }
  return lane;
};

// a lane whose link moved takes the new path in place: the dots (or the dashes of the lines)
// keep their phase and run on along it
const moveLane = (lane: HTMLElement, e: LEdge, w: number, h: number) => {
  lane.dataset.d = e.d;
  lane.style.setProperty("--p", `path('${e.d}')`);
  const svg = lane.querySelector("svg");
  if (svg) {
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.querySelector("path")?.setAttribute("d", e.d);
  }
};

const place = (el: HTMLElement, nd: LNode) => {
  el.style.left = `${nd.x}px`;
  el.style.top = `${nd.y}px`;
};

const sourceOf = (st: TreeState, nd: LNode) =>
  nd.column === "source" ? st.now.sources[Number(nd.id.slice(1))] : undefined;

const iconFor = (st: TreeState, nd: LNode, look: Look | null): string => {
  if (look?.icon) return look.icon;
  if (nd.kind === "solar") return ICONS.solar;
  if (nd.kind === "battery") return ICONS.battery;
  if (nd.kind === "grid") {
    if (!st.now.offline) return ICONS.grid;
    return sourceOf(st, nd)?.generator ? ICONS.generator : ICONS.gridOff;
  }
  if (nd.kind === "home") return ICONS.home;
  if (nd.kind === "other") return ICONS.other;
  if (nd.kind === "group") {
    const g = st.cfg.consumers.find((c) => c.id === nd.id);
    return (g && g.kind === "group" && g.icon) || ICONS.group;
  }
  return look?.fallbackIcon || ICONS.consumer;
};

// the colour of a node: an explicit colour or a rule wins, else the energy colour of its flow
const colorFor = (st: TreeState, nd: LNode, ent: EntityItem | null, look: Look | null): string => {
  if (ent && look && (ent.color || look.rule?.color)) return cssColor(look.color, COLORS.home);
  if (nd.kind === "home" || nd.kind === "group" || nd.kind === "other") return COLORS.home;
  if (nd.kind === "consumer")
    return (st.flows.leafW.get(nd.id) ?? 0) < 0 ? COLORS.solar : COLORS.home;
  const s = sourceOf(st, nd);
  return s ? sourceColor(s, st.now.offline, st.cfg.idleBelow) : COLORS.idle;
};

const fillShape = (st: TreeState, shape: HTMLElement, icon: string, m: EntityModel | null) => {
  if (shape.dataset.icon === icon && shape.dataset.st === (m?.st?.state ?? "")) return;
  shape.dataset.icon = icon;
  shape.dataset.st = m?.st?.state ?? "";
  const look: Look = {
    color: "",
    icon,
    fallbackIcon: icon,
    picture: null,
    label: null,
    tint: false,
    rule: null,
  };
  shape.replaceChildren(iconEl(st.ctx, look, m?.st));
};

const setRing = (lead: HTMLElement, nd: LNode, segs: { color: string; f: number }[]) => {
  const d = nd.d,
    r = d / 2 - ringWidth(nd.kind, d) / 2;
  const arcs = ringArcs(
    segs.map((s) => s.f),
    r,
  );
  const paths = lead.querySelectorAll<SVGPathElement>("path.prog");
  paths.forEach((p, i) => {
    const a = arcs[i];
    if (!a) {
      p.setAttribute("d", "");
      return;
    }
    p.setAttribute("d", arcPath(d / 2, d / 2, r, a.a0, a.a1));
    p.style.stroke = segs[a.i].color;
    p.style.strokeLinecap = arcs.length > 1 ? "butt" : "round";
  });
};

// value, name and secondary line of a node's label
const labelText = (
  st: TreeState,
  nd: LNode,
  ent: EntityItem | null,
  m: EntityModel | null,
): LabelTexts => {
  const { hass } = st.ctx,
    f = st.flows,
    u = st.cfg.units;
  const dec = ent?.decimals ?? null;
  const s = ent ? (tplOf(st.ctx, ent.secondary) ?? "") : "";
  if (nd.kind === "home") return { v: fmtPower(hass, f.H, u, dec), n: "", s };
  if (nd.kind === "group") {
    const g = st.cfg.consumers.find((c) => c.id === nd.id);
    return {
      v: fmtPower(hass, f.groupW.get(nd.id) ?? 0, u),
      n: g && g.kind === "group" ? g.name : "",
      s: "",
    };
  }
  if (nd.kind === "other")
    return { v: fmtPower(hass, f.leafW.get(nd.id) ?? 0, u), n: t(hass, "power.other"), s: "" };
  if (nd.kind === "consumer")
    return {
      v: m && m.model.avail ? fmtPower(hass, f.leafW.get(nd.id) ?? 0, u, dec) : "–",
      n: ent && m ? nameOf(st.ctx, ent, m.st) : "",
      s,
    };
  const src = sourceOf(st, nd);
  const name = ent && m ? nameOf(st.ctx, ent, m.st) : "";
  if (!src) return { v: "–", n: name, s };
  // both flows of a node that runs two ways at once, one over the other: into it ↓, out of it ↑
  const [into, out] =
    src.kind === "battery" ? [src.charge, src.discharge] : [src.export, src.import];
  const split = src.w !== null && st.split.has(nd.id);
  const cfgSrc = st.cfg.sources.find((c) => c.id === nd.id);
  const v =
    src.w === null
      ? "–"
      : split
        ? `${fmtPower(hass, into, u, dec)} ↓`
        : fmtPower(hass, src.w, u, dec);
  const v2 =
    cfgSrc && twoValued(cfgSrc) ? (split ? `${fmtPower(hass, out, u, dec)} ↑` : "") : undefined;
  if (src.kind === "battery" && src.soc !== null)
    return { v, v2, n: `${name} · ${fmtNumber(hass, Math.round(src.soc), 0)} %`, s };
  if (src.kind === "grid") {
    if (src.generator) return { v, v2, n: t(hass, "power.generator"), s };
    if (src.lowCarbon !== null && !st.now.offline)
      return {
        v,
        v2,
        n: `${name} · ${t(hass, "power.low_carbon", {
          pct: `${fmtNumber(hass, Math.round(src.lowCarbon * 100), 0)} %`,
        })}`,
        s,
      };
  }
  return { v, v2, n: name, s };
};

// the labels' lines as styled (`.plabel`), at the theme's text size
export const labelLines = (diag: HTMLElement, cache?: TextCache): LabelLines => ({
  value: measure(cache, diag, ["plabel", "state"], [14, 17, 500]),
  name: measure(cache, diag, ["plabel", "secondary"], [12, 15]),
  smallValue: measure(cache, diag, ["plabel small", "state"], [12, 15, 500]),
  smallName: measure(cache, diag, ["plabel small", "secondary"], [11, 13]),
});

// the label of every node, measured, from a preliminary layout (the texts need no geometry)
const measureLabels = (st: TreeState, labelEls: Map<string, HTMLElement>) => {
  const lines = linesOf(st.cfg);
  const texts = new Map<string, LabelTexts>();
  const sizes = new Map<string, LabelBox>();
  for (const nd of st.layout.nodes) {
    const el = labelEls.get(nd.id);
    if (!el) continue;
    const ent = nd.idx === null ? null : st.cfg.entities[nd.idx];
    const m = nd.idx === null ? null : (st.models[nd.idx] ?? null);
    const txt = labelText(st, nd, ent, m);
    texts.set(nd.id, txt);
    const small = el.classList.contains("small");
    const value = small ? lines.smallValue : lines.value,
      name = small ? lines.smallName : lines.name;
    const vw = Math.max(textWidth(txt.v, value.font), textWidth(txt.v2 ?? "", value.font)) + 2;
    const nw = Math.max(textWidth(txt.n, name.font), textWidth(txt.s, name.font)) + 2;
    const w = Math.max(vw, nw);
    const h =
      value.line + (txt.v2 !== undefined ? value.line : 0) + name.line + (txt.s ? name.line : 0);
    sizes.set(nd.id, { w, h, vw, nw });
  }
  return { texts, sizes };
};

export const updateTree = (diag: HTMLElement, prelim: TreeState) => {
  const labelEls = new Map<string, HTMLElement>();
  for (const el of diag.querySelectorAll<HTMLElement>(".plabel"))
    if (el.dataset.node) labelEls.set(el.dataset.node, el);
  // a consumer beside rooms reads like a room: whether rooms are shown decides its label's size
  for (const leaf of leavesOf(prelim.cfg))
    if (!leaf.id.includes("."))
      labelEls.get(leaf.id)?.classList.toggle("small", !prelim.cfg.hasGroups);
  // the labels' sizes decide where the columns go: lay out again with them
  const { texts, sizes } = measureLabels(prelim, labelEls);
  const st: TreeState = {
    ...prelim,
    layout: layoutTree(prelim.cfg, prelim.layout.w, prelim.flows.edges, sizes, prelim.layout.h),
  };
  const { cfg, layout, flows, models } = st;
  const tracks = qs<SVGSVGElement>(diag, "svg.ptracks");
  const flow = qs(diag, ".pflow");
  const nodeEls = new Map<string, HTMLElement>();
  for (const el of diag.querySelectorAll<HTMLElement>(".pnode, .plist"))
    if (el.dataset.node) nodeEls.set(el.dataset.node, el);
  diag.classList.toggle("idle-hidden", cfg.idleLinks === "hidden");
  diag.classList.toggle("idle-faint", cfg.idleLinks === "faint");
  // what the layout leaves out (a hidden node) is not drawn: its node, row and label
  const drawn = new Set([...layout.nodes.map((n) => n.id), ...layout.rows.map((r) => r.id)]);
  for (const [id, el] of nodeEls) el.hidden = !drawn.has(id);
  for (const [id, el] of labelEls) el.hidden = !drawn.has(id);

  // ----- geometry -----
  // on every render: where the columns and the links go follows the measured label widths, so a
  // value that changes its width may move them
  const viewBox = `0 0 ${layout.w} ${layout.h}`;
  if (tracks.getAttribute("viewBox") !== viewBox) tracks.setAttribute("viewBox", viewBox);
  diag.classList.toggle("narrow", layout.w < 380);
  for (const nd of layout.nodes) {
    const el = nodeEls.get(nd.id);
    if (el) place(el, nd);
  }
  for (const r of layout.rows) {
    const el = nodeEls.get(r.id);
    if (!el) continue;
    el.style.left = `${r.x}px`;
    el.style.top = `${r.y}px`;
    el.style.width = `${r.w}px`;
    el.style.height = `${r.h}px`;
  }

  // ----- links -----
  // a track and a lane per drawn link, kept by the link's id: a link that moved takes its new
  // path in place, so its dots keep running; the links of a hidden node go
  const drawnEdges = new Set(layout.edges.map((e) => e.id));
  const trackEls = new Map<string, SVGPathElement>();
  for (const p of tracks.querySelectorAll<SVGPathElement>("path.link")) {
    const id = p.dataset.edge ?? "";
    if (drawnEdges.has(id)) trackEls.set(id, p);
    else p.remove();
  }
  const laneEls = new Map<string, HTMLElement>();
  for (const l of flow.querySelectorAll<HTMLElement>(".lane")) {
    const id = l.dataset.edge ?? "";
    if (drawnEdges.has(id)) laneEls.set(id, l);
    else l.remove();
  }
  layout.edges.forEach((e) => {
    const w = flows.edges[e.fi]?.w ?? 0;
    const active = isActive(w, cfg.idleBelow);
    const color = edgeColor(e.kind, w);
    let track = trackEls.get(e.id);
    if (!track) {
      track = svgEl("path", { class: "link", d: e.d, "data-edge": e.id }) as SVGPathElement;
      tracks.appendChild(track);
    } else if (track.getAttribute("d") !== e.d) track.setAttribute("d", e.d);
    track.classList.toggle("active", active);
    track.style.setProperty("--pf-c", color);
    const lane = laneEls.get(e.id);
    if (!active) {
      lane?.remove();
      return;
    }
    const n = particles(e.len, w, cfg.animation);
    const wasBack = lane?.classList.contains("back") ?? false;
    if (!lane || needsRebuild(Number(lane.dataset.n), n) || wasBack !== w < 0) {
      const fresh = laneOf(st, e, w, color);
      fresh.dataset.edge = e.id;
      if (lane) lane.replaceWith(fresh);
      else flow.appendChild(fresh);
    } else {
      lane.style.setProperty("--pf-c", color);
      if (lane.dataset.d !== e.d) moveLane(lane, e, layout.w, layout.h);
      // the speed in px/s follows the load; a longer path takes as much longer
      const longer = e.len > 0 ? Number(lane.dataset.len) / e.len : 1;
      setRate(lane, rateOf(w, Number(lane.dataset.w), cfg.animation) * longer);
    }
  });

  // ----- nodes -----
  for (const nd of layout.nodes) {
    const el = nodeEls.get(nd.id);
    if (!el) continue;
    const ent = nd.idx === null ? null : cfg.entities[nd.idx];
    const m = nd.idx === null ? null : (models[nd.idx] ?? null);
    const look = nd.kind === "home" ? st.homeLook : (m?.look ?? null);
    const color = colorFor(st, nd, ent, look);
    el.style.setProperty("--fe-color", color);
    const lead = qs(el, ".lead");
    fillShape(st, qs(lead, ".shape"), iconFor(st, nd, look), m);
    if (nd.kind === "home") {
      const H = flows.H;
      setRing(
        lead,
        nd,
        H > 0
          ? [
              { color: COLORS.solar, f: flows.sH / H },
              { color: COLORS.battOut, f: flows.bH / H },
              { color: COLORS.generator, f: flows.gHGen / H },
              { color: COLORS.nonFossil, f: flows.gHClean / H },
              { color: COLORS.gridIn, f: (flows.gH - flows.gHClean - flows.gHGen) / H },
            ]
          : [],
      );
    } else if (lead.classList.contains("ring")) {
      const src = sourceOf(st, nd),
        cfgSrc = cfg.sources.find((s) => s.id === nd.id);
      const clamp = (f: number) => Math.max(0, Math.min(1, f));
      // battery: its charge; grid: the low-carbon share of its power; solar: its peak
      const seg =
        nd.kind === "battery" && src?.soc != null
          ? { color, f: clamp(src.soc / 100) }
          : nd.kind === "grid" && src?.lowCarbon != null && !st.now.offline
            ? { color: COLORS.nonFossil, f: clamp(src.lowCarbon) }
            : cfgSrc?.kind === "solar" && cfgSrc.peak !== null && src?.w != null
              ? { color: COLORS.solar, f: clamp(src.w / cfgSrc.peak) }
              : null;
      setRing(lead, nd, seg ? [seg] : []);
    }
  }

  // ----- rows -----
  const barMax = Math.max(
    flows.H,
    [...flows.leafW.values()].reduce((a, b) => a + Math.abs(b), 0),
    1,
  );
  for (const r of layout.rows) {
    const el = nodeEls.get(r.id);
    if (!el) continue;
    const ent = r.idx === null ? null : cfg.entities[r.idx];
    const m = r.idx === null ? null : (models[r.idx] ?? null);
    const w = flows.leafW.get(r.id) ?? 0;
    const nd: LNode = {
      id: r.id,
      kind: r.id === "other" ? "other" : "consumer",
      column: "leaf",
      idx: r.idx,
      x: 0,
      y: 0,
      d: 32,
    };
    el.style.setProperty("--fe-color", colorFor(st, nd, ent, m?.look ?? null));
    fillShape(st, qs(el, ".shape"), iconFor(st, nd, m?.look ?? null), m);
    const txt = labelText(st, nd, ent, m);
    qs(el, ".primary").textContent = txt.n;
    qs(el, ".state").textContent = txt.v;
    const sec = qs(el, ".secondary");
    sec.textContent = txt.s;
    sec.style.display = txt.s ? "" : "none";
    qs(el, ".bar i").style.width = `${((Math.abs(w) / barMax) * 100).toFixed(1)}%`;
  }

  // ----- labels -----
  // a name cut to its room (a tight row of consumers); the value is never cut
  const labelMax = new Map(layout.nodes.map((n) => [n.id, n.labelMax]));
  const labelSizes: LabelSize[] = [...sizes].map(([id, { w, h, vw = 0 }]) => {
    const max = labelMax.get(id);
    return { id, h, w: max === undefined ? w : Math.min(w, Math.max(max, vw)) };
  });
  for (const p of placeLabels(layout, labelSizes, cfg.direction)) {
    const el = labelEls.get(p.id);
    const txt = texts.get(p.id);
    if (!el || !txt) continue;
    const max = labelMax.get(p.id);
    el.classList.toggle("cut", max !== undefined);
    el.style.setProperty("--pl-max", max === undefined ? "" : `${Math.floor(max)}px`);
    qs(el, ".state").textContent = txt.v;
    // the second value line: kept while it shows one value, below the name, so the value stays
    // over the name and the label keeps its height
    const v2 = qs(el, ".v2");
    el.classList.toggle("two", txt.v2 !== undefined);
    v2.classList.toggle("blank", !txt.v2);
    v2.textContent = txt.v2 || "\u00a0";
    const name = qs(el, ".name");
    name.textContent = txt.n;
    name.style.display = txt.n ? "" : "none";
    const sec = qs(el, ".sec2");
    sec.textContent = txt.s;
    sec.style.display = txt.s ? "" : "none";
    el.classList.remove("l", "r", "c");
    el.classList.add(p.align);
    if (p.align === "r") {
      el.style.left = "auto";
      el.style.right = `${layout.w - p.x}px`;
    } else {
      el.style.right = "auto";
      el.style.left = `${p.x}px`;
    }
    el.style.top = `${p.y}px`;
  }
};
