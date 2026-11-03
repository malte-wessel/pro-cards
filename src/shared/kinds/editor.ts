// The visual editor of the cards that draw a kind (the poster and the tile, ha-form): the form is
// built for the card's kind (editor-schema.ts) and written back as the shortest YAML that draws
// the same (editor-form.ts). What the form does not show stays as written.
import { FormEditorBase } from "../editor.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../ha.ts";
import { hasString, t, type StringKey } from "../i18n.ts";
import { isNum } from "../util.ts";
import { foundInputs } from "./config.ts";
import { detectKind, parseKind, resolveKind } from "./detect.ts";
import { DETECTED, configToForm, formToConfig, type CardThing } from "./editor-form.ts";
import { editorSchema, rangeInfo, type SchemaCtx } from "./editor-schema.ts";
import { KINDS } from "./registry.ts";
import type { Kind } from "./types.ts";

type Raw = Record<string, unknown>;

// the kind the card draws for the form's entity and kind: the written one where it reads the
// entity, else the detected one (the form stays usable while a choice is half made)
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

  _fromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase {
    return formToConfig(data, prev, kindsOf(data, this._hass).kind, this._thing);
  }

  _schema(hass: HomeAssistant, data: HaFormData): HaFormSchema[] {
    const { kind, detected } = kindsOf(data, hass);
    const entity = typeof data.entity === "string" ? data.entity : "";
    const st = hass.states[entity];
    this._ctx = { hass, thing: this._thing, kind, detected, data, numeric: isNum(st?.state), st };
    return editorSchema(this._ctx);
  }

  // what hass decides in the form: the detected kind, whether the state is a number, the inputs
  // found on the entity's device
  _schemaInputs(hass: HomeAssistant): unknown {
    const c = (this._config ?? {}) as Raw;
    const entity = typeof c.entity === "string" ? c.entity : "";
    const { kind, detected } = kindsOf(c, hass);
    return [detected.name, isNum(hass.states[entity]?.state), this._found(kind, hass)];
  }

  // the inputs the kind would find on the device, whatever the card sets
  _found(kind: Kind, hass: HomeAssistant | undefined) {
    return foundInputs(kind, { ...(this._config ?? {}), inputs: {} }, hass);
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
