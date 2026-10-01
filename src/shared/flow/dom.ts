// DOM pieces shared by the flow cards: the band, the row skeleton of tile / flow tile / hero,
// the lead shells and the playback-rate scaling that lets a value change re-time running
// animations without restarting them.
import type { EntityModel } from "../entity/model.ts";
import { bigEl, textEl } from "../entity/render/lead.ts";

export type RowKind = "tile" | "flowtile" | "hero";

export const vars = (el: HTMLElement | SVGElement, v: Record<string, string | number>) => {
  for (const [k, val] of Object.entries(v)) el.style.setProperty(k, String(val));
};
export const el = (cls: string, v: Record<string, string | number>) => {
  const i = document.createElement("i");
  i.className = cls;
  vars(i, v);
  return i;
};

// the band: the animated field behind a chip; `bg` fills the flow tile, `band` sits in the hero
export const buildBand = (kind: "bg" | "band", chipIcon: HTMLElement, field: HTMLElement) => {
  const band = document.createElement("div");
  band.className = `wflow ${kind}`;
  band.appendChild(field);
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.appendChild(chipIcon);
  chip.appendChild(document.createElement("span"));
  band.appendChild(chip);
  return band;
};

// scales every running animation under `root` (the field's particles, the lead's) so a value
// change is seen at once without restarting or jumping; the rate is kept on the element
export const setRate = (root: HTMLElement, rate: number) => {
  const r = rate.toFixed(3);
  if (root.dataset.rate === r) return;
  root.dataset.rate = r;
  if (typeof root.getAnimations !== "function") return;
  for (const a of root.getAnimations({ subtree: true })) a.playbackRate = rate;
};

// the lead: an icon in the soft circle
export const iconLead = (size: number, icon: HTMLElement) => {
  const lead = document.createElement("div");
  lead.className = "lead";
  lead.style.setProperty("--lead", `${size}px`);
  const shape = document.createElement("div");
  shape.className = "shape";
  shape.appendChild(icon);
  lead.appendChild(shape);
  return lead;
};
// the animated lead's shell: the soft circle that clips whatever the card puts inside
export const animatedLeadShell = (size: number) => {
  const lead = document.createElement("div");
  lead.className = "lead wlead";
  lead.style.setProperty("--lead", `${size}px`);
  const shape = document.createElement("div");
  shape.className = "shape";
  lead.appendChild(shape);
  return lead;
};

// the row skeleton, built once: lead, name, big value (hero / flow tile end), secondary lines
export const buildRow = (row: HTMLElement, kind: RowKind, lead: HTMLElement) => {
  const top = document.createElement("div");
  top.className = "top";
  top.appendChild(lead);
  const main = document.createElement("div");
  main.className = "main";
  const line = document.createElement("div");
  line.className = "line";
  const texts = document.createElement("div");
  texts.className = "texts";
  texts.appendChild(textEl("primary", ""));
  if (kind === "hero") texts.appendChild(bigEl({ text: "", num: "", unit: "" }));
  texts.appendChild(textEl("secondary", ""));
  // the flow tile: a second line for narrow tiles, swapped in by CSS
  if (kind === "flowtile") texts.appendChild(textEl("secondary narrow", ""));
  const end = document.createElement("div");
  end.className = "end";
  if (kind === "flowtile") end.appendChild(bigEl({ text: "", num: "", unit: "" }));
  line.append(texts, end);
  main.appendChild(line);
  top.appendChild(main);
  row.appendChild(top);
};

export const setBig = (big: HTMLElement | null, m: EntityModel) => {
  if (!big) return;
  const b = big.querySelector("b");
  if (b) b.textContent = m.fmt.num;
  let u = big.querySelector("span");
  if (m.fmt.unit) {
    if (!u) u = big.appendChild(document.createElement("span"));
    u.textContent = m.fmt.unit;
  } else u?.remove();
};
