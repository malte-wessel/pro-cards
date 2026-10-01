// SVG path helpers of the tree (pure): orthogonal polylines with rounded corners, their length,
// the arcs of the rings and the segments a label must keep clear of.
export type Pt = [number, number];
export type Seg = [Pt, Pt];

const f = (n: number) => (Math.round(n * 10) / 10).toString();

// a polyline of horizontal and vertical legs, every corner rounded by `r` (less when a leg is short)
export const orthoPath = (pts: Pt[], r: number): string => {
  if (pts.length === 0) return "";
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1],
      [px, py] = pts[i],
      [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(px - ax, py - ay),
      l2 = Math.hypot(cx - px, cy - py);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) {
      d += ` L${f(px)} ${f(py)}`;
      continue;
    }
    const ix = px - ((px - ax) / l1) * rr,
      iy = py - ((py - ay) / l1) * rr;
    const ox = px + ((cx - px) / l2) * rr,
      oy = py + ((cy - py) / l2) * rr;
    d += ` L${f(ix)} ${f(iy)} Q${f(px)} ${f(py)} ${f(ox)} ${f(oy)}`;
  }
  const e = pts[pts.length - 1];
  if (pts.length > 1) d += ` L${f(e[0])} ${f(e[1])}`;
  return d;
};

export const pathLength = (pts: Pt[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++)
    L += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
  return L;
};

export const segmentsOf = (pts: Pt[]): Seg[] => {
  const out: Seg[] = [];
  for (let i = 1; i < pts.length; i++) out.push([pts[i - 1], pts[i]]);
  return out;
};

// drops points that repeat their neighbour (a lane that collapsed to a straight line)
export const dedupe = (pts: Pt[]): Pt[] => {
  const out: Pt[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && last[0] === p[0] && last[1] === p[1]) continue;
    // three points on one line: drop the middle one
    const prev = out[out.length - 2];
    if (
      prev &&
      last &&
      ((prev[0] === last[0] && last[0] === p[0]) || (prev[1] === last[1] && last[1] === p[1]))
    )
      out.pop();
    out.push(p);
  }
  return out;
};

// an arc of the circle (cx, cy, r) from angle a0 to a1 (radians, 0 = up, clockwise)
export const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number): string => {
  const p = (a: number): Pt => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  if (a1 - a0 >= 2 * Math.PI - 1e-6) {
    // a full circle: two half arcs (one arc back to its start draws nothing)
    const [x0, y0] = p(a0),
      [xm, ym] = p(a0 + Math.PI);
    return `M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 1 1 ${f(xm)} ${f(ym)} A${f(r)} ${f(r)} 0 1 1 ${f(x0)} ${f(y0)}`;
  }
  const [x0, y0] = p(a0),
    [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 ${large} 1 ${f(x1)} ${f(y1)}`;
};

// the arcs of a ring split by fractions (sum ≤ 1): [{ start, end }] in radians, with a gap between
// two visible arcs; a single full arc gets no gap
export const ringArcs = (fractions: number[], r: number, gapPx = 2.2) => {
  const act = fractions.map((v, i) => ({ v, i })).filter((x) => x.v > 0.004);
  const gap = act.length > 1 ? gapPx / r : 0;
  const out: { i: number; a0: number; a1: number }[] = [];
  let at = 0;
  for (const { v, i } of act) {
    const span = Math.max(0.01, v * 2 * Math.PI - gap);
    out.push({ i, a0: at + gap / 2, a1: at + gap / 2 + span });
    at += v * 2 * Math.PI;
  }
  return out;
};
