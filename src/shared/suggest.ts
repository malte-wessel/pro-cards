// Which entities a card suggests itself for (pure), in Home Assistant's card picker: picking an
// entity there lists the cards that fit it, ours below the built-in ones (`getEntitySuggestion`
// on the card's `window.customCards` entry). Only where the card draws the entity as its own: a
// card offered for every entity makes the picker noisy.
import { domainOf } from "./color.ts";
import type { HomeAssistant } from "./ha.ts";
import { detectKind } from "./kinds/detect.ts";
import { KINDS } from "./kinds/registry.ts";
import { isNum } from "./util.ts";

export type Fits = (hass: HomeAssistant, entityId: string) => boolean;

// an entity of one of these domains
export const ofDomain =
  (...domains: string[]): Fits =>
  (_hass, id) =>
    domains.includes(domainOf(id));
// a sensor with a number to plot
export const plottable: Fits = (hass, id) =>
  domainOf(id) === "sensor" && isNum(hass.states[id]?.state);
// an entity with a kind of its own (a light, a cover, the weather, a battery …), not one the
// kinds draw plainly: that one is Home Assistant's tile
export const hasKind: Fits = (hass, id) => detectKind(id, hass.states[id]) !== KINDS.none;
