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
 *   title / icon / header_entities / tap_action / hold_action / double_tap_action / hover
 */
import { registerCard } from "./shared/card.ts";
import type { EntityModel, RenderCtx } from "./shared/entity/model.ts";
import { depsChanged } from "./shared/deps.ts";
import { langOf } from "./shared/format.ts";
import { FlowCardBase } from "./shared/flow/base.ts";
import type { RowKind } from "./shared/flow/dom.ts";
import type { HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizeWindCardConfig, type WindConfig } from "./wind/config.ts";
import { CARD_TYPE } from "./wind/constants.ts";
import { updateCurrent, windNow, type CurrentModels, type WindNow } from "./wind/render/current.ts";
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
  // the items the row and the band read (the cached models) and the wind they make, worked out
  // once for both: again only when one of the models or the language changed
  _windNow?: WindNow;
  _current(ctx: RenderCtx, speed: EntityModel) {
    const cfg = this._config as WindConfig;
    const at = (i: number | null) => (i === null ? null : this._modelAt(ctx, i));
    const cm: CurrentModels = { speed, dir: at(cfg.dirIdx), gust: at(cfg.gustIdx) };
    if (depsChanged(this._nowInputs, this, [cm.speed, cm.dir, cm.gust, langOf(ctx.hass)]))
      this._windNow = windNow(ctx, cfg, cm);
    return { cm, now: this._windNow as WindNow };
  }
  _updateCurrent(ctx: RenderCtx, row: HTMLElement, kind: RowKind, m: EntityModel) {
    const { cm, now } = this._current(ctx, m);
    updateCurrent(ctx, row, this._config as WindConfig, cm, kind, now);
  }
  _updateBand(ctx: RenderCtx, band: HTMLElement, speed: EntityModel) {
    const cfg = this._config as WindConfig;
    const { now } = this._current(ctx, speed);
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
