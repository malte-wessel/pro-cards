// The tree's DOM: the tracks (one SVG path per link), the flow lanes (the particles of the active
// links), the nodes, their labels and the list rows. Built once from the config; the geometry is
// redone when the diagram's size, direction or style changes, and every render updates texts,
// colours, rings and the flow: a link whose load changed a little keeps its particles and only
// plays faster or slower (`setRate`), a link that switched on or off, or whose particle count
// moved by two, gets its lane rebuilt.
import { cssColor } from "../../shared/color.ts";
import type { EntityItem } from "../../shared/entity/config.ts";
import type { Look } from "../../shared/entity/look.ts";
import { nameOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
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
import type { LEdge, LNode, TreeLayout } from "../layout.ts";
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

const svgEl = (tag: string, attrs: Record<string, string | number> = {}) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

// ----- build -----

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
    for (let i = 0; i < 3; i++)
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
  el.appendChild(textEl("secondary", ""));
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
  const lane = document.createElement("div");
  lane.className = "lane";
  const n = particles(e.len, w);
  const dur = duration(e.len, w);
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
        const a = iEl("fa", { "--p0": p0.toFixed(3) });
        a.style.width = `${arrowLength(w)}px`;
        lane.appendChild(a);
      }
    }
  }
  return lane;
};

const place = (el: HTMLElement, nd: LNode) => {
  el.style.left = `${nd.x}px`;
  el.style.top = `${nd.y}px`;
};

const iconFor = (st: TreeState, nd: LNode, look: Look | null): string => {
  if (look?.icon) return look.icon;
  if (nd.kind === "solar") return ICONS.solar;
  if (nd.kind === "battery") return ICONS.battery;
  if (nd.kind === "grid") return st.now.offline ? ICONS.gridOff : ICONS.grid;
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
  if (nd.kind === "home") return COLORS.home;
  if (nd.kind === "group" || nd.kind === "consumer" || nd.kind === "other") return COLORS.home;
  const i = Number(nd.id.slice(1));
  const s = st.now.sources[i];
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

// value and name of a node's label
const labelText = (st: TreeState, nd: LNode, ent: EntityItem | null, m: EntityModel | null) => {
  const { hass } = st.ctx,
    f = st.flows;
  const dec = ent?.decimals ?? null;
  if (nd.kind === "home") return { v: fmtPower(hass, f.H, dec), n: "" };
  if (nd.kind === "group") {
    const g = st.cfg.consumers.find((c) => c.id === nd.consumerId);
    return {
      v: fmtPower(hass, f.groupW.get(nd.id) ?? 0),
      n: g && g.kind === "group" ? g.name : "",
    };
  }
  if (nd.kind === "other")
    return { v: fmtPower(hass, f.leafW.get(nd.id) ?? 0), n: t(hass, "power.other") };
  if (nd.kind === "consumer")
    return {
      v: m && m.model.avail ? fmtPower(hass, f.leafW.get(nd.id) ?? 0, dec) : "–",
      n: ent && m ? nameOf(st.ctx, ent, m.st) : "",
    };
  const s = st.now.sources[Number(nd.id.slice(1))];
  const name = ent && m ? nameOf(st.ctx, ent, m.st) : "";
  if (!s) return { v: "–", n: name };
  const v = s.w === null ? "–" : fmtPower(hass, s.w, dec);
  if (s.kind === "battery" && s.soc !== null)
    return { v, n: `${name} · ${fmtNumber(hass, Math.round(s.soc), 0)} %` };
  return { v, n: name };
};

export const updateTree = (diag: HTMLElement, st: TreeState) => {
  const { cfg, layout, flows, models } = st;
  const tracks = qs<SVGSVGElement>(diag, "svg.ptracks");
  const flow = qs(diag, ".pflow");
  const nodeEls = new Map<string, HTMLElement>();
  for (const el of diag.querySelectorAll<HTMLElement>(".pnode, .plist"))
    if (el.dataset.node) nodeEls.set(el.dataset.node, el);
  const labelEls = new Map<string, HTMLElement>();
  for (const el of diag.querySelectorAll<HTMLElement>(".plabel"))
    if (el.dataset.node) labelEls.set(el.dataset.node, el);

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
  layout.edges.forEach((e, i) => {
    const w = flows.edges[i]?.w ?? 0;
    const active = isActive(w);
    const color = edgeColor(e.kind);
    const track = trackEls.get(e.id);
    if (track) {
      track.classList.toggle("active", active);
      track.style.setProperty("--pf-c", color);
    }
    const lane = laneEls.get(e.id);
    if (!active) {
      lane?.remove();
      return;
    }
    const n = particles(e.len, w);
    if (!lane || needsRebuild(Number(lane.dataset.n), n)) {
      const fresh = laneOf(st, e, w, color);
      fresh.dataset.edge = e.id;
      if (lane) lane.replaceWith(fresh);
      else flow.appendChild(fresh);
    } else setRate(lane, rateOf(w, Number(lane.dataset.w)));
  });

  // ----- nodes -----
  const looks = new Map<string, Look | null>();
  for (const nd of layout.nodes) {
    const el = nodeEls.get(nd.id);
    if (!el) continue;
    const ent = nd.idx === null ? null : cfg.entities[nd.idx];
    const m = nd.idx === null ? null : (models[nd.idx] ?? null);
    const look = nd.kind === "home" ? st.homeLook : (m?.look ?? null);
    looks.set(nd.id, look);
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
              { color: COLORS.gridIn, f: flows.gH / H },
            ]
          : [],
      );
    } else if (nd.kind === "battery" && lead.classList.contains("ring")) {
      const s = st.now.sources[Number(nd.id.slice(1))];
      const soc = s?.soc ?? null;
      setRing(lead, nd.d, soc === null ? [] : [{ color, f: Math.max(0, Math.min(1, soc / 100)) }]);
    }
  }

  // ----- rows -----
  const barMax = Math.max(
    flows.H,
    [...flows.leafW.values()].reduce((a, b) => a + b, 0),
    1,
  );
  for (const r of layout.rows) {
    const el = nodeEls.get(r.id);
    if (!el) continue;
    const ent = r.idx === null ? null : cfg.entities[r.idx];
    const m = r.idx === null ? null : (models[r.idx] ?? null);
    el.style.setProperty(
      "--fe-color",
      ent && m && (ent.color || m.look.rule?.color)
        ? cssColor(m.look.color, COLORS.home)
        : COLORS.home,
    );
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
    fillShape(st, qs(el, ".shape"), iconFor(st, nd, m?.look ?? null), m);
    const txt = labelText(st, nd, ent, m);
    qs(el, ".primary").textContent = txt.n;
    qs(el, ".state").textContent = txt.v;
    qs(el, ".bar i").style.width = `${((w / barMax) * 100).toFixed(1)}%`;
  }

  // ----- labels -----
  const sizes: LabelSize[] = [];
  const texts = new Map<string, { v: string; n: string }>();
  for (const nd of layout.nodes) {
    const el = labelEls.get(nd.id);
    if (!el) continue;
    const ent = nd.idx === null ? null : cfg.entities[nd.idx];
    const m = nd.idx === null ? null : (models[nd.idx] ?? null);
    const txt = labelText(st, nd, ent, m);
    texts.set(nd.id, txt);
    const small = el.classList.contains("small");
    const w =
      Math.max(
        textWidth(txt.v, small ? FONT_SMALL : FONT_VALUE),
        textWidth(txt.n, small ? FONT_SMALL_NAME : FONT_NAME),
      ) + 2;
    sizes.push({ id: nd.id, w, h: small ? 28 : GEOM.labelH });
  }
  for (const p of placeLabels(layout, sizes, cfg.direction)) {
    const el = labelEls.get(p.id);
    const txt = texts.get(p.id);
    if (!el || !txt) continue;
    qs(el, ".state").textContent = txt.v;
    const name = qs(el, ".secondary");
    name.textContent = txt.n;
    name.style.display = txt.n ? "" : "none";
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
