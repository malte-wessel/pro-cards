// The house as a solid, pure: its walls and roof planes in the house's own coordinates, u to its
// left (seen from the front), v towards the front, z up, for a square footprint of half-width h.
// Every roof is convex, so a renderer can show the surfaces facing it without sorting them.
import type { Roof } from "./constants.ts";

export type P3 = [number, number, number];
type P2 = [number, number];

export interface HouseSolid {
  walls: P3[][]; // in the sides' order: front, left, back, right
  roofs: P3[][];
  top: number; // the height of the ridge (the roof's highest point, over the middle)
  ridge: P2[][]; // the roof's lines seen from above: the ridge and, on a hip roof, the hips
}

// the hip roof's ridge: this share of the house's width, centred
const HIP_RIDGE = 0.4;

export const houseSolid = (roof: Roof, h: number, wall: number, ridge: number): HouseSolid => {
  // the corners, wall k running from corner k to corner k + 1
  const c: P2[] = [
    [-h, h],
    [h, h],
    [h, -h],
    [-h, -h],
  ];
  const top = roof === "flat" ? wall : ridge;
  const eave = (k: number): P3 => [...c[k % 4], wall];
  const up = (p: P2): P3 => [...p, top];
  // a gable on wall k: its apex over the middle of the wall
  const gables = roof === "gable" ? [1, 3] : roof === "gable_front" ? [0, 2] : [];
  const walls = [0, 1, 2, 3].map((k) => {
    const a = c[k],
      b = c[(k + 1) % 4];
    const apex: P3[] = gables.includes(k) ? [[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, top]] : [];
    return [[...a, 0], [...b, 0], eave(k + 1), ...apex, eave(k)] as P3[];
  });
  let roofs: P3[][], lines: P2[][];
  if (roof === "gable") {
    // the ridge from the left side to the right: eaves at the front and the back
    const l: P2 = [h, 0],
      r: P2 = [-h, 0];
    roofs = [
      [eave(0), eave(1), up(l), up(r)],
      [eave(2), eave(3), up(r), up(l)],
    ];
    lines = [[l, r]];
  } else if (roof === "gable_front") {
    // the ridge from the front to the back: the gable faces the street
    const f: P2 = [0, h],
      b: P2 = [0, -h];
    roofs = [
      [eave(1), eave(2), up(b), up(f)],
      [eave(3), eave(0), up(f), up(b)],
    ];
    lines = [[f, b]];
  } else if (roof === "hip") {
    // four slopes: trapezoids to the front and the back, triangles to the sides
    const l: P2 = [h * HIP_RIDGE, 0],
      r: P2 = [-h * HIP_RIDGE, 0];
    roofs = [
      [eave(0), eave(1), up(l), up(r)],
      [eave(1), eave(2), up(l)],
      [eave(2), eave(3), up(r), up(l)],
      [eave(3), eave(0), up(r)],
    ];
    lines = [
      [l, r],
      [c[1], l],
      [c[2], l],
      [c[3], r],
      [c[0], r],
    ];
  } else {
    roofs = [[eave(0), eave(1), eave(2), eave(3)]];
    lines = [];
  }
  return { walls, roofs, top, ridge: lines };
};
