// Card element helpers shared by all cards.
import type {
  ActionConfig,
  ActionKind,
  CardConfigBase,
  CardConstructor,
  HapticType,
  HomeAssistant,
} from "./ha.ts";
import type { Fits } from "./suggest.ts";

// defines an element unless the name is already taken (another resource, or this bundle loaded
// twice): the define would throw and abort the whole bundle, taking every card after it down with
// it. Returns whether the element was defined.
export const defineElement = (tag: string, cls: CustomElementConstructor) => {
  if (customElements.get(tag)) {
    console.error(
      `pro-cards: <${tag}> is already defined (by another resource, or this bundle is loaded twice)`,
    );
    return false;
  }
  customElements.define(tag, cls);
  return true;
};

// the migration guide a deprecated card's warning points to
export const MIGRATION_GUIDE = "https://malte-wessel.github.io/pro-cards/guide/migrating";
// the card types that said they are deprecated (once each, however many cards a dashboard has)
const warned = new Set<string>();
export const warnDeprecated = (type: string, successor: string) => {
  if (warned.has(type)) return;
  warned.add(type);
  console.warn(`${type} is deprecated and goes in 4.0: use ${successor} (${MIGRATION_GUIDE})`);
};

// registers the element (its static `cardType`) and its card picker entry; `suggest` names the
// entities the picker suggests the card for (src/shared/suggest.ts), with the card's stub for
// that entity as the suggestion's config. A card that is `deprecated` names its successor: the
// picker says so, and a card configured says it once in the console
export const registerCard = (
  cls: CardConstructor,
  {
    name,
    description,
    suggest,
    deprecated,
  }: { name: string; description: string; suggest?: Fits; deprecated?: string },
) => {
  if (!defineElement(cls.cardType, cls)) return;
  if (deprecated) {
    const proto = cls.prototype as { setConfig(config: unknown): void };
    const setConfig = proto.setConfig;
    proto.setConfig = function (this: unknown, config: unknown) {
      warnDeprecated(cls.cardType, deprecated);
      return setConfig.call(this, config);
    };
  }
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: cls.cardType,
    name: deprecated ? `${name} (deprecated)` : name,
    description: deprecated ? `Deprecated: use ${deprecated}. ${description}` : description,
    // (a deprecated card draws no preview: the picker would make it say so in the console)
    preview: !deprecated,
    ...(suggest && {
      getEntitySuggestion: (hass: HomeAssistant, entityId: string) =>
        suggest(hass, entityId)
          ? {
              config: {
                type: `custom:${cls.cardType}`,
                ...cls.getStubConfig?.(hass, [entityId]),
              },
            }
          : null,
    }),
  });
};

// a composed, bubbling custom event the Home Assistant frontend listens for
export const fireEvent = (el: EventTarget, type: string, detail?: unknown) =>
  el.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));

// Hands an action to Home Assistant (`hass-action`, handled by the frontend's ActionMixin):
// more-info, toggle, navigate, url, perform-action, assist, fire-dom-event, confirmation dialogs
// and haptics all run there. `kind` is "tap", "hold" or "double_tap"; `action` is the raw action
// config from the YAML (HA reads its keys); `entityId` is the entity the action acts on.
export const fireAction = (
  el: EventTarget,
  entityId: string | null | undefined,
  action: ActionConfig,
  kind: ActionKind,
) =>
  fireEvent(el, "hass-action", {
    config: { entity: entityId, [`${kind}_action`]: action },
    action: kind,
  });

// haptic feedback on the companion app (types from HA: light, medium, heavy, selection, success, warning, failure)
export const fireHaptic = (el: EventTarget, type: HapticType = "light") =>
  fireEvent(el, "haptic", type);

// Replaces the card's own nodes in its shadow root, its <style> and its <ha-card>, with fresh ones
// and returns the new (empty, connected) <ha-card>. Anything else there stays: UIX and card-mod
// put their styles into the same shadow root and would lose them on every rebuild. Our <style>
// goes first, so their rules win at equal specificity.
export const freshShadow = (root: ShadowRoot, css: string): HTMLElement => {
  for (const el of [...root.children]) if (el.matches("style[data-pro], ha-card")) el.remove();
  const style = document.createElement("style");
  style.dataset.pro = "";
  style.textContent = css;
  root.prepend(style);
  const card = document.createElement("ha-card");
  root.appendChild(card);
  return card;
};

// `fill_height: false` keeps the card at its own height (STYLE_HOST, `keep-height`); a card sets
// it from its raw config in setConfig. The default needs no script: the host fills.
export const syncKeepHeight = (el: HTMLElement, config: unknown) =>
  el.toggleAttribute(
    "keep-height",
    !!config && typeof config === "object" && (config as CardConfigBase).fill_height === false,
  );
