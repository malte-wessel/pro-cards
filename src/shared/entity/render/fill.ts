// Fills one entity row for every row kind: tile / list rows, hero lead, grid cells, items,
// table fields and header values. Each function rebuilds the row's children from the model.
import type { EntityItem } from "../config.ts";
import {
  canControl,
  controlShowsValue,
  placementsOf,
  type IconActions,
  type Placement,
  type RowKind,
} from "../control.ts";
import { nameOf, tplOf, type EntityModel, type FmtValue, type RenderCtx } from "../model.ts";
import { blockEl, GAUGE_CROP } from "./blocks.ts";
import { appendControls, bindLeadTap, controlEl, iconActionsEl } from "./controls.ts";
import { fillBadge } from "./badge.ts";
import { bigEl, leadEl, pillEl, textEl, valueEl } from "./lead.ts";

// the controls of the row, split by slot; a card without a control host draws none
const slots = (ctx: RenderCtx, ent: EntityItem, kind: RowKind) => {
  const ps = ctx.ctl ? placementsOf(ent, kind) : [];
  const at = (pos: Placement["position"]) => ps.filter((p) => p.position === pos);
  return { end: at("end"), block: at("block"), lead: at("lead") };
};
// the icon slot: the icon, the icon as a switch, or a Run / hold button in its place (at the
// icon's size); a confirmed control is a hold here too, never a plain tap
const leadOf = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  size: number,
  lead: Placement[],
) => {
  const p = lead[0];
  if (p && p.kind !== "toggle") {
    const b = controlEl(ctx, ent, idx, m, p);
    if (b) {
      b.style.setProperty("--lead", `${size}px`);
      return b;
    }
  }
  const el = leadEl(ctx, ent, m, size);
  if (p?.kind === "toggle") bindLeadTap(el, ctx, ent, idx, m);
  return el;
};
// the end controls, drawn; and whether one of them shows the value (so the text would repeat it):
// only a control that was drawn and can be used counts, otherwise the value stays
const endControls = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  end: Placement[],
) => {
  const els: HTMLElement[] = [];
  let showsValue = false;
  for (const p of end) {
    const el = controlEl(ctx, ent, idx, m, p);
    if (!el) continue;
    els.push(el);
    if (controlShowsValue(ent, p) && !el.classList.contains("ctl-slider")) showsValue = true;
  }
  return { els, showsValue: showsValue && canControl(ent, m.st) };
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
  top.appendChild(leadOf(ctx, ent, idx, m, 36, c.lead));
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
  }
  const ctls = endControls(ctx, ent, idx, m, c.end);
  // a control that shows the value itself gets no text beside it
  if (!isTile && !ctls.showsValue) end.appendChild(valueEl(ent, m));
  end.append(...ctls.els);
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
  top.appendChild(leadOf(ctx, ent, idx, m, 56, c.lead));
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

// what a card puts into its slots in place of the entity's own (a poster type's, its kind's):
// a slot left out takes the entity's; `lead: "keep"` leaves the lead as it is (an animated lead
// built once), a null value draws no large value, a picture replaces the block visual
export interface KindSlots {
  lead?: HTMLElement | "keep";
  name?: string;
  value?: FmtValue | null;
  // a word (Cleaning, Away) is drawn smaller than a number (default: the value is no number)
  word?: boolean;
  secondary?: string | Node | null;
  picture?: HTMLElement | null;
  // the status the tile's line shows after the value (null: none; the poster's is a badge of its own)
  status?: string | null;
  // the icon's own actions (`icon_*_action`): the lead takes them
  iconActions?: IconActions;
}

// the tile's icon slot (built once, so an animated lead in it is kept through fills): in the row
// at once, so the card's lead and the fill after it find the same one
export const tileLead = (row: HTMLElement) => {
  let lead = row.querySelector<HTMLElement>(":scope > .top > .tlead");
  if (!lead) {
    const top = document.createElement("div");
    top.className = "top";
    lead = top.appendChild(document.createElement("div"));
    lead.className = "tlead";
    row.appendChild(top);
  }
  return lead;
};

// the value on a tile's line: a kind's value may carry its unit apart (the poster draws it
// smaller), the line joins them
export const tileValueText = (value: FmtValue | null) =>
  value && value.unit && !value.text.endsWith(value.unit)
    ? `${value.num} ${value.unit}`
    : (value?.text ?? "");

// the badges beside a tile's texts, made once by the card (its badge rows are filled apart)
export const tileCorner = (row: HTMLElement) => {
  let corner = row.querySelector<HTMLElement>(".tcorner");
  if (!corner) {
    corner = document.createElement("div");
    corner.className = "tcorner";
    row.appendChild(corner);
  }
  return corner;
};

// a tile (the tile card's row): the icon, the name and one line under it (the value, the status,
// the secondary), the controls at the end of the line, a block visual or control below it;
// `show_icon`, `show_name` and `show_value` leave their part out. A status that only repeats the
// value is left out (a vacuum's Cleaning). The icon slot is kept: `lead: "keep"` leaves it as it is
export const fillTileSlots = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  o: KindSlots = {},
) => {
  const c = slots(ctx, ent, "tile");
  const lead = tileLead(row);
  // the badges beside the texts: built once by the card, kept here
  const corner = row.querySelector<HTMLElement>(".tcorner");
  row.replaceChildren();
  const { showIcon, showName, showValue } = ent.item;
  lead.hidden = !showIcon;
  if (!showIcon) lead.replaceChildren();
  else if (o.lead !== "keep")
    lead.replaceChildren(
      o.lead ??
        (o.iconActions && iconActionsEl(ctx, ent, idx, m, 36, o.iconActions)) ??
        leadOf(ctx, ent, idx, m, 36, c.lead),
    );
  const top = document.createElement("div");
  top.className = "top";
  const main = document.createElement("div");
  main.className = "main";
  const line = document.createElement("div");
  line.className = "line";
  const texts = document.createElement("div");
  texts.className = "texts";
  if (showName) texts.appendChild(textEl("primary", o.name ?? nameOf(ctx, ent, m.st)));
  // the line under the name: its parts joined by " · " (a kind's secondary may be a node: its
  // parts are taken over)
  const parts: (string | Node)[] = [];
  const text = showValue ? tileValueText(o.value === undefined ? m.fmt : o.value) : "";
  if (text) parts.push(text);
  const status = o.status === undefined ? m.look.label : o.status;
  if (status && status.toLowerCase() !== text.toLowerCase()) parts.push(status);
  const sec = o.secondary === undefined ? tplOf(ctx, ent.secondary) : o.secondary;
  if (sec instanceof Element && sec.classList.contains("secondary")) {
    // its parts without the separators between them (the line puts its own)
    parts.push(
      ...[...sec.childNodes].filter((n) => !(n.nodeType === 3 && n.textContent === " · ")),
    );
  } else if (sec) parts.push(sec);
  if (parts.length) {
    const el = textEl("secondary", null);
    parts.forEach((p, i) => {
      if (i > 0) el.append(" · ");
      el.append(p);
    });
    texts.appendChild(el);
  }
  const end = document.createElement("div");
  end.className = "end";
  end.append(...endControls(ctx, ent, idx, m, c.end).els);
  // the texts and the badges beside them as one: the badges centre on the texts (the icon's
  // middle), and never wrap apart from them when the controls go under the line
  const info = document.createElement("div");
  info.className = "tinfo";
  info.append(texts);
  if (corner) info.appendChild(corner);
  line.append(info, end);
  main.appendChild(line);
  top.append(lead, main);
  row.appendChild(top);
  const block = o.picture !== undefined ? o.picture : blockOf(ctx, ent, idx, m, c.block);
  if (block) row.appendChild(block);
  appendControls(ctx, ent, idx, m, c.block, row);
};

// a poster (the poster card's row): the icon at the top left, and at the bottom the name, then
// the big value and the secondary line as one block with the controls beside it (under it where
// they do not fit), then the block visual or controls; `show_icon`, `show_name` and `show_value`
// leave their part out. Only the poster's own parts are filled again, never the badge rows in its
// corner (filled apart).
export const fillPosterSlots = (
  ctx: RenderCtx,
  row: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  o: KindSlots = {},
) => {
  const c = slots(ctx, ent, "poster");
  const lead = row.querySelector<HTMLElement>(":scope > .ptop > .plead"),
    body = row.querySelector<HTMLElement>(":scope > .pbody");
  if (!lead || !body) return;
  const { showIcon, showName, showValue } = ent.item;
  if (!showIcon) lead.replaceChildren();
  else if (o.lead !== "keep")
    lead.replaceChildren(
      o.lead ??
        (o.iconActions && iconActionsEl(ctx, ent, idx, m, 40, o.iconActions)) ??
        leadOf(ctx, ent, idx, m, 40, c.lead),
    );
  body.replaceChildren();
  const name = textEl("pname", o.name ?? nameOf(ctx, ent, m.st));
  const ctls = endControls(ctx, ent, idx, m, c.end);
  // the value is the poster's point: segments, a select or a Run chip sit beside it; only a
  // stepper that shows the very same number takes its place
  const repeats =
    canControl(ent, m.st) && c.end.some((p) => p.kind === "stepper" && controlShowsValue(ent, p));
  const fmt = o.value === undefined ? m.fmt : o.value;
  // a gauge draws the value in its arc, as in a grid cell
  const gaugeShown = o.picture === undefined && ent.visual === "gauge";
  const block = o.picture !== undefined ? o.picture : blockOf(ctx, ent, idx, m, c.block);
  // a gauge is the poster's picture: the arc first, its name centred under it, the whole
  // centred in the room under the top line (pgauge)
  const gauge = gaugeShown && !!block;
  body.classList.toggle("pgauge", gauge);
  if (gauge && block) {
    block.querySelector("svg")?.setAttribute("viewBox", GAUGE_CROP);
    body.appendChild(block);
  }
  // the name on top across the poster; below the value it is part of the value's block
  const below = ent.item.namePosition === "below" && !gauge;
  if (!below && showName) body.appendChild(name);
  const text = document.createElement("div");
  text.className = "ptext";
  if (showValue && !repeats && !gaugeShown && fmt) {
    const value = document.createElement("div");
    value.className = "pvalue";
    const big = bigEl(fmt);
    // a word (Cleaning, Away) is drawn smaller than a number, so the controls stay beside it
    big.classList.toggle("word", o.word ?? m.model.num === null);
    value.appendChild(big);
    text.appendChild(value);
  }
  if (below && showName) text.appendChild(name);
  const sec = o.secondary !== undefined ? o.secondary : tplOf(ctx, ent.secondary);
  if (typeof sec === "string") text.appendChild(textEl("secondary", sec));
  else if (sec) text.appendChild(sec);
  // the value's block and the controls beside it; nothing on it takes no room (a gauge's)
  if (text.childElementCount || ctls.els.length) {
    const main = document.createElement("div");
    main.className = "pmain";
    main.appendChild(text);
    if (ctls.els.length) {
      const end = document.createElement("div");
      end.className = "end";
      end.append(...ctls.els);
      main.appendChild(end);
    }
    body.appendChild(main);
  }
  if (block && !gauge) body.appendChild(block);
  appendControls(ctx, ent, idx, m, c.block, body);
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
  if (ent.visual === "ring") {
    cell.appendChild(leadEl(ctx, ent, m, 64, "value"));
    // the ring is the value: a control (also one asked for on the icon) sits under it
    if (c.end.length) {
      const end = document.createElement("div");
      end.className = "end";
      appendControls(ctx, ent, idx, m, c.end, end);
      if (end.childElementCount) cell.appendChild(end);
    }
  } else {
    const lead = leadOf(ctx, ent, idx, m, 32, c.lead);
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
  if (item.showIcon || c.lead.length) el.appendChild(leadOf(ctx, ent, idx, m, 36, c.lead));
  if (name && item.namePosition === "below") el.appendChild(name);
  if (item.showValue) {
    const val = valueEl(ent, m, true);
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
  if (item.showValue) val.appendChild(valueEl(ent, m, true));
  appendControls(ctx, ent, idx, m, c.end, val);
  el.appendChild(val);
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
  else if (c.contains("hval")) fillBadge(ctx, row, ent, idx, m);
  else fillRow(ctx, row, ent, idx, m, c.contains("tile"));
};
