// Card element helpers shared by all cards.
import type { ActionConfig, ActionKind, CardConstructor, HapticType } from "./ha.ts";

// registers the element (its static `cardType`) and its card picker entry
export const registerCard = (
  cls: CardConstructor,
  { name, description }: { name: string; description: string },
) => {
  customElements.define(cls.cardType, cls);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: cls.cardType, name, description, preview: true });
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
