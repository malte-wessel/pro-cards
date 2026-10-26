// The geometry of the tree (pure). It is computed once in flow coordinates – `a` along the flow
// (sources → home → groups → consumers), `b` across – and mapped to x / y by the direction, so
// `direction: down` is the same tree turned by a quarter.
//
// Every node owns a slot for its label (a source: right of the node above its line; a consumer or
// device: left of it above its line; the home below; a room above). The layout reserves that slot:
// across the flow through the pitch between nodes, which follows the label heights and so the
// config alone (the card's height never depends on its width); along the flow through the column
// positions, which keep the measured label widths clear of the next column and the trunks.
import { bothWays, leavesOf, type FlowTreeConfig, type Source } from "./config.ts";
import { GEOM, LABEL_LINES, NODE_D, type Direction } from "./constants.ts";
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
  column: "source" | "home" | "group" | "leaf"; // where it sits along the flow
  labelMax?: number; // direction: down, a crowded row – the widest name that clears its neighbours
  slot?: SourceSlot; // direction: down – where the sources' labels go, the same for the whole row
  under?: boolean; // direction: right, a narrow card with rooms – a device's label centred below it
}
export interface LEdge {
  id: string;
  fi: number; // its flow: the index in the edges the layout was given (some may not be drawn)
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
  vw?: number; // the value line alone: never cut
  nw?: number; // the name lines alone
}
export type LabelSizes = ReadonlyMap<string, LabelBox>;

// the source column's centre along the flow: a source bigger than the default solar node moves
// it in, so the charging and export rails behind it (and the card's edge) stay clear
const srcAlongOf = (cfg: FlowTreeConfig) =>
  GEOM.srcAlong + Math.max(0, ...cfg.sources.map((s) => (s.d - GEOM.dSolar) / 2));

// ----- label slots -----

// the labels' lines: the theme's where the tree is drawn, the default size otherwise
export const linesOf = (cfg: FlowTreeConfig) => cfg.lines ?? LABEL_LINES;
// the height of a node's label from the config: value and name, a secondary line when set
export const labelHeightOf = (cfg: FlowTreeConfig, idx: number | null, small: boolean) => {
  const sec = idx !== null && !!cfg.entities[idx]?.secondary;
  const l = linesOf(cfg),
    name = small ? l.smallName : l.name;
  return (small ? l.smallValue : l.value).line + name.line + (sec ? name.line : 0);
};
// a source's label: a source that may show two values keeps a line for the second (the config
// decides, not the values)
const srcLabelHeight = (cfg: FlowTreeConfig, s: Source) =>
  labelHeightOf(cfg, s.idx, false) + (bothWays(cfg, s) ? linesOf(cfg).value.line : 0);
// a label beside its node sits above the node's line: centred `max(r, h/2) + 4` above the
// centre, so its bottom clears the line by 4 px however small the node is
export const slotRise = (d: number, h: number) => Math.max(d / 2, h / 2) + 4;
// the distance between two nodes of a column so the second one's label clears the first node
export const slotPitch = (dPrev: number, d: number, h: number) =>
  dPrev / 2 + 2 + slotRise(d, h) + h / 2;
// the distance of the first node's centre from the edge for the same reason
export const slotMargin = (d: number, h: number) => slotRise(d, h) + h / 2;

// a ring's stroke: 3 px on its kind's own circle, scaled with the node, so ring, gap and icon
// (both proportional already) keep their proportions at any icon_size
export const ringWidth = (kind: NodeKind, d: number) =>
  (3 * d) / (kind in NODE_D ? NODE_D[kind as keyof typeof NODE_D] : d);

// the source column: every source's position across (relative to the first) and the margins
interface Stack {
  bs: number[];
  first: number; // margin before the first centre
  last: number; // margin after the last centre
  extent: number;
}
const sourceStack = (cfg: FlowTreeConfig): Stack => {
  // every source hidden: an empty column
  if (!cfg.sources.length)
    return { bs: [], first: GEOM.srcMargin, last: GEOM.srcMargin, extent: 0 };
  const ds = cfg.sources.map((s) => s.d);
  const hs = cfg.sources.map((s) => srcLabelHeight(cfg, s));
  // one pitch for every source, centre to centre: the most any label asks for to clear the node
  // before it
  let pitch: number = GEOM.srcPitch;
  for (let i = 1; i < ds.length; i++) pitch = Math.max(pitch, slotPitch(ds[i - 1], ds[i], hs[i]));
  const bs = ds.map((_, i) => i * pitch);
  const first = Math.max(GEOM.srcMargin, slotMargin(ds[0], hs[0]));
  const last = Math.max(GEOM.srcMargin, ds[ds.length - 1] / 2 + 12);
  return { bs, first, last, extent: bs[bs.length - 1] };
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
const columnPlan = (cfg: FlowTreeConfig, scale = 1): Column => {
  const leaves: Column["leaves"] = [],
    groups: Column["groups"] = [];
  // a list row draws its circle within the row: a bigger icon_size asks for no more room
  const rows = cfg.direction === "right" && cfg.consumerStyle === "list";
  // every leaf in order, with its label's height; the nodes of the room column (the rooms, and
  // beside them the lone consumers and the other node) by the leaves they span
  const all: { id: string; group: string | null; d: number; h: number }[] = [];
  const blocks: { id: string | null; first: number; last: number; d: number; h: number }[] = [];
  for (const c of cfg.consumers) {
    const first = all.length;
    if (c.kind === "group")
      for (const it of c.items)
        all.push({ id: it.id, group: c.id, d: it.d, h: labelHeightOf(cfg, it.idx, true) });
    else
      // a lone consumer beside rooms reads like a room (a normal label, centred above)
      all.push({
        id: c.id,
        group: null,
        d: c.d,
        h: labelHeightOf(cfg, c.kind === "item" ? c.idx : null, !cfg.hasGroups),
      });
    const h = labelHeightOf(cfg, c.kind === "item" ? c.idx : null, false);
    blocks.push({ id: c.kind === "group" ? c.id : null, first, last: all.length - 1, d: c.d, h });
  }
  if (rows) for (const l of all) l.d = Math.min(l.d, GEOM.rowH);
  // One pitch for every leaf, centre to centre: the most any of them asks for – a leaf's label
  // clears the leaf before it, and with rooms a room's label (centred above it) clears the room
  // before it, over the leaves between their centres
  let pitch = all.length > 1 ? (cfg.hasGroups ? GEOM.itemPitch : GEOM.consumerPitch) : 0;
  for (let i = 1; i < all.length; i++)
    pitch = Math.max(pitch, slotPitch(all[i - 1].d, all[i].d, all[i].h));
  if (cfg.hasGroups)
    for (let k = 1; k < blocks.length; k++) {
      const a = blocks[k - 1],
        b = blocks[k];
      const span = (b.first + b.last) / 2 - (a.first + a.last) / 2;
      pitch = Math.max(pitch, (a.d / 2 + b.d / 2 + b.h + 7) / span);
    }
  const step = pitch * scale;
  all.forEach((l, i) => leaves.push({ ...l, b: i * step }));
  for (const bl of blocks)
    if (bl.id) groups.push({ id: bl.id, b: ((bl.first + bl.last) / 2) * step });
  const b = all.length ? (all.length - 1) * step : 0;
  const firstLeaf = leaves[0],
    lastLeaf = leaves[leaves.length - 1];
  let first = firstLeaf ? Math.max(GEOM.consumerMargin, slotMargin(firstLeaf.d, firstLeaf.h)) : 0;
  // with rooms, the first block's label sits centred above its node in the room column
  const c0 = cfg.consumers[0];
  if (cfg.hasGroups && c0) {
    const h = labelHeightOf(cfg, c0.kind === "item" ? c0.idx : null, false);
    first = Math.max(first, c0.d / 2 + 4 + h);
  }
  const last = lastLeaf ? Math.max(GEOM.consumerMargin, lastLeaf.d / 2 + 14) : 0;
  return { leaves, groups, first, last, extent: b };
};

// direction: down – the row of sources across the top, centred over the home, and their labels
// in one line: right of the icons when every name fits there, otherwise below them, beside each
// source's line. The choice reads the names and a fixed room for the value (`valueW`: `srcValueW`
// at the default text size; `srcArrowW` more for a source that shows two values, one over the
// other), so a changing value never moves the labels. Names that do not fit are cut (`caps`),
// values never.
export type SourceSlot = "right" | "below";
export const sourceRow = (
  ds: number[],
  nws: number[],
  across: number,
  valueW: number = GEOM.srcValueW,
  // the sources that may show two values (their lines carry an arrow)
  arrows: boolean[] = [],
) => {
  const n = ds.length,
    g = GEOM.labelGap;
  // at least 44 px, and never less than two neighbours' radii (big icon_size)
  const touch = Math.max(0, ...ds.slice(1).map((d, i) => (ds[i] + d) / 2));
  const pitch =
    n < 2 ? 0 : Math.max(44, touch, Math.min(126, (across - 2 * GEOM.downMargin) / (n - 1)));
  const bs = ds.map((_, i) => across / 2 + (i - (n - 1) / 2) * pitch);
  const arrowW = (GEOM.srcArrowW * valueW) / GEOM.srcValueW;
  const want = nws.map((w, i) => Math.max(w, valueW + (arrows[i] ? arrowW : 0)));
  // right of the icon: up to the next icon; below: up to the next source's line
  const roomRight = bs.map(
    (b, i) => (i < n - 1 ? bs[i + 1] - ds[i + 1] / 2 - 8 : across - 4) - (b + ds[i] / 2 + g),
  );
  if (want.every((w, i) => w <= roomRight[i])) return { bs, slot: "right" as SourceSlot, caps: [] };
  const roomBelow = bs.map((b, i) => (i < n - 1 ? bs[i + 1] - 6 : across - 4) - (b + g));
  return {
    bs,
    slot: "below" as SourceSlot,
    caps: nws.map((w, i) => (w > roomBelow[i] ? Math.max(0, roomBelow[i]) : undefined)),
  };
};

// the diagram's extent across the flow (its height for `right`): a function of the config
export const acrossOf = (cfg: FlowTreeConfig): number => {
  const st = sourceStack(cfg);
  const srcNeed = st.first + st.extent + st.last;
  const col = columnPlan(cfg);
  // the consumer column centred on the home: as much room after it as before it, so the lanes
  // out of the home stay centred on it and the target in the middle runs straight
  const consNeed = cfg.consumers.length ? col.extent + 2 * Math.max(col.first, col.last) : 0;
  return Math.ceil(Math.max(GEOM.minAcross, srcNeed, consNeed));
};
// the columns after the sources (`down`: their positions along the flow)
const alongColumns = (cfg: FlowTreeConfig) =>
  1 + (cfg.hasGroups ? 1 : 0) + (cfg.consumers.length ? 1 : 0);
export const alongDownOf = (cfg: FlowTreeConfig): number => {
  if (!cfg.consumers.length) return GEOM.minAcross + srcAlongOf(cfg) - GEOM.srcAlong;
  // room below the consumer column for its tallest label (a secondary line adds one)
  const below = Math.max(56, ...columnPlan(cfg).leaves.map((l) => l.d / 2 + 4 + l.h + 8));
  return srcAlongOf(cfg) + GEOM.columnPitch * alongColumns(cfg) + below;
};
// the diagram's height in px for the card's size
export const diagramHeight = (cfg: FlowTreeConfig) =>
  cfg.direction === "right" ? acrossOf(cfg) : alongDownOf(cfg);

// The lane offsets into the home, mirrored above and below: a source level with the home takes
// lane 0 and the others move outward a lane at a time on their side; with none level and sources
// on both sides the lanes sit half a lane off the centre (±4, ±12 …), the nearest innermost. So
// no two lines cross, and an even column of sources meets the home as a mirrored bundle.
export const laneOffsets = (bs: number[], bH: number, pitch: number = GEOM.lane): number[] => {
  const order = bs
    .map((b, i) => ({ i, d: Math.abs(b - bH), b }))
    .sort((p, q) => p.d - q.d || p.b - q.b);
  const out = new Array<number>(bs.length).fill(0);
  const level = order.length > 0 && order[0].d < 0.5;
  const halves = !level && bs.some((b) => b < bH) && bs.some((b) => b > bH);
  let above = 0,
    below = 0;
  order.forEach((o, k) => {
    if (k === 0 && !halves) return;
    const n = o.b < bH ? ++above : ++below;
    const lanes = halves ? n - 0.5 : n;
    out[o.i] = (o.b < bH ? -1 : 1) * pitch * lanes;
  });
  return out;
};

// The lanes out of a node to its targets (the home's consumers, a room's devices), the mirror of
// the lanes into the home: each leaves the node's circle on its own lane (`laneOffsets`), and
// they turn in one block after it, every corner alike, the outermost first and each further in a
// lane later, so none crosses another. `legs` are the along positions of the turns, the first at
// `firstBend`. The lanes are a lane apart where that holds; closer where the outermost would
// leave the circle (less 4 px) or a lane's turn would pass its `maxLeg` (one for all, or one
// per target), down to `GEOM.minGap` between two lines. Null when not even that holds: the
// node's lines then share one trunk.
export const fanOut = (
  bs: number[],
  bN: number,
  r: number,
  firstBend: number,
  maxLeg: number | number[],
): { offsets: number[]; legs: number[]; pitch: number; reach: number | null } | null => {
  const unit = laneOffsets(bs, bN, 1);
  const outer = Math.max(0, ...unit.map((u) => Math.abs(u)));
  // a lane turns unless it runs straight into a target level with the node
  const turns = unit.map((u, i) => u !== 0 || Math.abs(bs[i] - bN) >= 0.5);
  let pitch: number = GEOM.lane;
  if (outer > 0) pitch = Math.min(pitch, (r - 4) / outer);
  for (let i = 0; i < bs.length; i++) {
    if (!turns[i]) continue;
    const room = (typeof maxLeg === "number" ? maxLeg : maxLeg[i]) - firstBend,
      later = outer - Math.abs(unit[i]);
    if (room < 0) return null;
    if (later > 0) pitch = Math.min(pitch, room / later);
  }
  if (outer > 0 && pitch < GEOM.lineW + GEOM.minGap) return null;
  const legs = unit.map((u) => firstBend + (outer - Math.abs(u)) * pitch);
  const turning = legs.filter((_, i) => turns[i]);
  // the last turn (null: every lane runs straight)
  const reach = turning.length ? Math.max(...turning) : null;
  return { offsets: unit.map((u) => u * pitch), legs, pitch, reach };
};

export const layoutTree = (
  cfg: FlowTreeConfig,
  width: number,
  edges: EdgeFlow[],
  sizes: LabelSizes = new Map(),
  // the height of a card with a fixed size: the tree spreads to it; less than it needs is ignored
  height = 0,
): TreeLayout => {
  const dir: Direction = cfg.direction;
  const right = dir === "right";
  const W = Math.max(1, Math.round(width));
  const natural = diagramHeight(cfg);
  const H = Math.max(natural, Math.round(height));
  const across = right ? H : W;
  const along = right ? W : H;
  const listRows = right && cfg.consumerStyle === "list" && cfg.consumers.length > 0;
  const hasCons = cfg.consumers.length > 0;
  const map = (a: number, b: number): Pt => (right ? [a, b] : [b, a]);
  const widthOf = (id: string) => sizes.get(id)?.w ?? 0;
  const leaves = leavesOf(cfg);
  // the radii the columns keep clear: the sources' (at least the default solar node's), the
  // home's, the leaves' at the far end (the devices when there are rooms) and the rooms'
  const rS = Math.max(GEOM.dSolar, ...cfg.sources.map((s) => s.d)) / 2,
    rH = cfg.homeD / 2;
  const farLeaves = leaves.filter((l) => !cfg.hasGroups || l.id.includes("."));
  const rLeaf = Math.max(...farLeaves.map((l) => l.d), farLeaves.length ? 0 : GEOM.dConsumer) / 2;
  const rRoom = Math.max(0, ...cfg.consumers.map((c) => (c.kind === "group" ? c.d : 0))) / 2;
  const maxLeafW = Math.max(0, ...farLeaves.map((l) => widthOf(l.id)));

  // ----- across positions -----
  const stack = sourceStack(cfg);
  let bS: number[];
  let srcCaps: (number | undefined)[] = [];
  let srcSlot: SourceSlot | undefined;
  if (right) {
    // the stack, spread a little when the consumers made the diagram taller, centred
    const room = across - stack.first - stack.last;
    const scale = stack.extent > 0 ? Math.max(1, Math.min(1.5, room / stack.extent)) : 1;
    const b0 = (across - stack.extent * scale) / 2;
    bS = stack.bs.map((b) => b0 + b * scale);
  } else {
    const row = sourceRow(
      cfg.sources.map((s) => s.d),
      cfg.sources.map((s) => sizes.get(s.id)?.nw ?? 0),
      across,
      (GEOM.srcValueW * linesOf(cfg).value.size) / LABEL_LINES.value.size,
      cfg.sources.map((s) => bothWays(cfg, s)),
    );
    bS = row.bs;
    srcCaps = row.caps;
    srcSlot = row.slot;
  }
  // the home sits level with the source nearest its height: that source's line runs straight in,
  // where a step of a few px would round into two tight corners that read as a crack (a source
  // two corners' radii or more off bends with room to round, and the home stays centred)
  const centre = across / 2;
  const nearest = bS.reduce(
    (k, b, i) => (k < 0 || Math.abs(b - centre) < Math.abs(bS[k] - centre) ? i : k),
    -1,
  );
  const bH =
    nearest >= 0 && Math.abs(bS[nearest] - centre) < 2 * GEOM.radius ? bS[nearest] : centre;
  // ----- along positions -----
  // direction: down – a taller card first moves the levels apart (up to half a pitch more), the
  // rest centres the tree
  const extra = right ? 0 : along - natural,
    cols = alongColumns(cfg),
    grow = hasCons ? Math.min(extra, 0.5 * GEOM.columnPitch * cols) : 0,
    levelPitch = GEOM.columnPitch + grow / cols;
  const sA = srcAlongOf(cfg);
  const aS = sA + (extra - grow) / 2;
  // the consumer column, centred across; `down` spreads it to the width
  let plan = columnPlan(cfg);
  let consTight = false;
  // the column keeps as much room after it as before it, so it can centre on the home (`down`:
  // the labels sit below the nodes, so only the nodes' room counts)
  const margin = right ? Math.max(plan.first, plan.last) : plan.last;
  if (!right && plan.extent > 0) {
    const fit = Math.max(0.6, Math.min(1.6, (across - 2 * margin) / plan.extent));
    plan = columnPlan(cfg, fit);
    const pitch = plan.leaves.length > 1 ? plan.extent / (plan.leaves.length - 1) : Infinity;
    consTight = pitch < maxLeafW + 8;
  }
  // the column centred on the home, so the consumer level with it runs straight; the margins
  // (the larger of the first label's room and the last node's, on both sides) only bound it,
  // and split the room when it is short
  const lo = margin,
    hi = across - margin - plan.extent;
  const b0 = hi < lo ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, bH - plan.extent / 2));
  // the home's targets: the room column with rooms, else the consumers
  const homeTargets = (
    cfg.hasGroups ? [...plan.groups, ...plan.leaves.filter((l) => !l.group)] : plan.leaves
  ).map((l) => l.b);
  // how far past its centre a node's lines take their last turn: the last leg of its fan of
  // lanes (a room's first turn clear of its label above it), or the trunk where they share one
  const homeFan = fanOut(
    homeTargets.map((b) => b0 + b),
    bH,
    rH,
    rH + GEOM.radius + 4,
    Infinity,
  );
  const homeTrunk = rH + 10;
  const homeReach = homeFan ? (homeFan.reach ?? rH) : homeTrunk;
  // … and with its lanes squeezed as close as they go: what a narrow card makes room for
  const minPitch = GEOM.lineW + GEOM.minGap;
  const homeReachMin =
    homeFan?.reach != null
      ? rH + GEOM.radius + 4 + ((homeFan.reach - rH - GEOM.radius - 4) * minPitch) / homeFan.pitch
      : homeReach;
  const roomFirst = (id: string, r: number) =>
    Math.max(r + GEOM.radius + 4, right ? widthOf(id) / 2 + 6 : 0);
  const roomR = (id: string) => (cfg.consumers.find((c) => c.id === id)?.d ?? GEOM.dGroup) / 2;
  const roomTrunk = Math.max(
    0,
    ...plan.groups.map((g) => Math.max(roomR(g.id) + 10, widthOf(g.id) / 2 + 6)),
  );
  const roomReach = Math.max(
    roomTrunk,
    ...plan.groups.map((g) => {
      const devs = plan.leaves.filter((l) => l.group === g.id).map((l) => b0 + l.b);
      const fan = fanOut(devs, b0 + g.b, roomR(g.id), roomFirst(g.id, roomR(g.id)), Infinity);
      return fan?.reach ?? 0;
    }),
  );
  let aH: number, aG: number, aC: number, aRow: number;
  // the sources whose labels' names are cut to the room before the home (narrow, with rooms)
  const srcCut = new Map<string, number>();
  // the devices' labels go below them: the rooms' labels cannot sit beside their values
  let under = false;
  const roomW = Math.max(0, ...cfg.consumers.map((c) => (c.kind === "group" ? widthOf(c.id) : 0)));
  if (right) {
    // the home column clears the source labels; the columns keep a least distance on narrow
    // cards and spread on wide ones
    // only a source label in the home's band (beside it, above its line) must clear the home –
    // and the block where the lanes turn into it, between the label and the home
    const bandH = [bH - rH - 2, bH + rH + 2];
    const turns = Math.max(0, ...laneOffsets(bS, bH).map((o) => Math.abs(o))) + GEOM.radius + 4 + 4;
    // where the home clears a label of width w beside the source column
    const clearFor = (w: number) => aS + rS + GEOM.labelGap + w + 3 + turns + rH;
    const inBand = cfg.sources.map((s, i) => {
      const h = srcLabelHeight(cfg, s),
        mid = bS[i] - s.d / 2 - 4;
      return mid + h / 2 > bandH[0] && mid - h / 2 < bandH[1];
    });
    const band = cfg.sources.filter((_, i) => inBand[i]);
    const fullClear = Math.max(0, ...band.map((s) => clearFor(widthOf(s.id))));
    const valueClear = Math.max(0, ...band.map((s) => clearFor(sizes.get(s.id)?.vw ?? 0)));
    aC = along - (rLeaf + 14);
    // the room column: its labels sit centred above the rooms, right of the home's trunk
    const maxRoomW = Math.max(
      0,
      ...cfg.consumers.map((c) => (c.kind === "group" || cfg.hasGroups ? widthOf(c.id) : 0)),
    );
    // the devices' values are never cut: their room beside a room's label always holds
    const maxLeafVW = Math.max(0, ...farLeaves.map((l) => sizes.get(l.id)?.vw ?? 0));
    const values = aC - rLeaf - GEOM.labelGap - maxLeafVW - 6 - maxRoomW / 2;
    // On a narrow card the home moves left as far as its lanes out need (squeezed as close as
    // they go) to turn before the rooms' labels, beside the devices' values, or before the
    // consumers' labels: a source label beside it then keeps its value and has its name cut
    // (never the value) rather than the lanes merging into a trunk
    const lanesClear =
      listRows || !hasCons || (homeFan && homeFan.reach === null)
        ? Infinity
        : cfg.hasGroups
          ? values - maxRoomW / 2 - 6 - homeReachMin - 6
          : aC - rLeaf - GEOM.labelGap - maxLeafW - 6 - homeReachMin;
    const clearH = Math.max(valueClear, Math.min(fullClear, lanesClear));
    const minH = Math.max(aS + rS + 40, clearH);
    if (!hasCons) aH = Math.max(along - 44, minH);
    else if (listRows) aH = Math.max(minH, along * (cfg.hasGroups ? 0.3 : 0.42));
    else if (cfg.hasGroups) aH = Math.max(minH, along * 0.38);
    // the consumers' lanes turn before their labels: the home moves left for them where it can
    else
      aH = Math.max(
        minH,
        Math.min(
          along * 0.5,
          homeFan?.reach == null ? Infinity : lanesClear + homeReachMin - homeReach,
        ),
      );
    aH = Math.min(aH, along - rH - 2);
    // a source label beside the home that it does not clear in full: its name cut to the room
    for (const s of band) {
      const room = aH - (clearFor(0) - aS - rS - GEOM.labelGap) - (aS + rS + GEOM.labelGap);
      if (widthOf(s.id) > room) srcCut.set(s.id, Math.max(0, room));
    }
    aG = listRows ? aH + Math.max(55, along * 0.16) : aH + (aC - aH) * 0.36;
    if (cfg.hasGroups) {
      // … and left of the device labels where both hold; where they cannot, the rooms win (a
      // label over the trunk would cut its line) and the devices' names are cut to their room
      // (placeLabels), the column staying left of the devices
      // (list rows keep their width: there the home's lanes take the room the column leaves)
      const lower = aH + (listRows ? homeTrunk : homeReach) + 6 + maxRoomW / 2 + 6;
      const upper = aC - rLeaf - GEOM.labelGap - maxLeafW - 6 - maxRoomW / 2;
      // not even the devices' values hold beside the rooms' labels: the devices take their labels
      // below them, centred between their rooms' forks and the card's edge (whole where that
      // holds them), and the rooms' labels clear the trunk – where that leaves the values room
      // (with the lanes out of the home and the rooms where they fit, else their trunks)
      const underFor = (homeOut: number, roomOut: number) => {
        const aGU = Math.max(
          aH + rH + 26,
          Math.min(aH + homeOut + 6 + roomW / 2 + 6, aC - rLeaf - rRoom - 12),
        );
        const fork = aGU + roomOut + 4;
        const aCU = Math.min(
          aC,
          along - fork >= maxLeafW ? along - maxLeafW / 2 - 1 : (fork + along) / 2,
        );
        return 2 * Math.min(along - aCU, aCU - fork) >= maxLeafVW ? { aGU, aCU } : null;
      };
      // … and the labels below the devices clear the next device and the bottom (the height
      // follows the config, so this holds at any width)
      const devs = plan.leaves.filter((l) => l.group);
      const below = devs.every((l, i) => {
        const end = b0 + l.b + l.d / 2 + 4 + (sizes.get(l.id)?.h ?? 0),
          next = devs[i + 1];
        return next ? end + 3 <= b0 + next.b - next.d / 2 - 2 : end <= across + 4;
      });
      // (the rooms' labels beside the devices' values even with the home's lines in one trunk)
      const tight = aH + homeTrunk + 6 + maxRoomW / 2 + 6 > values;
      const u =
        !listRows && tight && below
          ? (underFor(homeReach, roomReach) ??
            underFor(homeTrunk, roomReach) ??
            underFor(homeTrunk, roomTrunk))
          : null;
      if (u) {
        under = true;
        aG = u.aGU;
        aC = u.aCU;
      } else {
        aG = Math.max(aG, lower) <= upper ? Math.max(aG, lower) : Math.max(upper, lower);
        aG = Math.max(aH + rH + 26, Math.min(aG, values, aC - rLeaf - rRoom - 12));
      }
    }
    aRow = cfg.hasGroups ? aG + Math.max(50, along * 0.18) : Math.max(aH + 80, along * 0.62);
    if (listRows) aC = aRow;
  } else {
    aH = hasCons ? aS + levelPitch : aS + natural - 44 - sA;
    aG = aH + levelPitch;
    aC = aH + levelPitch * (cfg.hasGroups ? 2 : 1);
    aRow = aC;
  }

  const nodes: LNode[] = [];
  const rows: LRow[] = [];
  const byId = new Map<string, LNode>();
  const add = (id: string, kind: NodeKind, idx: number | null, d: number, a: number, b: number) => {
    const [x, y] = map(a, b);
    const column: LNode["column"] =
      kind === "home"
        ? "home"
        : kind === "group"
          ? "group"
          : idx !== null && id.startsWith("s")
            ? "source"
            : "leaf";
    const nd: LNode = { id, kind, idx, x, y, d, column };
    nodes.push(nd);
    byId.set(id, nd);
    return nd;
  };
  cfg.sources.forEach((s, i) => {
    const nd = add(s.id, s.kind, s.idx, s.d, aS, bS[i]);
    nd.labelMax = srcCaps[i] ?? srcCut.get(s.id);
    nd.slot = srcSlot;
  });
  add("home", "home", cfg.homeIdx, cfg.homeD, aH, bH);

  const leafKind = (id: string): NodeKind => (id === "other" ? "other" : "consumer");
  // with the devices' labels below them (direction: right), where a room's line forks to its
  // devices: near the room, clear of its label
  const forkOf = (room: LNode) =>
    Math.max(room.x + room.d / 2 + 10, room.x + widthOf(room.id) / 2 + 6);
  for (const g of plan.groups) {
    const grp = cfg.consumers.find((c) => c.id === g.id);
    add(g.id, "group", null, grp ? grp.d : GEOM.dGroup, aG, b0 + g.b);
  }
  // the devices whose labels go below them, by their room
  const underRoom = new Map<LNode, LNode>();
  plan.leaves.forEach((lf, k) => {
    const leaf = leaves.find((l) => l.id === lf.id);
    const idx = leaf && leaf.kind === "item" ? leaf.idx : null;
    // with rooms, a device of its own (and the other node) sits in the room column, fed by the
    // home like a room, so its line never crosses a room's
    const asRoom = cfg.hasGroups && !lf.group;
    if (listRows) {
      const a0 = asRoom ? aG - rRoom : aRow;
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
        column: asRoom ? "group" : "leaf",
      });
    } else {
      const kind = leafKind(lf.id);
      const nd = add(lf.id, kind, idx, lf.d, asRoom ? aG : aC, b0 + lf.b);
      if (asRoom) nd.column = "group";
      const room = lf.group ? byId.get(lf.group) : undefined;
      if (under && room) {
        nd.under = true;
        underRoom.set(nd, room);
      }
      if (consTight) {
        // every label centred below its node, its name cut to its room: of the gap to a
        // neighbour, the neighbour keeps half (less when its label is narrower, more when its
        // value is wider: values are never cut) and the rest, less the labels' 3 px spacing and
        // a pixel of rounding, is this one's; the edges bound it as well
        const b = b0 + lf.b,
          prev = plan.leaves[k - 1],
          next = plan.leaves[k + 1];
        const side = (gap: number, id: string) =>
          gap - Math.max(sizes.get(id)?.vw ?? 0, Math.min(widthOf(id), gap)) / 2 - 4;
        nd.labelMax =
          2 *
          Math.min(
            prev ? side(lf.b - prev.b, prev.id) : Infinity,
            next ? side(next.b - lf.b, next.id) : Infinity,
            b,
            across - b,
          );
      }
    }
  });

  // ----- edges -----
  const out: LEdge[] = [];
  const A = (nd: LNode) => (right ? nd.x : nd.y),
    Bof = (nd: LNode) => (right ? nd.y : nd.x);
  const leafW = Math.max(
    0,
    ...plan.leaves.map((l) => (byId.get(l.id)?.column === "leaf" ? widthOf(l.id) : 0)),
  );
  // a target's label slot beside the leg of a lane (direction: right): a room's centred above
  // it, a device's left of it above its line – the heights it spans and its left edge
  const slotOf = (to: LNode): [number, number, number] | null => {
    if (!right || to.d === 0) return null;
    const h = sizes.get(to.id)?.h ?? 0;
    if (to.column === "group")
      return [to.y - to.d / 2 - 4 - h, to.y - to.d / 2 - 4, to.x - widthOf(to.id) / 2];
    if (to.column !== "leaf" || under) return null;
    const rise = slotRise(to.d, h);
    return [
      to.y - rise - h / 2,
      to.y - rise + h / 2,
      to.x - to.d / 2 - GEOM.labelGap - widthOf(to.id),
    ];
  };
  // the last turn a lane to each target may take: room for its corner into the target, and
  // clear of every label slot beside the run of its leg (the labels' 3 px, the line's 3)
  const legLimits = (from: LNode, targets: LNode[]) => {
    const slots = targets.map(slotOf);
    return targets.map((to) => {
      const lo = Math.min(Bof(from) - from.d / 2, Bof(to)),
        hi = Math.max(Bof(from) + from.d / 2, Bof(to));
      let m = A(to) - to.d / 2 - GEOM.radius - 4;
      for (const sl of slots)
        if (sl && sl[0] < hi + 3 && sl[1] > lo - 3) m = Math.min(m, sl[2] - 6);
      return m;
    });
  };
  // the lanes out of the home and out of each room, by target (null: the lines share a trunk)
  const fans = new Map<string, Map<string, { off: number; leg: number }> | null>();
  const fanOf = (from: LNode) => {
    const known = fans.get(from.id);
    if (known !== undefined) return known;
    const targets = [...new Set(edges.filter((e) => e.from === from.id).map((e) => e.to))]
      .map((id) => byId.get(id))
      .filter((n): n is LNode => !!n && n.column !== "source");
    const r = from.d / 2;
    const first = A(from) + (from.kind === "group" ? roomFirst(from.id, r) : r + GEOM.radius + 4);
    const fan = fanOut(targets.map(Bof), Bof(from), r, first, legLimits(from, targets));
    const lanes = fan
      ? new Map(targets.map((t, i) => [t.id, { off: fan.offsets[i], leg: fan.legs[i] }]))
      : null;
    fans.set(from.id, lanes);
    return lanes;
  };
  // a device's label below it: its name cut to the room between its room's last turn and the
  // card's edge
  for (const [nd, room] of underRoom) {
    const lanes = fanOf(room);
    const last = lanes ? Math.max(...[...lanes.values()].map((l) => l.leg)) : forkOf(room);
    nd.labelMax = 2 * Math.min(along - aC, aC - last - 3 - 1);
  }
  const offsets = laneOffsets(bS, bH);
  // a source's lane by its id (its position in the drawn column, not its config index)
  const srcPos = new Map(cfg.sources.map((s, i) => [s.id, i]));
  // The lanes turn into the home in one block right before it, mirrored above and below: every
  // corner the same radius, the vertical legs a lane apart, the outermost lane turning last
  // (so none crosses another) with room left for its corner before the home's circle. Late
  // turns leave a source's label room beside its node on a narrow card.
  const outer = Math.max(0, ...offsets.map((o) => Math.abs(o) / GEOM.lane));
  const lastBend = aH - rH - GEOM.radius - 4;
  const bendAt = (off: number) =>
    Math.max(aS + rS + GEOM.radius, lastBend - (outer - Math.abs(off) / GEOM.lane) * GEOM.lane);
  // the trunk sits nearer its origin and clears the labels left of the targets
  const trunkOf = (from: LNode, to: LNode) => {
    const a0 = A(from) + from.d / 2,
      a1 = A(to) - to.d / 2;
    let t = a0 + (a1 - a0) * (from.kind === "group" ? 0.25 : 0.4);
    // a room's label sits centred above it: the trunk stays left of that label
    if (to.column === "group" && to.d > 0) t = Math.min(t, A(to) - widthOf(to.id) / 2 - 6);
    if (to.column === "leaf" && to.d > 0 && under) return forkOf(from);
    if (to.column === "leaf" && to.d > 0) t = Math.min(t, a1 - GEOM.labelGap - leafW - 6);
    return Math.max(t, a0 + 10);
  };
  edges.forEach((e, fi) => {
    const from = byId.get(e.from),
      to = byId.get(e.to);
    // a link of a hidden node is not drawn
    if (!from || !to) return;
    let pts: Pt[];
    if (e.to === "home") {
      const off = offsets[srcPos.get(e.from) ?? -1] ?? 0;
      const aBend = bendAt(off);
      const b = bH + off;
      // a lane off the home's centre line ends on its circle, not short of it
      const aEnd = aH - Math.sqrt(Math.max(0, rH * rH - (b - bH) ** 2));
      pts = [
        map(A(from) + from.d / 2, Bof(from)),
        map(aBend, Bof(from)),
        map(aBend, b),
        map(aEnd, b),
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
    } else if (fanOf(from)?.has(to.id)) {
      // its own lane out of the node's circle, turning in the node's block
      const lane = fanOf(from)!.get(to.id)!;
      const b = Bof(from) + lane.off,
        r = from.d / 2;
      pts = [
        map(A(from) + Math.sqrt(Math.max(0, r * r - lane.off ** 2)), b),
        map(lane.leg, b),
        map(lane.leg, Bof(to)),
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
      // its flow's index: the flows are the same for one config whatever the values, so a link
      // keeps its id (and its drawn lane) when another node is hidden
      id: `e${fi}`,
      fi,
      from: e.from,
      to: e.to,
      kind: e.kind,
      pts,
      d: orthoPath(pts, GEOM.radius),
      len: pathLength(pts),
    });
  });

  const [w, h] = right ? [along, across] : [across, along];
  return {
    w,
    h,
    nodes,
    edges: out,
    rows,
  };
};
