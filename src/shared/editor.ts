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

  abstract _toForm(config: CardConfigBase): HaFormData;
  abstract _fromForm(data: HaFormData, prev: CardConfigBase): CardConfigBase;
  abstract _schema(hass: HomeAssistant, data: HaFormData): HaFormSchema[];

  setConfig(config: CardConfigBase) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    this._render();
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
    const data = this._toForm(this._config);
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema(this._hass, data);
  }
}
