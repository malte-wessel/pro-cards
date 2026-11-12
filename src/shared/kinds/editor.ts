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
  configToForm,
  defaultVisual,
  fitEntity,
  formToConfig,
  type CardThing,
} from "./editor-form.ts";
import {
  placeholders,
  editorSchema,
  fitsKind,
  kindLabel,
  rangeInfo,
  type SchemaCtx,
} from "./editor-schema.ts";
import "./selectors.ts";
import type { RuleReads } from "./item-views.ts";
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
  // changed elsewhere (its YAML) drops it. An entity cleared waits the same way for the next one
  // (`cleared`: any entity the picker offers ends it)
  _wait?: { shows: string; config: string; cleared?: boolean };
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
    const picked = typeof data.entity === "string" ? data.entity : "";
    const cleared = !picked && typeof p.entity === "string" && !!p.entity;
    if (!chose && !waiting && cleared && !KINDS[was]?.entityless) {
      // the entity cleared, to pick another: the card waits as it was (its kind, its control)
      // for one, rather than becoming one of your own texts without them (a kind that reads no
      // entity is a card without one)
      this._wait = { shows: was, config: JSON.stringify(prev), cleared: true };
      data.entity = p.entity;
    } else if (!chose && waiting && picked && this._wait?.cleared) {
      // an entity picked after one was cleared: as if picked over the card as it was
      this._wait = undefined;
    } else if (!chose && waiting) {
      // waiting: an entity picked that fits takes the kind; else the entity stays as it was
      if (picked && fitsKind(this._hass, waiting, picked)) {
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
    // (a kind waiting for its entity: its form, not the one the config still has)
    const waiting = this._waiting();
    const found = kindsOf(data, hass);
    const kind = waiting && KINDS[waiting] ? KINDS[waiting] : found.kind;
    const detected = found.detected;
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

  // the card's rules read its value: a number in its unit, or a state of its entity
  _ruleReads(_key: string): RuleReads {
    const x = this._ctx;
    return {
      entity: this._cardEntity(),
      unit: x ? (placeholders(x).unit ?? "") : "",
      numeric: !!x?.numeric,
      flavor: "card",
    };
  }

  _helper(sch: HaFormSchema): string | undefined {
    const name = this._nameOf(sch);
    // a kind chosen that waits for its entity: the card (and its preview) as it was until then
    const waiting = this._waiting();
    if (name === "entity" && waiting)
      return t(this._hass, "editor.card.help.waiting", { kind: kindLabel(this._hass, waiting) });
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
