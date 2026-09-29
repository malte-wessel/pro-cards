---
name: add-example
description: Add a live example (single card or whole dashboard) to a page of the docs site, using demo-world entities, validated against the schema and checked in the browser.
---

# Add a live docs example

## 1. Pick entities that exist in the demo world

Only entities defined in `docs/.vitepress/theme/ha-shim/world.ts` render. Grep for `def("` to list them; the playground page (`docs/playground.md`) has the same list as a table. If a new kind of entity is needed, add a `def(...)` there with a plausible state, attributes and `kind` for history.

## 2. Single card: use the `live` container

In the markdown page, wrap a YAML fence:

    ::: live
    ```yaml
    type: custom:entity-card
    entity: sensor.living_room_temperature
    ```
    :::

Options after `live`: `width=full`, `width=200` (px), `theme=dark`, `theme=light`. A YAML _list_ of cards renders them in one 12-column grid honouring each card's `grid_options.columns`.

Templates: the shim evaluates `{{ }}` expressions only (`states()`, `state_attr()`, `is_state()`, `states.<domain>` and common filters). Do not use `{% %}`.

## 3. Whole dashboard: `DashboardGrid`

Author the sections as YAML (list of `{ column_span, cards }`; `heading` cards allowed), then embed it twice, base64 for rendering and plain for reading:

```sh
node -e 'const fs=require("fs");const y=fs.readFileSync(process.argv[1],"utf8");console.log(Buffer.from(y).toString("base64"))' sections.yaml
```

    <DashboardGrid b64="…">

    ```yaml
    …the same YAML…
    ```

    </DashboardGrid>

Give the page `pageClass: wide`, `sidebar: false`, `aside: false` in the frontmatter so the grid gets the full width.

## 4. Validate and look at it

- `npm run test:unit -- schema` validates every docs example against `schema/`.
- `npm run docs:dev`, open the page, check the card renders, the theme toggle (top-right of the frame) works and there are no console errors.
- For a card page, keep the option reference table in sync if the example introduces a new option.

## 5. Done

`npm run docs:build` must pass (dead links fail the build). Add a changelog line only if the example documents new behaviour.
