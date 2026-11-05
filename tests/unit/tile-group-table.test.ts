// A tile group's table (layout: table): each tile one line, the name, the value with its status,
// and one control or visual after them; no icon, no secondary, no badges.
import { afterEach, describe, expect, it } from "vitest";
import { TileCard } from "../../src/tile-card.ts";
import { TileGroupCard } from "../../src/tile-group-card.ts";
import { normalizeTileConfig } from "../../src/tile/config.ts";
import { normalizeTileGroupConfig } from "../../src/tile-group/config.ts";
import { placementsOf } from "../../src/shared/entity/control.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";

const T = "tile-card-pro";
const row = (cfg: Record<string, unknown>) =>
  normalizeTileConfig({ ...cfg, table: true }, snapshot() as never);
const ends = (cfg: Record<string, unknown>) =>
  placementsOf(row(cfg).entities[0], "tile").map((p) => p.kind);

const cards: HTMLElement[] = [];
afterEach(() => {
  for (const c of cards.splice(0)) c.remove();
});
// the group's rows as drawn: the name, the end's parts, the classes of what is in it
const draw = (tiles: unknown[]) => {
  const el = new TileGroupCard();
  el.setConfig({ type: "custom:tile-group-card-pro", layout: "table", tiles });
  document.body.appendChild(el);
  el.hass = snapshot() as never;
  cards.push(el);
  return [...(el.shadowRoot as ShadowRoot).querySelectorAll<TileCard>(T)].map((t) => {
    const card = t.shadowRoot?.querySelector("ha-card") as HTMLElement;
    const end = card.querySelector(".line > .end") as HTMLElement;
    return {
      card,
      name: card.querySelector(".tname")?.textContent,
      value: end.querySelector(".state")?.textContent ?? null,
      status: end.querySelector(".tstatus")?.textContent ?? null,
      end: [...end.children].map((c) =>
        c.classList[0] === "ctl" ? c.classList[1] : c.classList[0],
      ),
    };
  });
};

describe("a tile group's table", () => {
  it("takes table as a layout and passes it to its tiles, never written on one", () => {
    const g = normalizeTileGroupConfig({ layout: "table", tiles: ["light.kitchen"] });
    expect(g.layout).toBe("table");
    expect(g.tiles[0].config).toMatchObject({ table: true });
    expect(g.tiles[0].config).not.toHaveProperty("vertical");
    expect(normalizeTileGroupConfig({ tiles: ["light.kitchen"] }).tiles[0].config).toMatchObject({
      vertical: false,
    });
    expect(() => normalizeTileGroupConfig({ layout: "grid", tiles: ["light.kitchen"] })).toThrow(
      "layout takes list, row or table",
    );
    expect(() =>
      normalizeTileGroupConfig({ tiles: [{ entity: "light.kitchen", table: true }] }),
    ).toThrow("tiles[0]: table is the group's layout (layout: table)");
  });

  it("names what a row cannot draw", () => {
    const e = "sensor.living_room_temperature";
    const fails = (o: Record<string, unknown>, msg: string) =>
      expect(() => row({ entity: e, ...o })).toThrow(`${T}: in a table, ${msg}`);
    fails({ icon: "mdi:sofa" }, "a tile draws no icon (icon)");
    fails({ secondary: "x" }, "a tile draws no secondary (secondary)");
    fails({ badges: ["sensor.living_room_co2"] }, "a tile draws no badges (badges)");
    fails({ status_badge: true }, "a tile draws no badges: the status follows the value");
    fails({ vertical: true }, "a tile is a line of its own (vertical)");
    fails({ visual: "gauge" }, "visual must be one of bar, sparkline, trend or false");
    fails({ visual: "bar", control: "toggle" }, "a tile draws a control or a visual, not both");
    expect(() => row({ entity: e, visual: "bar", control: false })).not.toThrow();
  });

  it("draws one thing after the value: the visual it names, else the control", () => {
    // the kind's control, or the domain's where a tile has it on its icon (a switch, a lock)
    expect(ends({ entity: "light.kitchen" })).toEqual(["toggle"]);
    expect(ends({ entity: "input_boolean.night_mode" })).toEqual(["toggle"]);
    expect(ends({ entity: "lock.front_door" })).toEqual(["hold"]);
    expect(ends({ entity: "input_select.house_mode" })).toEqual(["select"]);
    expect(ends({ entity: "light.kitchen", control: "slider" })).toEqual(["slider"]);
    expect(ends({ entity: "light.kitchen", control: false })).toEqual([]);
    // a visual takes the place of the kind's control, and fetches its own window
    const v = row({ entity: "light.kitchen", visual: { type: "sparkline", hours: 48 } });
    expect(placementsOf(v.entities[0], "tile")).toEqual([]);
    expect(v.table).toEqual({ visual: "sparkline", hours: 48 });
    expect(v.fetchHours).toBe(48);
    expect(row({ entity: "sensor.phone_battery", visual: "trend" }).table?.hours).toBe(1);
  });

  it("is the name, the value and its status, and one thing at the end", () => {
    const [light, slider, cover, battery, spark] = draw([
      { entity: "light.living_room", name: "Ceiling" },
      { entity: "light.desk_lamp", control: "slider" },
      { entity: "cover.living_room_blinds" },
      { entity: "sensor.phone_battery", visual: "bar" },
      { entity: "sensor.living_room_temperature", visual: "sparkline" },
    ]);
    expect(light.card.classList.contains("ttable")).toBe(true);
    // no icon, no lead
    expect(light.card.querySelector(".tlead, .lead")).toBeNull();
    expect(light.name).toBe("Ceiling");
    // beside a switch the status would say On once more
    expect(light.value).toBe("71 %");
    expect(light.status).toBeNull();
    expect(light.end).toEqual(["state", "toggle"]);
    // a slider at the line's end, the status after the value
    expect(slider.end).toEqual(["state", "tstatus", "ctl-slider"]);
    expect(cover.status).toBe("Open");
    expect(cover.end).toEqual(["state", "tstatus", "ctl-buttons"]);
    // a badge's visual after the value
    expect(battery.end.slice(-1)).toEqual(["bbar"]);
    expect(spark.end).toEqual(["state", "bspark"]);
  });
});
