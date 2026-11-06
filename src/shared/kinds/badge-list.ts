// The badges of a card's visual editor as a list (editor-list.ts), drawn in one of ha-form's
// sections (`selector: { pro_cards_badges: { entity } }`; `entity` is the card's). A box a badge: its
// icon, its title (its name, else what it shows) and a line of the rest; its form opens in the
// editor's sub-view.
import { ItemListSelector } from "../editor-list.ts";
import type { HomeAssistant } from "../ha.ts";
import { t, type StringKey } from "../i18n.ts";
import { DETECTED, badgeToForm } from "./editor-form.ts";
import { kindLabel } from "./editor-schema.ts";

type Raw = Record<string, unknown>;
export const BADGE_LIST = "pro_cards_badges";
export { EDIT_ITEM } from "../editor-list.ts";

// a badge's row: its title (its name, else what it shows: its entity, the attribute, its text, or
// the card's value) and a line of the rest (what it shows where it has a name, its kind, its icon,
// its visual and its switch)
const str = (v: unknown) => (typeof v === "string" ? v : "");
export const badgeLines = (
  hass: HomeAssistant | undefined,
  b: Raw,
): { title: string; detail: string } => {
  const L = (k: string, vars?: Record<string, string>) =>
    t(hass, `editor.card.${k}` as StringKey, vars);
  const entity = str(b.entity);
  const attr = str(b.attribute);
  const shows = [
    ...(entity ? [String(hass?.states[entity]?.attributes.friendly_name ?? entity)] : []),
    ...(attr ? [attr.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())] : []),
    ...(str(b.value) ? [`“${str(b.value)}”`] : []),
  ];
  const title = str(b.name) || shows.shift() || L("badge_card_value");
  const parts = [...shows];
  if (typeof b.kind === "string" && b.kind !== DETECTED)
    parts.push(b.kind === "none" ? L("badge_kind.none") : kindLabel(hass, b.kind));
  if (b.icon_type === "none") parts.push(L("badge_icon.none"));
  else if (typeof b.icon_type === "string" && b.icon_type !== "icon")
    parts.push(L(`badge_icon.${b.icon_type}`));
  if (typeof b.visual === "string" && b.visual)
    parts.push(
      L(`badge_visual.${b.visual}`) +
        (b.visual !== "bar" && typeof b.hours === "number" ? ` ${b.hours} h` : ""),
    );
  if (b.control === true) parts.push(L("badge.control"));
  return { title, detail: parts.join(" · ") };
};

// the badges' list: a box a badge, its icon its own over the state icon of the entity it reads
export class BadgeListSelector extends ItemListSelector {
  _key = "badges";
  _type = BADGE_LIST;
  _toItem(x: unknown): Raw {
    return typeof x === "object" && x ? (x as Raw) : badgeToForm(x);
  }
  _lines(b: Raw) {
    return badgeLines(this._hass, b);
  }
  _addLabel() {
    return this._L("editor.card.badges_add");
  }
  // the card's entity: what a badge without one reads (the selector's `entity`)
  get _cardEntity() {
    return str(this._options.entity);
  }
  // none, a dot, or its own icon over the state icon of the entity it reads
  _iconOf(b: Raw): HTMLElement {
    const slot = document.createElement("span");
    slot.className = "icon";
    if (b.icon_type === "none") return slot;
    if (b.icon_type === "dot") {
      slot.innerHTML = `<span class="dot"></span>`;
      return slot;
    }
    const id = str(b.entity) || this._cardEntity;
    const icon = document.createElement("ha-state-icon") as HTMLElement & {
      hass?: HomeAssistant;
      stateObj?: unknown;
      icon?: string;
    };
    icon.hass = this._hass;
    icon.stateObj = id ? this._hass?.states[id] : undefined;
    if (str(b.icon)) icon.icon = str(b.icon);
    slot.append(icon);
    return slot;
  }
}
