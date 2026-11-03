import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import {
  errorsOf,
  keysAt,
  rangeOf,
  schemasOf,
  spotAt,
  valuesAt,
} from "../../docs/.vitepress/theme/playground/yaml-schema.ts";

const files = readdirSync("schema")
  .filter((f) => f.endsWith(".schema.json"))
  .map((f) => JSON.parse(readFileSync(`schema/${f}`, "utf8")) as Record<string, unknown>);
const schemas = schemasOf(files);
const ENTITIES = ["light.kitchen", "sensor.wind_speed"];
// the text with the cursor at `|`
const at = (t: string) => ({ text: t.replace("|", ""), offset: t.indexOf("|") });

describe("where the cursor is in the YAML", () => {
  it("names the object a key goes in, and the keys it has", () => {
    const { text, offset } = at("type: custom:tile-card-pro\nentity: light.kitchen\nna|");
    expect(spotAt(text, offset)).toEqual({
      kind: "key",
      path: [],
      has: ["type", "entity"],
      from: offset - 2,
    });
    // in a list item, in a list of cards
    const rule = at("rules:\n  - above: 10\n    co|");
    expect(spotAt(rule.text, rule.offset)).toMatchObject({
      kind: "key",
      path: ["rules", 0],
      has: ["above"],
    });
    const cards = at("- type: custom:tile-card-pro\n- type: custom:poster-card-pro\n  |");
    expect(spotAt(cards.text, cards.offset)).toMatchObject({ kind: "key", path: [1] });
    const nested = at("icon:\n  type: icon\n  ri|");
    expect(spotAt(nested.text, nested.offset)).toMatchObject({ path: ["icon"], has: ["type"] });
  });

  it("names the key a value goes to, and reads nothing in a flow mapping", () => {
    const { text, offset } = at("type: custom:tile-card-pro\nvisual: spa|");
    expect(spotAt(text, offset)).toEqual({ kind: "value", path: ["visual"], from: offset - 3 });
    const item = at("rules:\n  - above: 10\n    color: re|");
    expect(spotAt(item.text, item.offset)).toMatchObject({
      kind: "value",
      path: ["rules", 0, "color"],
    });
    const flow = at("rules: [{ above: 10, co|");
    expect(spotAt(flow.text, flow.offset)).toBeNull();
  });
});

describe("where a path is written", () => {
  const text =
    "type: custom:tile-card-pro\nrules:\n  - above: 10\n    colour: red\n  - { below: 5, colour: blue }\n";
  const word = (p: (string | number)[]) => {
    const r = rangeOf(text, p);
    return text.slice(r.from, r.to);
  };
  it("is its key's line, or the key inside a flow mapping", () => {
    expect(word(["rules", 0, "colour"])).toBe("colour: red");
    expect(word(["rules", 1, "colour"])).toBe("colour");
    expect(word(["rules"])).toBe("rules:");
    // not written: the nearest parent that is
    expect(word(["rules", 0, "missing"])).toBe("- above: 10");
  });
});

describe("what the schema allows there", () => {
  const doc = (t: string) => yaml.load(t);
  it("lists the keys the card takes that it does not have yet", () => {
    const keys = keysAt(
      schemas,
      doc("type: custom:tile-card-pro\nentity: light.kitchen"),
      [],
      ["type", "entity"],
    ).map((k) => k.label);
    expect(keys).toEqual(expect.arrayContaining(["name", "icon", "visual", "rules", "badges"]));
    expect(keys).not.toContain("entity");
    // a rule's keys
    const rules = keysAt(
      schemas,
      doc("type: custom:poster-card-pro\nrules:\n  - above: 1"),
      ["rules", 0],
      ["above"],
    ).map((k) => k.label);
    expect(rules).toEqual(expect.arrayContaining(["below", "color", "status"]));
  });

  it("lists a key's values: its choices, true and false, the home's entities", () => {
    const tile = doc("type: custom:tile-card-pro\nentity: light.kitchen");
    expect(valuesAt(schemas, tile, ["entity"], ENTITIES).map((v) => v.label)).toEqual(ENTITIES);
    expect(valuesAt(schemas, tile, ["vertical"], ENTITIES).map((v) => v.label)).toEqual([
      "true",
      "false",
    ]);
    const visual = valuesAt(schemas, tile, ["visual"], ENTITIES).map((v) => v.label);
    expect(visual).toEqual(expect.arrayContaining(["sparkline", "glow"]));
    // a card of no known type: nothing
    expect(keysAt(schemas, doc("type: thing"), [], [])).toEqual([]);
  });
});

describe("the schema's errors", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const f of files) ajv.addSchema(f);
  const check = (cfg: Record<string, unknown>) => {
    const v = ajv.getSchema(
      `https://malte-wessel.github.io/pro-cards/schema/${String(cfg.type).replace("custom:", "")}.schema.json`,
    )!;
    v(cfg);
    return errorsOf(v.errors as never);
  };
  it("name an unknown key at that key, and a wrong value at its key", () => {
    expect(check({ type: "custom:tile-card-pro", entity: "light.kitchen", colour: "red" })).toEqual(
      expect.arrayContaining([{ path: ["colour"], message: 'unknown key "colour"' }]),
    );
    const bad = check({ type: "custom:tile-card-pro", entity: "light.kitchen", vertical: "yes" });
    expect(bad.map((e) => e.path)).toContainEqual(["vertical"]);
    // a list of cards: the card's index first
    expect(
      errorsOf(
        [{ instancePath: "/rules/0", keyword: "type", message: "must be object", params: {} }],
        [2],
      ),
    ).toEqual([{ path: [2, "rules", 0], message: "must be object" }]);
  });
});
