/*
 * power-flow-card-pro – where a home's electricity comes from and where it goes, as a tree with
 * animated flow: sources (solar, battery, grid) → home → rooms → consumers.
 *
 *   type: custom:power-flow-card-pro
 *   sources:                               # required: solar / battery / grid entries
 *     - { type: solar, entity: sensor.solar_power }
 *     - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }   # + = discharging
 *     - { type: grid, power: sensor.grid_power, price: sensor.price, offline: binary_sensor.grid_outage }
 *   home: sensor.home_power                # optional; computed from the sources otherwise
 *   consumers: [ { entity }, { group, icon, entities: [...] } ]   # optional; "other" takes the rest
 *   consumer_style: nodes                  # nodes | list
 *   direction: right                       # right | down
 *   flow_style: dots                       # dots | lines | arrows
 *   expensive_above: 0.35                  # price threshold of the "Expensive" state
 *   rules: [...]                           # on the home power in W: label, colour, tint_card
 *   title / icon / header_entities / tap_action / hold_action / double_tap_action
 */
import { registerCard } from "./shared/card.ts";
import { cssColor } from "./shared/color.ts";
import { EntityCardBase } from "./shared/entity/base.ts";
import type { EntityItem } from "./shared/entity/config.ts";
import { resolveLook, type Look } from "./shared/entity/look.ts";
import { modelOf, tplGetter, type EntityModel, type RenderCtx } from "./shared/entity/model.ts";
import type { GridOptions, HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizePowerFlowConfig, type PowerFlowConfig } from "./power-flow/config.ts";
import { CARD_TYPE, COLORS, GEOM } from "./power-flow/constants.ts";
import { diagramHeight, layoutTree } from "./power-flow/layout.ts";
import {
  allocate,
  powerNow,
  summaryState,
  type Flows,
  type PowerNow,
  type SummaryState,
} from "./power-flow/model.ts";
import { buildSummary, updateSummary } from "./power-flow/render/summary.ts";
import { buildTree, updateTree } from "./power-flow/render/tree.ts";
import { STYLE_POWER_FLOW_CARD } from "./power-flow/styles.ts";

interface Computed {
  models: EntityModel[];
  now: PowerNow;
  flows: Flows;
  state: SummaryState;
  homeLook: Look;
}

export class PowerFlowCard extends EntityCardBase {
  static cardType = CARD_TYPE;
  static getStubConfig(hass: HomeAssistant | undefined, entities?: string[]) {
    const states = hass?.states || {};
    const ids = [...(entities || []), ...Object.keys(states)];
    const isPower = (id: string) =>
      id.startsWith("sensor.") && states[id]?.attributes?.device_class === "power";
    const solar = ids.find((id) => isPower(id) && /solar|pv/.test(id));
    const home = ids.find((id) => isPower(id) && id !== solar);
    // always a config the card accepts: a power sensor, any sensor, or a placeholder
    const any = ids.find((id) => id.startsWith("sensor.")) || "sensor.solar_power";
    return {
      title: t(hass, "power.stub_title"),
      ...(home ? { home } : {}),
      sources: [solar ? { type: "solar", entity: solar } : { type: "grid", power: home ?? any }],
    };
  }

  declare _config?: PowerFlowConfig;
  _computed?: Computed;

  _normalize(raw: unknown) {
    return normalizePowerFlowConfig(raw);
  }
  _styles() {
    return STYLE_POWER_FLOW_CARD;
  }
  getGridOptions(): GridOptions {
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 3 };
  }
  getCardSize() {
    const cfg = this._config;
    if (!cfg) return 3;
    return (cfg.hasHeader ? 1 : 0) + Math.ceil((GEOM.summaryH + diagramHeight(cfg) + 36) / 56);
  }

  // ----- DOM -----
  _buildBody(body: HTMLElement) {
    const cfg = this._config as PowerFlowConfig;
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
  // grid offline and an expensive price tint the card red; else the home rule's tint
  _tintColor(ctx: RenderCtx, models: EntityModel[], card: HTMLElement) {
    const c = this._computed;
    if (c?.state.tint) return "red";
    if (c?.homeLook.tint) return c.homeLook.color;
    // the base walks every row: the home row must carry the look resolved on watts, not the raw value
    const cfg = this._config as PowerFlowConfig;
    return super._tintColor(
      ctx,
      models.map((m, i) => (c && i === cfg.homeIdx ? { ...m, look: c.homeLook } : m)),
      card,
    );
  }
  _compute(ctx: RenderCtx, cfg: PowerFlowConfig): Computed {
    const models = cfg.entities.map((ent) => modelOf(ctx, ent));
    const now = powerNow(cfg, models);
    const flows = allocate(cfg, now);
    const state = summaryState(cfg, now, flows);
    // the home rules match the home power in watts, whatever unit the sensor reports
    const homeEnt = cfg.entities[cfg.homeIdx],
      homeM = models[cfg.homeIdx];
    const H = Math.round(flows.H);
    const homeLook = resolveLook(
      homeEnt,
      { raw: String(H), num: H, avail: true },
      homeM.st,
      tplGetter(ctx),
      ctx.hass,
    );
    homeLook.color =
      homeEnt.color || homeLook.rule?.color ? cssColor(homeLook.color, COLORS.home) : COLORS.home;
    return { models, now, flows, state, homeLook };
  }
  _render() {
    if (!this._root || !this._hass || !this._config) return;
    const cfg = this._config,
      ctx = this._ctx();
    const c = (this._computed = this._compute(ctx, cfg));
    super._render();
    const card = this._root;
    const summary = card.querySelector<HTMLElement>(".psummary");
    if (summary)
      updateSummary(
        summary,
        ctx,
        { ent: cfg.entities[cfg.homeIdx], m: c.models[cfg.homeIdx], look: c.homeLook },
        c.now,
        c.flows,
        c.state,
        cfg.units,
      );
    const diag = card.querySelector<HTMLElement>(".pdiag");
    if (!diag) return;
    const width = diag.clientWidth;
    // not laid out yet: the resize observer renders again once the diagram has a size
    if (width <= 0) return;
    const layout = layoutTree(cfg, width, c.flows.edges);
    updateTree(diag, {
      cfg,
      ctx,
      models: c.models,
      now: c.now,
      flows: c.flows,
      layout,
      homeLook: c.homeLook,
    });
  }
}

registerCard(PowerFlowCard, {
  name: "Power Flow Card Pro",
  description:
    "Where the power comes from and where it goes: solar, battery and grid → home → rooms and devices, as an animated tree",
});
