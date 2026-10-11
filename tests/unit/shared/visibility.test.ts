import { describe, expect, it } from "vitest";
import type { HassEntity, HomeAssistant } from "../../../src/shared/ha.ts";
import {
  checkVisibility,
  nextBoundaryMs,
  normalizeVisibility,
  parseTime,
  timeMatches,
  timeZoneOf,
  truthy,
  userPerson,
  visibilityDeps,
  wallClock,
  type TimeCondition,
  type Visibility,
} from "../../../src/shared/visibility.ts";

const STATES: Record<string, [string, Record<string, unknown>?]> = {
  "light.kitchen": ["on", { brightness: 128 }],
  "light.hall": ["off"],
  "sensor.power": ["42.5"],
  "sensor.limit": ["40"],
  "sensor.offline": ["unavailable"],
  "input_select.mode": ["eco"],
  "person.alex": ["home", { user_id: "u-alex" }],
  "person.sam": ["work", { user_id: "u-sam" }],
};
const hass = (over: Partial<HomeAssistant> = {}): HomeAssistant =>
  ({
    states: Object.fromEntries(
      Object.entries(STATES).map(([id, [state, attributes = {}]]) => [
        id,
        { entity_id: id, state, attributes } as unknown as HassEntity,
      ]),
    ),
    config: { time_zone: "Europe/Berlin" },
    locale: { language: "en", time_zone: "server" },
    user: { id: "u-alex", name: "Alex", is_admin: true },
    ...over,
  }) as unknown as HomeAssistant;

const CTX = { type: "test-card", label: "entities[0]", entity: "light.kitchen" };
const norm = (raw: unknown, entity: string | null = CTX.entity) =>
  normalizeVisibility(raw, { ...CTX, entity });
// 2026-06-21 is a Sunday; 12:00 in Berlin (CEST) is 10:00 UTC
const NOON = Date.UTC(2026, 5, 21, 10, 0, 0);
const env = (
  h: HomeAssistant = hass(),
  extra: Partial<Parameters<typeof checkVisibility>[1]> = {},
) => ({
  hass: h,
  tpl: () => undefined,
  media: () => false,
  now: NOON,
  ...extra,
});
const shown = (raw: unknown, h?: HomeAssistant, extra = {}) =>
  checkVisibility(norm(raw), env(h, extra));

describe("normalizeVisibility", () => {
  it("is null without conditions, and when every condition is disabled", () => {
    expect(norm(undefined)).toBeNull();
    expect(norm(null)).toBeNull();
    expect(norm([])).toBeNull();
    expect(norm([{ condition: "user", users: ["x"], enabled: false }])).toBeNull();
  });
  it("takes the host item's entity when a condition names none", () => {
    expect(norm([{ condition: "state", state: "on" }])).toEqual([
      { kind: "state", entity: "light.kitchen", attribute: null, values: ["on"], negate: false },
    ]);
  });
  it("accepts core's entity_id (one or a list: all must match) and the legacy shape", () => {
    expect(norm([{ condition: "state", entity_id: "light.hall", state: "off" }])).toEqual([
      { kind: "state", entity: "light.hall", attribute: null, values: ["off"], negate: false },
    ]);
    const both = norm([
      { condition: "numeric_state", entity_id: ["sensor.power", "sensor.limit"], above: 10 },
    ]);
    expect(both?.[0].kind).toBe("and");
    expect(norm([{ entity: "light.hall", state_not: "on" }])?.[0]).toMatchObject({
      kind: "state",
      negate: true,
    });
  });
  it("accepts a single condition object for a list", () => {
    expect(norm({ condition: "screen", media_query: "(min-width: 600px)" })).toEqual([
      { kind: "screen", query: "(min-width: 600px)" },
    ]);
  });
  it("reads times as seconds of the day and keeps weekdays", () => {
    expect(
      norm([{ condition: "time", after: "22:00", before: "06:30:15", weekdays: ["mon"] }]),
    ).toEqual([{ kind: "time", after: 79200, before: 23415, weekdays: ["mon"] }]);
    expect(parseTime("7:05")).toBe(25500);
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("8:00 AM")).toBeNull();
  });
  it("names the place and the problem in its errors", () => {
    const err =
      (raw: unknown, entity: string | null = CTX.entity) =>
      () =>
        norm(raw, entity);
    expect(err("on")).toThrow("test-card: 'entities[0].visibility' must be a list of conditions");
    expect(err([{ condition: "sun" }])).toThrow(
      "'entities[0].visibility[0]' has an unknown condition 'sun' (one of state, numeric_state",
    );
    expect(err([{ users: ["x"] }])).toThrow("needs 'condition'");
    expect(err([{ condition: "state" }])).toThrow("needs 'state' or 'state_not'");
    expect(err([{ condition: "state", state: "on" }], null)).toThrow("needs 'entity'");
    expect(err([{ condition: "state", entity: "Kitchen", state: "on" }])).toThrow(
      "invalid entity 'Kitchen'",
    );
    expect(err([{ condition: "numeric_state" }])).toThrow("needs 'above' or 'below'");
    expect(err([{ condition: "numeric_state", above: "lots" }])).toThrow(
      "'above' must be a number or an entity id",
    );
    expect(err([{ condition: "screen" }])).toThrow("needs 'media_query'");
    expect(err([{ condition: "user", users: [] }])).toThrow("needs 'users'");
    expect(err([{ condition: "location" }])).toThrow("needs 'locations'");
    expect(err([{ condition: "time", after: "8 am" }])).toThrow("'after' must be a time");
    expect(err([{ condition: "time", weekdays: ["monday"] }])).toThrow("unknown weekday 'monday'");
    expect(err([{ condition: "template", value_template: "true" }])).toThrow(
      "needs 'value_template'",
    );
    expect(err([{ condition: "or", conditions: [{ condition: "nope" }] }])).toThrow(
      "'entities[0].visibility[0].conditions[0]' has an unknown condition 'nope'",
    );
  });
});

describe("checkVisibility (Home Assistant's semantics)", () => {
  it("shows an item without conditions", () => {
    expect(checkVisibility(null, env())).toBe(true);
  });
  it("matches states, lists of states, state_not and attributes", () => {
    expect(shown([{ condition: "state", state: "on" }])).toBe(true);
    expect(shown([{ condition: "state", state: ["off", "unavailable"] }])).toBe(false);
    expect(shown([{ condition: "state", state_not: "off" }])).toBe(true);
    expect(shown([{ condition: "state", attribute: "brightness", state: "128" }])).toBe(true);
  });
  it("reads a missing entity or attribute as unknown", () => {
    expect(shown([{ condition: "state", entity: "light.gone", state: "unknown" }])).toBe(true);
    expect(shown([{ condition: "state", attribute: "color", state_not: "unknown" }])).toBe(false);
  });
  it("lets a state value name another entity whose state counts", () => {
    STATES["input_select.wanted"] = ["on"];
    expect(shown([{ condition: "state", state: "input_select.wanted" }])).toBe(true);
    delete STATES["input_select.wanted"];
  });
  it("compares numbers strictly, with bounds from other entities", () => {
    const n = (c: Record<string, unknown>) =>
      shown([{ condition: "numeric_state", entity: "sensor.power", ...c }]);
    expect(n({ above: 42.5 })).toBe(false);
    expect(n({ above: 42 })).toBe(true);
    expect(n({ below: 42.5 })).toBe(false);
    expect(n({ above: 40, below: 50 })).toBe(true);
    expect(n({ above: "sensor.limit" })).toBe(true);
    expect(n({ below: "sensor.limit" })).toBe(false);
    // a bound that is not a number (an entity without a numeric state) is ignored
    expect(n({ above: "sensor.offline", below: 50 })).toBe(true);
    // a quoted number that only looks like an entity id is the number, as in HA
    expect(n({ above: "20.5" })).toBe(true);
    expect(n({ below: "20.5" })).toBe(false);
    // a state that is not a number never matches
    expect(shown([{ condition: "numeric_state", entity: "sensor.offline", below: 1e9 }])).toBe(
      false,
    );
  });
  it("evaluates screen conditions through the media queries", () => {
    const c = [{ condition: "screen", media_query: "(min-width: 600px)" }];
    expect(shown(c, hass(), { media: () => true })).toBe(true);
    expect(shown(c, hass(), { media: () => false })).toBe(false);
  });
  it("matches the logged-in user, and nobody when there is none", () => {
    expect(shown([{ condition: "user", users: ["u-alex"] }])).toBe(true);
    expect(shown([{ condition: "user", users: ["u-sam"] }])).toBe(false);
    expect(shown([{ condition: "user", users: ["u-alex"] }], hass({ user: undefined }))).toBe(
      false,
    );
  });
  it("finds the user's person for location conditions", () => {
    expect(userPerson(hass())).toBe("person.alex");
    expect(shown([{ condition: "location", locations: ["home"] }])).toBe(true);
    const sam = hass({ user: { id: "u-sam", name: "Sam", is_admin: false } });
    expect(shown([{ condition: "location", locations: ["home"] }], sam)).toBe(false);
    expect(shown([{ condition: "location", locations: ["work"] }], sam)).toBe(true);
    const ghost = hass({ user: { id: "u-ghost", name: "?", is_admin: false } });
    expect(shown([{ condition: "location", locations: ["home"] }], ghost)).toBe(false);
    // a person the caller looked up already is used as it is
    expect(
      shown([{ condition: "location", locations: ["work"] }], hass(), { person: "person.sam" }),
    ).toBe(true);
  });
  it("reads template results as HA's result_as_boolean does, false until answered", () => {
    const c = [{ condition: "template", value_template: "{{ is_state('light.hall', 'off') }}" }];
    expect(shown(c)).toBe(false);
    expect(shown(c, hass(), { tpl: () => "True" })).toBe(true);
    expect(shown(c, hass(), { tpl: () => "off" })).toBe(false);
    for (const r of [true, 1, "yes", " ON ", "enable", "1"]) expect(truthy(r)).toBe(true);
    for (const r of [false, 0, NaN, "no", "2", "", null, undefined, {}])
      expect(truthy(r)).toBe(false);
  });
  it("combines: a list is all, or is any, not is not-all", () => {
    const on = { condition: "state", state: "on" },
      off = { condition: "state", state: "off" };
    expect(shown([on, off])).toBe(false);
    expect(shown([{ condition: "or", conditions: [on, off] }])).toBe(true);
    expect(shown([{ condition: "and", conditions: [on, off] }])).toBe(false);
    // NOT(all of them), so one false child makes it true
    expect(shown([{ condition: "not", conditions: [on, off] }])).toBe(true);
    expect(shown([{ condition: "not", conditions: [on] }])).toBe(false);
    // an and / or / not without conditions is true, as in HA
    expect(shown([{ condition: "or" }])).toBe(true);
  });
});

describe("time conditions", () => {
  const tc = (raw: Record<string, unknown>) =>
    norm([{ condition: "time", ...raw }])![0] as TimeCondition;
  const at = (hh: number, mm = 0, ss = 0) => Date.UTC(2026, 5, 21, hh - 2, mm, ss); // Berlin CEST
  it("reads the wall clock in the time zone", () => {
    expect(wallClock(NOON, "Europe/Berlin")).toEqual({ secs: 43200, weekday: "sun" });
    expect(wallClock(NOON, "America/New_York")).toEqual({ secs: 6 * 3600, weekday: "sun" });
  });
  it("uses the server's zone when the profile says so, else the browser's", () => {
    expect(timeZoneOf(hass())).toBe("Europe/Berlin");
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(timeZoneOf(hass({ locale: { language: "en", time_zone: "local" } }))).toBe(local);
  });
  it("includes both ends of a window", () => {
    const c = tc({ after: "08:00", before: "12:00" });
    expect(timeMatches(c, at(8), "Europe/Berlin")).toBe(true);
    expect(timeMatches(c, at(12, 0, 0), "Europe/Berlin")).toBe(true);
    expect(timeMatches(c, at(12, 0, 1), "Europe/Berlin")).toBe(false);
    expect(timeMatches(c, at(7, 59, 59), "Europe/Berlin")).toBe(false);
  });
  it("crosses midnight when before is earlier than after", () => {
    const c = tc({ after: "22:00", before: "06:00" });
    expect(timeMatches(c, at(23), "Europe/Berlin")).toBe(true);
    expect(timeMatches(c, at(5, 59), "Europe/Berlin")).toBe(true);
    expect(timeMatches(c, at(12), "Europe/Berlin")).toBe(false);
  });
  it("checks the weekday, and an open window", () => {
    expect(timeMatches(tc({ weekdays: ["sun"] }), NOON, "Europe/Berlin")).toBe(true);
    expect(timeMatches(tc({ weekdays: ["mon", "tue"] }), NOON, "Europe/Berlin")).toBe(false);
    expect(timeMatches(tc({ after: "11:00" }), NOON, "Europe/Berlin")).toBe(true);
    expect(timeMatches(tc({ before: "11:00" }), NOON, "Europe/Berlin")).toBe(false);
    expect(timeMatches(tc({}), NOON, "Europe/Berlin")).toBe(true);
  });
  it("follows the zone through a DST change", () => {
    // 2026-03-29: Berlin jumps from 02:00 CET to 03:00 CEST; 01:30 UTC is 03:30 local
    const c = tc({ after: "03:00", before: "04:00" });
    expect(timeMatches(c, Date.UTC(2026, 2, 29, 1, 30), "Europe/Berlin")).toBe(true);
    expect(timeMatches(c, Date.UTC(2026, 2, 29, 0, 30), "Europe/Berlin")).toBe(false);
  });
  it("times the next edge: an after, just past a before, or midnight", () => {
    const tz = "Europe/Berlin";
    expect(nextBoundaryMs([], NOON, tz)).toBeNull();
    // 12:00 → 12:30 (after)
    expect(nextBoundaryMs([tc({ after: "12:30" })], NOON, tz)).toBe(30 * 60e3 + 20);
    // 11:59:59 → past 12:00:00 (before + 1 s)
    expect(nextBoundaryMs([tc({ before: "12:00" })], at(11, 59, 59), tz)).toBe(2000 + 20);
    // 23:30 → midnight, for the weekdays
    expect(nextBoundaryMs([tc({ weekdays: ["mon"] })], at(23, 30), tz)).toBe(30 * 60e3 + 20);
    // never more than an hour
    expect(nextBoundaryMs([tc({ after: "20:00" })], NOON, tz)).toBe(3600e3 + 20);
  });
});

describe("visibilityDeps", () => {
  it("collects what the conditions depend on, through and / or / not", () => {
    const trees: Visibility[] = [
      norm([
        { condition: "state", state: ["on", "input_select.mode"] },
        {
          condition: "or",
          conditions: [
            { condition: "numeric_state", entity: "sensor.power", below: "sensor.limit" },
            { condition: "screen", media_query: "(max-width: 400px)" },
            { condition: "template", value_template: "{{ 1 }}" },
          ],
        },
      ]),
      norm([
        { condition: "location", locations: ["home"] },
        { condition: "time", after: "07:00" },
      ]),
      null,
    ];
    const d = visibilityDeps(trees);
    expect([...d.entities].sort()).toEqual([
      "input_select.mode",
      "light.kitchen",
      "sensor.limit",
      "sensor.power",
    ]);
    expect([...d.media]).toEqual(["(max-width: 400px)"]);
    expect([...d.templates]).toEqual(["{{ 1 }}"]);
    expect(d.times).toHaveLength(1);
    expect(d.user).toBe(true);
    expect(d.location).toBe(true);
  });
});
