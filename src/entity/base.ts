// Base element of the three entity cards. Subclasses provide:
//   static cardType            – the custom element name
//   _normalize(raw)            – the normalised config (see config.js)
//   _styles()                  – the CSS string for the shadow root
//   getGridOptions()           – the sections grid footprint
import { fireAction } from "../shared/card.ts";
import { cssColor } from "../shared/color.ts";
import { REFRESH_MS } from "../shared/constants.ts";
import type { ActionConfig, ActionKind, GridOptions, HomeAssistant } from "../shared/ha.ts";
import { fetchHistory, pointOf, type Point } from "../shared/history.ts";
import { hideHover } from "../shared/hover.ts";
import { clamp01, qs } from "../shared/util.ts";
import { BLOCK_VISUALS, DOUBLE_MS, HISTORY_VISUALS, HOLD_MS } from "./constants.ts";
import { collectTemplates, type EntityCardConfig, type EntityItem, type Group } from "./config.ts";
import { modelOf, tplOf, type PlotHandlers, type RenderCtx } from "./model.ts";
import { fillByClass } from "./render/fill.ts";
import { drawPlot, showHover, type PlotElement } from "./render/plots.ts";

type Unsubscribe = () => unknown;

// grid rows a block visual adds below its row
const blk = (e: EntityItem) =>
  e.visual === "sparkline" || e.visual === "columns" || e.visual === "gauge"
    ? 2
    : BLOCK_VISUALS.has(e.visual)
      ? 1
      : 0;
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
      return n * (ents.some((e) => e.item.showName) ? 2 : 1);
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
    this._series = new Map();
    this._tplResult = new Map();
    this._fetched = false;
    this._hover = null;
    if (this._hass) this._subscribeTemplates();
    if (this._root) this._buildDom();
  }

  set hass(hass: HomeAssistant) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._root) this._buildDom();
    if (!prev || prev.connection !== hass.connection) this._subscribeTemplates();
    if (this._historyIds.length && !this._fetched && !this._fetching) {
      this._fetchHistory();
      return;
    }
    let changed = !prev;
    for (const id of this._entityIds) {
      const st = hass.states[id],
        pst = prev?.states[id];
      if (st === pst) continue;
      changed = true;
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
    if (this._hass && this._templates?.size && this._tplUnsub.size === 0)
      this._subscribeTemplates();
  }
  disconnectedCallback() {
    clearInterval(this._timer);
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
    };
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
  _bindActions(el: HTMLElement, ent: EntityItem) {
    const has = (a: ActionConfig | undefined) => a && a.action !== "none";
    if (!has(ent.tap) && !has(ent.hold) && !has(ent.dbl)) return;
    el.classList.add("actionable");
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    let holdTimer: ReturnType<typeof setTimeout> | undefined,
      held = false,
      lastTap = 0,
      tapTimer: ReturnType<typeof setTimeout> | undefined;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      held = false;
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
      if (ev.button !== 0) return;
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
    if (ent) this._bindActions(r, ent);
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
    cfg.groups.forEach((g, k) => {
      if (g.divider && k > 0) {
        const div = document.createElement("div");
        div.className = "divider";
        body.appendChild(div);
      }
      body.appendChild(this._buildGroup(g));
    });
    card.appendChild(body);
    root.appendChild(card);
    this._root = card;
    this._ro?.observe(card);
    this._render();
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
        const div = document.createElement("div");
        div.className = "divider";
        el.appendChild(div);
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
    let tint: string | null = null;
    const models = cfg.entities.map((ent) => modelOf(ctx, ent));
    for (const row of card.querySelectorAll<HTMLElement>(".row")) {
      const idx = Number(row.dataset.idx),
        ent = cfg.entities[idx],
        m = models[idx];
      if (!ent || !m) continue;
      row.style.setProperty("--fe-color", cssColor(m.look.color, "var(--primary-color)"));
      if (m.look.tint && tint === null) tint = m.look.color;
      fillByClass(ctx, row, ent, idx, m);
    }
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
  // shrink a grid cell's big value (down to 13 px) so short words like scene names stay whole
  _fitCells(card: HTMLElement) {
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
    const t = ctx.t0 + clamp01((ev.clientX - rect.left) / (rect.width || 1)) * (ctx.now - ctx.t0);
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
