// The forecasts of one weather entity (`weather/subscribe_forecast`), one subscription per type
// the card needs (the weather card, the poster's weather kind). `forecast[type]` is undefined
// until the first message and null when there is none. A message of a subscription that was
// replaced meanwhile is dropped; a refused type is asked for again only after RETRY_MS.
import { RETRY_MS } from "../constants.ts";
import type { ForecastEntry, ForecastMessage, HomeAssistant, WeatherForecastType } from "../ha.ts";

type Unsubscribe = () => unknown;

export class ForecastFeed {
  forecast: Partial<Record<WeatherForecastType, ForecastEntry[] | null>> = {};
  _unsub = new Map<WeatherForecastType, Promise<Unsubscribe | null>>();
  _token = new Map<WeatherForecastType, object>(); // identifies the live subscription per type
  _failedAt = new Map<WeatherForecastType, number>();

  // `onChange` redraws the card; `label` names it in the console
  onChange: () => void;
  label: string;
  constructor(onChange: () => void, label: string) {
    this.onChange = onChange;
    this.label = label;
  }

  // subscribe the types wanted now and drop the others
  sync(conn: HomeAssistant["connection"], entity: string, wanted: WeatherForecastType[]) {
    for (const [type, p] of [...this._unsub])
      if (!wanted.includes(type)) {
        this._unsub.delete(type);
        this._token.delete(type);
        p.then((u) => u && u()).catch(() => {});
      }
    for (const type of wanted) {
      if (this._unsub.has(type)) continue;
      const failed = this._failedAt.get(type);
      if (failed !== undefined && Date.now() - failed < RETRY_MS) continue;
      const token = {};
      this._token.set(type, token);
      const p: Promise<Unsubscribe | null> = conn
        .subscribeMessage<ForecastMessage>(
          (msg) => {
            if (this._token.get(type) !== token) return;
            this._failedAt.delete(type);
            this.forecast[type] = msg?.forecast ?? null;
            this.onChange();
          },
          { type: "weather/subscribe_forecast", forecast_type: type, entity_id: entity },
        )
        .catch((e) => {
          if (this._token.get(type) !== token) return null; // replaced meanwhile
          console.warn(`${this.label}: forecast subscription failed`, type, e);
          // "no forecast" until a later hass update asks again (the entity may come back)
          this._unsub.delete(type);
          this._token.delete(type);
          this._failedAt.set(type, Date.now());
          this.forecast[type] = null;
          this.onChange();
          return null;
        });
      this._unsub.set(type, p);
    }
  }
  // every subscription ends; the forecasts already received stay
  unsubscribe() {
    for (const p of this._unsub.values()) p.then((u) => u && u()).catch(() => {});
    this._unsub = new Map();
    this._token = new Map();
    this._failedAt = new Map();
  }
  // a new config or connection: nothing received so far counts
  reset() {
    this.unsubscribe();
    this.forecast = {};
  }
}
