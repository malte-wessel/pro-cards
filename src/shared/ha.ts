// The slice of Home Assistant the cards touch. Built on the websocket library's types (a
// type-only devDependency, nothing of it reaches the bundle) and narrowed to what the cards read,
// so the docs shim's hand-rolled `hass` satisfies it without casts.
import type {
  Connection,
  HassConfig,
  HassEntities,
  HassEntity,
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
  locale?: { language: string };
  // frontend versions without it fall back to the card's own formatting
  formatEntityState?: (st: HassEntity) => string;
}

// the compact rows of `history/history_during_period` with minimal_response + no_attributes
export type HistoryDuringPeriodResult = Record<string, { s?: string; lu?: number }[]>;

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
  [key: string]: unknown;
}

// an element class registered as a card: its static `cardType` names the element
export interface CardConstructor {
  new (): HTMLElement;
  cardType: string;
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
  }
  interface HTMLElementEventMap {
    "value-changed": CustomEvent<{ value: HaFormData }>;
  }
}
