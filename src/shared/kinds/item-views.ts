// The items a card's visual editor opens in views of their own (editor-views.ts), shared by every
// editor that edits them: a badge (its Shows, its entity waiting for one that fits), a rule (a card's
// with its status, a badge's with its text, a trend line's with its colour, an entity layer's with
// its label), a trend line, a visibility condition, a control's option and button. An editor gives
// its context (`ItemCtx`: what a badge without an entity reads, what its own rules read) and its own
// item types (a consumer, a breakpoint …); the item's type is its list field's name, read from the
// open path ("badges", "badges/rules", "series/visibility").
import type { ViewHooks } from "../editor-views.ts";
import type { HaFormSchema, HomeAssistant } from "../ha.ts";
import { t, type StringKey } from "../i18n.ts";
import { isNum } from "../util.ts";
import { detectKind } from "./detect.ts";
import {
  DETECTED,
  badgeFromForm,
  badgeToForm,
  conditionIsEmpty,
  seriesFromForm,
} from "./editor-form.ts";
import {
  badgeFieldLabel,
  badgeItemSchema,
  buttonItemSchema,
  conditionItemSchema,
  fitsKind,
  optionItemSchema,
  ruleFieldLabel,
  ruleItemSchema,
  seriesItemSchema,
} from "./editor-schema.ts";

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

// what a list of rules reads: an entity's states or a number in a unit; its flavour says what a
// rule sets (a card's status, a badge's text, a line's colour alone, an entity layer's label)
export interface RuleReads {
  entity: string;
  unit: string;
  numeric: boolean;
  flavor?: "card" | "badge" | "line" | "entity";
}

// an item type of a card's own
export interface ItemType {
  schema(hass: HomeAssistant, item: Raw, parents: Raw[]): HaFormSchema[];
  create(): Raw;
  isEmpty?(item: Raw): boolean;
  label(name: string): string;
  helper?(name: string): string | undefined;
  title(index: number, item: Raw): string;
  toForm?(item: Raw, hint: Raw): Raw;
  fromForm?(data: Raw, was: Raw, hint: Raw): Raw;
}

export interface ItemCtx {
  hass(): HomeAssistant | undefined;
  // the open path and items (the editor's view stack)
  path(): string;
  items(): Raw[] | undefined;
  // what a badge without an entity reads (the card's)
  cardEntity(): string;
  // what the card's own list of rules named `key` reads (none: no rules at the card's level)
  rules?(key: string): RuleReads;
  // a card's own item types, by their list field's name (`series` for a list of trend lines named
  // otherwise: { entities: "series" })
  types?: Record<string, ItemType | string>;
}

// nothing filled in (an empty `more` says nothing either)
export const saysNothing = (item: Raw) =>
  !Object.entries(item).some(
    ([k, v]) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      v !== false &&
      !(Array.isArray(v) && !v.length) &&
      !(k === "more" && typeof v === "object" && !Object.keys(v as object).length),
  );

export const itemHooks = (ctx: ItemCtx): ViewHooks => {
  const hass = () => ctx.hass();
  const L = (k: string, vars?: Record<string, string>) =>
    t(hass(), `editor.card.${k}` as StringKey, vars);
  const nameOf = (id: string) => (id && hass()?.states[id]?.attributes.friendly_name) || id;
  const segments = (path: string) => path.split("/");
  // the type of the item at `path`: a card's own, else a built-in one by its list's name
  const typeOf = (path: string): string | ItemType => {
    const key = segments(path).at(-1) ?? "";
    const own = ctx.types?.[key];
    if (own) return own;
    if (key.endsWith("rules")) return "rules";
    return key;
  };
  const parentsOf = (path: string): Raw[] =>
    (ctx.items() ?? []).slice(0, segments(path).length - 1);

  // ----- a badge -----
  const badgeShows = (item: Raw): string => {
    if (typeof item.kind === "string" && item.kind && item.kind !== DETECTED) return item.kind;
    const reads = str(item.entity) || ctx.cardEntity();
    return reads ? detectKind(reads, hass()?.states[reads]).name : "none";
  };
  // (`chosen`: a kind chosen for the badge, written or waiting, which its entity picker follows; a
  // kind that only follows the entity it reads leaves every entity to pick)
  const badgeToView = (item: Raw, hint: Raw): Raw => {
    if (typeof hint.wait === "string")
      return { ...item, shows: hint.wait, entity: "", chosen: true };
    const own = !!item.value && !item.entity && !item.attribute;
    const custom = hint.source ? hint.source === "custom" : own;
    const chosen = typeof item.kind === "string" && !!item.kind && item.kind !== DETECTED;
    return { ...item, shows: custom ? "custom" : badgeShows(item), chosen };
  };
  // another choice in Shows: Custom drops what an entity's badge says; a kind takes the entity the
  // badge reads (its own, else the card's) where it fits, written only where that one is not
  // detected as it anyway; else it waits for one that fits (`hint.wait`), the badge as it was.
  // Another entity drops a kind it is detected as anyway.
  const badgeFromView = (data: Raw, was: Raw, hint: Raw): Raw => {
    const { shows, chosen: _chosen, ...item } = data;
    void _chosen;
    const detectedAs = (e: string) => (e ? detectKind(e, hass()?.states[e]).name : "none");
    const take = (kind: string) => {
      hint.source = "entity";
      delete item.value;
      const reads = str(item.entity) || ctx.cardEntity();
      item.kind = kind === detectedAs(reads) ? DETECTED : kind;
      // (an attribute the new entity lacks goes)
      const attr = str(item.attribute);
      const st = reads ? hass()?.states[reads] : undefined;
      if (attr && !(st && attr in st.attributes)) delete item.attribute;
      return item;
    };
    const waiting = typeof hint.wait === "string" ? hint.wait : undefined;
    if (typeof shows === "string" && shows !== was.shows) {
      hint.wait = undefined;
      if (shows === "custom") {
        hint.source = "custom";
        for (const k of ["entity", "attribute", "control"]) delete item[k];
        item.kind = DETECTED;
        return item;
      }
      const own = waiting ? str(hint.held) : str(item.entity);
      const reads = own || ctx.cardEntity();
      if (reads ? fitsKind(hass(), shows, reads) : shows === "none") {
        item.entity = own;
        return take(shows);
      }
      // waits: the badge as it was (its entity shown empty)
      if (!waiting) hint.held = own;
      hint.wait = shows;
      const { shows: _s, chosen: _c, ...before } = was;
      void _s;
      void _c;
      return waiting ? { ...before, entity: str(hint.held) } : before;
    }
    if (waiting) {
      const own = str(item.entity);
      if (own && fitsKind(hass(), waiting, own)) {
        hint.wait = undefined;
        return take(waiting);
      }
      // anything else changed while it waits: on the badge as it was
      item.entity = str(hint.held);
      return item;
    }
    if (
      item.entity !== was.entity &&
      item.kind === detectedAs(str(item.entity) || ctx.cardEntity())
    )
      item.kind = DETECTED;
    return item;
  };

  // ----- what a list of rules, or a condition, reads: from the item it belongs to -----
  const readsOf = (entity: string, attr = ""): RuleReads => {
    const st = entity ? hass()?.states[entity] : undefined;
    const shown = attr ? st?.attributes[attr] : st?.state;
    const unit = !attr ? st?.attributes.unit_of_measurement : undefined;
    return { entity, unit: typeof unit === "string" ? unit : "", numeric: isNum(shown) };
  };
  const rulesReads = (path: string): RuleReads => {
    const parents = parentsOf(path);
    const parent = parents.at(-1);
    const key = segments(path).at(-1) ?? "rules";
    if (!parent) return ctx.rules?.(key) ?? { ...readsOf(ctx.cardEntity()), flavor: "card" };
    const of = segments(path).at(-2) ?? "";
    const parentType = ctx.types?.[of] ?? of;
    // a badge's: its entity (else the card's) and attribute; a line's: its entity
    if (of === "badges")
      return {
        ...readsOf(str(parent.entity) || ctx.cardEntity(), str(parent.attribute)),
        flavor: "badge",
      };
    if (parentType === "series") return { ...readsOf(str(parent.entity)), flavor: "line" };
    // another item's (a weather section's): what the card says its rules of that name read
    return ctx.rules?.(key) ?? { ...readsOf(str(parent.entity)), flavor: "entity" };
  };
  const hostOf = (path: string) => str(parentsOf(path).at(-1)?.entity) || ctx.cardEntity();

  const builtin = (path: string) => {
    const type = typeOf(path);
    return typeof type === "string" ? type : null;
  };
  const own = (path: string): ItemType | null => {
    const type = typeOf(path);
    return typeof type === "string" ? null : type;
  };

  return {
    schema: (h, path, item) => {
      const o = own(path);
      if (o) return o.schema(h, item, parentsOf(path));
      switch (builtin(path)) {
        case "badges":
          return badgeItemSchema(h, item, ctx.cardEntity());
        case "rules": {
          const r = rulesReads(path);
          return ruleItemSchema(h, item, {
            ...r,
            badge: r.flavor === "badge",
            line: r.flavor === "line",
            entityRule: r.flavor === "entity",
          });
        }
        case "series":
          return seriesItemSchema(h, item);
        case "visibility":
          return conditionItemSchema(h, item, hostOf(path));
        case "control_options":
          return optionItemSchema(h);
        case "control_buttons":
          return buttonItemSchema(h);
      }
      return [];
    },
    label: (sch) => {
      const path = ctx.path();
      const o = own(path);
      if (sch.name === "more") return L("more");
      if (o) return o.label(sch.name);
      const type = builtin(path);
      if (type === "rules") return ruleFieldLabel(hass(), sch.name);
      if (type === "badges") return badgeFieldLabel(hass(), sch.name);
      const of =
        type === "visibility"
          ? "cond"
          : type === "series"
            ? "series"
            : type === "control_options"
              ? "option"
              : "button";
      return L(`${of}.${sch.name}`);
    },
    // what a field does where it is left empty: the card's entity, the pill's defaults
    helper: (sch) => {
      const path = ctx.path();
      const o = own(path);
      if (o) return o.helper?.(sch.name);
      const type = builtin(path);
      // a condition without an entity reads the item's
      if (type === "visibility" && sch.name === "entity") return L("cond_help.entity");
      if (type !== "badges") return undefined;
      if (sch.name === "entity")
        return str(ctx.items()?.at(-1)?.entity) ? undefined : L("badge_help.entity");
      if (sch.name === "value") return L("badge_help.value");
      if (sch.name === "prefix" || sch.name === "suffix") return L(`help.${sch.name}`);
      if (sch.name === "style")
        return t(hass(), "editor.default", { value: L("badge_style.outline") });
      if (sch.name === "size") return t(hass(), "editor.default", { value: L("badge_size.m") });
      return undefined;
    },
    title: (path, index, item) => {
      const o = own(path);
      if (o) return o.title(index, item);
      const n = { n: String(index + 1) };
      const named = (key: string) => {
        const id = str(item.entity);
        const name = nameOf(id);
        return `${L(key, n)}${name ? ` · ${name}` : ""}`;
      };
      switch (builtin(path)) {
        case "rules":
          return L("rule_title", n);
        case "visibility":
          return L("condition_title", n);
        case "control_options":
          return L("option_title", n);
        case "control_buttons":
          return L("button_title", n);
        case "series":
          return named("line_title");
      }
      return named("badge_title");
    },
    toForm: (path, item, hint) => {
      const o = own(path);
      if (o) return o.toForm ? o.toForm(item, hint) : item;
      return builtin(path) === "badges" ? badgeToView(item, hint) : item;
    },
    fromForm: (path, data, was, hint) => {
      const o = own(path);
      if (o) return o.fromForm ? o.fromForm(data, was, hint) : data;
      return builtin(path) === "badges" ? badgeFromView(data, was, hint) : data;
    },
    // a new item: an empty one, added by its first change that says something
    create: (path) => {
      const o = own(path);
      if (o) return o.create();
      switch (builtin(path)) {
        case "badges":
          return badgeToForm({});
        case "series":
          return { rules: [], visibility: [] };
        case "visibility":
          return { condition: "state" };
        case "rules":
        case "control_options":
        case "control_buttons":
          return {};
      }
      return undefined;
    },
    // a badge that says nothing: nothing at all, or one of your own without its text yet; a rule,
    // an option or a button without anything; a condition of its type alone; a line without its
    // entity or anything else
    isEmpty: (path, item, hint) => {
      const o = own(path);
      if (o) return o.isEmpty ? o.isEmpty(item) : saysNothing(item);
      switch (builtin(path)) {
        case "visibility":
          return conditionIsEmpty(item);
        case "series": {
          const line = seriesFromForm([item])[0];
          return (
            line === undefined || (typeof line === "object" && !Object.keys(line as Raw).length)
          );
        }
        case "rules":
        case "control_options":
        case "control_buttons":
          return saysNothing(item);
        case "badges": {
          if (hint.source === "custom" && !item.value) return true;
          const b = badgeFromForm(item);
          return typeof b === "object" && b !== null && !Object.keys(b).length;
        }
      }
      return false;
    },
  };
};
