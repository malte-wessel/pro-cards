// Visual editor of the power flow and the energy flow card (CardsEditorBase): the card's own options
// above (the header, the home, the consumers as a list with a dialog each, how the tree is drawn,
// the values; the energy card's period), the sources in tabs below, each in a form of its type
// (solar, battery, grid). The power card reads power sensors, the energy card energy meters: the
// forms differ only in those. Both write back only what they changed: a part as the config had
// it keeps its spelling, a value at its default writes nothing. The home's rules (the entity
// cards' format) and a room's devices are YAML fields.
import { CardsEditorBase, type CardElementEditor } from "../cards/editor.ts";
import { FormEditorBase, setOrDrop } from "../editor.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../ha.ts";
import { hasString, t, type StringKey } from "../i18n.ts";
import { badgesFromForm, badgesToForm } from "../kinds/editor-form.ts";
import { badgesField, ICONS } from "../kinds/editor-schema.ts";

export type FlowCard = "power" | "energy";
type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const empty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && !v.length) ||
  (isObj(v) && !Object.keys(v).length);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const numOr = (v: unknown, d: number | undefined) => (typeof v === "number" ? v : d);

const F = (hass: HomeAssistant | undefined, key: string) =>
  t(hass, `editor.flow.${key}` as StringKey);

const grid = (...schema: HaFormSchema[]): HaFormSchema => ({ name: "", type: "grid", schema });
const section = (title: string, icon: string, schema: HaFormSchema[]): HaFormSchema => ({
  name: "",
  type: "expandable",
  flatten: true,
  title,
  iconPath: icon,
  schema,
});
const select = (name: string, values: readonly string[], label: (v: string) => string) => ({
  name,
  selector: {
    select: { mode: "dropdown", options: values.map((v) => ({ value: v, label: label(v) })) },
  },
});
const sensor = (name: string) => ({ name, selector: { entity: { filter: { domain: "sensor" } } } });
const any = (name: string) => ({ name, selector: { entity: {} } });
const amount = (name: string, unit: string, step = 1) => ({
  name,
  selector: { number: { mode: "box", min: 0, step, unit_of_measurement: unit } },
});
const yamlField = (name: string) => ({ name, selector: { object: {} } });
const bool = (name: string) => ({ name, selector: { boolean: {} } });

// the units a card's thresholds read, and their defaults
const UNIT = { power: "W", energy: "kWh" } as const;
const IDLE = { power: 20, energy: 0.05 } as const;

// ---- the card's own options -----------------------------------------------------------------

const DRAWING = {
  direction: ["right", "down"],
  consumer_style: ["nodes", "list"],
  flow_style: ["dots", "lines", "arrows", "none"],
  idle_links: ["dashed", "hidden", "faint"],
} as const;
const PERIODS = ["today", "yesterday", "week", "month", "year", "dashboard"] as const;

// the home: an entity id, or an object with its entity, name and icon (and what else it says)
const homeOf = (v: unknown): Raw => (typeof v === "string" ? { entity: v } : isObj(v) ? v : {});

// a consumer: a device (an entity, its name, icon, colour, own threshold) or a room (its name,
// icon, threshold and devices); the rest of what it says under More (YAML)
const CONSUMER_FIELDS = ["entity", "group", "name", "icon", "color", "hide_below"] as const;
const consumerToForm = (x: unknown): Raw => {
  const o: Raw = typeof x === "string" ? { entity: x } : isObj(x) ? { ...x } : {};
  const item: Raw = {};
  const more: Raw = {};
  for (const [k, v] of Object.entries(o))
    if ((CONSUMER_FIELDS as readonly string[]).includes(k)) item[k] = v;
    else more[k] = v;
  if (Object.keys(more).length) item.more = more;
  return item;
};
const consumerFromForm = (item: Raw): unknown => {
  const o: Raw = {};
  for (const k of CONSUMER_FIELDS) if (!empty(item[k])) o[k] = item[k];
  if (isObj(item.more)) for (const [k, v] of Object.entries(item.more)) if (!(k in o)) o[k] = v;
  const ks = Object.keys(o);
  return ks.length === 1 && ks[0] === "entity" ? o.entity : o;
};
// the list back: a consumer whose fields are as written keeps its spelling
const consumersFromForm = (v: unknown, written: unknown): unknown[] => {
  const was = Array.isArray(written) ? written : [];
  const forms: (Raw | null)[] = was.map(consumerToForm);
  return (Array.isArray(v) ? (v as Raw[]) : []).map((item) => {
    const i = forms.findIndex((f) => f && same(f, item));
    if (i < 0) return consumerFromForm(item);
    forms[i] = null;
    return was[i];
  });
};

export const flowToForm = (c: Raw, card: FlowCard): HaFormData => {
  const home = homeOf(c.home);
  const d: HaFormData = {
    title: str(c.title),
    icon: str(c.icon),
    home_entity: str(home.entity),
    home_name: str(home.name),
    home_icon: str(home.icon),
    consumers: (Array.isArray(c.consumers) ? c.consumers : []).map(consumerToForm),
    badges: badgesToForm(c.badges),
    other: c.other !== false,
    idle_below: numOr(c.idle_below, IDLE[card]),
    decimals: numOr(c.decimals, undefined),
    hide_consumers_below: numOr(c.hide_consumers_below, undefined),
    rules: c.rules,
  };
  if (c.title_tap_action !== undefined && c.title_tap_action !== null)
    d.title_tap_action = c.title_tap_action;
  for (const [k, values] of Object.entries(DRAWING))
    d[k] = typeof c[k] === "string" ? c[k] : values[0];
  if (card === "power") {
    d.kw_above = numOr(c.kw_above, 1000);
    d.expensive_above = numOr(c.expensive_above, undefined);
    const anim = isObj(c.animation) ? c.animation : {};
    d.slow_below = numOr(anim.slow_below, 0);
    d.fast_above = numOr(anim.fast_above, 3600);
  } else {
    d.period = typeof c.period === "string" ? c.period : "today";
    d.collection_key = str(c.collection_key);
    d.period_picker = c.period_picker !== false;
  }
  return d;
};

export const flowFromForm = (data: HaFormData, prev: Raw, card: FlowCard): Raw => {
  const c: Raw = { ...prev };
  const was = flowToForm(prev, card);
  const changed = (...ks: string[]) => ks.some((k) => !same(data[k], was[k]));
  for (const k of ["title", "icon", "title_tap_action", "rules", "collection_key"])
    if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  // the home: its entity id alone, else an object (keeping what the form does not show)
  if (changed("home_entity", "home_name", "home_icon")) {
    const home: Raw = { ...homeOf(prev.home) };
    for (const [k, f] of [
      ["entity", "home_entity"],
      ["name", "home_name"],
      ["icon", "home_icon"],
    ] as const)
      setOrDrop(home, k, data[f], empty(data[f]));
    const ks = Object.keys(home);
    if (!ks.length) delete c.home;
    else c.home = ks.length === 1 && ks[0] === "entity" ? home.entity : home;
  }
  if (changed("consumers")) {
    const list = consumersFromForm(data.consumers, prev.consumers);
    setOrDrop(c, "consumers", list, !list.length);
  }
  if (changed("badges")) {
    const badges = badgesFromForm(data.badges, prev.badges);
    setOrDrop(c, "badges", badges, !badges.length);
  }
  for (const [k, values] of Object.entries(DRAWING))
    if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]) || data[k] === values[0]);
  // an Other node of the card's own (an object) stays unless it is turned off
  if (changed("other")) {
    if (data.other === false) c.other = false;
    else if (prev.other === false) delete c.other;
  }
  const number = (k: string, dflt?: number) => {
    if (!changed(k)) return;
    const v = Number(data[k]);
    setOrDrop(c, k, v, empty(data[k]) || !Number.isFinite(v) || v === dflt);
  };
  number("idle_below", IDLE[card]);
  number("decimals");
  number("hide_consumers_below");
  if (card === "power") {
    number("kw_above", 1000);
    number("expensive_above");
    if (changed("slow_below", "fast_above")) {
      const anim: Raw = { ...(isObj(prev.animation) ? prev.animation : {}) };
      for (const [k, dflt] of [
        ["slow_below", 0],
        ["fast_above", 3600],
      ] as const)
        if (changed(k)) {
          const v = Number(data[k]);
          setOrDrop(anim, k, v, empty(data[k]) || !Number.isFinite(v) || v === dflt);
        }
      setOrDrop(c, "animation", anim, !Object.keys(anim).length);
    }
  } else {
    if (changed("period"))
      setOrDrop(c, "period", data.period, !data.period || data.period === "today");
    if (changed("period_picker"))
      setOrDrop(c, "period_picker", false, data.period_picker !== false);
  }
  return c;
};

export const flowSchema = (
  hass: HomeAssistant | undefined,
  data: HaFormData,
  card: FlowCard,
): HaFormSchema[] => {
  const unit = UNIT[card];
  const period: HaFormSchema[] =
    card === "energy"
      ? [
          grid(
            select("period", PERIODS, (v) =>
              v === "dashboard"
                ? F(hass, "period.dashboard")
                : t(hass, `energy.period.${v}` as StringKey),
            ),
            bool("period_picker"),
          ),
          ...(data.period === "dashboard"
            ? [{ name: "collection_key", selector: { text: {} } }]
            : []),
        ]
      : [];
  return [
    grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
    ...period,
    { name: "title_tap_action", selector: { ui_action: { default_action: "none" } } },
    badgesField(hass),
    section(t(hass, "power.home"), ICONS.content, [
      sensor("home_entity"),
      grid(
        { name: "home_name", selector: { text: {} } },
        { name: "home_icon", selector: { icon: {} } },
      ),
      yamlField("rules"),
    ]),
    {
      name: "consumers",
      selector: {
        object: {
          multiple: true,
          label_field: "entity",
          description_field: "name",
          fields: {
            entity: { label: t(hass, "editor.card.field.entity"), selector: { entity: {} } },
            group: { label: F(hass, "field.room"), selector: { text: {} } },
            name: { label: t(hass, "editor.card.field.name"), selector: { text: {} } },
            icon: { label: t(hass, "editor.cards.field.icon"), selector: { icon: {} } },
            color: { label: t(hass, "editor.card.field.color"), selector: { ui_color: {} } },
            hide_below: {
              label: F(hass, "field.hide_below"),
              selector: amount("", unit, card === "energy" ? 0.1 : 1).selector,
            },
            more: { label: t(hass, "editor.card.more"), selector: { object: {} } },
          },
        },
      },
    },
    section(F(hass, "section.drawing"), ICONS.layout, [
      grid(
        ...Object.entries(DRAWING).map(([k, values]) =>
          select(k, values, (v) => F(hass, `${k}.${v}`)),
        ),
      ),
      bool("other"),
    ]),
    section(F(hass, "section.values"), ICONS.controls, [
      grid(
        amount("idle_below", unit, card === "energy" ? 0.01 : 1),
        amount("hide_consumers_below", unit, card === "energy" ? 0.1 : 1),
        { name: "decimals", selector: { number: { mode: "box", min: 0, max: 3, step: 1 } } },
      ),
      ...(card === "power"
        ? [
            grid(amount("kw_above", "W"), {
              name: "expensive_above",
              selector: { number: { mode: "box", step: 0.01 } },
            }),
            grid(amount("slow_below", "W"), amount("fast_above", "W")),
          ]
        : []),
    ]),
  ];
};

// ---- a source -------------------------------------------------------------------------------

const TYPES = ["solar", "battery", "grid"] as const;
type SourceType = (typeof TYPES)[number];
const typeOf = (s: Raw): SourceType =>
  s.type === "battery" || s.type === "grid" ? s.type : "solar";
// the keys a source of a type reads, by card: its meters, and how it is measured
const METERS: Record<FlowCard, Record<SourceType, string[]>> = {
  power: {
    solar: ["entity", "peak"],
    battery: ["power", "invert", "charge", "discharge", "soc", "charge_from"],
    grid: [
      "power",
      "invert",
      "import",
      "export",
      "both_ways",
      "price",
      "offline",
      "generator",
      "fossil",
      "non_fossil",
    ],
  },
  energy: {
    solar: ["entity"],
    battery: ["charge", "discharge", "soc", "charge_from"],
    grid: ["import", "export"],
  },
};
// a battery or a grid on the power card: one signed power sensor, or a pair
const PAIR: Record<string, [string, string]> = {
  battery: ["charge", "discharge"],
  grid: ["import", "export"],
};
// (one with neither yet: the way last chosen in the form, `hint`)
const measuredBy = (s: Raw, type: SourceType, hint?: string) =>
  PAIR[type] && (s[PAIR[type][0]] !== undefined || s[PAIR[type][1]] !== undefined)
    ? "pair"
    : s.power !== undefined
      ? "power"
      : (hint ?? "power");
const CHARGE_FROM = ["any", "solar"] as const;

export const sourceToForm = (s: Raw, card: FlowCard, hint?: string): HaFormData => {
  const type = typeOf(s);
  const d: HaFormData = { type, name: str(s.name), icon: str(s.icon), color: str(s.color) };
  for (const k of METERS[card][type])
    if (k === "invert" || k === "both_ways") d[k] = s[k] === true;
    else if (k === "peak") d[k] = numOr(s[k], undefined);
    else if (k === "charge_from")
      d[k] =
        typeof s[k] === "string" && (CHARGE_FROM as readonly string[]).includes(s[k] as string)
          ? s[k]
          : s[k] === undefined
            ? "any"
            : "custom";
    else if (k === "offline") d[k] = typeof s[k] === "string" ? s[k] : "";
    else d[k] = str(s[k]);
  if (card === "power" && PAIR[type]) d.measure = measuredBy(s, type, hint);
  return d;
};

// a source of another type: only what every source says stays
const COMMON = [
  "name",
  "secondary",
  "icon",
  "icon_size",
  "color",
  "decimals",
  "hover",
  "visibility",
];

export const sourceFromForm = (data: HaFormData, prev: Raw, card: FlowCard, hint?: string): Raw => {
  const was = sourceToForm(prev, card, hint);
  const changed = (k: string) => !same(data[k], was[k]);
  const type = (data.type as SourceType) ?? was.type;
  if (type !== was.type) {
    const keep: Raw = { type };
    for (const k of COMMON) if (prev[k] !== undefined) keep[k] = prev[k];
    return keep;
  }
  const c: Raw = { ...prev };
  for (const k of ["name", "icon", "color"])
    if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  // measured another way: the other way's keys go
  if (changed("measure")) {
    const drop = data.measure === "pair" ? ["power", "invert"] : PAIR[type];
    for (const k of drop ?? []) delete c[k];
  }
  for (const k of METERS[card][type]) {
    if (!changed(k)) continue;
    if (k === "invert" || k === "both_ways") setOrDrop(c, k, true, data[k] !== true);
    else if (k === "peak")
      setOrDrop(c, k, Number(data[k]), empty(data[k]) || !(Number(data[k]) > 0));
    else if (k === "charge_from") {
      // a list or an entity of the card's own stays unless another is picked
      if (data[k] !== "custom") setOrDrop(c, k, data[k], !data[k] || data[k] === "any");
    } else setOrDrop(c, k, data[k], empty(data[k]));
  }
  return c;
};

export const sourceSchema = (
  hass: HomeAssistant | undefined,
  data: HaFormData,
  card: FlowCard,
  written: Raw = {},
): HaFormSchema[] => {
  const type = data.type as SourceType;
  const head: HaFormSchema[] = [
    select("type", TYPES, (v) => t(hass, `power.${v}` as StringKey)),
    grid({ name: "name", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
    { name: "color", selector: { ui_color: {} } },
  ];
  const measure =
    card === "power" && PAIR[type]
      ? [select("measure", ["power", "pair"], (v) => F(hass, `measure.${type}.${v}`))]
      : [];
  const pair = card === "energy" || data.measure === "pair";
  const chargeFrom = select(
    "charge_from",
    written.charge_from !== undefined && typeof written.charge_from !== "string"
      ? [...CHARGE_FROM, "custom"]
      : CHARGE_FROM,
    (v) => F(hass, `charge_from.${v}`),
  );
  if (type === "solar")
    return [...head, sensor("entity"), ...(card === "power" ? [amount("peak", "W")] : [])];
  if (type === "battery")
    return [
      ...head,
      ...measure,
      ...(pair
        ? [grid(sensor("charge"), sensor("discharge"))]
        : [grid(sensor("power"), bool("invert"))]),
      sensor("soc"),
      chargeFrom,
    ];
  return [
    ...head,
    ...measure,
    ...(pair
      ? [grid(sensor("import"), sensor("export")), ...(card === "power" ? [bool("both_ways")] : [])]
      : [grid(sensor("power"), bool("invert"))]),
    ...(card === "power"
      ? [
          section(F(hass, "section.grid_more"), ICONS.inputs, [
            sensor("price"),
            any("offline"),
            sensor("generator"),
            grid(sensor("fossil"), sensor("non_fossil")),
          ]),
        ]
      : []),
  ];
};

// ---- the labels -----------------------------------------------------------------------------

export const FLOW_LABELS: Record<string, StringKey> = {
  title: "editor.cards.field.title",
  icon: "editor.cards.field.icon",
  title_tap_action: "editor.cards.field.title_tap_action",
  badges: "editor.card.field.badges",
  name: "editor.card.field.name",
  color: "editor.card.field.color",
  decimals: "editor.card.field.decimals",
  entity: "editor.flow.field.entity",
  ...Object.fromEntries(
    [
      "home_entity",
      "home_name",
      "home_icon",
      "rules",
      "consumers",
      "direction",
      "consumer_style",
      "flow_style",
      "idle_links",
      "other",
      "idle_below",
      "hide_consumers_below",
      "kw_above",
      "expensive_above",
      "slow_below",
      "fast_above",
      "period",
      "period_picker",
      "collection_key",
      "type",
      "measure",
      "power",
      "invert",
      "charge",
      "discharge",
      "soc",
      "charge_from",
      "import",
      "export",
      "both_ways",
      "price",
      "offline",
      "generator",
      "fossil",
      "non_fossil",
      "peak",
    ].map((k) => [k, `editor.flow.field.${k}` as StringKey]),
  ),
};
const labelOf = (hass: HomeAssistant | undefined, s: HaFormSchema) => {
  const k = FLOW_LABELS[s.name];
  return k && hasString(k) ? t(hass, k) : s.name;
};
const helperOf = (hass: HomeAssistant | undefined, s: HaFormSchema) =>
  s.name === "home_entity" ? F(hass, "help.home") : undefined;

// ---- the elements ---------------------------------------------------------------------------

export const SOURCE_EDITOR = "flow-tree-source-editor";

// one source's form, in its tab: takes the source as `value` and the card it is in as `card`
export class FlowSourceEditor extends FormEditorBase {
  card: FlowCard = "power";
  set value(v: CardConfigBase) {
    this.setConfig(v);
  }
  get value(): CardConfigBase | undefined {
    return this._config;
  }
  _label(s: HaFormSchema) {
    return labelOf(this._hass, s);
  }
  // how a battery or a grid without its sensors yet is measured: as last chosen here (the
  // config cannot say it), so the form shows that way's fields
  _measure?: string;
  _schemaInputs() {
    return this._measure ?? null;
  }
  _toForm(config: Raw) {
    return sourceToForm(config, this.card, this._measure);
  }
  _fromForm(data: HaFormData, prev: Raw) {
    const next = sourceFromForm(data, prev, this.card, this._measure);
    if (typeof data.measure === "string") this._measure = data.measure;
    return next;
  }
  _schema(hass: HomeAssistant, data: HaFormData) {
    return sourceSchema(hass, data, this.card, this._config);
  }
}

export abstract class FlowCardEditor extends CardsEditorBase {
  abstract card: FlowCard;
  _listKey = "sources";
  _childCode = false;
  // the next source a home usually has: solar, then a battery, then the grid
  _newCard(): CardConfigBase {
    const have = new Set(this._cards.map((s) => typeOf(s as Raw)));
    return { type: TYPES.find((t) => !have.has(t)) ?? "solar" } as CardConfigBase;
  }
  _none() {
    const p = super._none();
    (p as unknown as HTMLElement).textContent = F(this._hass, "none");
    return p;
  }
  _cardName(s: CardConfigBase) {
    const name = (s as Raw).name;
    return typeof name === "string" && name
      ? name
      : t(this._hass, `power.${typeOf(s as Raw)}` as StringKey);
  }
  _childEditor(at: number): CardElementEditor {
    const ed = document.createElement(SOURCE_EDITOR) as FlowSourceEditor;
    ed.card = this.card;
    ed.addEventListener("config-changed", (ev) => {
      ev.stopPropagation();
      const config = (ev as CustomEvent).detail?.config as CardConfigBase | undefined;
      if (!config || same(config, this._cards[at])) return;
      const all = this._cards;
      all[at] = config;
      this._setCards(all);
    });
    return ed as unknown as CardElementEditor;
  }
  _label(s: HaFormSchema) {
    return labelOf(this._hass, s);
  }
  _helper(s: HaFormSchema) {
    return helperOf(this._hass, s);
  }
  _optionsSchema(hass: HomeAssistant | undefined, data: HaFormData) {
    return flowSchema(hass, data, this.card);
  }
  _optionsToForm(config: CardConfigBase) {
    return flowToForm(config as Raw, this.card);
  }
  _optionsFromForm(data: HaFormData, prev: CardConfigBase) {
    return flowFromForm(data, prev as Raw, this.card) as CardConfigBase;
  }
}
export class PowerFlowCardEditor extends FlowCardEditor {
  card: FlowCard = "power";
}
export class EnergyFlowCardEditor extends FlowCardEditor {
  card: FlowCard = "energy";
}
