// A stand-in for Home Assistant's `ha-form`, for the cards' editors on the docs site: the layouts
// and selectors the editors use (grid, expandable, constant; text, number, boolean, select, entity,
// icon, ui_color, attribute, ui_action, object with or without fields), in Home Assistant's look.
// It fires `value-changed` with the whole data, as Home Assistant's does. Its fields are updated in
// place while the schema stays the same, so typing keeps the focus.
import yaml from "js-yaml";

type Raw = Record<string, unknown>;
interface Schema {
  name: string;
  type?: string;
  selector?: Raw;
  schema?: Schema[];
  title?: string;
  iconPath?: string;
  // a section open from the start (Home Assistant's `expanded`)
  expanded?: boolean;
  value?: string;
  required?: boolean;
  // an optional field's placeholder, and the form's data a selector reads (as Home Assistant's)
  default?: unknown;
  context?: Record<string, string>;
}
interface HassLike {
  states: Record<string, { entity_id: string; state: string; attributes: Raw }>;
}
type Option = { value: string; label: string };

// Home Assistant's named colours (ui_color)
const COLORS = [
  "primary",
  "accent",
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "light-grey",
  "grey",
  "dark-grey",
  "blue-grey",
  "black",
  "white",
];
const ACTIONS = ["more-info", "toggle", "navigate", "url", "perform-action", "assist", "none"];
const ACTION_FIELD: Record<string, string> = {
  navigate: "navigation_path",
  url: "url_path",
  "perform-action": "perform_action",
};
const title = (s: string) => s.replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());
const optionsOf = (sel: Raw): Option[] =>
  ((sel.options as unknown[]) ?? []).map((o) =>
    typeof o === "string" ? { value: o, label: title(o) } : (o as Option),
  );
const asList = (v: unknown) => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

const STYLE = `
  :host { display: block; color: var(--primary-text-color); font-family: var(--ha-font-family-body, Roboto, sans-serif); }
  [hidden] { display: none !important; }
  .stack { display: flex; flex-direction: column; gap: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px 12px; align-items: start; }
  .field { position: relative; display: block; border-radius: 4px 4px 0 0;
    background: var(--input-fill-color, color-mix(in srgb, var(--primary-text-color) 5%, transparent));
    border-bottom: 1px solid var(--input-idle-line-color, color-mix(in srgb, var(--primary-text-color) 40%, transparent)); }
  .field:focus-within { border-bottom: 2px solid var(--primary-color); }
  .field > .label { position: absolute; left: 12px; top: 6px; font-size: 11px; color: var(--secondary-text-color); pointer-events: none; }
  .field:focus-within > .label { color: var(--primary-color); }
  .field input, .field select, .field textarea { box-sizing: border-box; width: 100%; border: 0; outline: 0; background: transparent;
    color: inherit; font: inherit; font-size: 14px; padding: 22px 12px 8px; min-height: 52px; }
  .field select { appearance: none; padding-right: 32px; cursor: pointer; }
  .checks { display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 8px 12px; }
  .checks label { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; }
  .field select option { color: var(--primary-text-color); background: var(--card-background-color); }
  .field.select::after { content: ""; position: absolute; right: 14px; top: 26px; border: 5px solid transparent;
    border-top-color: var(--secondary-text-color); pointer-events: none; }
  .field textarea { font-family: var(--ha-font-family-code, ui-monospace, monospace); font-size: 13px; min-height: 96px; resize: vertical; }
  .field.bad { border-bottom-color: var(--error-color, #db4437); }
  .row { display: flex; align-items: center; gap: 8px; }
  .row .grow { flex: 1; min-width: 0; }
  .swatch { width: 20px; height: 20px; border-radius: 50%; flex: none; margin-right: 36px; border: 1px solid var(--divider-color); }
  .icon-preview { flex: none; width: 24px; height: 24px; margin-right: 12px; color: var(--secondary-text-color); }
  .icon-preview.own { opacity: 0.5; }
  select.unset { color: var(--secondary-text-color); }
  .field.has-slider .slider { display: flex; align-items: center; gap: 12px; padding: 26px 12px 10px; }
  .field.has-slider input[type="range"] { flex: 1; min-width: 0; min-height: 0; height: 20px; padding: 0; margin: 0;
    accent-color: var(--primary-color); cursor: pointer; }
  .slider-value { flex: none; min-width: 36px; text-align: right; font-size: 14px; }
  .slider-value.unset { color: var(--secondary-text-color); }
  .helper { font-size: 12px; color: var(--secondary-text-color); margin: 4px 12px 0; line-height: 1.35; }
  .toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; }
  .toggle .text { font-size: 14px; }
  .switch { position: relative; flex: none; width: 36px; height: 20px; }
  .switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
  .switch .track { position: absolute; inset: 3px 0; border-radius: 7px; background: var(--switch-unchecked-track-color, color-mix(in srgb, var(--primary-text-color) 30%, transparent)); transition: background 0.15s; }
  .switch .knob { position: absolute; top: 0; left: 0; width: 20px; height: 20px; border-radius: 50%; background: var(--switch-unchecked-button-color, #fafafa);
    box-shadow: 0 1px 3px rgba(0,0,0,.4); transition: transform 0.15s, background 0.15s; }
  .switch input:checked ~ .track { background: color-mix(in srgb, var(--primary-color) 50%, transparent); }
  .switch input:checked ~ .knob { transform: translateX(16px); background: var(--primary-color); }
  .switch input:focus-visible ~ .knob { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  details { border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); }
  summary { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; list-style: none; font-weight: var(--ha-font-weight-medium, 500); font-size: 14px; }
  summary::-webkit-details-marker { display: none; }
  summary svg { width: 22px; height: 22px; fill: var(--secondary-text-color); flex: none; }
  summary::after { content: ""; margin-left: auto; width: 8px; height: 8px; border-right: 2px solid var(--secondary-text-color);
    border-bottom: 2px solid var(--secondary-text-color); transform: rotate(45deg); transition: transform 0.15s; }
  details[open] summary::after { transform: rotate(-135deg); }
  details > .body { padding: 4px 16px 16px; }
  .constant { font-size: 14px; }
  .constant b { font-weight: var(--ha-font-weight-medium, 500); }
  .list-label { font-size: 14px; margin-bottom: 8px; }
  .items { display: flex; flex-direction: column; gap: 8px; }
  .item { border: 1px solid var(--divider-color); border-radius: 8px; }
  .item .head { display: flex; align-items: center; gap: 4px; padding: 4px 4px 4px 12px; min-height: 44px; }
  .item .text { flex: 1; min-width: 0; }
  .item .text .main { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item .text .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item .edit { padding: 8px 12px 12px; border-top: 1px solid var(--divider-color); }
  .item .buttons { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  .ibtn { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 50%;
    background: none; color: var(--secondary-text-color); cursor: pointer; padding: 0; }
  .ibtn:hover:not([disabled]) { background: var(--secondary-background-color); color: var(--primary-text-color); }
  .ibtn[disabled] { opacity: 0.35; cursor: default; }
  .ibtn svg { width: 20px; height: 20px; fill: currentColor; }
  .btn { border: 0; border-radius: 18px; padding: 8px 18px; font: inherit; font-size: 14px; font-weight: var(--ha-font-weight-medium, 500); cursor: pointer;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent); color: var(--primary-color); }
  .btn.filled { background: var(--primary-color); color: var(--text-primary-color, #fff); }
  .btn.plain { background: none; }
    .add { margin-top: 8px; align-self: flex-start; }
  .picker .row { padding-right: 4px; }
  .picker .row > .lead { display: flex; align-items: center; padding: 18px 0 0 12px; color: var(--state-icon-color, var(--secondary-text-color)); }
  .picker .row > .lead:empty { display: none; }
  .picker .row > .lead + input { padding-left: 12px; }
  .picker .clear { margin-top: 12px; }
  .picker .menu { position: absolute; left: 0; right: 0; top: 100%; z-index: 10; max-height: 300px; overflow-y: auto;
    background: var(--card-background-color, #fff); border-radius: 0 0 8px 8px; padding: 4px 0;
    box-shadow: 0 6px 16px rgba(0,0,0,.2), 0 1px 3px rgba(0,0,0,.15); }
  .picker .opt { display: flex; align-items: center; gap: 14px; padding: 8px 14px; cursor: pointer; }
  .picker .opt.active { background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
  .picker .opt .lead { display: flex; color: var(--state-icon-color, var(--secondary-text-color)); }
  .picker .opt .text { display: flex; flex-direction: column; min-width: 0; }
  .picker .opt .main { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .picker .opt .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .picker .none { padding: 12px 14px; font-size: 14px; color: var(--secondary-text-color); }
`;
const PATHS = {
  up: "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
  down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  edit: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
  del: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
  close:
    "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
};
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

// one field: its element and how it shows a new value in place
interface Field {
  el: HTMLElement;
  set(v: unknown): void;
  // the field draws its own helper (a selector of a card's own)
  ownHelper?: boolean;
}

// the states an entity may be in, for a state picker: on and off where it switches, its options
// (a select's, a thermostat's modes), else the one it has now
const TOGGLES = new Set(["light", "switch", "fan", "input_boolean", "binary_sensor", "automation"]);
const statesOf = (st: { entity_id: string; state: string; attributes: Raw } | undefined) => {
  if (!st) return [];
  const a = st.attributes;
  const list = Array.isArray(a.options)
    ? a.options
    : Array.isArray(a.hvac_modes)
      ? a.hvac_modes
      : [];
  const own = TOGGLES.has(st.entity_id.split(".")[0]) ? ["on", "off"] : [];
  return [...new Set([st.state, ...own, ...list.map(String)])];
};

// the focused element in a shadow root (happy-dom, under the unit tests, throws where the focus
// is in a shadow root around this one: none here, as in a browser)
const activeIn = (root: ShadowRoot): HTMLElement | null => {
  try {
    return root.activeElement as HTMLElement | null;
  } catch {
    return null;
  }
};

// the selectors this stand-in draws itself; any other names an element of its own
const BUILTIN = new Set([
  "boolean",
  "number",
  "select",
  "ui_color",
  "entity",
  "attribute",
  "icon",
  "state",
  "text",
  "ui_action",
  "object",
]);

export class HaFormShim extends HTMLElement {
  hass?: HassLike;
  computeLabel?: (s: Schema) => string;
  computeHelper?: (s: Schema) => string | undefined;
  _data: Raw = {};
  // the datalists' numbers (their ids are unique in the form)
  _lists = 0;
  _schema: Schema[] = [];
  _key = "";
  _fields = new Map<string, Field>();
  _open = new Set<string>();
  // sections closed by hand: one the schema opens (`expanded`) stays closed once closed
  _closed = new Set<string>();
  _expanded = new Map<string, boolean>();
  _queued = false;

  set data(d: Raw | undefined) {
    this._data = { ...(d ?? {}) };
    this._queue();
  }
  get data(): Raw {
    return this._data;
  }
  set schema(s: Schema[] | undefined) {
    this._schema = s ?? [];
    this._queue();
  }
  get schema(): Schema[] {
    return this._schema;
  }
  connectedCallback() {
    this._queue();
  }
  _queue() {
    if (this._queued) return;
    this._queued = true;
    queueMicrotask(() => {
      this._queued = false;
      // a form taken off the page meanwhile draws when it is back (connectedCallback)
      if (this.isConnected) this._render();
    });
  }

  _emit(name: string, v: unknown) {
    const value = { ...this._data };
    if (v === undefined || v === "") delete value[name];
    else value[name] = v;
    this._data = value;
    this.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value }, bubbles: true, composed: true }),
    );
  }

  _label(s: Schema) {
    return this.computeLabel?.(s) ?? title(s.name);
  }

  _render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const key = JSON.stringify(this._schema);
    if (key !== this._key) {
      // a new schema: built again, the focused field focused again
      const active = activeIn(root);
      const focusName = active?.closest<HTMLElement>("[data-name]")?.dataset.name;
      // the sections open now stay open (their toggle event may not have come yet)
      for (const d of root.querySelectorAll<HTMLDetailsElement>("details[data-id]"))
        if (d.open) this._open.add(d.dataset.id!);
        else {
          this._open.delete(d.dataset.id!);
          this._closed.add(d.dataset.id!);
        }
      this._key = key;
      this._fields.clear();
      const stack = document.createElement("div");
      stack.className = "stack";
      for (const s of this._schema) stack.appendChild(this._node(s));
      root.innerHTML = `<style>${STYLE}</style>`;
      root.appendChild(stack);
      if (focusName)
        root
          .querySelector<HTMLElement>(
            `[data-name="${focusName}"] input, [data-name="${focusName}"] select, [data-name="${focusName}"] textarea`,
          )
          ?.focus();
    }
    for (const [name, f] of this._fields) f.set(this._data[name]);
  }

  _node(s: Schema): HTMLElement {
    if (s.type === "grid") {
      const g = document.createElement("div");
      g.className = "grid";
      for (const c of s.schema ?? []) g.appendChild(this._node(c));
      return g;
    }
    if (s.type === "expandable") {
      const d = document.createElement("details");
      const id = s.title ?? s.name;
      d.dataset.id = id;
      // a section's `expanded` that changes opens or closes it, as Home Assistant's panel takes
      // the new value (a toggle of the viewer's stays while it does not)
      if (this._expanded.get(id) !== !!s.expanded) {
        this._expanded.set(id, !!s.expanded);
        if (s.expanded) {
          this._closed.delete(id);
        } else this._open.delete(id);
      }
      d.open = this._open.has(id) || (!!s.expanded && !this._closed.has(id));
      // (the section's schema on it, as on Home Assistant's ha-form-expandable)
      (d as HTMLDetailsElement & { schema?: Schema }).schema = s;
      d.addEventListener("toggle", () => {
        if (d.open) {
          this._open.add(id);
          this._closed.delete(id);
        } else {
          this._open.delete(id);
          this._closed.add(id);
        }
        // as Home Assistant's panel tells of a toggle
        d.dispatchEvent(
          new CustomEvent("expanded-changed", {
            detail: { expanded: d.open },
            bubbles: true,
            composed: true,
          }),
        );
      });
      const sum = document.createElement("summary");
      sum.innerHTML = s.iconPath ? svg(s.iconPath) : "";
      sum.append(s.title ?? "");
      const body = document.createElement("div");
      body.className = "body stack";
      for (const c of s.schema ?? []) body.appendChild(this._node(c));
      d.append(sum, body);
      return d;
    }
    if (s.type === "constant") {
      const c = document.createElement("div");
      c.className = "constant";
      c.innerHTML = `<b></b>`;
      c.querySelector("b")!.textContent = this._label(s);
      if (s.value) c.append(`: ${s.value}`);
      return c;
    }
    const wrap = document.createElement("div");
    wrap.dataset.name = s.name;
    const f = this._field(s);
    this._fields.set(s.name, f);
    wrap.appendChild(f.el);
    const help = f.ownHelper ? undefined : this.computeHelper?.(s);
    if (help) {
      const h = document.createElement("div");
      h.className = "helper";
      h.textContent = help;
      wrap.appendChild(h);
    }
    return wrap;
  }

  // a filled field with its floating label around a control
  _box(s: Schema, control: HTMLElement, cls = ""): HTMLElement {
    const box = document.createElement("label");
    box.className = `field ${cls}`;
    const l = document.createElement("span");
    l.className = "label";
    l.textContent = this._label(s);
    box.append(l, control);
    return box;
  }
  _select(s: Schema, options: Option[], empty: string | null, onChange: (v: string) => void) {
    const sel = document.createElement("select");
    const opts = [...(empty !== null ? [{ value: "", label: empty }] : []), ...options];
    for (const o of opts) {
      const op = document.createElement("option");
      op.value = o.value;
      op.textContent = o.label;
      sel.appendChild(op);
    }
    sel.addEventListener("change", () => onChange(sel.value));
    return sel;
  }

  _field(s: Schema): Field {
    const sel = s.selector ?? {};
    const kind = Object.keys(sel)[0] ?? "text";
    const conf = (sel[kind] ?? {}) as Raw;
    const name = s.name;
    // a selector of a card's own: as Home Assistant's ha-selector does, the element named
    // ha-selector-<type>, given the field's value, label and hass, sending value-changed
    const own = customElements.get(`ha-selector-${kind}`);
    if (own && !BUILTIN.has(kind)) {
      type Own = HTMLElement & {
        hass?: unknown;
        value?: unknown;
        label?: string;
        helper?: string;
        selector?: unknown;
      };
      const el = document.createElement(`ha-selector-${kind}`) as Own;
      el.label = this._label(s);
      // (it draws its own helper, as Home Assistant's selectors draw theirs)
      el.helper = this.computeHelper?.(s);
      el.selector = sel;
      el.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._emit(name, (ev as CustomEvent).detail?.value);
      });
      return {
        el,
        ownHelper: true,
        set: (v) => {
          el.hass = this.hass;
          el.value = v;
        },
      };
    }
    switch (kind) {
      case "boolean": {
        const el = document.createElement("label");
        el.className = "toggle";
        el.innerHTML = `<span class="text"></span><span class="switch"><input type="checkbox" role="switch"><span class="track"></span><span class="knob"></span></span>`;
        el.querySelector(".text")!.textContent = this._label(s);
        const input = el.querySelector("input")!;
        input.addEventListener("change", () => this._emit(name, input.checked));
        return { el, set: (v) => (input.checked = v === true) };
      }
      case "number": {
        const input = document.createElement("input");
        const slider = conf.mode === "slider";
        input.type = slider ? "range" : "number";
        for (const k of ["min", "max", "step"] as const)
          if (conf[k] !== undefined) input.setAttribute(k, String(conf[k]));
        if (slider && conf.step === undefined) input.step = "any";
        input.addEventListener(slider ? "input" : "change", () =>
          this._emit(name, input.value === "" ? undefined : Number(input.value)),
        );
        if (s.default !== undefined && !s.required) input.placeholder = String(s.default);
        const unit = conf.unit_of_measurement ? ` (${conf.unit_of_measurement})` : "";
        // a slider: its track under the label, the value beside it (the default, faint, while
        // none is set: an empty range would sit in its middle)
        const out = document.createElement("span");
        out.className = "slider-value";
        let control: HTMLElement = input;
        if (slider) {
          control = document.createElement("div");
          control.className = "slider";
          control.append(input, out);
          input.addEventListener("input", () => {
            out.textContent = input.value;
            out.classList.remove("unset");
          });
        }
        const box = this._box({ ...s, name }, control, slider ? "has-slider" : "");
        if (unit) box.querySelector(".label")!.append(unit);
        return {
          el: box,
          set: (v) => {
            if (activeIn(this.shadowRoot!) === input) return;
            const set = typeof v === "number";
            const shown = set ? v : typeof s.default === "number" ? s.default : undefined;
            input.value = shown === undefined ? "" : String(shown);
            if (slider) {
              out.textContent = shown === undefined ? "" : String(shown);
              out.classList.toggle("unset", !set);
            }
          },
        };
      }
      case "select": {
        const options = optionsOf(conf);
        // several at once: a checkbox each, as Home Assistant's list of a few options
        if (conf.multiple) {
          const row = document.createElement("div");
          row.className = "checks";
          const boxes = options.map((o) => {
            const l = document.createElement("label");
            const box = document.createElement("input");
            box.type = "checkbox";
            box.value = o.value;
            box.addEventListener("change", () => {
              const on = boxes.filter((b) => b.checked).map((b) => b.value);
              this._emit(name, on.length ? on : undefined);
            });
            l.append(box, document.createTextNode(o.label));
            row.append(l);
            return box;
          });
          return {
            el: this._box(s, row),
            set: (v) => {
              const on = Array.isArray(v) ? v.map(String) : [];
              for (const b of boxes) b.checked = on.includes(b.value);
            },
          };
        }
        const select = this._select(s, options, s.required ? null : "", (v) =>
          this._emit(name, v || undefined),
        );
        return {
          el: this._box(s, select, "select"),
          set: (v) => (select.value = v === undefined ? "" : String(v)),
        };
      }
      case "ui_color": {
        const select = this._select(
          s,
          COLORS.map((c) => ({ value: c, label: title(c) })),
          "Default",
          (v) => this._emit(name, v || undefined),
        );
        const sw = document.createElement("span");
        sw.className = "swatch";
        const row = document.createElement("div");
        row.className = "row";
        select.classList.add("grow");
        row.append(select, sw);
        return {
          el: this._box(s, row, "select"),
          set: (v) => {
            select.value = typeof v === "string" ? v : "";
            sw.style.background =
              typeof v === "string" && v ? `var(--${v}-color, ${v})` : "transparent";
          },
        };
      }
      case "entity":
        return this._entity(s, conf);
      case "attribute":
      case "icon":
      case "state":
      case "text":
      default:
        return this._textLike(s, kind, conf);
      case "ui_action":
        return this._action(s, conf);
      case "object":
        return conf.fields ? this._list(s, conf) : this._yaml(s);
    }
  }

  _textLike(s: Schema, kind: string, conf: Raw): Field {
    const name = s.name;
    if (kind === "attribute") {
      const entity = String(conf.entity_id ?? "");
      const attrs = Object.keys(this.hass?.states[entity]?.attributes ?? {}).map((a) => ({
        value: a,
        label: title(a),
      }));
      // no pick: what the field's placeholder says it shows (the state)
      const none = s.default !== undefined && !s.required ? String(s.default) : "";
      const select = this._select(s, attrs, none, (v) => this._emit(name, v || undefined));
      return {
        el: this._box(s, select, "select"),
        set: (v) => {
          select.value = typeof v === "string" ? v : "";
          // no pick: the placeholder, faint (as Home Assistant's picker draws it)
          select.classList.toggle("unset", !select.value);
        },
      };
    }
    const input = document.createElement("input");
    input.type = "text";
    input.spellcheck = false;
    // a state picker: the entity's states suggested, any text taken (as Home Assistant's)
    let states: HTMLDataListElement | null = null;
    if (kind === "state") {
      states = document.createElement("datalist");
      states.id = `states-${s.name}-${++this._lists}`;
      input.setAttribute("list", states.id);
      for (const v of statesOf(this.hass?.states[String(conf.entity_id ?? "")])) {
        const o = document.createElement("option");
        o.value = v;
        states.appendChild(o);
      }
    }
    let preview: HTMLElement | null = null;
    // the placeholder: the field's default, an icon picker's own or its entity's icon
    const ownIcon = () => {
      const entity = s.context?.icon_entity ? this._data[s.context.icon_entity] : undefined;
      const icon =
        typeof entity === "string" ? this.hass?.states[entity]?.attributes.icon : undefined;
      return typeof icon === "string" ? icon : "";
    };
    if (s.default !== undefined && !s.required) input.placeholder = String(s.default);
    if (kind === "icon") {
      preview = document.createElement("ha-icon");
      preview.className = "icon-preview";
      input.placeholder = String(conf.placeholder ?? "") || "mdi:…";
    }
    input.addEventListener("change", () => this._emit(name, input.value.trim() || undefined));
    let control: HTMLElement = input;
    if (states) {
      control = document.createElement("div");
      control.append(input, states);
    }
    if (preview) {
      const row = document.createElement("div");
      row.className = "row";
      input.classList.add("grow");
      row.append(input, preview);
      control = row;
    }
    return {
      el: this._box(s, control),
      set: (v) => {
        const next = typeof v === "string" ? v : "";
        if (input.value !== next && activeIn(this.shadowRoot!) !== input) input.value = next;
        if (preview) {
          // the entity's icon while none is written, faint
          const own = next ? "" : ownIcon();
          if (own) input.placeholder = own;
          (preview as HTMLElement & { icon?: string }).icon = next || own || undefined;
          preview.hidden = !next && !own;
          preview.classList.toggle("own", !next && !!own);
        }
      },
    };
  }

  // an entity: the chosen one's icon and name; a list of the entities it takes (the selector's
  // domains and device classes) opens on focus, filtered as you type, picked by click or Enter
  _entity(s: Schema, conf: Raw): Field {
    const name = s.name;
    // the selector's filters: an entity that matches any of them
    const filters = asList(conf.filter).map((f) => ({
      domains: asList((f as Raw).domain).map(String),
      classes: asList((f as Raw).device_class).map(String),
    }));
    const states = () => this.hass?.states ?? {};
    const nameOf = (id: string) => String(states()[id]?.attributes.friendly_name ?? id);
    // (as Home Assistant: only these entities, where the selector names them)
    const only = Array.isArray(conf.include_entities) ? conf.include_entities.map(String) : null;
    const candidates = () =>
      Object.values(states())
        .filter((st) => !only || only.includes(st.entity_id))
        .filter((st) => {
          const d = st.entity_id.split(".")[0];
          const dc = String(st.attributes.device_class);
          return (
            !filters.length ||
            filters.some(
              (f) =>
                (!f.domains.length || f.domains.includes(d)) &&
                (!f.classes.length || f.classes.includes(dc)),
            )
          );
        })
        .sort((a, b) => nameOf(a.entity_id).localeCompare(nameOf(b.entity_id)));
    const stateIcon = (id: string) => {
      const icon = document.createElement("ha-state-icon") as HTMLElement & {
        hass?: unknown;
        stateObj?: unknown;
      };
      icon.hass = this.hass;
      icon.stateObj = states()[id];
      return icon;
    };

    const box = document.createElement("div");
    box.className = "field picker";
    box.innerHTML = `<span class="label"></span><div class="row"><span class="lead"></span>
      <input type="text" spellcheck="false" autocomplete="off" role="combobox" aria-expanded="false" class="grow">
      <button type="button" class="ibtn clear" title="Clear" aria-label="Clear">${svg(PATHS.close)}</button></div>
      <div class="menu" role="listbox" hidden></div>`;
    box.querySelector(".label")!.textContent = this._label(s);
    const input = box.querySelector("input")!;
    // (as Home Assistant: a field's default is its placeholder, a picker's "None")
    input.placeholder =
      s.default !== undefined && !s.required ? String(s.default) : "Search entities";
    const lead = box.querySelector(".lead")!;
    const clear = box.querySelector<HTMLButtonElement>(".clear")!;
    const menu = box.querySelector<HTMLElement>(".menu")!;
    let value = "";
    let shown: string[] = [];
    let active = 0;

    const show = () => {
      input.value = value ? nameOf(value) : "";
      lead.replaceChildren(...(value ? [stateIcon(value)] : []));
      clear.hidden = !value;
    };
    const close = () => {
      menu.hidden = true;
      input.setAttribute("aria-expanded", "false");
    };
    const mark = () =>
      menu.querySelectorAll(".opt").forEach((o, i) => {
        o.classList.toggle("active", i === active);
        if (i === active) o.scrollIntoView({ block: "nearest" });
      });
    const draw = (q: string) => {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      shown = candidates()
        .map((st) => st.entity_id)
        .filter((id) => words.every((w) => `${nameOf(id)} ${id}`.toLowerCase().includes(w)))
        .slice(0, 200);
      active = Math.min(active, Math.max(0, shown.length - 1));
      menu.replaceChildren(
        ...(shown.length
          ? shown.map((id, i) => {
              const o = document.createElement("div");
              o.className = "opt";
              o.setAttribute("role", "option");
              o.innerHTML = `<span class="lead"></span><span class="text"><span class="main"></span><span class="sub"></span></span>`;
              o.querySelector(".lead")!.appendChild(stateIcon(id));
              o.querySelector(".main")!.textContent = nameOf(id);
              o.querySelector(".sub")!.textContent = id;
              // the field keeps the focus: a click picks
              o.addEventListener("mousedown", (ev) => ev.preventDefault());
              o.addEventListener("click", () => pick(id));
              o.addEventListener("mousemove", () => {
                if (active !== i) {
                  active = i;
                  mark();
                }
              });
              return o;
            })
          : [
              Object.assign(document.createElement("div"), {
                className: "none",
                textContent: "No matching entities",
              }),
            ]),
      );
      mark();
      menu.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };
    const pick = (id: string) => {
      value = id;
      close();
      show();
      input.blur();
      this._emit(name, id);
    };

    input.addEventListener("focus", () => {
      // a search: no entity shown while it runs
      input.value = "";
      lead.replaceChildren();
      active = Math.max(0, shown.indexOf(value));
      draw("");
    });
    input.addEventListener("input", () => {
      active = 0;
      draw(input.value);
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        if (menu.hidden) draw(input.value);
        active =
          (active + (ev.key === "ArrowDown" ? 1 : -1) + shown.length) % Math.max(1, shown.length);
        mark();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (shown[active]) pick(shown[active]);
      } else if (ev.key === "Escape") {
        close();
        input.blur();
      }
    });
    input.addEventListener("blur", () => {
      // an entity id typed out is taken as it is
      const typed = input.value.trim();
      close();
      if (typed && typed !== nameOf(value) && states()[typed]) pick(typed);
      else show();
    });
    clear.addEventListener("mousedown", (ev) => ev.preventDefault());
    clear.addEventListener("click", () => {
      value = "";
      show();
      this._emit(name, undefined);
    });
    return {
      el: box,
      set: (v) => {
        value = typeof v === "string" ? v : "";
        if (activeIn(this.shadowRoot!) !== input) show();
      },
    };
  }

  // an action: what it does, and the one thing that action needs (a path, a URL, a service)
  _action(s: Schema, conf: Raw): Field {
    const name = s.name;
    const wrap = document.createElement("div");
    wrap.className = "stack";
    wrap.style.gap = "8px";
    const def = conf.default_action ? `Default (${title(String(conf.default_action))})` : "Default";
    let current: Raw | undefined;
    const select = this._select(
      s,
      ACTIONS.map((a) => ({ value: a, label: title(a) })),
      def,
      (v) => this._emit(name, v ? { action: v } : undefined),
    );
    const extra = document.createElement("input");
    extra.type = "text";
    const extraBox = this._box({ name: "extra" }, extra);
    extra.addEventListener("change", () => {
      const key = ACTION_FIELD[String(current?.action)];
      if (key) this._emit(name, { ...current, [key]: extra.value.trim() });
    });
    wrap.append(this._box(s, select, "select"), extraBox);
    return {
      el: wrap,
      set: (v) => {
        current = v && typeof v === "object" ? (v as Raw) : undefined;
        select.value = String(current?.action ?? "");
        const key = ACTION_FIELD[String(current?.action)];
        extraBox.hidden = !key;
        if (key) {
          extraBox.querySelector(".label")!.textContent = title(key);
          if (activeIn(this.shadowRoot!) !== extra) extra.value = String(current?.[key] ?? "");
        }
      },
    };
  }

  // any value as YAML
  _yaml(s: Schema): Field {
    const name = s.name;
    const ta = document.createElement("textarea");
    ta.spellcheck = false;
    const box = this._box(s, ta);
    ta.addEventListener("change", () => {
      try {
        const v = ta.value.trim() ? yaml.load(ta.value) : undefined;
        box.classList.remove("bad");
        this._emit(name, v ?? undefined);
      } catch {
        box.classList.add("bad");
      }
    });
    return {
      el: box,
      set: (v) => {
        if (activeIn(this.shadowRoot!) === ta) return;
        ta.value = v === undefined || v === null ? "" : yaml.dump(v, { lineWidth: -1 });
      },
    };
  }

  // a list of objects: a row each (its label, moved up or down, edited in place, deleted), and Add
  _list(s: Schema, conf: Raw): Field {
    const name = s.name;
    const fields = conf.fields as Record<
      string,
      { selector: Raw; label?: string; required?: boolean }
    >;
    const labelField = String(conf.label_field ?? Object.keys(fields)[0]);
    const descField = conf.description_field ? String(conf.description_field) : null;
    const wrap = document.createElement("div");
    wrap.className = "stack";
    wrap.style.gap = "0";
    const head = document.createElement("div");
    head.className = "list-label";
    head.textContent = this._label(s);
    const items = document.createElement("div");
    items.className = "items";
    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn add";
    add.textContent = "Add";
    wrap.append(head, items, add);
    let list: Raw[] = [];
    let editing: number | null = null;
    const show = (v: unknown) => {
      if (v === undefined || v === null || v === "") return "";
      if (typeof v === "string") return String(this.hass?.states[v]?.attributes.friendly_name ?? v);
      return typeof v === "object" ? JSON.stringify(v) : String(v);
    };
    const save = (next: Raw[]) => {
      list = next;
      this._emit(name, next);
    };
    const draw = () => {
      items.replaceChildren(
        ...[...list, ...(editing === list.length ? [{}] : [])].map((item: Raw, i) => {
          const row = document.createElement("div");
          row.className = "item";
          const h = document.createElement("div");
          h.className = "head";
          const text = document.createElement("div");
          text.className = "text";
          text.innerHTML = `<div class="main"></div><div class="sub"></div>`;
          text.querySelector(".main")!.textContent = show(item[labelField]) || `#${i + 1}`;
          text.querySelector(".sub")!.textContent = descField ? show(item[descField]) : "";
          const btn = (path: string, label: string, on: () => void, disabled = false) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "ibtn";
            b.title = label;
            b.setAttribute("aria-label", label);
            b.disabled = disabled;
            b.innerHTML = svg(path);
            b.addEventListener("click", on);
            return b;
          };
          const move = (by: number) => {
            const next = list.slice();
            const [x] = next.splice(i, 1);
            next.splice(i + by, 0, x);
            editing = null;
            save(next);
            draw();
          };
          h.append(
            text,
            btn(PATHS.up, "Move up", () => move(-1), i === 0),
            btn(PATHS.down, "Move down", () => move(1), i === list.length - 1),
            btn(PATHS.edit, "Edit", () => {
              editing = editing === i ? null : i;
              draw();
            }),
            btn(PATHS.del, "Delete", () => {
              editing = null;
              save(list.filter((_, j) => j !== i));
              draw();
            }),
          );
          row.appendChild(h);
          if (editing === i)
            row.appendChild(
              this._itemEditor(fields, item, (next) => {
                editing = null;
                if (next)
                  save(
                    i === list.length ? [...list, next] : list.map((x, j) => (j === i ? next : x)),
                  );
                draw();
              }),
            );
          return row;
        }),
      );
    };
    add.addEventListener("click", () => {
      editing = list.length;
      draw();
    });
    return {
      el: wrap,
      set: (v) => {
        if (editing !== null) return;
        list = Array.isArray(v) ? (v as Raw[]) : [];
        draw();
      },
    };
  }

  // an item's fields in a form of their own, saved or dropped
  _itemEditor(
    fields: Record<string, { selector: Raw; label?: string }>,
    item: Raw,
    done: (next: Raw | null) => void,
  ): HTMLElement {
    const box = document.createElement("div");
    box.className = "edit";
    const form = document.createElement("ha-form") as HaFormShim;
    form.hass = this.hass;
    form.computeLabel = (s) => fields[s.name]?.label ?? title(s.name);
    form.schema = Object.entries(fields).map(([name, f]) => ({ name, selector: f.selector }));
    let draft = { ...item };
    form.data = draft;
    form.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      draft = (ev as CustomEvent).detail.value;
    });
    const buttons = document.createElement("div");
    buttons.className = "buttons";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn plain";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => done(null));
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "btn filled";
    ok.textContent = "Save";
    ok.addEventListener("click", () => done(draft));
    buttons.append(cancel, ok);
    box.append(form, buttons);
    return box;
  }
}

export const defineForm = () => {
  if (!customElements.get("ha-form")) customElements.define("ha-form", HaFormShim);
};
