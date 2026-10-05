// Fills one entity row for every row kind: tile / list rows, hero lead, grid cells, items,
// table fields and header values. Each function rebuilds the row's children from the model.
import type { EntityItem } from "../config.ts";
import { controlShowsValue, placementsOf, type Placement, type RowKind } from "../control.ts";
import { nameOf, tplOf, type EntityModel, type RenderCtx } from "../model.ts";
import { blockEl } from "./blocks.ts";
import { appendControls, bindLeadTap, buttonEl, controlEl } from "./controls.ts";
import { bigEl, iconEl, leadEl, pillEl, textEl, valueEl } from "./lead.ts";

// the controls of the row, split by slot; a card without a control host draws none
const slots = (ctx: RenderCtx, ent: EntityItem, kind: RowKind) => {
  const ps = ctx.ctl ? placementsOf(ent, kind) : [];
  const at = (pos: Placement["position"]) => ps.filter((p) => p.position === pos);
  return { end: at("end"), block: at("block"), lead: at("lead") };
};
// a slider in the block slot is the bar with a knob, so the bar visual gives way to it
const blockOf = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  block: Placement[],
) =>
  ent.visual === "bar" && block.some((p) => p.kind === "slider") ? null : blockEl(ctx, ent, idx, m);

export const fillRow = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  isTile: boolean,
) => {
  row.replaceChildren();
  const c = slots(ctx, ent, isTile ? "tile" : "list");
  const top = document.createElement("div");
  top.className = "top";
  const lead = leadEl(ctx, ent, m, isTile ? 40 : 36);
  if (c.lead.length) bindLeadTap(lead, ctx, ent, idx, m);
  top.appendChild(lead);
  const main = document.createElement("div");
  main.className = "main";
  const line = document.createElement("div");
  line.className = "line";
  const texts = document.createElement("div");
  texts.className = "texts";
  texts.appendChild(textEl("primary", nameOf(ctx, ent, m.st)));
  const sec = tplOf(ctx, ent.secondary);
  const end = document.createElement("div");
  end.className = "end";
  if (isTile) {
    const s =
      sec ??
      (m.look.label && ent.visual !== "badge" ? `${m.fmt.text} · ${m.look.label}` : m.fmt.text);
    texts.appendChild(textEl("secondary", s));
    if (ent.visual === "badge") end.appendChild(pillEl(m.look.label ?? m.fmt.text));
  } else {
    const s = sec ?? (ent.visual === "badge" ? null : m.look.label);
    if (s) {
      const el = textEl("secondary", s);
      if (!sec && m.look.label && m.model.avail) el.classList.add("accent");
      texts.appendChild(el);
    }
    // a control that shows the value itself gets no text beside it
    if (!c.end.some((p) => controlShowsValue(ent, p))) end.appendChild(valueEl(ent, m));
  }
  appendControls(ctx, ent, idx, m, c.end, end);
  line.append(texts, end);
  main.appendChild(line);
  top.appendChild(main);
  row.appendChild(top);
  const slot = isTile ? row : main;
  const block = blockOf(ctx, ent, idx, m, c.block);
  if (block) slot.appendChild(block);
  appendControls(ctx, ent, idx, m, c.block, slot);
};

export const fillHero = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  row.replaceChildren();
  const c = slots(ctx, ent, "hero");
  const top = document.createElement("div");
  top.className = "top";
  const lead = leadEl(ctx, ent, m, 56);
  if (c.lead.length) bindLeadTap(lead, ctx, ent, idx, m);
  top.appendChild(lead);
  const main = document.createElement("div");
  main.className = "main";
  const line = document.createElement("div");
  line.className = "line";
  const texts = document.createElement("div");
  texts.className = "texts";
  texts.appendChild(textEl("primary", nameOf(ctx, ent, m.st)));
  texts.appendChild(bigEl(m.fmt));
  const sec = tplOf(ctx, ent.secondary) ?? (ent.visual === "badge" ? null : m.look.label);
  if (sec) {
    const el = textEl("secondary", sec);
    if (m.look.label === sec && m.model.avail) el.classList.add("accent");
    texts.appendChild(el);
  }
  line.appendChild(texts);
  if (ent.visual === "badge" || c.end.length) {
    const end = document.createElement("div");
    end.className = "end";
    if (ent.visual === "badge") end.appendChild(pillEl(m.look.label ?? m.fmt.text));
    appendControls(ctx, ent, idx, m, c.end, end);
    line.appendChild(end);
  }
  main.appendChild(line);
  top.appendChild(main);
  row.appendChild(top);
  const block = blockOf(ctx, ent, idx, m, c.block);
  if (block) row.appendChild(block);
  appendControls(ctx, ent, idx, m, c.block, row);
};

export const fillCell = (
  ctx: RenderCtx,
  cell: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  cell.replaceChildren();
  const c = slots(ctx, ent, "cell");
  if (ent.visual === "ring") cell.appendChild(leadEl(ctx, ent, m, 64, "value"));
  else {
    const lead = leadEl(ctx, ent, m, 32);
    if (c.lead.length) bindLeadTap(lead, ctx, ent, idx, m);
    if (c.end.length) {
      // the lead and the small controls share the top line of the cell
      const top = document.createElement("div");
      top.className = "gtop";
      const end = document.createElement("div");
      end.className = "end";
      appendControls(ctx, ent, idx, m, c.end, end);
      top.append(lead, end);
      cell.appendChild(top);
    } else cell.appendChild(lead);
    if (ent.visual !== "gauge") cell.appendChild(bigEl(m.fmt));
  }
  const block = blockOf(ctx, ent, idx, m, c.block);
  if (block) cell.appendChild(block);
  appendControls(ctx, ent, idx, m, c.block, cell);
  cell.appendChild(textEl("secondary", nameOf(ctx, ent, m.st)));
  if (ent.visual === "badge") cell.appendChild(pillEl(m.look.label ?? m.fmt.text));
  else if (m.look.label) cell.appendChild(textEl("secondary accent", m.look.label));
};

export const fillItem = (
  ctx: RenderCtx,
  el: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  el.replaceChildren();
  const { item } = ent;
  const column = !!el.closest(".layout-column");
  const c = slots(ctx, ent, column ? "item-column" : "item-row");
  // a stack: name (above) / icon / name (below) / value
  const name = item.showName ? textEl("iname", nameOf(ctx, ent, m.st)) : null;
  if (name && item.namePosition === "above") el.appendChild(name);
  // the lead: the icon, the icon as a tap toggle, or a round button / hold button in its place
  const leadCtl = c.lead[0];
  if (leadCtl && leadCtl.kind !== "toggle") {
    const b =
      leadCtl.kind === "button"
        ? buttonEl(ctx, ent, idx, m, leadCtl)
        : controlEl(ctx, ent, idx, m, leadCtl);
    if (b) el.appendChild(b);
    else if (item.showIcon) el.appendChild(leadEl(ctx, ent, m, 40));
  } else if (item.showIcon || leadCtl) {
    const lead = leadEl(ctx, ent, m, 40);
    if (leadCtl) bindLeadTap(lead, ctx, ent, idx, m);
    el.appendChild(lead);
  }
  if (name && item.namePosition === "below") el.appendChild(name);
  if (item.showValue) {
    const val = valueEl(ent, m);
    // without a name the value is the item's label and takes the name's style
    if (!name) val.classList.add("lone");
    el.appendChild(val);
  }
  if (column && c.end.length) {
    const end = document.createElement("div");
    end.className = "end";
    appendControls(ctx, ent, idx, m, c.end, end);
    if (end.childElementCount) el.appendChild(end);
  }
  el.title = m.look.label ? `${m.fmt.text} · ${m.look.label}` : m.fmt.text;
};

export const fillField = (
  ctx: RenderCtx,
  el: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  el.replaceChildren();
  const { item } = ent;
  const c = slots(ctx, ent, "field");
  if (el.parentElement?.classList.contains("with-icon")) {
    if (item.showIcon) el.appendChild(leadEl(ctx, ent, m, 24));
    else {
      const gap = document.createElement("div");
      gap.className = "lead";
      gap.style.setProperty("--lead", "24px");
      el.appendChild(gap);
    }
  }
  el.appendChild(textEl("key", item.showName ? nameOf(ctx, ent, m.st) : ""));
  const val = document.createElement("div");
  val.className = "val";
  if (item.showValue) val.appendChild(valueEl(ent, m));
  appendControls(ctx, ent, idx, m, c.end, val);
  el.appendChild(val);
};

export const fillHval = (ctx: RenderCtx, el: HTMLElement, ent: EntityItem, m: EntityModel) => {
  el.replaceChildren();
  const { item } = ent;
  if (item.showIcon) el.appendChild(iconEl(ctx, m.look, m.st));
  const name = nameOf(ctx, ent, m.st);
  if (item.showName) {
    const n = document.createElement("span");
    n.className = "secondary";
    n.textContent = name;
    el.appendChild(n);
  }
  if (item.showValue) el.appendChild(valueEl(ent, m));
  el.title = m.look.label ? `${name} · ${m.look.label}` : name;
};

// dispatch on the row's kind class
export const fillByClass = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  const c = row.classList;
  if (c.contains("cell")) fillCell(ctx, row, ent, idx, m);
  else if (c.contains("hero")) fillHero(ctx, row, ent, idx, m);
  else if (c.contains("item")) fillItem(ctx, row, ent, idx, m);
  else if (c.contains("field")) fillField(ctx, row, ent, idx, m);
  else if (c.contains("hval")) fillHval(ctx, row, ent, m);
  else fillRow(ctx, row, ent, idx, m, c.contains("tile"));
};
