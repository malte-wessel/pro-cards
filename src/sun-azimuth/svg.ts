// The numbers of the card's SVG markup: degrees to radians, a coordinate to one decimal (no
// trailing ".0", so the markup stays short) and a point as "x y".
export const RAD = Math.PI / 180;
export const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
export const P = (p: readonly number[]) => `${f1(p[0])} ${f1(p[1])}`;
