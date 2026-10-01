// The lead of the rain card: the rain icon, or a small animation of the style inside the soft
// circle: drops falling through it, rings around a drop, or a filling gauge. Built once; the
// row's CSS variables (--t, --sl, --ldur, --H, --lv) and its `dry` class drive it; --H is the
// lead's size, less the water level for the gauge, so the drops stop at the surface.
import { animatedLeadShell, el, iconLead } from "../../shared/flow/dom.ts";
import { ICON, LEAD_ICON, type RainStyle } from "../constants.ts";
import { wavePathD } from "../rain.ts";

const SVG = "http://www.w3.org/2000/svg";

export const rainIcon = (icon = ICON) => {
  const i = document.createElement("ha-icon");
  i.setAttribute("icon", icon);
  return i;
};
export const rainLead = (size: number) => iconLead(size, rainIcon());

// the water and its waving surface (the gauge); used by the lead and the band
export const waterEl = (amp: number) => {
  const frag = document.createDocumentFragment();
  const water = document.createElement("div");
  water.className = "water";
  frag.appendChild(water);
  const top = document.createElement("div");
  top.className = "wtop";
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 600 16");
  svg.setAttribute("preserveAspectRatio", "none");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", wavePathD(amp));
  svg.appendChild(path);
  top.appendChild(svg);
  frag.appendChild(top);
  return frag;
};

export const animatedLead = (style: RainStyle, size: number) => {
  const lead = animatedLeadShell(size);
  lead.classList.add(style);
  const shape = lead.querySelector(".shape") as HTMLElement;
  const icon = rainIcon(style === "ripples" ? LEAD_ICON : ICON);
  icon.className = "rico";
  shape.appendChild(icon);
  const field = document.createElement("div");
  field.className = "rfield";
  if (style === "ripples") {
    for (const p0 of [0, 0.5])
      field.appendChild(
        el("rp", {
          "--x": "50%",
          "--y": "50%",
          "--w": "90%",
          "--h": "90%",
          "--dur": "1.6s",
          "--p0": p0,
        }),
      );
  } else {
    if (style === "fill") {
      lead.appendChild(waterEl(3));
      lead.style.setProperty("--wa", "3px");
    }
    const h = size <= 40 ? 9 : 12;
    const drops: [number, number][] =
      style === "fill"
        ? [
            [40, 0],
            [62, 0.55],
          ]
        : [
            [22, 0],
            [44, 0.35],
            [66, 0.15],
            [34, 0.6],
            [56, 0.8],
          ];
    for (const [x, p0] of drops)
      field.appendChild(
        el("dr", {
          "--x": `${x}%`,
          "--w": "2px",
          "--h": `${style === "fill" ? h - 1 : h}px`,
          "--o": 0.9,
          "--p0": p0,
          "--k": 1,
        }),
      );
  }
  // --H (the fall height, the water level deducted for the gauge) and --sb come from the row
  lead.appendChild(field);
  return lead;
};
