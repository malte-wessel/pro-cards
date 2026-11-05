import { describe, it, expect } from "vitest";
import yaml from "js-yaml";
import {
  EDITABLE,
  decodeEdit,
  dumpYaml,
  encodeEdit,
  hasEditable,
  isEditable,
} from "../../docs/.vitepress/theme/editable.ts";
import { docExamples } from "./docs-examples.ts";

describe("the cards the Playground edits visually", () => {
  it("are the cards with a visual editor", () => {
    expect([...EDITABLE].sort()).toEqual([
      "custom:heading-card-pro",
      "custom:layout-card-pro",
      "custom:multi-trend-card-pro",
      "custom:poster-card-pro",
      "custom:sun-azimuth-card-pro",
      "custom:sun-path-card-pro",
      "custom:swipe-card-pro",
      "custom:tile-card-pro",
      "custom:tile-group-card-pro",
      "custom:weather-card-pro",
    ]);
    for (const type of EDITABLE) expect(isEditable({ type })).toBe(true);
    for (const c of [
      { type: "custom:entity-card-pro" },
      { type: "tile" },
      { type: "tile-card-pro" },
      {},
      null,
      undefined,
      "custom:tile-card-pro",
      ["custom:tile-card-pro"],
      3,
    ])
      expect(isEditable(c), JSON.stringify(c)).toBe(false);
  });

  it("make an example editable when one of its cards is", () => {
    const tile = { type: "custom:tile-card-pro" };
    const entity = { type: "custom:entity-card-pro" };
    expect(hasEditable(tile)).toBe(true);
    expect(hasEditable([entity, tile])).toBe(true);
    expect(hasEditable([entity])).toBe(false);
    expect(hasEditable([])).toBe(false);
    expect(hasEditable(null)).toBe(false);
    // a tile inside an entity card's list is not a card of the example
    expect(hasEditable({ ...entity, cards: [tile] })).toBe(false);
  });

  it("include most of the docs examples", () => {
    const all = docExamples();
    const editable = all.filter(({ cfg }) => hasEditable(cfg));
    expect(editable.length).toBeGreaterThan(100);
    expect(editable.length).toBeLessThan(all.length);
  });
});

describe("an example's Edit link", () => {
  it("carries the YAML as it was, Unicode too", () => {
    for (const text of [
      "type: custom:tile-card-pro\nentity: light.kitchen\n",
      "name: CO₂ – Küche ☀ 🌧\n",
      "a: '%2B / + = ? & #'\n",
    ]) {
      const hash = `#edit=${encodeEdit(text)}`;
      expect(decodeEdit(hash), text).toBe(text);
    }
  });

  it("is safe in a URL", () => {
    const code = encodeEdit("name: ü/+=?&#\n".repeat(30));
    expect(code).toMatch(/^[A-Za-z0-9%._~-]+$/);
    expect(new URL(`https://x.test/playground#edit=${code}`).hash).toBe(`#edit=${code}`);
  });

  it("reads nothing from another hash or a broken one", () => {
    for (const hash of ["", "#edit=", "#c=abc", "edit=abc", "#edit=%%%", "#edit=@@@"])
      expect(decodeEdit(hash), hash).toBeNull();
  });
});

describe("the YAML the visual editor writes", () => {
  it("is block style, one line per value however long", () => {
    const long = "word ".repeat(40).trim();
    const out = dumpYaml({
      type: "custom:tile-card-pro",
      name: long,
      grid_options: { columns: 6 },
      badges: ["sensor.a", { entity: "sensor.b" }],
    });
    expect(out).toBe(
      [
        "type: custom:tile-card-pro",
        `name: ${long}`,
        "grid_options:",
        "  columns: 6",
        "badges:",
        "  - sensor.a",
        "  - entity: sensor.b",
        "",
      ].join("\n"),
    );
  });

  it("writes a shared part out each time, without anchors", () => {
    const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
    const out = dumpYaml([tile, tile]);
    expect(out).not.toMatch(/[&*]ref/);
    expect(yaml.load(out)).toEqual([tile, tile]);
  });

  it("quotes what YAML would read as something else", () => {
    const cfg = { state: "on", value: "12", when: "yes", empty: "", hex: "#ff0000" };
    expect(yaml.load(dumpYaml(cfg))).toEqual(cfg);
  });
});
