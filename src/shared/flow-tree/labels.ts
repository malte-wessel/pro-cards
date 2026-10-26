// Label placement (pure): every node's label (value over name) is tried at a few places around
// its node, in an order that suits the node's kind and the flow direction, and takes the first
// that overlaps no line, node, row or placed label and stays inside the diagram. A label with
// two values may have a second shape, both values in one line (`alt`): it takes that one where it
// finds a place at least as good as the stacked one's.
import type { Direction } from "./constants.ts";
import { GEOM } from "./constants.ts";
import { slotRise, type LNode, type TreeLayout } from "./layout.ts";
import { segmentsOf, type Seg } from "./path.ts";

export type Align = "l" | "r" | "c"; // left edge at x, right edge at x, centred on x
export interface LabelSize {
  id: string; // node id
  w: number;
  h: number;
  alt?: { w: number; h: number }; // the two values in one line: wider, a line lower
  vw?: number; // the value line's width: a device's name may be cut down to it, never further
}
export interface PlacedLabel extends LabelSize {
  x: number;
  y: number;
  align: Align;
  inline: boolean; // placed in its `alt` shape
  cut?: number; // the width its name was cut to, to make room for a room's label
}
type Box = [number, number, number, number]; // x1 y1 x2 y2
type Cand = [number, number, Align];

const boxOf = (x: number, y: number, align: Align, w: number, h: number): Box => {
  const left = align === "l" ? x : align === "r" ? x - w : x - w / 2;
  const top = align === "c" ? y : y - h / 2;
  return [left, top, left + w, top + h];
};
const hits = (a: Box, b: Box, pad = 0) =>
  a[0] < b[2] + pad && a[2] > b[0] - pad && a[1] < b[3] + pad && a[3] > b[1] - pad;
const segBox = (s: Seg, pad: number): Box => [
  Math.min(s[0][0], s[1][0]) - pad,
  Math.min(s[0][1], s[1][1]) - pad,
  Math.max(s[0][0], s[1][0]) + pad,
  Math.max(s[0][1], s[1][1]) + pad,
];

// the row of source labels (direction: down): the tallest label and the largest icon radius
interface Row {
  h: number;
  r: number;
}
// the candidate places of a label, best first
const candidates = (nd: LNode, dir: Direction, h: number, row: Row): Cand[] => {
  const r = nd.d / 2,
    g = GEOM.labelGap,
    x = nd.x,
    y = nd.y,
    rise = slotRise(nd.d, h); // beside the node, clear of its line
  const rightAbove: Cand = [x + r + g, y - rise, "l"],
    rightBelow: Cand = [x + r + g, y + rise, "l"],
    rightMid: Cand = [x + r + g, y, "l"],
    leftAbove: Cand = [x - r - g, y - rise, "r"],
    leftBelow: Cand = [x - r - g, y + rise, "r"],
    leftMid: Cand = [x - r - g, y, "r"],
    below: Cand = [x, y + r + 4, "c"],
    above: Cand = [x, y - r - 4 - h, "c"],
    // beside a vertical line leaving the node (direction: down)
    belowRight: Cand = [x + g, y + r + 4 + h / 2, "l"],
    belowLeft: Cand = [x - g, y + r + 4 + h / 2, "r"],
    aboveRight: Cand = [x + g, y - r - 4 - h / 2, "l"],
    aboveLeft: Cand = [x - g, y - r - 4 - h / 2, "r"],
    // a source's label, its top level with the others' (direction: down): the values in a line,
    // right of the icons or below them, beside the line
    rowRight: Cand = [x + r + g, y - row.h / 2 + h / 2, "l"],
    rowBelow: Cand = [x + g, y + row.r + 4 + h / 2, "l"];
  const all = [
    rightAbove,
    rightBelow,
    leftAbove,
    leftBelow,
    below,
    above,
    rightMid,
    leftMid,
    belowRight,
    belowLeft,
    aboveRight,
    aboveLeft,
  ];
  let pref: Cand[];
  if (dir === "right") {
    if (nd.kind === "home") pref = [below, above, rightMid];
    else if (nd.kind === "group" || nd.column === "group") pref = [above, below];
    else if (nd.under) pref = [below, above];
    else if (nd.kind === "consumer" || nd.kind === "other")
      pref = [leftAbove, leftBelow, rightMid, below, above];
    else pref = [rightAbove, rightBelow, rightMid, leftAbove, leftBelow];
  } else {
    if (nd.kind === "home") pref = [rightMid, leftMid, belowRight, belowLeft];
    else if (nd.kind === "group" || nd.column === "group")
      pref = [rightMid, leftMid, belowRight, belowLeft];
    else if (nd.kind === "consumer" || nd.kind === "other") pref = [below, above];
    // a source: where the row put its labels, the names cut to fit
    else return [nd.slot === "below" ? rowBelow : rowRight];
  }
  return pref.concat(all.filter((c) => !pref.includes(c)));
};

export const placeLabels = (
  layout: TreeLayout,
  sizes: LabelSize[],
  dir: Direction,
): PlacedLabel[] => {
  // every link, hidden idle ones too: a label keeps its place when a link switches on or off
  const segs = layout.edges.flatMap((e) => segmentsOf(e.pts).map((s) => segBox(s, 3)));
  const nodeBoxes = layout.nodes
    .filter((n) => n.d > 0)
    .map((n): Box => [n.x - n.d / 2 - 2, n.y - n.d / 2 - 2, n.x + n.d / 2 + 2, n.y + n.d / 2 + 2]);
  const rowBoxes = layout.rows.map((r): Box => [r.x, r.y, r.x + r.w, r.y + r.h]);
  const placed: Box[] = [];
  const inside = (b: Box) =>
    b[0] >= -2 && b[2] <= layout.w + 2 && b[1] >= -4 && b[3] <= layout.h + 4;
  const ok = (b: Box) =>
    inside(b) &&
    !segs.some((s) => hits(b, s)) &&
    !nodeBoxes.some((n) => hits(b, n)) &&
    !rowBoxes.some((r) => hits(b, r)) &&
    !placed.some((p) => hits(b, p, 3));
  const sources = layout.nodes.filter((n) => n.column === "source");
  const row: Row = {
    h: Math.max(0, ...sizes.filter((s) => sources.some((n) => n.id === s.id)).map((s) => s.h)),
    r: Math.max(0, ...sources.map((n) => n.d / 2)),
  };
  const out: PlacedLabel[] = [];
  // The device labels a box would need cut to clear it (by their place, the width each keeps),
  // or null when anything else is in the way or a cut would reach a value: only labels left of
  // their nodes (right-aligned) with a value width shrink, and their left edges move right.
  const cutsFor = (b: Box): [number, number][] | null => {
    if (!inside(b) || segs.some((x) => hits(b, x)) || nodeBoxes.some((x) => hits(b, x)))
      return null;
    if (rowBoxes.some((x) => hits(b, x))) return null;
    const cuts: [number, number][] = [];
    for (let k = 0; k < placed.length; k++) {
      if (!hits(b, placed[k], 3)) continue;
      const o = out[k],
        nd = layout.nodes.find((n) => n.id === o.id);
      if (o.align !== "r" || o.vw === undefined || nd?.column !== "leaf") return null;
      const w = placed[k][2] - (b[2] + 3);
      if (w < o.vw || placed[k][2] <= b[2]) return null;
      cuts.push([k, w]);
    }
    return cuts.length ? cuts : null;
  };
  // the home and the sources first, then the devices (one tight slot each), then the rooms and
  // the consumers beside them (their labels have room above and below)
  const order = (id: string) => {
    const nd = layout.nodes.find((n) => n.id === id);
    if (!nd) return 9;
    if (nd.kind === "home") return 0;
    if (nd.column === "source") return 1;
    if (nd.column === "leaf") return 2;
    return 3;
  };
  for (const s of [...sizes].sort((p, q) => order(p.id) - order(q.id))) {
    const nd = layout.nodes.find((n) => n.id === s.id);
    if (!nd) continue;
    // the two values in one line where that finds a place as good as stacked or better (the
    // candidates follow the label's height, so each shape has its own)
    if (s.alt) {
      const alt = s.alt;
      const stacked = candidates(nd, dir, s.h, row).findIndex((c) =>
        ok(boxOf(c[0], c[1], c[2], s.w, s.h)),
      );
      const flat = candidates(nd, dir, alt.h, row);
      const i = flat.findIndex((c) => ok(boxOf(c[0], c[1], c[2], alt.w, alt.h)));
      if (i >= 0 && (stacked < 0 || i <= stacked)) {
        const [x, y, align] = flat[i];
        placed.push(boxOf(x, y, align, alt.w, alt.h));
        out.push({ ...s, ...alt, x: Math.round(x), y: Math.round(y), align, inline: true });
        continue;
      }
    }
    const cands = candidates(nd, dir, s.h, row);
    let pick = cands.find((c) => ok(boxOf(c[0], c[1], c[2], s.w, s.h)));
    // A room's label with no free place: the first of its places that only device labels left
    // of their nodes block, whose names are cut to clear it – never their values
    if (!pick && nd.column === "group") {
      for (const c of cands) {
        const b = boxOf(c[0], c[1], c[2], s.w, s.h);
        const cuts = cutsFor(b);
        if (!cuts) continue;
        for (const [k, w] of cuts) {
          placed[k] = [placed[k][2] - w, placed[k][1], placed[k][2], placed[k][3]];
          out[k] = { ...out[k], w, cut: w };
        }
        pick = c;
        break;
      }
    }
    if (!pick) {
      // least overlap when nothing is free
      let best = Infinity;
      for (const c of cands) {
        const b = boxOf(c[0], c[1], c[2], s.w, s.h);
        if (!inside(b)) continue;
        const n =
          segs.filter((x) => hits(b, x)).length +
          nodeBoxes.filter((x) => hits(b, x)).length * 3 +
          rowBoxes.filter((x) => hits(b, x)).length * 3 +
          placed.filter((x) => hits(b, x, 3)).length * 2;
        if (n < best) {
          best = n;
          pick = c;
        }
      }
      pick ??= cands[0];
    }
    const [x, y, align] = pick;
    placed.push(boxOf(x, y, align, s.w, s.h));
    out.push({ ...s, x: Math.round(x), y: Math.round(y), align, inline: false });
  }
  return out;
};
