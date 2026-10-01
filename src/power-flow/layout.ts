// The geometry of the tree (pure). It is computed once in flow coordinates – `a` along the flow
// (sources → home → groups → consumers), `b` across – and mapped to x / y by the direction, so
// `direction: down` is the same tree turned by a quarter.
//
// Every node owns a slot for its label (a source: right of the node above its line; a consumer or
// device: left of it above its line; the home below; a room above). The layout reserves that slot:
// across the flow through the pitch between nodes, which follows the label heights and so the
// config alone (the card's height never depends on its width); along the flow through the column
// positions, which keep the measured label widths clear of the next column and the trunks.
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
  tight?: boolean; // direction: down – the column is too narrow for the labels beside the nodes
  alt?: boolean; // direction: down, tight – every other node puts its label on the other side
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
// the measured size of a node's label
export interface LabelBox {
  w: number;
  h: number;
}
export type LabelSizes = ReadonlyMap<string, LabelBox>;

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

// ----- label slots -----

// the height of a node's label from the config: value and name, a secondary line when set
export const labelHeightOf = (cfg: PowerFlowConfig, idx: number | null, small: boolean) => {
  const sec = idx !== null && !!cfg.entities[idx]?.secondary;
  return (small ? GEOM.labelSmallH : GEOM.labelH) + (sec ? (small ? 13 : GEOM.labelLine) : 0);
};
// a label beside its node sits above the node's line: centred `max(r, h/2) + 4` above the
// centre, so its bottom clears the line by 4 px however small the node is
export const slotRise = (d: number, h: number) => Math.max(d / 2, h / 2) + 4;
// the distance between two nodes of a column so the second one's label clears the first node
export const slotPitch = (dPrev: number, d: number, h: number) =>
  dPrev / 2 + 2 + slotRise(d, h) + h / 2;
// the distance of the first node's centre from the edge for the same reason
export const slotMargin = (d: number, h: number) => slotRise(d, h) + h / 2;

// the source column: every source's position across (relative to the first) and the margins
interface Stack {
  bs: number[];
  first: number; // margin before the first centre
  last: number; // margin after the last centre
  extent: number;
}
const sourceStack = (cfg: PowerFlowConfig): Stack => {
  const ds = cfg.sources.map((s) => nodeD(s.kind));
  const hs = cfg.sources.map((s) => labelHeightOf(cfg, s.idx, false));
  const bs: number[] = [];
  let b = 0;
  ds.forEach((d, i) => {
    if (i > 0) b += Math.max(GEOM.srcPitch, slotPitch(ds[i - 1], d, hs[i]));
    bs.push(b);
  });
  const first = Math.max(GEOM.srcMargin, slotMargin(ds[0], hs[0]));
  const last = Math.max(GEOM.srcMargin, ds[ds.length - 1] / 2 + 12);
  return { bs, first, last, extent: b };
};

// the consumer column: every leaf's position across the flow (relative to the first), the centre
// of every group and the margins
interface Column {
  leaves: { id: string; b: number; group: string | null; d: number; h: number }[];
  groups: { id: string; b: number }[];
  first: number;
  last: number;
  extent: number;
}
const columnPlan = (cfg: PowerFlowConfig, scale = 1): Column => {
  const leaves: Column["leaves"] = [],
    groups: Column["groups"] = [];
  let b = 0,
    prevD = 0;
  const place = (
    id: string,
    idx: number | null,
    group: string | null,
    d: number,
    small: boolean,
  ) => {
    const h = labelHeightOf(cfg, idx, small);
    if (leaves.length) {
      // the gap between two blocks (rooms or lone consumers) on top of the slot pitch
      const sameBlock = group !== null && leaves[leaves.length - 1].group === group;
      const least = sameBlock ? GEOM.itemPitch : GEOM.consumerPitch;
      b +=
        Math.max(least, slotPitch(prevD, d, h)) * scale +
        (sameBlock || !cfg.hasGroups ? 0 : GEOM.groupGap * scale);
    }
    leaves.push({ id, b, group, d, h });
    prevD = d;
  };
  for (const c of cfg.consumers) {
    if (c.kind === "group") {
      let start = 0;
      c.items.forEach((it, j) => {
        place(it.id, it.idx, c.id, GEOM.dDevice, true);
        if (j === 0) start = leaves[leaves.length - 1].b;
      });
      groups.push({ id: c.id, b: (start + b) / 2 });
    } else {
      // a lone consumer beside rooms reads like a room (a normal label, centred above)
      const small = !cfg.hasGroups;
      place(c.id, c.kind === "item" ? c.idx : null, null, GEOM.dConsumer, small);
    }
  }
  const firstLeaf = leaves[0],
    lastLeaf = leaves[leaves.length - 1];
  let first = firstLeaf ? Math.max(GEOM.consumerMargin, slotMargin(firstLeaf.d, firstLeaf.h)) : 0;
  // with rooms, the first block's label sits centred above its node in the room column
  const c0 = cfg.consumers[0];
  if (cfg.hasGroups && c0) {
    const h =
      c0.kind === "group"
        ? GEOM.labelH
        : labelHeightOf(cfg, c0.kind === "item" ? c0.idx : null, false);
    first = Math.max(first, GEOM.dGroup / 2 + 4 + h);
  }
  const last = lastLeaf ? Math.max(GEOM.consumerMargin, lastLeaf.d / 2 + 14) : 0;
  return { leaves, groups, first, last, extent: b };
};

// the diagram's extent across the flow (its height for `right`): a function of the config
export const acrossOf = (cfg: PowerFlowConfig): number => {
  const st = sourceStack(cfg);
  const srcNeed = st.first + st.extent + st.last;
  const col = columnPlan(cfg);
  const consNeed = cfg.consumers.length ? col.first + col.extent + col.last : 0;
  return Math.ceil(Math.max(GEOM.minAcross, srcNeed, consNeed));
};
// the columns after the sources (`down`: their positions along the flow)
const alongColumns = (cfg: PowerFlowConfig) =>
  1 + (cfg.hasGroups ? 1 : 0) + (cfg.consumers.length ? 1 : 0);
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

export const layoutTree = (
  cfg: PowerFlowConfig,
  width: number,
  edges: EdgeFlow[],
  sizes: LabelSizes = new Map(),
): TreeLayout => {
  const dir: Direction = cfg.direction;
  const right = dir === "right";
  const W = Math.max(1, Math.round(width));
  const across = right ? acrossOf(cfg) : W;
  const along = right ? W : alongDownOf(cfg);
  const listRows = right && cfg.consumerStyle === "list" && cfg.consumers.length > 0;
  const hasCons = cfg.consumers.length > 0;
  const map = (a: number, b: number): Pt => (right ? [a, b] : [b, a]);
  const widthOf = (id: string) => sizes.get(id)?.w ?? 0;
  const leaves = leavesOf(cfg);
  const maxSrcW = Math.max(0, ...cfg.sources.map((_, i) => widthOf(`s${i}`)));
  const rS = GEOM.dSolar / 2,
    rH = GEOM.dHome / 2;
  const maxLeafW = Math.max(
    0,
    ...leaves.filter((l) => !cfg.hasGroups || l.id.includes(".")).map((l) => widthOf(l.id)),
  );

  // ----- across positions -----
  const n = cfg.sources.length;
  const stack = sourceStack(cfg);
  let bS: number[];
  let srcTight = false;
  if (right) {
    // the stack, spread a little when the consumers made the diagram taller, centred
    const room = across - stack.first - stack.last;
    const scale = stack.extent > 0 ? Math.max(1, Math.min(1.5, room / stack.extent)) : 1;
    const b0 = (across - stack.extent * scale) / 2;
    bS = stack.bs.map((b) => b0 + b * scale);
  } else {
    const pitch = n < 2 ? 0 : Math.max(44, Math.min(126, (across - 2 * GEOM.downMargin) / (n - 1)));
    bS = cfg.sources.map((_, i) => across / 2 + (i - (n - 1) / 2) * pitch);
    srcTight = n > 1 && pitch < GEOM.dSolar + maxSrcW + 12;
  }
  const bH = across / 2;
  // ----- along positions -----
  const aS = GEOM.srcAlong;
  let aH: number, aG: number, aC: number, aRow: number;
  if (right) {
    // the home column clears the source labels; the columns keep a least distance on narrow
    // cards and spread on wide ones
    // only a source label in the home's band (beside it, above its line) must clear the home
    const bandH = [bH - rH - 2, bH + rH + 2];
    const clearH = Math.max(
      0,
      ...cfg.sources.map((s, i) => {
        const h = labelHeightOf(cfg, s.idx, false),
          mid = bS[i] - nodeD(s.kind) / 2 - 4;
        const inBand = mid + h / 2 > bandH[0] && mid - h / 2 < bandH[1];
        return inBand ? aS + rS + GEOM.labelGap + widthOf(`s${i}`) + 10 + rH : 0;
      }),
    );
    const minH = Math.max(aS + rS + 40, clearH);
    if (!hasCons) aH = Math.max(along - 44, minH);
    else if (listRows) aH = Math.max(minH, along * (cfg.hasGroups ? 0.3 : 0.42));
    else aH = Math.max(minH, along * (cfg.hasGroups ? 0.38 : 0.5));
    aH = Math.min(aH, along - rH - 2);
    aC = along - (cfg.hasGroups ? GEOM.dDevice / 2 + 14 : GEOM.dConsumer / 2 + 14);
    aG = listRows ? aH + Math.max(55, along * 0.16) : aH + (aC - aH) * 0.36;
    // the room column: its labels sit centred above the rooms, right of the home's trunk
    const maxRoomW = Math.max(
      0,
      ...cfg.consumers.map((c) => (c.kind === "group" || cfg.hasGroups ? widthOf(c.id) : 0)),
    );
    if (cfg.hasGroups) {
      // … and left of the device labels; when both cannot hold, the devices win
      const lower = aH + rH + 16 + maxRoomW / 2 + 6;
      const upper = aC - GEOM.dDevice / 2 - GEOM.labelGap - maxLeafW - 6 - maxRoomW / 2;
      aG = Math.max(aH + rH + 26, Math.min(Math.max(aG, lower), upper));
    }
    aRow = cfg.hasGroups ? aG + Math.max(50, along * 0.18) : Math.max(aH + 80, along * 0.62);
    if (listRows) aC = aRow;
  } else {
    aH = hasCons ? aS + GEOM.columnPitch : along - 44;
    aG = aH + GEOM.columnPitch;
    aC = aH + GEOM.columnPitch * (cfg.hasGroups ? 2 : 1);
    aRow = aC;
  }

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
  cfg.sources.forEach((s, i) => {
    const nd = add(`s${i}`, s.kind, s.idx, aS, bS[i], null);
    if (srcTight) {
      nd.tight = true;
      nd.alt = i % 2 === 1;
    }
  });
  add("home", "home", cfg.homeIdx, aH, bH, null);

  // the consumer column, centred across; `down` spreads it to the width
  let plan = columnPlan(cfg);
  let consTight = false;
  if (!right && plan.extent > 0) {
    const fit = Math.max(0.6, Math.min(1.6, (across - 2 * GEOM.consumerMargin) / plan.extent));
    plan = columnPlan(cfg, fit);
    const pitch = plan.leaves.length > 1 ? plan.extent / (plan.leaves.length - 1) : Infinity;
    consTight = pitch < maxLeafW + 8;
  }
  // the column centred with its margins, so the first label keeps its room
  const b0 = (across - plan.first - plan.extent - plan.last) / 2 + plan.first;
  const leafKind = (id: string): NodeKind => (id === "other" ? "other" : "consumer");
  for (const g of plan.groups) {
    const grp = cfg.consumers.find((c) => c.id === g.id);
    add(g.id, "group", null, aG, b0 + g.b, grp ? grp.id : null);
  }
  plan.leaves.forEach((lf, k) => {
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
      nd.d = lf.d;
      if (asRoom) nd.column = "group";
      if (consTight) {
        nd.tight = true;
        nd.alt = k % 2 === 1;
      }
    }
  });

  // ----- edges -----
  const out: LEdge[] = [];
  const src = (id: string) => byId.get(id) as LNode;
  const A = (nd: LNode) => (right ? nd.x : nd.y),
    Bof = (nd: LNode) => (right ? nd.y : nd.x);
  const offsets = laneOffsets(bS, bH);
  const home = src("home");
  const gapAlong = aH - rH - (aS + rS);
  // the lanes bend late, so a source's label fits beside its node on a narrow card
  const bendBase = aS + rS + gapAlong * 0.8;
  // the trunk sits nearer its origin and clears the labels left of the targets
  const trunkOf = (from: LNode, to: LNode) => {
    const a0 = A(from) + from.d / 2,
      a1 = A(to) - to.d / 2;
    let t = a0 + (a1 - a0) * (from.kind === "group" ? 0.25 : 0.4);
    // a room's label sits centred above it: the trunk stays left of that label
    if (to.column === "group" && to.d > 0) t = Math.min(t, A(to) - widthOf(to.id) / 2 - 6);
    if (to.column === "leaf" && to.d > 0) {
      const lw = Math.max(
        0,
        ...plan.leaves.map((l) => (byId.get(l.id)?.column === "leaf" ? widthOf(l.id) : 0)),
      );
      t = Math.min(t, a1 - GEOM.labelGap - lw - 6);
    }
    return Math.max(t, a0 + 10);
  };
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
  void home;

  const [w, h] = right ? [along, across] : [across, along];
  return {
    key: `${dir}/${cfg.flowStyle}/${cfg.consumerStyle}/${w}/${h}/${nodes.length}/${out.length}/${Math.round(aH)}/${Math.round(aG)}`,
    w,
    h,
    nodes,
    edges: out,
    rows,
  };
};
