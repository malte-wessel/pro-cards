// The geometry of the tree (pure). It is computed once in flow coordinates – `a` along the flow
// (sources → home → groups → consumers), `b` across – and mapped to x / y by the direction, so
// `direction: down` is the same tree turned by a quarter. The extent across the flow follows the
// config alone (the number of sources and consumers), the extent along it follows the card's width
// (`right`) or the number of columns (`down`), so the card's height never depends on its width.
import { leavesOf, type PowerFlowConfig } from "./config.ts";
import { GEOM, type Direction } from "./constants.ts";
import type { EdgeFlow, EdgeKind } from "./model.ts";
import { dedupe, orthoPath, pathLength, type Pt } from "./path.ts";

export type NodeKind = "solar" | "battery" | "grid" | "home" | "group" | "consumer" | "other";
export interface LNode {
  id: string;
  kind: NodeKind;
  idx: number | null; // the entity item, null for the other node and groups
  x: number;
  y: number;
  d: number; // diameter
  consumerId: string | null; // group / consumer: the config id
  column: "source" | "home" | "group" | "leaf"; // where it sits along the flow
}
export interface LEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  pts: Pt[];
  d: string;
  len: number;
}
export interface LRow {
  id: string;
  idx: number | null;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface TreeLayout {
  key: string;
  w: number;
  h: number;
  nodes: LNode[];
  edges: LEdge[];
  rows: LRow[];
}

const nodeD = (kind: NodeKind) =>
  kind === "solar"
    ? GEOM.dSolar
    : kind === "battery"
      ? GEOM.dBattery
      : kind === "grid"
        ? GEOM.dGrid
        : kind === "home"
          ? GEOM.dHome
          : kind === "group"
            ? GEOM.dGroup
            : GEOM.dConsumer;

// the consumer column: every leaf's position across the flow (relative to the first) and the
// centre of every group
interface Column {
  leaves: { id: string; b: number; group: string | null }[];
  groups: { id: string; b: number }[];
  extent: number;
}
const columnPlan = (cfg: PowerFlowConfig, scale = 1): Column => {
  const leaves: Column["leaves"] = [],
    groups: Column["groups"] = [];
  const within = GEOM.itemPitch * scale,
    between = (cfg.hasGroups ? GEOM.itemPitch + GEOM.groupGap : GEOM.consumerPitch) * scale;
  let b = 0,
    first = true;
  for (const c of cfg.consumers) {
    if (!first) b += between;
    first = false;
    if (c.kind === "group") {
      const b0 = b;
      c.items.forEach((it, j) => {
        if (j > 0) b += within;
        leaves.push({ id: it.id, b, group: c.id });
      });
      groups.push({ id: c.id, b: (b0 + b) / 2 });
    } else leaves.push({ id: c.id, b, group: null });
  }
  return { leaves, groups, extent: b };
};

// the diagram's extent across the flow (its height for `right`): a function of the config
// a source whose label carries a secondary line needs a taller pitch
const srcPitchOf = (cfg: PowerFlowConfig) =>
  GEOM.srcPitch + (cfg.sources.some((s) => cfg.entities[s.idx].secondary) ? 24 : 0);
export const acrossOf = (cfg: PowerFlowConfig): number => {
  const n = cfg.sources.length;
  const srcNeed = 2 * GEOM.srcMargin + (n - 1) * srcPitchOf(cfg);
  const col = columnPlan(cfg);
  const consNeed = cfg.consumers.length ? col.extent + 2 * GEOM.consumerMargin : 0;
  return Math.ceil(Math.max(GEOM.minAcross, srcNeed, consNeed));
};
// the columns after the sources (`down`: their positions along the flow)
const alongColumns = (cfg: PowerFlowConfig) => {
  const cols = 1 + (cfg.hasGroups ? 1 : 0) + (cfg.consumers.length ? 1 : 0);
  return cols;
};
export const alongDownOf = (cfg: PowerFlowConfig): number => {
  if (!cfg.consumers.length) return GEOM.minAcross;
  return GEOM.srcAlong + GEOM.columnPitch * alongColumns(cfg) + 56;
};
// the diagram's height in px for the card's size
export const diagramHeight = (cfg: PowerFlowConfig) =>
  cfg.direction === "right" ? acrossOf(cfg) : alongDownOf(cfg);

// the lane offsets into the home: the source nearest the centre takes the inner lane, the
// others move outward on their side, so no two lines cross
export const laneOffsets = (bs: number[], bH: number): number[] => {
  const order = bs
    .map((b, i) => ({ i, d: Math.abs(b - bH), b }))
    .sort((p, q) => p.d - q.d || p.b - q.b);
  const out = new Array<number>(bs.length).fill(0);
  let above = 0,
    below = 0;
  order.forEach((o, k) => {
    if (k === 0) {
      out[o.i] = 0;
      return;
    }
    if (o.b < bH) out[o.i] = -GEOM.lane * ++above;
    else out[o.i] = GEOM.lane * ++below;
  });
  // a single source aligned with the home keeps 0; two sources on one side keep their order
  return out;
};

export const layoutTree = (cfg: PowerFlowConfig, width: number, edges: EdgeFlow[]): TreeLayout => {
  const dir: Direction = cfg.direction;
  const right = dir === "right";
  const W = Math.max(1, Math.round(width));
  const across = right ? acrossOf(cfg) : W;
  const along = right ? W : alongDownOf(cfg);
  const listRows = right && cfg.consumerStyle === "list" && cfg.consumers.length > 0;
  const hasCons = cfg.consumers.length > 0;
  const map = (a: number, b: number): Pt => (right ? [a, b] : [b, a]);

  // ----- along positions -----
  const aS = GEOM.srcAlong;
  let aH: number, aG: number, aC: number, aRow: number;
  if (right) {
    // the columns keep a least distance on narrow cards and spread on wide ones
    const minH = aS + GEOM.dSolar / 2 + 40;
    if (!hasCons) aH = along - 44;
    else if (listRows) aH = Math.max(minH, along * (cfg.hasGroups ? 0.3 : 0.42));
    else aH = Math.max(minH, along * (cfg.hasGroups ? 0.38 : 0.5));
    aC = along - (cfg.hasGroups ? GEOM.dDevice / 2 + 14 : GEOM.dConsumer / 2 + 14);
    aG = listRows ? aH + Math.max(55, along * 0.16) : aH + (aC - aH) * 0.36;
    aRow = cfg.hasGroups ? aG + Math.max(50, along * 0.18) : Math.max(aH + 80, along * 0.62);
    if (listRows) aC = aRow;
  } else {
    aH = hasCons ? aS + GEOM.columnPitch : along - 44;
    aG = aH + GEOM.columnPitch;
    aC = aH + GEOM.columnPitch * (cfg.hasGroups ? 2 : 1);
    aRow = aC;
  }

  // ----- across positions -----
  const n = cfg.sources.length;
  const srcPitch =
    n < 2
      ? 0
      : right
        ? Math.min(Math.max(96, srcPitchOf(cfg)), (across - 2 * GEOM.srcMargin) / (n - 1))
        : Math.max(44, Math.min(126, (across - 2 * GEOM.downMargin) / (n - 1)));
  const bS = cfg.sources.map((_, i) => across / 2 + (i - (n - 1) / 2) * srcPitch);
  const bH = across / 2;

  const nodes: LNode[] = [];
  const rows: LRow[] = [];
  const byId = new Map<string, LNode>();
  const add = (
    id: string,
    kind: NodeKind,
    idx: number | null,
    a: number,
    b: number,
    cid: string | null,
  ) => {
    const [x, y] = map(a, b);
    const column: LNode["column"] =
      kind === "home"
        ? "home"
        : kind === "group"
          ? "group"
          : idx !== null && id.startsWith("s")
            ? "source"
            : "leaf";
    const nd: LNode = { id, kind, idx, x, y, d: nodeD(kind), consumerId: cid, column };
    nodes.push(nd);
    byId.set(id, nd);
    return nd;
  };
  cfg.sources.forEach((s, i) => add(`s${i}`, s.kind, s.idx, aS, bS[i], null));
  add("home", "home", cfg.homeIdx, aH, bH, null);

  // the consumer column, centred across; `down` spreads it to the width
  let plan = columnPlan(cfg);
  if (!right && plan.extent > 0) {
    const fit = Math.max(0.6, Math.min(1.6, (across - 2 * GEOM.consumerMargin) / plan.extent));
    plan = columnPlan(cfg, fit);
  }
  const b0 = across / 2 - plan.extent / 2;
  const leafKind = (id: string): NodeKind => (id === "other" ? "other" : "consumer");
  const leaves = leavesOf(cfg);
  for (const g of plan.groups) {
    const grp = cfg.consumers.find((c) => c.id === g.id);
    add(g.id, "group", null, aG, b0 + g.b, grp ? grp.id : null);
  }
  for (const lf of plan.leaves) {
    const leaf = leaves.find((l) => l.id === lf.id);
    const idx = leaf && leaf.kind === "item" ? leaf.idx : null;
    // with rooms, a device of its own (and the other node) sits in the room column, fed by the
    // home like a room, so its line never crosses a room's
    const asRoom = cfg.hasGroups && !lf.group;
    if (listRows) {
      const a0 = asRoom ? aG - GEOM.dGroup / 2 : aRow;
      const [x, y] = map(a0, b0 + lf.b);
      rows.push({ id: lf.id, idx, x, y: y - GEOM.rowH / 2, w: along - a0, h: GEOM.rowH });
      // a row's node is virtual: the edge ends at the row's left edge
      byId.set(lf.id, {
        id: lf.id,
        kind: leafKind(lf.id),
        idx,
        x,
        y,
        d: 0,
        consumerId: lf.id,
        column: asRoom ? "group" : "leaf",
      });
    } else {
      const kind = leafKind(lf.id);
      const nd = add(lf.id, kind, idx, asRoom ? aG : aC, b0 + lf.b, lf.id);
      if (lf.group) nd.d = GEOM.dDevice;
      if (asRoom) nd.column = "group";
    }
  }

  // ----- edges -----
  const out: LEdge[] = [];
  const src = (id: string) => byId.get(id) as LNode;
  const A = (nd: LNode) => (right ? nd.x : nd.y),
    Bof = (nd: LNode) => (right ? nd.y : nd.x);
  const offsets = laneOffsets(bS, bH);
  const home = src("home");
  const rH = home.d / 2;
  const gapAlong = aH - rH - (aS + GEOM.dSolar / 2);
  const bendBase = aS + GEOM.dSolar / 2 + gapAlong * 0.6;
  // the trunk sits nearer its origin, leaving room for the labels left of the targets
  const trunkOf = (from: LNode, to: LNode) =>
    A(from) +
    from.d / 2 +
    (A(to) - to.d / 2 - A(from) - from.d / 2) * (from.kind === "group" ? 0.25 : 0.4);
  let k = 0;
  for (const e of edges) {
    const from = byId.get(e.from),
      to = byId.get(e.to);
    if (!from || !to) continue;
    let pts: Pt[];
    if (e.to === "home") {
      const i = Number(e.from.slice(1));
      const off = offsets[i] ?? 0;
      const aBend = bendBase + Math.abs(off) * 1.5;
      pts = [
        map(A(from) + from.d / 2, Bof(from)),
        map(aBend, Bof(from)),
        map(aBend, bH + off),
        map(aH - rH, bH + off),
      ];
    } else if (from.kind !== "home" && from.kind !== "group") {
      // a rail: charging (… → battery) or export (… → grid), behind the source column
      const rail = to.kind === "battery" ? GEOM.railBattery : GEOM.railGrid;
      pts = [
        map(A(from) - from.d / 2, Bof(from)),
        map(rail, Bof(from)),
        map(rail, Bof(to)),
        map(A(to) - to.d / 2, Bof(to)),
      ];
    } else {
      const t = trunkOf(from, to);
      pts = [
        map(A(from) + from.d / 2, Bof(from)),
        map(t, Bof(from)),
        map(t, Bof(to)),
        map(A(to) - to.d / 2, Bof(to)),
      ];
    }
    pts = dedupe(pts);
    out.push({
      id: `e${k++}`,
      from: e.from,
      to: e.to,
      kind: e.kind,
      pts,
      d: orthoPath(pts, GEOM.radius),
      len: pathLength(pts),
    });
  }

  const [w, h] = right ? [along, across] : [across, along];
  return {
    key: `${dir}/${cfg.flowStyle}/${cfg.consumerStyle}/${w}/${h}/${nodes.length}/${out.length}`,
    w,
    h,
    nodes,
    edges: out,
    rows,
  };
};
