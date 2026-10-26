// Small DOM builders: icon lead, pills, text and the big value.
import type { HassEntity } from "../../ha.ts";
import type { EntityItem } from "../config.ts";
import type { Look } from "../look.ts";
import type { EntityModel, FmtValue, RenderCtx } from "../model.ts";

export const iconEl = (
  ctx: RenderCtx,
  look: Pick<Look, "icon" | "fallbackIcon">,
  st: HassEntity | undefined,
): HTMLElement => {
  if (st && customElements.get("ha-state-icon")) {
    const el = document.createElement("ha-state-icon");
    el.hass = ctx.hass;
    el.stateObj = st;
    if (look.icon) el.icon = look.icon;
    return el;
  }
  const el = document.createElement("ha-icon");
  el.setAttribute("icon", look.icon || look.fallbackIcon || "mdi:eye");
  return el;
};
// the entity's picture where it has one to show (show_entity_picture), else its icon; the
// buttons that stand in for the icon keep the icon, as it marks them as buttons
export const iconOrPictureEl = (
  ctx: RenderCtx,
  look: Pick<Look, "icon" | "fallbackIcon" | "picture">,
  st: HassEntity | undefined,
): HTMLElement => {
  if (!look.picture) return iconEl(ctx, look, st);
  const img = document.createElement("img");
  img.className = "picture";
  // the name sits beside it
  img.alt = "";
  img.draggable = false;
  img.src = ctx.hass?.hassUrl ? ctx.hass.hassUrl(look.picture) : look.picture;
  return img;
};
// a progress ring of `size` px: the track and, with a value, the arc from the top (the lead's ring
// and a header badge's)
export const ringSvg = (
  size: number,
  p: number | null,
  sw = Math.max(3, Math.round(size * 0.09)),
) => {
  const c = size / 2,
    r = c - sw / 2,
    C = 2 * Math.PI * r;
  return `<svg viewBox="0 0 ${size} ${size}"><circle class="track" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}"/>${
    p === null
      ? ""
      : `<circle class="prog" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - p)).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>`
  }</svg>`;
};
// round lead of `size` px: icon (or the value) in a soft circle, a progress ring for visual: ring
export const leadEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  m: EntityModel,
  size: number,
  inner: "icon" | "value" = "icon",
) => {
  const el = document.createElement("div");
  el.className = "lead";
  el.style.setProperty("--lead", `${size}px`);
  if (ent.iconStyle === "plain") el.classList.add("plain");
  if (ent.visual === "ring") {
    el.classList.add("ring");
    el.innerHTML = ringSvg(size, m.progress);
  }
  const shape = document.createElement("div");
  shape.className = "shape";
  if (inner === "value") {
    shape.classList.add("value");
    shape.textContent = m.fmt.text;
  } else shape.appendChild(iconOrPictureEl(ctx, m.look, m.st));
  el.appendChild(shape);
  return el;
};
export const pillEl = (text: string) => {
  const s = document.createElement("span");
  s.className = "pill";
  s.textContent = text;
  return s;
};
// the badge of a header item: one pill that carries the icon and the label or value; with an icon
// and nothing to say (show_value: false, or an empty text) it is the icon in a circle
export const headerBadgeEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel) => {
  const text = ent.item.showValue ? (m.look.label ?? m.fmt.text) : "";
  const icon = ent.item.showIcon ? iconOrPictureEl(ctx, m.look, m.st) : null;
  if (!icon && !text.trim()) return null;
  const s = document.createElement("span");
  s.className = "pill badge";
  if (icon) s.appendChild(icon);
  if (text.trim()) {
    const t = document.createElement("span");
    t.textContent = text;
    s.appendChild(t);
  } else s.classList.add("round");
  return s;
};
export const textEl = (cls: string, text: string | null | undefined) => {
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = text ?? "";
  return d;
};
// the secondary line from parts joined by " · "; an accent part takes the row colour
export const secondaryEl = (parts: { text: string; accent?: boolean }[]) => {
  const el = document.createElement("div");
  el.className = "secondary";
  fillSecondary(el, parts);
  return el;
};
export const fillSecondary = (el: HTMLElement, parts: { text: string; accent?: boolean }[]) => {
  el.replaceChildren();
  parts.forEach((p, i) => {
    if (i > 0) el.appendChild(document.createTextNode(" · "));
    if (p.accent) {
      const s = document.createElement("span");
      s.className = "accent";
      s.textContent = p.text;
      el.appendChild(s);
    } else el.appendChild(document.createTextNode(p.text));
  });
};
// number and unit on one baseline (hero lead, grid cell)
export const bigEl = (fmt: FmtValue) => {
  const big = document.createElement("div");
  big.className = "big";
  const b = document.createElement("b");
  b.textContent = fmt.num;
  big.appendChild(b);
  if (fmt.unit) {
    const u = document.createElement("span");
    u.textContent = fmt.unit;
    big.appendChild(u);
  }
  return big;
};
// value element for items, fields and header entities: pill for badges, plain state otherwise.
// With `label` a matching rule's label stands in for the value, in the rule's colour, as the pill
// does; the list row keeps the plain value as it shows the label on its own line
export const valueEl = (ent: EntityItem, m: EntityModel, label = false) => {
  if (ent.visual === "badge") return pillEl(m.look.label ?? m.fmt.text);
  const st = document.createElement("span");
  st.className = "state";
  if (label && m.look.label) {
    st.classList.add("accent");
    st.textContent = m.look.label;
  } else st.textContent = m.fmt.text;
  return st;
};
