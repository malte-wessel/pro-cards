# Card config schemas

JSON Schema (draft 2020-12) for every Pro Cards card. `pro-cards.schema.json` accepts any of the ten, discriminated by `type`.

Uses:

- Validate a dashboard snippet: `node scripts/validate.ts my-card.yaml` (also accepts JSON, or a list of cards).
- Editor completion: point your YAML language server at the schema, e.g. `# yaml-language-server: $schema=https://malte-wessel.github.io/pro-cards/schema/pro-cards.schema.json`.
- Tests: `tests/unit/schema.test.ts` validates every example on the docs site and in the playground presets.

Keys that Home Assistant adds to any card (`grid_options`, `visibility`, `layout_options`, `view_layout`, `card_mod`) are allowed; everything else unknown is rejected so typos surface early.
