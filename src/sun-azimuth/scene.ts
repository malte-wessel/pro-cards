// The 3D view, pure geometry: the sky as a see-through dome around a small box house, seen from
// slightly above (orthographic, tilted down by SCENE.tilt, orbiting with `camera`). Everything is
// path data in a SCENE.w × SCENE.h box.
import { PATH_STEP, SCENE } from "./constants.ts";
import type { SunDay, SunSample } from "./day.ts";
import type { Side } from "./sides.ts";

const RAD = Math.PI / 180;
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
type V3 = [number, number, number];
type Pt = [number, number, number]; // screen x, screen y, depth (positive = towards the viewer)
const P = (p: Pt | [number, number]) => `${f1(p[0])} ${f1(p[1])}`;

export interface SceneFace {
  d: string;
  lit: boolean;
  incidence: number;
}
export interface SceneGeometry {
  w: number;
  h: number;
  dome: string;
  domeArc: string;
  ground: string;
  groundTicks: string;
  horizonFront: string;
  horizonBack: string;
  pole: string; // a straight pole at the house, up from the roof
  poleTop: [number, number];
  cardinals: { bearing: number; x: number; y: number }[]; // the one farthest back left out
  pathFrontPast: string;
  pathFrontFuture: string;
  pathBackPast: string;
  pathBackFuture: string;
  faces: SceneFace[]; // the visible walls, back to front
  roof: string;
  roofEdges: { d: string; lit: boolean }[];
  shadow: string;
  ray: string; // on the ground, from the house to under the sun
  drop: string; // from the sun down to the ground
  sun: [number, number] | null; // null below the horizon
  groundDot: [number, number] | null;
  chip: [number, number] | null; // where the elevation chip sits (right of the drop line's middle)
}

const { w, h, scale: SC, cx: GX, cy: GY, tilt: TILT, houseHalf: HH, houseHeight: HZ } = SCENE;

export const sceneGeometry = (
  day: SunDay,
  now: SunSample,
  lat: number,
  rotation: number,
  camera: number,
  sides: Side[],
): SceneGeometry => {
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
  // a straight pole marking the house's position: from its roof to three times its height
  const origin = pj(0, 0, 0),
    poleTop = pj(0, 0, HZ * 4);
  const pole = `M${P(pj(0, 0, HZ))} L${P(poleTop)}`;
  // the cardinal points on the ground, the one farthest back left out (it would sit in the sky)
  const cards = [0, 90, 180, 270].map((bearing) => {
    const v = sv(bearing, 0),
      p = pj(v[0] * 1.12, v[1] * 1.12, 0);
    return { bearing, x: p[0], y: p[1], depth: p[2] };
  });
  const back = cards.reduce((m, c) => (c.depth < m.depth ? c : m), cards[0]);
  // the house: a box rotated with the house; a wall shows when its normal faces the camera
  const hr = rotation * RAD;
  const cw = (u: number, v: number): [number, number] => [
    u * Math.cos(hr) + v * Math.sin(hr),
    -u * Math.sin(hr) + v * Math.cos(hr),
  ];
  const fp = [cw(-HH, HH), cw(HH, HH), cw(HH, -HH), cw(-HH, -HH)];
  const walls = sides.map((side, k) => {
    const a = fp[k],
      b = fp[(k + 1) % 4];
    const poly = [pj(a[0], a[1], 0), pj(b[0], b[1], 0), pj(b[0], b[1], HZ), pj(a[0], a[1], HZ)];
    const n = side.normal * RAD,
      facing = Math.sin(n) * Math.sin(view) + Math.cos(n) * Math.cos(view);
    return {
      visible: facing < 0.02,
      d: "M" + poly.map(P).join(" L") + " Z",
      lit: side.litNow,
      incidence: side.incidence,
      depth: (poly[0][2] + poly[1][2]) / 2,
    };
  });
  const faces = walls
    .filter((f) => f.visible)
    .sort((a, b) => a.depth - b.depth)
    .map(({ d, lit, incidence }) => ({ d, lit, incidence }));
  const roof = "M" + fp.map((c) => P(pj(c[0], c[1], HZ))).join(" L") + " Z";
  const roofEdges = sides.map((side, k) => ({
    d: `M${P(pj(fp[k][0], fp[k][1], HZ))} L${P(pj(fp[(k + 1) % 4][0], fp[(k + 1) % 4][1], HZ))}`,
    lit: side.litNow,
  }));
  // the shadow: the hull of the footprint and the footprint shifted away from the sun
  let shadow = "";
  if (now.el > 0.5) {
    const L = Math.min(0.85, HZ / Math.tan(now.el * RAD)),
      dx = -Math.sin(now.az * RAD) * L,
      dy = -Math.cos(now.az * RAD) * L;
    const pts = fp
      .concat(fp.map((c) => [c[0] + dx, c[1] + dy] as [number, number]))
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
  const sunV = sv(now.az, now.el),
    sp = pv(sunV),
    gp = pj(sunV[0], sunV[1], 0);
  return {
    w,
    h,
    dome,
    domeArc,
    ground,
    groundTicks,
    horizonFront: H.front,
    horizonBack: H.back,
    pole,
    poleTop: [poleTop[0], poleTop[1]],
    cardinals: cards.filter((c) => c !== back).map(({ bearing, x, y }) => ({ bearing, x, y })),
    pathFrontPast: paths.fp,
    pathFrontFuture: paths.ff,
    pathBackPast: paths.bp,
    pathBackFuture: paths.bf,
    faces,
    roof,
    roofEdges,
    shadow,
    ray: up ? `M${P(origin)} L${P(gp)}` : "",
    drop: up ? `M${P(sp)} L${P(gp)}` : "",
    sun: up ? [sp[0], sp[1]] : null,
    groundDot: up ? [gp[0], gp[1]] : null,
    chip: up ? [(sp[0] + gp[0]) / 2, (sp[1] + gp[1]) / 2] : null,
  };
};
