// Small DOM builders: icon lead, pills, text and the big value.
import type { HassEntity } from "../../ha.ts";
import type { EntityItem } from "../config.ts";
import type { Look } from "../look.ts";
import type { EntityModel, FmtValue, RenderCtx } from "../model.ts";

export const iconEl = (ctx: RenderCtx, look: Look, st: HassEntity | undefined): HTMLElement => {
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
  if (ent.visual === "ring") {
    el.classList.add("ring");
    const sw = Math.max(3, Math.round(size * 0.09)),
      r = size / 2 - sw / 2,
      C = 2 * Math.PI * r;
    const p = m.progress;
    el.innerHTML = `<svg viewBox="0 0 ${size} ${size}"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"/>${
      p === null
        ? ""
        : `<circle class="prog" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - p)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`
    }</svg>`;
  }
  const shape = document.createElement("div");
  shape.className = "shape";
  if (inner === "value") {
    shape.classList.add("value");
    shape.textContent = m.fmt.text;
  } else shape.appendChild(iconEl(ctx, m.look, m.st));
  el.appendChild(shape);
  return el;
};
export const pillEl = (text: string) => {
  const s = document.createElement("span");
  s.className = "pill";
  s.textContent = text;
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
// value element for items, fields and header entities: pill for badges, plain state otherwise
export const valueEl = (ent: EntityItem, m: EntityModel) => {
  if (ent.visual === "badge") return pillEl(m.look.label ?? m.fmt.text);
  const st = document.createElement("span");
  st.className = "state";
  st.textContent = m.fmt.text;
  return st;
};
