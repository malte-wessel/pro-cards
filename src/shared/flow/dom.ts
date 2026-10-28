// DOM pieces shared by the flow cards: the band, the row skeleton of tile / flow tile / hero / poster,
// the lead shells and the playback-rate scaling that lets a value change re-time running
// animations without restarting them.
import type { EntityItem } from "../entity/config.ts";
import type { IconStyle } from "../entity/constants.ts";
import { nameOf, type EntityModel, type RenderCtx } from "../entity/model.ts";
import { bigEl, fillSecondary, pillEl, textEl } from "../entity/render/lead.ts";

export type RowKind = "tile" | "flowtile" | "hero" | "poster";

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
// change is seen at once without restarting or jumping; the rate is kept on the element. A rate
// within half a percent of the one applied is no visible change (sensor noise): the hundreds of
// animations stay as they are. Transitions (an arrow turning to a new direction) keep their pace.
export const setRate = (root: HTMLElement, rate: number) => {
  const prev = root.dataset.rate === undefined ? NaN : Number(root.dataset.rate);
  if (Math.abs(rate - prev) <= 0.005 * prev) return;
  root.dataset.rate = rate.toFixed(3);
  if (typeof root.getAnimations !== "function") return;
  const isTransition = (a: Animation) =>
    typeof CSSTransition !== "undefined" && a instanceof CSSTransition;
  for (const a of root.getAnimations({ subtree: true }))
    if (!isTransition(a)) a.playbackRate = rate;
};

// the lead: an icon in the soft circle, or alone (icon_style: plain); the animated lead below
// keeps its circle, the animation is drawn in it
export const iconLead = (size: number, icon: HTMLElement, style: IconStyle = "circle") => {
  const lead = document.createElement("div");
  lead.className = style === "plain" ? "lead plain" : "lead";
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

// whether the row's skeleton is built (buildRow)
export const rowBuilt = (row: HTMLElement) => !!row.querySelector(":scope > :is(.top, .ptop)");
// the row skeleton, built once: lead, name, big value (hero / flow tile end), secondary lines;
// a poster's are the entity poster's (fillPoster): the lead and the label's pill on top, the
// name, the big value and the secondary line at the bottom
export const buildRow = (row: HTMLElement, kind: RowKind, lead: HTMLElement) => {
  if (kind === "poster") {
    const ptop = document.createElement("div");
    ptop.className = "ptop";
    const plead = document.createElement("div");
    plead.className = "plead";
    plead.appendChild(lead);
    const corner = document.createElement("div");
    corner.className = "corner";
    corner.appendChild(pillEl(""));
    (corner.firstChild as HTMLElement).classList.add("plabel");
    ptop.append(plead, corner);
    const pbody = document.createElement("div");
    pbody.className = "pbody";
    const pvalue = document.createElement("div");
    pvalue.className = "pvalue";
    pvalue.appendChild(bigEl({ text: "", num: "", unit: "" }));
    pbody.append(textEl("pname", ""), pvalue, textEl("secondary", ""));
    row.append(ptop, pbody);
    return;
  }
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

// a part of a secondary line; an accent part takes the row's colour
export interface TextPart {
  text: string;
  accent?: boolean;
}
// the lead's animation as built: its cycle (`--ldur`) and the value it was built for stay on the
// row (`key`); a later value scales its playback rate. Returns the value it was built for.
export const builtLead = (row: HTMLElement, key: string, value: number, durationS: number) => {
  if (row.dataset[key] === undefined) {
    row.style.setProperty("--ldur", `${durationS.toFixed(3)}s`);
    row.dataset[key] = String(value);
  }
  return Number(row.dataset[key]);
};
// the texts of a flow card's row: the name, the secondary line (`wide`; the flow tile's narrow
// line, `narrow`, for small widths), the big value and, on a tile and a poster, the label pill
export const fillFlowTexts = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  m: EntityModel,
  kind: RowKind,
  wide: TextPart[],
  narrow: TextPart[],
) => {
  const primary = row.querySelector<HTMLElement>(":is(.primary, .pname)");
  if (primary) primary.textContent = nameOf(ctx, ent, m.st);
  const secondary = row.querySelector<HTMLElement>(".secondary:not(.narrow)");
  if (secondary) {
    fillSecondary(secondary, wide);
    secondary.style.display = wide.length ? "" : "none";
  }
  const narrowEl = row.querySelector<HTMLElement>(".secondary.narrow");
  if (narrowEl) fillSecondary(narrowEl, narrow);
  setBig(row.querySelector<HTMLElement>(".big"), m);
  if (kind === "poster") {
    const pill = row.querySelector<HTMLElement>(".plabel");
    if (pill) {
      pill.textContent = m.look.label ?? "";
      pill.hidden = !m.look.label;
    }
    return;
  }
  if (kind !== "tile") return;
  const label = m.look.label;
  const end = row.querySelector<HTMLElement>(".end");
  let pill = end?.querySelector<HTMLElement>(".pill") ?? null;
  if (label && end) {
    if (!pill) pill = end.appendChild(pillEl(""));
    pill.textContent = label;
  } else pill?.remove();
};
