/*
 * wind-card – a wind speed as a tile, a flow tile or a hero, with an animated wind field.
 *
 *   type: custom:wind-card
 *   entity: sensor.wind_speed              # required: a speed sensor, or a weather entity
 *   direction: sensor.wind_direction       # optional: degrees or N / NNE …; a weather entity's wind_bearing otherwise
 *   gust: sensor.wind_gust                 # optional; a weather entity's wind_gust_speed otherwise
 *   name / secondary / color / decimals    # of the lead; templates allowed
 *   rules: [{ below: 20, color: teal, label: Light breeze }, …]   # colour, label, tint_card; drive the particles
 *   layout: tile                           # tile | hero
 *   visual: icon                           # icon | flow   (tile only: the whole tile is the field)
 *   lead: animated                         # animated | arrow
 *   flow: { style: dots, density: normal, height: 120 }   # dots | lines | swoosh | vectors; sparse | normal | dense
 *   title / icon / header_entities / tap_action / hold_action / double_tap_action
 */
import { registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import type { EntityItem } from "./shared/entity/config.ts";
import { modelOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizeWindCardConfig, type WindConfig } from "./wind/config.ts";
import { CARD_TYPE } from "./wind/constants.ts";
import { updateCurrent, windNow, type CurrentModels, type RowKind } from "./wind/render/current.ts";
import { buildBand, updateBand } from "./wind/render/flow.ts";
import { STYLE_WIND_CARD } from "./wind/styles.ts";

export class WindCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const states = hass?.states || {};
    const isWind = (id: string) =>
      id.startsWith("sensor.") && states[id]?.attributes?.device_class === "wind_speed";
    const ids = [...(entities || []), ...Object.keys(states)];
    const e = ids.find(isWind) || ids.find((id) => id.startsWith("weather.")) || "";
    return { entity: e, title: t(hass, "wind.stub_title") };
  }

  declare _config?: WindConfig;

  _normalize(raw: unknown) {
    return normalizeWindCardConfig(raw);
  }
  _styles() {
    return STYLE_WIND_CARD;
  }
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

  // ----- DOM -----
  _buildBody(body: HTMLElement) {
    const cfg = this._config as WindConfig;
    if (cfg.layout === "hero") {
      body.appendChild(this._row(cfg.speedIdx, "whero"));
      const band = buildBand("band");
      band.style.setProperty("--band-h", `${cfg.flow.height}px`);
      body.appendChild(band);
      return;
    }
    const row = this._row(cfg.speedIdx, "wtile");
    if (cfg.visual === "flow") {
      row.classList.add("flow");
      row.appendChild(buildBand("bg"));
    }
    body.appendChild(row);
  }
  _models(ctx: RenderCtx, cfg: WindConfig, speed: EntityModel): CurrentModels {
    return {
      speed,
      dir: cfg.dirIdx === null ? null : modelOf(ctx, cfg.entities[cfg.dirIdx]),
      gust: cfg.gustIdx === null ? null : modelOf(ctx, cfg.entities[cfg.gustIdx]),
    };
  }
  _fill(ctx: RenderCtx, row: HTMLElement, ent: EntityItem, idx: number, m: EntityModel) {
    const cfg = this._config as WindConfig;
    const c = row.classList;
    if (c.contains("wtile") || c.contains("whero")) {
      const kind: RowKind = c.contains("whero") ? "hero" : c.contains("flow") ? "flowtile" : "tile";
      updateCurrent(ctx, row, cfg, this._models(ctx, cfg, m), kind);
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
    const speed = modelOf(ctx, cfg.entities[cfg.speedIdx]);
    const cm = this._models(ctx, cfg, speed);
    const now = windNow(ctx, cfg, cm);
    // the hero band is outside the row: it takes the speed colour itself
    band.style.setProperty("--fe-color", cssColor(speed.look.color, "var(--primary-color)"));
    updateBand(band, {
      style: cfg.flow.style,
      density: cfg.flow.density,
      bearing: now.bearing,
      kmh: now.kmh,
      gustKmh: now.gustKmh,
      chip: now.chip,
    });
  }
}

registerCard(WindCard, {
  name: "Wind Card",
  description:
    "Wind speed, direction and gusts as a tile, a flow tile or a hero with an animated wind field",
});
