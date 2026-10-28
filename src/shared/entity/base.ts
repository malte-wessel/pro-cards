// Base element of the entity cards (and the weather card). Subclasses provide:
//   static cardType            – the custom element name
//   _normalize(raw)            – the normalised config (see config.js)
//   _styles()                  – the CSS string for the shadow root
//   getGridOptions()           – the sections grid footprint
import { fireAction, fireEvent, fireHaptic, freshShadow, syncKeepHeight } from "../card.ts";
import { cssColor } from "../color.ts";
import { REFRESH_MS } from "../constants.ts";
import { langOf } from "../format.ts";
import type { ActionConfig, ActionKind, GridOptions, HapticType, HomeAssistant } from "../ha.ts";
import { fetchHistory, pointOf, type Point } from "../history.ts";
import { HistoryFeed } from "../history-feed.ts";
import { hideHover, leaveHides, outsideHides } from "../hover.ts";
import { TemplateSubscriptions } from "../templates.ts";
import { depsChanged } from "../deps.ts";
import { clamp01, qs } from "../util.ts";
import {
  checkVisibility,
  userPerson,
  visibilityDeps,
  type Visibility,
  type VisibilityDeps,
} from "../visibility.ts";
import { VisibilityWatch } from "../visibility-watch.ts";
import { BLOCK_VISUALS, DOUBLE_MS, HISTORY_VISUALS, HOLD_MS } from "./constants.ts";
import {
  collectTemplates,
  itemTemplates,
  visibilityTrees,
  type EntityCardConfig,
  type EntityItem,
  type Group,
} from "./config.ts";
import {
  hasBlockControl,
  PENDING_MS,
  type ControlHost,
  type Pending,
  type ServiceCall,
} from "./control.ts";
import { membersOf } from "./look.ts";
import { modelOf, nameOf, tplOf, type PlotHandlers, type RenderCtx } from "./model.ts";
import { plotRows } from "./render/blocks.ts";
import { fillByClass } from "./render/fill.ts";
import { drawPlot, showHover, windowOf, type PlotElement } from "./render/plots.ts";
import type { EntityModel } from "./model.ts";
import { TextCache, themeChanged } from "../typography.ts";

// the room inside a gauge's arc for its value (viewBox units) and the value's own font size
const GAUGE_TEXT_W = 76;
const GAUGE_FONT = 17;
// what a row may hold that takes focus (the hit layer, buttons, a select, the slider)
const FOCUSABLE = "[tabindex], button, select";

// what is shown now: per item, per group (its own conditions and at least one shown item) and the
// shown items of each group; `key` names the body's structure, a new key rebuilds the body
export interface VisState {
  items: boolean[];
  groups: boolean[];
  visIdxs: number[][];
  key: string;
}

// whether a text's glyphs are wider than its box, to the fraction of a pixel: an ellipsis shows for
// any overflow, and scrollWidth rounds it away
const overflows = (el: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width > el.getBoundingClientRect().width + 0.01;
};

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
    case "poster":
      return 3;
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
  _tpl: TemplateSubscriptions;
  _history: HistoryFeed;
  _hover: { idx: number; t: number } | null = null;
  _plotHandlers: PlotHandlers;
  _textCache = new TextCache();
  _config?: EntityCardConfig;
  _hass?: HomeAssistant;
  _root?: HTMLElement;
  _entityIds: string[] = [];
  _historyIds: string[] = [];
  _templates?: Set<string>;
  _timer?: ReturnType<typeof setInterval>;
  // badges whose text follows the clock (stale_after, format: relative) render every minute
  _timed = false;
  _minute?: ReturnType<typeof setInterval>;
  // the items that count a group's members on: they follow the members' states too
  _countIdxs: number[] = [];
  _ro?: ResizeObserver;
  // controls: service calls in flight per entity index, the row being dragged, the host the
  // builders talk to
  _pending = new Map<number, Pending>();
  // the calls of custom buttons, one per button (`index:c<i>`), each ended by its own entity
  _buttonPending = new Map<string, Pending>();
  _armed = new Map<string, number>();
  _dragging: number | null = null;
  _pendingTimer?: ReturnType<typeof setTimeout>;
  _idxsByEntity = new Map<string, number[]>();
  _ctl: ControlHost;
  // visibility: the entities its conditions read besides the items' own (`_watchIds` is both),
  // what else they depend on, the listeners for screen / time, what is shown and the body's key
  _watchIds: string[] = [];
  _visDeps: VisibilityDeps = visibilityDeps([]);
  _visWatch: VisibilityWatch;
  _vis?: VisState;
  _bodyKey: string | null = null;
  _person: { user: string | undefined; id: string | null } | null = null;
  _onDocPointer = outsideHides(this, () => this._hideHover());
  // what each item's model, each row and each plot were last drawn from (deps.ts): a render
  // recomputes and redraws only what its inputs changed. Per item: the ids it reads (its entity,
  // its buttons') and whether it has templates; `_fillEpoch` moves on what every row depends on
  // without naming it (the refresh, a theme, a config); `_resized` asks for a full refit
  _idsByItem: string[][] = [];
  _itemTpl: boolean[] = [];
  _itemModels: EntityModel[] = [];
  _modelInputs = new WeakMap<object, readonly unknown[]>();
  _rowInputsDrawn = new WeakMap<object, readonly unknown[]>();
  _plotInputs = new WeakMap<object, readonly unknown[]>();
  _fillEpoch = 0;
  _resized = true;
  // hass.locale by value, read once per render (Home Assistant keeps the object, a test double
  // may not)
  _localeKey = "";

  abstract _normalize(raw: unknown): EntityCardConfig;
  abstract _styles(): string;
  abstract getGridOptions(): GridOptions;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tpl = new TemplateSubscriptions(this._cardType(), () => this._render());
    this._history = new HistoryFeed(this._cardType());
    this._visWatch = new VisibilityWatch(() => this._render());
    this._plotHandlers = {
      move: this._onPointer.bind(this),
      up: (ev) => ev.stopPropagation(),
      leave: leaveHides(() => this._hideHover()),
    };
    const dragging = () => this._dragging;
    this._ctl = {
      pending: this._pending,
      buttonPending: this._buttonPending,
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
        // the row is filled again whatever its inputs say: a gesture that made no call (cancelled
        // by a scroll) left its control where the finger was, not at the entity's value
        for (const row of this._root?.querySelectorAll<HTMLElement>(`.row[data-idx="${idx}"]`) ??
          [])
          this._rowInputsDrawn.delete(row);
        this._render();
      },
      runAction: (ent, a, kind) => this._runAction(ent, a, kind),
    };
  }

  setConfig(config: unknown) {
    const cfg = this._normalize(config);
    this._config = cfg;
    // the entities a row follows: its own and those of its custom buttons
    const idsOf = (e: EntityItem) =>
      [e.entity, ...(e.control?.buttons ?? []).map((b) => b.entity)].filter(
        (id): id is string => !!id,
      );
    this._idsByItem = cfg.entities.map(idsOf);
    this._itemTpl = cfg.entities.map((e) => itemTemplates(e).length > 0);
    this._itemModels = [];
    this._fillEpoch++;
    this._resized = true;
    this._entityIds = [...new Set(cfg.entities.flatMap(idsOf))];
    this._historyIds = [
      ...new Set(
        cfg.entities
          .filter((e) => e.entity && (HISTORY_VISUALS.has(e.visual) || e.visual === "trend"))
          .map((e) => e.entity as string),
      ),
    ];
    this._timed = cfg.entities.some((e) => e.staleMin !== null || e.format === "relative");
    this._countIdxs = cfg.entities.flatMap((e, i) => (e.visual === "count" && e.entity ? [i] : []));
    this._armMinute();
    this._templates = collectTemplates(cfg);
    this._visDeps = visibilityDeps(this._visibilityTrees());
    for (const tpl of this._visDeps.templates) this._templates.add(tpl);
    this._watchIds = [...new Set([...this._entityIds, ...this._visDeps.entities])];
    this._visWatch.set(this._visDeps);
    this._person = null;
    this._vis = undefined;
    this._idxsByEntity = new Map();
    cfg.entities.forEach((e, i) => {
      for (const id of new Set(idsOf(e)))
        this._idxsByEntity.set(id, [...(this._idxsByEntity.get(id) ?? []), i]);
    });
    this._series = new Map();
    this._history.reset();
    this._hover = null;
    this._pending.clear();
    this._buttonPending.clear();
    this._armed.clear();
    this._dragging = null;
    this._subscribeTemplates();
    syncKeepHeight(this, config);
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
    // the history arrives later and renders then; the update below runs meanwhile, so a device's
    // answer still ends its pending call
    if (this._historyIds.length && this._history.due()) this._fetchHistory();
    // a new language (profile setting) re-renders too: words, times and numbers follow it
    let changed = !prev || langOf(prev) !== langOf(hass);
    // conditions on the user (or the user's whereabouts) look again when they change
    const deps = this._visDeps;
    if (deps.user && prev?.user?.id !== hass.user?.id) changed = true;
    if (deps.location) {
      const person = this._personOf(hass);
      if (person && prev?.states[person] !== hass.states[person]) changed = true;
    }
    for (const id of this._watchIds) {
      const st = hass.states[id],
        pst = prev?.states[id];
      if (st === pst) continue;
      changed = true;
      // the device answered: its pending calls are over (a sticky one only expires)
      for (const i of this._idxsByEntity.get(id) ?? [])
        if (!this._pending.get(i)?.sticky) this._pending.delete(i);
      for (const [k, p] of this._buttonPending)
        if (p.entity === id && !p.sticky) this._buttonPending.delete(k);
      const s = st && this._series.get(id);
      if (s) {
        const t = new Date(st.last_updated).getTime();
        if (s.length === 0 || t > s[s.length - 1].t) s.push(pointOf(t, st.state));
      }
    }
    // a count follows its group's members, which the group itself may not show (2 → 3 lights on)
    if (!changed)
      changed = this._countMembers(hass).some((id) => hass.states[id] !== prev?.states[id]);
    if (changed) this._render();
    if (themeChanged(prev, hass)) {
      this._textCache.clear();
      this._fillEpoch++;
      this._resized = true;
      requestAnimationFrame(() => this._render());
    }
  }

  connectedCallback() {
    // another place may have another theme (a view's own)
    this._textCache.clear();
    this._fillEpoch++;
    this._resized = true;
    this._timer = setInterval(() => this._tick(), REFRESH_MS);
    this._armMinute();
    this._ro = new ResizeObserver(() => {
      this._resized = true;
      this._render();
    });
    if (this._root) this._ro.observe(this._root);
    document.fonts?.addEventListener("loadingdone", this._onFonts);
    document.addEventListener("pointerdown", this._onDocPointer);
    this._visWatch.connect();
    // ghosts that expired while the card was away (another view) go now, the rest get their timer
    if ((this._pending.size || this._buttonPending.size) && this._sweepPending()) this._render();
    if (this._hass && this._templates?.size && this._tpl.size === 0) this._subscribeTemplates();
  }
  // every REFRESH_MS: time moves the plots (a fresh history, or a render)
  _tick() {
    this._fillEpoch++;
    if (this._historyIds?.length) this._fetchHistory();
    else this._render();
  }
  // the minute timer of badges that follow the clock: on while connected and the config has any
  _armMinute() {
    clearInterval(this._minute);
    this._minute = undefined;
    if (this._timed && this.isConnected) this._minute = setInterval(() => this._render(), 60e3);
  }
  // the members of the groups the count items read
  _countMembers(hass: HomeAssistant | undefined): string[] {
    const cfg = this._config;
    if (!cfg || !hass) return [];
    return this._countIdxs.flatMap((i) => membersOf(hass.states[cfg.entities[i].entity ?? ""]));
  }
  // a web font that arrives later widens the text without resizing the card: fitted values are
  // measured again (the `ready` promise after a build misses a font that starts loading later)
  _onFonts = () => {
    if (this._root) this._fitCells([this._root]);
  };
  disconnectedCallback() {
    document.fonts?.removeEventListener("loadingdone", this._onFonts);
    clearInterval(this._timer);
    clearInterval(this._minute);
    clearTimeout(this._pendingTimer);
    // a gesture cut off by leaving the page never ends: its row is filled again on return
    this._dragging = null;
    this._armed.clear();
    this._ro?.disconnect();
    document.removeEventListener("pointerdown", this._onDocPointer);
    this._visWatch.disconnect();
    this._tpl.clear();
  }

  getCardSize() {
    const cfg = this._config;
    if (!cfg) return 2;
    // the groups as shown now (as written before the first render)
    const vis = this._vis;
    const rows = cfg.groups.reduce(
      (a, g, k) =>
        a +
        (!vis
          ? groupCardSize(cfg, g)
          : vis.groups[k]
            ? groupCardSize(cfg, { ...g, idxs: vis.visIdxs[k] })
            : 0),
      0,
    );
    return this._headerRows() + rows;
  }
  // the header's row in the card size: only while it is drawn (a title, an icon or a shown
  // header entity; before the first render, as written)
  _headerRows(): number {
    const cfg = this._config,
      vis = this._vis;
    if (!cfg?.hasHeader) return 0;
    return cfg.title ||
      cfg.icon ||
      this._headerExtra() ||
      !vis ||
      cfg.headerIdxs.some((i) => vis.items[i])
      ? 1
      : 0;
  }
  // a card that puts something of its own into the header (_buildHeader): the header shows for it
  // even without a title, an icon or header entities
  _headerExtra(): boolean {
    return false;
  }
  // the card's own part of the header, after the title and the header entities
  _buildHeader(_header: HTMLElement) {}
  // the title when the config gives none, or its template renders empty (null: none)
  _defaultTitle(_ctx: RenderCtx): string | null {
    return null;
  }

  // ----- visibility -----
  // every condition tree of the config; a card with parts of its own adds theirs
  _visibilityTrees(): Visibility[] {
    return visibilityTrees(this._config as EntityCardConfig);
  }
  // whether a part with these conditions is shown now (everything is, before hass arrives)
  _shown(v: Visibility): boolean {
    if (!v) return true;
    const hass = this._hass;
    if (!hass) return true;
    return checkVisibility(v, {
      hass,
      tpl: (t) => this._tpl.results.get(t),
      media: this._visWatch.media,
      now: Date.now(),
      person: this._visDeps.location ? this._personOf(hass) : null,
    });
  }
  // the user's person entity (for location conditions), looked up again when the user changes
  // or none was found (a person may appear, or get its user, later)
  _personOf(hass: HomeAssistant): string | null {
    const user = hass.user?.id;
    if (!this._person || this._person.user !== user || this._person.id === null)
      this._person = { user, id: userPerson(hass) };
    return this._person.id;
  }
  // what is shown now; a card with parts of its own extends it (and its key)
  _computeVis(): VisState {
    const cfg = this._config as EntityCardConfig;
    // a row of buttons alone (no entity, no value of its own) whose buttons are all hidden has
    // nothing to show either
    const buttonsOnly = (e: EntityItem) =>
      !e.entity && e.valueSrc.kind === "text" && e.valueSrc.text === "" && !!e.control?.buttons;
    const items = cfg.entities.map(
      (e) =>
        this._shown(e.visibility) &&
        !(buttonsOnly(e) && e.control?.buttons?.every((b) => !this._shown(b.visibility))),
    );
    const visIdxs = cfg.groups.map((g) =>
      this._shown(g.visibility) ? g.idxs.filter((i) => items[i]) : [],
    );
    return {
      items,
      groups: visIdxs.map((v) => v.length > 0),
      visIdxs,
      key: visIdxs.map((v) => v.join(",")).join("|"),
    };
  }
  // whether the body has anything to show (a card without groups draws its own body)
  _bodyShown(vis: VisState): boolean {
    return !(this._config as EntityCardConfig).groups.length || vis.groups.some(Boolean);
  }

  // the context the render helpers work on
  _ctx(): RenderCtx {
    const now = Date.now();
    const cfg = this._config as EntityCardConfig;
    return {
      hass: this._hass,
      tplResult: this._tpl.results,
      series: this._series,
      fetched: this._history.loaded,
      cfg,
      now,
      t0: now - cfg.hours * 3600e3,
      plotHandlers: this._plotHandlers,
      ctl: this._ctl,
      shown: (v) => this._shown(v),
      text: this._textCache,
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
    // pending first: the entity may answer synchronously (the docs shim does) and clear it; a
    // custom button keeps its own, so its neighbours' calls and answers leave it alone
    let forget: () => void;
    if (pending?.key) {
      const key = `${idx}:${pending.key}`;
      this._buttonPending.set(key, pending);
      forget = () => this._buttonPending.delete(key);
    } else {
      this._pending.set(idx, pending ?? { until: Date.now() + PENDING_MS });
      forget = () => this._pending.delete(idx);
    }
    this._sweepPending();
    fireHaptic(el, haptic);
    Promise.resolve(this._hass.callService(svc.domain, svc.service, svc.data)).catch((err) => {
      const name = `${svc.domain}.${svc.service}`;
      console.warn(`${this._cardType()}: ${name} failed`, err);
      forget();
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
    for (const map of [this._pending, this._buttonPending] as Map<unknown, Pending>[])
      for (const [k, p] of map)
        if (p.until <= now) {
          map.delete(k);
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
  _subscribeTemplates() {
    this._tpl.sync(this._hass?.connection, this._templates);
  }
  _cardType() {
    return (this.constructor as typeof EntityCardBase).cardType;
  }

  // ----- history -----
  _fetchHistory() {
    const hass = this._hass,
      cfg = this._config,
      ids = this._historyIds;
    if (!hass || !cfg || !ids.length) return;
    return this._history.run(
      () => fetchHistory(hass, ids, cfg.hours),
      (res) => {
        for (const [id, pts] of res) this._series.set(id, pts);
      },
      () => this._render(),
    );
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
    // a press that left the row or was taken over (a scroll) is over: a later release here is not
    // its end
    const cancel = () => {
      clearTimeout(holdTimer);
      down = false;
    };
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
    // `hover` (card → group → entity): the row and its controls show the hover layers (STYLE_HOVER)
    if (ent?.hover) r.classList.add("hover-fx");
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
    const cfg = this._config as EntityCardConfig;
    const card = freshShadow(this.shadowRoot as ShadowRoot, this._styles());
    card.className = `layout-${cfg.layout}`;
    // the body's place in a taller card (top: as it always sat)
    if (cfg.valign && cfg.valign !== "top") card.classList.add(`valign-${cfg.valign}`);
    if (cfg.hasHeader) {
      const header = document.createElement("div");
      header.className = "header";
      header.innerHTML = `<ha-icon></ha-icon><div class="title"></div><div class="hvals"></div>`;
      const hvals = qs(header, ".hvals");
      for (const i of cfg.headerIdxs) hvals.appendChild(this._row(i, "hval"));
      if (cfg.titleTap) this._bindTitle(header, cfg.titleTap);
      // icon_tap_action: none keeps the icon still, also under a tappable title
      if (cfg.iconTap && cfg.iconTap.action !== "none") this._bindIcon(header, cfg.iconTap);
      this._buildHeader(header);
      card.appendChild(header);
    }
    const body = document.createElement("div");
    body.className = "body";
    this._vis = this._computeVis();
    this._buildBody(body);
    this._bodyKey = this._vis.key;
    card.appendChild(body);
    // the observer follows the new card, not the one setConfig replaced (it would keep it alive)
    if (this._root) this._ro?.unobserve(this._root);
    this._root = card;
    this._ro?.observe(card);
    this._render();
    // text fitted before the web font arrived is measured again once it is there
    document.fonts?.ready.then(() => {
      if (this._root === card) this._fitCells([card]);
    });
  }
  // `title_tap_action`: the title is the button, its icon taps the same (unless the icon has an
  // action of its own); the header items keep their own actions, so the header itself is not one
  // (no button inside a button)
  _bindTitle(header: HTMLElement, a: ActionConfig) {
    header.classList.add("tappable");
    const title = qs(header, ".title");
    const run = this._tapper(title, a);
    if (this._config?.iconTap) header.classList.add("icon-own");
    else qs(header, "ha-icon").addEventListener("click", run);
  }
  // `icon_tap_action` (the heading card): the icon is a button of its own
  _bindIcon(header: HTMLElement, a: ActionConfig) {
    header.classList.add("icon-tap");
    this._tapper(qs(header, "ha-icon"), a);
  }
  // makes `el` a button that runs `a` on a click, Enter or Space; returns the runner
  _tapper(el: HTMLElement, a: ActionConfig) {
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    const run = () => {
      const { entity, ...action } = a;
      fireAction(this, entity ?? null, action, "tap");
    };
    el.addEventListener("click", run);
    el.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      run();
    });
    return run;
  }
  // the body: one container per shown group (a subclass may lay its body out differently); a
  // divider only between shown groups, so a hidden first group leaves none on top
  _buildBody(body: HTMLElement) {
    const cfg = this._config as EntityCardConfig,
      vis = this._vis as VisState;
    let first = true;
    cfg.groups.forEach((g, k) => {
      if (!vis.groups[k]) return;
      if (g.divider && !first) body.appendChild(this._divider());
      body.appendChild(this._buildGroup(g, vis.visIdxs[k]));
      first = false;
    });
  }
  // the body again, for what is shown now (a visibility flip); the focus stays on its control
  _rebuildBody(card: HTMLElement) {
    const body = card.querySelector<HTMLElement>(":scope > .body");
    if (!body) return null;
    const f = this._focusWithin();
    const keep = f && body.contains(f.row) ? { idx: f.row.dataset.idx, i: f.i } : null;
    // the plot a tooltip belonged to goes with the body
    this._hideHover();
    body.replaceChildren();
    this._buildBody(body);
    this._bodyKey = (this._vis as VisState).key;
    return keep;
  }
  _divider() {
    const div = document.createElement("div");
    div.className = "divider";
    return div;
  }
  // one group of the body: a container whose class says how its entity rows are laid out; `idxs`
  // are its shown items (the first shown one leads a hero)
  _buildGroup(g: Group, idxs = g.idxs.filter((i) => this._vis?.items[i] ?? true)) {
    const cfg = this._config as EntityCardConfig;
    if (g.layout === "tile") return this._row(idxs[0], "tile");
    if (g.layout === "poster") return this._poster(idxs[0], g.badgeIdxs ?? []);
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
      // the icon column only while a shown item has an icon
      if (idxs.some((i) => cfg.entities[i].item.showIcon)) el.classList.add("with-icon");
      idxs.forEach((i) => el.appendChild(this._row(i, "field")));
    } else {
      el.classList.add(`align-${g.align}`);
      idxs.forEach((i) => el.appendChild(this._row(i, "item")));
    }
    // a card given more height shares it per row of plots: the section passes on its count
    const n = this._plotRows(g, idxs);
    if (n > 1) el.style.setProperty("--grow", String(n));
    return el;
  }
  // a poster: its own parts (the lead, the label pill, the body; fillPoster fills them) and its
  // badges, rows of their own in the corner that its fill never touches
  _poster(idx: number, badgeIdxs: number[]) {
    const row = this._row(idx, "poster");
    const top = document.createElement("div");
    top.className = "ptop";
    const lead = document.createElement("div");
    lead.className = "plead";
    const corner = document.createElement("div");
    corner.className = "corner";
    const label = document.createElement("span");
    label.className = "pill plabel";
    corner.appendChild(label);
    for (const b of badgeIdxs) corner.appendChild(this._row(b, "hval"));
    top.append(lead, corner);
    const body = document.createElement("div");
    body.className = "pbody";
    row.append(top, body);
    return row;
  }
  // the rows of a group's shown items that hold a growing plot (a grid row counts once)
  _plotRows(g: Group, idxs: number[]) {
    const cfg = this._config as EntityCardConfig;
    return plotRows(
      g.layout,
      g.columns,
      idxs.map((i) => cfg.entities[i].visual),
    );
  }

  // ----- render -----
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    this._localeKey = JSON.stringify(this._hass.locale ?? null);
    const cfg = this._config,
      card = this._root,
      ctx = this._ctx();
    // what is shown: a new body structure is built now, unless a gesture or an open select would
    // be cut off (the end of the gesture renders again)
    const vis = (this._vis = this._computeVis());
    let refocus: { idx: string | undefined; i: number } | null = null;
    if (vis.key !== this._bodyKey && this._dragging === null && !this._focusWithin()?.select)
      refocus = this._rebuildBody(card);
    const header = card.querySelector<HTMLElement>(".header");
    if (header) {
      const title = tplOf(ctx, cfg.title) || this._defaultTitle(ctx),
        icon = tplOf(ctx, cfg.icon);
      const hi = qs(header, "ha-icon");
      if (icon) {
        hi.setAttribute("icon", icon);
        hi.style.display = "";
      } else hi.style.display = "none";
      const t = qs(header, ".title");
      t.textContent = title || "";
      if (cfg.titleTap) t.setAttribute("aria-label", title || "");
      // an icon with its own action is a button: it reads as the heading it belongs to
      if (hi.getAttribute("role") === "button") hi.setAttribute("aria-label", title || "");
      header.hidden = !(
        title ||
        icon ||
        this._headerExtra() ||
        cfg.headerIdxs.some((i) => vis.items[i])
      );
    }
    // nothing shown at all: the card takes no room (its own `visibility` is HA's way to hide it)
    card.hidden = (!header || header.hidden) && !this._bodyShown(vis);
    const models = cfg.entities.map((_, i) => this._modelAt(ctx, i));
    const focus = this._focusWithin();
    // the rows filled now: only they are fitted again (all of them after a resize)
    const filled: HTMLElement[] = [];
    for (const row of card.querySelectorAll<HTMLElement>(".row")) {
      const idx = Number(row.dataset.idx),
        ent = cfg.entities[idx],
        m = models[idx];
      if (!ent || !m) continue;
      // a header item (or a body row whose rebuild waits for a gesture) hides in place
      row.hidden = !vis.items[idx];
      if (row.hidden) continue;
      row.style.setProperty("--fe-color", cssColor(m.look.color, "var(--primary-color)"));
      // a row whose control is being dragged or held keeps its DOM until the gesture ends
      if (this._dragging === idx) continue;
      // a focused select keeps its row too: rebuilding it would close its open list
      if (focus?.row === row && focus.select) continue;
      // a row whose inputs are the ones it was filled from keeps its DOM
      const inputs = this._rowInputs(ctx, row, idx, m);
      if (inputs && !depsChanged(this._rowInputsDrawn, row, inputs)) continue;
      filled.push(row);
      const hit = row.querySelector<HTMLElement>(":scope > .hit");
      this._fill(ctx, row, ent, idx, m);
      if (hit) {
        // re-inserting an element that is still first would drop its focus (rows filled in place)
        if (row.firstElementChild !== hit) row.prepend(hit);
        hit.setAttribute("aria-label", nameOf(ctx, ent, m.st));
      }
      if (focus?.row === row) this._refocus(row, focus.i);
      else if (refocus && row.dataset.idx === refocus.idx && !row.classList.contains("hval")) {
        this._refocus(row, refocus.i);
        refocus = null;
      }
    }
    const tint = this._tintColor(ctx, models, card);
    card.classList.toggle("tinted", tint !== null);
    card.style.setProperty(
      "--fe-tint",
      tint === null ? "transparent" : cssColor(tint, "transparent"),
    );
    this._drawPlots(ctx, card);
    this._fitCells(this._resized ? [card] : filled);
    this._resized = false;
    this._visWatch.arm(this._hass);
    if (this._hover) {
      const hover = this._hover;
      const plot = [...card.querySelectorAll<PlotElement>(".plot")].find(
        (p) => p._ctx.idx === hover.idx,
      );
      if (plot) showHover(ctx, plot, hover.t);
    }
  }
  // an item's model, computed again only when what it reads changed: the states of its entity and
  // its buttons' entities, its templates, the language and Home Assistant's formatting
  _modelAt(ctx: RenderCtx, idx: number): EntityModel {
    const ent = (this._config as EntityCardConfig).entities[idx],
      hass = ctx.hass;
    const members = ent.visual === "count" ? membersOf(hass?.states[ent.entity ?? ""]) : [];
    const inputs = [
      ...this._idsByItem[idx].map((id) => hass?.states[id]),
      ...members.map((id) => hass?.states[id]),
      this._itemTpl[idx] ? this._tpl.version : 0,
      langOf(hass),
      this._localeKey,
      hass?.formatEntityState,
    ];
    const changed = depsChanged(this._modelInputs, ent, inputs);
    if (!changed && this._itemModels[idx]) return this._itemModels[idx];
    return (this._itemModels[idx] = modelOf(ctx, ent));
  }
  // what a row is filled from: its model, its pending calls, its armed buttons, which of its
  // buttons are shown, and what every row reads (the refresh, the theme, the user). A subclass
  // returns null for a row it fills from more than its own item: that row is filled every time.
  // A header badge drawing history (sparkline, trend) reads the series too, one that follows the
  // clock (stale_after, format: relative) the minute
  _rowInputs(ctx: RenderCtx, row: HTMLElement, idx: number, m: EntityModel): unknown[] | null {
    const ent = (this._config as EntityCardConfig).entities[idx];
    const badge = row.classList.contains("hval");
    const hist =
      badge && ent.entity && (ent.visual === "sparkline" || ent.visual === "trend")
        ? ctx.series.get(ent.entity)
        : undefined;
    const timed = badge && (ent.staleMin !== null || ent.format === "relative");
    const own = (map: Map<string, unknown>) => {
      const out: unknown[] = [];
      for (const [k, v] of map) if (k.startsWith(`${idx}:`)) out.push(k, v);
      return out;
    };
    return [
      m,
      this._pending.get(idx),
      ...own(this._buttonPending),
      ...own(this._armed),
      ...(ent.control?.buttons ?? []).map((b) => this._shown(b.visibility)),
      this._fillEpoch,
      ctx.hass?.user?.id,
      ctx.hass?.user?.is_admin,
      hist,
      hist?.length,
      hist ? ctx.fetched : null,
      timed ? Math.floor(ctx.now / 60e3) : null,
    ];
  }
  // the plots: every size read first, then drawn (one layout for all of them); a plot whose
  // inputs are the same and that would move by less than a pixel keeps its drawing
  _drawPlots(ctx: RenderCtx, card: HTMLElement) {
    const plots = [...card.querySelectorAll<PlotElement>(".plot")];
    const sizes = plots.map((p) => ({ w: p.clientWidth, h: p.clientHeight }));
    plots.forEach((plot, i) => {
      const { w, h } = sizes[i];
      const { t0, t1 } = windowOf(ctx, plot);
      const pc = plot._ctx;
      const series = pc.series ?? (pc.ent.entity ? ctx.series.get(pc.ent.entity) : undefined);
      const msPerPx = Math.max(1, (t1 - t0) / Math.max(w, 1));
      const inputs = [
        w,
        h,
        series,
        series?.length,
        pc.loaded ?? ctx.fetched,
        pc.st,
        Math.floor(t0 / msPerPx),
        Math.floor(t1 / msPerPx),
        langOf(ctx.hass),
        this._fillEpoch,
      ];
      if (depsChanged(this._plotInputs, plot, inputs)) drawPlot(ctx, plot, { w, h });
    });
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
  // the card tint: the colour of the first shown row whose matching rule sets tint_card
  _tintColor(_ctx: RenderCtx, models: EntityModel[], card: HTMLElement): string | null {
    for (const row of card.querySelectorAll<HTMLElement>(".row")) {
      if (row.closest("[hidden]")) continue;
      const m = models[Number(row.dataset.idx)];
      if (m?.look.tint) return m.look.color;
    }
    return null;
  }
  // shrink a grid cell's big value (down to 13 px at the default text size; it starts from its
  // styled size, which follows the theme's) so short words like scene names stay whole
  _fitCells(roots: readonly HTMLElement[]) {
    const all = <E extends Element>(sel: string) =>
      roots.flatMap((r) => [
        ...(r.matches(sel) ? [r as unknown as E] : []),
        ...r.querySelectorAll<E>(sel),
      ]);
    // a gauge's value sits inside its arc: a long one (a unit like "UV index") steps its font down
    // until its drawn box fits (glyph widths do not scale exactly with the size)
    for (const t of all<SVGTextElement>(".gauge text.val")) {
      t.style.fontSize = "";
      if (typeof t.getBBox !== "function") continue;
      let size = GAUGE_FONT;
      while (size > 9 && t.getBBox().width > GAUGE_TEXT_W) {
        size -= 0.5;
        t.style.fontSize = `${size}px`;
      }
    }
    // every cell's value has the same styled size: read once
    let full = 0;
    for (const big of all<HTMLElement>(".cell .big")) {
      const b = big.querySelector("b");
      if (!b) continue;
      if (!full) {
        big.classList.remove("fit");
        full = parseFloat(getComputedStyle(b).fontSize) || 22;
      }
      const least = (13 * full) / 22;
      big.classList.add("fit");
      let size = full;
      big.style.setProperty("--fit", `${size}px`);
      while (size > least && overflows(b)) {
        size -= 1;
        big.style.setProperty("--fit", `${size}px`);
      }
    }
    // a poster's value on a narrow card: the same, from its own styled size (a word is drawn
    // smaller than a number) down to 60 % of it
    for (const big of all<HTMLElement>(".row.poster .big")) {
      const b = big.querySelector("b");
      if (!b) continue;
      big.classList.remove("fit");
      const own = parseFloat(getComputedStyle(b).fontSize) || 40;
      let size = own;
      big.classList.add("fit");
      big.style.setProperty("--fit", `${size}px`);
      while (size > own * 0.6 && overflows(b)) {
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
  _hideHover() {
    this._hover = null;
    hideHover(this._root);
  }
}
