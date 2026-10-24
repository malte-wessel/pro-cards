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
import type { Flows } from "./shared/flow-tree/model.ts";
import { selfSufficiencyPart, type Summary } from "./shared/flow-tree/render/summary.ts";
import type { HomeAssistant } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { normalizePowerFlowConfig, type PowerFlowConfig } from "./power-flow/config.ts";
import { CARD_TYPE } from "./power-flow/constants.ts";
import { allocate, fmtPower, powerNow, summaryState, type PowerNow } from "./power-flow/model.ts";

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

  _normalize(raw: unknown) {
    return normalizePowerFlowConfig(raw);
  }
  _measure(_ctx: RenderCtx, cfg: PowerFlowConfig, models: EntityModel[]) {
    return { now: powerNow(cfg, models), models };
  }
  _allocate(cfg: PowerFlowConfig, now: PowerNow, hidden: ReadonlySet<string>) {
    return allocate(cfg, now, hidden);
  }
  // the state (importing, exporting, on battery …) and the self-sufficiency
  _summary(ctx: RenderCtx, cfg: PowerFlowConfig, now: PowerNow, flows: Flows): Summary {
    const hass = ctx.hass;
    const state = summaryState(cfg, now, flows);
    const vars: Record<string, string> = {
      v: fmtPower(hass, state.w, cfg.units),
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
  _fmt(ctx: RenderCtx, cfg: PowerFlowConfig) {
    return (v: number | null, dec: number | null = null) => fmtPower(ctx.hass, v, cfg.units, dec);
  }
  _motion(cfg: PowerFlowConfig): Motion {
    return { of: (w) => w, a: cfg.animation };
  }
}

registerCard(PowerFlowCard, {
  name: "Power Flow Card Pro",
  description:
    "Where the power comes from and where it goes: solar, battery and grid → home → rooms and devices, as an animated tree",
});
