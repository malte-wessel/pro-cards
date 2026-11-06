// The list fields of the visual editors, defined once for every editor that draws one (ha-selector
// draws `ha-selector-<type>` by its name): the badges, the rules, and the other lists (a trend's
// lines, a control's options and buttons, conditions, a card's own items).
import { defineSelector } from "../editor-list.ts";
import { BADGE_LIST, BadgeListSelector } from "./badge-list.ts";
import { ITEM_LIST, ItemList } from "./item-lists.ts";
import { RULE_LIST, RuleListSelector } from "./rule-list.ts";

defineSelector(BADGE_LIST, BadgeListSelector);
defineSelector(RULE_LIST, RuleListSelector);
defineSelector(ITEM_LIST, ItemList);
