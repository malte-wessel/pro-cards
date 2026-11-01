// Home Assistant's ripple (its ha-ripple) on what a card's shadow tree marks as a button: a light
// layer while a mouse or pen hovers it, and a press that grows from where it starts to cover the
// button. A touch waits a moment, so a scroll never flashes; a press shows at least 225 ms, also a
// quick click, and a click without a pointer (a key) presses from the centre. One set of listeners
// on the shadow root, in the capture phase (the controls stop their events from reaching the row),
// draws into a surface each target gets on first use (STYLE_HOVER: .ripple, .rhover, .rpress);
// the target sets the colour and both opacities (--ripple-color, --ripple-hover, --ripple-pressed).
const TOUCH_DELAY_MS = 150;
const MINIMUM_PRESS_MS = 225;
const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_MINIMUM_SIZE = 75;
const SOFT_EDGE_CONTAINER_RATIO = 0.35;

// what takes the ripple: a card that is one button (its action layer), and Home Assistant's control
// buttons (a stepper's, a row of buttons, a chip); the switch, the segments, the select and a hold
// keep their own layer
export const RIPPLE_TARGETS = [
  ".row.hover-fx:is(.tile, .wtile, .poster, .cell, .hval) > .hit",
  ".row.hover-fx :is(.ctl-stepper, .ctl-buttons) button",
  ".row.hover-fx button.ctl-chip",
].join(", ");

// on touch: inactive → touch-delay → (holding →) waiting-for-click → inactive; a mouse or pen:
// inactive → waiting-for-click → inactive
type PressState = "inactive" | "touch-delay" | "holding" | "waiting-for-click";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isTouch = (ev: PointerEvent) => ev.pointerType === "touch";

// the target's surface, made on first use
const surfaceOf = (el: HTMLElement) => {
  let s = el.querySelector<HTMLElement>(":scope > .ripple");
  if (!s) {
    s = document.createElement("span");
    s.className = "ripple";
    s.setAttribute("aria-hidden", "true");
    const hover = document.createElement("span"),
      press = document.createElement("span");
    hover.className = "rhover";
    press.className = "rpress";
    s.append(hover, press);
    el.appendChild(s);
  }
  return s;
};

export const installRipple = (root: ShadowRoot): (() => void) => {
  let state: PressState = "inactive";
  let target: HTMLElement | null = null;
  let startEvent: PointerEvent | undefined;
  let pressStart: number | undefined;

  const targetOf = (ev: Event) => {
    const el = (ev.target as Element | null)?.closest?.<HTMLElement>(RIPPLE_TARGETS) ?? null;
    if (!el || (el as HTMLButtonElement).disabled || el.closest(".disabled")) return null;
    return el;
  };
  const off = () => window.matchMedia?.("(forced-colors: active)").matches;

  const startPress = (el: HTMLElement, origin?: PointerEvent) => {
    const s = surfaceOf(el);
    const press = s.querySelector<HTMLElement>(":scope > .rpress");
    if (!press) return;
    s.classList.add("pressed");
    const rect = s.getBoundingClientRect();
    const { width, height } = rect;
    const maxDim = Math.max(width, height);
    const softEdge = Math.max(SOFT_EDGE_CONTAINER_RATIO * maxDim, SOFT_EDGE_MINIMUM_SIZE);
    const initial = Math.max(1, Math.floor(maxDim * INITIAL_ORIGIN_SCALE));
    const maxRadius = Math.sqrt(width ** 2 + height ** 2) + PADDING;
    const scale = (maxRadius + softEdge) / initial;
    const startX = (origin ? origin.clientX - rect.left : width / 2) - initial / 2;
    const startY = (origin ? origin.clientY - rect.top : height / 2) - initial / 2;
    const endX = (width - initial) / 2,
      endY = (height - initial) / 2;
    press.style.transitionProperty = "opacity";
    press.style.width = `${initial}px`;
    press.style.height = `${initial}px`;
    press.style.transform = `translate(${startX}px, ${startY}px) scale(1)`;
    press.getBoundingClientRect();
    press.style.transitionProperty = "";
    press.style.transform = `translate(${endX}px, ${endY}px) scale(${scale})`;
    pressStart = performance.now();
  };

  const endPress = async () => {
    const el = target;
    startEvent = undefined;
    state = "inactive";
    const started = pressStart;
    const remaining = started === undefined ? 0 : MINIMUM_PRESS_MS - (performance.now() - started);
    if (remaining > 0) {
      await wait(remaining);
      // another press began meanwhile: it ends itself
      if (pressStart !== started) return;
    }
    el?.querySelector(":scope > .ripple")?.classList.remove("pressed");
  };

  // the primary pointer, and only the one that started the press; hover from a mouse or pen
  const reacts = (ev: PointerEvent) => {
    if (!ev.isPrimary) return false;
    if (startEvent && startEvent.pointerId !== ev.pointerId) return false;
    if (ev.type === "pointerover" || ev.type === "pointerout") return !isTouch(ev);
    return isTouch(ev) || ev.buttons === 1;
  };

  const onEvent = (ev: Event) => {
    if (off()) return;
    if (ev.type === "click") {
      const el = targetOf(ev);
      if (state === "waiting-for-click") void endPress();
      else if (state === "inactive" && el) {
        target = el;
        startPress(el);
        void endPress();
      }
      return;
    }
    if (ev.type === "contextmenu" || ev.type === "touchend") {
      if (state !== "inactive") void endPress();
      return;
    }
    if (!(ev instanceof PointerEvent) || !reacts(ev)) return;
    switch (ev.type) {
      case "pointerover": {
        const el = targetOf(ev);
        if (el) surfaceOf(el).classList.add("hovered");
        break;
      }
      case "pointerout": {
        const el = (ev.target as Element | null)?.closest?.<HTMLElement>(RIPPLE_TARGETS);
        // still inside it (onto one of its children)
        if (!el || el.contains(ev.relatedTarget as Node | null)) break;
        el.querySelector(":scope > .ripple")?.classList.remove("hovered");
        if (el === target && state !== "inactive") void endPress();
        break;
      }
      case "pointerdown": {
        const el = targetOf(ev);
        if (!el) break;
        target = el;
        startEvent = ev;
        if (!isTouch(ev)) {
          state = "waiting-for-click";
          startPress(el, ev);
          break;
        }
        state = "touch-delay";
        void wait(TOUCH_DELAY_MS).then(() => {
          if (state !== "touch-delay" || target !== el) return;
          state = "holding";
          startPress(el, ev);
        });
        break;
      }
      case "pointerup":
        if (state === "holding") state = "waiting-for-click";
        else if (state === "touch-delay" && target) {
          state = "waiting-for-click";
          startPress(target, startEvent);
        }
        break;
      case "pointercancel":
        if (state !== "inactive") void endPress();
        break;
    }
  };

  const TYPES = [
    "click",
    "contextmenu",
    "pointercancel",
    "pointerdown",
    "pointerover",
    "pointerout",
    "pointerup",
    "touchend",
  ];
  for (const type of TYPES) root.addEventListener(type, onEvent, { capture: true });
  return () => {
    for (const type of TYPES) root.removeEventListener(type, onEvent, { capture: true });
  };
};
