// The schedule card: its config, its visual editor, and the schedule kind's detection and texts
// (happy-dom). Edit mode's gestures are covered by tests/e2e/schedule-card.spec.ts, the week's
// maths by shared/schedule/*.test.ts.
import { describe, expect, it } from "vitest";
import { ScheduleCard } from "../../src/schedule-card.ts";
import { normalizeScheduleCardConfig } from "../../src/schedule/config.ts";
import {
  configToForm,
  editorSchema,
  formToConfig,
  SCHEDULE_LABELS,
} from "../../src/schedule/editor.ts";
import { hasString } from "../../src/shared/i18n.ts";
import { detectKind } from "../../src/shared/kinds/detect.ts";
import type { HaFormSchema, HassEntity, HomeAssistant } from "../../src/shared/ha.ts";
import {
  changeText,
  dataText,
  firstWeekdayOf,
  soonText,
  valueText,
} from "../../src/shared/schedule/text.ts";
import { parseWeek } from "../../src/shared/schedule/model.ts";
import { resetSchedules } from "../../src/shared/schedule/feed.ts";
import { docExamples, withNested } from "./docs-examples.ts";

const T = "custom:schedule-card-pro";
const hass = { locale: { language: "en", time_format: "24" } } as unknown as HomeAssistant;

describe("schedule-card-pro config", () => {
  it("is registered and offered for schedules in the card picker", () => {
    expect(customElements.get("schedule-card-pro")).toBe(ScheduleCard);
    const entry = window.customCards?.find((c) => c.type === "schedule-card-pro");
    expect(entry).toBeTruthy();
  });

  it("defaults to editing, 15 minutes and the profile's first day", () => {
    const c = normalizeScheduleCardConfig({ entity: "schedule.heating" });
    expect(c).toMatchObject({
      entity: "schedule.heating",
      edit: true,
      snap: 15,
      firstWeekday: null,
      data: [],
    });
    expect(c.hasHeader).toBe(true);
  });

  it("reads its data, its snap and its first day", () => {
    const c = normalizeScheduleCardConfig({
      entity: "schedule.heating",
      data: ["mode", { key: "temperature", unit: "°C", step: 0.5, min: 5, max: 30, default: 21 }],
      snap: 30,
      first_weekday: "sunday",
      edit: false,
    });
    expect(c.data).toEqual([
      { key: "mode", unit: null, step: 1, min: null, max: null, default: null },
      { key: "temperature", unit: "°C", step: 0.5, min: 5, max: 30, default: 21 },
    ]);
    expect(c).toMatchObject({ snap: 30, firstWeekday: 6, edit: false });
  });

  it("names what is wrong", () => {
    const bad = (raw: Record<string, unknown>) => () =>
      normalizeScheduleCardConfig({ entity: "schedule.heating", ...raw });
    expect(() => normalizeScheduleCardConfig({})).toThrow(/entity is required/);
    expect(() => normalizeScheduleCardConfig({ entity: "light.x" })).toThrow(/schedule helper/);
    expect(bad({ snap: 7 })).toThrow(/snap is one of 5, 10, 15, 30, 60/);
    expect(bad({ first_weekday: "mon" })).toThrow(/first_weekday is one of/);
    expect(bad({ edit: "yes" })).toThrow(/edit is true or false/);
    expect(bad({ data: "temperature" })).toThrow(/data is a list/);
    expect(bad({ data: [{ unit: "°C" }] })).toThrow(/needs a key/);
    expect(bad({ data: [{ key: "t", color: "red" }] })).toThrow(/not color/);
    expect(bad({ data: [{ key: "t", step: 0 }] })).toThrow(/more than 0/);
  });

  it("stubs the first schedule it is offered", () => {
    expect(ScheduleCard.getStubConfig(undefined, ["light.x", "schedule.heating"])).toEqual({
      entity: "schedule.heating",
    });
  });
});

describe("schedule-card-pro editor", () => {
  it("is the card's config element", () => {
    expect(ScheduleCard.getConfigElement().tagName).toBe("SCHEDULE-CARD-PRO-EDITOR");
  });

  it("writes every docs example back as it was", () => {
    let n = 0;
    for (const { file, cfg } of docExamples())
      for (const c of withNested(cfg)) {
        const card = c as Record<string, unknown>;
        if (card?.type !== T) continue;
        expect(formToConfig(configToForm(card), card), file).toEqual(card);
        n++;
      }
    expect(n).toBeGreaterThan(3);
  });

  it("writes the first data entry back as short as it can, the others as written", () => {
    const card = { type: T, entity: "schedule.heating", data: ["temperature", "mode"] };
    const form = configToForm(card);
    expect(form).toMatchObject({ data_key: "temperature", data_unit: "", snap: "15", edit: true });
    expect(formToConfig({ ...form, data_unit: "°C" }, card).data).toEqual([
      { key: "temperature", unit: "°C" },
      "mode",
    ]);
    expect(formToConfig({ ...form, data_key: "" }, card).data).toEqual(["mode"]);
    const one = { type: T, entity: "schedule.heating" };
    expect(formToConfig({ ...configToForm(one), data_key: "duration" }, one).data).toEqual([
      "duration",
    ]);
  });

  it("reads numbers written as text, and keeps them through another field's change", () => {
    const card = {
      type: T,
      entity: "schedule.heating",
      snap: "30",
      data: [{ key: "temperature", unit: "°C", step: "0.5", min: "5" }],
    };
    const form = configToForm(card);
    expect(form).toMatchObject({ snap: "30", data_step: 0.5, data_min: 5 });
    expect(formToConfig({ ...form, data_unit: "°F" }, card)).toEqual({
      ...card,
      data: [{ key: "temperature", unit: "°F", step: "0.5", min: "5" }],
    });
    expect(formToConfig({ ...form, data_step: 1 }, card).data).toEqual([
      { key: "temperature", unit: "°C", step: 1, min: "5" },
    ]);
  });

  it("writes nothing for a select left at its default", () => {
    const card = { type: T, entity: "schedule.heating" };
    const form = configToForm(card);
    expect(
      formToConfig({ ...form, snap: "30", first_weekday: "sunday", edit: false }, card),
    ).toEqual({ ...card, snap: 30, first_weekday: "sunday", edit: false });
    const set = { ...card, snap: 30, first_weekday: "sunday" };
    expect(
      formToConfig({ ...configToForm(set), snap: "15", first_weekday: "profile" }, set),
    ).toEqual(card);
  });

  it("labels every field", () => {
    const names = (s: HaFormSchema[]): string[] =>
      s.flatMap((x) => (x.schema ? names(x.schema) : x.name ? [x.name] : []));
    for (const n of names(editorSchema(hass))) {
      expect(SCHEDULE_LABELS[n], n).toBeTruthy();
      expect(hasString(SCHEDULE_LABELS[n]), n).toBe(true);
    }
  });
});

describe("the schedule kind", () => {
  it("is detected from a schedule helper", () => {
    expect(detectKind("schedule.heating", undefined).name).toBe("schedule");
  });

  it("says when the schedule changes next, with the block's data", () => {
    expect(changeText(hass, { on: true, in: 90, day: 3, min: 1350 }, 3)).toBe("until 22:30");
    expect(changeText(hass, { on: false, in: 120, day: 3, min: 1080 }, 3)).toBe("from 18:00");
    expect(changeText(hass, { on: false, in: 2000, day: 4, min: 360 }, 3)).toBe("next Fri 06:00");
    expect(changeText(hass, { on: true, in: 600, day: 4, min: 120 }, 3)).toBe("until Fri 02:00");
    expect(soonText(hass, { on: true, in: 89, day: 3, min: 0 })).toBe("in 1h 29m");
    const spec = { key: "temperature", unit: "°C", step: 0.5, min: null, max: null, default: null };
    const [day] = parseWeek({
      monday: [{ from: "06:00", to: "08:00", data: { temperature: 21, mode: "eco" } }],
    });
    expect(dataText(hass, day[0], [spec])).toBe("21.0 °C");
    expect(dataText(hass, day[0], [])).toBe("21 · eco");
    expect(valueText(hass, 21.5, { ...spec, step: 1 })).toBe("21.5 °C");
  });
});

describe("schedule-card-pro element", () => {
  const st = (state: string) =>
    ({
      entity_id: "schedule.heating",
      state,
      attributes: { friendly_name: "Heating" },
    }) as unknown as HassEntity;
  const mount = (h: Partial<HomeAssistant>, cfg: Record<string, unknown> = {}) => {
    resetSchedules();
    const card = new ScheduleCard();
    card.setConfig({ type: T, entity: "schedule.heating", ...cfg });
    document.body.appendChild(card);
    card.hass = { locale: { language: "en" }, config: { time_zone: "UTC" }, ...h } as HomeAssistant;
    return card;
  };

  it("draws seven lanes and names the schedule", async () => {
    const card = mount({
      states: { "schedule.heating": st("off") },
      user: { id: "u", name: "U", is_admin: false },
      callWS: async () => ({
        response: { "schedule.heating": { monday: [{ from: "06:00:00", to: "08:00:00" }] } },
      }),
    } as unknown as HomeAssistant);
    await new Promise((r) => setTimeout(r, 0));
    const root = card.shadowRoot!;
    expect(root.querySelectorAll(".slane")).toHaveLength(7);
    expect(root.querySelector(".header .title")?.textContent).toBe("Heating");
    // a user who is no administrator gets no pencil
    expect(root.querySelector('.sctl [data-act="edit"]')).toBeNull();
    card.remove();
  });
});

describe("the week's first day", () => {
  const h = (language: string, first_weekday?: string) =>
    ({ locale: { language, first_weekday } }) as unknown as HomeAssistant;
  it("is the profile's, else the language's, else Monday", () => {
    expect(firstWeekdayOf(h("de", "sunday"))).toBe(6);
    expect(firstWeekdayOf(h("de", "language"))).toBe(0);
    expect(firstWeekdayOf(h("en-US"))).toBe(6);
    expect(firstWeekdayOf(h("xx-invalid-!!"))).toBe(0);
  });
});
