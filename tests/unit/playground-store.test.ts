import { beforeEach, describe, it, expect } from "vitest";
import {
  decodeShare,
  deleteSaved,
  encodeShare,
  entitiesOf,
  listSaved,
  loadDraft,
  putSaved,
  renameSaved,
  saveDraft,
} from "../../docs/.vitepress/theme/playground/store.ts";
import { encodeEdit } from "../../docs/.vitepress/theme/editable.ts";

beforeEach(() => localStorage.clear());

describe("the Playground's share links", () => {
  it("carry a card's name and YAML, Unicode and long ones too", async () => {
    const yaml = `type: custom:tile-card-pro\nentity: sensor.living_room_co2\nname: CO₂ – Küche\n${"rules:\n".repeat(1)}${Array.from({ length: 60 }, (_, i) => `  - { above: ${i * 10}, color: red, status: Höhe ${i} }`).join("\n")}\n`;
    const hash = await encodeShare({ name: "Küche ☀", yaml });
    expect(hash).toMatch(/^#c=[A-Za-z0-9_-]+$/);
    // deflated: shorter than the YAML itself
    expect(hash.length).toBeLessThan(yaml.length);
    expect(await decodeShare(hash)).toEqual({ name: "Küche ☀", yaml });
  });

  it("read an example's Edit link, and nothing from a broken one", async () => {
    expect(await decodeShare(`#edit=${encodeEdit("type: custom:poster-card-pro\n")}`)).toEqual({
      name: "",
      yaml: "type: custom:poster-card-pro\n",
    });
    expect(await decodeShare("#c=not-deflate")).toBeNull();
    expect(await decodeShare("#other")).toBeNull();
  });
});

describe("the Playground's memory", () => {
  it("keeps the draft", () => {
    expect(loadDraft()).toBeNull();
    saveDraft({ name: "A", yaml: "type: x\n", id: "s1" });
    expect(loadDraft()).toEqual({ name: "A", yaml: "type: x\n", id: "s1" });
  });

  it("saves, updates, renames and deletes cards", () => {
    const a = putSaved({ name: "Tile", yaml: "a" }, 1000);
    const b = putSaved({ name: "Poster", yaml: "b" }, 2000);
    expect(listSaved().map((s) => s.name)).toEqual(["Poster", "Tile"]);
    // the saved card it came from is updated, under its new name
    putSaved({ id: a.id, name: "Kitchen tile", yaml: "a2" }, 3000);
    expect(listSaved().map((s) => [s.name, s.yaml])).toEqual([
      ["Kitchen tile", "a2"],
      ["Poster", "b"],
    ]);
    renameSaved(b.id, "Wind");
    deleteSaved(a.id);
    expect(listSaved().map((s) => s.name)).toEqual(["Wind"]);
  });

  it("starts empty from storage it cannot read", () => {
    localStorage.setItem("pro-cards:playground:saved", "{not json");
    localStorage.setItem("pro-cards:playground:draft", JSON.stringify({ yaml: 3 }));
    expect(listSaved()).toEqual([]);
    expect(loadDraft()).toBeNull();
  });
});

describe("the entities a config names", () => {
  it("are found anywhere in it, once each, in order", () => {
    const known = new Set([
      "light.kitchen",
      "sensor.wind_speed",
      "sensor.wind_gust",
      "sensor.outdoor_temperature",
    ]);
    const cfg = {
      type: "custom:layout-card-pro",
      cards: [
        {
          type: "custom:tile-card-pro",
          entity: "light.kitchen",
          badges: ["sensor.outdoor_temperature"],
        },
        {
          type: "custom:poster-card-pro",
          entity: "sensor.wind_speed",
          inputs: { gust: "sensor.wind_gust" },
        },
        { type: "custom:tile-card-pro", entity: "light.kitchen", name: "light.unknown" },
      ],
    };
    expect(entitiesOf(cfg, (id) => known.has(id))).toEqual([
      "light.kitchen",
      "sensor.outdoor_temperature",
      "sensor.wind_speed",
      "sensor.wind_gust",
    ]);
  });
});
