// The slice of Home Assistant the cards touch. Built on the websocket library's types (a
// type-only devDependency, nothing of it reaches the bundle) and narrowed to what the cards read,
// so the docs shim's hand-rolled `hass` satisfies it without casts.
import type {
  Connection,
  HassConfig,
  HassEntities,
  HassEntity,
  HassUser,
  MessageBase,
} from "home-assistant-js-websocket";

export type { HassEntity, HassEntities };

export interface HomeAssistant {
  states: HassEntities;
  connection: Pick<Connection, "subscribeMessage">;
  callWS<T>(msg: MessageBase): Promise<T>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: unknown,
  ): Promise<unknown>;
  config: Pick<HassConfig, "latitude" | "longitude" | "time_zone" | "version"> & {
    unit_system?: Partial<HassConfig["unit_system"]>;
  };
  // `time_zone`: the profile's choice between the server's zone and the browser's
  locale?: { language: string; time_zone?: "local" | "server" };
  // the logged-in user (visibility's `user` and `location` conditions)
  user?: Pick<HassUser, "id" | "name" | "is_admin">;
  // frontend versions without it fall back to the card's own formatting
  formatEntityState?: (st: HassEntity) => string;
  // a path on the Home Assistant server as a full URL (an entity picture on a cast device)
  hassUrl?: (path?: string) => string;
  // the theme's mode (cards that draw pictures tune their colours for a dark one)
  themes?: { darkMode?: boolean };
}

// the compact rows of `history/history_during_period` with minimal_response + no_attributes
export type HistoryDuringPeriodResult = Record<string, { s?: string; lu?: number }[]>;

// ----- statistics (the recorder's long-term statistics) -----

export type StatisticsPeriod = "5minute" | "hour" | "day" | "week" | "month";
// a row of `recorder/statistics_during_period`: its bucket (ms) and the asked types, in the asked
// units; `change` is what the sum grew in the bucket, `state` the meter's reading at its end
export interface StatisticValue {
  start: number;
  end: number;
  change?: number | null;
  state?: number | null;
  sum?: number | null;
}
// statistic id → its rows (an id without rows in the window is left out)
export type StatisticsResult = Record<string, StatisticValue[]>;
// a row of `recorder/get_statistics_metadata`
export interface StatisticMetadata {
  statistic_id: string;
  statistics_unit_of_measurement: string | null;
  has_sum: boolean;
}

// ----- weather -----

export type WeatherForecastType = "hourly" | "daily" | "twice_daily";
// one entry of a weather forecast (`weather/subscribe_forecast`); units are the entity's own
export interface ForecastEntry {
  datetime: string;
  condition?: string | null;
  temperature?: number | null;
  templow?: number | null;
  apparent_temperature?: number | null;
  precipitation?: number | null;
  precipitation_probability?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
  wind_bearing?: number | string | null;
  wind_gust_speed?: number | null;
  cloud_coverage?: number | null;
  uv_index?: number | null;
  is_daytime?: boolean;
}
// what the subscription pushes on every forecast update
export interface ForecastMessage {
  type: WeatherForecastType;
  forecast: ForecastEntry[] | null;
}

// ----- card API -----

export type ActionKind = "tap" | "hold" | "double_tap";
export type HapticType =
  "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "failure";

// an action as written in YAML; Home Assistant reads the keys, the cards only look at `action`
export interface ActionConfig {
  action: string;
  entity?: string;
  [key: string]: unknown;
}

export interface GridOptions {
  columns?: number | "full";
  rows?: number | "auto";
  min_columns?: number;
  max_columns?: number;
  min_rows?: number;
  max_rows?: number;
}

// what every card config carries besides its own keys: the type and the keys HA injects
export interface CardConfigBase {
  type?: string;
  grid_options?: GridOptions;
  // false: keep the card's own height in a taller grid row or a stack (fixed rows still fill)
  fill_height?: boolean;
  // true: clickable parts show Home Assistant's hover and press layers (STYLE_HOVER)
  hover?: boolean;
  [key: string]: unknown;
}

// an element class registered as a card: its static `cardType` names the element
export interface CardConstructor {
  new (): HTMLElement;
  cardType: string;
}

// Home Assistant's wrapper around one card of a view, a section or a stack: it creates the card
// (lazily for core cards, an error card for a broken config), evaluates its `visibility`, hides
// it and fires `card-visibility-changed`, and passes hass / preview / layout on
export interface HuiCardElement extends HTMLElement {
  hass?: HomeAssistant;
  preview?: boolean;
  layout?: string;
  config?: CardConfigBase;
  load(): void;
  getCardSize?(): number | Promise<number>;
  getGridOptions?(): GridOptions;
}
// what window.loadCardHelpers() resolves to (the slice the layout card uses)
export interface CardHelpers {
  createCardElement(config: CardConfigBase): HTMLElement;
}

// ----- ha-form -----

export interface HaFormSchema {
  name: string;
  selector?: Record<string, unknown>;
  type?: string;
  schema?: HaFormSchema[];
  title?: string;
  flatten?: boolean;
  iconPath?: string;
  column_min_width?: string;
}
export type HaFormData = Record<string, unknown>;

export interface HaFormElement extends HTMLElement {
  hass?: HomeAssistant;
  data?: HaFormData;
  schema?: HaFormSchema[];
  computeLabel?: (schema: HaFormSchema) => string;
  computeHelper?: (schema: HaFormSchema) => string | undefined;
}

// ha-state-icon renders the entity's icon from its state (light bulb on / off, battery levels …)
export interface HaStateIconElement extends HTMLElement {
  hass?: HomeAssistant;
  stateObj?: HassEntity;
  icon?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-form": HaFormElement;
    "ha-state-icon": HaStateIconElement;
    "hui-card": HuiCardElement;
  }
  interface HTMLElementEventMap {
    "value-changed": CustomEvent<{ value: HaFormData }>;
  }
}
