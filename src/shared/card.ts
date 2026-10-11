// Card element helpers shared by all cards.
import type { ActionConfig, ActionKind, CardConstructor, HapticType } from "./ha.ts";

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

// registers the element (its static `cardType`) and its card picker entry
export const registerCard = (
  cls: CardConstructor,
  { name, description }: { name: string; description: string },
) => {
  if (!defineElement(cls.cardType, cls)) return;
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
