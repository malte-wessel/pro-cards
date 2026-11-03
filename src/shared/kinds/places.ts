// The two places of a card that draws a kind (pure): its `icon`, and its `visual` (what fills the
// card besides the icon and the texts: behind them or below them). Each place takes one thing, by
// its name or as `{ type, …options }`, or false for nothing; a place left out is the kind's
// default. An object without `type` merges its options onto what the place draws (the kind's
// default on the card, the card's in a rule, the group's on a tile in a group); one with a `type`
// replaces it. `icon` as a string is always the icon's name.
import { ICON_STYLES, type IconStyle } from "../entity/constants.ts";
import { RAIN_STYLES } from "../rain/constants.ts";
import { FLOW_STYLES } from "../wind/constants.ts";
import { oneOf } from "../util.ts";

export const ICON_THINGS = ["icon", "image", "flow"] as const;
export type IconThing = (typeof ICON_THINGS)[number];
// behind the texts, and below them
export const BEHIND = ["glow", "image", "flow", "cover", "path", "line"] as const;
export const BELOW = ["sparkline", "columns", "strip", "bar", "gauge", "segments", "sun"] as const;
export const VISUAL_THINGS = [...BEHIND, ...BELOW] as const;
export type VisualThing = (typeof VISUAL_THINGS)[number];
// the history plots, which read a window of the past
export const HISTORY_THINGS: readonly VisualThing[] = ["sparkline", "columns", "strip"];
// what only a kind draws: it fits the kinds that draw it (Kind.draws)
export const KIND_THINGS: readonly string[] = ["flow", "sun", "cover", "path", "line"];
export const FLOW_ALL = [...FLOW_STYLES, ...RAIN_STYLES] as const;
export type FlowStyleAny = (typeof FLOW_ALL)[number];
// a cover's drawings (its device class picks one by default)
export const COVER_VARIANTS = [
  "shutter",
  "blind",
  "curtain",
  "garage",
  "gate",
  "awning",
  "window",
] as const;
export type CoverVariant = (typeof COVER_VARIANTS)[number];
// the drawings of the things that have more than one: the wind's or the rain's flow, a cover
const VARIANTS = [...FLOW_ALL, ...COVER_VARIANTS] as const;
export type Variant = (typeof VARIANTS)[number];

export interface IconPlace {
  type?: IconThing;
  name?: string;
  ring?: boolean;
  // the circle or none, whatever it draws
  style?: IconStyle;
  // which drawing of the thing (a flow's: dots, lines, swoosh …)
  variant?: FlowStyleAny;
  src?: string;
  // resolved only: the place emptied (icon: false, the card's or a rule's)
  hidden?: boolean;
  // the icon's own actions (as written: the card parses them), and the badge on it (a tile's)
  tap_action?: unknown;
  hold_action?: unknown;
  double_tap_action?: unknown;
  badge?: unknown;
}
export interface VisualPlace {
  type?: VisualThing;
  // a picture (image: a URL, a template or an entity), or another entity's history (a plot)
  src?: string;
  opacity?: number;
  tint?: string;
  blur?: number;
  // which drawing of the thing (a flow's: lines, drops …; a cover's: blind, garage …)
  variant?: Variant;
  // the window: hours, or today (since midnight); a bucket's minutes; the plot's axes; the line's
  // smoothing in minutes
  hours?: number | "today";
  bucket?: number;
  axis?: boolean;
  smoothing?: number;
}
// a place as written: left out (undefined), none (false) or its thing
export type Written<P> = P | false | undefined;

// the options each thing takes
// what every icon takes, whatever it draws: its own actions and the badge on it
const ICON_ALL = ["tap_action", "hold_action", "double_tap_action", "badge"];
export const ICON_OPTIONS: Record<IconThing, readonly string[]> = {
  icon: ["name", "ring", "style", ...ICON_ALL],
  // its name: the icon while there is no picture
  image: ["src", "ring", "style", "name", ...ICON_ALL],
  flow: ["variant", "style", ...ICON_ALL],
};
const PLOT = ["hours", "bucket", "src"];
export const VISUAL_OPTIONS: Record<VisualThing, readonly string[]> = {
  glow: [],
  image: ["src", "opacity", "tint", "blur"],
  flow: ["variant"],
  sparkline: [...PLOT, "axis", "smoothing"],
  columns: [...PLOT, "axis"],
  strip: PLOT,
  bar: [],
  gauge: [],
  segments: [],
  sun: ["hours"],
  cover: ["variant"],
  path: [],
  line: [],
};
// what a rule may not set: a visual's data (a rule that matches must not fetch another history)
// and not what a tap does: a matching rule changes how the card looks
const DATA_OPTIONS = [
  "hours",
  "bucket",
  "smoothing",
  "tap_action",
  "hold_action",
  "double_tap_action",
];
// the blur of a picture behind the card that says `blur: true`, and of the kind's own photo
export const IMAGE_BLUR = 20;

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const list = (xs: readonly string[]) => xs.join(", ");

// one option's value, checked
const optionOf = (k: string, v: unknown, at: string): unknown => {
  const fail = (what: string) => {
    throw new Error(`${at}: ${k} ${what}`);
  };
  switch (k) {
    case "name":
    case "src":
    case "tint":
      if (typeof v !== "string" || !v) fail("must be a text");
      return v;
    case "ring":
    case "axis":
      if (typeof v !== "boolean") fail("must be true or false");
      return v;
    case "opacity":
      if (typeof v !== "number" || v < 0 || v > 1) fail("must be a number from 0 to 1");
      return v;
    case "blur":
      if (v === true) return IMAGE_BLUR;
      if (v === false) return 0;
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0)
        fail("must be true, false or a number of px");
      return v;
    case "hours":
      if (v === "today") return v;
      if (typeof v !== "number" || !(v > 0)) fail("must be a number of hours or today");
      return v;
    case "bucket":
    case "smoothing":
      if (typeof v !== "number" || !(v >= 5)) fail("must be a number of minutes, at least 5");
      return v;
    case "style":
      if (!oneOf(ICON_STYLES, v)) fail(`must be one of ${list(ICON_STYLES)}`);
      return v;
    case "variant":
      if (!oneOf(VARIANTS, v)) fail(`must be one of ${list(VARIANTS)}`);
      return v;
  }
  return v;
};

// the options of a written object, checked against what its thing takes (all of the place's
// things when it names none: it merges onto whatever the place draws)
const optionsOf = (
  o: Record<string, unknown>,
  allowed: readonly string[],
  at: string,
  thing: string | undefined,
  rule: boolean,
) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "type" || v === undefined) continue;
    if (!allowed.includes(k))
      throw new Error(
        thing
          ? `${at}: ${thing} takes ${allowed.length ? list(allowed) : "no options"}, not ${k}`
          : `${at}: ${k} is no option here (${list(allowed)})`,
      );
    if (rule && DATA_OPTIONS.includes(k))
      throw new Error(
        `${at}: a rule sets no ${k} (it is the card's: ${k.endsWith("_action") ? "a rule changes the look, not what a tap does" : "a rule must not fetch history"})`,
      );
    out[k] = optionOf(k, v, at);
  }
  return out;
};

// `icon` as written: a name (a string), or the place's thing and its options; `at` names the place
// in messages. A rule's icon is read the same way
export const parseIcon = (raw: unknown, at: string, rule = false): Written<IconPlace> => {
  if (raw === undefined || raw === null) return undefined;
  if (raw === false) return false;
  // a name is an icon's: it makes the place an icon (over a photo or an animation too)
  if (typeof raw === "string") {
    if (!raw) throw new Error(`${at}: an icon's name must not be empty`);
    return { type: "icon", name: raw };
  }
  if (!isObj(raw)) throw new Error(`${at} takes an icon's name, { type, … } or false`);
  const type = raw.type;
  if (type !== undefined && !oneOf(ICON_THINGS, type))
    throw new Error(`${at}: type must be one of ${list(ICON_THINGS)}, not ${JSON.stringify(type)}`);
  const allowed = type
    ? ICON_OPTIONS[type]
    : ["name", "ring", "style", "src", "variant", ...ICON_ALL];
  const opts = optionsOf(raw, allowed, at, type, rule) as IconPlace;
  if (opts.variant !== undefined && !oneOf(FLOW_ALL, opts.variant))
    throw new Error(`${at}: a flow's variant is one of ${list(FLOW_ALL)}`);
  if (!type && opts.name !== undefined) return { type: "icon", ...opts };
  return type ? { type, ...opts } : opts;
};

// `visual` as written: a thing's name, the thing and its options, or false
export const parseVisual = (raw: unknown, at: string, rule = false): Written<VisualPlace> => {
  if (raw === undefined || raw === null) return undefined;
  if (raw === false) return false;
  if (raw === "none") throw new Error(`${at}: none is false (no visual)`);
  if (typeof raw === "string") {
    if (!oneOf(VISUAL_THINGS, raw))
      throw new Error(`${at} must be one of ${list(VISUAL_THINGS)} or false, not ${raw}`);
    return { type: raw };
  }
  if (!isObj(raw)) throw new Error(`${at} takes a visual's name, { type, … } or false`);
  const type = raw.type;
  if (type !== undefined && !oneOf(VISUAL_THINGS, type))
    throw new Error(
      `${at}: type must be one of ${list(VISUAL_THINGS)}, not ${JSON.stringify(type)}`,
    );
  const all = [...new Set(Object.values(VISUAL_OPTIONS).flat())];
  const opts = optionsOf(raw, type ? VISUAL_OPTIONS[type] : all, at, type, rule) as VisualPlace;
  if (type === "flow" && opts.variant !== undefined && !oneOf(FLOW_ALL, opts.variant))
    throw new Error(`${at}: a flow's variant is one of ${list(FLOW_ALL)}`);
  if (type === "cover" && opts.variant !== undefined && !oneOf(COVER_VARIANTS, opts.variant))
    throw new Error(`${at}: a cover's variant is one of ${list(COVER_VARIANTS)}`);
  if (rule && opts.src !== undefined && type && HISTORY_THINGS.includes(type))
    throw new Error(`${at}: a rule sets no src of a plot (it is the card's history)`);
  return type ? { type, ...opts } : opts;
};

// a place over another: false empties it, a thing of another type replaces it, options merge onto
// what it draws (nothing to merge onto: nothing)
export const mergePlace = <P extends { type?: string }>(
  base: Written<P>,
  over: Written<P>,
): Written<P> => {
  if (over === undefined) return base;
  if (over === false) return false;
  if (over.type && (!base || (base.type && base.type !== over.type))) return over;
  if (!base) return over;
  return { ...base, ...over };
};

// what every icon takes, whatever it draws, carried over when a layer switches the thing (a rule's
// name over the card's photo keeps the card's ring, its plain style, its badge, its actions); a
// thing's own options (a picture's src, a flow's variant) go with it
const iconOver = (base: Written<IconPlace>, over: Written<IconPlace>): Written<IconPlace> => {
  const merged = mergePlace(base, over);
  if (!base || !over || !merged || merged === base || !over.type || base.type === over.type)
    return merged;
  const kept: IconPlace = {};
  for (const k of [
    "ring",
    "style",
    "badge",
    "tap_action",
    "hold_action",
    "double_tap_action",
  ] as const)
    if (base[k] !== undefined && over[k] === undefined)
      (kept as Record<string, unknown>)[k] = base[k];
  return { ...kept, ...merged };
};

// the places a card draws now: the kind's default, the group's, the card's and the matching
// rule's, merged in that order. The animation is drawn in one place: a flow behind the card makes
// the icon the kind's still icon (the wind's arrow)
export const resolvePlaces = (
  layers: { icon: Written<IconPlace>; visual: Written<VisualPlace> }[],
): { icon: IconPlace; visual: VisualPlace | false } => {
  let icon: Written<IconPlace> = undefined,
    visual: Written<VisualPlace> = undefined;
  for (const l of layers) {
    icon = iconOver(icon, l.icon);
    visual = mergePlace(visual, l.visual);
  }
  const v: VisualPlace | false = visual && visual.type ? visual : false;
  // false empties the place: no icon is drawn (the card's or a rule's)
  let i: IconPlace =
    icon === false ? { type: "icon", hidden: true } : { type: "icon", ...(icon ?? {}) };
  if (!i.type) i = { ...i, type: "icon" };
  if (v && v.type === "flow" && i.type === "flow") {
    const { variant: _variant, ...rest } = i;
    void _variant;
    i = { ...rest, type: "icon" };
  }
  return { icon: i, visual: v };
};

// what a card's kind draws in its places where the card says nothing, and the things only some
// kinds draw that it draws (Kind.draws); `who` names it in messages (a light tile)
export interface PlaceDefaults {
  who: string;
  icon: Written<IconPlace>;
  visual: Written<VisualPlace>;
  draws: readonly string[];
}
interface Layer {
  icon: Written<IconPlace>;
  visual: Written<VisualPlace>;
}
// a place under a layer: what it draws once that layer is merged on; null while it is not known
// (a detected kind before its state, and options merged onto it)
const under = <P extends { type?: string }>(
  below: Written<P> | null,
  over: Written<P>,
): Written<P> | null =>
  below !== null ? mergePlace(below, over) : over === false || over?.type ? over : null;
// the options an object without a type writes that do nothing on what it merges onto, as a message
// that names the thing that takes them; null: they all do something (or it is not known yet)
const idleIn = (
  place: "icon" | "visual",
  below: Written<IconPlace | VisualPlace> | null,
  who: string,
  over: Written<IconPlace | VisualPlace>,
  at: string,
  fits: (thing: string) => boolean,
): string | null => {
  if (below === null || !over || over.type) return null;
  const keys = Object.keys(over).filter((k) => (over as Record<string, unknown>)[k] !== undefined);
  if (!keys.length) return null;
  const table: Record<string, readonly string[]> = place === "icon" ? ICON_OPTIONS : VISUAL_OPTIONS;
  // an icon is always some icon: the plain one where nothing names a thing
  const thing = below ? below.type : place === "icon" ? "icon" : undefined;
  const idle = thing ? keys.filter((k) => !table[thing].includes(k)) : keys;
  if (!idle.length) return null;
  const takers = Object.keys(table).filter(
    (t) => fits(t) && idle.every((k) => table[t].includes(k)),
  );
  const hint = takers.length
    ? ` (name the thing that does: ${place}: { type: ${takers.join(" | ")}, ${idle.map((k) => `${k}: …`).join(", ")} })`
    : "";
  return thing
    ? `${at}: ${who}'s ${place} is ${thing}, which takes ${table[thing].length ? list(table[thing]) : "no options"}, not ${list(idle)}${hint}`
    : `${at}: ${who} draws no ${place}, so ${list(idle)} has nothing to change${hint}`;
};
// what the options a card and its rules write merge onto, where some do nothing: options of another
// thing, or options with nothing under them. `kind` is what the card's kind draws (null: not known
// yet, a kind detected from the entity: only what the card's own things decide is checked); the
// card merges onto it, each rule onto the card. `at` names the card in messages
export const idleOptions = (
  kind: PlaceDefaults | null,
  card: Layer,
  rules: Layer[],
  at: string,
): string[] => {
  const out: string[] = [];
  const fits = (t: string) => !KIND_THINGS.includes(t) || !kind || kind.draws.includes(t);
  const check = (
    below: Record<"icon" | "visual", Written<IconPlace | VisualPlace> | null>,
    who: (place: "icon" | "visual") => string,
    over: Layer,
    where: string,
  ) => {
    for (const place of ["icon", "visual"] as const) {
      const msg = idleIn(place, below[place], who(place), over[place], `${where}${place}`, fits);
      if (msg) out.push(msg);
    }
  };
  const kindWho = kind?.who ?? "";
  check(
    { icon: kind ? kind.icon : null, visual: kind ? kind.visual : null },
    () => kindWho,
    card,
    `${at}: `,
  );
  // a rule merges onto the card's places: the card's thing, or the kind's under the card's options
  const below = {
    icon: under(kind ? kind.icon : null, card.icon),
    visual: under(kind ? kind.visual : null, card.visual),
  };
  const who = (place: "icon" | "visual") => {
    const p = card[place];
    return p === false || p?.type ? "the card" : kindWho;
  };
  rules.forEach((r, i) => check(below, who, r, `${at}: rules[${i}].`));
  return out;
};
// the things a card and its rules name that its kind does not draw (a sun's day on a light)
export const unfitThings = (kind: PlaceDefaults, card: Layer, rules: Layer[], at: string) =>
  [card, ...rules].flatMap((l, i) =>
    (["icon", "visual"] as const).flatMap((place) => {
      const p = l[place];
      return p && p.type && KIND_THINGS.includes(p.type) && !kind.draws.includes(p.type)
        ? [`${at}: ${i ? `rules[${i - 1}].` : ""}${place}: ${kind.who} draws no ${p.type}`]
        : [];
    }),
  );

// the keys the places replace, and what they are now, by the value written (an error that names
// the new spelling)
const val = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "…");
export const GONE_KEYS: Record<string, (v: unknown) => string> = {
  poster: (v) => `poster: ${val(v)} is kind: ${val(v)}`,
  image: (v) =>
    v === false
      ? "image: false is visual: false"
      : `image is visual: { type: image, src: ${val(v)} }`,
  image_opacity: (v) => `image_opacity is visual: { type: image, opacity: ${val(v)} }`,
  image_tint: (v) => `image_tint is visual: { type: image, tint: ${val(v)} }`,
  image_blur: (v) => `image_blur is visual: { type: image, blur: ${val(v)} }`,
  icon_image: (v) => `icon_image is icon: { type: image, src: ${val(v)} }`,
  show_entity_picture: (v) =>
    v === false
      ? "show_entity_picture: false is icon: { type: icon }"
      : "show_entity_picture: true is icon: { type: image }",
  icon_ring: (v) => `icon_ring: ${v !== false} is icon: { ring: ${v !== false} }`,
  icon_style: (v) => `icon_style: ${val(v)} is icon: { style: ${val(v)} }`,
  show_icon: (v) =>
    v === false
      ? "show_icon: false is icon: false"
      : "show_icon is gone: the icon shows unless icon: false",
  show_picture: (v) =>
    v === false
      ? "show_picture: false is visual: false"
      : "show_picture is gone: the kind's visual shows by default (visual: false leaves it out)",
  hours_to_show: (v) => `hours_to_show is visual: { hours: ${val(v)} }`,
  bucket_minutes: (v) => `bucket_minutes is visual: { bucket: ${val(v)} }`,
  smoothing_minutes: (v) => `smoothing_minutes is visual: { smoothing: ${val(v)} }`,
  name_position: () => "name_position is gone: the name is above the value",
  icon_tap_action: () => "icon_tap_action is icon: { tap_action: … }",
  icon_hold_action: () => "icon_hold_action is icon: { hold_action: … }",
  icon_double_tap_action: () => "icon_double_tap_action is icon: { double_tap_action: … }",
  icon_badge: (v) => `icon_badge is icon: { badge: ${v === false ? "false" : "…"} }`,
  control_position: (v) => `control_position is control: { position: ${val(v)} }`,
  control_attribute: (v) => `control_attribute is control: { attribute: ${val(v)} }`,
  control_step: (v) => `control_step is control: { step: ${val(v)} }`,
  control_options: () => "control_options is control: { options: [ … ] }",
  control_confirm: () => "control_confirm is control: { confirm: true }",
};
// `variant` on the card is the drawing's now: a flow's or a cover's in the visual; an appliance is
// its kind
export const goneVariant = (v: unknown): string =>
  oneOf(FLOW_ALL, v)
    ? `variant: ${v} is visual: { type: flow, variant: ${v} }`
    : oneOf(COVER_VARIANTS, v)
      ? `variant: ${v} is visual: { type: cover, variant: ${v} }`
      : typeof v === "string"
        ? `variant: ${v} is kind: ${v}`
        : "variant is the drawing's: visual: { type: flow, variant: … }; an appliance is its kind";

// the first gone key of an object as written (a card or a rule), as its message; null: none
export const goneKey = (o: Readonly<Record<string, unknown>>): string | null => {
  for (const k of Object.keys(o)) {
    if (o[k] === undefined) continue;
    if (k === "variant") return goneVariant(o[k]);
    if (k in GONE_KEYS) return GONE_KEYS[k](o[k]);
  }
  return null;
};
