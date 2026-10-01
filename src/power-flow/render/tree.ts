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
import { qs } from "../../shared/util.ts";
import { leavesOf, type PowerFlowConfig } from "../config.ts";
import {
  COLORS,
  FONT_NAME,
  FONT_SMALL,
  FONT_SMALL_NAME,
  FONT_VALUE,
  GEOM,
  ICONS,
} from "../constants.ts";
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
import { layoutTree, type LabelBox, type LEdge, type LNode, type TreeLayout } from "../layout.ts";
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
}
interface LabelTexts {
  v: string; // the value
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

const leadEl = (d: number, ring: boolean) => {
  const lead = document.createElement("div");
  lead.className = ring ? "lead ring" : "lead";
  lead.style.setProperty("--lead", `${d}px`);
  if (ring) {
    const sw = 3,
      r = d / 2 - sw / 2;
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

const nodeEl = (id: string, d: number, ring: boolean, row: HTMLElement | null) => {
  const el = row ?? document.createElement("div");
  el.classList.add("pnode");
  el.dataset.node = id;
  el.appendChild(leadEl(d, ring));
  return el;
};

const labelEl = (id: string, small: boolean) => {
  const el = document.createElement("div");
  el.className = small ? "plabel small" : "plabel";
  el.dataset.node = id;
  el.appendChild(textEl("state", ""));
  el.appendChild(textEl("secondary name", ""));
  el.appendChild(textEl("secondary sec2", ""));
  return el;
};

const rowEl = (id: string, row: HTMLElement | null) => {
  const el = row ?? document.createElement("div");
  el.classList.add("plist");
  el.dataset.node = id;
  el.appendChild(leadEl(32, false));
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
  const tracks = svgEl("svg", { class: "abs ptracks" });
  diag.appendChild(tracks);
  const flow = document.createElement("div");
  flow.className = "pflow";
  diag.appendChild(flow);
  const listRows = cfg.direction === "right" && cfg.consumerStyle === "list";
  cfg.sources.forEach((s, i) => {
    const d = s.kind === "solar" ? GEOM.dSolar : s.kind === "battery" ? GEOM.dBattery : GEOM.dGrid;
    diag.appendChild(
      nodeEl(`s${i}`, d, s.kind === "battery" && s.socIdx !== null, rowOf(s.idx, "")),
    );
    diag.appendChild(labelEl(`s${i}`, false));
  });
  diag.appendChild(nodeEl("home", GEOM.dHome, true, rowOf(cfg.homeIdx, "")));
  diag.appendChild(labelEl("home", false));
  for (const c of cfg.consumers)
    if (c.kind === "group") {
      diag.appendChild(nodeEl(c.id, GEOM.dGroup, false, null));
      diag.appendChild(labelEl(c.id, false));
    }
  for (const leaf of leavesOf(cfg)) {
    const row = leaf.kind === "item" ? rowOf(leaf.idx, "") : null;
    if (listRows) diag.appendChild(rowEl(leaf.id, row));
    else {
      const device = leaf.id.includes(".");
      diag.appendChild(nodeEl(leaf.id, device ? GEOM.dDevice : GEOM.dConsumer, false, row));
      // a device's label is small; a consumer beside the rooms reads like a room
      diag.appendChild(labelEl(leaf.id, device || !cfg.hasGroups));
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
    const g = st.cfg.consumers.find((c) => c.id === nd.consumerId);
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
  return s ? sourceColor(s, st.now.offline) : COLORS.idle;
};

const fillShape = (st: TreeState, shape: HTMLElement, icon: string, m: EntityModel | null) => {
  if (shape.dataset.icon === icon && shape.dataset.st === (m?.st?.state ?? "")) return;
  shape.dataset.icon = icon;
  shape.dataset.st = m?.st?.state ?? "";
  const look: Look = {
    color: "",
    icon,
    fallbackIcon: icon,
    label: null,
    tint: false,
    rule: null,
  };
  shape.replaceChildren(iconEl(st.ctx, look, m?.st));
};

const setRing = (lead: HTMLElement, d: number, segs: { color: string; f: number }[]) => {
  const r = d / 2 - 1.5;
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
    const g = st.cfg.consumers.find((c) => c.id === nd.consumerId);
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
  const v = src.w === null ? "–" : fmtPower(hass, src.w, u, dec);
  if (src.kind === "battery" && src.soc !== null)
    return { v, n: `${name} · ${fmtNumber(hass, Math.round(src.soc), 0)} %`, s };
  if (src.kind === "grid") {
    if (src.generator) return { v, n: t(hass, "power.generator"), s };
    if (src.lowCarbon !== null && !st.now.offline)
      return {
        v,
        n: `${name} · ${t(hass, "power.low_carbon", {
          pct: `${fmtNumber(hass, Math.round(src.lowCarbon * 100), 0)} %`,
        })}`,
        s,
      };
  }
  return { v, n: name, s };
};

// the label of every node, measured, from a preliminary layout (the texts need no geometry)
const measureLabels = (st: TreeState, labelEls: Map<string, HTMLElement>) => {
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
    const nameFont = small ? FONT_SMALL_NAME : FONT_NAME;
    const w =
      Math.max(
        textWidth(txt.v, small ? FONT_SMALL : FONT_VALUE),
        textWidth(txt.n, nameFont),
        textWidth(txt.s, nameFont),
      ) + 2;
    const h =
      (small ? GEOM.labelSmallH : GEOM.labelH) + (txt.s ? (small ? 13 : GEOM.labelLine) : 0);
    sizes.set(nd.id, { w, h });
  }
  return { texts, sizes };
};

export const updateTree = (diag: HTMLElement, prelim: TreeState) => {
  const labelEls = new Map<string, HTMLElement>();
  for (const el of diag.querySelectorAll<HTMLElement>(".plabel"))
    if (el.dataset.node) labelEls.set(el.dataset.node, el);
  // the labels' sizes decide where the columns go: lay out again with them
  const { texts, sizes } = measureLabels(prelim, labelEls);
  const st: TreeState = {
    ...prelim,
    layout: layoutTree(prelim.cfg, prelim.layout.w, prelim.flows.edges, sizes),
  };
  const { cfg, layout, flows, models } = st;
  const tracks = qs<SVGSVGElement>(diag, "svg.ptracks");
  const flow = qs(diag, ".pflow");
  const nodeEls = new Map<string, HTMLElement>();
  for (const el of diag.querySelectorAll<HTMLElement>(".pnode, .plist"))
    if (el.dataset.node) nodeEls.set(el.dataset.node, el);
  diag.classList.toggle("idle-hidden", cfg.idleLinks === "hidden");
  diag.classList.toggle("idle-faint", cfg.idleLinks === "faint");

  // ----- geometry -----
  if (diag.dataset.key !== layout.key) {
    diag.dataset.key = layout.key;
    tracks.setAttribute("viewBox", `0 0 ${layout.w} ${layout.h}`);
    diag.classList.toggle("narrow", layout.w < 380);
    tracks.replaceChildren(
      ...layout.edges.map((e) => svgEl("path", { class: "link", d: e.d, "data-edge": e.id })),
    );
    flow.replaceChildren();
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
  }

  // ----- links -----
  const trackEls = new Map<string, SVGPathElement>();
  for (const p of tracks.querySelectorAll<SVGPathElement>("path.link"))
    trackEls.set(p.dataset.edge ?? "", p);
  const laneEls = new Map<string, HTMLElement>();
  for (const l of flow.querySelectorAll<HTMLElement>(".lane")) laneEls.set(l.dataset.edge ?? "", l);
  const hiddenEdges = new Set<string>();
  layout.edges.forEach((e, i) => {
    const w = flows.edges[i]?.w ?? 0;
    const active = isActive(w);
    const color = edgeColor(e.kind, w);
    const track = trackEls.get(e.id);
    if (track) {
      track.classList.toggle("active", active);
      track.style.setProperty("--pf-c", color);
    }
    const lane = laneEls.get(e.id);
    if (!active) {
      lane?.remove();
      if (cfg.idleLinks === "hidden") hiddenEdges.add(e.id);
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
      setRate(lane, rateOf(w, Number(lane.dataset.w), cfg.animation));
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
        nd.d,
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
    } else if (nd.kind === "battery" && lead.classList.contains("ring")) {
      const soc = sourceOf(st, nd)?.soc ?? null;
      setRing(lead, nd.d, soc === null ? [] : [{ color, f: Math.max(0, Math.min(1, soc / 100)) }]);
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
      consumerId: r.id,
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
  const labelSizes: LabelSize[] = [...sizes].map(([id, s]) => ({ id, ...s }));
  for (const p of placeLabels(layout, labelSizes, cfg.direction, hiddenEdges)) {
    const el = labelEls.get(p.id);
    const txt = texts.get(p.id);
    if (!el || !txt) continue;
    qs(el, ".state").textContent = txt.v;
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
