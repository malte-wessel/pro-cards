# Pro Cards – guide for coding agents

Seven dependency-free Home Assistant custom cards in one HACS bundle, plus a VitePress docs site whose
examples run the real cards against a simulated home. Read this file first; the docs site and the code
explain the rest.

## Map

| Path                                                       | What it is                                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/*.ts`                                                 | The seven card elements. Plain web components (shadow DOM, inline SVG), no framework, TypeScript. **Source of truth.**                               |
| `src/shared/`                                              | Modules every card may use: `ha` (types), `util`, `color`, `format`, `history` (fetch, buckets, smooth path), `hover`, `card`, `editor`, `i18n`.     |
| `src/i18n/`                                                | One file per language (`en.ts` is the source and the key type, `de.ts` …); picked by `hass.locale.language` through `src/shared/i18n.ts`.            |
| `src/shared/entity/`                                       | The entity layer: `config`, `look`, `model`, `render/*`, `base` (the common element class) shared by the entity cards.                               |
| `src/multi-trend/`, `src/sun-path/`, `src/illuminance/`    | One folder per remaining card: `config` (types), `editor`, `styles`, its pure math (`scale`, `solar`, `zones`) and the plot / render modules.        |
| `src/weather/`                                             | The weather card: `config`, `conditions`, `forecast` (pure), `render/*` (current, hourly, daily, the lane chart), `styles`. Extends the entity base. |
| `src/index.ts`                                             | Bundle entry: imports the seven cards, prints the version banner.                                                                                    |
| `dist/pro-cards.js`                                        | Built bundle, **committed**. CI fails if it differs from `npm run build`.                                                                            |
| `schema/*.schema.json`                                     | JSON Schema for every card config. Docs examples and tests are validated against it.                                                                 |
| `docs/`                                                    | VitePress site. `docs/.vitepress/theme/ha-shim/` is the Home Assistant stand-in (elements, demo world, hass object, Jinja subset).                   |
| `tests/unit`, `tests/e2e`, `tests/visual`, `tests/harness` | Vitest, Playwright integration, Playwright visual, the browser harness. See `docs/guide/testing.md`.                                                 |
| `scripts/visual.sh`                                        | Runs the visual suite in the Playwright Docker image.                                                                                                |
| `.devcontainer/`, `test/ha/`, `scripts/ha.sh`              | A real Home Assistant for manual checks (`npm run ha` without VS Code): template entities named like the demo world, one dashboard section per card. |
| `.claude/skills/`                                          | Step-by-step workflows: add a docs example, add a visual case, cut a release.                                                                        |

## Rules that are not obvious from the code

1. **Edit `src/`, then `npm run build`.** Never edit `dist/`. A change to a card without a rebuilt `dist/pro-cards.js` fails CI.
2. **Cards stay dependency-free.** No npm runtime deps, no Lit. Every card may import `src/shared/` (including `src/shared/entity/`) and its own folder. A card never imports another card or another card's folder. Colours come from HA theme tokens (`var(--<name>-color)`), never hard-coded hex in CSS (a hex fallback table for blending is fine). No fixed pixel widths on cards; grid items need `min-width: 0` and `contain: inline-size`.
3. **Everything under `src/` is a plain TypeScript ES module** (`strict` on, imports carry explicit `.ts` extensions, `npm run typecheck` runs `vue-tsc --noEmit` over the whole repo). Types for the Home Assistant surface live in `src/shared/ha.ts`; `home-assistant-js-websocket` is a type-only devDependency and never reaches the bundle. Pure helpers live in the card's folder (or `src/shared/` when more than one card needs them) and get a unit test that imports them directly; the element files export only their class. The bundle is an iife, so exports cost nothing.
4. **User-facing strings inside the cards go through `t(hass, key)`** (`src/shared/i18n.ts`): English in `src/i18n/en.ts` is the source and the fallback, other languages are one file each in `src/i18n/`, picked by `hass.locale.language`. Never write a rendered word or an editor label as a literal. Defaults must resolve at render time, not in `setConfig` (no `hass` yet). Users' own words (`labels` / `zones` / rule `label`, `title`, `name`) are never translated. Config errors, console messages and the card picker entries stay English.
5. **Docs examples must use entities of the demo world** (`docs/.vitepress/theme/ha-shim/world.ts`). An unknown entity renders as "missing" and looks like a bug.
6. **A docs example is a `::: live` container around a ```yaml fence.** Whole dashboards use `<DashboardGrid b64="…">` followed by the same YAML as a readable fence (both must stay in sync; `.claude/skills/add-example` shows how).
7. **Visual baselines are Linux-only.** Only `npm run test:visual:update` (Docker) may write `tests/visual/__snapshots__/`. Never run Playwright `--update-snapshots` natively.
8. **Template support in the docs shim is `{{ }}` expressions only.** Examples must not rely on `{% %}`.
9. **Keep `hacs.json`, `package.json` version and `CHANGELOG.md` consistent.** Releases are git tags `v*`; the workflow attaches the bundle. Until 1.0.0 ships, the changelog stays "Initial release": nothing before the first release is a change for anyone.
10. **Formatting is Prettier, linting is ESLint, type checking is TypeScript** (`npm run format`, `npm run lint`, `npm run typecheck`; configs in `.prettierrc.json`, `eslint.config.ts` (the JS and typescript-eslint recommended rules) and `tsconfig.json`). A pre-commit hook (husky + lint-staged) formats and lints staged files, and CI fails on unformatted files or lint errors. `dist/` and the visual baselines are ignored; code inside Markdown fences is left untouched so docs YAML keeps its flow style.

## Definition of done

```sh
npm run check          # prettier check + eslint + typecheck + build + schema/unit tests + integration tests + docs build
npm run test:visual    # only when anything rendered changed (needs Docker)
```

Then update `CHANGELOG.md` under the next version and, for behaviour changes, the card's page in `docs/cards/`.

## Conventions

- English for docs, comments and commit messages. Commit messages: imperative subject, body explains why.
- YAML in docs: two-space indent, flow style `{ … }` for short rule entries, block style otherwise.
- Tests: describe behaviour, not implementation; prefer asserting on rendered text, classes and CSS variables (`--fe-color`) over internals.
- Home Assistant specifics worth remembering: sections grid is 12 columns per visible section column; `rows: "auto"` sizes to content; `grid_options` overrides `getGridOptions`.

## Things that look wrong but are intended

- `state: "on"` / `"off"` in rules are quoted in YAML on purpose (YAML 1.1 booleans).
- Explicit `color` / `icon` on an entity **override** the rules (fixed look); leave them out to let the value drive the look.
- `tint_card` lives on a rule and does nothing unless that rule matches. Rules match in the order written, first match wins (no sorting).
- The multi trend card's `getGridOptions` rows depend on the layout (2 + entities in lanes).
- The weather card is a `tile` only when nothing but the entity keys is set; a `title`, `attributes` or `sections` make it a `hero`. Its condition colour ignores HA's state colour (one amber for every condition) and is primary unless a rule or `color` says otherwise.
