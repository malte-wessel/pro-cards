// The visual editor of the cards that draw a kind (the poster and the tile, ha-form): the form is
// built for the card's kind (editor-schema.ts) and written back as the shortest YAML that draws
// the same (editor-form.ts). What the form does not show stays as written.
import { FormEditorBase } from "../editor.ts";
import type { RawEntity } from "../entity/config.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HassEntity, HomeAssistant } from "../ha.ts";
import { hasString, t, type StringKey } from "../i18n.ts";
import { isNum } from "../util.ts";
import { foundInputs } from "./config.ts";
import { canRead, detectKind, parseKind, resolveKind } from "./detect.ts";
import {
  DEFAULT,
  DETECTED,
  badgeFromForm,
  badgeToForm,
  configToForm,
  defaultVisual,
  fitEntity,
  formToConfig,
  type CardThing,
} from "./editor-form.ts";
import {
  badgeFieldLabel,
  placeholders,
  ruleFieldLabel,
  ruleItemSchema,
  badgeItemSchema,
  editorSchema,
  fitsKind,
  rangeInfo,
  type SchemaCtx,
} from "./editor-schema.ts";
import { BADGE_LIST, BadgeListSelector } from "./badge-list.ts";
import { RULE_LIST, RuleListSelector } from "./rule-list.ts";
import { defineSelector } from "../editor-list.ts";

// the badges' list field: ha-selector draws `ha-selector-<type>` for a selector of that type
defineSelector(BADGE_LIST, BadgeListSelector);
defineSelector(RULE_LIST, RuleListSelector);
import { KINDS } from "./registry.ts";
import { ruleHints } from "./rule-hints.ts";
import { writtenRules } from "./rules.ts";
import type { Kind } from "./types.ts";

type Raw = Record<string, unknown>;

// the kind the card draws for the form's entity and kind: the written one where it reads the
// entity, else the detected one (the form stays usable while a choice is half made)
// whether the value the card shows is a number (its unit and decimals apply): the attribute
// written, else the kind's (a thermostat's current temperature), else the state
const shownIsNum = (
  data: { entity?: unknown; attribute?: unknown },
  kind: Kind,
  st: HassEntity | undefined,
) => {
  const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
  const attr =
    typeof data.attribute === "string" && data.attribute
      ? data.attribute
      : kind.main?.(entity, { entity } as RawEntity, {}).attribute;
  return isNum(typeof attr === "string" ? st?.attributes[attr] : st?.state);
};

// what a card shows: its kind as written, else its entity's detected kind, else Custom (no entity:
// texts and templates of your own)
export const showsOf = (c: Raw, hass: HomeAssistant | undefined): string => {
  if (typeof c.kind === "string" && c.kind && c.kind !== DETECTED) return c.kind;
  const entity = typeof c.entity === "string" && c.entity ? c.entity : null;
  return entity ? detectKind(entity, hass?.states[entity]).name : "custom";
};

export const kindsOf = (
  data: { entity?: unknown; kind?: unknown },
  hass: HomeAssistant | undefined,
): { kind: Kind; detected: Kind } => {
  const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
  const st = entity ? hass?.states[entity] : undefined;
  const detected = detectKind(entity, st);
  const name = typeof data.kind === "string" && data.kind !== DETECTED ? data.kind : null;
  try {
    return { kind: resolveKind(parseKind(name, "editor"), entity, st, "editor"), detected };
  } catch {
    return { kind: name && KINDS[name] ? KINDS[name] : detected, detected };
  }
};

// the label key of a form field (the inputs share one group)
const labelKey = (name: string): StringKey =>
  (name.startsWith("input_")
    ? `editor.card.input.${name.slice(6)}`
    : `editor.card.field.${name}`) as StringKey;

export abstract class KindCardEditor extends FormEditorBase {
  static thing: CardThing = "poster";
  // what the schema was last built from (the helpers read it)
  _ctx?: SchemaCtx;

  // a tile in a tile group's table is edited as a row
  get _thing(): CardThing {
    const thing = (this.constructor as typeof KindCardEditor).thing;
    return thing === "tile" && this._group() === "table" ? "row" : thing;
  }
  // the layout of the tile group whose tile this edits (null: a card of its own): the group's
  // editor, an element above this one across the editors' shadow roots, says it
  _group(): string | null {
    let n: Node | null = this.parentNode;
    while (n) {
      if ("tileGroupLayout" in n)
        return String((n as { tileGroupLayout: unknown }).tileGroupLayout);
      n = n.parentNode ?? (n instanceof ShadowRoot ? n.host : null);
    }
    return null;
  }
  // put in its place only now: the form again where that is in a group
  connectedCallback() {
    this._render();
  }

  _toForm(config: CardConfigBase): HaFormData {
    const { kind } = kindsOf(config as Raw, this._hass);
    const d = configToForm(config, kind, this._thing, this._kindRules(kind, config as Raw));
    const waiting = this._waiting();
    // (a kind waiting for an entity: its picker empty until one is picked)
    return waiting
      ? { ...d, shows: waiting, entity: "" }
      : { ...d, shows: showsOf(config as Raw, this._hass) };
  }
  // a kind chosen in Shows that the card's entity does not fit waits here for one that does: the
  // config stays as it was (a kind without its entity is no card) until one is picked; the config
  // changed elsewhere (its YAML) drops it
  _wait?: { shows: string; config: string };
  _waiting(): string | undefined {
    const w = this._wait;
    return w && w.config === JSON.stringify(this._config ?? {}) ? w.shows : undefined;
  }
  // the kind's rules as this card would write them: in the user's language, their thresholds in
  // the unit of the value the rules read
  _kindRules(kind: Kind, c: { entity?: unknown; attribute?: unknown }) {
    const entity = typeof c.entity === "string" ? c.entity : "";
    const st = this._hass?.states[entity];
    const written = typeof c.attribute === "string" && c.attribute ? c.attribute : "";
    const attr =
      written || kind.main?.(entity || null, { entity } as RawEntity, {}).attribute || "";
    // a weather entity's attribute has its unit beside it (wind_speed_unit)
    const unit = attr ? st?.attributes[`${attr}_unit`] : st?.attributes.unit_of_measurement;
    return writtenRules(kind, (key) => t(this._hass, key), typeof unit === "string" ? unit : null);
  }

  // what the card shows, chosen first: a kind, then the entity it reads (a kind written only where
  // the entity would not be detected as it); or Custom, no entity: texts and templates of your own.
  // A kind the entity does not fit waits for one that does (`_wait`), the config as it was.
  _fromForm(form: HaFormData, prev: CardConfigBase): CardConfigBase {
    const { shows, ...data } = form;
    const p = prev as Raw;
    const waiting = this._waiting();
    const was = waiting ?? showsOf(p, this._hass);
    let chose = typeof shows === "string" && shows !== was;
    let kind: string | undefined = chose ? (shows as string) : undefined;
    if (chose) this._wait = undefined;
    if (!chose && waiting) {
      // waiting: an entity picked that fits takes the kind; else the entity stays as it was
      const e = typeof data.entity === "string" ? data.entity : "";
      if (e && fitsKind(this._hass, waiting, e)) {
        this._wait = undefined;
        chose = true;
        kind = waiting;
      } else data.entity = p.entity ?? "";
    }
    // (your own: no entity, nor an attribute of one)
    if (chose && kind === "custom")
      Object.assign(data, { entity: "", attribute: "", kind: DETECTED });
    else if (chose && kind && KINDS[kind]) {
      // the entity picked, else the one the card had, where it fits the kind
      const e =
        (typeof data.entity === "string" && data.entity) ||
        (typeof p.entity === "string" ? p.entity : "");
      if (e && fitsKind(this._hass, kind, e)) Object.assign(data, { entity: e, kind });
      // a kind that needs no entity is a card without one
      else if (KINDS[kind].entityless) Object.assign(data, { entity: "", kind });
      else {
        this._wait = { shows: kind, config: JSON.stringify(prev) };
        return prev;
      }
    }
    const out = this._fromData(data, prev);
    // a kind written that its entity is detected as anyway says nothing
    const o = out as Raw;
    const moved = (o.entity ?? null) !== (p.entity ?? null);
    if ((chose || moved) && typeof o.kind === "string" && typeof o.entity === "string") {
      const st = this._hass?.states[o.entity];
      if (detectKind(o.entity, st).name === o.kind) delete o.kind;
    }
    // (still waiting: for the config as it is now)
    if (this._wait && !chose) this._wait = { ...this._wait, config: JSON.stringify(out) };
    return out;
  }
  // another entity: a kind written that cannot read it goes back to the detected one (dropping what
  // only it read), and what belonged to the entity before goes where the new one cannot take it
  _fromData(data: HaFormData, prev: CardConfigBase): CardConfigBase {
    const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
    const moved = entity !== ((prev as Raw).entity ?? null);
    let d = data;
    const written = typeof d.kind === "string" ? KINDS[d.kind] : undefined;
    // another entity the written kind cannot read drops it (an entity cleared keeps it: the kind
    // chosen in Shows waits for one)
    if (moved && entity && written && !canRead(written, entity)) d = { ...d, kind: DETECTED };
    const { kind } = kindsOf(d, this._hass);
    const was = kindsOf(prev as Raw, this._hass).kind;
    const c = formToConfig(d, prev, kind, this._thing, was, {
      before: this._kindRules(was, prev as Raw),
      now: this._kindRules(kind, d),
    });
    if (!moved) return c;
    const st = entity ? this._hass?.states[entity] : undefined;
    return fitEntity(c, kind, this._thing, st ? Object.keys(st.attributes) : null, was);
  }

  _schema(hass: HomeAssistant, data: HaFormData): HaFormSchema[] {
    const { kind, detected } = kindsOf(data, hass);
    const entity = typeof data.entity === "string" ? data.entity : "";
    const st = hass.states[entity];
    this._ctx = {
      hass,
      thing: this._thing,
      grouped: this._group() !== null,
      kind,
      detected,
      data,
      numeric: shownIsNum(data, kind, st),
      st,
    };
    return editorSchema(this._ctx);
  }

  // what hass decides in the form: the detected kind, whether the state is a number, the inputs
  // found on the entity's device
  _schemaInputs(hass: HomeAssistant): unknown {
    const c = (this._config ?? {}) as Raw;
    const entity = typeof c.entity === "string" ? c.entity : "";
    const { kind, detected } = kindsOf(c, hass);
    return [
      detected.name,
      this._waiting() ?? null,
      shownIsNum(c, kind, hass.states[entity]),
      this._found(kind, hass),
      this._group(),
    ];
  }

  // the inputs the kind would find on the device, whatever the card sets (looked for again only
  // for another kind, config or registry: a new state anywhere in the home changes none of them)
  _foundFor?: { kind: Kind; config: unknown; entities: unknown; ids: (string | null)[] };
  _found(kind: Kind, hass: HomeAssistant | undefined) {
    const f = this._foundFor;
    if (f && f.kind === kind && f.config === this._config && f.entities === hass?.entities)
      return f.ids;
    const ids = foundInputs(kind, { ...(this._config ?? {}), inputs: {} }, hass);
    this._foundFor = { kind, config: this._config, entities: hass?.entities, ids };
    return ids;
  }

  // a picture's source behind the card is named as the icon's picture is (a URL, a template or an
  // entity), not as a plot's (another entity's history)
  _nameOf(sch: HaFormSchema): string {
    const x = this._ctx;
    if (sch.name !== "visual_src" || !x) return sch.name;
    const v = x.data.visual_thing;
    const thing = v === undefined || v === DEFAULT ? defaultVisual(x.kind, x.thing) : v;
    return thing === "image" ? "icon_src" : sch.name;
  }

  _label(sch: HaFormSchema): string {
    return t(this._hass, labelKey(this._nameOf(sch)));
  }

  // an item in the sub-view, by its path: a badge ("badges"), a card's rule ("rules") or a
  // badge's rule ("badges/rules"); its own form, titled by its number (and a badge's entity)
  _subSchema(hass: HomeAssistant, path: string, item: Raw): HaFormSchema[] {
    const entity = this._cardEntity();
    if (path === "badges") return badgeItemSchema(hass, item, entity);
    if (path === "rules") {
      // what the card's rules read: its value, a number in its unit or a state of its entity
      const x = this._ctx;
      return ruleItemSchema(hass, item, {
        entity,
        unit: x ? (placeholders(x).unit ?? "") : "",
        numeric: !!x?.numeric,
      });
    }
    if (path === "badges/rules")
      return ruleItemSchema(hass, item, { ...this._badgeReads(), badge: true });
    return [];
  }
  _cardEntity(): string {
    const card = (this._config as Raw | undefined)?.entity;
    return typeof card === "string" ? card : "";
  }
  // what the open badge's rules read: its entity (else the card's) and its attribute, a number
  // in the entity's unit or a state
  _badgeReads(): { entity: string; unit: string; numeric: boolean } {
    const b = this._subItems()?.[0] ?? {};
    const entity = (typeof b.entity === "string" && b.entity) || this._cardEntity();
    const st = entity ? this._hass?.states[entity] : undefined;
    const attr = typeof b.attribute === "string" ? b.attribute : "";
    const shown = attr ? st?.attributes[attr] : st?.state;
    const unit = !attr ? st?.attributes.unit_of_measurement : undefined;
    return { entity, unit: typeof unit === "string" ? unit : "", numeric: isNum(shown) };
  }
  // a new badge or rule: an empty one, added by its first change that says something
  _subNew(path: string): Raw | undefined {
    return path === "badges" ? badgeToForm({}) : path.endsWith("rules") ? {} : undefined;
  }
  // a badge that says nothing: nothing at all, or one of your own without its text yet; a rule
  // without anything
  _subIsEmpty(path: string, item: Raw, hint: Raw): boolean {
    if (path.endsWith("rules"))
      return !Object.entries(item).some(
        ([k, v]) =>
          v !== undefined &&
          v !== null &&
          v !== "" &&
          v !== false &&
          !(k === "more" && typeof v === "object" && !Object.keys(v as object).length),
      );
    if (path !== "badges") return false;
    if (hint.source === "custom" && !item.value) return true;
    const b = badgeFromForm(item);
    return typeof b === "object" && b !== null && !Object.keys(b).length;
  }
  // what a badge shows in its form, as the card's: one of your own where it says a text and reads
  // no entity (or Custom was last chosen while the form is open), else its written kind, else the
  // kind of the entity it reads (its own, else the card's), else the entity as it is
  _badgeShows(item: Raw): string {
    if (typeof item.kind === "string" && item.kind && item.kind !== DETECTED) return item.kind;
    const reads = (typeof item.entity === "string" && item.entity) || this._cardEntity();
    return reads ? detectKind(reads, this._hass?.states[reads]).name : "none";
  }
  // (`chosen`: a kind chosen for the badge, written or waiting, which its entity picker follows; a
  // kind that only follows the entity it reads leaves every entity to pick)
  _subToForm(path: string, item: Raw, hint: Raw): Raw {
    if (path !== "badges") return item;
    if (typeof hint.wait === "string")
      return { ...item, shows: hint.wait, entity: "", chosen: true };
    const own = !!item.value && !item.entity && !item.attribute;
    const custom = hint.source ? hint.source === "custom" : own;
    const chosen = typeof item.kind === "string" && !!item.kind && item.kind !== DETECTED;
    return { ...item, shows: custom ? "custom" : this._badgeShows(item), chosen };
  }
  // another choice in Shows: Custom drops what an entity's badge says; a kind takes the entity the
  // badge reads (its own, else the card's) where it fits, written only where that one is not
  // detected as it anyway; else it waits for one that fits (`hint.wait`), the badge as it was.
  // Another entity drops a kind it is detected as anyway.
  _subFromForm(path: string, data: Raw, was: Raw, hint: Raw): Raw {
    if (path !== "badges") return data;
    const { shows, chosen: _chosen, ...item } = data;
    void _chosen;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const detectedAs = (e: string) => (e ? detectKind(e, this._hass?.states[e]).name : "none");
    // a kind taken with the entity the badge reads now: Shows' value, or none written
    const take = (kind: string) => {
      hint.source = "entity";
      delete item.value;
      const reads = str(item.entity) || this._cardEntity();
      item.kind = kind === detectedAs(reads) ? DETECTED : kind;
      // (an attribute the new entity lacks goes)
      const attr = str(item.attribute);
      const st = reads ? this._hass?.states[reads] : undefined;
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
      const reads = own || this._cardEntity();
      if (reads ? fitsKind(this._hass, shows, reads) : shows === "none") {
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
      if (own && fitsKind(this._hass, waiting, own)) {
        hint.wait = undefined;
        return take(waiting);
      }
      // anything else changed while it waits: on the badge as it was
      item.entity = str(hint.held);
      return item;
    }
    if (
      item.entity !== was.entity &&
      item.kind === detectedAs(str(item.entity) || this._cardEntity())
    )
      item.kind = DETECTED;
    return item;
  }
  // what a badge field does where it is left empty: the card's entity, the pill's defaults
  _subHelper(sch: HaFormSchema): string | undefined {
    const L = (k: string, vars?: Record<string, string>) =>
      t(this._hass, `editor.card.${k}` as StringKey, vars);
    if (this._subPath() !== "badges") return undefined;
    if (sch.name === "entity") return L("badge_help.entity");
    if (sch.name === "value") return L("badge_help.value");
    if (sch.name === "prefix" || sch.name === "suffix") return L(`help.${sch.name}`);
    if (sch.name === "style")
      return t(this._hass, "editor.default", { value: L("badge_style.outline") });
    if (sch.name === "size") return t(this._hass, "editor.default", { value: L("badge_size.m") });
    return undefined;
  }
  _subLabel(sch: HaFormSchema): string {
    return this._subPath().endsWith("rules")
      ? ruleFieldLabel(this._hass, sch.name)
      : badgeFieldLabel(this._hass, sch.name);
  }
  _subTitle(path: string, index: number, item: Raw): string {
    if (path.endsWith("rules"))
      return t(this._hass, "editor.card.rule_title", { n: String(index + 1) });
    const id = typeof item.entity === "string" ? item.entity : "";
    const name = (id && this._hass?.states[id]?.attributes.friendly_name) || id;
    return `${t(this._hass, "editor.card.badge_title", { n: String(index + 1) })}${name ? ` · ${name}` : ""}`;
  }

  _helper(sch: HaFormSchema): string | undefined {
    const name = this._nameOf(sch);
    // what applies where the range is left empty; a range that fills nothing
    if ((name === "min" || name === "max") && this._ctx) {
      const r = rangeInfo(this._ctx);
      if (name === "max" && r.inverted) return t(this._hass, "editor.card.range.inverted");
      return t(this._hass, "editor.card.range.empty", { value: r[name] });
    }
    if (name.startsWith("input_")) {
      // what the kind finds on the device, where the card names none
      const written = (this._config as Raw | undefined)?.inputs as Raw | undefined;
      if (typeof written?.[name.slice(6)] === "string") return undefined;
      // (no entity yet: no device to look on)
      if (!(this._config as Raw | undefined)?.entity) return undefined;
      const { kind } = kindsOf((this._config ?? {}) as Raw, this._hass);
      const i = (kind.inputs ?? []).findIndex((d) => `input_${d.key}` === name);
      const found = i >= 0 ? this._found(kind, this._hass)[i] : null;
      return found
        ? t(this._hass, "editor.card.help.found", { entity: found })
        : t(this._hass, "editor.card.help.not_found");
    }
    // the card's own rules: what never or always matches, in front of the list's help
    if (name === "rules") {
      const hints = ruleHints((this._config as Raw | undefined)?.rules).map((h) =>
        t(this._hass, `editor.card.rules_hint.${h.kind}`, {
          n: String(h.rule + 1),
          ...(h.kind === "covered" ? { m: String(h.by + 1) } : {}),
        }),
      );
      if (hints.length)
        return [...hints.map((h) => `⚠ ${h}`), t(this._hass, "editor.card.help.rules")].join(". ");
    }
    const key = `editor.card.help.${name}`;
    return hasString(key) ? t(this._hass, key) : undefined;
  }
}
