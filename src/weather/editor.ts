// Visual editor of the weather card (FormEditorBase): its entity, then its options in sections, its
// sections a list (each in a view of its own, in a form of its type: the lead (hero), a forecast, a
// trend or an entity group; a new one the lead first); without sections the card is a tile. Both forms
// write back only what they changed: a part as the config had it keeps its spelling, a value at
// its default writes nothing. The badges, the rules (a tile's: their text is `status`), a trend's lines
// and an entity group's entities are lists, each item in a view of its own. An entity group
// (deprecated until 4.0: a tile group beside the card instead) still edits; "+" no longer makes one.
import { FormEditorBase, setOrDrop } from "../shared/editor.ts";
import type { CardConfigBase, HaFormData, HaFormSchema, HomeAssistant } from "../shared/ha.ts";
import { hasString, t, type StringKey } from "../shared/i18n.ts";
import {
  RULE_KEYS,
  badgesFromForm,
  badgesToForm,
  listFromForm,
  listToForm,
} from "../shared/kinds/editor-form.ts";
import { ICONS } from "../shared/kinds/editor-schema.ts";
import type { ItemType, RuleReads } from "../shared/kinds/item-views.ts";
import { DEFAULTS, QUANTITIES, TREND_LAYOUTS } from "./constants.ts";

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const empty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && !v.length) ||
  (isObj(v) && !Object.keys(v).length);

// a label of the weather editor's own words, else the shared ones
const W = (hass: HomeAssistant | undefined, key: string) =>
  t(hass, `editor.weather.${key}` as StringKey);

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
const num = (name: string, min: number, max: number) => ({
  name,
  selector: { number: { mode: "box", min, max, step: 1 } },
});

// ---- the rules: the condition's (its states) and the temperature's (a number in its unit) ----
// a rule's text is its `status`, as on the tile; a rule's `label` (deprecated until 4.0) is shown as
// it, and written as `status` once the rules change
const rulesToForm = (v: unknown) =>
  listToForm(
    Array.isArray(v)
      ? v.map((r) => {
          if (!isObj(r) || r.label === undefined || r.status !== undefined) return r;
          const { label, ...rest } = r;
          return { ...rest, status: label };
        })
      : v,
    RULE_KEYS,
  );
const rulesFromForm = (v: unknown) => listFromForm(v, RULE_KEYS, null);
const tempUnit = (hass: HomeAssistant | undefined, entity: string) => {
  const u = entity ? hass?.states[entity]?.attributes.temperature_unit : undefined;
  return typeof u === "string" ? u : "";
};
export const weatherRuleReads = (
  hass: HomeAssistant | undefined,
  entity: string,
  key: string,
): RuleReads =>
  key === "temperature_rules"
    ? { entity, unit: tempUnit(hass, entity), numeric: true, flavor: "card" }
    : { entity, unit: "", numeric: false, flavor: "card" };
const rulesFields = (hass: HomeAssistant | undefined, entity: string): HaFormSchema[] => [
  { name: "rules", selector: { pro_cards_rules: { key: "rules", entity, unit: "" } } },
  {
    name: "temperature_rules",
    selector: {
      pro_cards_rules: { key: "temperature_rules", entity, unit: tempUnit(hass, entity) },
    },
  },
];

// the condition icons: Home Assistant's pictures, mdi icons, or a map of the card's own (YAML)
const iconsToForm = (v: unknown) => (isObj(v) ? "custom" : v === "mdi" ? "mdi" : "hass");
const iconsSelect = (hass: HomeAssistant | undefined, written: unknown) =>
  select("icons", isObj(written) ? ["hass", "mdi", "custom"] : ["hass", "mdi"], (v) =>
    W(hass, `icons.${v}`),
  );
// the form's value back: the pictures are the default; "custom" keeps the map as written
const putIcons = (c: Raw, v: unknown) => {
  if (v === "custom") return;
  setOrDrop(c, "icons", v, !v || v === "hass");
};

// ---- the card's own options ----------------------------------------------------------------

const ALIGNS = ["start", "center", "end", "stretch", "space-between"] as const;
const TEXTS = ["entity", "name", "secondary", "title", "icon", "color"] as const;

export const weatherToForm = (c: Raw): HaFormData => {
  const d: HaFormData = {};
  for (const k of TEXTS) d[k] = typeof c[k] === "string" ? c[k] : "";
  d.icon_style = c.icon_style === "plain" ? "plain" : "circle";
  d.decimals = typeof c.decimals === "number" ? c.decimals : undefined;
  d.icon_size = typeof c.icon_size === "number" ? c.icon_size : DEFAULTS.tileIconSize;
  d.icons = iconsToForm(c.icons);
  d.columns = typeof c.columns === "number" ? c.columns : undefined;
  d.align = typeof c.align === "string" ? c.align : "";
  if (c.title_tap_action !== undefined && c.title_tap_action !== null)
    d.title_tap_action = c.title_tap_action;
  d.badges = badgesToForm(c.badges);
  d.rules = rulesToForm(c.rules);
  d.temperature_rules = rulesToForm(c.temperature_rules);
  return d;
};

export const weatherFromForm = (data: HaFormData, prev: Raw): Raw => {
  const c: Raw = { ...prev };
  const was = weatherToForm(prev);
  const changed = (k: string) => !same(data[k], was[k]);
  for (const k of TEXTS) if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  if (changed("icon_style"))
    setOrDrop(c, "icon_style", data.icon_style, !data.icon_style || data.icon_style === "circle");
  for (const k of ["decimals", "columns"])
    if (changed(k))
      setOrDrop(c, k, Number(data[k]), empty(data[k]) || !Number.isFinite(Number(data[k])));
  if (changed("icon_size"))
    setOrDrop(
      c,
      "icon_size",
      Number(data.icon_size),
      empty(data.icon_size) || Number(data.icon_size) === DEFAULTS.tileIconSize,
    );
  if (changed("icons")) putIcons(c, data.icons);
  for (const k of ["align", "title_tap_action"])
    if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  for (const k of ["rules", "temperature_rules"])
    if (changed(k)) {
      const rules = rulesFromForm(data[k]);
      setOrDrop(c, k, rules, !rules.length);
    }
  if (changed("badges")) {
    const badges = badgesFromForm(data.badges, prev.badges);
    setOrDrop(c, "badges", badges, !badges.length);
  }
  return c;
};

// an entity section in the card, or the defaults for them written
const hasGroups = (c: Raw) =>
  c.columns !== undefined ||
  c.align !== undefined ||
  (Array.isArray(c.sections) && c.sections.some((x) => isObj(x) && kindOf(x) === "entities"));

export const weatherSchema = (
  hass: HomeAssistant | undefined,
  written: Raw = {},
): HaFormSchema[] => {
  const entity = typeof written.entity === "string" ? written.entity : "";
  const T = (k: string) => t(hass, k as StringKey);
  return [
    { name: "entity", selector: { entity: { filter: { domain: "weather" } } } },
    // the tile's texts (open: the fields changed most), the header's above the sections
    {
      ...section(T("editor.card.field.name"), ICONS.name, [
        grid(
          { name: "name", selector: { text: {} } },
          { name: "secondary", selector: { text: {} } },
        ),
      ]),
      expanded: true,
    } as HaFormSchema,
    section(T("editor.card.section.header"), ICONS.content, [
      grid({ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
    ]),
    section(T("editor.card.section.look"), ICONS.look, [
      grid(
        { name: "color", selector: { ui_color: {} } },
        select("icon_style", ["circle", "plain"], (v) => T(`editor.card.style.${v}`)),
      ),
      grid(iconsSelect(hass, written.icons), num("icon_size", 12, 160), num("decimals", 0, 3)),
    ]),
    section(W(hass, "section.sections"), ICONS.layout, [
      {
        name: "sections",
        selector: { pro_cards_list: { key: "sections", of: "section", hide_label: true } },
      },
    ]),
    // the entity sections' defaults, while the card has some or writes them (until 4.0)
    ...(hasGroups(written)
      ? [
          section(W(hass, "section.groups"), ICONS.layout, [
            grid(
              num("columns", 1, 4),
              select("align", ALIGNS, (v) => W(hass, `align.${v}`)),
            ),
          ]),
        ]
      : []),
    section(T("editor.card.field.badges"), ICONS.badges, [
      { name: "badges", selector: { pro_cards_badges: { entity, hide_label: true } } },
    ]),
    section(T("editor.card.section.rules"), ICONS.rules, rulesFields(hass, entity)),
    section(T("editor.card.section.actions"), ICONS.actions, [
      { name: "title_tap_action", selector: { ui_action: { default_action: "none" } } },
    ]),
  ];
};

// ---- a section ------------------------------------------------------------------------------

const GROUPS = ["row", "list", "table", "grid", "column"] as const;
const KINDS = ["hero", "forecast", "trend", "entities"] as const;
type Kind = (typeof KINDS)[number];
const isGroup = (v: unknown) => (GROUPS as readonly unknown[]).includes(v);

export const kindOf = (s: Raw): Kind =>
  s.type === "hero" || s.type === "forecast" || s.type === "trend" ? s.type : "entities";
// an entity group's layout: its `type` (row …), or `layout` without a type, as written
const groupLayoutOf = (s: Raw) =>
  isGroup(s.type) ? (s.type as string) : isGroup(s.layout) ? (s.layout as string) : "list";

// a trend's lines: a quantity, or a quantity with its name and colour
const linesToForm = (v: unknown): Raw[] =>
  (Array.isArray(v) ? v : DEFAULTS.trendShow).map((x) =>
    typeof x === "string" ? { quantity: x } : isObj(x) ? { ...x } : {},
  );
const linesFromForm = (v: unknown): unknown[] =>
  (Array.isArray(v) ? (v as Raw[]) : []).flatMap((x) => {
    if (!x.quantity) return [];
    const o: Raw = { quantity: x.quantity };
    if (x.name) o.name = x.name;
    if (x.color) o.color = x.color;
    return Object.keys(o).length === 1 ? [o.quantity] : [o];
  });

// an entity group's entities: an entity, an attribute of the weather entity (a name without a dot),
// or an entity item (its entity, else the weather entity's attribute), each in a view of its own
const GROUP_KEYS = ["entity", "attribute", "name", "icon"] as const;
export const groupEntitiesToForm = (v: unknown): Raw[] =>
  (Array.isArray(v) ? v : []).map((x) =>
    typeof x === "string"
      ? x.includes(".")
        ? { entity: x }
        : { attribute: x }
      : (listToForm([x], GROUP_KEYS)[0] ?? {}),
  );
export const groupEntitiesFromForm = (v: unknown): unknown[] =>
  listFromForm(v, GROUP_KEYS, null).map((o) => {
    const x = o as Raw;
    const ks = Object.keys(x);
    return ks.length === 1 && (ks[0] === "entity" || ks[0] === "attribute") ? x[ks[0]] : x;
  });

export const sectionToForm = (s: Raw): HaFormData => {
  const kind = kindOf(s);
  const d: HaFormData = {
    kind,
    title: typeof s.title === "string" ? s.title : "",
    divider: s.divider === true,
  };
  if (kind === "hero") {
    d.name = typeof s.name === "string" ? s.name : "";
    d.secondary = typeof s.secondary === "string" ? s.secondary : "";
  }
  if (kind === "forecast" || kind === "trend") {
    d.mode = s.mode === "hourly" ? "hourly" : "daily";
    d.days = typeof s.days === "number" ? s.days : DEFAULTS.days;
    d.hours = typeof s.hours === "number" ? s.hours : DEFAULTS.hours;
  }
  if (kind === "hero" || kind === "forecast") {
    const dflt = kind === "hero" ? DEFAULTS.heroIconSize : DEFAULTS.forecastIconSize;
    d.icon_size = typeof s.icon_size === "number" ? s.icon_size : dflt;
    d.icons = iconsToForm(s.icons);
  }
  if (kind === "forecast") {
    d.forecast_layout = s.layout === "horizontal" ? "horizontal" : "vertical";
    const show: unknown[] = Array.isArray(s.show) ? s.show : [...DEFAULTS.rainFigures];
    d.rain_probability = show.includes("probability");
    d.rain_amount = show.includes("precipitation");
  }
  if (kind === "trend") {
    d.lines = linesToForm(s.show);
    d.trend_layout = typeof s.layout === "string" ? s.layout : "auto";
    d.x_axis = s.x_axis !== false;
    d.y_axis = s.y_axis === true;
    d.show_legend = s.show_legend !== false;
  }
  if (kind !== "entities") {
    d.rules = rulesToForm(s.rules);
    d.temperature_rules = rulesToForm(s.temperature_rules);
  } else {
    d.group_layout = groupLayoutOf(s);
    d.entities = groupEntitiesToForm(s.entities);
    d.columns = typeof s.columns === "number" ? s.columns : undefined;
    d.align = typeof s.align === "string" ? s.align : "";
    for (const k of ["show_name", "show_value", "show_icon"]) d[k] = s[k] !== false;
  }
  return d;
};

// a section of another type: what both types take stays (title, divider, visibility)
const newSection = (kind: Kind, prev: Raw): Raw => {
  const keep: Raw = {};
  for (const k of ["title", "divider", "visibility"]) if (prev[k] !== undefined) keep[k] = prev[k];
  if (kind !== "entities") return { type: kind, ...keep };
  // an entity group starts with two of the weather entity's attributes
  const entities = Array.isArray(prev.entities) ? prev.entities : ["humidity", "pressure"];
  return { type: "list", ...keep, entities };
};

export const sectionFromForm = (data: HaFormData, prev: Raw): Raw => {
  const was = sectionToForm(prev);
  const changed = (k: string) => !same(data[k], was[k]);
  const kind = (data.kind as Kind) ?? was.kind;
  if (kind !== was.kind) return newSection(kind, prev);
  const c: Raw = { ...prev };
  for (const k of ["title", "name", "secondary", "align"])
    if (changed(k)) setOrDrop(c, k, data[k], empty(data[k]));
  if (changed("divider")) setOrDrop(c, "divider", true, data.divider !== true);
  if (changed("mode")) setOrDrop(c, "mode", data.mode, !data.mode || data.mode === "daily");
  for (const [k, dflt] of [
    ["days", DEFAULTS.days],
    ["hours", DEFAULTS.hours],
    ["icon_size", kind === "hero" ? DEFAULTS.heroIconSize : DEFAULTS.forecastIconSize],
  ] as const)
    if (changed(k)) {
      const v = Number(data[k]);
      setOrDrop(c, k, v, empty(data[k]) || !Number.isFinite(v) || v === dflt);
    }
  if (changed("columns"))
    setOrDrop(c, "columns", Number(data.columns), empty(data.columns) || !Number(data.columns));
  if (changed("icons")) putIcons(c, data.icons);
  for (const k of ["rules", "temperature_rules"])
    if (changed(k)) {
      const rules = rulesFromForm(data[k]);
      setOrDrop(c, k, rules, !rules.length);
    }
  if (kind === "forecast") {
    if (changed("forecast_layout"))
      setOrDrop(c, "layout", data.forecast_layout, data.forecast_layout !== "horizontal");
    // the rain figures, in their order; the chance of rain alone is the default
    if (changed("rain_probability") || changed("rain_amount")) {
      const show = [
        ...(data.rain_probability === true ? ["probability"] : []),
        ...(data.rain_amount === true ? ["precipitation"] : []),
      ];
      setOrDrop(c, "show", show, same(show, DEFAULTS.rainFigures));
    }
  }
  if (kind === "trend") {
    if (changed("trend_layout"))
      setOrDrop(c, "layout", data.trend_layout, !data.trend_layout || data.trend_layout === "auto");
    if (changed("lines")) {
      const lines = linesFromForm(data.lines);
      setOrDrop(c, "show", lines, !lines.length || same(lines, DEFAULTS.trendShow));
    }
    if (changed("x_axis")) setOrDrop(c, "x_axis", false, data.x_axis !== false);
    if (changed("y_axis")) setOrDrop(c, "y_axis", true, data.y_axis !== true);
    if (changed("show_legend")) setOrDrop(c, "show_legend", false, data.show_legend !== false);
  }
  if (kind === "entities") {
    // the layout as it was written: `type: row`, or `layout: row` without a type
    if (changed("group_layout")) {
      if (prev.type === undefined && prev.layout !== undefined) c.layout = data.group_layout;
      else c.type = data.group_layout;
    }
    // (an entity group has one at least: the last one deleted leaves them as written)
    if (changed("entities")) {
      const entities = groupEntitiesFromForm(data.entities);
      if (entities.length) c.entities = entities;
    }
    for (const k of ["show_name", "show_value", "show_icon"])
      if (changed(k)) setOrDrop(c, k, false, data[k] !== false);
  }
  return c;
};

export const sectionSchema = (
  hass: HomeAssistant | undefined,
  data: HaFormData,
  written: Raw = {},
  // the weather card's entity (what its rules and an entity group read)
  entity = "",
): HaFormSchema[] => {
  const kind = data.kind as Kind;
  const L = (k: string) => W(hass, k);
  // (an entity section is offered only to the one that is one: it goes in 4.0)
  const kinds = KINDS.filter((k) => k !== "entities" || kind === "entities");
  const head: HaFormSchema[] = [
    select("kind", kinds, (v) => L(`kind.${v}`)),
    grid({ name: "title", selector: { text: {} } }, { name: "divider", selector: { boolean: {} } }),
  ];
  const window: HaFormSchema[] = [
    grid(
      select("mode", ["daily", "hourly"], (v) => L(`mode.${v}`)),
      data.mode === "hourly"
        ? num("hours", 1, DEFAULTS.maxHours)
        : num("days", 1, DEFAULTS.maxDays),
    ),
  ];
  const rules = section(
    t(hass, "editor.card.section.rules"),
    ICONS.rules,
    rulesFields(hass, entity),
  );
  if (kind === "hero")
    return [
      ...head,
      grid({ name: "name", selector: { text: {} } }, { name: "secondary", selector: { text: {} } }),
      grid(iconsSelect(hass, written.icons), num("icon_size", 12, 160)),
      rules,
    ];
  if (kind === "forecast")
    return [
      ...head,
      ...window,
      select("forecast_layout", ["vertical", "horizontal"], (v) => L(`forecast_layout.${v}`)),
      grid(
        { name: "rain_probability", selector: { boolean: {} } },
        { name: "rain_amount", selector: { boolean: {} } },
      ),
      grid(iconsSelect(hass, written.icons), num("icon_size", 12, 160)),
      rules,
    ];
  if (kind === "trend")
    return [
      ...head,
      ...window,
      section(L("field.lines"), ICONS.chart, [
        {
          name: "lines",
          selector: { pro_cards_list: { key: "lines", of: "quantity", hide_label: true } },
        },
      ]),
      select("trend_layout", TREND_LAYOUTS, (v) =>
        t(hass, `editor.multi_trend.layout.${v}` as StringKey),
      ),
      grid(
        { name: "x_axis", selector: { boolean: {} } },
        { name: "y_axis", selector: { boolean: {} } },
        { name: "show_legend", selector: { boolean: {} } },
      ),
      rules,
    ];
  return [
    ...head,
    grid(
      select("group_layout", GROUPS, (v) => L(`group_layout.${v}`)),
      ...(data.group_layout === "grid" ? [num("columns", 1, 4)] : []),
    ),
    section(L("field.entities"), ICONS.content, [
      {
        name: "entities",
        selector: { pro_cards_list: { key: "entities", of: "entity", entity, hide_label: true } },
      },
    ]),
    select("align", ALIGNS, (v) => L(`align.${v}`)),
    grid(
      { name: "show_name", selector: { boolean: {} } },
      { name: "show_value", selector: { boolean: {} } },
      { name: "show_icon", selector: { boolean: {} } },
    ),
  ];
};

// ---- the labels -----------------------------------------------------------------------------

export const WEATHER_LABELS: Record<string, StringKey> = {
  entity: "editor.card.field.entity",
  name: "editor.card.field.name",
  secondary: "editor.card.field.secondary",
  title: "editor.cards.field.title",
  icon: "editor.cards.field.icon",
  color: "editor.card.field.color",
  icon_style: "editor.card.field.icon_style",
  decimals: "editor.card.field.decimals",
  badges: "editor.card.field.badges",
  sections: "editor.weather.section.sections",
  title_tap_action: "editor.cards.field.title_tap_action",
  columns: "editor.cards.field.columns",
  show_name: "editor.card.field.show_name",
  show_value: "editor.card.field.show_value",
  x_axis: "editor.multi_trend.x_axis",
  y_axis: "editor.multi_trend.y_axis",
  show_legend: "editor.multi_trend.show_legend",
  trend_layout: "editor.multi_trend.layout",
  ...Object.fromEntries(
    [
      "icons",
      "icon_size",
      "align",
      "rules",
      "temperature_rules",
      "kind",
      "divider",
      "mode",
      "days",
      "hours",
      "forecast_layout",
      "rain_probability",
      "rain_amount",
      "lines",
      "group_layout",
      "entities",
      "show_icon",
    ].map((k) => [k, `editor.weather.field.${k}` as StringKey]),
  ),
};
const labelOf = (hass: HomeAssistant | undefined, s: HaFormSchema) => {
  const k = WEATHER_LABELS[s.name];
  return k && hasString(k) ? t(hass, k) : s.name;
};

// ---- the items in views of their own: a trend's line, an entity group's entity ---------------

const lineType = (hass: () => HomeAssistant | undefined): ItemType => ({
  schema: (h) => [
    { ...select("quantity", QUANTITIES, (v) => W(h, `quantity.${v}`)), required: true },
    grid({ name: "name", selector: { text: {} } }, { name: "color", selector: { ui_color: {} } }),
  ],
  create: () => ({}),
  isEmpty: (item) => !item.quantity,
  label: (name) =>
    name === "quantity"
      ? W(hass(), "field.quantity")
      : t(hass(), `editor.card.field.${name}` as StringKey),
  title: (index, item) => {
    const q =
      typeof item.quantity === "string" ? ` · ${W(hass(), `quantity.${item.quantity}`)}` : "";
    return `${t(hass(), "editor.card.line_title", { n: String(index + 1) })}${q}`;
  },
});
// (the weather entity's attributes where it names no entity)
const groupEntityType = (
  hass: () => HomeAssistant | undefined,
  weather: () => string,
): ItemType => ({
  schema: (_h, item) => {
    const reads = (typeof item.entity === "string" && item.entity) || weather();
    return [
      { name: "entity", selector: { entity: {} }, ...(weather() ? { default: weather() } : {}) },
      ...(reads ? [{ name: "attribute", selector: { attribute: { entity_id: reads } } }] : []),
      grid({ name: "name", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
      {
        ...section(t(hass(), "editor.card.section.advanced"), ICONS.code, [
          { name: "more", selector: { object: {} } },
        ]),
        expanded: false,
      } as HaFormSchema,
    ];
  },
  create: () => ({}),
  label: (name) => t(hass(), `editor.card.field.${name}` as StringKey),
  helper: (name) => (name === "entity" ? W(hass(), "help.entity") : undefined),
  title: (index, item) => {
    const id = typeof item.entity === "string" ? item.entity : "";
    const shown =
      (typeof item.name === "string" && item.name) ||
      (id && String(hass()?.states[id]?.attributes.friendly_name ?? id)) ||
      (typeof item.attribute === "string" ? item.attribute : "");
    return `${t(hass(), "editor.card.entity_title", { n: String(index + 1) })}${shown ? ` · ${shown}` : ""}`;
  },
});

// ---- the elements ---------------------------------------------------------------------------

// a section in a view of its own: the section as written travels with its form (`__written`), so
// what the form does not show stays, and its spelling
const sectionItem = (written: Raw): Raw => ({ ...sectionToForm(written), __written: written });
export const sectionsToForm = (v: unknown): Raw[] =>
  (Array.isArray(v) ? v : []).map((x) => sectionItem(isObj(x) ? x : {}));
export const sectionsFromForm = (v: unknown): Raw[] =>
  (Array.isArray(v) ? (v as Raw[]) : []).map((x) => (isObj(x.__written) ? x.__written : {}));
const sectionType = (
  hass: () => HomeAssistant | undefined,
  weather: () => string,
  // the sections the card has: a new one is the lead first, then a forecast
  have: () => number,
): ItemType => ({
  schema: (h, item) =>
    sectionSchema(h, item, isObj(item.__written) ? item.__written : {}, weather()),
  create: () => sectionItem({ type: have() ? "forecast" : "hero" }),
  isEmpty: () => false,
  label: (name) => labelOf(hass(), { name } as HaFormSchema),
  title: (_index, item) => {
    const kind = W(hass(), `kind.${String(item.kind ?? "entities")}`);
    const title = typeof item.title === "string" && item.title ? ` · ${item.title}` : "";
    return `${kind}${title}`;
  },
  fromForm: (data) => {
    const { __written, ...form } = data;
    return sectionItem(sectionFromForm(form, isObj(__written) ? __written : {}));
  },
});

export class WeatherCardEditor extends FormEditorBase {
  _label(s: HaFormSchema) {
    return labelOf(this._hass, s);
  }
  _helper(s: HaFormSchema) {
    return s.name === "columns" || s.name === "align" ? W(this._hass, "help.groups") : undefined;
  }
  // the card's and a section's rules read the weather entity
  _ruleReads(key: string) {
    return weatherRuleReads(this._hass, this._cardEntity(), key);
  }
  _itemTypes() {
    const sections = () => {
      const v = (this._config as Raw | undefined)?.sections;
      return Array.isArray(v) ? v.length : 0;
    };
    return {
      sections: sectionType(
        () => this._hass,
        () => this._cardEntity(),
        sections,
      ),
      lines: lineType(() => this._hass),
      entities: groupEntityType(
        () => this._hass,
        () => this._cardEntity(),
      ),
    };
  }
  _toForm(config: CardConfigBase) {
    return { ...weatherToForm(config as Raw), sections: sectionsToForm((config as Raw).sections) };
  }
  // (an empty list of sections is left out: the card is a tile)
  _fromForm(data: HaFormData, prev: CardConfigBase) {
    const { sections, ...rest } = data;
    const c = weatherFromForm(rest, prev as Raw);
    if (!same(sections, sectionsToForm((prev as Raw).sections))) {
      const list = sectionsFromForm(sections);
      setOrDrop(c, "sections", list, !list.length);
    }
    return c as CardConfigBase;
  }
  _schema(hass: HomeAssistant) {
    return weatherSchema(hass, (this._config ?? {}) as Raw);
  }
}
