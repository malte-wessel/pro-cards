// The walls of the house as filled bands inside its outline, pure. Strokes would sit on the
// outline's centre line, reach past it, and mitre in screen space, which spikes at the sharp
// corners of the 3D roof; bands lie inside the footprint (or on the roof's plane before it is
// projected), so neighbouring walls meet on the diagonal and the corners stay exact.
type XY = [number, number];

// wall k runs from corner k to corner k + 1 of the square (-h,-h) (h,-h) (h,h) (-h,h) and is
// w[k] thick, inset; returns each band's four corners in the square's coordinates
export const wallBands = (h: number, w: readonly number[]): XY[][] => {
  const outer: XY[] = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  const inner: XY[] = [
    [-h + w[3], -h + w[0]],
    [h - w[1], -h + w[0]],
    [h - w[1], h - w[2]],
    [-h + w[3], h - w[2]],
  ];
  return [0, 1, 2, 3].map((k) => [outer[k], outer[(k + 1) % 4], inner[(k + 1) % 4], inner[k]]);
};
