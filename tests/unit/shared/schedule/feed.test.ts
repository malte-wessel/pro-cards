// A schedule's week read once per page and saved: answers older than a save are dropped, a week
// that did not change keeps its identity, a save re-reads Home Assistant first (a week changed
// elsewhere is not overwritten unasked; a YAML schedule is never saved), a failed lookup is tried
// again.
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
    const mine = parseWeek(week("09:00:00"));
    const err = await saveWeek(f.hass, ID, mine, start).catch((e) => e);
    expect(err).toBeInstanceOf(ScheduleSaveError);
    expect(err.reason).toBe("changed");
    expect(err.week[0][0].from).toBe(300);
    expect(f.sent.some((m) => m.type === "schedule/update")).toBe(false);
    await saveWeek(f.hass, ID, mine, err.week);
    const update = f.sent.find((m) => m.type === "schedule/update");
    expect(update).toMatchObject({ schedule_id: "heating", name: "Heating", icon: "mdi:x" });
    expect(update?.monday).toEqual([]);
  });

  it("knows who may edit: an administrator, a schedule made in the UI", async () => {
    expect(scheduleEditable(fake(false).hass, ID)).toBe(false);
    const f = fake();
    expect(scheduleEditable(f.hass, ID)).toBeUndefined();
    await tick();
    await tick();
    expect(scheduleEditable(f.hass, ID)).toBe(true);
    resetSchedules();
    const yaml = fake();
    (yaml.hass.callWS as ReturnType<typeof vi.fn>).mockImplementation(
      async (msg: { type: string }) =>
        msg.type === "schedule/list" ? [] : { unique_id: "office_hours", response: {} },
    );
    scheduleEditable(yaml.hass, ID);
    await tick();
    await tick();
    expect(scheduleEditable(yaml.hass, ID)).toBe(false);
    const err = await saveWeek(yaml.hass, ID, parseWeek({}), null).catch((e) => e);
    expect(err.reason).toBe("yaml");
  });

  it("tries a failed lookup again a minute later", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const f = fake();
    const call = f.hass.callWS as ReturnType<typeof vi.fn>;
    call.mockRejectedValueOnce(new Error("dropped"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    scheduleEditable(f.hass, ID);
    await tick();
    await tick();
    expect(scheduleEditable(f.hass, ID)).toBe(false);
    vi.setSystemTime(Date.now() + 61e3);
    // (asked again; view only meanwhile, no flicker)
    expect(scheduleEditable(f.hass, ID)).toBe(false);
    await tick();
    await tick();
    expect(scheduleEditable(f.hass, ID)).toBe(true);
  });
});
