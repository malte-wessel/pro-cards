/*
 * heading-card-pro – a heading with badges: the entity cards' header on its own.
 *
 *   type: custom:heading-card-pro
 *   style: title                           # section | title | subtitle | big | hero
 *   title: Living room                     # template allowed
 *   subtitle: "{{ ... }}"                  # the line under the title; template allowed
 *   icon: mdi:sofa / color: amber          # the icon and its colour (big: in a circle); templates allowed
 *   title_tap_action / icon_tap_action     # the title (and its icon), the icon on its own
 *   align: start                           # start | center
 *   badges_position: end                   # end | inline | below (end moves below on a narrow card)
 *   overflow: wrap                         # wrap | scroll
 *   badge_style: outline / badge_size: m   # defaults: outline | soft | filled | plain, s | m | l
 *   hours_to_show: 6                       # history of the sparkline and trend badges
 *   tap_action / hold_action / double_tap_action / hover   # defaults for every badge
 *   badges:                                # header entities (see entity-card-pro for the keys)
 *     - entity: sensor.living_room_temperature
 *       visual: icon                       # icon | ring | bar | sparkline | trend | count | dot
 *       style: soft / size: l              # this badge's pill and size
 *       format: auto                       # auto | power | duration | relative
 *       stale_after: 2h / trend_hours: 1
 *       control: toggle                    # a switch in the badge
 *       rules: [{ above: 24, color: orange, style: filled, pulse: true }]
 */
import { registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { EntityCardBase, type VisState } from "./shared/entity/base.ts";
import { tplOf } from "./shared/entity/model.ts";
import { isNum, qs } from "./shared/util.ts";
import { CARD_TYPE, normalizeHeadingCardConfig, type HeadingCardConfig } from "./heading/config.ts";
import { STYLE_HEADING_CARD } from "./heading/styles.ts";

export class HeadingCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  declare _config?: HeadingCardConfig;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const sensor = (entities || []).find(
      (id) => id.startsWith("sensor.") && hass?.states[id] && isNum(hass.states[id].state),
    );
    return { title: t(hass, "heading.stub_title"), badges: sensor ? [sensor] : [] };
  }
  _normalize(raw: unknown) {
    return normalizeHeadingCardConfig(raw);
  }
  _styles() {
    return STYLE_HEADING_CARD;
  }
  getGridOptions(): GridOptions {
    return { columns: "full", rows: "auto", min_columns: 3 };
  }
  getCardSize() {
    const style = this._config?.style;
    return style === "big" || style === "hero" ? 2 : 1;
  }
  // the heading is the header alone: nothing shown in it hides the card
  _bodyShown(_vis: VisState) {
    return false;
  }
  // a subtitle shows the header even without a title, an icon or a badge
  _headerExtra() {
    return !!this._config?.subtitle;
  }
  // the title and the subtitle in one column, a line after them (section), the style's classes
  _buildHeader(header: HTMLElement) {
    const cfg = this._config as HeadingCardConfig;
    const htx = document.createElement("div");
    htx.className = "htx";
    const sub = document.createElement("div");
    sub.className = "subtitle";
    htx.append(qs(header, ".title"), sub);
    const line = document.createElement("span");
    line.className = "hline";
    const hvals = qs(header, ".hvals");
    header.insertBefore(htx, hvals);
    header.insertBefore(line, hvals);
    header.classList.add(
      `s-${cfg.style}`,
      `align-${cfg.align}`,
      `bpos-${cfg.badgesPosition}`,
      `ov-${cfg.overflow}`,
    );
  }
  _render() {
    super._render();
    const cfg = this._config,
      header = this._root?.querySelector<HTMLElement>(".header");
    if (!cfg || !header || !this._hass) return;
    const ctx = this._ctx();
    const sub = qs(header, ".subtitle");
    const text = tplOf(ctx, cfg.subtitle ?? null) || "";
    if (sub.textContent !== text) sub.textContent = text;
    sub.hidden = !text;
    // a colour that is no plain colour token (a template rendering markup) counts as none
    const color = cssColor(tplOf(ctx, cfg.iconColor ?? null));
    if (color) header.style.setProperty("--hd-color", color);
    else header.style.removeProperty("--hd-color");
  }
}

registerCard(HeadingCard, {
  name: "Heading Card Pro",
  description:
    "A heading with an icon, a subtitle and live badges: values, rings, bars, sparklines, trends and switches",
});
