// The element both flow tree cards extend: the summary line over the tree, the tree's DOM, its
// visibility, the thresholds' memory and the render pipeline (summary, labels, layout, tree). The
// card supplies its numbers: what it measures (`_measure`), how the flows split (`_allocate`), its
// summary, how a value reads (`_fmt`) and how the links move (`_motion`).
import { cssColor } from "../color.ts";
import { EntityCardBase, type VisState } from "../entity/base.ts";
import type { EntityItem } from "../entity/config.ts";
import { resolveLook, type Look } from "../entity/look.ts";
import { modelOf, tplGetter, type EntityModel, type RenderCtx } from "../entity/model.ts";
import type { GridOptions } from "../ha.ts";
import type { Visibility } from "../visibility.ts";
import {
  hiddenNodes,
  leavesOf,
  nodeVisibilities,
  bothWays,
  viewConfig,
  type FlowTreeConfig,
} from "./config.ts";
import { COLORS, GEOM } from "./constants.ts";
import type { Motion } from "./flow.ts";
import { diagramHeight, layoutTree } from "./layout.ts";
import { bothFlows, thresholdShown, type FlowNow, type Flows } from "./model.ts";
import { buildSummary, updateSummary, type Summary } from "./render/summary.ts";
import { buildTree, labelLines, updateTree, type Fmt } from "./render/tree.ts";
import { STYLE_FLOW_TREE } from "./styles.ts";

export interface TreeComputed<C extends FlowTreeConfig = FlowTreeConfig> {
  models: EntityModel[];
  now: FlowNow;
  hidden: Set<string>; // the nodes not drawn now
  view: C; // the config as drawn: without them
  flows: Flows;
  summary: Summary;
  homeLook: Look;
  split: Set<string>; // the sources that show both their flows
  fmt: Fmt;
  motion: Motion;
}

export abstract class FlowTreeCardBase<C extends FlowTreeConfig> extends EntityCardBase {
  declare _config?: C;
  _computed?: TreeComputed<C>;
  // `hide_below`: whether each consumer was shown by its value (the threshold's memory)
  _byValue = new Map<string, boolean>();
  // whether each source showed both its flows (the two values' memory)
  _byBoth = new Map<string, boolean>();

  // ----- what the card supplies -----
  // the values: what the sensors say now (the models' looks may be resolved anew on them)
  abstract _measure(
    ctx: RenderCtx,
    cfg: C,
    models: EntityModel[],
  ): { now: FlowNow; models: EntityModel[] };
  abstract _allocate(cfg: C, now: FlowNow, hidden: ReadonlySet<string>): Flows;
  abstract _summary(ctx: RenderCtx, cfg: C, now: FlowNow, flows: Flows): Summary;
  abstract _fmt(ctx: RenderCtx, cfg: C): Fmt;
  abstract _motion(cfg: C, flows: Flows): Motion;
  // the least step of the thresholds' hysteresis, in the card's unit
  _gap() {
    return 2;
  }
  // the home's value its rules match (rounded to what they compare)
  _homeValue(h: number) {
    return Math.round(h);
  }

  setConfig(config: unknown) {
    // what the old config hid says nothing about the new one's nodes
    this._computed = undefined;
    this._byValue = new Map();
    this._byBoth = new Map();
    super.setConfig(config);
  }
  _styles() {
    return STYLE_FLOW_TREE;
  }
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 3 };
  }
  getCardSize() {
    const cfg = this._config;
    if (!cfg) return 3;
    // the tree as drawn now: hidden nodes take no room
    const view = this._computed?.view ?? cfg;
    return this._headerRows() + Math.ceil((GEOM.summaryH + diagramHeight(view) + 36) / 56);
  }

  // ----- visibility: the tree's nodes have conditions of their own -----
  _visibilityTrees(): Visibility[] {
    return [...super._visibilityTrees(), ...nodeVisibilities(this._config as C)];
  }
  // the rows of hidden nodes count as hidden items, so the base hides them and never tints from them
  _computeVis(): VisState {
    const vis = super._computeVis();
    const cfg = this._config as C,
      hidden = this._computed?.hidden;
    if (!hidden?.size) return vis;
    const items = [...vis.items];
    for (const s of cfg.sources) if (hidden.has(s.id)) items[s.idx] = false;
    for (const leaf of leavesOf(cfg))
      if (leaf.kind === "item" && hidden.has(leaf.id)) items[leaf.idx] = false;
    return { ...vis, items };
  }

  // ----- DOM -----
  _buildBody(body: HTMLElement) {
    const cfg = this._config as C;
    body.appendChild(buildSummary());
    const diag = buildTree(cfg, (idx, cls) => this._row(idx, cls));
    diag.style.setProperty("--diag-h", `${diagramHeight(cfg)}px`);
    body.appendChild(diag);
  }
  // the tree's nodes and rows are filled by the tree updater; header values by the base
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    if (row.classList.contains("pnode") || row.classList.contains("plist")) return;
    super._fill(ctx, row, ent, idx, m);
  }
  // the summary may tint the card red (grid offline, an expensive price); else the home rule's tint
  _tintColor(ctx: RenderCtx, models: EntityModel[], card: HTMLElement) {
    const c = this._computed;
    if (c?.summary.tint) return "red";
    if (c?.homeLook.tint) return c.homeLook.color;
    // the base walks every row: each must carry the look resolved on the card's values (the home
    // on its watts or kWh), not the raw state
    const cfg = this._config as C;
    return super._tintColor(
      ctx,
      models.map((m, i) =>
        !c ? m : i === cfg.homeIdx ? { ...m, look: c.homeLook } : { ...m, look: c.models[i].look },
      ),
      card,
    );
  }
  _compute(ctx: RenderCtx, cfg: C): TreeComputed<C> {
    const { now, models } = this._measure(
      ctx,
      cfg,
      cfg.entities.map((ent) => modelOf(ctx, ent)),
    );
    const gap = this._gap();
    // the consumers below their threshold: decided for every one on every render (the memory
    // follows the value), then hidden with those whose conditions fail
    const below = new Set<string>();
    for (const leaf of leavesOf(cfg)) {
      if (leaf.kind !== "item" || leaf.hideBelow === null) continue;
      const shown = thresholdShown(
        this._byValue.get(leaf.id),
        now.leaves.get(leaf.id) ?? null,
        leaf.hideBelow,
        gap,
      );
      this._byValue.set(leaf.id, shown);
      if (!shown) below.add(leaf.id);
    }
    const hidden = hiddenNodes(
      cfg,
      (v) => this._shown(v),
      (leaf) => below.has(leaf.id),
    );
    // a battery that charges while it discharges, a grid that imports while it exports: both
    // values while both run, the net value below the idle threshold (both again only clearly above)
    const split = new Set<string>();
    cfg.sources.forEach((s, i) => {
      const n = now.sources[i];
      if (n.kind === "solar" || !bothWays(cfg, s)) return;
      const [a, b] = n.kind === "battery" ? [n.charge, n.discharge] : [n.export, n.import];
      const both = bothFlows(this._byBoth.get(s.id), a, b, cfg.idleBelow, gap);
      this._byBoth.set(s.id, both);
      if (both) split.add(s.id);
    });
    const flows = this._allocate(cfg, now, hidden);
    const summary = this._summary(ctx, cfg, now, flows);
    // the home rules match the home's value in the card's unit, whatever unit the sensor reports
    const homeEnt = cfg.entities[cfg.homeIdx],
      homeM = models[cfg.homeIdx];
    const H = this._homeValue(flows.H);
    const homeLook = resolveLook(
      homeEnt,
      { raw: String(H), num: H, avail: true },
      homeM.st,
      tplGetter(ctx),
      ctx.hass,
    );
    homeLook.color =
      homeEnt.color || homeLook.rule?.color ? cssColor(homeLook.color, COLORS.home) : COLORS.home;
    return {
      models,
      now,
      hidden,
      view: viewConfig(cfg, hidden),
      flows,
      summary,
      homeLook,
      split,
      fmt: this._fmt(ctx, cfg),
      motion: this._motion(cfg, flows),
    };
  }
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    const cfg = this._config,
      ctx = this._ctx();
    // before super._render: the base's _computeVis reads the hidden set from _computed, and
    // getCardSize its view
    const c = (this._computed = this._compute(ctx, cfg));
    super._render();
    const card = this._root;
    const summary = card.querySelector<HTMLElement>(".psummary");
    if (summary)
      updateSummary(
        summary,
        ctx,
        { ent: cfg.entities[cfg.homeIdx], m: c.models[cfg.homeIdx], look: c.homeLook },
        c.fmt(c.flows.H),
        c.summary,
      );
    const diag = card.querySelector<HTMLElement>(".pdiag");
    const box = diag?.querySelector<HTMLElement>(".pscale");
    if (!diag || !box) return;
    // the labels' lines at the theme's text size: their heights take part in the tree's height
    c.view = { ...c.view, lines: labelLines(diag, this._textCache) };
    // the height follows the config and what of it is shown, never the width. A card given more
    // or less height (fixed rows, a stretched grid row, a stack) lays the tree out in what the
    // diagram measures: the natural height stays its basis, so the card's own height never
    // depends on the tree and the resize observer cannot loop.
    const natural = diagramHeight(c.view);
    diag.style.setProperty("--diag-h", `${natural}px`);
    const avail = diag.clientHeight || natural;
    const width = diag.clientWidth;
    // not laid out yet: the resize observer renders again once the diagram has a size
    if (width <= 0) return;
    // too small a cell: the tree is laid out at its own height and scaled down as a whole
    const scale = Math.min(1, avail / natural);
    if (scale < 1) {
      box.style.width = `${width / scale}px`;
      box.style.height = `${natural}px`;
      box.style.transform = `scale(${scale})`;
    } else box.style.width = box.style.height = box.style.transform = "";
    const layout = layoutTree(c.view, width / scale, c.flows.edges, undefined, avail);
    updateTree(diag, {
      cfg: c.view,
      ctx,
      models: c.models,
      now: c.now,
      flows: c.flows,
      layout,
      homeLook: c.homeLook,
      split: c.split,
      fmt: c.fmt,
      motion: c.motion,
    });
  }
}
