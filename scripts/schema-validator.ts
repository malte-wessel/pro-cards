// Builds an Ajv validator over the schema/ folder; shared by scripts/validate.ts and the unit tests.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "schema");
const BASE = "https://malte-wessel.github.io/pro-cards/schema/";
const TYPES = [
  "entity-card",
  "entity-group-card",
  "entity-sections-card",
  "multi-trend-card",
  "sun-path-card",
  "illuminance-card",
  "weather-card",
  "wind-card",
  "rain-card",
];

export const makeValidator = () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".schema.json")))
    ajv.addSchema(JSON.parse(readFileSync(join(dir, f), "utf8")));
  // validate against the card's own schema (picked by `type`) so error messages are specific
  return (cfg: unknown): string | null => {
    const rawType = (cfg as { type?: unknown } | null | undefined)?.type;
    const type = String(rawType || "").replace(/^custom:/, "");
    if (!TYPES.includes(type))
      return `unknown card type "${rawType}" (expected custom:${TYPES.join(" | custom:")})`;
    const v = ajv.getSchema(`${BASE}${type}.schema.json`);
    if (!v) return `no schema for "${type}"`;
    if (v(cfg)) return null;
    const all: ErrorObject[] = v.errors ?? [];
    let errs = all.filter((e) => !["oneOf", "anyOf", "allOf", "if", "not"].includes(e.keyword));
    const seen = new Set<string>();
    errs = errs.filter((e) => {
      const k = e.instancePath + e.message;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return ajv.errorsText((errs.length ? errs : all).slice(0, 6), { separator: "; " });
  };
};
