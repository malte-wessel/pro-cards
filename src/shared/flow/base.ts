// The common element of the flow cards (wind, rain): a tile, a flow tile (the band behind the
// texts) or a hero (lead row above a band). The card supplies its chip icon, its field element
// and the two update steps; the row is filled in place so running animations keep their phase.
import { cssColor } from "../color.ts";
import { EntityCardBase } from "../entity/base.ts";
import type { EntityItem } from "../entity/config.ts";
import { modelOf, type EntityModel, type RenderCtx } from "../entity/model.ts";
import type { GridOptions } from "../ha.ts";
import type { FlowCardConfig } from "./config.ts";
import { buildBand, type RowKind } from "./dom.ts";

export abstract class FlowCardBase extends EntityCardBase {
  declare _config?: FlowCardConfig;

  abstract _chip(): HTMLElement;
  abstract _field(): HTMLElement;
  abstract _updateCurrent(ctx: RenderCtx, row: HTMLElement, kind: RowKind, m: EntityModel): void;
  abstract _updateBand(ctx: RenderCtx, band: HTMLElement, lead: EntityModel): void;

  getGridOptions(): GridOptions {
    if (this._config?.layout !== "hero") {
      const rows = this._config?.hasHeader ? 2 : 1;
      return { columns: 6, rows, min_columns: 3, min_rows: rows, max_rows: rows };
    }
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 3 };
  }
  getCardSize() {
    const cfg = this._config;
    if (!cfg) return 1;
    if (cfg.layout !== "hero") return cfg.hasHeader ? 2 : 1;
    return (cfg.hasHeader ? 1 : 0) + 2 + Math.ceil((cfg.flow.height + 16) / 56);
  }

  _buildBody(body: HTMLElement) {
    const cfg = this._config as FlowCardConfig;
    if (cfg.layout === "hero") {
      body.appendChild(this._row(cfg.leadIdx, "whero"));
      const band = buildBand("band", this._chip(), this._field());
      band.style.setProperty("--band-h", `${cfg.flow.height}px`);
      body.appendChild(band);
      return;
    }
    const row = this._row(cfg.leadIdx, "wtile");
    if (cfg.visual === "flow") {
      row.classList.add("flow");
      row.appendChild(buildBand("bg", this._chip(), this._field()));
    }
    body.appendChild(row);
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const c = row.classList;
    if (c.contains("wtile") || c.contains("whero")) {
      const kind: RowKind = c.contains("whero") ? "hero" : c.contains("flow") ? "flowtile" : "tile";
      this._updateCurrent(ctx, row, kind, m);
      return;
    }
    super._fill(ctx, row, ent, idx, m);
  }
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    super._render();
    const cfg = this._config,
      ctx = this._ctx();
    const band = this._root.querySelector<HTMLElement>(".wflow");
    if (!band) return;
    const lead = modelOf(ctx, cfg.entities[cfg.leadIdx]);
    // the hero band is outside the row: it takes the lead item's colour itself
    band.style.setProperty("--fe-color", cssColor(lead.look.color, "var(--primary-color)"));
    this._updateBand(ctx, band, lead);
  }
}
