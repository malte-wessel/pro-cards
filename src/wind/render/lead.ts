// The lead of the wind card: the direction arrow, or a small animation of the flow style inside
// the soft circle. Built once; the row's CSS variables (--rot, --arrow, --ldur) drive it.
import { animatedLeadShell, el, iconLead } from "../../shared/flow/dom.ts";
import type { FlowStyle } from "../constants.ts";

export const arrowIcon = () => {
  const icon = document.createElement("ha-icon");
  icon.className = "arrow";
  icon.setAttribute("icon", "mdi:navigation");
  return icon;
};
// the arrow lead: mdi:navigation in the soft circle, turned to where the wind blows
export const arrowLead = (size: number) => iconLead(size, arrowIcon());

// the animated lead: three rows of particles crossing the circle in the wind's direction
export const animatedLead = (style: FlowStyle, size: number) => {
  const lead = animatedLeadShell(size);
  if (style === "swoosh") {
    // the wind icon drawing itself
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    const strokes: [string, number, number][] = [
      ["M2.5 9 H13.5 A3 3 0 1 0 10.5 6", 0, 1],
      ["M2.5 13 H17.5 A3 3 0 1 1 14.5 16", 0.08, 1],
      ["M2.5 17 H9", 0.16, 0.6],
    ];
    for (const [d, p0, o] of strokes) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("class", "lsw");
      p.setAttribute("pathLength", "100");
      p.setAttribute("d", d);
      p.style.setProperty("--p0", String(p0));
      p.style.setProperty("--off", String(100 - p0 * 200));
      p.style.opacity = String(o);
      svg.appendChild(p);
    }
    lead.appendChild(svg);
    return lead;
  }
  const field = document.createElement("div");
  field.className = "lfield";
  if (style === "dots") {
    for (const [t, p0] of [
      [34, 0.07],
      [50, 0.45],
      [66, 0.7],
    ]) {
      field.appendChild(el("ld", { "--t": `${t}%`, "--p0": p0 }));
      field.appendChild(el("ld trail", { "--t": `${t}%`, "--p0": p0 - 0.05 }));
    }
  } else if (style === "lines") {
    field.appendChild(el("ls", { "--t": "34%", "--w": "45%", "--p0": 0.07 }));
    field.appendChild(el("ls", { "--t": "50%", "--w": "60%", "--h": "2.5px", "--p0": 0.4 }));
    field.appendChild(el("ls", { "--t": "66%", "--w": "38%", "--p0": 0.65, opacity: 0.6 }));
  } else {
    field.appendChild(el("la", { "--t": "36%", "--p0": 0.15 }));
    field.appendChild(el("la", { "--t": "52%", "--p0": 0.55 }));
    field.appendChild(el("la", { "--t": "66%", "--p0": 0.3, opacity: 0.6 }));
  }
  lead.appendChild(field);
  return lead;
};
