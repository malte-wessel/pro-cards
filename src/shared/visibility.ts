// Visibility conditions on the items inside a card (pure). The syntax and the semantics are Home
// Assistant's dashboard conditions (frontend src/panels/lovelace/common/validate-condition.ts), so
// a condition copied from HA's editor works here: state, numeric_state, screen, user, location,
// time, and / or / not, plus `template` (HA's core template condition, `value_template`), rendered
// by the cards' own template subscriptions. A list means all of them; `not` is not-all (as in HA).
import type { HomeAssistant } from "./ha.ts";
import { isTemplate } from "./util.ts";

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface TimeCondition {
  kind: "time";
  after: number | null; // seconds of the day
  before: number | null;
  weekdays: Weekday[] | null;
}
export type Condition =
  | { kind: "state"; entity: string; attribute: string | null; values: string[]; negate: boolean }
  | {
      kind: "numeric";
      entity: string;
      attribute: string | null;
      above: number | string | null; // a string is an entity id whose state is the bound
      below: number | string | null;
    }
  | { kind: "screen"; query: string }
  | { kind: "user"; users: string[] }
  | { kind: "location"; locations: string[] }
  | TimeCondition
  | { kind: "template"; template: string }
  | { kind: "and" | "or" | "not"; conditions: Condition[] | null }; // null: none written (true)
// null: always shown
export type Visibility = Condition[] | null;

const SUPPORTED = [
  "state",
  "numeric_state",
  "screen",
  "user",
  "location",
  "time",
  "template",
  "and",
  "or",
  "not",
];
const ENTITY_ID = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const isEntityId = (v: unknown): v is string => typeof v === "string" && ENTITY_ID.test(v);
const list = (v: unknown): unknown[] =>
  v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];

export interface VisibilityCtx {
  type: string; // the card type, for errors
  label: string; // where the key sits, e.g. "entities[2]"
  entity: string | null; // the host item's entity: the default of state / numeric_state
}

// "HH:MM" or "HH:MM:SS" → seconds of the day, null when not a time
export const parseTime = (v: unknown): number | null => {
  const m = typeof v === "string" ? v.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/) : null;
  if (!m) return null;
  const [h, min, s] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  return h > 23 || min > 59 || s > 59 ? null : h * 3600 + min * 60 + s;
};

// The `visibility` key of an item, validated: null when there is none (or only disabled
// conditions). Throws a config error naming the place, like the other normalizers.
export const normalizeVisibility = (raw: unknown, ctx: VisibilityCtx): Visibility => {
  if (raw === undefined || raw === null) return null;
  const at = `${ctx.label}.visibility`;
  if (typeof raw !== "object") throw new Error(`${ctx.type}: '${at}' must be a list of conditions`);
  const out = conditionsOf(raw, ctx, at);
  return out.length ? out : null;
};

const conditionsOf = (raw: unknown, ctx: VisibilityCtx, at: string): Condition[] =>
  list(raw).flatMap((c, i) => {
    const one = conditionOf(c, ctx, Array.isArray(raw) ? `${at}[${i}]` : at);
    return one ? [one] : [];
  });

const conditionOf = (raw: unknown, ctx: VisibilityCtx, at: string): Condition | null => {
  const fail = (msg: string): never => {
    throw new Error(`${ctx.type}: '${at}' ${msg}`);
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("must be a condition object");
  const o = raw as Record<string, unknown>;
  if (o.enabled === false) return null;
  // HA's legacy shape (the conditional card's): an entity with state / state_not, no `condition`
  const kind = o.condition ?? (o.state !== undefined || o.state_not !== undefined ? "state" : null);
  if (typeof kind !== "string" || !SUPPORTED.includes(kind))
    fail(
      `${kind ? `has an unknown condition '${String(kind)}'` : "needs 'condition'"} (one of ${SUPPORTED.join(", ")})`,
    );
  const attribute = typeof o.attribute === "string" && o.attribute ? o.attribute : null;
  // the entities a state / numeric_state looks at: `entity`, core's `entity_id` (one or a list)
  // or the host item's own; several must all match
  const entities = () => {
    const ids = list(o.entity ?? o.entity_id ?? ctx.entity);
    if (!ids.length) fail("needs 'entity' (the item has none to fall back to)");
    for (const id of ids) if (!isEntityId(id)) fail(`has an invalid entity '${String(id)}'`);
    return ids as string[];
  };
  const all = (conds: Condition[]): Condition =>
    conds.length === 1 ? conds[0] : { kind: "and", conditions: conds };
  switch (kind) {
    case "state": {
      const value = o.state ?? o.state_not;
      if (value === undefined || value === null) fail("needs 'state' or 'state_not'");
      const values = list(value).map(String);
      const negate = o.state === undefined || o.state === null;
      return all(
        entities().map((entity) => ({ kind: "state", entity, attribute, values, negate })),
      );
    }
    case "numeric_state": {
      const bound = (v: unknown, key: string): number | string | null => {
        if (v === undefined || v === null) return null;
        if (isEntityId(v)) return v;
        const n = Number(v);
        if (typeof v === "boolean" || v === "" || Number.isNaN(n))
          fail(`'${key}' must be a number or an entity id`);
        return n;
      };
      const above = bound(o.above, "above"),
        below = bound(o.below, "below");
      if (above === null && below === null) fail("needs 'above' or 'below'");
      return all(
        entities().map((entity) => ({ kind: "numeric", entity, attribute, above, below })),
      );
    }
    case "screen":
      if (typeof o.media_query !== "string" || !o.media_query.trim()) fail("needs 'media_query'");
      return { kind: "screen", query: (o.media_query as string).trim() };
    case "user": {
      const users = list(o.users);
      if (!users.length || users.some((u) => typeof u !== "string"))
        fail("needs 'users' (a list of user ids)");
      return { kind: "user", users: users as string[] };
    }
    case "location": {
      const locations = list(o.locations);
      if (!locations.length || locations.some((l) => typeof l !== "string"))
        fail("needs 'locations' (a list of zone names, e.g. home)");
      return { kind: "location", locations: locations as string[] };
    }
    case "time": {
      const time = (key: "after" | "before") => {
        if (o[key] === undefined || o[key] === null) return null;
        const s = parseTime(o[key]);
        if (s === null) fail(`'${key}' must be a time like 07:30 or 07:30:00`);
        return s;
      };
      const days = list(o.weekdays);
      for (const d of days)
        if (!WEEKDAYS.includes(d as Weekday))
          fail(`has an unknown weekday '${String(d)}' (one of ${WEEKDAYS.join(", ")})`);
      return {
        kind: "time",
        after: time("after"),
        before: time("before"),
        weekdays: days.length ? (days as Weekday[]) : null,
      };
    }
    case "template":
      if (!isTemplate(o.value_template)) fail("needs 'value_template' (a {{ … }} template)");
      return { kind: "template", template: o.value_template as string };
    default: {
      const k = kind as "and" | "or" | "not";
      // none written, or all of them disabled: no condition (true), as at the top level. HA's
      // checkConditionsMet would make an explicit empty `or` / `not` false; here disabling the
      // only child of an `or` switches the condition off rather than hiding the part
      const conditions =
        o.conditions === undefined || o.conditions === null
          ? []
          : conditionsOf(o.conditions, ctx, `${at}.conditions`);
      return { kind: k, conditions: conditions.length ? conditions : null };
    }
  }
};

// ---------- evaluation ----------

export interface VisibilityEnv {
  hass: HomeAssistant;
  tpl: (template: string) => unknown; // the template's latest result, undefined before the first
  media: (query: string) => boolean;
  now: number; // ms epoch
  // the user's person entity, when the caller has it cached (else it is looked up)
  person?: string | null;
}

// a template's result as Home Assistant's result_as_boolean reads it
export const truthy = (r: unknown): boolean => {
  if (typeof r === "boolean") return r;
  if (typeof r === "number") return r !== 0 && !Number.isNaN(r);
  if (typeof r === "string")
    return ["true", "yes", "on", "enable", "1"].includes(r.trim().toLowerCase());
  return false;
};

// the person entity of the logged-in user (HA's getUserPerson), null when there is none
export const userPerson = (hass: HomeAssistant): string | null => {
  const id = hass.user?.id;
  if (!id) return null;
  for (const st of Object.values(hass.states))
    if (st.entity_id.startsWith("person.") && st.attributes.user_id === id) return st.entity_id;
  return null;
};

// the time zone `time` conditions use: the server's when the profile says so, else the browser's
export const timeZoneOf = (hass: HomeAssistant): string =>
  hass.locale?.time_zone === "server" && hass.config?.time_zone
    ? hass.config.time_zone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;

const clockFormats = new Map<string, Intl.DateTimeFormat>();
// the wall clock in a time zone: seconds of the day (with the ms) and the weekday
export const wallClock = (now: number, tz: string): { secs: number; weekday: Weekday } => {
  let fmt = clockFormats.get(tz);
  if (!fmt) {
    const opts: Intl.DateTimeFormatOptions = {
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    };
    try {
      fmt = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: tz });
    } catch {
      fmt = new Intl.DateTimeFormat("en-US", opts); // an unknown zone: the browser's
    }
    clockFormats.set(tz, fmt);
  }
  const parts = Object.fromEntries(fmt.formatToParts(new Date(now)).map((p) => [p.type, p.value]));
  const ms = ((now % 1000) + 1000) % 1000;
  return {
    secs: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second) + ms / 1000,
    weekday: String(parts.weekday).slice(0, 3).toLowerCase() as Weekday,
  };
};

// HA's checkTimeInRange: both ends inclusive, a window with before < after crosses midnight
export const timeMatches = (c: TimeCondition, now: number, tz: string): boolean => {
  const { secs, weekday } = wallClock(now, tz);
  if (c.weekdays && !c.weekdays.includes(weekday)) return false;
  // HA compares whole Dates, `before` up to its exact second
  const s = Math.floor(secs);
  const { after: a, before: b } = c;
  if (a !== null && b !== null) return b < a ? s >= a || s <= b : s >= a && s <= b;
  if (a !== null) return s >= a;
  if (b !== null) return s <= b;
  return true;
};

const stateOf = (hass: HomeAssistant, entity: string, attribute: string | null) => {
  const st = hass.states[entity];
  return attribute ? st?.attributes[attribute] : st?.state;
};
const numOrNaN = (v: unknown) =>
  v === undefined || v === null || v === "" || typeof v === "boolean" ? NaN : Number(v);

const check = (c: Condition, env: VisibilityEnv): boolean => {
  const { hass } = env;
  switch (c.kind) {
    case "state": {
      const v = stateOf(hass, c.entity, c.attribute);
      const value = v === undefined || v === null ? "unknown" : String(v);
      // a value naming an entity also allows that entity's state (HA does the same)
      const allowed = c.values.flatMap((x) => {
        const other = isEntityId(x) ? hass.states[x]?.state : undefined;
        return other === undefined ? [x] : [x, other];
      });
      return allowed.includes(value) !== c.negate;
    }
    case "numeric": {
      const n = numOrNaN(stateOf(hass, c.entity, c.attribute));
      if (Number.isNaN(n)) return false;
      // a bound naming an entity reads its state; one that only looks like an id ("20.5") is
      // the number, as in HA
      const bound = (b: number | string | null) =>
        b === null
          ? NaN
          : typeof b === "number"
            ? b
            : numOrNaN(hass.states[b] ? hass.states[b].state : b);
      const above = bound(c.above),
        below = bound(c.below);
      return (Number.isNaN(above) || n > above) && (Number.isNaN(below) || n < below);
    }
    case "screen":
      return env.media(c.query);
    case "user":
      return !!hass.user?.id && c.users.includes(hass.user.id);
    case "location": {
      const person = env.person !== undefined ? env.person : userPerson(hass);
      return !!person && c.locations.includes(hass.states[person]?.state ?? "");
    }
    case "time":
      return timeMatches(c, env.now, timeZoneOf(hass));
    case "template":
      return truthy(env.tpl(c.template));
    case "and":
      return !c.conditions || c.conditions.every((x) => check(x, env));
    case "or":
      return !c.conditions || c.conditions.some((x) => check(x, env));
    case "not":
      return !c.conditions || !c.conditions.every((x) => check(x, env));
  }
};

// whether an item with these conditions is shown (no conditions: always)
export const checkVisibility = (v: Visibility, env: VisibilityEnv): boolean =>
  !v || v.every((c) => check(c, env));

// ---------- what the conditions depend on ----------

export interface VisibilityDeps {
  entities: Set<string>; // states to watch
  templates: Set<string>; // templates to subscribe
  media: Set<string>; // media queries to listen to
  times: TimeCondition[]; // time windows whose edges need a timer
  user: boolean; // depends on the logged-in user
  location: boolean; // depends on the user's person entity
}

export const visibilityDeps = (trees: Visibility[]): VisibilityDeps => {
  const deps: VisibilityDeps = {
    entities: new Set(),
    templates: new Set(),
    media: new Set(),
    times: [],
    user: false,
    location: false,
  };
  const walk = (c: Condition) => {
    switch (c.kind) {
      case "state":
        deps.entities.add(c.entity);
        for (const v of c.values) if (isEntityId(v)) deps.entities.add(v);
        break;
      case "numeric":
        deps.entities.add(c.entity);
        for (const b of [c.above, c.below]) if (typeof b === "string") deps.entities.add(b);
        break;
      case "screen":
        deps.media.add(c.query);
        break;
      case "user":
        deps.user = true;
        break;
      case "location":
        deps.user = deps.location = true;
        break;
      case "time":
        deps.times.push(c);
        break;
      case "template":
        deps.templates.add(c.template);
        break;
      default:
        c.conditions?.forEach(walk);
    }
  };
  for (const v of trees) v?.forEach(walk);
  return deps;
};

// ms until a time condition may change its answer (an `after`, just past a `before`, midnight for
// the weekdays), capped at an hour so a DST change is caught by looking again; null without any
export const nextBoundaryMs = (times: TimeCondition[], now: number, tz: string): number | null => {
  if (!times.length) return null;
  const { secs } = wallClock(now, tz);
  const edges = [0]; // midnight
  for (const t of times) {
    if (t.after !== null) edges.push(t.after);
    if (t.before !== null) edges.push(t.before + 1);
  }
  const next = Math.min(...edges.map((e) => (e - secs + 86400) % 86400 || 86400));
  return Math.min(next * 1000, 3600e3) + 20;
};
