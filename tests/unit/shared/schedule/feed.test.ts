// A schedule's week read once per page and saved: answers older than a save are dropped, a week
// that did not change keeps its identity, a save re-reads Home Assistant first (a week changed
// elsewhere is not overwritten unasked; a YAML schedule is never saved), a listener that throws
// fails no save.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import {
  knownWeek,
  onScheduleWeek,
  resetSchedules,
  saveWeek,
  ScheduleSaveError,
  scheduleEditable,
  scheduleWeek,
} from "../../../../src/shared/schedule/feed.ts";
import { parseWeek, type HaWeek } from "../../../../src/shared/schedule/model.ts";

const ID = "schedule.heating";
const week = (from: string): HaWeek => ({ monday: [{ from, to: "08:00:00" }] });
const tick = () => new Promise((r) => setTimeout(r, 0));

// a Home Assistant whose answers the test hands out one at a time
const fake = (admin = true) => {
  let ha: HaWeek = week("06:00:00");
  const pending: (() => void)[] = [];
  const sent: Record<string, unknown>[] = [];
  let held = false;
  const hass = {
    states: { [ID]: { entity_id: ID, state: "off", attributes: {} } as unknown as HassEntity },
    user: { id: "u", name: "U", is_admin: admin },
    callWS: vi.fn(async (msg: Record<string, unknown>) => {
      sent.push(msg);
      if (msg.type === "call_service") {
        const answer = { response: { [ID]: ha } };
        if (!held) return answer;
        return new Promise((r) => pending.push(() => r(answer)));
      }
      if (msg.type === "config/entity_registry/get") return { unique_id: "heating" };
      if (msg.type === "schedule/list") return [{ id: "heating", name: "Heating", icon: "mdi:x" }];
      if (msg.type === "schedule/update") {
        ha = { monday: msg.monday as HaWeek["monday"] };
        return {};
      }
      throw new Error("unknown");
    }),
  } as unknown as HomeAssistant;
  return {
    hass,
    sent,
    set: (w: HaWeek) => (ha = w),
    hold: (on: boolean) => (held = on),
    release: () => pending.splice(0).forEach((fn) => fn()),
  };
};

beforeEach(() => resetSchedules());
afterEach(() => vi.useRealTimers());

describe("the schedule feed", () => {
  it("reads the week once, and keeps its identity when it did not change", async () => {
    const f = fake();
    const told = vi.fn();
    const off = onScheduleWeek(told);
    expect(scheduleWeek(f.hass, ID)).toBeUndefined();
    await tick();
    const first = knownWeek(ID);
    expect(first?.[0][0].from).toBe(360);
    expect(told).toHaveBeenCalledTimes(1);
    // a new state fetches again: the same week is the same object, nobody is told
    f.hass.states[ID] = { ...f.hass.states[ID] };
    scheduleWeek(f.hass, ID);
    await tick();
    expect(knownWeek(ID)).toBe(first);
    expect(told).toHaveBeenCalledTimes(1);
    off();
  });

  it("drops an answer asked for before a save", async () => {
    const f = fake();
    scheduleWeek(f.hass, ID);
    await tick();
    // a fetch in flight with the old week
    f.hold(true);
    f.hass.states[ID] = { ...f.hass.states[ID] };
    scheduleWeek(f.hass, ID);
    const saved = parseWeek(week("07:00:00"));
    f.hold(false);
    await saveWeek(f.hass, ID, saved, knownWeek(ID) ?? null);
    // the old answer lands after the save: it is not taken
    f.release();
    await tick();
    await tick();
    expect(knownWeek(ID)?.[0][0].from).toBe(420);
  });

  it("does not save over a week changed elsewhere, then does when told to", async () => {
    const f = fake();
    scheduleWeek(f.hass, ID);
    await tick();
    const start = knownWeek(ID) ?? null;
    f.set(week("05:00:00"));
    // (Monday 07:00–08:00: a week of its own, not an empty one)
    const mine = parseWeek(week("07:00:00"));
    const err = await saveWeek(f.hass, ID, mine, start).catch((e) => e);
    expect(err).toBeInstanceOf(ScheduleSaveError);
    expect(err.reason).toBe("changed");
    expect(err.week[0][0].from).toBe(300);
    expect(f.sent.some((m) => m.type === "schedule/update")).toBe(false);
    await saveWeek(f.hass, ID, mine, err.week);
    const update = f.sent.find((m) => m.type === "schedule/update");
    expect(update).toMatchObject({ schedule_id: "heating", name: "Heating", icon: "mdi:x" });
    expect(update?.monday).toEqual([{ from: "07:00:00", to: "08:00:00" }]);
  });

  it("knows who may edit: an administrator, a schedule made in the UI", async () => {
    const asked: Record<string, unknown>[][] = [];
    const as = (admin: boolean, editable: unknown) => {
      const f = fake(admin);
      asked.push(f.sent);
      f.hass.states[ID].attributes.editable = editable;
      return scheduleEditable(f.hass, ID);
    };
    expect(as(true, true)).toBe(true);
    expect(as(false, true)).toBe(false);
    // set in YAML: Home Assistant says so, and a save refuses it
    expect(as(true, false)).toBe(false);
    expect(as(true, undefined)).toBe(false);
    // (asking who may edit calls nothing)
    expect(asked.flat()).toHaveLength(0);
    const yaml = fake();
    (yaml.hass.callWS as ReturnType<typeof vi.fn>).mockImplementation(
      async (msg: { type: string }) =>
        msg.type === "schedule/list" ? [] : { unique_id: "office_hours", response: {} },
    );
    const err = await saveWeek(yaml.hass, ID, parseWeek({}), null).catch((e) => e);
    expect(err.reason).toBe("yaml");
  });

  it("saves though a card listening to it throws", async () => {
    const f = fake();
    scheduleWeek(f.hass, ID);
    await tick();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const heard: string[] = [];
    const off1 = onScheduleWeek(() => {
      throw new Error("broken card");
    });
    const off2 = onScheduleWeek((id) => heard.push(id));
    await expect(
      saveWeek(f.hass, ID, parseWeek(week("07:00:00")), knownWeek(ID) ?? null),
    ).resolves.toBeUndefined();
    expect(heard).toContain(ID);
    off1();
    off2();
  });
});
