// The other lists of a card's visual editor, as the badges' and the rules' (editor-list.ts): a
// trend's lines, a control's options, the custom buttons, and the conditions of a badge's or a
// line's visibility (`selector: { pro_cards_list: { key, of, entity } }`: `key` is the field's name,
// `of` what its items are, `entity` what a condition without one reads). A box an item, its form in
// the editor's sub-view.
import { cssColor } from "../color.ts";
import { ItemListSelector } from "../editor-list.ts";
import type { HomeAssistant } from "../ha.ts";
import { t, type StringKey } from "../i18n.ts";

type Raw = Record<string, unknown>;
export const ITEM_LIST = "pro_cards_list";
export type ListOf =
  | "series"
  | "option"
  | "button"
  | "condition"
  // a weather trend's line, an entity group's entity, a flow's consumer, a breakpoint
  | "quantity"
  | "entity"
  | "consumer"
  | "breakpoint"
  // a flow's source, a weather card's section
  | "source"
  | "section";

const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const nameOf = (hass: HomeAssistant | undefined, id: string) =>
  id ? String(hass?.states[id]?.attributes.friendly_name ?? id) : "";

// a screen condition's media queries as Home Assistant's editor names them
export const SCREENS: Record<string, string> = {
  "(max-width: 767px)": "mobile",
  "(min-width: 768px) and (max-width: 1023px)": "tablet",
  "(min-width: 1024px) and (max-width: 1279px)": "desktop",
  "(min-width: 1280px)": "wide",
};

// what a condition says, in one line: whose state is (not) what, above or below, the screen, the
// time, a template; another type by its name
export const conditionLine = (hass: HomeAssistant | undefined, c: Raw, host: string): string => {
  const L = (k: string) => t(hass, `editor.card.${k}` as StringKey);
  const type = str(c.condition) || "state";
  const who = nameOf(hass, str(c.entity) || host);
  const attr = str(c.attribute) ? ` (${str(c.attribute)})` : "";
  if (type === "state") {
    const not = str(c.state_not);
    const is = str(c.state);
    return `${who}${attr} ${not && !is ? `≠ ${not}` : `= ${is || "…"}`}`;
  }
  if (type === "numeric_state") {
    const parts = [
      ...(str(c.above) ? [`> ${str(c.above)}`] : []),
      ...(str(c.below) ? [`< ${str(c.below)}`] : []),
    ];
    return `${who}${attr} ${parts.join(" · ") || "…"}`;
  }
  if (type === "screen") {
    const q = str(c.media_query);
    return SCREENS[q] ? L(`screen.${SCREENS[q]}`) : q || L("condition.screen");
  }
  if (type === "time") {
    const span = [str(c.after), str(c.before)].filter(Boolean).join("–");
    const days = Array.isArray(c.weekdays) ? (c.weekdays as string[]).join(", ") : "";
    return [span, days].filter(Boolean).join(" · ") || L("condition.time");
  }
  return L(`condition.${type}`);
};

// an item's box: its title and a line of the rest
export const itemLines = (
  hass: HomeAssistant | undefined,
  of: ListOf,
  item: Raw,
  host = "",
): { title: string; detail: string } => {
  const L = (k: string, vars?: Record<string, string>) =>
    t(hass, `editor.card.${k}` as StringKey, vars);
  if (of === "series") {
    const entity = str(item.entity);
    const rules = Array.isArray(item.rules) ? item.rules.length : 0;
    const shown = Array.isArray(item.visibility) ? item.visibility.length : 0;
    return {
      title: str(item.name) || nameOf(hass, entity) || L("series.entity"),
      detail: [
        ...(str(item.name) && entity ? [nameOf(hass, entity)] : []),
        ...(str(item.color) ? [str(item.color)] : []),
        ...(rules ? [L("list.rules", { n: String(rules) })] : []),
        ...(shown ? [L("list.conditions", { n: String(shown) })] : []),
      ].join(" · "),
    };
  }
  if (of === "option")
    return {
      title: str(item.label) || str(item.value),
      detail: str(item.label) ? str(item.value) : "",
    };
  if (of === "button") {
    // (a 3.0 button's label and action, until 4.0)
    const action = ((item.tap_action ?? item.action) as Raw | undefined)?.action;
    const name = str(item.name) || str(item.label);
    return {
      title: name || nameOf(hass, str(item.entity)) || str(action),
      detail: [
        ...(name && str(item.entity) ? [nameOf(hass, str(item.entity))] : []),
        ...(str(action) ? [str(action)] : []),
      ].join(" · "),
    };
  }
  if (of === "quantity") {
    const q = str(item.quantity);
    const what = q ? t(hass, `editor.weather.quantity.${q}` as StringKey) : "";
    return {
      title: str(item.name) || what,
      detail: [
        ...(str(item.name) ? [what] : []),
        ...(str(item.color) ? [str(item.color)] : []),
      ].join(" · "),
    };
  }
  if (of === "entity" || of === "consumer") {
    const entity = str(item.entity);
    const attr = str(item.attribute);
    const room = of === "consumer" ? str(item.group) : "";
    return {
      title: str(item.name) || nameOf(hass, entity) || attr || nameOf(hass, host),
      detail: [
        ...(str(item.name) && entity ? [nameOf(hass, entity)] : []),
        ...(attr && (str(item.name) || entity) ? [attr] : []),
        ...(room ? [room] : []),
      ].join(" · "),
    };
  }
  if (of === "source") {
    const type = str(item.type) || "solar";
    const what = t(hass, `power.${type}` as StringKey);
    // its meter: the one sensor, else the pair's first
    const meter = str(item.entity) || str(item.power) || str(item.charge) || str(item.import);
    return {
      title: str(item.name) || what,
      detail: [...(str(item.name) ? [what] : []), ...(meter ? [nameOf(hass, meter)] : [])].join(
        " · ",
      ),
    };
  }
  if (of === "section") {
    const kind = str(item.kind) || "entities";
    const what = t(hass, `editor.weather.kind.${kind}` as StringKey);
    return { title: str(item.title) || what, detail: str(item.title) ? what : "" };
  }
  if (of === "breakpoint") {
    const { at, more: _more, ...rest } = item;
    void _more;
    return {
      title: t(hass, "editor.cards.breakpoint_title", { n: str(at) || "…" }),
      detail: Object.entries(rest)
        .filter(([, v]) => v !== undefined && v !== "" && v !== null)
        .map(([k, v]) => `${t(hass, `editor.cards.field.${k}` as StringKey)} ${String(v)}`)
        .join(" · "),
    };
  }
  return { title: conditionLine(hass, item, host), detail: L(`condition.${str(item.condition)}`) };
};

export class ItemList extends ItemListSelector {
  _type = ITEM_LIST;
  get _key(): string {
    return str(this._options.key);
  }
  get _of(): ListOf {
    return (str(this._options.of) || "option") as ListOf;
  }
  _lines(item: Raw) {
    return itemLines(this._hass, this._of, item, str(this._options.entity));
  }
  _addLabel() {
    return this._L(`editor.card.list.add_${this._of}`);
  }
  // a line's or a button's entity's icon, an option's or a button's own, else a dot in its colour
  _iconOf(item: Raw): HTMLElement {
    const slot = document.createElement("span");
    slot.className = "icon";
    const color = cssColor(str(item.color));
    if (color) slot.style.color = color;
    const icon = str(item.icon);
    const entity = str(item.entity);
    if (icon) {
      const el = document.createElement("ha-icon");
      el.setAttribute("icon", icon);
      slot.append(el);
    } else if (
      (entity || (this._of === "entity" && str(this._options.entity))) &&
      this._of !== "condition"
    ) {
      const el = document.createElement("ha-state-icon") as HTMLElement & {
        hass?: HomeAssistant;
        stateObj?: unknown;
      };
      el.hass = this._hass;
      el.stateObj = this._hass?.states[entity || str(this._options.entity)];
      slot.append(el);
    } else slot.innerHTML = `<span class="dot"></span>`;
    return slot;
  }
}
