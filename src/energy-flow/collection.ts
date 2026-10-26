// The dashboard's energy period (`period: dashboard`): Home Assistant's energy cards share one
// collection on the websocket connection (its date picker sets the period, its other cards
// subscribe), under `_<collection_key>`, else `_energy_<panel url>`, else `_energy`. The card only
// reads it: one it created itself would be found by Home Assistant, which would then miss its
// own methods.
import {
  daysRange,
  kindOfRange,
  rangeAt,
  zonedMidnight,
  zonedParts,
  type PeriodRange,
} from "../shared/calendar.ts";

// what the card reads of the collection: the period and its updates
export interface EnergyPeriod {
  start: Date;
  end?: Date; // the last instant of the last day; none: the start's day
}
export interface EnergyCollection extends EnergyPeriod {
  subscribe(cb: (data: EnergyPeriod) => void): () => void;
}

export const COLLECTION_PREFIX = "energy_";

// the connection's keys to look under, the first found wins
export const collectionKeys = (panelUrl: string | undefined, key: string | null): string[] =>
  key ? [`_${key}`] : [...(panelUrl ? [`_${COLLECTION_PREFIX}${panelUrl}`] : []), "_energy"];

export const findCollection = (connection: object, keys: string[]): EnergyCollection | null => {
  const conn = connection as Record<string, unknown>;
  for (const k of keys) {
    const c = conn[k] as Partial<EnergyCollection> | null | undefined;
    if (c && typeof c.subscribe === "function" && c.start instanceof Date)
      return c as EnergyCollection;
  }
  return null;
};

// the midnight nearest an instant: a picker in another zone than the card's still names its days
const nearestMidnight = (t: number, tz: string) => {
  const { y, m, d } = zonedParts(t + 12 * 3600e3, tz);
  return zonedMidnight(y, m, d, tz);
};

// The collection's period as the card's: a day, week from Monday, month or year by its kind (so
// it keeps its key and its name), any other run of days as such
export const followedRange = (p: EnergyPeriod, now: number, tz: string): PeriodRange => {
  const start = nearestMidnight(p.start.getTime(), tz);
  const { y, m, d } = zonedParts(start, tz);
  const day = zonedMidnight(y, m, d + 1, tz);
  const end = p.end ? Math.max(nearestMidnight(p.end.getTime() + 1, tz), day) : day;
  const kind = kindOfRange(start, end, now, tz);
  return kind ? rangeAt(kind, start, now, tz) : daysRange(start, end, now, tz);
};
