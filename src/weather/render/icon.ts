// The element that shows a condition: an mdi icon, one of the Home Assistant weather pictures
// (inline SVG) or an image from a URL, by the `icons` setting in force: a map overrides single
// conditions and the rest keep the pictures; `mdi` switches all of them. A rule's icon wins.
import type { WeatherIcons } from "../config.ts";
import { conditionIcon, isCondition } from "../conditions.ts";
import { PICTURE_VIEWBOX, pictureSvg } from "../pictures.ts";

const SVG_NS = "http://www.w3.org/2000/svg";

// what `icons` says for a condition: an mdi icon name, an image URL, or null for the default
export const iconFor = (icons: WeatherIcons, condition: unknown): string | null =>
  isCondition(condition) ? (icons.map[condition] ?? null) : null;

export const conditionEl = (
  icons: WeatherIcons,
  condition: unknown,
  night: boolean,
  ruleIcon: string | null | undefined,
): HTMLElement | SVGElement => {
  const custom = ruleIcon || iconFor(icons, condition);
  if (custom && !custom.startsWith("mdi:") && (custom.includes("/") || custom.includes("."))) {
    const img = document.createElement("img");
    img.className = "wpic";
    img.alt = "";
    img.src = custom;
    return img;
  }
  // no custom icon: the picture, unless the card asked for mdi
  if (!custom && icons.base === "hass") {
    const inner = pictureSvg(condition, night);
    if (inner) {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "wpic");
      svg.setAttribute("viewBox", PICTURE_VIEWBOX);
      svg.innerHTML = inner;
      return svg;
    }
  }
  const el = document.createElement("ha-icon");
  el.setAttribute("icon", custom || conditionIcon(condition, night));
  return el;
};
