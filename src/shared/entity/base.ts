// Base element of the entity cards (and the weather card). Subclasses provide:
//   static cardType            – the custom element name
//   _normalize(raw)            – the normalised config (see config.js)
//   _styles()                  – the CSS string for the shadow root
//   getGridOptions()           – the sections grid footprint
import { fireAction, fireEvent, fireHaptic } from "../card.ts";
import { cssColor } from "../color.ts";
import { REFRESH_MS } from "../constants.ts";
import { langOf } from "../format.ts";
import type { ActionConfig, ActionKind, GridOptions, HapticType, HomeAssistant } from "../ha.ts";
import { fetchHistory, pointOf, type Point } from "../history.ts";
import { hideHover } from "../hover.ts";
import { clamp01, qs } from "../util.ts";
import { BLOCK_VISUALS, DOUBLE_MS, HISTORY_VISUALS, HOLD_MS } from "./constants.ts";
import { collectTemplates, type EntityCardConfig, type EntityItem, type Group } from "./config.ts";
import {
  hasBlockControl,
  PENDING_MS,
  type ControlHost,
  type Pending,
  type ServiceCall,
} from "./control.ts";
import { modelOf, nameOf, tplOf, type PlotHandlers, type RenderCtx } from "./model.ts";
import { fillByClass } from "./render/fill.ts";
import { drawPlot, showHover, windowOf, type PlotElement } from "./render/plots.ts";
import type { EntityModel } from "./model.ts";

type Unsubscribe = () => unknown;
// the room inside a gauge's arc for its value (viewBox units) and the value's own font size
const GAUGE_TEXT_W = 76;
const GAUGE_FONT = 17;
// what a row may hold that takes focus (the hit layer, buttons, a select, the slider)
const FOCUSABLE = "[tabindex], button, select";

// grid rows a block visual (and a block control) adds below its row
const blk = (e: EntityItem) =>
  (e.visual === "sparkline" || e.visual === "columns" || e.visual === "gauge"
    ? 2
    : BLOCK_VISUALS.has(e.visual)
      ? 1
      : 0) + (hasBlockControl(e) ? 1 : 0);
// rough height of one group in grid rows (56 px)
export const groupCardSize = (cfg: EntityCardConfig, group: Group) => {
  const ents = group.idxs.map((i) => cfg.entities[i]),
    n = ents.length;
  switch (group.layout) {
    case "tile":
      return 1 + blk(ents[0]);
    case "grid":
      return Math.ceil(n / group.columns) * 2;
    case "hero":
      return 2 + blk(ents[0]) + ents.slice(1).reduce((a, e) => a + 1 + blk(e), 0);
    case "row":
      return Math.ceil(n / 5) * (ents.some((e) => e.item.showName || e.item.showValue) ? 2 : 1);
    case "column":
      return n;
    case "table":
      return Math.max(1, Math.ceil(n / 2));
    default:
      return ents.reduce((a, e) => a + 1 + blk(e), 0);
  }
};

export abstract class EntityCardBase extends HTMLElement {
  static cardType: string;

  _series = new Map<string, Point[]>();
  _tplResult = new Map<string, unknown>();
  _tplUnsub = new Map<string, Promise<Unsubscribe | null>>();
  _hover: { idx: number; t: number } | null = null;
  _plotHandlers: PlotHandlers;
  _config?: EntityCardConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _entityIds: string[] = [];
  _historyIds: string[] = [];
  _templates?: Set<string>;
  _fetched = false;
  _fetching = false;
  _timer?: ReturnType<typeof setInterval>;
  _ro?: ResizeObserver;
  // controls: service calls in flight per entity index, the row being dragged, the host the
  // builders talk to
  _pending = new Map<number, Pending>();
  _armed = new Map<string, number>();
  _dragging: number | null = null;
  _pendingTimer?: ReturnType<typeof setTimeout>;
  _idxsByEntity = new Map<string, number[]>();
  _ctl: ControlHost;

  abstract _normalize(raw: unknown): EntityCardConfig;
  abstract _styles(): string;
  abstract getGridOptions(): GridOptions;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onDocPointer = this._onDocPointer.bind(this);
    this._plotHandlers = {
      move: this._onPointer.bind(this),
      up: (ev) => ev.stopPropagation(),
      leave: this._onLeave.bind(this),
    };
    const dragging = () => this._dragging;
    this._ctl = {
      pending: this._pending,
      armed: this._armed,
      get dragging() {
        return dragging();
      },
      call: (el, idx, ent, svc, pending, haptic) =>
        this._callService(el, idx, ent, svc, pending, haptic),
      redraw: () => this._render(),
      beginDrag: (idx) => {
        this._dragging = idx;
      },
      endDrag: (idx) => {
        if (this._dragging === idx) this._dragging = null;
        this._render();
      },
      runAction: (ent, a, kind) => this._runAction(ent, a, kind),
    };
  }

  setConfig(config: unknown) {
    const cfg = this._normalize(config);
    this._config = cfg;
    this._entityIds = [
      ...new Set(cfg.entities.map((e) => e.entity).filter((e): e is string => !!e)),
    ];
    this._historyIds = [
      ...new Set(
        cfg.entities
          .filter((e) => e.entity && HISTORY_VISUALS.has(e.visual))
          .map((e) => e.entity as string),
      ),
    ];
    this._templates = collectTemplates(cfg);
    this._idxsByEntity = new Map();
    cfg.entities.forEach((e, i) => {
      if (e.entity)
        this._idxsByEntity.set(e.entity, [...(this._idxsByEntity.get(e.entity) ?? []), i]);
    });
    this._series = new Map();
    this._tplResult = new Map();
    this._fetched = false;
    this._hover = null;
    this._pending.clear();
    this._armed.clear();
    this._dragging = null;
    if (this._hass) this._subscribeTemplates();
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    this._setHass(hass);
  }
  // the hass update; a subclass wraps it to react to a new connection
  _setHass(hass: HomeAssistant) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._root) this._buildDom();
    if (!prev || prev.connection !== hass.connection) this._subscribeTemplates();
    if (this._historyIds.length && !this._fetched && !this._fetching) {
      this._fetchHistory();
      return;
    }
    // a new language (profile setting) re-renders too: words, times and numbers follow it
    let changed = !prev || langOf(prev) !== langOf(hass);
    for (const id of this._entityIds) {
      const st = hass.states[id],
        pst = prev?.states[id];
      if (st === pst) continue;
      changed = true;
      // the device answered: its pending calls are over (a sticky one only expires)
      for (const i of this._idxsByEntity.get(id) ?? [])
        if (!this._pending.get(i)?.sticky) this._pending.delete(i);
      const s = st && this._series.get(id);
      if (s) {
        const t = new Date(st.last_updated).getTime();
        if (s.length === 0 || t > s[s.length - 1].t) s.push(pointOf(t, st.state));
      }
    }
    if (changed) this._render();
  }

  connectedCallback() {
    this._timer = setInterval(() => {
      if (this._historyIds?.length) this._fetchHistory();
      else this._render();
    }, REFRESH_MS);
    this._ro = new ResizeObserver(() => this._render());
    if (this._root) this._ro.observe(this._root);
    document.addEventListener("pointerdown", this._onDocPointer);
    // ghosts that expired while the card was away (another view) go now, the rest get their timer
    if (this._pending.size && this._sweepPending()) this._render();
    if (this._hass && this._templates?.size && this._tplUnsub.size === 0)
      this._subscribeTemplates();
  }
  disconnectedCallback() {
    clearInterval(this._timer);
    clearTimeout(this._pendingTimer);
    this._ro?.disconnect();
    document.removeEventListener("pointerdown", this._onDocPointer);
    this._unsubscribeTemplates();
  }

  getCardSize() {
    const cfg = this._config;
    if (!cfg) return 2;
    return (cfg.hasHeader ? 1 : 0) + cfg.groups.reduce((a, g) => a + groupCardSize(cfg, g), 0);
  }

  // the context the render helpers work on
  _ctx(): RenderCtx {
    const now = Date.now();
    const cfg = this._config as EntityCardConfig;
    return {
      hass: this._hass,
      tplResult: this._tplResult,
      series: this._series,
      fetched: this._fetched,
      cfg,
      now,
      t0: now - cfg.hours * 3600e3,
      plotHandlers: this._plotHandlers,
      ctl: this._ctl,
    };
  }

  // ----- controls -----
  // runs a control's service call and remembers it as pending until the entity answers
  _callService(
    el: HTMLElement,
    idx: number,
    ent: EntityItem,
    svc: ServiceCall | null,
    pending?: Pending,
    haptic: HapticType = "light",
  ) {
    if (!svc) {
      console.warn(`${this._cardType()}: no service for the control of '${ent.entity}'`);
      return;
    }
    if (!this._hass) return;
    // pending first: the entity may answer synchronously (the docs shim does) and clear it
    this._pending.set(idx, pending ?? { until: Date.now() + PENDING_MS });
    this._sweepPending();
    fireHaptic(el, haptic);
    Promise.resolve(this._hass.callService(svc.domain, svc.service, svc.data)).catch((err) => {
      const name = `${svc.domain}.${svc.service}`;
      console.warn(`${this._cardType()}: ${name} failed`, err);
      this._pending.delete(idx);
      // on the card, not the control: the control may have been rebuilt since
      fireHaptic(this, "failure");
      const msg = err instanceof Error && err.message ? err.message : String(err ?? "failed");
      fireEvent(this, "hass-notification", { message: `${name}: ${msg}` });
      this._render();
    });
    this._render();
  }
  // drops expired pending calls and re-renders when the next one expires
  _sweepPending() {
    clearTimeout(this._pendingTimer);
    const now = Date.now();
    let next = Infinity,
      dropped = false;
    for (const [idx, p] of this._pending)
      if (p.until <= now) {
        this._pending.delete(idx);
        dropped = true;
      } else next = Math.min(next, p.until);
    if (next < Infinity)
      this._pendingTimer = setTimeout(
        () => {
          this._sweepPending();
          this._render();
        },
        next - now + 10,
      );
    return dropped;
  }

  // ----- templates -----
  async _subscribeTemplates() {
    const conn = this._hass?.connection;
    if (!conn || !this._templates) return;
    const wanted = this._templates;
    for (const [tpl, p] of [...this._tplUnsub])
      if (!wanted.has(tpl)) {
        this._tplUnsub.delete(tpl);
        p.then((u) => u && u()).catch(() => {});
      }
    for (const tpl of wanted) {
      if (this._tplUnsub.has(tpl)) continue;
      const p: Promise<Unsubscribe | null> = conn
        .subscribeMessage<{ result?: unknown }>(
          (msg) => {
            const r = msg?.result;
            if (this._tplResult.get(tpl) !== r) {
              this._tplResult.set(tpl, r);
              this._render();
            }
          },
          { type: "render_template", template: tpl, timeout: 3, report_errors: false },
        )
        .catch((e) => {
          console.warn(`${this._cardType()}: template failed`, tpl, e);
          return null;
        });
      this._tplUnsub.set(tpl, p);
    }
  }
  _unsubscribeTemplates() {
    for (const p of this._tplUnsub.values()) p.then((u) => u && u()).catch(() => {});
    this._tplUnsub = new Map();
  }
  _cardType() {
    return (this.constructor as typeof EntityCardBase).cardType;
  }

  // ----- history -----
  async _fetchHistory() {
    if (!this._hass || !this._config || !this._historyIds.length) return;
    this._fetching = true;
    try {
      const res = await fetchHistory(this._hass, this._historyIds, this._config.hours);
      for (const [id, pts] of res) this._series.set(id, pts);
      this._fetched = true;
    } catch (err) {
      console.error(`${this._cardType()}: history fetch failed`, err);
    } finally {
      this._fetching = false;
      this._render();
    }
  }

  // ----- actions -----
  // Home Assistant runs the action (dialogs, haptics, every action type it knows); the card only
  // decides which of tap / hold / double_tap happened and which entity it targets.
  _runAction(ent: EntityItem, a: ActionConfig | undefined, kind: ActionKind) {
    if (!a || a.action === "none") return;
    const { entity, ...action } = a;
    fireAction(this, entity ?? ent.entity, action, kind);
  }
  _hasActions(ent: EntityItem) {
    const has = (a: ActionConfig | undefined) => a && a.action !== "none";
    return !!(has(ent.tap) || has(ent.hold) || has(ent.dbl));
  }
  // binds the gestures to `el`: the hit layer behind the row's content (see _row)
  _bindActions(el: HTMLElement, ent: EntityItem) {
    const has = (a: ActionConfig | undefined) => a && a.action !== "none";
    let holdTimer: ReturnType<typeof setTimeout> | undefined,
      held = false,
      down = false,
      lastTap = 0,
      tapTimer: ReturnType<typeof setTimeout> | undefined;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      held = false;
      down = true;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        held = true;
        if (has(ent.hold)) this._runAction(ent, ent.hold, "hold");
      }, HOLD_MS);
    });
    const cancel = () => clearTimeout(holdTimer);
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("pointerup", (ev) => {
      if (ev.button !== 0 || !down) return;
      down = false;
      clearTimeout(holdTimer);
      if (held) return;
      if (has(ent.dbl)) {
        const now = Date.now();
        if (now - lastTap < DOUBLE_MS) {
          clearTimeout(tapTimer);
          lastTap = 0;
          this._runAction(ent, ent.dbl, "double_tap");
          return;
        }
        lastTap = now;
        tapTimer = setTimeout(() => this._runAction(ent, ent.tap, "tap"), DOUBLE_MS);
      } else this._runAction(ent, ent.tap, "tap");
    });
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this._runAction(ent, ent.tap, "tap");
      }
    });
  }

  // ----- DOM skeleton -----
  _row(idx: number, cls: string) {
    const r = document.createElement("div");
    r.className = `row ${cls}`;
    r.dataset.idx = String(idx);
    const ent = this._config?.entities[idx];
    if (ent && this._hasActions(ent)) {
      // the row's own action lives on a layer behind the content, so the controls on the row are
      // never nested inside a button (Home Assistant's tile does the same); _render keeps it first
      r.classList.add("actionable");
      const hit = document.createElement("div");
      hit.className = "hit";
      hit.setAttribute("role", "button");
      hit.tabIndex = 0;
      this._bindActions(hit, ent);
      r.appendChild(hit);
    }
    return r;
  }
  _buildDom() {
    const root = this.shadowRoot as ShadowRoot,
      cfg = this._config as EntityCardConfig;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = this._styles();
    root.appendChild(style);
    const card = document.createElement("ha-card");
    card.className = `layout-${cfg.layout}`;
    if (cfg.hasHeader) {
      const header = document.createElement("div");
      header.className = "header";
      header.innerHTML = `<ha-icon></ha-icon><div class="title"></div><div class="hvals"></div><div class="range"></div>`;
      const hvals = qs(header, ".hvals");
      for (const i of cfg.headerIdxs) hvals.appendChild(this._row(i, "hval"));
      card.appendChild(header);
    }
    const body = document.createElement("div");
    body.className = "body";
    this._buildBody(body);
    card.appendChild(body);
    root.appendChild(card);
    this._root = card;
    this._ro?.observe(card);
    this._render();
    // text fitted before the web font arrived is measured again once it is there
    document.fonts?.ready.then(() => {
      if (this._root === card) this._fitCells(card);
    });
  }
  // the body: one container per group (a subclass may lay its body out differently)
  _buildBody(body: HTMLElement) {
    const cfg = this._config as EntityCardConfig;
    cfg.groups.forEach((g, k) => {
      if (g.divider && k > 0) body.appendChild(this._divider());
      body.appendChild(this._buildGroup(g));
    });
  }
  _divider() {
    const div = document.createElement("div");
    div.className = "divider";
    return div;
  }
  // one group of the body: a container whose class says how its entity rows are laid out
  _buildGroup(g: Group) {
    const { idxs } = g;
    if (g.layout === "tile") return this._row(idxs[0], "tile");
    const el = document.createElement("div");
    el.className = `section layout-${g.layout}`;
    if (g.layout === "list") idxs.forEach((i) => el.appendChild(this._row(i, "list")));
    else if (g.layout === "grid") {
      el.classList.add("grid");
      el.style.setProperty("--cols", String(g.columns));
      idxs.forEach((i) => el.appendChild(this._row(i, "cell")));
    } else if (g.layout === "hero") {
      // the first entity is the lead, the rest are list rows
      el.appendChild(this._row(idxs[0], "hero"));
      const rest = idxs.slice(1);
      if (rest.length) {
        el.appendChild(this._divider());
        rest.forEach((i) => el.appendChild(this._row(i, "list")));
      }
    } else if (g.layout === "table") {
      el.classList.add(`align-${g.align}`);
      if (g.hasIcon) el.classList.add("with-icon");
      idxs.forEach((i) => el.appendChild(this._row(i, "field")));
    } else {
      el.classList.add(`align-${g.align}`);
      idxs.forEach((i) => el.appendChild(this._row(i, "item")));
    }
    return el;
  }

  // ----- render -----
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    const cfg = this._config,
      card = this._root,
      ctx = this._ctx();
    const header = card.querySelector<HTMLElement>(".header");
    if (header) {
      const title = tplOf(ctx, cfg.title),
        icon = tplOf(ctx, cfg.icon);
      const hi = qs(header, "ha-icon");
      if (icon) {
        hi.setAttribute("icon", icon);
        hi.style.display = "";
      } else hi.style.display = "none";
      qs(header, ".title").textContent = title || "";
      qs(header, ".range").textContent = this._historyIds.length ? `${cfg.hours} h` : "";
      header.style.display = title || icon || cfg.headerIdxs.length ? "" : "none";
    }
    const models = cfg.entities.map((ent) => modelOf(ctx, ent));
    const focus = this._focusWithin();
    for (const row of card.querySelectorAll<HTMLElement>(".row")) {
      const idx = Number(row.dataset.idx),
        ent = cfg.entities[idx],
        m = models[idx];
      if (!ent || !m) continue;
      row.style.setProperty("--fe-color", cssColor(m.look.color, "var(--primary-color)"));
      // a row whose control is being dragged or held keeps its DOM until the gesture ends
      if (this._dragging === idx) continue;
      // a focused select keeps its row too: rebuilding it would close its open list
      if (focus?.row === row && focus.select) continue;
      const hit = row.querySelector<HTMLElement>(":scope > .hit");
      this._fill(ctx, row, ent, idx, m);
      if (hit) {
        // re-inserting an element that is still first would drop its focus (rows filled in place)
        if (row.firstElementChild !== hit) row.prepend(hit);
        hit.setAttribute("aria-label", nameOf(ctx, ent, m.st));
      }
      if (focus?.row === row) this._refocus(row, focus.i);
    }
    const tint = this._tintColor(ctx, models, card);
    card.classList.toggle("tinted", tint !== null);
    card.style.setProperty(
      "--fe-tint",
      tint === null ? "transparent" : cssColor(tint, "transparent"),
    );
    for (const plot of card.querySelectorAll<PlotElement>(".plot")) drawPlot(ctx, plot);
    this._fitCells(card);
    if (this._hover) {
      const hover = this._hover;
      const plot = [...card.querySelectorAll<PlotElement>(".plot")].find(
        (p) => p._ctx.idx === hover.idx,
      );
      if (plot) showHover(ctx, plot, hover.t);
    }
  }
  // the focused element of a row, as its index among the row's focusable elements: a rebuilt row
  // has the same elements in the same order, so the same index is the same control
  _focusWithin(): { row: HTMLElement; i: number; select: boolean } | null {
    const a = this.shadowRoot?.activeElement as HTMLElement | null;
    const row = a?.closest<HTMLElement>(".row");
    if (!a || !row) return null;
    const i = [...row.querySelectorAll<HTMLElement>(FOCUSABLE)].indexOf(a);
    return i < 0 ? null : { row, i, select: a.tagName === "SELECT" };
  }
  // a control that came back disabled (the entity went unavailable) cannot take the focus: the
  // row's own action takes it instead, so the focus never falls out of the card
  _refocus(row: HTMLElement, i: number) {
    const el = row.querySelectorAll<HTMLElement>(FOCUSABLE)[i];
    el?.focus({ preventScroll: true });
    if (!el || this.shadowRoot?.activeElement !== el)
      row.querySelector<HTMLElement>(":scope > .hit")?.focus({ preventScroll: true });
  }
  // fills one row from its model; a subclass adds its own row kinds and falls back to this
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    fillByClass(ctx, row, ent, idx, m);
  }
  // the card tint: the colour of the first rendered row whose matching rule sets tint_card
  _tintColor(_ctx: RenderCtx, models: EntityModel[], card: HTMLElement): string | null {
    for (const row of card.querySelectorAll<HTMLElement>(".row")) {
      const m = models[Number(row.dataset.idx)];
      if (m?.look.tint) return m.look.color;
    }
    return null;
  }
  // shrink a grid cell's big value (down to 13 px) so short words like scene names stay whole
  _fitCells(card: HTMLElement) {
    // a gauge's value sits inside its arc: a long one (a unit like "UV index") steps its font down
    // until its drawn box fits (glyph widths do not scale exactly with the size)
    for (const t of card.querySelectorAll<SVGTextElement>(".gauge text.val")) {
      t.style.fontSize = "";
      if (typeof t.getBBox !== "function") continue;
      let size = GAUGE_FONT;
      while (size > 9 && t.getBBox().width > GAUGE_TEXT_W) {
        size -= 0.5;
        t.style.fontSize = `${size}px`;
      }
    }
    for (const big of card.querySelectorAll<HTMLElement>(".cell .big")) {
      const b = big.querySelector("b");
      if (!b) continue;
      big.classList.add("fit");
      let size = 22;
      big.style.setProperty("--fit", `${size}px`);
      while (size > 13 && b.scrollWidth > b.clientWidth + 1) {
        size -= 1;
        big.style.setProperty("--fit", `${size}px`);
      }
    }
  }

  // ----- hover -----
  _onPointer(ev: PointerEvent) {
    ev.stopPropagation();
    const plot = ev.currentTarget as PlotElement;
    const rect = plot.getBoundingClientRect();
    const ctx = this._ctx();
    const { t0, t1 } = windowOf(ctx, plot);
    const t = t0 + clamp01((ev.clientX - rect.left) / (rect.width || 1)) * (t1 - t0);
    this._hover = { idx: plot._ctx.idx, t };
    if (!showHover(ctx, plot, t)) this._hideHover();
  }
  _onLeave(ev: PointerEvent) {
    if (ev.pointerType === "touch") return;
    this._hideHover();
  }
  _onDocPointer(ev: PointerEvent) {
    if (!ev.composedPath().includes(this)) this._hideHover();
  }
  _hideHover() {
    this._hover = null;
    hideHover(this._root);
  }
}
