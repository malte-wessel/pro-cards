/*
 * rain-card – the rain rate as a tile, a flow tile or a hero, with falling drops, ripples or a
 * filling gauge.
 *
 *   type: custom:rain-card
 *   entity: sensor.rain_rate               # required: the rain rate sensor
 *   today: sensor.rain_today               # optional: today's total; fills the gauge, "3.6 mm today"
 *   wind: sensor.wind_speed                # optional: slants the drops
 *   direction: sensor.wind_direction       # optional: which way they slant (degrees or N / NNE …)
 *   name / secondary / color / decimals    # of the lead; templates allowed
 *   rules: [{ below: 2.5, color: light-blue, label: Light rain }, …]   # colour, label, tint_card
 *   layout: tile                           # tile | hero
 *   visual: icon                           # icon | flow   (tile only: the whole tile is the field)
 *   lead: animated                         # animated | icon
 *   flow: { style: drops, height: 120 }    # drops | ripples | fill; the hero band's height
 *   title / icon / header_entities / tap_action / hold_action / double_tap_action
 */
import { registerCard } from "./shared/card.ts";
import { modelOf, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import { FlowCardBase } from "./shared/flow/base.ts";
import type { RowKind } from "./shared/flow/dom.ts";
import type { HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizeRainCardConfig, type RainConfig } from "./rain/config.ts";
import { CARD_TYPE, CHIP_ICON } from "./rain/constants.ts";
import { rainNow, updateCurrent, type CurrentModels } from "./rain/render/current.ts";
import { fieldEl, updateBand } from "./rain/render/flow.ts";
import { rainIcon } from "./rain/render/lead.ts";
import { STYLE_RAIN_CARD } from "./rain/styles.ts";

export class RainCard extends FlowCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const states = hass?.states || {};
    const isRain = (id: string) =>
      id.startsWith("sensor.") &&
      states[id]?.attributes?.device_class === "precipitation_intensity";
    const e = [...(entities || []), ...Object.keys(states)].find(isRain) || "";
    return { entity: e, title: t(hass, "rain.stub_title") };
  }

  declare _config?: RainConfig;

  _normalize(raw: unknown) {
    return normalizeRainCardConfig(raw);
  }
  _styles() {
    return STYLE_RAIN_CARD;
  }
  _chip() {
    return rainIcon(CHIP_ICON);
  }
  _field() {
    return fieldEl();
  }
  _models(ctx: RenderCtx, cfg: RainConfig, rate: EntityModel): CurrentModels {
    const at = (i: number | null) => (i === null ? null : modelOf(ctx, cfg.entities[i]));
    return { rate, today: at(cfg.todayIdx), wind: at(cfg.windIdx), dir: at(cfg.dirIdx) };
  }
  _updateCurrent(ctx: RenderCtx, row: HTMLElement, kind: RowKind, m: EntityModel) {
    const cfg = this._config as RainConfig;
    updateCurrent(ctx, row, cfg, this._models(ctx, cfg, m), kind);
  }
  _updateBand(ctx: RenderCtx, band: HTMLElement, rate: EntityModel) {
    const cfg = this._config as RainConfig;
    const now = rainNow(ctx, cfg, this._models(ctx, cfg, rate));
    updateBand(band, {
      style: cfg.flow.style,
      rate: now.rate,
      today: now.today,
      slant: now.slant,
      chip: now.chip,
    });
  }
}

registerCard(RainCard, {
  name: "Rain Card",
  description:
    "Rain rate and today's total as a tile, a flow tile or a hero, with falling drops, ripples or a filling gauge",
});
