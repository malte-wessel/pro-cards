// The recorder history of a card, fetched one request at a time: a result that arrives after the
// config changed belongs to the old config and is dropped, and a failed fetch is tried again after
// RETRY_MS instead of on every hass update (Home Assistant sets hass several times a second).
import { RETRY_MS } from "./constants.ts";

export class HistoryFeed {
  // whether the current config's history has arrived
  loaded = false;
  _gen = 0;
  _inFlight = false;
  _failedAt: number | null = null;
  // the refreshes asked for (invalidate): one asked while a fetch runs is not answered by it
  _asked = 0;
  _type: string;
  _what: string;

  // `what`: the data, for the console ("history", "statistics")
  constructor(type: string, what = "history") {
    this._type = type;
    this._what = what;
  }

  // a new config: what is loaded or on its way belongs to the old one
  reset() {
    this._gen++;
    this.loaded = false;
    this._inFlight = false;
    this._failedAt = null;
  }

  // fetch again (newer data), showing what is loaded meanwhile
  invalidate() {
    this.loaded = false;
    this._asked++;
  }

  // whether the history should be fetched now: not loaded, none on its way, no recent failure
  due(now = Date.now()) {
    return (
      !this.loaded &&
      !this._inFlight &&
      (this._failedAt === null || now - this._failedAt >= RETRY_MS)
    );
  }

  // fetches (unless a fetch is on its way), hands the result to `apply` and calls `done` (the
  // card's render); a result or failure of an older config does neither. `apply` returns false
  // for a result that is not complete yet: it is fetched again after RETRY_MS
  async run<T>(fetch: () => Promise<T>, apply: (res: T) => unknown, done: () => void) {
    if (this._inFlight) return;
    const gen = this._gen,
      asked = this._asked;
    this._inFlight = true;
    try {
      const res = await fetch();
      if (gen !== this._gen) return;
      if (apply(res) === false) {
        this.loaded = false;
        this._failedAt = Date.now();
      } else {
        // a refresh asked for meanwhile wants newer data than this
        this.loaded = asked === this._asked;
        this._failedAt = null;
      }
    } catch (err) {
      if (gen !== this._gen) return;
      console.error(`${this._type}: ${this._what} fetch failed`, err);
      this._failedAt = Date.now();
    } finally {
      if (gen === this._gen) {
        this._inFlight = false;
        done();
      }
    }
  }
}
