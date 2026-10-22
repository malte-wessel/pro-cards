// Text sizes, weights and families from Home Assistant's typography tokens, so a theme that scales
// the text (`ha-font-size-scale`) or sets a size (`ha-font-size-s`, `ha-tile-info-*`) scales the
// cards as it scales Home Assistant's own. Every fallback is the cards' own px size, which is also
// what the tokens are at Home Assistant's defaults.
import type { HomeAssistant } from "./ha.ts";

// Home Assistant's scale: --ha-font-size-<token> is `<px> * --ha-font-size-scale`
const SCALE: Record<number, string> = {
  10: "xs",
  12: "s",
  14: "m",
  16: "l",
  20: "xl",
  24: "2xl",
  28: "3xl",
  32: "4xl",
  40: "5xl",
};

// a font size: the token when `px` is on Home Assistant's scale, else `px` times the scale
export const fs = (px: number) =>
  SCALE[px]
    ? `var(--ha-font-size-${SCALE[px]}, ${px}px)`
    : `calc(${px}px * var(--ha-font-size-scale, 1))`;

// a font size and its line height, which grows with the text (exactly `linePx` at the default)
export const type = (px: number, linePx: number) =>
  `font-size: ${fs(px)}; line-height: calc(${fs(px)} * ${linePx} / ${px});`;

const WEIGHT = { normal: 400, medium: 500, bold: 700 } as const;
export const fw = (w: keyof typeof WEIGHT) => `var(--ha-font-weight-${w}, ${WEIGHT[w]})`;

export const FONT_FAMILY = "var(--ha-font-family-body, Roboto, system-ui, sans-serif)";

// the font shorthand (it resets what it does not name, as a literal font did): size, an optional
// line height that grows with it, weight, the theme's family
export const font = (px: number, linePx?: number, weight: keyof typeof WEIGHT = "normal") =>
  `font: ${fw(weight)} ${fs(px)}${linePx ? `/calc(${fs(px)} * ${linePx} / ${px})` : ""} ${FONT_FAMILY};`;

// a tile's two lines, as Home Assistant's tile card (ha-tile-info): its --ha-tile-info-* variables
// win, our own look is the fallback (the secondary line keeps the secondary text colour)
const tileLine = (
  which: "primary" | "secondary",
  px: number,
  linePx: number,
  weight: keyof typeof WEIGHT,
  color: string,
) => {
  const v = (prop: string, dflt: string) => `var(--ha-tile-info-${which}-${prop}, ${dflt})`;
  return (
    `font-size: ${v("font-size", fs(px))}; ` +
    `font-weight: ${v("font-weight", fw(weight))}; ` +
    `line-height: ${v("line-height", `calc(${v("font-size", fs(px))} * ${linePx} / ${px})`)}; ` +
    `letter-spacing: ${v("letter-spacing", "normal")}; ` +
    `color: ${v("color", `var(${color})`)};`
  );
};
export const TILE_PRIMARY = tileLine("primary", 14, 20, "medium", "--primary-text-color");
export const TILE_SECONDARY = tileLine("secondary", 12, 16, "normal", "--secondary-text-color");

// a card's title line
export const HEADER_TITLE = `${type(16, 20)} font-weight: ${fw("medium")};`;

// ----- in script: geometry built around text -----

// Home Assistant hands a new `themes` when the theme changes, and the text's size may change with
// it: what was measured around text is measured again, in the next frame (once the theme's
// variables are applied)
export const themeChanged = (prev: HomeAssistant | null | undefined, hass: HomeAssistant) =>
  !!prev && prev.themes !== hass.themes;

export interface TextStyle {
  font: string; // a canvas font (style, weight, size, family)
  size: number; // px
  line: number; // px
}

const px = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// The text style of an element at `path` inside `container`: a hidden probe of nested spans with
// those classes (["plabel small", "state"] for `.plabel.small .state`), so the card's own
// selectors apply, read and removed again. `dflt` (size, line height, weight) stands in when the
// container is not laid out or has no styles (not connected, unit tests).
export const textStyle = (
  container: Element,
  path: string[],
  dflt: [number, number, number?],
): TextStyle => {
  const [dSize, dLine, dWeight = 400] = dflt;
  const fallback = (size = dSize, line = dLine): TextStyle => ({
    font: `${dWeight} ${size}px Roboto, system-ui, sans-serif`,
    size,
    line,
  });
  if (!container.isConnected) return fallback();
  const doc = container.ownerDocument;
  const outer = doc.createElement("span");
  outer.setAttribute("aria-hidden", "true");
  outer.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0";
  let leaf = outer;
  path.forEach((cls, i) => {
    const el = i === 0 ? outer : doc.createElement("span");
    el.className = cls;
    if (i > 0) leaf.appendChild(el);
    leaf = el;
  });
  leaf.textContent = "0";
  container.appendChild(outer);
  const cs = getComputedStyle(leaf);
  const size = px(cs.fontSize),
    lh = px(cs.lineHeight),
    family = cs.fontFamily,
    weight = cs.fontWeight || String(dWeight),
    style = cs.fontStyle && cs.fontStyle !== "normal" ? `${cs.fontStyle} ` : "";
  outer.remove();
  if (!size || !family) return fallback();
  return {
    font: `${style}${weight} ${size}px ${family}`,
    size,
    line: lh ?? (size * dLine) / dSize,
  };
};
