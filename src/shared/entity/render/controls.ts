// The control builders: toggle, lead tap, slider, stepper, segments, buttons, chip, select and
// hold to confirm. Each draws the entity's current value (or the value of a pending call) and
// hands the service call to the card (ctx.ctl). A control swallows its pointer and key events so
// the row's own tap / hold actions never fire.
import { fmtNumber } from "../../format.ts";
import { t } from "../../i18n.ts";
import { clamp01 } from "../../util.ts";
import type { EntityItem } from "../config.ts";
import {
  ARM_MS,
  buttonsOf,
  clampStep,
  currentOptionOf,
  DONE_MS,
  HOLD_CONFIRM_MS,
  isOn,
  optionsOf,
  PENDING_MS,
  rangeOf,
  serviceFor,
  sliderApplies,
  type ControlHost,
  type Pending,
  type Placement,
  type Range,
} from "../control.ts";
import { nameOf, type EntityModel, type RenderCtx } from "../model.ts";
import { iconEl } from "./lead.ts";

const SWALLOW = ["pointerdown", "pointerup", "click", "keydown", "keyup"];
// the row underneath must not see the control's gestures
export const guard = (el: HTMLElement) => {
  for (const type of SWALLOW) el.addEventListener(type, (ev) => ev.stopPropagation());
};
const icon = (name: string) => {
  const el = document.createElement("ha-icon");
  el.setAttribute("icon", name);
  return el;
};
const button = (cls: string, label: string) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.setAttribute("aria-label", label);
  return b;
};
const root = (kind: string, p: Placement, idx: number, tag = "div") => {
  const el = document.createElement(tag);
  el.className = `ctl ctl-${kind}${p.small ? " sm" : ""}`;
  el.dataset.idx = String(idx);
  guard(el);
  return el;
};
// the unavailable look: greyed out and inert
const disable = (el: HTMLElement) => {
  el.classList.add("disabled");
  el.setAttribute("aria-disabled", "true");
  for (const b of el.querySelectorAll("button")) b.disabled = true;
  if (el.tagName === "BUTTON") (el as HTMLButtonElement).disabled = true;
  if (el.hasAttribute("tabindex")) el.tabIndex = -1;
};
const stepDecimals = (step: number) => Math.min(4, (String(step).split(".")[1] || "").length);
const fmtRange = (ctx: RenderCtx, r: Range, v: number) => {
  const n = fmtNumber(ctx.hass, v, stepDecimals(r.step));
  return r.unit ? `${n} ${r.unit}` : n;
};
const pendingNum = (p: Pending | undefined) => (typeof p?.value === "number" ? p.value : null);
const pendingStr = (p: Pending | undefined) => (typeof p?.value === "string" ? p.value : null);
const later = (ms = PENDING_MS) => Date.now() + ms;

// ----- toggle and lead tap -----

const toggleTarget = (ctx: RenderCtx, idx: number, m: EntityModel) => {
  const p = ctx.ctl?.pending.get(idx);
  const s = pendingStr(p);
  const pending = s === "on" || s === "off";
  return { on: m.model.avail && (pending ? s === "on" : isOn(m.st)), pending };
};
const bindToggle = (
  el: HTMLElement,
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  on: boolean,
) => {
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    ctx.ctl?.call(el, idx, ent, serviceFor(ent, m.st, { type: "toggle" }), {
      until: later(),
      value: on ? "off" : "on",
    });
  });
};
export const toggleEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement = { kind: "toggle", position: "end", small: false },
) => {
  const b = button(
    `ctl toggle${p.small ? " sm" : ""}`,
    t(ctx.hass, "control.toggle", { name: nameOf(ctx, ent, m.st) }),
  );
  b.dataset.idx = String(idx);
  guard(b);
  const { on, pending } = toggleTarget(ctx, idx, m);
  b.classList.toggle("on", on);
  b.classList.toggle("pending", pending);
  b.setAttribute("role", "switch");
  b.setAttribute("aria-checked", String(on));
  b.innerHTML = "<i></i>";
  if (!m.model.avail) disable(b);
  else bindToggle(b, ctx, ent, idx, m, on);
  return b;
};
// the lead itself toggles: filled when on, grey when off
export const bindLeadTap = (
  lead: HTMLElement,
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
) => {
  lead.classList.add("tap");
  const { on, pending } = toggleTarget(ctx, idx, m);
  lead.classList.toggle("off", !on);
  lead.classList.toggle("pending", pending);
  lead.setAttribute("role", "switch");
  lead.setAttribute("aria-label", t(ctx.hass, "control.toggle", { name: nameOf(ctx, ent, m.st) }));
  lead.setAttribute("aria-checked", String(on));
  lead.tabIndex = 0;
  guard(lead);
  if (!m.model.avail) {
    disable(lead);
    return;
  }
  bindToggle(lead, ctx, ent, idx, m, on);
  lead.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      lead.click();
    }
  });
};

// ----- slider -----

export const sliderEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const r = rangeOf(ent, m.st, ctx.hass);
  const el = root("slider", p, idx);
  el.setAttribute("role", "slider");
  el.tabIndex = 0;
  el.setAttribute("aria-label", t(ctx.hass, "control.set", { name: nameOf(ctx, ent, m.st) }));
  el.setAttribute("aria-valuemin", String(r.min));
  el.setAttribute("aria-valuemax", String(r.max));
  el.innerHTML = `<div class="track"><i class="fill"></i><b class="knob"></b><u class="bubble"></u></div>`;
  const track = el.firstElementChild as HTMLElement,
    fill = track.children[0] as HTMLElement,
    knob = track.children[1] as HTMLElement,
    bubble = track.children[2] as HTMLElement;
  const pend = host.pending.get(idx),
    pv = pendingNum(pend);
  const shown = pv ?? r.value;
  const span = r.max - r.min || 1;
  const paint = (v: number) => {
    const pct = `${(clamp01((v - r.min) / span) * 100).toFixed(1)}%`;
    fill.style.width = pct;
    knob.style.left = pct;
    bubble.style.left = pct;
    bubble.textContent = fmtRange(ctx, r, v);
    el.setAttribute("aria-valuenow", String(v));
    el.setAttribute("aria-valuetext", bubble.textContent);
  };
  if (shown === null || !m.model.avail) {
    paint(r.min);
    disable(el);
    return el;
  }
  paint(shown);
  el.classList.toggle("pending", pv !== null);
  let v = shown;
  const valueAt = (ev: PointerEvent) => {
    const rect = track.getBoundingClientRect();
    const f = clamp01((ev.clientX - rect.left) / (rect.width || 1));
    return clampStep(r.min + f * span, r);
  };
  const commit = () => {
    host.call(
      el,
      idx,
      ent,
      serviceFor(ent, m.st, { type: "value", value: v }),
      { until: later(), value: v },
      "selection",
    );
  };
  el.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    el.setPointerCapture(ev.pointerId);
    host.beginDrag(idx);
    el.classList.add("dragging");
    v = valueAt(ev);
    paint(v);
  });
  el.addEventListener("pointermove", (ev) => {
    if (!el.classList.contains("dragging")) return;
    v = valueAt(ev);
    paint(v);
  });
  const release = (ev: PointerEvent) => {
    if (!el.classList.contains("dragging")) return;
    el.classList.remove("dragging");
    if (el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
    if (ev.type !== "pointercancel") commit();
    host.endDrag(idx);
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  // keyboard: arrows step, PageUp / PageDown jump, Home / End; the call follows a short pause
  let keyTimer: ReturnType<typeof setTimeout> | undefined;
  el.addEventListener("keydown", (ev) => {
    const big = r.step * 10;
    let next: number | null = null;
    if (ev.key === "ArrowRight" || ev.key === "ArrowUp") next = v + r.step;
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") next = v - r.step;
    else if (ev.key === "PageUp") next = v + big;
    else if (ev.key === "PageDown") next = v - big;
    else if (ev.key === "Home") next = r.min;
    else if (ev.key === "End") next = r.max;
    if (next === null) return;
    ev.preventDefault();
    v = clampStep(next, r);
    paint(v);
    host.beginDrag(idx);
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => {
      commit();
      host.endDrag(idx);
    }, 250);
  });
  return el;
};

// ----- stepper -----

export const stepperEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const r = rangeOf(ent, m.st, ctx.hass);
  const el = root("stepper", p, idx);
  const name = nameOf(ctx, ent, m.st);
  const dec = button("round s", t(ctx.hass, "control.decrease", { name }));
  dec.appendChild(icon("mdi:minus"));
  const val = document.createElement("span");
  val.className = "val";
  const inc = button("round s", t(ctx.hass, "control.increase", { name }));
  inc.appendChild(icon("mdi:plus"));
  el.append(dec, val, inc);
  const shown = pendingNum(host.pending.get(idx)) ?? r.value;
  if (shown === null || !m.model.avail) {
    val.textContent = m.fmt.text;
    disable(el);
    return el;
  }
  val.textContent = fmtRange(ctx, r, shown);
  el.classList.toggle("pending", pendingNum(host.pending.get(idx)) !== null);
  dec.disabled = shown <= r.min;
  inc.disabled = shown >= r.max;
  const step = (dir: 1 | -1) => {
    const next = clampStep(shown + dir * r.step, r);
    if (next === shown) return;
    host.call(
      el,
      idx,
      ent,
      serviceFor(ent, m.st, { type: "step", dir, from: shown }),
      { until: later(), value: next },
      "selection",
    );
  };
  dec.addEventListener("click", () => step(-1));
  inc.addEventListener("click", () => step(1));
  return el;
};

// ----- segments and select -----

const optionText = (value: string, label: string | null) =>
  label ?? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const segmentsEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const opts = optionsOf(ent, m.st);
  if (!opts.length) return null;
  const el = root("segments", p, idx);
  el.setAttribute("role", "radiogroup");
  el.setAttribute("aria-label", t(ctx.hass, "control.choose", { name: nameOf(ctx, ent, m.st) }));
  const pend = pendingStr(host.pending.get(idx));
  const current = pend ?? currentOptionOf(ent, m.st);
  // on the line the segments are icons where they have one; the text stays for the block
  const compact = p.small || p.position !== "block";
  const segs: HTMLButtonElement[] = [];
  for (const o of opts) {
    const text = optionText(o.value, o.label);
    const b = button("seg", text);
    b.setAttribute("role", "radio");
    b.tabIndex = -1;
    segs.push(b);
    const on = o.value === current;
    b.setAttribute("aria-checked", String(on));
    b.classList.toggle("on", on);
    b.classList.toggle("pending", on && pend !== null);
    if (o.icon) b.appendChild(icon(o.icon));
    if (text && (!o.icon || !compact)) {
      const s = document.createElement("span");
      s.textContent = text;
      b.appendChild(s);
    }
    b.title = text || o.value;
    b.addEventListener("click", () => {
      if (o.value === current) return;
      host.call(el, idx, ent, serviceFor(ent, m.st, { type: "option", value: o.value }), {
        until: later(),
        value: o.value,
      });
    });
    el.appendChild(b);
  }
  // one tab stop (the checked segment); the arrow keys move and choose, like a radio group
  (segs.find((b) => b.classList.contains("on")) ?? segs[0]).tabIndex = 0;
  el.addEventListener("keydown", (ev) => {
    const n = segs.length,
      i = segs.findIndex((b) => b.matches(":focus"));
    let to = -1;
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") to = (i + 1) % n;
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") to = (i - 1 + n) % n;
    else if (ev.key === "Home") to = 0;
    else if (ev.key === "End") to = n - 1;
    if (i < 0 || to < 0) return;
    ev.preventDefault();
    segs[to].focus();
    segs[to].click();
  });
  if (!m.model.avail) disable(el);
  return el;
};

export const selectEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const opts = optionsOf(ent, m.st);
  if (!opts.length) return null;
  const el = root("select", p, idx);
  const sel = document.createElement("select");
  sel.setAttribute("aria-label", t(ctx.hass, "control.choose", { name: nameOf(ctx, ent, m.st) }));
  const pend = pendingStr(host.pending.get(idx));
  const current = pend ?? currentOptionOf(ent, m.st);
  for (const o of opts) {
    const opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = optionText(o.value, o.label);
    opt.selected = o.value === current;
    sel.appendChild(opt);
  }
  if (current !== null && !opts.some((o) => o.value === current)) {
    const opt = document.createElement("option");
    opt.value = current;
    opt.textContent = optionText(current, null);
    opt.selected = true;
    sel.appendChild(opt);
  }
  el.classList.toggle("pending", pend !== null);
  el.append(sel, icon("mdi:menu-down"));
  sel.addEventListener("change", () => {
    host.call(el, idx, ent, serviceFor(ent, m.st, { type: "option", value: sel.value }), {
      until: later(),
      value: sel.value,
    });
  });
  if (!m.model.avail) {
    disable(el);
    sel.disabled = true;
  }
  return el;
};

// ----- buttons, chip, hold -----

export const buttonsEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const list = buttonsOf(ent);
  if (!list.length) return null;
  const el = root("buttons", p, idx);
  const pend = pendingStr(host.pending.get(idx));
  for (const b of list) {
    const btn = button(`round${b.primary ? " f" : ""}`, t(ctx.hass, b.labelKey));
    const ic =
      b.id === "play_pause" ? (m.st?.state === "playing" ? "mdi:pause" : "mdi:play") : b.icon;
    if (p.confirm) btn.appendChild(ringEl());
    btn.appendChild(icon(ic));
    btn.classList.toggle("pending", pend === b.id);
    const run = () =>
      host.call(
        el,
        idx,
        ent,
        serviceFor(ent, m.st, { type: "button", id: b.id }),
        { until: later(), value: b.id },
        p.confirm ? "success" : "light",
      );
    // with confirm every button is a hold of its own (the ring fills around it)
    if (p.confirm && m.model.avail) {
      btn.classList.add("hold");
      bindHold(btn, ctx, host, idx, t(ctx.hass, b.labelKey), run);
    } else btn.addEventListener("click", run);
    el.appendChild(btn);
  }
  if (!m.model.avail) disable(el);
  return el;
};

// a text chip ("Run"), or a round icon button in the lead of a row item; shows "Done" for a moment
export const buttonEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const round = p.position === "lead";
  const name = nameOf(ctx, ent, m.st);
  const el = root("chip", p, idx, "button") as HTMLButtonElement;
  el.type = "button";
  const done = pendingStr(host.pending.get(idx)) === "done";
  el.classList.toggle("done", done);
  if (round) {
    el.classList.add("round");
    el.setAttribute("aria-label", t(ctx.hass, "control.run"));
    el.appendChild(done ? icon("mdi:check") : iconEl(ctx, m.look, m.st));
  } else {
    el.appendChild(icon(done ? "mdi:check" : "mdi:play"));
    const s = document.createElement("span");
    s.textContent = t(ctx.hass, done ? "control.done" : "control.run");
    el.appendChild(s);
    el.setAttribute("aria-label", `${t(ctx.hass, "control.run")} ${name}`);
  }
  el.addEventListener("click", () => {
    const svc = serviceFor(ent, m.st, { type: "press" });
    if (svc)
      host.call(
        el,
        idx,
        ent,
        svc,
        { until: later(DONE_MS), value: "done", sticky: true },
        "success",
      );
    else host.runAction(ent, ent.tap, "tap");
  });
  if (!m.model.avail) disable(el);
  return el;
};

const holdIcon = (ctx: RenderCtx, ent: EntityItem, m: EntityModel) => {
  const d = String(ent.entity || "").split(".")[0];
  if (d === "lock") return icon(m.st?.state === "locked" ? "mdi:lock-open-variant" : "mdi:lock");
  return iconEl(ctx, m.look, m.st);
};
// the ring that fills around a held button
const ringEl = () => {
  const C = (2 * Math.PI * 17).toFixed(1);
  const tpl = document.createElement("template");
  tpl.innerHTML = `<svg class="ring" viewBox="0 0 40 40"><circle class="prog" cx="20" cy="20" r="17" transform="rotate(-90 20 20)" stroke-dasharray="${C}" style="--c:${C}"/></svg>`;
  return tpl.content.firstElementChild as SVGElement;
};
// press and hold: the ring fills for HOLD_CONFIRM_MS, then `run`; letting go earlier cancels.
// The row keeps its DOM while the ring fills (beginDrag): an update of another entity in the card
// must not rebuild the button under the finger. Assistive technology sends a bare click (no
// pointer, no key): the first arms the button, a second within ARM_MS runs it.
const bindHold = (
  el: HTMLElement,
  ctx: RenderCtx,
  host: ControlHost,
  idx: number,
  action: string,
  run: () => void,
) => {
  const isArmed = () => (host.armed.get(idx) ?? 0) > Date.now();
  const label = (again: boolean) =>
    el.setAttribute(
      "aria-label",
      t(ctx.hass, again ? "control.press_again" : "control.hold_to", { action }),
    );
  label(isArmed());
  el.classList.toggle("armed", isArmed());
  let timer: ReturnType<typeof setTimeout> | undefined,
    fired = false,
    started = false;
  const fire = () => {
    timer = undefined;
    fired = true;
    el.classList.remove("holding");
    host.armed.delete(idx);
    run();
    host.endDrag(idx);
  };
  const start = () => {
    fired = false;
    started = true;
    host.beginDrag(idx);
    el.classList.add("holding");
    clearTimeout(timer);
    timer = setTimeout(fire, HOLD_CONFIRM_MS);
  };
  const cancel = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    el.classList.remove("holding");
    host.endDrag(idx);
  };
  // the click that follows a pointer or key gesture is not a press of its own
  const done = () => setTimeout(() => (started = false), 0);
  el.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    el.setPointerCapture(ev.pointerId);
    start();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    el.addEventListener(type, () => {
      if (!fired) cancel();
      done();
    });
  el.addEventListener("keydown", (ev) => {
    if ((ev.key === "Enter" || ev.key === " ") && !ev.repeat) {
      ev.preventDefault();
      start();
    }
  });
  el.addEventListener("keyup", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault();
    if (!fired) cancel();
    done();
  });
  el.addEventListener("blur", cancel);
  el.addEventListener("click", (ev) => {
    if (started || ev.detail !== 0) return;
    if (isArmed()) {
      fire();
      return;
    }
    host.armed.set(idx, Date.now() + ARM_MS);
    el.classList.add("armed");
    label(true);
    setTimeout(() => {
      if ((host.armed.get(idx) ?? 0) <= Date.now()) host.armed.delete(idx);
      if (el.isConnected) {
        el.classList.remove("armed");
        label(false);
      }
    }, ARM_MS);
  });
};
// the hold-to-confirm button: locks, or any toggle / button with `control_confirm`
export const holdEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
) => {
  const host = ctx.ctl as ControlHost;
  const d = String(ent.entity || "").split(".")[0];
  const action =
    d === "lock"
      ? t(ctx.hass, m.st?.state === "locked" ? "control.unlock" : "control.lock")
      : nameOf(ctx, ent, m.st);
  const el = root("hold", p, idx, "button") as HTMLButtonElement;
  el.type = "button";
  if (p.position === "lead") el.classList.add("lead-size");
  el.setAttribute("aria-label", t(ctx.hass, "control.hold_to", { action }));
  el.append(ringEl(), holdIcon(ctx, ent, m));
  el.classList.toggle("pending", host.pending.has(idx));
  if (!m.model.avail) {
    disable(el);
    return el;
  }
  bindHold(el, ctx, host, idx, action, () =>
    host.call(el, idx, ent, serviceFor(ent, m.st, { type: "hold" }), { until: later() }, "success"),
  );
  return el;
};

// the control of a placement, or null when the entity has nothing to show for it
export const controlEl = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  p: Placement,
): HTMLElement | null => {
  if (!ctx.ctl) return null;
  switch (p.kind) {
    case "toggle":
      return toggleEl(ctx, ent, idx, m, p);
    case "slider":
      return sliderApplies(ent, m.st) ? sliderEl(ctx, ent, idx, m, p) : null;
    case "stepper":
      return stepperEl(ctx, ent, idx, m, p);
    case "segments":
      return segmentsEl(ctx, ent, idx, m, p);
    case "select":
      return selectEl(ctx, ent, idx, m, p);
    case "buttons":
      return buttonsEl(ctx, ent, idx, m, p);
    case "button":
      return buttonEl(ctx, ent, idx, m, p);
    case "hold":
      return holdEl(ctx, ent, idx, m, p);
  }
};
// appends the controls of `list` to `slot`
export const appendControls = (
  ctx: RenderCtx,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  list: Placement[],
  slot: HTMLElement,
) => {
  for (const p of list) {
    const el = controlEl(ctx, ent, idx, m, p);
    if (el) slot.appendChild(el);
  }
};
