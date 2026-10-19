// The 3D view, pure geometry: the sky as a see-through dome around a small box house, seen from
// slightly above (orthographic, tilted down by SCENE.tilt, orbiting with `camera`). Everything is
// path data in a px box as wide as the column (sceneBox), so the labels keep their size.
import { lineScale, PATH_STEP, SCENE, type Roof } from "./constants.ts";
import { houseSolid, type P3 } from "./house.ts";
import { trackOf, type TrackPoint } from "./track.ts";
import type { SunDay, SunSample } from "./day.ts";
import type { Side } from "./sides.ts";

const RAD = Math.PI / 180;
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
type V3 = [number, number, number];
type Pt = [number, number, number]; // screen x, screen y, depth (positive = towards the viewer)
const P = (p: Pt | [number, number]) => `${f1(p[0])} ${f1(p[1])}`;

export interface SceneFace {
  d: string;
  roof: boolean; // a roof plane (else a wall)
  lit: boolean;
  incidence: number; // 0..1, how directly the sun hits it
  shade: number; // 0..1, how much it turns away from the soft light from the viewer's upper left
}
export interface SceneGeometry {
  w: number;
  h: number;
  k: number; // the line scale: strokes and dots follow the sphere's size
  dome: string;
  domeArc: string;
  ground: string;
  groundTicks: string;
  horizonFront: string;
  horizonBack: string;
  pole: string; // a straight pole at the house, up from the roof
  poleTop: [number, number];
  cardinals: { bearing: number; x: number; y: number }[]; // those on the far half left out
  pathFrontPast: string;
  pathFrontFuture: string;
  pathBackPast: string;
  pathBackFuture: string;
  track: TrackPoint[]; // the day's path above the horizon on screen with its times (hover preview)
  faces: SceneFace[]; // the visible walls and roof planes (a convex house: they never overlap)
  shadow: string;
  ray: string; // on the ground, from the house to under the sun
  drop: string; // from the sun down to the ground
  sun: [number, number] | null; // null below the horizon
  groundDot: [number, number] | null;
  chip: [number, number] | null; // where the elevation chip sits (right of the drop line's middle)
  cardinalLines: string; // on the ground, from the house to the N, E, S and W ticks
  azArc: string; // on the ground, from north clockwise round to the sun's bearing
  azChip: [number, number] | null; // where the azimuth chip sits (on the arc's bisector)
}

const { tilt: TILT, houseHalf: HH, houseHeight: HZ, labelGap: GAP } = SCENE;
// the ridge of a pitched roof over the middle of the house
const HR = HZ + HH * 0.75;
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v: V3) => {
  const n = Math.hypot(...v) || 1;
  return v.map((c) => c / n) as V3;
};

// the box for a column `width` px wide: the sphere at maxScale, centred; in a column too narrow for
// it, the largest sphere whose E / W labels still fit beside it, so it fills the width, never below
// minScale (the box is then wider than the column and the
// SVG shrinks to fit). A card of a fixed height (grid_options.rows) also passes the `height` there
// is: the sphere then shrinks until the dome and the ground's labels fit it too
export const sceneBox = (width: number, height = Infinity) => {
  const byHeight = (height - SCENE.top - GAP - SCENE.bottom) / (1 + Math.sin(TILT * RAD));
  const scale = Math.floor(
    Math.max(SCENE.minScale, Math.min(SCENE.maxScale, width / 2 - GAP - SCENE.side, byHeight)),
  );
  const w = Math.max(Math.round(width), Math.ceil(2 * (scale + GAP + SCENE.side)));
  const cy = SCENE.top + scale;
  const h = Math.round(cy + scale * Math.sin(TILT * RAD) + GAP + SCENE.bottom);
  return { w, h, scale, cx: w / 2, cy };
};

export const sceneGeometry = (
  day: SunDay,
  now: SunSample,
  lat: number,
  front: number, // the bearing the house's front faces
  camera: number,
  sides: Side[],
  width: number,
  roof: Roof = "gable",
  height = Infinity, // a card of a fixed height: the room there is for the scene
): SceneGeometry => {
  const { w, h, scale: SC, cx: GX, cy: GY } = sceneBox(width, height);
  const view = camera * RAD,
    tilt = TILT * RAD;
  // world → screen: x east, y north, z up; the camera sits at bearing `camera`, looking inward
  const pj = (x: number, y: number, z: number): Pt => {
    const xr = x * Math.cos(view) - y * Math.sin(view),
      yr = x * Math.sin(view) + y * Math.cos(view);
    return [
      GX + xr * SC,
      GY - (z * Math.cos(tilt) + yr * Math.sin(tilt)) * SC,
      -yr * Math.cos(tilt) + z * Math.sin(tilt),
    ];
  };
  // a sky direction as a unit vector
  const sv = (az: number, el: number): V3 => [
    Math.cos(el * RAD) * Math.sin(az * RAD),
    Math.cos(el * RAD) * Math.cos(az * RAD),
    Math.sin(el * RAD),
  ];
  const pv = (v: V3) => pj(v[0], v[1], v[2]);
  // a closed polyline split into the part facing the viewer and the part behind the sphere
  const split = (vs: V3[]) => {
    const pts = vs.map(pv),
      out = { front: "", back: "" };
    let last: "front" | "back" | null = null;
    for (let i = 1; i <= pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i % pts.length],
        side = (a[2] + b[2]) / 2 >= 0 ? "front" : "back";
      out[side] += (last === side ? " L" : ` M${P(a)} L`) + P(b);
      last = side;
    }
    return out;
  };
  const horizon: V3[] = [];
  for (let a = 0; a < 360; a += 4) horizon.push(sv(a, 0));
  const H = split(horizon);
  const ground = "M" + horizon.map((v) => P(pv(v))).join(" L") + " Z";
  let groundTicks = "";
  for (let a = 0; a < 360; a += 15) {
    const v = sv(a, 0),
      r2 = a % 90 ? 0.95 : 0.9;
    groundTicks += `M${P(pj(v[0], v[1], 0))} L${P(pj(v[0] * r2, v[1] * r2, 0))} `;
  }
  const rh = SC * Math.sin(tilt);
  const dome = `M${GX - SC} ${GY} A${SC} ${SC} 0 0 1 ${GX + SC} ${GY} A${SC} ${f1(rh)} 0 0 1 ${GX - SC} ${GY} Z`;
  const domeArc = `M${GX - SC} ${GY} A${SC} ${SC} 0 0 1 ${GX + SC} ${GY}`;
  // today's path of the sun: above the horizon only, split front / back and past / future
  const paths = { fp: "", ff: "", bp: "", bf: "" };
  {
    const pts: SunSample[] = [];
    for (let i = 0; i < day.samples.length; i += PATH_STEP) pts.push(day.samples[i]);
    const last = day.samples[day.samples.length - 1];
    if (pts[pts.length - 1] !== last) pts.push(last);
    const k = pts.findIndex((s) => s.t > now.t);
    if (k > 0) pts.splice(k, 0, now);
    let lastKey: keyof typeof paths | null = null;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i];
      if ((a.el + b.el) / 2 < 0) {
        lastKey = null;
        continue;
      }
      const pa = pv(sv(a.az, a.el)),
        pb = pv(sv(b.az, b.el));
      const key = (((pa[2] + pb[2]) / 2 >= 0 ? "f" : "b") +
        (b.t <= now.t ? "p" : "f")) as keyof typeof paths;
      paths[key] += (lastKey === key ? " L" : ` M${P(pa)} L`) + P(pb);
      lastKey = key;
    }
  }
  // the house as a solid: walls and the configured roof
  const solid = houseSolid(roof, HH, HZ, HR);
  // a straight pole marking the house's position: up from the middle of its roof
  const origin = pj(0, 0, 0),
    poleTop = pj(0, 0, Math.max(0.44, solid.top + 0.12));
  const pole = `M${P(pj(0, 0, solid.top))} L${P(poleTop)}`;
  // the compass points: GAP px outside the rim, along the point's direction on screen (the
  // ground is squashed, so a fixed share of the radius would put the front label on the rim). A
  // point on the far half of the rim is left out: its label would sit in the dome, behind the
  // sun's path; the sides (depth 0 when the camera looks along an axis) stay
  const cards = [0, 90, 180, 270]
    .map((bearing) => {
      const v = sv(bearing, 0),
        p = pj(v[0], v[1], 0),
        dx = p[0] - GX,
        dy = p[1] - GY,
        n = Math.hypot(dx, dy) || 1;
      return { bearing, x: p[0] + (dx / n) * GAP, y: p[1] + (dy / n) * GAP, depth: p[2] };
    })
    .filter((c) => c.depth > -0.15);
  // the house, turned with its front. It is convex, so a surface shows when its outward normal
  // points at the viewer and the visible ones never overlap
  const hr = front * RAD;
  const cw = (u: number, v: number): [number, number] => [
    u * Math.cos(hr) + v * Math.sin(hr),
    -u * Math.sin(hr) + v * Math.cos(hr),
  ];
  const world = ([u, v, z]: P3): V3 => [...cw(u, v), z];
  const fp = [cw(-HH, HH), cw(HH, HH), cw(HH, -HH), cw(-HH, -HH)];
  // towards the viewer, and a soft light from the viewer's upper left: shades the surfaces the
  // sun does not reach, so neighbouring ones stay apart without outlines
  const toViewer: V3 = [
    -Math.sin(view) * Math.cos(tilt),
    -Math.cos(view) * Math.cos(tilt),
    Math.sin(tilt),
  ];
  const fill = unit([
    toViewer[0] - Math.cos(view) * 0.6,
    toViewer[1] + Math.sin(view) * 0.6,
    toViewer[2] + 0.4,
  ]);
  const sunDir = sv(now.az, now.el);
  // a surface's outward normal from its first three corners, turned away from the middle
  const normalOf = (pts: P3[]): V3 => {
    const [a, b, c] = pts.map(world);
    const n = unit([
      (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
      (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
    ]);
    // from the house's middle to the surface's centroid: the outward side
    const out = pts
      .map(world)
      .reduce<V3>((m, p) => [m[0] + p[0], m[1] + p[1], m[2] + p[2]], [0, 0, 0])
      .map((x, i) => x / pts.length - (i === 2 ? HZ / 2 : 0)) as V3;
    return dot(n, out) < 0 ? (n.map((x) => -x) as V3) : n;
  };
  const face = (pts: P3[], roof: boolean, lit: boolean, inc: number) => {
    const n = normalOf(pts);
    return {
      visible: dot(n, toViewer) > 0.001,
      d: "M" + pts.map((p) => P(pj(...world(p)))).join(" L") + " Z",
      roof,
      lit,
      incidence: inc,
      shade: (1 - dot(n, fill)) / 2,
    };
  };
  // the walls light as their sides do (a shared wall never); the roof planes by their slope
  const walls = sides.map((side, k) => face(solid.walls[k], false, side.litNow, side.incidence));
  const roofs = solid.roofs.map((pts) => {
    const inc = now.el > 0 ? Math.max(0, dot(normalOf(pts), sunDir)) : 0;
    return face(pts, true, inc > 0, inc);
  });
  const faces = [...walls, ...roofs]
    .filter((f) => f.visible)
    .map(({ d, roof, lit, incidence, shade }) => ({ d, roof, lit, incidence, shade }));
  // the shadow: the hull of the footprint and the footprint shifted away from the sun
  let shadow = "";
  if (now.el > 0.5) {
    // a point h high falls h / tan(elevation) away from the sun (capped near the horizon)
    const away = (c: [number, number], h: number): [number, number] => {
      const L = Math.min((0.75 * h) / solid.top, h / Math.tan(now.el * RAD));
      return [c[0] - Math.sin(now.az * RAD) * L, c[1] - Math.cos(now.az * RAD) * L];
    };
    // the footprint and every corner of the roof, each cast from its own height
    const pts = fp
      .concat(solid.roofs.flat().map(([u, v, z]) => away(cw(u, v), z)))
      .map((c) => pj(c[0], c[1], 0))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: Pt, a: Pt, b: Pt) =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: Pt[] = [],
      hi: Pt[] = [];
    for (const p of pts) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
      hi.push(p);
    }
    shadow = "M" + lo.slice(0, -1).concat(hi.slice(0, -1)).map(P).join(" L") + " Z";
  }
  const up = now.el > 0;
  // the azimuth on the ground: an arc from north round to the sun's bearing, its chip halfway
  const AZ_R = 0.42;
  let azArc = "";
  for (let a = 0; a <= now.az; a += 4) {
    const v = sv(Math.min(a, now.az), 0);
    azArc += (a ? " L" : "M") + P(pj(v[0] * AZ_R, v[1] * AZ_R, 0));
  }
  if (now.az % 4) {
    const v = sv(now.az, 0);
    azArc += " L" + P(pj(v[0] * AZ_R, v[1] * AZ_R, 0));
  }
  const vm = sv(now.az / 2, 0),
    azMid = pj(vm[0] * (AZ_R + 0.3), vm[1] * (AZ_R + 0.3), 0);
  const sunV = sv(now.az, now.el),
    sp = pv(sunV),
    gp = pj(sunV[0], sunV[1], 0);
  return {
    w,
    h,
    k: lineScale(SC, SCENE.maxScale),
    dome,
    domeArc,
    ground,
    groundTicks,
    horizonFront: H.front,
    horizonBack: H.back,
    pole,
    poleTop: [poleTop[0], poleTop[1]],
    cardinals: cards.map(({ bearing, x, y }) => ({ bearing, x, y })),
    pathFrontPast: paths.fp,
    pathFrontFuture: paths.ff,
    pathBackPast: paths.bp,
    pathBackFuture: paths.bf,
    faces,
    track: trackOf(day, (s) => {
      const p = pv(sv(s.az, s.el));
      return [p[0], p[1]];
    }),
    shadow,
    ray: up ? `M${P(origin)} L${P(gp)}` : "",
    cardinalLines: [0, 90, 180, 270]
      .map((a) => {
        const v = sv(a, 0);
        return `M${P(origin)} L${P(pj(v[0] * 0.9, v[1] * 0.9, 0))}`;
      })
      .join(" "),
    azArc: up ? azArc : "",
    azChip: up ? [azMid[0], azMid[1]] : null,
    drop: up ? `M${P(sp)} L${P(gp)}` : "",
    sun: up ? [sp[0], sp[1]] : null,
    groundDot: up ? [gp[0], gp[1]] : null,
    chip: up ? [(sp[0] + gp[0]) / 2, (sp[1] + gp[1]) / 2] : null,
  };
};
