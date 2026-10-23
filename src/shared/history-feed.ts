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
  _type: string;

  constructor(type: string) {
    this._type = type;
  }

  // a new config: what is loaded or on its way belongs to the old one
  reset() {
    this._gen++;
    this.loaded = false;
    this._inFlight = false;
    this._failedAt = null;
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
  // card's render); a result or failure of an older config does neither
  async run<T>(fetch: () => Promise<T>, apply: (res: T) => void, done: () => void) {
    if (this._inFlight) return;
    const gen = this._gen;
    this._inFlight = true;
    try {
      const res = await fetch();
      if (gen !== this._gen) return;
      apply(res);
      this.loaded = true;
      this._failedAt = null;
    } catch (err) {
      if (gen !== this._gen) return;
      console.error(`${this._type}: history fetch failed`, err);
      this._failedAt = Date.now();
    } finally {
      if (gen === this._gen) {
        this._inFlight = false;
        done();
      }
    }
  }
}
