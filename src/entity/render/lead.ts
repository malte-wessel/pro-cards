// Small DOM builders: icon lead, pills, text, the big value and the toggle switch.
import { fireHaptic } from "../../shared/card.ts";
import type { HassEntity } from "../../shared/ha.ts";
import type { EntityItem } from "../config.ts";
import { OFF_STATES } from "../constants.ts";
import type { Look } from "../look.ts";
import { nameOf, type EntityModel, type FmtValue, type RenderCtx } from "../model.ts";

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
export const toggleEl = (ctx: RenderCtx, ent: EntityItem, m: EntityModel) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "toggle";
  const on = !!m.st && m.model.avail && !OFF_STATES.has(m.st.state);
  if (on) b.classList.add("on");
  b.setAttribute("aria-label", `Toggle ${nameOf(ctx, ent, m.st)}`);
  b.setAttribute("aria-pressed", String(on));
  b.innerHTML = "<i></i>";
  const stop = (ev: Event) => ev.stopPropagation();
  b.addEventListener("pointerdown", stop);
  b.addEventListener("pointerup", stop);
  b.addEventListener("keydown", stop);
  b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (!ent.entity) return;
    ctx.hass?.callService("homeassistant", "toggle", { entity_id: ent.entity });
    fireHaptic(b);
  });
  return b;
};
