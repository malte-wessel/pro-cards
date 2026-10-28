// The poster as the entity cards draw it (happy-dom): its skeleton, the label pill and the badges
// in its corner, the name and the big value, the controls beside the value, a gauge as its picture,
// and the group and sections cards' posters and vertical_align. Fitting the value to the width
// needs a real layout and lives in the visual cases.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntityCard } from "../../../../src/entity-card.ts";
import { EntityGroupCard } from "../../../../src/entity-group-card.ts";
import { EntitySectionsCard } from "../../../../src/entity-sections-card.ts";
import type { HassEntity, HomeAssistant } from "../../../../src/shared/ha.ts";

type Card = EntityCard | EntityGroupCard | EntitySectionsCard;

// a tiny home: its states and a fresh hass for every change
class Home {
  states: Record<string, HassEntity> = {};
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
      locale: { language: "en" },
      config: { unit_system: { temperature: "°C" } },
      // as Home Assistant formats a state: with its unit
      formatEntityState: (st: HassEntity) =>
        st.attributes.unit_of_measurement
          ? `${st.state} ${st.attributes.unit_of_measurement}`
          : st.state,
      callService: () => Promise.resolve(),
      // the history of a plot never arrives: the plot is drawn empty
      callWS: () => new Promise(() => {}),
    } as unknown as HomeAssistant;
  }
  set(id: string, state: string | number, attrs: Record<string, unknown> = {}) {
    const cur = this.states[id];
    this.def(id, state, { ...cur.attributes, ...attrs });
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
}

const q = <E extends Element = HTMLElement>(r: ParentNode, sel: string) => {
  const el = r.querySelector<E>(sel);
  if (!el) throw new Error(`no element for ${sel}`);
  return el;
};
// the classes of the poster body's children, in order
const bodyParts = (r: ParentNode) => [...q(r, ".pbody").children].map((c) => c.className);

let h: Home;
beforeEach(() => {
  h = new Home({
    "sensor.temp": [21.4, { friendly_name: "Temperature", unit_of_measurement: "°C" }],
    "sensor.hum": [55, { friendly_name: "Humidity", unit_of_measurement: "%" }],
    "sensor.co2": [640, { friendly_name: "CO2", unit_of_measurement: "ppm" }],
    "vacuum.robot": ["cleaning", { friendly_name: "Robot" }],
    "climate.living": [
      "heat",
      {
        friendly_name: "Thermostat",
        temperature: 21,
        current_temperature: 20.4,
        min_temp: 5,
        max_temp: 30,
        target_temp_step: 0.5,
        hvac_modes: ["off", "heat", "auto"],
      },
    ],
    "input_select.mode": ["Home", { friendly_name: "Mode", options: ["Home", "Away"] }],
    "script.night": ["off", { friendly_name: "Night routine" }],
    "switch.pump": ["off", { friendly_name: "Pump" }],
  });
});
afterEach(() => {
  for (const c of h.cards) c.remove();
  vi.restoreAllMocks();
});

describe("the poster's skeleton", () => {
  it("has the lead and the corner on top and the body below", () => {
    const r = h.mount(EntityCard, { entity: "sensor.temp", layout: "poster" });
    expect(q(r, "ha-card").classList.contains("layout-poster")).toBe(true);
    const row = q(r, ".row.poster");
    expect(row.querySelector(":scope > .ptop > .plead > .lead")).not.toBeNull();
    expect(row.querySelector(":scope > .ptop > .corner > .plabel.pill")).not.toBeNull();
    expect(row.querySelector(":scope > .pbody")).not.toBeNull();
    // the action layer stays first
    expect(row.firstElementChild?.classList.contains("hit")).toBe(true);
  });
  it("draws the badges as rows of their own in the corner, under the label", () => {
    const r = h.mount(EntityCard, {
      entity: "sensor.temp",
      layout: "poster",
      badges: ["sensor.hum", { entity: "sensor.co2", style: "filled" }],
    });
    const corner = q(r, ".row.poster .corner");
    const kids = [...corner.children];
    expect(kids[0].classList.contains("plabel")).toBe(true);
    const badges = kids.slice(1) as HTMLElement[];
    expect(badges.map((b) => b.dataset.idx)).toEqual(["1", "2"]);
    expect(badges.every((b) => b.classList.contains("row") && b.classList.contains("hval"))).toBe(
      true,
    );
    expect(badges[0].classList.contains("b-outline")).toBe(true);
    expect(badges[1].classList.contains("b-filled")).toBe(true);
    expect(badges[0].textContent).toContain("55");
    expect(badges[1].textContent).toContain("640");
  });
  it("keeps its badges when the poster is filled again", () => {
    const r = h.mount(EntityCard, {
      entity: "sensor.temp",
      layout: "poster",
      badges: ["sensor.hum"],
    });
    const badge = q(r, ".corner > .row.hval");
    h.set("sensor.temp", 23.5);
    expect(q(r, ".pvalue .big b").textContent).toBe("23.5");
    expect(q(r, ".corner > .row.hval")).toBe(badge);
    expect(r.querySelectorAll(".corner > .row.hval")).toHaveLength(1);
    // a badge's own change fills the badge in place
    h.set("sensor.hum", 61);
    expect(q(r, ".corner > .row.hval")).toBe(badge);
    expect(badge.textContent).toContain("61");
    expect(q(r, ".pvalue .big b").textContent).toBe("23.5");
  });
});

describe("the poster's texts", () => {
  it("shows the matching rule's label in the pill, and hides the pill without one", () => {
    const r = h.mount(EntityCard, {
      entity: "sensor.temp",
      layout: "poster",
      rules: [{ above: 25, label: "Hot" }],
    });
    const pill = q(r, ".plabel");
    expect(pill.hidden).toBe(true);
    expect(pill.textContent).toBe("");
    h.set("sensor.temp", 26);
    expect(q(r, ".plabel").hidden).toBe(false);
    expect(q(r, ".plabel").textContent).toBe("Hot");
  });
  it("puts the value in the pill with visual: badge when no rule names it", () => {
    const r = h.mount(EntityCard, {
      entity: "vacuum.robot",
      layout: "poster",
      visual: "badge",
      rules: [{ state: "docked", label: "Parked" }],
    });
    expect(q(r, ".plabel").textContent).toBe("cleaning");
    expect(q(r, ".plabel").hidden).toBe(false);
    h.set("vacuum.robot", "docked");
    expect(q(r, ".plabel").textContent).toBe("Parked");
  });
  it("shows the name and the big value with its unit", () => {
    const r = h.mount(EntityCard, { entity: "sensor.temp", layout: "poster" });
    expect(q(r, ".pbody > .pname").textContent).toBe("Temperature");
    expect(q(r, ".pvalue > .big > b").textContent).toBe("21.4");
    expect(q(r, ".pvalue > .big > span").textContent).toBe("°C");
    expect(q(r, ".pvalue > .big").classList.contains("word")).toBe(false);
    expect(bodyParts(r)).toEqual(["pname", "pvalue"]);
  });
  it("draws a word smaller than a number", () => {
    const r = h.mount(EntityCard, { entity: "vacuum.robot", layout: "poster" });
    expect(q(r, ".pvalue > .big").classList.contains("word")).toBe(true);
    expect(q(r, ".pvalue > .big > b").textContent).toBe("cleaning");
  });
  it("adds the secondary line under the value", () => {
    const r = h.mount(EntityCard, {
      entity: "sensor.temp",
      layout: "poster",
      name: "Living room",
      secondary: "Feels like 20",
    });
    expect(bodyParts(r)).toEqual(["pname", "pvalue", "secondary"]);
    expect(q(r, ".pname").textContent).toBe("Living room");
    expect(q(r, ".pbody > .secondary").textContent).toBe("Feels like 20");
  });
  it("puts the name under the value with name_position: below", () => {
    const r = h.mount(EntityCard, {
      entity: "sensor.temp",
      layout: "poster",
      name_position: "below",
    });
    expect(bodyParts(r)).toEqual(["pvalue", "pname"]);
  });
});

describe("controls beside the poster's value", () => {
  it("a stepper that shows the very same number takes the value's place", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "temperature",
      layout: "poster",
      control: "stepper",
    });
    expect(r.querySelector(".pvalue .big")).toBeNull();
    expect(r.querySelector(".pvalue > .end > .ctl-stepper")).not.toBeNull();
  });
  it("a stepper beside another number keeps the value", () => {
    const r = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "current_temperature",
      layout: "poster",
      control: "stepper",
    });
    expect(q(r, ".pvalue > .big > b").textContent).toBe("20.4");
    expect(r.querySelector(".pvalue > .end > .ctl-stepper")).not.toBeNull();
  });
  it("keeps the value beside segments, a select and a button", () => {
    const seg = h.mount(EntityCard, {
      entity: "climate.living",
      attribute: "hvac_mode",
      layout: "poster",
      control: "segments",
    });
    // the segments show the same mode, yet the value is the poster's point
    expect(q(seg, ".pvalue > .big > b").textContent).toBe("heat");
    expect(seg.querySelector(".pvalue > .end > .ctl-segments")).not.toBeNull();
    const sel = h.mount(EntityCard, {
      entity: "input_select.mode",
      layout: "poster",
      control: "auto",
    });
    expect(q(sel, ".pvalue > .big > b").textContent).toBe("Home");
    expect(sel.querySelector(".pvalue > .end > .ctl-select")).not.toBeNull();
    const run = h.mount(EntityCard, {
      entity: "script.night",
      layout: "poster",
      control: "auto",
    });
    expect(run.querySelector(".pvalue > .big")).not.toBeNull();
    expect(run.querySelector(".pvalue > .end > .ctl-chip")).not.toBeNull();
  });
  it("draws no end slot without a control", () => {
    const r = h.mount(EntityCard, { entity: "sensor.temp", layout: "poster" });
    expect(r.querySelector(".pvalue > .end")).toBeNull();
  });
});

describe("the poster's visuals", () => {
  it("a gauge is its picture: the arc first, no big value", () => {
    const r = h.mount(EntityCard, { entity: "sensor.hum", layout: "poster", visual: "gauge" });
    const body = q(r, ".pbody");
    expect(body.classList.contains("pgauge")).toBe(true);
    expect(r.querySelector(".pbody .big")).toBeNull();
    expect(bodyParts(r)).toEqual(["gauge", "pname"]);
  });
  it("a gauge keeps its name under the arc with name_position: below", () => {
    const r = h.mount(EntityCard, {
      entity: "sensor.hum",
      layout: "poster",
      visual: "gauge",
      name_position: "below",
    });
    expect(bodyParts(r)).toEqual(["gauge", "pname"]);
  });
  it("any other visual leaves the body as it is", () => {
    const r = h.mount(EntityCard, { entity: "sensor.hum", layout: "poster", visual: "bar" });
    expect(q(r, ".pbody").classList.contains("pgauge")).toBe(false);
    expect(bodyParts(r)).toEqual(["pname", "pvalue", "bar"]);
  });
  it("a plot closes the body and names what it draws", () => {
    for (const kind of ["sparkline", "columns", "strip"]) {
      const r = h.mount(EntityCard, { entity: "sensor.temp", layout: "poster", visual: kind });
      const plot = q(r, ".pbody > .plot");
      expect(plot.dataset.kind).toBe(kind);
      expect(q(r, ".pbody").lastElementChild).toBe(plot);
    }
  });
});

describe("posters in the group and sections cards", () => {
  it("the group card draws its first entity as the poster, the rest in its corner", () => {
    const r = h.mount(EntityGroupCard, {
      title: "Climate",
      layout: "poster",
      entities: ["sensor.temp", "sensor.hum", "sensor.co2"],
    });
    const poster = q(r, ".body > .row.poster");
    expect(poster.dataset.idx).toBe("0");
    expect(q(poster, ".pname").textContent).toBe("Temperature");
    const badges = [...poster.querySelectorAll<HTMLElement>(".corner > .row.hval")];
    expect(badges.map((b) => b.dataset.idx)).toEqual(["1", "2"]);
    expect(badges[0].classList.contains("b-outline")).toBe(true);
    expect(r.querySelectorAll(".row.poster")).toHaveLength(1);
  });
  it("the sections card draws a poster section beside the others", () => {
    const r = h.mount(EntitySectionsCard, {
      sections: [
        { layout: "poster", entities: ["sensor.temp", "sensor.hum"] },
        { entities: ["switch.pump"] },
      ],
    });
    const poster = q(r, ".row.poster");
    expect(q(poster, ".corner > .row.hval").dataset.idx).toBe("1");
    expect(q(r, ".row.list").dataset.idx).toBe("2");
  });
});

describe("vertical_align", () => {
  const cls = (cfg: Record<string, unknown>) =>
    [...q(h.mount(EntityGroupCard, { entities: ["sensor.temp"], ...cfg }), "ha-card").classList]
      .filter((c) => c.startsWith("valign-"))
      .join(" ");
  it("marks the card for the centre and the bottom, nothing for the top", () => {
    expect(cls({})).toBe("");
    expect(cls({ vertical_align: "top" })).toBe("");
    expect(cls({ vertical_align: "center" })).toBe("valign-center");
    expect(cls({ vertical_align: "bottom" })).toBe("valign-bottom");
  });
  it("is read by the sections card too", () => {
    const r = h.mount(EntitySectionsCard, {
      vertical_align: "bottom",
      sections: [{ entities: ["sensor.temp"] }],
    });
    expect(q(r, "ha-card").classList.contains("valign-bottom")).toBe(true);
  });
});

describe("web fonts", () => {
  // happy-dom has no document.fonts: a stand-in that records its listeners
  const stubFonts = () => {
    const listeners = new Set<EventListener>();
    const fonts = {
      ready: Promise.resolve(),
      addEventListener: vi.fn((type: string, fn: EventListener) => {
        if (type === "loadingdone") listeners.add(fn);
      }),
      removeEventListener: vi.fn((type: string, fn: EventListener) => {
        if (type === "loadingdone") listeners.delete(fn);
      }),
    };
    Object.defineProperty(document, "fonts", { value: fonts, configurable: true });
    return { fonts, listeners };
  };
  afterEach(() => {
    delete (document as unknown as { fonts?: unknown }).fonts;
  });
  it("fits the values again when a font arrives, while the card is on the page", () => {
    const { fonts, listeners } = stubFonts();
    const el = new EntityCard();
    el.setConfig({ entity: "sensor.temp", layout: "poster" });
    document.body.appendChild(el);
    el.hass = h.hass();
    expect(fonts.addEventListener).toHaveBeenCalledWith("loadingdone", el._onFonts);
    expect(listeners.has(el._onFonts)).toBe(true);
    const fit = vi.spyOn(el, "_fitCells");
    for (const fn of listeners) fn(new Event("loadingdone"));
    expect(fit).toHaveBeenCalledWith([el._root]);
    el.remove();
    expect(fonts.removeEventListener).toHaveBeenCalledWith("loadingdone", el._onFonts);
    expect(listeners.size).toBe(0);
  });
});
