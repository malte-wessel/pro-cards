/// <reference types="vite/client" />
// The Playground's YAML checked against the cards' JSON Schemas and completed from them, for the
// code editor (loaded with it, on this page alone): the schema/ folder as the docs build has it,
// Ajv for the errors, yaml-schema.ts for where they are and what fits where the cursor is.
import yaml from "js-yaml";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import { world } from "../ha-shim/world.ts";
import {
  errorsOf,
  keysAt,
  rangeOf,
  schemasOf,
  spotAt,
  valuesAt,
  type Path,
} from "./yaml-schema.ts";

const files = Object.values(
  import.meta.glob("../../../../schema/*.schema.json", { eager: true, import: "default" }),
) as Record<string, unknown>[];
const schemas = schemasOf(files);
const ajv = new Ajv2020({ allErrors: true, strict: false });
for (const f of files) ajv.addSchema(f);
const BASE = "https://malte-wessel.github.io/pro-cards/schema/";
const validators = new Map<string, ValidateFunction | undefined>();
const validatorOf = (type: string) => {
  if (!validators.has(type)) validators.set(type, ajv.getSchema(`${BASE}${type}.schema.json`));
  return validators.get(type);
};

export interface Problem {
  from: number;
  to: number;
  message: string;
}

// what is wrong with the text: where it fails as YAML, else what each card's schema says (a card
// of a type without a schema, a heading, is left to the preview)
export const problemsOf = (text: string): Problem[] => {
  let doc: unknown;
  try {
    doc = yaml.load(text);
  } catch (e) {
    const err = e as { reason?: string; message: string; mark?: { position: number } };
    const at = Math.min(err.mark?.position ?? 0, text.length);
    return [{ from: at, to: Math.min(text.length, at + 1), message: err.reason ?? err.message }];
  }
  const cards = Array.isArray(doc) ? doc : [doc];
  const out: Problem[] = [];
  cards.forEach((card, i) => {
    const type = String((card as { type?: unknown } | null)?.type ?? "").replace(/^custom:/, "");
    const v = validatorOf(type);
    if (!v || v(card)) return;
    for (const e of errorsOf(v.errors as never, Array.isArray(doc) ? [i] : []).slice(0, 20))
      out.push({ ...rangeOf(text, e.path), message: e.message });
  });
  return out;
};

// the document as far as it reads: the text, else without the line being written
const docOf = (text: string, offset: number): unknown => {
  try {
    return yaml.load(text);
  } catch {
    const start = text.lastIndexOf("\n", offset - 1) + 1;
    const end = text.indexOf("\n", offset);
    try {
      return yaml.load(text.slice(0, start) + (end < 0 ? "" : text.slice(end + 1)));
    } catch {
      return null;
    }
  }
};

export interface Completion {
  from: number;
  options: { label: string; detail?: string; apply?: string; type: string }[];
}
// what fits where the cursor is: the keys of its object (written with their colon), or the
// values of its key (the demo home's entities where it takes one)
export const completionsAt = (text: string, offset: number): Completion | null => {
  const spot = spotAt(text, offset);
  if (!spot) return null;
  const doc = docOf(text, offset);
  if (spot.kind === "key") {
    const keys = keysAt(schemas, doc, spot.path as Path, spot.has);
    return keys.length
      ? {
          from: spot.from,
          options: keys.map((k) => ({ ...k, apply: `${k.label}: `, type: "property" })),
        }
      : null;
  }
  const values = valuesAt(schemas, doc, spot.path, Object.keys(world.states).sort());
  return values.length
    ? { from: spot.from, options: values.map((v) => ({ ...v, type: "constant" })) }
    : null;
};
