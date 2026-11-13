// The rules of a card's visual editor as a list (editor-list.ts), drawn in its Rules section
// (`selector: { pro_cards_rules: { entity, unit } }`: the entity whose states and the unit whose
// numbers the rules read). A box a rule: its icon (its own, else a dot in its colour), its title
// (when it matches: above, below, a state, or always) and a line of what it changes; its form
// opens in the editor's sub-view.
import { cssColor } from "../color.ts";
import { ItemListSelector } from "../editor-list.ts";
import type { HomeAssistant } from "../ha.ts";
import { t, type StringKey } from "../i18n.ts";

type Raw = Record<string, unknown>;
export const RULE_LIST = "pro_cards_rules";

const filled = (v: unknown) => v !== undefined && v !== null && v !== "";

// a rule's box: when it matches, and what it changes
export const ruleLines = (
  hass: HomeAssistant | undefined,
  r: Raw,
  entity: string,
  unit: string,
): { title: string; detail: string } => {
  const L = (k: string) => t(hass, `editor.card.${k}` as StringKey);
  const st = entity ? hass?.states[entity] : undefined;
  // (a rule that reads an attribute of its own: that attribute's words)
  const attr = filled(r.attribute) ? String(r.attribute) : "";
  // (the value's unit; an attribute's numbers are written without it)
  const num = (v: unknown) => `${v}${unit && !attr ? ` ${unit}` : ""}`;
  const when: string[] = [];
  if (filled(r.state)) {
    const s = String(r.state);
    when.push(
      st && attr && hass?.formatEntityAttributeValue
        ? hass.formatEntityAttributeValue(st, attr, s)
        : st && !attr && hass?.formatEntityState
          ? hass.formatEntityState(st, s)
          : s,
    );
  }
  if (filled(r.above)) when.push(`${L("rule.above")} ${num(r.above)}`);
  if (filled(r.below)) when.push(`${L("rule.below")} ${num(r.below)}`);
  const then: string[] = [];
  if (filled(r.status)) then.push(`“${r.status}”`);
  // (an entity layer's status)
  if (filled(r.label)) then.push(`“${r.label}”`);
  // (a badge's rule: a text in place of the badge's value)
  if (filled(r.value)) then.push(`“${r.value}”`);
  if (filled(r.color)) then.push(String(r.color));
  if (filled(r.style)) then.push(L(`badge_style.${r.style}`));
  if (r.tint_card === true) then.push(L("rule.tint_card"));
  if (r.pulse === true) then.push(L("rule.pulse"));
  // (a button's rule: the button filled or grey)
  if (r.active === true || r.active === "true") then.push(L("rule_active.true"));
  if (r.active === false || r.active === "false") then.push(L("rule_active.false"));
  const title = when.join(" · ");
  const attrName = attr
    ? (st && hass?.formatEntityAttributeName?.(st, attr)) ||
      attr.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    : "";
  return {
    title: title ? (attrName ? `${attrName}: ${title}` : title) : L("rule_always"),
    detail: then.join(" · "),
  };
};

export class RuleListSelector extends ItemListSelector {
  // its field's name (`rules`, a weather card's `temperature_rules`)
  get _key(): string {
    return typeof this._options.key === "string" ? this._options.key : "rules";
  }
  _type = RULE_LIST;
  _lines(r: Raw) {
    const o = this._options;
    return ruleLines(
      this._hass,
      r,
      typeof o.entity === "string" ? o.entity : "",
      typeof o.unit === "string" ? o.unit : "",
    );
  }
  _addLabel() {
    return this._L("editor.card.rules_add");
  }
  // its own icon, else a dot in its colour
  _iconOf(r: Raw): HTMLElement {
    const slot = document.createElement("span");
    slot.className = "icon";
    if (typeof r.icon === "string" && r.icon) {
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", r.icon);
      const c = typeof r.color === "string" ? cssColor(r.color) : undefined;
      if (c) slot.style.color = c;
      slot.append(icon);
      return slot;
    }
    const dot = document.createElement("span");
    dot.className = "dot";
    const c = typeof r.color === "string" ? cssColor(r.color) : undefined;
    if (c) dot.style.background = c;
    slot.append(dot);
    return slot;
  }
}
