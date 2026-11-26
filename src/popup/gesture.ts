// Pop-up Card Pro: dragging the sheet. Its top follows the finger 1:1. It rests at its content's
// height or at the full height (the most it may be, a gap at the top): dragged up it grows (its
// cards stay at the top), dragged down from the full height it shrinks back, and below its
// content's height it moves down: let go past a third of that, or flicked down, it closes. It
// takes a move from the handle and the header at any time; from the cards a downward one where
// nothing under the finger can scroll up any more, and an upward one while it can still grow; a
// sideways move stays with the cards (a slider, a swipe card). Touch events, not pointer events: once the
// browser takes a touch for a scroll it cancels the pointer, so the sheet could not take the move
// over where the scroll ends; a non-passive touchmove can, by preventing the scroll.

// how far a finger moves before its direction counts
export const SLOP = 8;
// let go past this share of the sheet's height, it closes
export const CLOSE_AT = 0.3;
// flicked down faster than this (px/ms), it closes wherever it is
export const FLICK = 0.5;
// flicked up faster than this, it stays wherever it is
const FLICK_UP = 0.3;
// the time the release speed is measured over (ms)
const SPEED_WINDOW = 100;
// how far a release's speed carries the sheet (ms of it): where it settles between its heights
const PROJECT_MS = 200;
// a content this close to the full height has no second height
export const MIN_STEP = 24;

export interface Sample {
  y: number;
  t: number;
}

// how far a pull beyond the full height moves the sheet: it stretches, never far
export const rubber = (d: number) => 48 * (1 - Math.exp(-d / 140));

// the sheet at `extent` (how far its top is above the bottom), `nat` its content's height, `max`
// the full height: as tall as that from its content's height up (stretching a little beyond the
// full height), else its content's height moved down by the rest
export interface Pose {
  height: number;
  shift: number;
}
export const poseOf = (extent: number, nat: number, max: number): Pose =>
  extent >= nat
    ? { height: extent <= max ? extent : max + rubber(extent - max), shift: 0 }
    : { height: nat, shift: nat - extent };

// where a drag let go at `extent` with `speed` (px/ms, down positive) settles: below the content's
// height it closes or comes back up (CLOSE_AT, FLICK); above it, at the height nearer to where its
// speed would carry it
export type Rest = "full" | "content" | "closed";
export const settleAt = (extent: number, speed: number, nat: number, max: number): Rest => {
  if (extent < nat) return shouldClose(nat - extent, nat, speed) ? "closed" : "content";
  if (max - nat < MIN_STEP) return "content";
  return extent - speed * PROJECT_MS > (nat + max) / 2 ? "full" : "content";
};

// the speed (px/ms, down positive) over the samples
export const speedOf = (s: Sample[]): number => {
  if (s.length < 2) return 0;
  const a = s[0],
    b = s[s.length - 1];
  return b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0;
};

// whether the sheet takes a move of (dx, dy): a vertical one from the handle or the header, a
// downward one where nothing under the finger can scroll up, an upward one while the sheet can
// still grow
export const takesMove = (
  dx: number,
  dy: number,
  onHandle: boolean,
  atTop: boolean,
  canGrow: boolean,
) => Math.abs(dy) >= Math.abs(dx) && (onHandle || (dy > 0 && atTop) || (dy < 0 && canGrow));

export const shouldClose = (offset: number, height: number, speed: number) =>
  speed > -FLICK_UP && (offset > CLOSE_AT * height || speed > FLICK);

// how long the rest of the way down takes: at the finger's speed, at least the open's pace
export const closeDuration = (rest: number, height: number, speed: number) =>
  Math.max(140, Math.min(320, rest / Math.max(speed, height / 300)));

export interface DragHooks {
  // whether the sheet can be dragged now (open, and a sheet, not a dialog)
  enabled(): boolean;
  // whether a target is the handle or the header (not its close button)
  onHandle(path: EventTarget[]): boolean;
  // whether the sheet can grow (it rests at its content's height, below the full height)
  canGrow(): boolean;
  // the finger `d` px below where the drag took over
  move(d: number): void;
  // let go `d` px below, at `speed`
  release(d: number, speed: number): void;
}

interface Drag {
  x: number;
  y: number;
  y0: number;
  handle: boolean;
  grow: boolean;
  path: EventTarget[];
  decided: boolean;
  d: number;
  samples: Sample[];
}

// wires a sheet's touches (and a mouse on its handle) to the hooks
export class SheetDrag {
  _sheet: HTMLElement;
  _hooks: DragHooks;
  _d: Drag | null = null;
  // the press the drag began with: what it pressed is told it is over once the sheet takes the move
  _down?: { id: number; type: string; target: EventTarget };

  constructor(sheet: HTMLElement, hooks: DragHooks) {
    this._sheet = sheet;
    this._hooks = hooks;
    sheet.addEventListener("touchstart", this._touchStart, { passive: true });
    sheet.addEventListener("touchmove", this._touchMove, { passive: false });
    sheet.addEventListener("touchend", this._end);
    sheet.addEventListener("touchcancel", this._end);
    sheet.addEventListener("pointerdown", this._mouseDown);
    sheet.addEventListener(
      "pointerdown",
      (e) => (this._down = { id: e.pointerId, type: e.pointerType, target: e.composedPath()[0] }),
      { capture: true },
    );
  }

  // The sheet took the move: what the finger pressed lets go without acting (a tile's tap or hold,
  // a slider's change, a ripple), as when the browser takes a touch for a scroll. The browser sends
  // no pointercancel here, since the sheet keeps it from scrolling; Home Assistant's own cards end
  // their press on any touchmove anyway.
  _takeOver() {
    const d = this._down;
    this._down = undefined;
    d?.target.dispatchEvent(
      new PointerEvent("pointercancel", {
        pointerId: d.id,
        pointerType: d.type,
        bubbles: true,
        composed: true,
      }),
    );
  }

  _start(x: number, y: number, t: number, path: EventTarget[]) {
    if (!this._hooks.enabled()) return;
    this._d = {
      x,
      y,
      y0: y,
      handle: this._hooks.onHandle(path),
      grow: this._hooks.canGrow(),
      path,
      decided: false,
      d: 0,
      samples: [{ y, t }],
    };
  }

  // whether anything under the finger, up to the sheet, is scrolled down
  _atTop(path: EventTarget[]): boolean {
    for (const el of path) {
      if (el === this._sheet) break;
      if (el instanceof Element && el.scrollTop > 0) return false;
    }
    return true;
  }

  // returns whether the sheet takes the move (the caller then prevents the scroll)
  _move(x: number, y: number, t: number): boolean {
    const d = this._d;
    if (!d) return false;
    if (!d.decided) {
      const dx = x - d.x,
        dy = y - d.y;
      const wants = takesMove(dx, dy, d.handle, this._atTop(d.path), d.grow);
      // still within the slop: hold the scroll back while the move may be the sheet's
      if (Math.hypot(dx, dy) < SLOP) return wants;
      d.decided = true;
      if (!wants) {
        this._d = null;
        return false;
      }
      // from here on: no jump by the slop
      d.y0 = y;
      this._takeOver();
    }
    d.d = y - d.y0;
    d.samples.push({ y, t });
    while (d.samples.length > 2 && t - d.samples[0].t > SPEED_WINDOW) d.samples.shift();
    this._hooks.move(d.d);
    return true;
  }

  _end = () => {
    const d = this._d;
    this._d = null;
    if (!d?.decided) return;
    this._hooks.release(d.d, speedOf(d.samples));
  };

  _touchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      this._d = null;
      return;
    }
    const t = e.touches[0];
    this._start(t.clientX, t.clientY, e.timeStamp, e.composedPath());
  };

  _touchMove = (e: TouchEvent) => {
    if (!this._d) return;
    if (e.touches.length !== 1) return this._end();
    const t = e.touches[0];
    if (this._move(t.clientX, t.clientY, e.timeStamp) && e.cancelable) e.preventDefault();
  };

  // a mouse drags the handle and the header only (a computer has no scroll to take over)
  _mouseDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const path = e.composedPath();
    if (!this._hooks.onHandle(path)) return;
    this._start(e.clientX, e.clientY, e.timeStamp, path);
    if (!this._d) return;
    const move = (ev: PointerEvent) => {
      if (this._move(ev.clientX, ev.clientY, ev.timeStamp)) ev.preventDefault();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      this._end();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
}
