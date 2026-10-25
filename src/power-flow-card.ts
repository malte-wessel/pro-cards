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
 *   hide_consumers_below: 20               # hide consumers drawing less (W); hide_below per room / consumer
 *   visibility: [...]                      # on a source, consumer, room or device: drawn while it holds
 *   rules: [...]                           # on the home power in W: label, colour, tint_card
 *   title / icon / header_entities / tap_action / hold_action / double_tap_action
 */
import { registerCard } from "./shared/card.ts";
import type { EntityModel, RenderCtx } from "./shared/entity/model.ts";
import { FlowTreeCardBase } from "./shared/flow-tree/base.ts";
import type { Motion } from "./shared/flow-tree/flow.ts";
import { fmtIn, shareOfMax, treeUnit, type Flows } from "./shared/flow-tree/model.ts";
import { COLORS, DEFAULT_ANIMATION } from "./shared/flow-tree/constants.ts";
import { selfSufficiencyPart, type Summary } from "./shared/flow-tree/render/summary.ts";
import type { HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizePowerFlowConfig, type PowerFlowConfig } from "./power-flow/config.ts";
import { CARD_TYPE } from "./power-flow/constants.ts";
import {
  allocate,
  fmtPower,
  isPowerUnit,
  powerNow,
  summaryState,
  type PowerNow,
} from "./power-flow/model.ts";

export class PowerFlowCard extends FlowTreeCardBase<PowerFlowConfig> {
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

  _warned = new Set<string>();

  _normalize(raw: unknown) {
    return normalizePowerFlowConfig(raw);
  }
  _measure(ctx: RenderCtx, cfg: PowerFlowConfig, models: EntityModel[]) {
    if (ctx.hass)
      this._unit = treeUnit(cfg, ctx.hass, isPowerUnit, (id) => {
        if (this._warned.has(id)) return;
        this._warned.add(id);
        console.warn(`${CARD_TYPE}: ${id} does not count in the unit of the tree`);
      });
    return { now: powerNow(cfg, models), models };
  }
  _allocate(cfg: PowerFlowConfig, now: PowerNow, hidden: ReadonlySet<string>) {
    return allocate(cfg, now, hidden);
  }
  // the state (importing, exporting, on battery …) and the self-sufficiency; a tree in another
  // unit (heat, water) has neither: they speak of electricity
  _summary(ctx: RenderCtx, cfg: PowerFlowConfig, now: PowerNow, flows: Flows): Summary {
    const hass = ctx.hass;
    if (this._unit) return { parts: [], color: COLORS.home, tint: false };
    const state = summaryState(cfg, now, flows);
    const vars: Record<string, string> = {
      v: this._fmt(ctx, cfg)(state.w),
      price: now.price?.text ?? "",
    };
    return {
      parts: [
        { text: t(hass, state.key, vars), accent: true },
        ...selfSufficiencyPart(hass, flows),
      ],
      color: state.color,
      tint: state.tint,
    };
  }
  // W and kW, or the tree's own unit as written (with the kW decimals)
  _fmt(ctx: RenderCtx, cfg: PowerFlowConfig) {
    const unit = this._unit;
    return (v: number | null, dec: number | null = null) =>
      unit
        ? fmtIn(ctx.hass, v, unit, dec ?? cfg.units.decKw)
        : fmtPower(ctx.hass, v, cfg.units, dec);
  }
  // by the watts between the animation's bounds; in another unit (and no bounds of the config's
  // own) by the share of the largest flow
  _motion(cfg: PowerFlowConfig, flows: Flows): Motion {
    if (this._unit && cfg.animation === DEFAULT_ANIMATION)
      return { of: shareOfMax(flows), a: { slowBelow: 0, fastAbove: 1000 } };
    return { of: (w) => w, a: cfg.animation };
  }
}

registerCard(PowerFlowCard, {
  name: "Power Flow Card Pro",
  description:
    "Where the power comes from and where it goes: solar, battery and grid → home → rooms and devices, as an animated tree",
});
