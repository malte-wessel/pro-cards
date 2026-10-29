// The kinds (pure types): what an entity is, and what a card draws for it by default. A kind is
// detected from the entity (its domain, then its device class) or set with `kind`; the poster card
// draws its places the kind's way, and the tile card will draw the same kinds smaller.
import type { EntityItem, RawEntity, RuleUnit } from "../entity/config.ts";
import type { Placement } from "../entity/control.ts";
import type { EntityModel, RenderCtx } from "../entity/model.ts";
import type { PosterSlots } from "../entity/render/fill.ts";
import type { ForecastEntry, HassEntity, WeatherForecastType } from "../ha.ts";
import type { StringKey } from "../i18n.ts";
import type { SunCurveHost } from "../sun/curve.ts";
import type { Visibility } from "../visibility.ts";
import type { Finder } from "./discover.ts";

// one of a kind's own rules, as written in rules.ts: its label is ours and translated
export interface KindRule {
  state?: string;
  below?: number;
  above?: number;
  color?: string;
  icon?: string;
  labelKey?: StringKey;
  pulse?: boolean;
}

// an entity the kind reads besides the card's own: set in `kind` (an id, or false for none),
// else found on the same device, else (on a weather entity) one of its attributes
export interface InputDef {
  key: string;
  find?: Finder;
  weather?: string;
}

// an item the kind reads and its model now
export interface Read {
  ent: EntityItem;
  m: EntityModel;
}

// what a kind needs from the card that draws it
export interface KindHost {
  // a weather entity's forecast (undefined while loading, null when there is none)
  forecast(type: WeatherForecastType): ForecastEntry[] | null | undefined;
  // the sun curve's state for its tooltip
  sun: SunCurveHost;
  // the plot's pointer: `timeAt` reads the time under it, `show` draws the tooltip there (false:
  // nothing to show); the card keeps the time through a redraw
  hover(
    plot: HTMLElement,
    timeAt: (ev: PointerEvent) => number | null,
    show: (t: number) => boolean,
  ): void;
  // the time the tooltip is at (null: none)
  hoverT: number | null;
  // whether conditions hold now
  shown(v: Visibility): boolean;
  // draws the card again (a picture's colour has been read)
  redraw(): void;
}

// what a kind reads when it draws
export interface KindCtx {
  ctx: RenderCtx;
  // the card's item and its model
  ent: EntityItem;
  m: EntityModel;
  opts: Record<string, unknown>;
  input(key: string): Read | null;
  // the card's own `hours_to_show` (null: not set)
  hours: number | null;
  host: KindHost;
}

// a part built once and updated on every render, so its animations keep their phase: rebuilt
// only when its key changes
export interface Persistent {
  key(c: KindCtx): string;
  build(c: KindCtx): HTMLElement;
  update?(el: HTMLElement, c: KindCtx, row: HTMLElement): void;
}

export interface Kind {
  name: string;
  // detection: the domains and entity ids that are this kind, then the device classes; a kind with
  // none of them is never detected (the role kinds, `trend`: always set with `kind`)
  domains?: readonly string[];
  ids?: readonly string[];
  deviceClasses?: readonly string[];
  // the domains whose entities it reads ("any": every entity, or none); a kind set on an entity it
  // cannot read is a config error that names `readsText`
  reads: readonly string[] | "any";
  readsText: string;
  // it draws without an entity too (the sun, a trend of its own entities, an area)
  entityless?: boolean;
  // the keys `kind: { … }` takes besides `type` (inputs among them)
  keys: readonly string[];
  // its own rules, replaced as a whole by the card's `rules`; the unit they are written in
  rules?: readonly KindRule[];
  ruleUnit?: RuleUnit;
  // what `control: auto` draws (the domain kinds), by the entity's state where it depends on it
  // (an alarm panel that wants a code has none); the card's `control` replaces it
  controls?: readonly Placement[] | ((st: HassEntity | undefined) => readonly Placement[]);

  // ----- drawing (all optional: a kind without them draws as `entity`) -----
  // the card's item where the card sets neither `value` nor `attribute` (a weather entity's
  // temperature), and keys it defaults (`show_entity_picture`)
  main?(entity: string | null, raw: RawEntity, opts: Record<string, unknown>): Partial<RawEntity>;
  inputs?: readonly InputDef[];
  // the entities whose history it draws besides the card's own, the templates it renders and the
  // conditions it evaluates (a trend's series)
  history?(opts: Record<string, unknown>, entity: string | null): string[];
  templates?(opts: Record<string, unknown>): string[];
  visibility?(opts: Record<string, unknown>): Visibility[];
  // entities it follows besides its own and its inputs (the sun, for a night icon)
  watch?: readonly string[];
  // the forecast types it reads (a weather entity's)
  forecast?: readonly WeatherForecastType[];
  // the places it fills (the lead only through `lead`); a `secondary` of null is a line it has
  // with nothing on it now (the card keeps its room), left out a line it never has
  slots?(c: KindCtx): PosterSlots;
  status?(c: KindCtx): string | null;
  // its colour where no rule and no `color` says one (the sun's by day and by night)
  color?(c: KindCtx): string | null;
  lead?: Persistent;
  backdrop?: Persistent;
  // a part over the poster's action layer, under its texts (a cover's drag handle)
  handle?: Persistent;
  // a picture behind the poster under the scrim (a person's photo), where the card sets no `image`
  image?(c: KindCtx): string | null;
  // run on every render after the fill: what follows the clock or the size (a curve)
  live?(c: KindCtx, row: HTMLElement): void;
  // what else the poster row is filled from (beyond its model and the inputs')
  extra?(c: KindCtx): unknown[];
  // the minute timer (a countdown, a duration)
  timed?: boolean;
}

// `kind` as written: a name, or an object with an optional `type` and the kind's keys
export interface KindSpec {
  type: string | null;
  opts: Record<string, unknown>;
}
