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
import { DETECTED, configToForm, fitEntity, formToConfig, type CardThing } from "./editor-form.ts";
import { editorSchema, rangeInfo, type SchemaCtx } from "./editor-schema.ts";
import { KINDS } from "./registry.ts";
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

  get _thing(): CardThing {
    return (this.constructor as typeof KindCardEditor).thing;
  }

  _toForm(config: CardConfigBase): HaFormData {
    return configToForm(config, kindsOf(config as Raw, this._hass).kind, this._thing);
  }

  // another entity: a kind written that cannot read it goes back to the detected one (dropping what
  // only it read), and what belonged to the entity before goes where the new one cannot take it
  _fromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase {
    const entity = typeof data.entity === "string" && data.entity ? data.entity : null;
    const moved = entity !== ((prev as Raw).entity ?? null);
    let d = data;
    const written = typeof d.kind === "string" ? KINDS[d.kind] : undefined;
    if (moved && written && !canRead(written, entity)) d = { ...d, kind: DETECTED };
    const { kind } = kindsOf(d, this._hass);
    const c = formToConfig(d, prev, kind, this._thing, kindsOf(prev as Raw, this._hass).kind);
    if (!moved) return c;
    const st = entity ? this._hass?.states[entity] : undefined;
    return fitEntity(c, kind, this._thing, st ? Object.keys(st.attributes) : null);
  }

  _schema(hass: HomeAssistant, data: HaFormData): HaFormSchema[] {
    const { kind, detected } = kindsOf(data, hass);
    const entity = typeof data.entity === "string" ? data.entity : "";
    const st = hass.states[entity];
    this._ctx = {
      hass,
      thing: this._thing,
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
    return [detected.name, shownIsNum(c, kind, hass.states[entity]), this._found(kind, hass)];
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

  _label(sch: HaFormSchema): string {
    return t(this._hass, labelKey(sch.name));
  }

  _helper(sch: HaFormSchema): string | undefined {
    const name = sch.name;
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
      const { kind } = kindsOf((this._config ?? {}) as Raw, this._hass);
      const i = (kind.inputs ?? []).findIndex((d) => `input_${d.key}` === name);
      const found = i >= 0 ? this._found(kind, this._hass)[i] : null;
      return found
        ? t(this._hass, "editor.card.help.found", { entity: found })
        : t(this._hass, "editor.card.help.not_found");
    }
    const key = `editor.card.help.${name}`;
    return hasString(key) ? t(this._hass, key) : undefined;
  }
}
