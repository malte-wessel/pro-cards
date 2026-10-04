/*
 * wind-card-pro – a wind speed as a tile, a flow tile or a hero, with an animated wind field.
 *
 *   type: custom:wind-card-pro
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
import { modelOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import { FlowCardBase } from "./shared/flow/base.ts";
import type { RowKind } from "./shared/flow/dom.ts";
import type { HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizeWindCardConfig, type WindConfig } from "./wind/config.ts";
import { CARD_TYPE } from "./wind/constants.ts";
import { updateCurrent, windNow, type CurrentModels } from "./wind/render/current.ts";
import { fieldEl, updateBand } from "./wind/render/flow.ts";
import { arrowIcon } from "./wind/render/lead.ts";
import { STYLE_WIND_CARD } from "./wind/styles.ts";

export class WindCard extends FlowCardBase {
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
  _chip() {
    return arrowIcon();
  }
  _field() {
    return fieldEl();
  }
  _models(ctx: RenderCtx, cfg: WindConfig, speed: EntityModel): CurrentModels {
    return {
      speed,
      dir: cfg.dirIdx === null ? null : modelOf(ctx, cfg.entities[cfg.dirIdx]),
      gust: cfg.gustIdx === null ? null : modelOf(ctx, cfg.entities[cfg.gustIdx]),
    };
  }
  _updateCurrent(ctx: RenderCtx, row: HTMLElement, kind: RowKind, m: EntityModel) {
    const cfg = this._config as WindConfig;
    updateCurrent(ctx, row, cfg, this._models(ctx, cfg, m), kind);
  }
  _updateBand(ctx: RenderCtx, band: HTMLElement, speed: EntityModel) {
    const cfg = this._config as WindConfig;
    const now = windNow(ctx, cfg, this._models(ctx, cfg, speed));
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
  name: "Wind Card Pro",
  description:
    "Wind speed, direction and gusts as a tile, a flow tile or a hero with an animated wind field",
});
