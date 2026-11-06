// The kinds (pure types): what an entity is, and what a card draws for it by default. A kind is
// detected from the entity (its domain, then its device class) or set with `kind`; the poster and
// the tile card draw their places (places.ts) the kind's way.
import type { EntityItem, RawEntity, RuleUnit } from "../entity/config.ts";
import type { Placement } from "../entity/control.ts";
import type { EntityModel, RenderCtx } from "../entity/model.ts";
import type { KindSlots } from "../entity/render/fill.ts";
import type { ActionConfig, ForecastEntry, HassEntity, WeatherForecastType } from "../ha.ts";
import type { StringKey } from "../i18n.ts";
import type { SunCurveHost } from "../sun/curve.ts";
import type { Visibility } from "../visibility.ts";
import type { Finder } from "./discover.ts";
import type { IconPlace, VisualPlace } from "./places.ts";

// one of a kind's own rules, as written in rules.ts: its label is ours and translated
export interface KindRule {
  state?: string;
  below?: number;
  above?: number;
  color?: string;
  icon?: string;
  labelKey?: StringKey;
  pulse?: boolean;
  // the whole card in the rule's colour while it matches
  tintCard?: boolean;
}

// an entity the kind reads besides the card's own: set on the card (an id, or false for none),
// else found on the same device, else (on a weather entity) one of its attributes
// entities of these domains (and, where given, these device classes)
export interface InputFilter {
  domains: readonly string[];
  deviceClasses?: readonly string[];
  // or, where an entity names no device class, one in these units (a template's direction in °)
  units?: readonly string[];
}
export interface InputDef {
  key: string;
  find?: Finder;
  weather?: string;
  // what the editor's entity picker lists for it, any of these: what the kind takes, wider than
  // what it looks for on the device (`find`, else any sensor)
  accepts?: readonly InputFilter[];
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
  // the visual's `hours` as written (null: the kind's own window)
  hours: number | null;
  // the places as drawn now: the kind's default, the card's and the matching rule's
  place: { icon: IconPlace; visual: VisualPlace | false };
  host: KindHost;
  // the card it draws for, and the size its lead is drawn at (the poster's 40 px, the tile's 36)
  card: "poster" | "tile";
  leadSize: number;
}

// a part built once and updated on every render, so its animations keep their phase: rebuilt
// only when its key changes
interface Persistent {
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
  // what its drawing puts in place of the entity's name, value and secondary line (the editor's
  // placeholders say so), and the icon it draws where it has one of its own
  fills?: readonly ("name" | "value" | "secondary")[];
  iconName?: string;
  // the numbers the visual editor offers for it beside those detected as it: of these device
  // classes, or a sensor in one of these units that names no class (a template's)
  offers?: { deviceClasses: readonly string[]; units: readonly string[] };
  // it draws without an entity too (the sun, a trend of its own entities, the grid from its meters)
  entityless?: boolean;
  // the keys it takes on the card (inputs among them); a card that sets another kind's is warned
  keys: readonly string[];
  // its own rules, replaced as a whole by the card's `rules`; the unit they are written in
  rules?: readonly KindRule[];
  ruleUnit?: RuleUnit;
  // what `control: auto` draws (the domain kinds); the card's `control` replaces it
  controls?: readonly Placement[];
  // the icon's own actions where the card sets none (`icon: { tap_action, … }`), by the entity's state
  // where it depends on it (a lock held to lock or unlock, an alarm panel that wants a code: none)
  iconActions?(st: HassEntity | undefined): Partial<Record<"tap" | "hold" | "dbl", ActionConfig>>;

  // ----- drawing (all optional: a kind without them draws as `entity`) -----
  // the card's item where the card sets neither `value` nor `attribute` (a weather entity's
  // temperature)
  main?(entity: string | null, raw: RawEntity, opts: Record<string, unknown>): Partial<RawEntity>;
  // what its places draw where the card says nothing (places.ts): a person's photo in the icon and
  // behind the card, a light's glow, the sun's day. Left out: the icon, and no visual
  icon?: IconPlace;
  visual?: VisualPlace;
  // its default visual on a tile where it differs (false: none; a drawing that only reads on a
  // poster's room: a cover, a robot's path, the grid's line)
  tileVisual?: VisualPlace | false;
  // the things only it draws (flow, sun, forecast, cover, path, line), and a thing every kind has
  // that it draws its own way (a trend's sparkline: its series)
  draws?: readonly string[];
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
  slots?(c: KindCtx): KindSlots;
  status?(c: KindCtx): string | null;
  // its colour where no rule and no `color` says one (the sun's by day and by night)
  color?(c: KindCtx): string | null;
  // that colour where it follows the entity's state alone (a light's, a thermostat's): a badge of
  // the kind takes it
  stateColor?(st: HassEntity | undefined): string | null;
  // how strong `visual: glow` lights it, 0 to 1 (a light's brightness; null or left out: the
  // value between min and max, else on or off)
  level?(c: KindCtx): number | null;
  // its animated icon (a fan's blades, the wind), where the icon is the kind's own
  lead?: Persistent;
  // what it draws behind the texts (its flow, cover, path or line: the key is "" while the visual
  // is none of them), and its own glow (a climate warm or cool, an alarm's pulse)
  backdrop?: Persistent;
  glow?: Persistent;
  // run on every render after the fill: what follows the clock or the size (a curve)
  live?(c: KindCtx, row: HTMLElement): void;
  // run on every render once the value is fitted, where the texts have their place: what fills
  // the room they leave (a robot's route)
  placed?(c: KindCtx, row: HTMLElement): void;
  // what else the poster row is filled from (beyond its model and the inputs')
  extra?(c: KindCtx): unknown[];
  // the minute timer (a countdown, a duration)
  timed?: boolean;
}
