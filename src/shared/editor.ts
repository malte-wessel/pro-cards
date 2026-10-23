// Base of the visual editors: an ha-form whose data is a flat projection of the card config.
// Subclasses provide:
//   static labels        – { formKey: stringKey } for computeLabel (optional with _label)
//   _toForm(config)      – card config → flat ha-form data
//   _fromForm(data, prev)– flat ha-form data → card config (keeps unknown keys such as grid_options)
//   _schema(hass, data)  – the ha-form schema
//   _label(sch)          – label for a schema entry (default: static labels, then the name)
//   _helper(sch)         – helper text for a schema entry (default: none)
import type {
  CardConfigBase,
  HaFormData,
  HaFormElement,
  HaFormSchema,
  HomeAssistant,
} from "./ha.ts";
import { langOf } from "./format.ts";
import { t, type StringKey } from "./i18n.ts";

// set config[key] = val, or delete the key when the value is empty / the default
export const setOrDrop = (
  config: Record<string, unknown>,
  key: string,
  val: unknown,
  isEmpty: boolean,
) => {
  if (isEmpty) delete config[key];
  else config[key] = val;
};

export abstract class FormEditorBase extends HTMLElement {
  static labels?: Record<string, StringKey>;
  _config?: CardConfigBase;
  _hass?: HomeAssistant;
  _form?: HaFormElement;
  _formKey?: string;

  abstract _toForm(config: CardConfigBase): HaFormData;
  abstract _fromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase;
  abstract _schema(hass: HomeAssistant, data: HaFormData): HaFormSchema[];

  setConfig(config: CardConfigBase) {
    this._config = { ...config };
    this._render();
  }

  // Home Assistant sets hass on every state change: the form only needs the new one, its data
  // and schema follow the config (and the language of the labels)
  set hass(hass: HomeAssistant) {
    const lang = langOf(this._hass) !== langOf(hass);
    this._hass = hass;
    if (this._form && !lang) this._form.hass = hass;
    else this._render();
  }

  _label(sch: HaFormSchema): string {
    const key = (this.constructor as typeof FormEditorBase).labels?.[sch.name];
    return key ? t(this._hass, key) : sch.name;
  }

  _helper(_sch: HaFormSchema): string | undefined {
    return undefined;
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (sch) => this._label(sch);
      this._form.computeHelper = (sch) => this._helper(sch);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = this._fromForm(ev.detail.value, this._config ?? {});
        this._render();
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          }),
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    // the form's data and schema again only for another config or language: a value change
    // renders here and in the setConfig that follows it, a new schema re-renders every field
    const key = `${langOf(this._hass)}|${JSON.stringify(this._config)}`;
    if (key === this._formKey) return;
    this._formKey = key;
    const data = this._toForm(this._config);
    this._form.data = data;
    this._form.schema = this._schema(this._hass, data);
  }
}
