// The controls as the cards draw them (happy-dom): roles, labels, values, the service each gesture
// calls, the pending ghost, unavailable entities, the hit layer and every layout slot. Behaviour
// that needs a real browser (`:focus` matching, pointer drags with layout) lives in
// tests/e2e/controls.spec.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntityCard } from "../../../../src/entity-card.ts";
import { EntityGroupCard } from "../../../../src/entity-group-card.ts";
import { EntitySectionsCard } from "../../../../src/entity-sections-card.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";
import { ARM_MS, HOLD_CONFIRM_MS, PENDING_MS } from "../../../../src/shared/entity/control.ts";

interface Call {
  domain: string;
  service: string;
  data: Record<string, unknown>;
}
type Card = EntityCard | EntityGroupCard | EntitySectionsCard;

// a tiny home: its states, the calls the cards made, and a fresh hass for every change
class Home {
  states: Record<string, HassEntity> = {};
  calls: Call[] = [];
  fail = false;
  language = "en";
  cards: Card[] = [];
  constructor(defs: Record<string, [string | number, Record<string, unknown>?]>) {
    for (const [id, [state, attrs]] of Object.entries(defs)) this.def(id, state, attrs);
  }
  def(id: string, state: string | number, attrs: Record<string, unknown> = {}) {
    this.states = {
      ...this.states,
      [id]: {
        entity_id: id,
        state: String(state),
        attributes: attrs,
        last_changed: "2026-06-21T10:00:00Z",
        last_updated: "2026-06-21T10:00:00Z",
      } as unknown as HassEntity,
    };
  }
  hass(): HomeAssistant {
    return {
      states: this.states,
      locale: { language: this.language },
      config: { unit_system: { temperature: "°C" } },
      formatEntityState: (st: HassEntity) => st.state,
      callService: (domain: string, service: string, data: Record<string, unknown> = {}) => {
        this.calls.push({ domain, service, data });
        return this.fail ? Promise.reject(new Error("nope")) : Promise.resolve();
      },
    } as unknown as HomeAssistant;
  }
  // a new state object: the cards treat that as the device answering
  set(id: string, state?: string | number, attrs: Record<string, unknown> = {}) {
    const cur = this.states[id];
    this.def(id, state ?? cur.state, { ...cur.attributes, ...attrs });
    this.push();
  }
  push() {
    for (const c of this.cards) c.hass = this.hass();
  }
  mount<T extends Card>(Cls: new () => T, cfg: Record<string, unknown>): ShadowRoot {
    const el = new Cls();
    el.setConfig(cfg);
    document.body.appendChild(el);
    el.hass = this.hass();
    this.cards.push(el);
    return el.shadowRoot as ShadowRoot;
  }
  svc() {
    return this.calls.map((c) => `${c.domain}.${c.service}`);
  }
}

const q = <E extends Element = HTMLElement>(r: ParentNode, sel: string) => {
  const el = r.querySelector<E>(sel);
  if (!el) throw new Error(`no element for ${sel}`);
  return el;
};
const qa = <E extends Element = HTMLElement>(r: ParentNode, sel: string) => [
  ...r.querySelectorAll<E>(sel),
];
const key = (el: Element, k: string, type = "keydown") =>
  el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
const pointer = (el: Element, type: string) =>
  el.dispatchEvent(new PointerEvent(type, { button: 0, pointerId: 1, bubbles: true }));
// a click as assistive technology sends it: no pointer or key before it, detail 0
const bareClick = (el: Element) =>
  el.dispatchEvent(new MouseEvent("click", { detail: 0, bubbles: true }));
// the selected option (happy-dom's select.value is unreliable for options built in code)
const chosen = (sel: HTMLSelectElement) => [...sel.options].find((o) => o.selected)?.value;
// let a rejected service call settle
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const LIGHT = { friendly_name: "Ceiling", brightness: 128, supported_color_modes: ["brightness"] };
const CLIMATE = {
  friendly_name: "Thermostat",
  temperature: 21,
  current_temperature: 20.4,
  min_temp: 5,
  max_temp: 30,
  target_temp_step: 0.5,
  hvac_modes: ["off", "heat", "auto"],
  preset_modes: ["eco", "comfort"],
  preset_mode: "eco",
};
const home = () =>
  new Home({
    "light.ceiling": ["on", LIGHT],
    "light.porch": ["off", { friendly_name: "Porch", supported_color_modes: ["onoff"] }],
    "switch.pump": ["off", { friendly_name: "Pump" }],
    "cover.blinds": ["open", { friendly_name: "Blinds", current_position: 40 }],
    "cover.garage": ["closed", { friendly_name: "Garage" }],
    "climate.living": ["heat", CLIMATE],
    "fan.ceiling": ["on", { friendly_name: "Fan", percentage: 66, percentage_step: 33.333 }],
    "lock.door": ["locked", { friendly_name: "Door" }],
    "script.night": ["off", { friendly_name: "Night routine" }],
    "button.router": ["unknown", { friendly_name: "Router" }],
    "input_select.mode": ["Home", { friendly_name: "Mode", options: ["Home", "Away", "Night"] }],
    "input_number.boost": [
      30,
      { friendly_name: "Boost", min: 0, max: 120, step: 15, unit_of_measurement: "min" },
    ],
    "media_player.tv": ["playing", { friendly_name: "TV", volume_level: 0.35 }],
    "sensor.temp": [21.4, { friendly_name: "Temperature", unit_of_measurement: "°C" }],
  });

let h: Home;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-21T12:00:00Z"));
  h = home();
});
afterEach(() => {
  (document.activeElement as HTMLElement | null)?.blur?.();
  for (const c of h.cards) c.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("toggle", () => {
  it("is a switch named after the entity that reflects the state", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "toggle" });
    const t = q(r, ".toggle");
    expect(t.tagName).toBe("BUTTON");
    expect(t.getAttribute("role")).toBe("switch");
    expect(t.getAttribute("aria-checked")).toBe("true");
    expect(t.getAttribute("aria-label")).toBe("Toggle Ceiling");
    expect(t.classList.contains("on")).toBe(true);
    expect(t.hasAttribute("aria-pressed")).toBe(false);
  });
  it("calls homeassistant.toggle, shows the asked state as a ghost until the entity answers", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").click();
    expect(h.calls).toEqual([
      { domain: "homeassistant", service: "toggle", data: { entity_id: "switch.pump" } },
    ]);
    let t = q(r, ".toggle");
    expect(t.classList.contains("pending")).toBe(true);
    expect(t.getAttribute("aria-checked")).toBe("true");
    h.set("switch.pump", "on");
    t = q(r, ".toggle");
    expect(t.classList.contains("pending")).toBe(false);
    expect(t.classList.contains("on")).toBe(true);
  });
  it("drops the ghost after five seconds when the device never answers", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").click();
    vi.advanceTimersByTime(PENDING_MS - 100);
    expect(q(r, ".toggle").classList.contains("pending")).toBe(true);
    vi.advanceTimersByTime(200);
    expect(q(r, ".toggle").classList.contains("pending")).toBe(false);
    expect(q(r, ".toggle").getAttribute("aria-checked")).toBe("false");
  });
  it("is greyed out and inert while the entity is unavailable", () => {
    h.set("switch.pump", "unavailable");
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    const t = q<HTMLButtonElement>(r, ".toggle");
    expect(t.disabled).toBe(true);
    expect(t.getAttribute("aria-disabled")).toBe("true");
    expect(t.getAttribute("aria-checked")).toBe("false");
    t.click();
    expect(h.calls).toEqual([]);
  });
  it("speaks the profile language", () => {
    h.language = "de";
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    expect(q(r, ".toggle").getAttribute("aria-label")).toBe("Pump umschalten");
  });
  it("keeps working as the old toggle: true", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", toggle: true });
    expect(q(r, ".toggle").getAttribute("role")).toBe("switch");
  });
});

describe("lead toggle", () => {
  it("makes the icon a switch and toggles on tap and on Enter / Space", () => {
    const r = h.mount(EntityCard, {
      entity: "light.ceiling",
      control: "toggle",
      control_position: "lead",
    });
    const lead = q(r, ".lead.tap");
    expect(lead.getAttribute("role")).toBe("switch");
    expect(lead.getAttribute("aria-checked")).toBe("true");
    expect(lead.tabIndex).toBe(0);
    expect(r.querySelector(".toggle")).toBeNull();
    lead.click();
    key(q(r, ".lead.tap"), "Enter");
    key(q(r, ".lead.tap"), " ");
    expect(h.svc()).toEqual([
      "homeassistant.toggle",
      "homeassistant.toggle",
      "homeassistant.toggle",
    ]);
  });
  it("draws the off look and is inert while unavailable", () => {
    h.set("light.ceiling", "off");
    let r = h.mount(EntityCard, {
      entity: "light.ceiling",
      control: "toggle",
      control_position: "lead",
    });
    expect(q(r, ".lead.tap").classList.contains("off")).toBe(true);
    h.set("light.porch", "unavailable");
    r = h.mount(EntityCard, { entity: "light.porch", control: "toggle", control_position: "lead" });
    const lead = q(r, ".lead.tap");
    expect(lead.classList.contains("disabled")).toBe(true);
    lead.click();
    expect(h.calls).toEqual([]);
  });
});

describe("slider", () => {
  it("is a slider with the entity's range, value and text", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    const s = q(r, ".ctl-slider");
    expect(s.getAttribute("role")).toBe("slider");
    expect(s.tabIndex).toBe(0);
    expect(s.getAttribute("aria-label")).toBe("Set Ceiling");
    expect(s.getAttribute("aria-valuemin")).toBe("0");
    expect(s.getAttribute("aria-valuemax")).toBe("100");
    expect(s.getAttribute("aria-valuenow")).toBe("50");
    expect(s.getAttribute("aria-valuetext")).toBe("50 %");
    expect(q(s, ".fill").style.width).toBe("50.0%");
  });
  it("steps with the keys and calls the service once after a short pause", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    const s = q(r, ".ctl-slider");
    key(s, "ArrowRight");
    key(s, "ArrowUp");
    expect(s.getAttribute("aria-valuenow")).toBe("52");
    expect(h.calls).toEqual([]);
    vi.advanceTimersByTime(300);
    expect(h.calls).toEqual([
      {
        domain: "light",
        service: "turn_on",
        data: { entity_id: "light.ceiling", brightness_pct: 52 },
      },
    ]);
  });
  it("jumps ten steps with PageUp / PageDown and to the ends with Home / End", () => {
    const r = h.mount(EntityCard, { entity: "input_number.boost", control: "slider" });
    const s = q(r, ".ctl-slider");
    expect(s.getAttribute("aria-valuemax")).toBe("120");
    key(s, "PageDown");
    expect(s.getAttribute("aria-valuenow")).toBe("0");
    key(s, "End");
    expect(s.getAttribute("aria-valuenow")).toBe("120");
    key(s, "Home");
    key(s, "ArrowRight");
    expect(s.getAttribute("aria-valuenow")).toBe("15");
    expect(s.getAttribute("aria-valuetext")).toBe("15 min");
    vi.advanceTimersByTime(300);
    expect(h.calls).toEqual([
      {
        domain: "input_number",
        service: "set_value",
        data: { entity_id: "input_number.boost", value: 15 },
      },
    ]);
  });
  it("turns a light off at zero and sets a cover's position and a player's volume", () => {
    let r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    key(q(r, ".ctl-slider"), "Home");
    vi.advanceTimersByTime(300);
    r = h.mount(EntityCard, { entity: "cover.blinds", control: "slider" });
    key(q(r, ".ctl-slider"), "End");
    vi.advanceTimersByTime(300);
    r = h.mount(EntityCard, { entity: "media_player.tv", control: "slider" });
    key(q(r, ".ctl-slider"), "ArrowRight");
    vi.advanceTimersByTime(300);
    expect(h.calls.map((c) => [`${c.domain}.${c.service}`, c.data])).toEqual([
      ["light.turn_off", { entity_id: "light.ceiling" }],
      ["cover.set_cover_position", { entity_id: "cover.blinds", position: 100 }],
      ["media_player.volume_set", { entity_id: "media_player.tv", volume_level: 0.36 }],
    ]);
  });
  it("ignores other keys and lets them through", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    key(q(r, ".ctl-slider"), "a");
    vi.advanceTimersByTime(300);
    expect(h.calls).toEqual([]);
  });
  it("replaces the bar visual under the line and is short on the line", () => {
    let r = h.mount(EntityCard, { entity: "cover.blinds", visual: "bar", control: "slider" });
    expect(r.querySelector(".bar")).toBeNull();
    expect(q(r, ".row.tile > .ctl-slider")).toBeTruthy();
    r = h.mount(EntityCard, { entity: "cover.blinds", control: "slider", control_position: "end" });
    expect(q(r, ".end > .ctl-slider")).toBeTruthy();
  });
  it("is not drawn for an on / off light or a cover without a position", () => {
    let r = h.mount(EntityCard, { entity: "light.porch", control: "slider" });
    expect(r.querySelector(".ctl-slider")).toBeNull();
    r = h.mount(EntityCard, { entity: "cover.garage", control: "slider" });
    expect(r.querySelector(".ctl-slider")).toBeNull();
  });
  it("is disabled and shows the minimum while unavailable", () => {
    h.set("light.ceiling", "unavailable");
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    const s = q(r, ".ctl-slider");
    expect(s.classList.contains("disabled")).toBe(true);
    expect(s.tabIndex).toBe(-1);
    expect(s.getAttribute("aria-valuenow")).toBe("0");
    key(s, "ArrowRight");
    vi.advanceTimersByTime(300);
    expect(h.calls).toEqual([]);
  });
  it("shows the asked value as a ghost until the light answers", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    key(q(r, ".ctl-slider"), "ArrowRight");
    vi.advanceTimersByTime(300);
    let s = q(r, ".ctl-slider");
    expect(s.classList.contains("pending")).toBe(true);
    expect(s.getAttribute("aria-valuenow")).toBe("51");
    h.set("light.ceiling", "on", { brightness: 130 });
    s = q(r, ".ctl-slider");
    expect(s.classList.contains("pending")).toBe(false);
    expect(s.getAttribute("aria-valuenow")).toBe("51");
  });
});

describe("stepper", () => {
  it("shows the target with its unit and names its buttons", () => {
    const r = h.mount(EntityCard, { entity: "climate.living", control: "stepper" });
    const [dec, inc] = qa<HTMLButtonElement>(r, ".ctl-stepper button");
    expect(q(r, ".ctl-stepper .val").textContent).toBe("21.0 °C");
    expect(dec.getAttribute("aria-label")).toBe("Decrease Thermostat");
    expect(inc.getAttribute("aria-label")).toBe("Increase Thermostat");
  });
  it("steps by the entity's step and calls set_temperature", () => {
    const r = h.mount(EntityCard, { entity: "climate.living", control: "stepper" });
    qa(r, ".ctl-stepper button")[1].click();
    expect(h.calls).toEqual([
      {
        domain: "climate",
        service: "set_temperature",
        data: { entity_id: "climate.living", temperature: 21.5 },
      },
    ]);
    expect(q(r, ".ctl-stepper .val").textContent).toBe("21.5 °C");
    expect(q(r, ".ctl-stepper").classList.contains("pending")).toBe(true);
  });
  it("takes control_step over the entity's step and snaps to its grid", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      control: "stepper",
      control_step: 1,
    });
    qa(r, ".ctl-stepper button")[0].click();
    expect(h.calls[0].data).toMatchObject({ temperature: 20 });
    h.set("climate.living", "heat", { temperature: 20.5 });
    qa(r, ".ctl-stepper button")[1].click();
    // 21.5 snaps to the 1° grid
    expect(h.calls[1].data).toMatchObject({ temperature: 22 });
  });
  it("disables a button at its bound", () => {
    h.set("climate.living", "heat", { temperature: 30 });
    const r = h.mount(EntityCard, { entity: "climate.living", control: "stepper" });
    const [dec, inc] = qa<HTMLButtonElement>(r, ".ctl-stepper button");
    expect(inc.disabled).toBe(true);
    expect(dec.disabled).toBe(false);
    h.set("climate.living", "heat", { temperature: 5 });
    expect(qa<HTMLButtonElement>(r, ".ctl-stepper button")[0].disabled).toBe(true);
  });
  it("replaces the row's value when it shows the number it sets", () => {
    let r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "temperature",
      layout: "tile",
      control: "stepper",
    });
    expect(r.querySelector(".end > .state")).toBeNull();
    r = h.mount(EntityGroupCard, {
      entities: [
        { entity: "climate.living", attribute: "temperature", control: "stepper" },
        { entity: "climate.living", attribute: "current_temperature", control: "stepper" },
        { entity: "input_number.boost", control: "stepper" },
      ],
    });
    const rows = qa(r, ".row.list");
    expect(rows[0].querySelector(".end > .state")).toBeNull();
    expect(rows[1].querySelector(".end > .state")?.textContent).toContain("20.4");
    expect(rows[2].querySelector(".end > .state")).toBeNull();
  });
  it("is disabled and shows the plain value while unavailable", () => {
    h.set("climate.living", "unavailable");
    const r = h.mount(EntityCard, { entity: "climate.living", control: "stepper" });
    expect(q(r, ".ctl-stepper").classList.contains("disabled")).toBe(true);
    expect(qa<HTMLButtonElement>(r, ".ctl-stepper button").every((b) => b.disabled)).toBe(true);
  });
});

describe("segments", () => {
  it("are a radio group of the hvac modes with icons; one tab stop on the checked mode", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "hvac_mode",
      control: "segments",
    });
    const g = q(r, ".ctl-segments");
    expect(g.getAttribute("role")).toBe("radiogroup");
    expect(g.getAttribute("aria-label")).toBe("Choose Thermostat");
    const segs = qa(g, ".seg");
    expect(segs.map((s) => s.getAttribute("aria-label"))).toEqual(["Off", "Heat", "Auto"]);
    expect(segs.map((s) => s.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(segs.map((s) => s.tabIndex)).toEqual([-1, 0, -1]);
    expect(segs.every((s) => s.getAttribute("role") === "radio")).toBe(true);
    // on the line: icons only
    expect(segs[0].querySelector("span")).toBeNull();
  });
  it("calls the mode service and shows the choice as a ghost", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "hvac_mode",
      control: "segments",
    });
    qa(r, ".seg")[2].click();
    expect(h.calls).toEqual([
      {
        domain: "climate",
        service: "set_hvac_mode",
        data: { entity_id: "climate.living", hvac_mode: "auto" },
      },
    ]);
    const segs = qa(r, ".seg");
    expect(segs[2].classList.contains("pending")).toBe(true);
    expect(segs[2].tabIndex).toBe(0);
    // the current mode again does nothing
    segs[2].click();
    expect(h.calls).toHaveLength(1);
  });
  it("follow control_attribute while the row shows something else", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "current_temperature",
      control: "segments",
      control_attribute: "preset_mode",
    });
    const segs = qa(r, ".seg");
    expect(segs.map((s) => s.getAttribute("aria-label"))).toEqual(["Eco", "Comfort"]);
    expect(segs[0].getAttribute("aria-checked")).toBe("true");
    segs[1].click();
    expect(h.calls[0]).toMatchObject({
      service: "set_preset_mode",
      data: { preset_mode: "comfort" },
    });
  });
  it("list a fan's speeds with an off segment and pick the nearest", () => {
    const r = h.mount(EntityCard, { entity: "fan.ceiling", control: "segments" });
    const segs = qa(r, ".seg");
    // the power segment is an icon alone, named "Off"
    expect(segs.map((s) => s.getAttribute("aria-label"))).toEqual(["Off", "1", "2", "3"]);
    expect(segs[0].querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:power");
    expect(segs[2].getAttribute("aria-checked")).toBe("true");
    segs[0].click();
    expect(h.svc()).toEqual(["fan.turn_off"]);
  });
  it("take control_options with labels and icons, and show the labels under the line", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "preset_mode",
      control: "segments",
      control_position: "block",
      control_options: [
        { value: "eco", label: "Saver", icon: "mdi:leaf" },
        { value: "comfort", label: "Cosy" },
      ],
    });
    const segs = qa(r, ".row.tile > .ctl-segments .seg");
    expect(segs.map((s) => s.textContent)).toEqual(["Saver", "Cosy"]);
    expect(segs[0].querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:leaf");
  });
  it("draw nothing when the entity has no options", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "segments" });
    expect(r.querySelector(".ctl-segments")).toBeNull();
  });
  it("are disabled while unavailable", () => {
    h.set("climate.living", "unavailable");
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "hvac_mode",
      control: "segments",
    });
    expect(qa<HTMLButtonElement>(r, ".seg").every((b) => b.disabled)).toBe(true);
  });
});

describe("select", () => {
  it("lists the options with the current one selected and calls select_option", () => {
    const r = h.mount(EntityCard, { entity: "input_select.mode", control: "select" });
    const sel = q<HTMLSelectElement>(r, ".ctl-select select");
    expect(sel.getAttribute("aria-label")).toBe("Choose Mode");
    expect([...sel.options].map((o) => o.value)).toEqual(["Home", "Away", "Night"]);
    expect(chosen(sel)).toBe("Home");
    sel.options[2].selected = true;
    sel.value = "Night";
    sel.dispatchEvent(new Event("change"));
    expect(h.calls).toEqual([
      {
        domain: "input_select",
        service: "select_option",
        data: { entity_id: "input_select.mode", option: "Night" },
      },
    ]);
    expect(q(r, ".ctl-select").classList.contains("pending")).toBe(true);
    expect(chosen(q<HTMLSelectElement>(r, ".ctl-select select"))).toBe("Night");
  });
  it("keeps a current value the option list lacks", () => {
    h.set("input_select.mode", "Party");
    const r = h.mount(EntityCard, { entity: "input_select.mode", control: "select" });
    const sel = q<HTMLSelectElement>(r, ".ctl-select select");
    expect(chosen(sel)).toBe("Party");
    expect([...sel.options].map((o) => o.value)).toEqual(["Home", "Away", "Night", "Party"]);
  });
  it("replaces the row's value text and is disabled while unavailable", () => {
    let r = h.mount(EntityGroupCard, {
      entities: [{ entity: "input_select.mode", control: "select" }],
    });
    expect(r.querySelector(".row.list .end > .state")).toBeNull();
    h.set("input_select.mode", "unavailable");
    r = h.mount(EntityCard, { entity: "input_select.mode", control: "select" });
    expect(q<HTMLSelectElement>(r, "select").disabled).toBe(true);
  });
});

describe("buttons", () => {
  it("draw open / stop / close for a cover and call each service", () => {
    const r = h.mount(EntityCard, { entity: "cover.blinds", control: "buttons" });
    const bs = qa(r, ".ctl-buttons .round");
    expect(bs.map((b) => b.getAttribute("aria-label"))).toEqual(["Open", "Stop", "Close"]);
    bs.forEach((b) => b.click());
    expect(h.svc()).toEqual(["cover.open_cover", "cover.stop_cover", "cover.close_cover"]);
  });
  it("draw the transport for a player, the primary one filled and following the state", () => {
    let r = h.mount(EntityCard, { entity: "media_player.tv", control: "buttons" });
    let bs = qa(r, ".ctl-buttons .round");
    expect(bs.map((b) => b.classList.contains("f"))).toEqual([false, true, false]);
    expect(bs[1].querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:pause");
    h.set("media_player.tv", "paused");
    bs = qa(r, ".ctl-buttons .round");
    expect(bs[1].querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:play");
    bs[1].click();
    expect(h.svc()).toEqual(["media_player.media_play_pause"]);
    r = h.mount(EntityCard, { entity: "switch.pump", control: "buttons" });
    expect(r.querySelector(".ctl-buttons")).toBeNull();
  });
  it("each need a hold of their own with control_confirm; a click does nothing", () => {
    const r = h.mount(EntityCard, {
      entity: "cover.blinds",
      control: "buttons",
      control_confirm: true,
    });
    const bs = qa(r, ".ctl-buttons .round");
    expect(bs.every((b) => b.classList.contains("hold") && b.querySelector(".ring"))).toBe(true);
    expect(bs.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Hold to Open",
      "Hold to Stop",
      "Hold to Close",
    ]);
    bs[1].dispatchEvent(new MouseEvent("click", { detail: 1, bubbles: true }));
    expect(h.calls).toEqual([]);
    pointer(bs[1], "pointerdown");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    expect(h.svc()).toEqual(["cover.stop_cover"]);
  });
  it("are disabled while unavailable", () => {
    h.set("cover.blinds", "unavailable");
    const r = h.mount(EntityCard, { entity: "cover.blinds", control: "buttons" });
    expect(qa<HTMLButtonElement>(r, ".ctl-buttons .round").every((b) => b.disabled)).toBe(true);
  });
});

describe("custom buttons", () => {
  const SCENES = [
    { entity: "script.night", color: "indigo" },
    { entity: "light.porch", label: "Porch", color: "amber" },
    { entity: "button.router", icon: "mdi:router" },
  ];
  it("draw a round button per entry, a chip with a label, each in its own colour", () => {
    const r = h.mount(EntityCard, { name: "Scenes", control: "buttons", control_options: SCENES });
    const bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs.map((b) => b.className)).toEqual(["round", "chip", "round"]);
    expect(bs.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Night routine",
      "Porch",
      "Router",
    ]);
    expect(bs.map((b) => b.style.getPropertyValue("--fe-color"))).toEqual([
      "var(--indigo-color)",
      "var(--amber-color)",
      "",
    ]);
    expect(q(bs[1], "span").textContent).toBe("Porch");
    expect(bs[2].querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:router");
    expect(q(r, ".row").textContent).not.toContain("Unavailable");
  });
  it("run a script or a button, flash filled, and switch a light, filled while on", () => {
    const r = h.mount(EntityCard, { name: "Scenes", control: "buttons", control_options: SCENES });
    let bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs[1].classList.contains("on")).toBe(false);
    expect(bs[1].getAttribute("aria-pressed")).toBe("false");
    bs[0].click();
    expect(h.svc()).toEqual(["script.turn_on"]);
    bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs[0].classList.contains("on")).toBe(true);
    vi.advanceTimersByTime(2000);
    bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs[0].classList.contains("on")).toBe(false);
    bs[1].click();
    expect(h.calls[1]).toEqual({
      domain: "homeassistant",
      service: "toggle",
      data: { entity_id: "light.porch" },
    });
    bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs[1].classList.contains("on")).toBe(true);
    expect(bs[1].classList.contains("pending")).toBe(true);
    h.set("light.porch", "on");
    bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs[1].classList.contains("on")).toBe(true);
    expect(bs[1].classList.contains("pending")).toBe(false);
  });
  it("run their own action instead, with their entity as the target", () => {
    const fired: { config: Record<string, unknown> }[] = [];
    document.addEventListener("hass-action", (e) =>
      fired.push((e as CustomEvent).detail as { config: Record<string, unknown> }),
    );
    const r = h.mount(EntityCard, {
      entity: "light.ceiling",
      control: "buttons",
      control_options: [
        { entity: "script.night", action: { action: "more-info" } },
        { icon: "mdi:home", action: { action: "navigate", navigation_path: "/home" } },
        { entity: "sensor.temp" },
      ],
    });
    qa(r, ".ctl-buttons.custom > button").forEach((b) => b.click());
    expect(h.calls).toEqual([]);
    expect(fired.map((f) => [f.config.entity, f.config.tap_action])).toEqual([
      ["script.night", { action: "more-info" }],
      ["light.ceiling", { action: "navigate", navigation_path: "/home" }],
      ["sensor.temp", { action: "more-info" }],
    ]);
  });
  it("say pressed for a switch, not for a lock that is filled while unlocked", () => {
    h.set("lock.door", "unlocked");
    const r = h.mount(EntityCard, {
      name: "Doors",
      control: "buttons",
      control_options: [{ entity: "switch.pump" }, { entity: "lock.door" }],
    });
    const bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", null]);
    expect(bs[1].classList.contains("on")).toBe(true);
  });
  it("warn in a row layout, where they are not drawn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    h.mount(EntityGroupCard, {
      layout: "row",
      entities: [
        { name: "Scenes", control: "buttons", control_options: [{ entity: "script.night" }] },
      ],
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/control 'buttons' is not drawn in a row/),
    );
  });
  it("are disabled one by one by their own entity, never by the row's", () => {
    h.set("light.ceiling", "unavailable");
    h.set("light.porch", "unavailable");
    const r = h.mount(EntityCard, {
      entity: "light.ceiling",
      control: "buttons",
      control_options: SCENES,
    });
    const bs = qa<HTMLButtonElement>(r, ".ctl-buttons.custom > button");
    expect(bs.map((b) => b.disabled)).toEqual([false, true, false]);
  });
  it("each need a hold of their own with control_confirm", () => {
    const r = h.mount(EntityCard, {
      name: "Scenes",
      control: "buttons",
      control_options: SCENES,
      control_confirm: true,
    });
    const bs = qa(r, ".ctl-buttons.custom > button");
    expect(bs.every((b) => b.classList.contains("hold"))).toBe(true);
    expect(bs.map((b) => !!b.querySelector(".ring"))).toEqual([true, false, true]);
    bs[0].dispatchEvent(new MouseEvent("click", { detail: 1, bubbles: true }));
    expect(h.calls).toEqual([]);
    pointer(bs[0], "pointerdown");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    expect(h.svc()).toEqual(["script.turn_on"]);
  });
  it("sit in a column item and a table field", () => {
    const r = h.mount(EntityGroupCard, {
      layout: "table",
      entities: [{ name: "Scenes", control: "buttons", control_options: SCENES }],
    });
    expect(qa(r, ".ctl-buttons.custom.sm > button")).toHaveLength(3);
  });
});

describe("Run chip", () => {
  it("runs a script, says Done for a moment and keeps saying it through state changes", () => {
    const r = h.mount(EntityCard, { entity: "script.night", control: "button" });
    const chip = q(r, ".ctl-chip");
    expect(chip.textContent).toBe("Run");
    expect(chip.getAttribute("aria-label")).toBe("Run Night routine");
    chip.click();
    expect(h.calls).toEqual([
      { domain: "script", service: "turn_on", data: { entity_id: "script.night" } },
    ]);
    expect(q(r, ".ctl-chip").textContent).toBe("Done");
    h.set("script.night", "on");
    expect(q(r, ".ctl-chip").textContent).toBe("Done");
    vi.advanceTimersByTime(2000);
    expect(q(r, ".ctl-chip").textContent).toBe("Run");
  });
  it("presses a never pressed button (state unknown) and is the value of its row", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [{ entity: "button.router", control: "auto" }],
    });
    expect(r.querySelector(".row.list .end > .state")).toBeNull();
    q(r, ".ctl-chip").click();
    expect(h.svc()).toEqual(["button.press"]);
  });
  it("treats a never run scene or script as usable, an unavailable one as not", () => {
    h.def("scene.movie", "unknown", { friendly_name: "Movie" });
    let r = h.mount(EntityCard, { entity: "scene.movie", control: "auto" });
    expect(q<HTMLButtonElement>(r, ".ctl-chip").disabled).toBe(false);
    q(r, ".ctl-chip").click();
    expect(h.svc()).toEqual(["scene.turn_on"]);
    h.def("scene.movie", "unavailable", { friendly_name: "Movie" });
    r = h.mount(EntityCard, { entity: "scene.movie", control: "auto" });
    expect(q<HTMLButtonElement>(r, ".ctl-chip").disabled).toBe(true);
    // a lock in an unknown state stays greyed out
    h.set("lock.door", "unknown");
    r = h.mount(EntityCard, { entity: "lock.door", control: "auto" });
    expect(q<HTMLButtonElement>(r, ".ctl-hold").disabled).toBe(true);
  });
  it("falls back to the row's tap action on a domain with nothing to press", () => {
    const fired: unknown[] = [];
    document.addEventListener("hass-action", (e) => fired.push((e as CustomEvent).detail));
    const r = h.mount(EntityCard, {
      entity: "sensor.temp",
      control: "button",
      tap_action: { action: "navigate", navigation_path: "/climate" },
    });
    q(r, ".ctl-chip").click();
    expect(h.calls).toEqual([]);
    expect(fired).toHaveLength(1);
  });
});

describe("hold to confirm", () => {
  it("names the lock action and runs it once the ring is full", () => {
    const r = h.mount(EntityCard, { entity: "lock.door", control: "auto" });
    const b = q(r, ".ctl-hold");
    expect(b.getAttribute("aria-label")).toBe("Hold to unlock");
    expect(b.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:lock-open-variant");
    pointer(b, "pointerdown");
    expect(b.classList.contains("holding")).toBe(true);
    vi.advanceTimersByTime(HOLD_CONFIRM_MS - 50);
    expect(h.calls).toEqual([]);
    vi.advanceTimersByTime(100);
    expect(h.calls).toEqual([
      { domain: "lock", service: "unlock", data: { entity_id: "lock.door" } },
    ]);
    expect(q(r, ".ctl-hold").classList.contains("pending")).toBe(true);
  });
  it("cancels when let go, cancelled or blurred early", () => {
    const r = h.mount(EntityCard, { entity: "lock.door", control: "hold" });
    for (const end of ["pointerup", "pointercancel", "lostpointercapture"]) {
      const b = q(r, ".ctl-hold");
      pointer(b, "pointerdown");
      vi.advanceTimersByTime(500);
      pointer(b, end);
      expect(b.classList.contains("holding")).toBe(false);
    }
    const b = q(r, ".ctl-hold");
    key(b, "Enter");
    vi.advanceTimersByTime(500);
    b.dispatchEvent(new FocusEvent("blur"));
    vi.advanceTimersByTime(HOLD_CONFIRM_MS);
    expect(h.calls).toEqual([]);
  });
  it("runs with Space or Enter held for a second, not when released early", () => {
    const r = h.mount(EntityCard, { entity: "lock.door", control: "hold" });
    let b = q(r, ".ctl-hold");
    key(b, " ");
    vi.advanceTimersByTime(300);
    key(b, " ", "keyup");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS);
    expect(h.calls).toEqual([]);
    b = q(r, ".ctl-hold");
    key(b, "Enter");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    expect(h.svc()).toEqual(["lock.unlock"]);
  });
  it("keeps its row while held, even when another entity of the card changes", () => {
    const r = h.mount(EntityGroupCard, {
      entities: ["lock.door", "sensor.temp"].map((entity) => ({ entity, control: "auto" })),
    });
    const b = q(r, ".ctl-hold");
    pointer(b, "pointerdown");
    vi.advanceTimersByTime(300);
    h.set("sensor.temp", 22);
    expect(q(r, ".ctl-hold")).toBe(b);
    expect(b.classList.contains("holding")).toBe(true);
    vi.advanceTimersByTime(HOLD_CONFIRM_MS);
    expect(h.svc()).toEqual(["lock.unlock"]);
    expect(qa(r, ".state").some((s) => s.textContent?.includes("22"))).toBe(true);
  });
  it("arms on a screen reader's first press, runs on the second, disarms after five seconds", () => {
    const r = h.mount(EntityCard, { entity: "lock.door", control: "hold" });
    bareClick(q(r, ".ctl-hold"));
    let b = q(r, ".ctl-hold");
    expect(b.classList.contains("armed")).toBe(true);
    expect(b.getAttribute("aria-label")).toBe("Press again to unlock");
    // a re-render keeps the armed state
    h.set("sensor.temp", 23);
    vi.advanceTimersByTime(ARM_MS + 10);
    b = q(r, ".ctl-hold");
    expect(b.classList.contains("armed")).toBe(false);
    expect(b.getAttribute("aria-label")).toBe("Hold to unlock");
    bareClick(b);
    bareClick(q(r, ".ctl-hold"));
    expect(h.svc()).toEqual(["lock.unlock"]);
  });
  it("ignores the click that follows a pointer or key gesture", () => {
    const r = h.mount(EntityCard, { entity: "lock.door", control: "hold" });
    const b = q(r, ".ctl-hold");
    pointer(b, "pointerdown");
    pointer(b, "pointerup");
    bareClick(b);
    expect(b.classList.contains("armed")).toBe(false);
  });
  it("replaces a toggle with control_confirm and toggles", () => {
    const r = h.mount(EntityCard, {
      entity: "switch.pump",
      control: "toggle",
      control_confirm: true,
    });
    expect(r.querySelector(".toggle")).toBeNull();
    const b = q(r, ".ctl-hold");
    expect(b.getAttribute("aria-label")).toBe("Hold to Pump");
    pointer(b, "pointerdown");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    expect(h.svc()).toEqual(["homeassistant.toggle"]);
  });
  it("does nothing but warn on a domain without an on / off meaning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = h.mount(EntityCard, { entity: "sensor.temp", control: "hold" });
    pointer(q(r, ".ctl-hold"), "pointerdown");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    expect(h.calls).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/no service for the control of 'sensor.temp'/),
    );
  });
  it("is disabled while unavailable", () => {
    h.set("lock.door", "unavailable");
    const r = h.mount(EntityCard, { entity: "lock.door", control: "hold" });
    const b = q<HTMLButtonElement>(r, ".ctl-hold");
    expect(b.disabled).toBe(true);
    pointer(b, "pointerdown");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    expect(h.calls).toEqual([]);
  });
});

describe("the row's own action", () => {
  it("lives on a labelled hit layer, not on the row that holds the controls", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "auto" });
    const row = q(r, ".row");
    expect(row.hasAttribute("role")).toBe(false);
    expect(row.hasAttribute("tabindex")).toBe(false);
    expect(row.classList.contains("actionable")).toBe(true);
    const hit = q(r, ".row > .hit");
    expect(row.firstElementChild).toBe(hit);
    expect(hit.getAttribute("role")).toBe("button");
    expect(hit.tabIndex).toBe(0);
    expect(hit.getAttribute("aria-label")).toBe("Ceiling");
  });
  it("stays first through re-renders and follows the entity's name", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "auto" });
    const hit = q(r, ".row > .hit");
    h.set("light.ceiling", "off", { friendly_name: "Ceiling lamp" });
    expect(q(r, ".row").firstElementChild).toBe(hit);
    expect(hit.getAttribute("aria-label")).toBe("Ceiling lamp");
  });
  it("takes a configured name over the entity's", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", name: "Big light", control: "auto" });
    expect(q(r, ".hit").getAttribute("aria-label")).toBe("Big light");
  });
  it("is left out when the entity has no actions", () => {
    const r = h.mount(EntityCard, {
      entity: "light.ceiling",
      control: "toggle",
      tap_action: "none",
      hold_action: "none",
    });
    expect(r.querySelector(".hit")).toBeNull();
    expect(q(r, ".row").classList.contains("actionable")).toBe(false);
  });
  it("is never reached by a control's own gestures", () => {
    const fired: unknown[] = [];
    document.addEventListener("hass-action", (e) => fired.push((e as CustomEvent).detail));
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "auto" });
    pointer(q(r, ".toggle"), "pointerdown");
    pointer(q(r, ".toggle"), "pointerup");
    q(r, ".toggle").click();
    key(q(r, ".ctl-slider"), "Enter");
    expect(fired).toEqual([]);
    key(q(r, ".hit"), "Enter");
    expect(fired).toHaveLength(1);
  });
});

describe("focus", () => {
  const active = (r: ShadowRoot) => r.activeElement as HTMLElement | null;
  it("stays on the same control when the card re-renders", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [{ entity: "light.ceiling", control: "auto" }, { entity: "sensor.temp" }],
    });
    q(r, ".ctl-slider").focus();
    h.set("sensor.temp", 25);
    expect(active(r)?.classList.contains("ctl-slider")).toBe(true);
    h.set("light.ceiling", "on", { brightness: 200 });
    expect(active(r)?.classList.contains("ctl-slider")).toBe(true);
    expect(active(r)?.getAttribute("aria-valuenow")).toBe("78");
  });
  it("stays on the toggle after it was pressed", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").focus();
    q(r, ".toggle").click();
    expect(active(r)?.classList.contains("toggle")).toBe(true);
  });
  it("stays on the stepper's button after a step", () => {
    const r = h.mount(EntityCard, { entity: "climate.living", control: "stepper" });
    const inc = qa(r, ".ctl-stepper button")[1];
    inc.focus();
    inc.click();
    expect(active(r)).toBe(qa(r, ".ctl-stepper button")[1]);
  });
  it("stays on the hit layer when the row's entity changes", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "auto" });
    q(r, ".hit").focus();
    h.set("light.ceiling", "off");
    expect(active(r)?.classList.contains("hit")).toBe(true);
  });
});

describe("failure", () => {
  it("drops the ghost, fires the failure haptic and a toast with the error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const events: [string, unknown][] = [];
    for (const type of ["haptic", "hass-notification"])
      document.addEventListener(type, (e) => events.push([type, (e as CustomEvent).detail]));
    h.fail = true;
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").click();
    expect(q(r, ".toggle").classList.contains("pending")).toBe(true);
    await settle();
    expect(q(r, ".toggle").classList.contains("pending")).toBe(false);
    expect(events).toEqual([
      ["haptic", "light"],
      ["haptic", "failure"],
      ["hass-notification", { message: "homeassistant.toggle: nope" }],
    ]);
  });
});

describe("layouts", () => {
  it("lists put the controls on the line and the slider under it", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [
        { entity: "light.ceiling", control: "auto" },
        { entity: "cover.blinds", control: "auto" },
      ],
    });
    const [light, cover] = qa(r, ".row.list");
    expect(light.querySelector(".end > .toggle")).toBeTruthy();
    expect(light.querySelector(".main > .ctl-slider")).toBeTruthy();
    expect(cover.querySelectorAll(".end .ctl-buttons .round")).toHaveLength(3);
    expect(cover.querySelector(".main > .ctl-slider")).toBeTruthy();
  });
  it("grid cells put small controls next to the icon", () => {
    const r = h.mount(EntityGroupCard, {
      layout: "grid",
      entities: [
        { entity: "light.ceiling", control: "auto" },
        { entity: "climate.living", control: "stepper" },
      ],
    });
    const [light, climate] = qa(r, ".cell");
    expect(light.querySelector(".gtop > .end > .toggle.sm")).toBeTruthy();
    expect(light.querySelector(":scope > .ctl-slider.sm")).toBeTruthy();
    expect(climate.querySelector(".gtop .ctl-stepper.sm")).toBeTruthy();
  });
  it("hero leads hold controls on the line and under it", () => {
    const r = h.mount(EntityGroupCard, {
      layout: "hero",
      entities: [
        { entity: "light.ceiling", control: "auto" },
        { entity: "switch.pump", control: "toggle" },
      ],
    });
    expect(q(r, ".row.hero .end > .toggle")).toBeTruthy();
    expect(q(r, ".row.hero > .ctl-slider")).toBeTruthy();
    expect(q(r, ".row.list .end > .toggle")).toBeTruthy();
  });
  it("row items make the icon the control and drop what does not fit", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = h.mount(EntityGroupCard, {
      layout: "row",
      entities: [
        { entity: "light.ceiling", control: "toggle" },
        { entity: "script.night", control: "button" },
        { entity: "lock.door", control: "auto" },
        { entity: "cover.blinds", control: "slider" },
        { entity: "switch.pump", control: "stepper" },
      ],
    });
    const [light, script, lock, cover, pump] = qa(r, ".row.item");
    expect(light.querySelector(".lead.tap[role=switch]")).toBeTruthy();
    expect(script.querySelector(".ctl-chip.round")?.getAttribute("aria-label")).toBe("Run");
    expect(script.querySelector(":scope > .lead")).toBeNull();
    expect(lock.querySelector(".ctl-hold.lead-size")).toBeTruthy();
    expect(cover.querySelector(".ctl")).toBeNull();
    expect(cover.querySelector(".lead")).toBeTruthy();
    // the cover's defaults (buttons, slider) do not fit a row item either; the switch's toggle does
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/control 'slider' is not drawn in a row; .*no control is drawn/),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/control 'stepper' is not drawn in a row; using the domain default$/),
    );
    expect(pump.querySelector(".lead.tap[role=switch]")).toBeTruthy();
    script.querySelector<HTMLElement>(".ctl-chip")?.click();
    expect(h.svc()).toEqual(["script.turn_on"]);
  });
  it("says so when nothing fits a row item", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    h.mount(EntityGroupCard, {
      layout: "row",
      entities: [{ entity: "input_select.mode", control: "select" }],
    });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/no control is drawn/));
  });
  it("column items put the control on the right", () => {
    const r = h.mount(EntityGroupCard, {
      layout: "column",
      entities: [
        { entity: "climate.living", control: "stepper" },
        { entity: "switch.pump", control: "toggle" },
      ],
    });
    const [climate, pump] = qa(r, ".row.item");
    expect(climate.querySelector(":scope > .end > .ctl-stepper.sm")).toBeTruthy();
    expect(pump.querySelector(":scope > .end > .toggle.sm")).toBeTruthy();
  });
  it("table fields put small controls next to the value", () => {
    const r = h.mount(EntitySectionsCard, {
      sections: [
        {
          layout: "table",
          entities: [
            { entity: "switch.pump", control: "toggle" },
            { entity: "fan.ceiling", control: "segments" },
            { entity: "input_select.mode", control: "select" },
          ],
        },
      ],
    });
    const [pump, fan, mode] = qa(r, ".row.field");
    expect(pump.querySelector(".val > .toggle.sm")).toBeTruthy();
    expect(fan.querySelector(".val > .ctl-segments.sm")).toBeTruthy();
    expect(mode.querySelector(".val > .ctl-select.sm")).toBeTruthy();
  });
  it("header entities never draw a control", () => {
    const r = h.mount(EntityGroupCard, {
      title: "Room",
      header_entities: [{ entity: "switch.pump", control: "toggle" }],
      entities: ["sensor.temp"],
    });
    expect(q(r, ".header .row.hval")).toBeTruthy();
    expect(r.querySelector(".header .ctl, .header .toggle")).toBeNull();
  });
  it("a control: none or no control draws nothing", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [{ entity: "light.ceiling", control: "none" }, { entity: "light.ceiling" }],
    });
    expect(r.querySelector(".ctl, .toggle")).toBeNull();
  });
});

describe("sizing", () => {
  it("a tile with a control sizes to its content, so a wrapped control is never cut off", () => {
    const el = new EntityCard();
    el.setConfig({ entity: "light.ceiling", control: "auto" });
    expect(el.getGridOptions()).toMatchObject({ rows: "auto" });
    expect(el.getCardSize()).toBe(2);
    el.setConfig({ entity: "switch.pump", control: "auto" });
    expect(el.getGridOptions()).toMatchObject({ rows: "auto" });
    expect(el.getGridOptions()).not.toHaveProperty("max_rows");
    expect(el.getCardSize()).toBe(1);
    el.setConfig({ entity: "light.ceiling" });
    expect(el.getGridOptions()).toMatchObject({ rows: 1, max_rows: 1 });
  });
  it("a tile never gets narrower than what sits on its line needs", () => {
    const el = new EntityCard();
    const min = (cfg: Record<string, unknown>) => {
      el.setConfig(cfg);
      return el.getGridOptions().min_columns;
    };
    expect(min({ entity: "sensor.temp" })).toBe(3);
    expect(min({ entity: "switch.pump", control: "toggle" })).toBe(4);
    expect(min({ entity: "lock.door", control: "hold" })).toBe(4);
    for (const control of ["stepper", "segments", "buttons", "select", "button"])
      expect(min({ entity: "cover.blinds", control })).toBe(6);
    expect(min({ entity: "cover.blinds", control: "slider", control_position: "end" })).toBe(6);
    // under the line or on the icon the control needs no room on the line
    expect(min({ entity: "cover.blinds", control: "slider" })).toBe(3);
    expect(min({ entity: "switch.pump", control: "toggle", control_position: "lead" })).toBe(3);
    expect(min({ entity: "light.ceiling", control: "auto" })).toBe(4);
  });
  it("a list counts one more row per block control", () => {
    const el = new EntityGroupCard();
    const entities = (control?: string) =>
      ["light.ceiling", "switch.pump"].map((entity) => ({ entity, control }));
    el.setConfig({ entities: entities() });
    const plain = el.getCardSize();
    el.setConfig({ entities: entities("auto") });
    expect(el.getCardSize()).toBe(plain + 1);
    el.setConfig({ entities: entities("toggle") });
    expect(el.getCardSize()).toBe(plain);
  });
});

describe("confirmed buttons and the armed state", () => {
  it("arming one button never confirms its neighbour", () => {
    const r = h.mount(EntityCard, {
      entity: "cover.blinds",
      control: "buttons",
      control_confirm: true,
    });
    bareClick(qa(r, ".ctl-buttons .round")[0]);
    bareClick(qa(r, ".ctl-buttons .round")[1]);
    expect(h.calls).toEqual([]);
    const bs = qa(r, ".ctl-buttons .round");
    expect(bs.map((b) => b.classList.contains("armed"))).toEqual([true, true, false]);
    expect(bs.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Press again to Open",
      "Press again to Stop",
      "Hold to Close",
    ]);
    bareClick(bs[1]);
    expect(h.svc()).toEqual(["cover.stop_cover"]);
  });
  it("keeps each button's armed state through a re-render, and only that button's", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [
        { entity: "cover.blinds", control: "buttons", control_confirm: true },
        { entity: "sensor.temp" },
      ],
    });
    bareClick(qa(r, ".ctl-buttons .round")[2]);
    h.set("sensor.temp", 19);
    const bs = qa(r, ".ctl-buttons .round");
    expect(bs.map((b) => b.classList.contains("armed"))).toEqual([false, false, true]);
    bareClick(bs[2]);
    expect(h.svc()).toEqual(["cover.close_cover"]);
  });
  it("a lock's hold and a cover's buttons in one card arm apart", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [
        { entity: "lock.door", control: "hold" },
        { entity: "cover.blinds", control: "buttons", control_confirm: true },
      ],
    });
    bareClick(q(r, ".ctl-hold"));
    bareClick(qa(r, ".ctl-buttons .round")[0]);
    expect(h.calls).toEqual([]);
  });
});

describe("controls sharing one entity", () => {
  it("a light's switch ghost leaves its slider alone, and the other way round", () => {
    const r = h.mount(EntityCard, { entity: "light.ceiling", control: "auto" });
    q(r, ".toggle").click();
    expect(q(r, ".toggle").classList.contains("pending")).toBe(true);
    let s = q(r, ".ctl-slider");
    expect(s.classList.contains("pending")).toBe(false);
    expect(s.getAttribute("aria-valuenow")).toBe("50");
    h.set("light.ceiling", "on", { brightness: 128 });
    key(q(r, ".ctl-slider"), "ArrowRight");
    vi.advanceTimersByTime(300);
    s = q(r, ".ctl-slider");
    expect(s.classList.contains("pending")).toBe(true);
    expect(q(r, ".toggle").classList.contains("pending")).toBe(false);
  });
  it("one entity listed twice: each row has its own ghost, the answer clears both", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [
        { entity: "switch.pump", control: "toggle" },
        { entity: "switch.pump", name: "Pump again", control: "toggle" },
      ],
    });
    qa(r, ".toggle")[0].click();
    qa(r, ".toggle")[1].click();
    expect(qa(r, ".toggle").map((t) => t.classList.contains("pending"))).toEqual([true, true]);
    h.set("switch.pump", "on");
    expect(qa(r, ".toggle").map((t) => t.classList.contains("pending"))).toEqual([false, false]);
    expect(qa(r, ".toggle").map((t) => t.getAttribute("aria-checked"))).toEqual(["true", "true"]);
  });
  it("a sticky Done survives the answer, a plain ghost does not", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [
        { entity: "script.night", control: "button" },
        { entity: "script.night", name: "Again", control: "toggle" },
      ],
    });
    q(r, ".ctl-chip").click();
    q(r, ".toggle").click();
    h.set("script.night", "on");
    expect(q(r, ".ctl-chip").textContent).toBe("Done");
    expect(q(r, ".toggle").classList.contains("pending")).toBe(false);
  });
});

describe("focus edge cases", () => {
  const active = (r: ShadowRoot) => r.activeElement as HTMLElement | null;
  it("moves to the row's own action when the focused control comes back disabled", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").focus();
    h.set("switch.pump", "unavailable");
    expect(q<HTMLButtonElement>(r, ".toggle").disabled).toBe(true);
    expect(active(r)?.classList.contains("hit")).toBe(true);
  });
  it("keeps the focus on the row while the entity comes back, the control usable again", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").focus();
    h.set("switch.pump", "unavailable");
    h.set("switch.pump", "off");
    // the hit layer kept the focus; the control is reachable again
    expect(active(r)?.classList.contains("hit")).toBe(true);
    expect(q<HTMLButtonElement>(r, ".toggle").disabled).toBe(false);
  });
  it("leaves the focus alone when nothing in the card has it", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    h.set("switch.pump", "on");
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});

describe("lifecycle", () => {
  it("a new config drops the ghosts and the armed buttons", () => {
    const el = new EntityCard();
    el.setConfig({ entity: "lock.door", control: "hold" });
    document.body.appendChild(el);
    el.hass = h.hass();
    h.cards.push(el);
    const r = el.shadowRoot as ShadowRoot;
    bareClick(q(r, ".ctl-hold"));
    expect(q(r, ".ctl-hold").classList.contains("armed")).toBe(true);
    el.setConfig({ entity: "lock.door", control: "hold" });
    expect(q(r, ".ctl-hold").classList.contains("armed")).toBe(false);
    el.setConfig({ entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").click();
    el.setConfig({ entity: "switch.pump", control: "toggle" });
    expect(q(r, ".toggle").classList.contains("pending")).toBe(false);
  });
  it("a removed card stops redrawing when its ghosts expire", () => {
    const el = new EntityCard();
    el.setConfig({ entity: "switch.pump", control: "toggle" });
    document.body.appendChild(el);
    el.hass = h.hass();
    q(el.shadowRoot as ShadowRoot, ".toggle").click();
    el.remove();
    const render = vi.spyOn(el, "_render");
    vi.advanceTimersByTime(PENDING_MS * 2);
    expect(render).not.toHaveBeenCalled();
  });
});

describe("slider details", () => {
  it("a cancelled drag commits nothing and lets the row redraw again", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [{ entity: "cover.blinds", control: "slider" }, { entity: "sensor.temp" }],
    });
    const s = q(r, ".ctl-slider");
    pointer(s, "pointerdown");
    expect(s.classList.contains("dragging")).toBe(true);
    pointer(s, "pointercancel");
    expect(s.classList.contains("dragging")).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(h.calls).toEqual([]);
    h.set("cover.blinds", "open", { current_position: 70 });
    expect(q(r, ".ctl-slider").getAttribute("aria-valuenow")).toBe("70");
  });
  it("formats the value in the profile language", () => {
    h.language = "de";
    h.def("input_number.mix", 2.5, {
      friendly_name: "Mix",
      min: 0,
      max: 5,
      step: 0.5,
      unit_of_measurement: "l",
    });
    const r = h.mount(EntityCard, { entity: "input_number.mix", control: "slider" });
    const s = q(r, ".ctl-slider");
    expect(s.getAttribute("aria-valuetext")).toBe("2,5 l");
    expect(s.getAttribute("aria-label")).toBe("Mix einstellen");
    key(s, "ArrowRight");
    expect(s.getAttribute("aria-valuetext")).toBe("3,0 l");
  });
});

describe("haptics", () => {
  const haptics = () => {
    const got: unknown[] = [];
    document.addEventListener("haptic", (e) => got.push((e as CustomEvent).detail));
    return got;
  };
  it("a switch taps lightly, a step or a slide selects, a run or a hold succeeds", () => {
    const got = haptics();
    let r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    q(r, ".toggle").click();
    r = h.mount(EntityCard, { entity: "climate.living", control: "stepper" });
    qa(r, ".ctl-stepper button")[1].click();
    r = h.mount(EntityCard, { entity: "light.ceiling", control: "slider" });
    key(q(r, ".ctl-slider"), "ArrowRight");
    vi.advanceTimersByTime(300);
    r = h.mount(EntityCard, { entity: "script.night", control: "button" });
    q(r, ".ctl-chip").click();
    r = h.mount(EntityCard, { entity: "lock.door", control: "hold" });
    pointer(q(r, ".ctl-hold"), "pointerdown");
    vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
    r = h.mount(EntityCard, { entity: "cover.blinds", control: "buttons" });
    qa(r, ".ctl-buttons .round")[0].click();
    expect(got).toEqual(["light", "selection", "selection", "success", "success", "light"]);
  });
});

describe("review fixes", () => {
  describe("a control on the icon keeps its kind", () => {
    it("a confirmed toggle on the icon is a hold, never a tap", () => {
      const r = h.mount(EntityCard, {
        entity: "switch.pump",
        control: "toggle",
        control_position: "lead",
        control_confirm: true,
      });
      expect(r.querySelector(".lead.tap")).toBeNull();
      const b = q(r, ".top > .ctl-hold.lead-size");
      expect(b.style.getPropertyValue("--lead")).toBe("40px");
      b.dispatchEvent(new MouseEvent("click", { detail: 1, bubbles: true }));
      expect(h.calls).toEqual([]);
      pointer(b, "pointerdown");
      vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
      expect(h.svc()).toEqual(["homeassistant.toggle"]);
    });
    it("a lock's hold on the icon locks or unlocks, at the size of each row's icon", () => {
      const r = h.mount(EntityGroupCard, {
        layout: "hero",
        entities: [
          { entity: "lock.door", control: "hold", control_position: "lead" },
          { entity: "lock.door", control: "hold", control_position: "lead" },
        ],
      });
      const [hero, list] = qa(r, ".ctl-hold.lead-size");
      expect(hero.style.getPropertyValue("--lead")).toBe("56px");
      expect(list.style.getPropertyValue("--lead")).toBe("36px");
      pointer(hero, "pointerdown");
      vi.advanceTimersByTime(HOLD_CONFIRM_MS + 10);
      expect(h.svc()).toEqual(["lock.unlock"]);
    });
    it("a scene's button on the icon runs the scene in a grid cell", () => {
      h.def("scene.movie", "unknown", { friendly_name: "Movie" });
      const r = h.mount(EntityGroupCard, {
        layout: "grid",
        entities: [{ entity: "scene.movie", control: "button", control_position: "lead" }],
      });
      const b = q(r, ".cell .ctl-chip.round");
      expect(b.style.getPropertyValue("--lead")).toBe("32px");
      b.click();
      expect(h.svc()).toEqual(["scene.turn_on"]);
    });
  });

  describe("availability follows the entity, not the shown value", () => {
    it("an off light shown by its brightness can be switched on and dimmed", () => {
      h.set("light.ceiling", "off", { brightness: undefined });
      const r = h.mount(EntityCard, {
        entity: "light.ceiling",
        attribute: "brightness",
        control: "auto",
      });
      const t = q<HTMLButtonElement>(r, ".toggle");
      expect(t.disabled).toBe(false);
      expect(q(r, ".ctl-slider").classList.contains("disabled")).toBe(false);
      t.click();
      expect(h.svc()).toEqual(["homeassistant.toggle"]);
    });
    it("an idle player shown by its title keeps its buttons", () => {
      h.set("media_player.tv", "idle");
      const r = h.mount(EntityCard, {
        entity: "media_player.tv",
        attribute: "media_title",
        control: "buttons",
      });
      expect(qa<HTMLButtonElement>(r, ".ctl-buttons .round").every((b) => !b.disabled)).toBe(true);
    });
    it("an unavailable entity with a text value greys its controls out", () => {
      h.set("switch.pump", "unavailable");
      const r = h.mount(EntityCard, { entity: "switch.pump", value: "Garage", control: "toggle" });
      expect(q<HTMLButtonElement>(r, ".toggle").disabled).toBe(true);
    });
  });

  it("a fan with fine speed steps gets a slider, not a hundred segments", () => {
    h.set("fan.ceiling", "on", { percentage: 37, percentage_step: 1 });
    const r = h.mount(EntityCard, { entity: "fan.ceiling", control: "auto" });
    expect(r.querySelector(".ctl-segments")).toBeNull();
    const s = q(r, ".end > .ctl-slider");
    expect(s.getAttribute("aria-valuenow")).toBe("37");
    key(s, "ArrowRight");
    vi.advanceTimersByTime(300);
    expect(h.calls).toEqual([
      {
        domain: "fan",
        service: "set_percentage",
        data: { entity_id: "fan.ceiling", percentage: 38 },
      },
    ]);
  });

  describe("the value stays when no control shows it", () => {
    it("a fan without speeds keeps its value beside the switch", () => {
      h.set("fan.ceiling", "on", { percentage: undefined, percentage_step: undefined });
      const r = h.mount(EntityGroupCard, {
        entities: [{ entity: "fan.ceiling", control: "auto" }],
      });
      expect(r.querySelector(".ctl-segments")).toBeNull();
      expect(q(r, ".row.list .end > .state").textContent).toBe("on");
    });
    it("an unavailable select shows that it is unavailable", () => {
      h.def("input_select.mode", "unavailable", { friendly_name: "Mode" });
      const r = h.mount(EntityGroupCard, {
        entities: [{ entity: "input_select.mode", control: "select" }],
      });
      expect(r.querySelector(".ctl-select")).toBeNull();
      expect(q(r, ".row.list .end > .state").textContent).toBe("–");
    });
    it("a disabled select next to stale options keeps the value text too", () => {
      h.set("input_select.mode", "unavailable");
      const r = h.mount(EntityGroupCard, {
        entities: [{ entity: "input_select.mode", control: "select" }],
      });
      expect(q<HTMLSelectElement>(r, "select").disabled).toBe(true);
      expect(r.querySelector(".row.list .end > .state")).toBeTruthy();
    });
  });

  it("a ghost that expired while the card was away is gone when it comes back", () => {
    const r = h.mount(EntityCard, { entity: "script.night", control: "button" });
    const el = h.cards[0];
    q(r, ".ctl-chip").click();
    expect(q(r, ".ctl-chip").textContent).toBe("Done");
    el.remove();
    vi.advanceTimersByTime(5000);
    document.body.appendChild(el);
    expect(q(r, ".ctl-chip").textContent).toBe("Run");
  });
  it("a ghost still running when the card comes back expires on time", () => {
    const r = h.mount(EntityCard, { entity: "switch.pump", control: "toggle" });
    const el = h.cards[0];
    q(r, ".toggle").click();
    el.remove();
    vi.advanceTimersByTime(1000);
    document.body.appendChild(el);
    expect(q(r, ".toggle").classList.contains("pending")).toBe(true);
    vi.advanceTimersByTime(PENDING_MS);
    expect(q(r, ".toggle").classList.contains("pending")).toBe(false);
  });

  it("an open select keeps its row through other updates and catches up when it closes", () => {
    const r = h.mount(EntityGroupCard, {
      entities: [{ entity: "input_select.mode", control: "select" }, { entity: "sensor.temp" }],
    });
    const sel = q<HTMLSelectElement>(r, "select");
    sel.focus();
    h.set("sensor.temp", 30);
    h.set("input_select.mode", "Away");
    expect(q(r, "select")).toBe(sel);
    expect(qa(r, ".state").some((s) => s.textContent?.includes("30"))).toBe(true);
    sel.blur();
    sel.dispatchEvent(new FocusEvent("blur"));
    expect(q(r, "select")).not.toBe(sel);
    expect(chosen(q<HTMLSelectElement>(r, "select"))).toBe("Away");
  });

  it("a fan's own options show the nearest one as chosen", () => {
    h.set("fan.ceiling", "on", { percentage: 50 });
    const r = h.mount(EntityCard, {
      entity: "fan.ceiling",
      control: "segments",
      control_options: [0, 50, 100],
    });
    expect(qa(r, ".seg").map((s) => s.getAttribute("aria-checked"))).toEqual([
      "false",
      "true",
      "false",
    ]);
  });

  describe("controls asked for on the icon where there is none", () => {
    it("a ring cell draws them under the ring, with its block slider", () => {
      const r = h.mount(EntityGroupCard, {
        layout: "grid",
        entities: [{ entity: "light.ceiling", visual: "ring", control: "auto" }],
      });
      expect(q(r, ".cell > .end > .toggle.sm")).toBeTruthy();
      expect(q(r, ".cell > .ctl-slider")).toBeTruthy();
    });
    it("a table field draws them beside the value", () => {
      const r = h.mount(EntitySectionsCard, {
        sections: [
          {
            layout: "table",
            show_icon: true,
            entities: [{ entity: "switch.pump", control: "toggle", control_position: "lead" }],
          },
        ],
      });
      expect(q(r, ".row.field .val > .toggle.sm")).toBeTruthy();
      expect(r.querySelector(".lead.tap")).toBeNull();
    });
  });
});

describe("the hold button's icon", () => {
  const iconOf = (cfg: Record<string, unknown>) =>
    q(h.mount(EntityCard, cfg), ".ctl-hold ha-icon, .ctl-hold ha-state-icon").getAttribute("icon");
  it("shows what holding does, never the icon the row already shows", () => {
    expect(iconOf({ entity: "switch.pump", control: "toggle", control_confirm: true })).toBe(
      "mdi:power",
    );
    expect(iconOf({ entity: "script.night", control: "hold" })).toBe("mdi:play");
    expect(iconOf({ entity: "cover.garage", control: "hold" })).toBe("mdi:arrow-up-down");
    expect(iconOf({ entity: "lock.door", control: "hold" })).toBe("mdi:lock-open-variant");
  });
  it("is the entity's own icon when it replaces the icon", () => {
    const r = h.mount(EntityCard, {
      entity: "switch.pump",
      icon: "mdi:water-pump",
      control: "hold",
      control_position: "lead",
    });
    expect(q(r, ".ctl-hold.lead-size ha-icon").getAttribute("icon")).toBe("mdi:water-pump");
  });
});
