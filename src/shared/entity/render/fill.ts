// Fills one entity row for every row kind: tile / list rows, hero lead, grid cells, items,
// table fields and header values. Each function rebuilds the row's children from the model.
import type { EntityItem } from "../config.ts";
import { nameOf, tplOf, type EntityModel, type RenderCtx } from "../model.ts";
import { blockEl } from "./blocks.ts";
import { bigEl, iconEl, leadEl, pillEl, textEl, toggleEl, valueEl } from "./lead.ts";

export const fillRow = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  isTile: boolean,
) => {
  row.replaceChildren();
  const top = document.createElement("div");
  top.className = "top";
  top.appendChild(leadEl(ctx, ent, m, isTile ? 40 : 36));
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
    if (ent.toggle) end.appendChild(toggleEl(ctx, ent, m));
  } else {
    const s = sec ?? (ent.visual === "badge" ? null : m.look.label);
    if (s) {
      const el = textEl("secondary", s);
      if (!sec && m.look.label && m.model.avail) el.classList.add("accent");
      texts.appendChild(el);
    }
    end.appendChild(valueEl(ent, m));
    if (ent.toggle) end.appendChild(toggleEl(ctx, ent, m));
  }
  line.append(texts, end);
  main.appendChild(line);
  top.appendChild(main);
  row.appendChild(top);
  const block = blockEl(ctx, ent, idx, m);
  if (block) {
    if (isTile) row.appendChild(block);
    else main.appendChild(block);
  }
};

export const fillHero = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  row.replaceChildren();
  const top = document.createElement("div");
  top.className = "top";
  top.appendChild(leadEl(ctx, ent, m, 56));
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
  if (ent.visual === "badge" || ent.toggle) {
    const end = document.createElement("div");
    end.className = "end";
    if (ent.visual === "badge") end.appendChild(pillEl(m.look.label ?? m.fmt.text));
    if (ent.toggle) end.appendChild(toggleEl(ctx, ent, m));
    line.appendChild(end);
  }
  main.appendChild(line);
  top.appendChild(main);
  row.appendChild(top);
  const block = blockEl(ctx, ent, idx, m);
  if (block) row.appendChild(block);
};

export const fillCell = (
  ctx: RenderCtx,
  cell: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  cell.replaceChildren();
  if (ent.visual === "ring") cell.appendChild(leadEl(ctx, ent, m, 64, "value"));
  else {
    cell.appendChild(leadEl(ctx, ent, m, 32));
    if (ent.visual !== "gauge") cell.appendChild(bigEl(m.fmt));
  }
  const block = blockEl(ctx, ent, idx, m);
  if (block) cell.appendChild(block);
  cell.appendChild(textEl("secondary", nameOf(ctx, ent, m.st)));
  if (ent.visual === "badge") cell.appendChild(pillEl(m.look.label ?? m.fmt.text));
  else if (m.look.label) cell.appendChild(textEl("secondary accent", m.look.label));
};

export const fillItem = (ctx: RenderCtx, el: HTMLElement, ent: EntityItem, m: EntityModel) => {
  el.replaceChildren();
  const { item } = ent;
  // a stack: name (above) / icon / name (below) / value
  const name = item.showName ? textEl("iname", nameOf(ctx, ent, m.st)) : null;
  if (name && item.namePosition === "above") el.appendChild(name);
  if (item.showIcon) el.appendChild(leadEl(ctx, ent, m, 40));
  if (name && item.namePosition === "below") el.appendChild(name);
  if (item.showValue) {
    const val = valueEl(ent, m);
    // without a name the value is the item's label and takes the name's style
    if (!name) val.classList.add("lone");
    el.appendChild(val);
  }
  el.title = m.look.label ? `${m.fmt.text} · ${m.look.label}` : m.fmt.text;
};

export const fillField = (ctx: RenderCtx, el: HTMLElement, ent: EntityItem, m: EntityModel) => {
  el.replaceChildren();
  const { item } = ent;
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
  if (ent.toggle) val.appendChild(toggleEl(ctx, ent, m));
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
  else if (c.contains("item")) fillItem(ctx, row, ent, m);
  else if (c.contains("field")) fillField(ctx, row, ent, m);
  else if (c.contains("hval")) fillHval(ctx, row, ent, m);
  else fillRow(ctx, row, ent, idx, m, c.contains("tile"));
};
