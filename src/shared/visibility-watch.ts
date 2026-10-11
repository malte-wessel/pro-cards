// What makes a card look at its visibility conditions again besides a state change: a media query
// that starts or stops matching (`screen`) and the edge of a time window (`time`). One listener per
// query and one timer per card; `onChange` re-renders.
import type { HomeAssistant } from "./ha.ts";
import { nextBoundaryMs, timeZoneOf, type VisibilityDeps } from "./visibility.ts";

const hasMatchMedia = () => typeof matchMedia === "function";

export class VisibilityWatch {
  _onChange: () => void;
  _queries: string[] = [];
  _times: VisibilityDeps["times"] = [];
  _lists = new Map<string, MediaQueryList>();
  _timer?: ReturnType<typeof setTimeout>;
  _connected = false;

  constructor(onChange: () => void) {
    this._onChange = onChange;
    this.media = this.media.bind(this);
  }

  // the conditions changed (a new config)
  set(deps: Pick<VisibilityDeps, "media" | "times">) {
    const was = this._connected;
    if (was) this.disconnect();
    this._queries = [...deps.media];
    this._times = deps.times;
    if (was) this.connect();
  }

  connect() {
    this._connected = true;
    if (!hasMatchMedia()) return;
    for (const q of this._queries) {
      const mql = matchMedia(q);
      mql.addEventListener("change", this._onChange);
      this._lists.set(q, mql);
    }
  }

  disconnect() {
    this._connected = false;
    clearTimeout(this._timer);
    for (const mql of this._lists.values()) mql.removeEventListener("change", this._onChange);
    this._lists.clear();
  }

  // whether a media query matches now (the `media` of the visibility env)
  media(query: string): boolean {
    const mql = this._lists.get(query) ?? (hasMatchMedia() ? matchMedia(query) : null);
    return !!mql?.matches;
  }

  // (re)starts the timer for the next edge of a time window; called after every render
  arm(hass: HomeAssistant | undefined, now = Date.now()) {
    clearTimeout(this._timer);
    if (!this._connected || !hass || !this._times.length) return;
    const ms = nextBoundaryMs(this._times, now, timeZoneOf(hass));
    if (ms !== null) this._timer = setTimeout(this._onChange, ms);
  }
}
