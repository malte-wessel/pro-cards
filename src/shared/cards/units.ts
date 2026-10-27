// The container cards (layout, swipe): lengths, sides and gaps as CSS (pure). The checks are made
// per card, so their errors name it.

export type Sides = [string, string, string, string];

const LENGTH_RE = /^-?\d*\.?\d+(px|rem|em|%|vw|vh|svh|dvh)$/;
const FN_RE = /^(var|calc|min|max|clamp)\(.+\)$/;

export const lengths = (card: string) => {
  const err = (msg: string) => new Error(`${card}: ${msg}`);

  // a CSS length: a number is px; units px, rem, em, %, vw, vh; var(--x), calc(), min(), max(), clamp()
  const cssLength = (v: unknown, at: string): string => {
    const bad = () => err(`'${at}' must be a length (8, 0.5rem, 4%, var(--x)) of at least 0`);
    if (typeof v === "number" && Number.isFinite(v)) {
      if (v < 0) throw bad();
      return `${v}px`;
    }
    if (typeof v !== "string") throw bad();
    const s = v.trim();
    if (/^-?\d*\.?\d+$/.test(s)) return cssLength(Number(s), at);
    if (LENGTH_RE.test(s)) {
      if (s.startsWith("-")) throw bad();
      return s;
    }
    if (FN_RE.test(s)) return s;
    throw bad();
  };

  // 1, 2 or 4 values as CSS shorthand does, or { top, right, bottom, left } (missing sides 0)
  const boxSides = (v: unknown, at: string): Sides => {
    const len = (x: unknown, a = at) => cssLength(x, a);
    if (Array.isArray(v)) {
      if (v.length === 1) return [len(v[0]), len(v[0]), len(v[0]), len(v[0])];
      if (v.length === 2) {
        const [y, x] = [len(v[0]), len(v[1])];
        return [y, x, y, x];
      }
      if (v.length === 4) return [len(v[0]), len(v[1]), len(v[2]), len(v[3])];
      throw err(`'${at}' takes 1, 2 or 4 values, or { top, right, bottom, left }`);
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      for (const k of Object.keys(o))
        if (!["top", "right", "bottom", "left"].includes(k))
          throw err(`'${at}.${k}' is not a side (top, right, bottom, left)`);
      const side = (k: string) => (o[k] === undefined ? "0px" : len(o[k], `${at}.${k}`));
      return [side("top"), side("right"), side("bottom"), side("left")];
    }
    const one = len(v);
    return [one, one, one, one];
  };

  return { cssLength, boxSides };
};

// the gap without one of the card's own: the theme's sections grid gap
export const themeGap = (axis: "row" | "column"): string =>
  `var(--ha-section-grid-${axis}-gap, 8px)`;
