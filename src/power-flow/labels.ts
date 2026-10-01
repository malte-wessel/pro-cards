// Label placement (pure): every node's label (value over name) is tried at a few places around
// its node, in an order that suits the node's kind and the flow direction, and takes the first
// that overlaps no line, node, row or placed label and stays inside the diagram.
import type { Direction } from "./constants.ts";
import { GEOM } from "./constants.ts";
import { slotRise, type LNode, type TreeLayout } from "./layout.ts";
import { segmentsOf, type Seg } from "./path.ts";

export type Align = "l" | "r" | "c"; // left edge at x, right edge at x, centred on x
export interface LabelSize {
  id: string; // node id
  w: number;
  h: number;
}
export interface PlacedLabel extends LabelSize {
  x: number;
  y: number;
  align: Align;
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

// the candidate places of a label, best first
const candidates = (nd: LNode, dir: Direction, h: number): Cand[] => {
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
    // a second row below (direction: down, a narrow row of sources)
    belowRight2: Cand = [x + g, y + r + 4 + h * 1.5 + 4, "l"],
    belowLeft2: Cand = [x - g, y + r + 4 + h * 1.5 + 4, "r"];
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
    belowRight2,
    belowLeft2,
  ];
  let pref: Cand[];
  if (dir === "right") {
    if (nd.kind === "home") pref = [below, above, rightMid];
    else if (nd.kind === "group" || nd.column === "group") pref = [above, below];
    else if (nd.kind === "consumer" || nd.kind === "other")
      pref = [leftAbove, leftBelow, rightMid, below, above];
    else pref = [rightAbove, rightBelow, rightMid, leftAbove, leftBelow];
  } else {
    if (nd.kind === "home") pref = [rightMid, leftMid, belowRight, belowLeft];
    else if (nd.kind === "group" || nd.column === "group")
      pref = [rightMid, leftMid, belowRight, belowLeft];
    else if (nd.kind === "consumer" || nd.kind === "other")
      // a narrow column: every other label goes above instead
      pref = nd.tight && nd.alt ? [aboveRight, aboveLeft, below] : [below, above];
    else if (nd.tight)
      // a narrow row of sources: the labels go beside the vertical lines, in two rows
      pref = nd.alt ? [belowRight2, belowLeft2, belowRight] : [belowRight, belowLeft, belowRight2];
    else pref = [rightMid, leftMid, belowRight, belowLeft, aboveRight, aboveLeft];
  }
  return pref.concat(all.filter((c) => !pref.includes(c)));
};

export const placeLabels = (
  layout: TreeLayout,
  sizes: LabelSize[],
  dir: Direction,
  hiddenEdges: ReadonlySet<string> = new Set(),
): PlacedLabel[] => {
  // a hidden idle link frees its space
  const segs = layout.edges
    .filter((e) => !hiddenEdges.has(e.id))
    .flatMap((e) => segmentsOf(e.pts).map((s) => segBox(s, 3)));
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
  const out: PlacedLabel[] = [];
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
    const cands = candidates(nd, dir, s.h);
    let pick = cands.find((c) => ok(boxOf(c[0], c[1], c[2], s.w, s.h)));
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
    out.push({ ...s, x: Math.round(x), y: Math.round(y), align });
  }
  return out;
};
