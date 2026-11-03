import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
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
afterEach(() => vi.restoreAllMocks());

// a share link's hash of any JSON, deflated as encodeShare does
const linkOf = async (json: string) => {
  const out = new Blob([new TextEncoder().encode(json)])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(out).arrayBuffer());
  let b = "";
  for (const x of bytes) b += String.fromCharCode(x);
  return `#c=${btoa(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
};

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

  it("carry an empty name and an empty card", async () => {
    expect(await decodeShare(await encodeShare({ name: "", yaml: "" }))).toEqual({
      name: "",
      yaml: "",
    });
  });

  it("read nothing from a link without YAML, and no name from one without a name", async () => {
    expect(await decodeShare(await linkOf(JSON.stringify({ n: "A" })))).toBeNull();
    expect(await decodeShare(await linkOf(JSON.stringify({ n: "A", y: 3 })))).toBeNull();
    expect(await decodeShare(await linkOf("not json"))).toBeNull();
    expect(await decodeShare(await linkOf(JSON.stringify({ y: "type: x\n" })))).toEqual({
      name: "",
      yaml: "type: x\n",
    });
    expect(await decodeShare(await linkOf(JSON.stringify({ n: 5, y: "a" })))).toEqual({
      name: "",
      yaml: "a",
    });
  });

  it("read nothing from an empty or foreign hash", async () => {
    for (const hash of ["", "#", "#c=", "#c=a+b/c", "#edit=", "#edit=%%%", "#e=abc"])
      expect(await decodeShare(hash), hash).toBeNull();
  });

  it("are URL-safe, and the same card gives the same link", async () => {
    const d = { name: "x/y+z?", yaml: "name: ü/+=\n".repeat(40) };
    const a = await encodeShare(d);
    expect(a.slice(3)).not.toMatch(/[+/=?&%#]/);
    expect(await encodeShare(d)).toBe(a);
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

  it("keeps a draft's name and saved card only when they are text", () => {
    localStorage.setItem(
      "pro-cards:playground:draft",
      JSON.stringify({ name: 3, yaml: "type: x\n", id: 7 }),
    );
    expect(loadDraft()).toEqual({ name: "", yaml: "type: x\n" });
    saveDraft({ name: "B", yaml: "" });
    expect(loadDraft()).toEqual({ name: "B", yaml: "" });
  });

  it("lists the saved cards, the newest first, and skips broken entries", () => {
    localStorage.setItem(
      "pro-cards:playground:saved",
      JSON.stringify([
        { id: "a", name: "Old", yaml: "a", updated: 1 },
        { id: "b", name: "New", yaml: "b", updated: 3 },
        { name: "No id", yaml: "c", updated: 2 },
        { id: "d", yaml: "d", updated: 2 },
        { id: "e", name: "No yaml", updated: 2 },
        null,
        "text",
      ]),
    );
    expect(listSaved().map((s) => s.id)).toEqual(["b", "a"]);
    localStorage.setItem("pro-cards:playground:saved", JSON.stringify({ id: "a" }));
    expect(listSaved()).toEqual([]);
  });

  it("saves a card whose saved entry is gone as a new one", () => {
    const a = putSaved({ name: "A", yaml: "a" }, 1000);
    deleteSaved(a.id);
    const b = putSaved({ name: "A", yaml: "a2", id: a.id }, 2000);
    expect(b.id).not.toBe(a.id);
    expect(listSaved()).toEqual([{ id: b.id, name: "A", yaml: "a2", updated: 2000 }]);
  });

  it("gives every saved card an id of its own", () => {
    const ids = new Set(Array.from({ length: 20 }, () => putSaved({ name: "x", yaml: "" }, 5).id));
    expect(ids.size).toBe(20);
    expect(listSaved()).toHaveLength(20);
  });

  it("an update moves the card to the top", () => {
    const a = putSaved({ name: "A", yaml: "a" }, 1000);
    putSaved({ name: "B", yaml: "b" }, 2000);
    putSaved({ id: a.id, name: "A", yaml: "a" }, 3000);
    expect(listSaved().map((s) => s.name)).toEqual(["A", "B"]);
  });

  it("renames and deletes nothing for an id it does not have", () => {
    putSaved({ name: "A", yaml: "a" }, 1000);
    const before = listSaved();
    renameSaved("nope", "B");
    deleteSaved("nope");
    expect(listSaved()).toEqual(before);
  });

  it("keeps working when the browser refuses its storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(loadDraft()).toBeNull();
    expect(listSaved()).toEqual([]);
    expect(() => saveDraft({ name: "A", yaml: "a" })).not.toThrow();
    expect(putSaved({ name: "A", yaml: "a" }, 1).name).toBe("A");
    expect(() => renameSaved("x", "y")).not.toThrow();
    expect(() => deleteSaved("x")).not.toThrow();
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

  it("skips what only looks like an entity id, and what the home lacks", () => {
    const known = new Set(["light.kitchen", "sensor.co2_2"]);
    const cfg = {
      type: "custom:tile-card-pro",
      entity: "light.kitchen",
      // not ids: upper case, a service, a template, a key, a number, a URL
      name: "Light.Kitchen",
      tap_action: { action: "perform-action", perform_action: "light.toggle" },
      value: "{{ states('light.kitchen') }}",
      "sensor.co2_2": 1,
      icon: "mdi:lightbulb",
      image: "https://example.com/a.png",
      rules: [[["sensor.co2_2"]], 4, null, true],
    };
    expect(entitiesOf(cfg, (id) => known.has(id))).toEqual(["light.kitchen", "sensor.co2_2"]);
    expect(entitiesOf(null, () => true)).toEqual([]);
    expect(entitiesOf("light.kitchen", () => true)).toEqual(["light.kitchen"]);
    expect(entitiesOf({ entity: "light.kitchen" }, () => false)).toEqual([]);
  });
});
