#!/usr/bin/env node
// Validate one or more card configs (YAML or JSON, single card or list) against the Pro Cards schemas.
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { makeValidator } from "./schema-validator.ts";

const validate = makeValidator();
const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node scripts/validate.ts <file.yaml|file.json> …");
  process.exit(2);
}
let bad = 0;
for (const f of files) {
  const doc = yaml.load(readFileSync(f, "utf8"));
  const cards = Array.isArray(doc) ? doc : [doc];
  cards.forEach((c: unknown, i: number) => {
    const errors = validate(c);
    if (errors) {
      bad++;
      console.error(`${f}${cards.length > 1 ? `[${i}]` : ""}: ${errors}`);
    }
  });
}
console.log(bad ? `${bad} invalid card(s)` : "all valid");
process.exit(bad ? 1 : 0);
