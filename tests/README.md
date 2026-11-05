# Testing

Pro Cards has three test layers for the cards, and one for the docs site. They share one idea: the cards are plain web components, so they can run outside Home Assistant against the same simulated home that powers the live examples on the docs site.

| Layer             | Tool                  | Runs in                        | Command               |
| ----------------- | --------------------- | ------------------------------ | --------------------- |
| Unit              | Vitest with happy-dom | Node                           | `npm test`            |
| Integration       | Playwright, Chromium  | a real browser on your machine | `npm run test:e2e`    |
| Visual regression | Playwright, Chromium  | the Playwright Docker image    | `npm run test:visual` |
| Docs site         | Playwright, Chromium  | the built docs site            | `npm run test:docs`   |

A fourth, manual layer is a real Home Assistant in Docker (`npm run ha`), see [Real Home Assistant](#real-home-assistant) below.

`npm run test:all` runs the first three in that order; `npm run check` runs Prettier, ESLint, the TypeScript type check, the build, the unit and integration tests, the docs build and the docs site's tests, which is the definition of done before a commit (about 3 minutes: the integration tests about 1.7, the docs build and its tests about 40 s; side by side they would only slow each other down). `npm run check:fast` runs the first three side by side (`scripts/parallel.mjs`), then the build and the unit tests (about 15 s): enough while working, with the integration specs a change touches. The docs examples mount one after another into one page per worker (`sharedTest` in `tests/e2e/util.ts`, as the visual cases), which keeps them at about 25 s. CI runs the same commands on every push and pull request (`.github/workflows/validate.yml`).

## Unit tests

`tests/unit/*.test.ts`, one file per card (the three entity cards share `entity-cards.test.ts`), `tests/unit/shared/` for the modules every card uses, `tests/unit/shared/entity/` for the entity layer the entity cards share, and one each for the docs' template engine, demo world and hass shim.

Every card is built from plain ES modules: `src/shared/` (colours, formatting, history fetch and bucketing, the editor base), `src/shared/entity/` for the layer the entity cards share, `src/shared/trend/` for the trend plot the multi trend and weather cards share, `src/shared/{wind,rain,weather,sun}/` for what those cards share with the poster card, and one folder per other card (`src/multi-trend/`, `src/sun-path/`, `src/sun-azimuth/`, `src/illuminance/`, `src/weather/`). Tests import straight from `src/`:

```js
import { matchRule } from "../../src/shared/entity/look.ts";

it("matches below exclusively and above inclusively", () => {
  const r = { state: null, below: 20, above: 10 };
  expect(matchRule(r, { raw: "10", num: 10, avail: true })).toBe(true);
  expect(matchRule(r, { raw: "20", num: 20, avail: true })).toBe(false);
});
```

Importing a card also registers its custom element, which is why the tests run under happy-dom rather than plain Node. Anything that needs layout, canvas or `ResizeObserver` belongs in the integration layer instead.

What is covered:

- **Shared modules**: history bucketing and smooth paths (clamped and plain), the recorder fetch, nearest-point and tooltip placement, the ha-form editor base, colour tokens and hex blending.
- **Entity cards**: rule matching and order, value sources (state, `attribute`, template, text), config normalisation and errors of all three cards, look resolution (explicit colour beats a matching rule, tint only on a match, grey for unavailable), formatting, grid options, the `hover` cascade (card → section → entity, power flow nodes, the weather card's sections).
- **Multi trend card**: tick steps, time steps, editor form round trip, layout rows.
- **Sun path card**: solar elevation against known solstice values, event ordering, polar day and night.
- **Sun azimuth card**: the azimuth against known bearings (noon due south, sunrise and sunset bearings of the solstices), the sides of the house (lit sides, two windows a day for the north side in summer, none in winter, rotation), the footer timeline span, the sky dial and 3D scene geometry (sun inside the disc, night without beam or shadow, visible walls per camera bearing), config normalisation and card size per view.
- **Illuminance card**: zone merging, log scale, colour blending, editor round trip.
- **Poster card and its kinds**: kind parsing, detection (domain, entity id, device class) and inference from `kind`'s keys, inputs found on the entity's device (device class, unit, translation key, never a guess), the predefined rules (bands, units, translated labels), config normalisation (kind defaults, controls, inputs, the status badge, badges reading the poster's entity, images), the second normalisation once `hass` arrives, the cover art colour, and the poster as it is drawn (its skeleton, the status and badges in the corner kept through a fill, the name and the big value, controls beside the value, a gauge or a plot as its picture).
- **Tile card**: the entity card's old keys as errors, the poster type's item with only its controls at the line's end, `status`, `show_picture`, and the grid size by what sits below the line.
- **Docs shim**: the Jinja subset (filters, precedence, tests, conditionals, error fallback), deterministic history, state updates, service calls, template subscriptions.

`npm run test:watch` re-runs on change.

### Schema test

`tests/unit/schema.test.ts` validates every YAML example on the docs site, every showcase dashboard and every playground preset against the JSON Schemas in `schema/`. Adding an option to a card therefore means adding it to the schema too, otherwise the first docs example using it fails this test. `node scripts/validate.ts my-card.yaml` runs the same validation on any file.

## Integration tests

`tests/e2e/*.spec.ts` mount the real cards in Chromium through a small harness page, `tests/harness/`. Playwright builds the harness with Vite and serves the built files on port 4174 by itself (a page loads one bundle, not a hundred modules through the dev server: the integration run takes half as long). It always starts its own server, so a test never runs against an old build; to debug in the browser, `npx vite tests/harness` serves the sources.

The harness exposes `window.pc`:

| Member                                                  | Purpose                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pc.mount(config \| [configs], { theme, skin, width })` | Renders cards into an HA-like 12-column grid; `theme` is `light` or `dark`, `skin` a Home Assistant theme from `ha.css` such as `graphite` |
| `pc.settled()`                                          | Resolves once every card has rendered                                                                                                      |
| `pc.card(i)`                                            | The i-th mounted card element                                                                                                              |
| `pc.world.set(id, state, attributes)`                   | Changes an entity; every card receives a fresh `hass`                                                                                      |
| `pc.calls`                                              | Every `callService` the cards made                                                                                                         |
| `pc.events`                                             | `hass-more-info` and `location-changed` events                                                                                             |
| `pc.actions`                                            | `hass-action` events the cards handed to Home Assistant (the shim plays HA and runs them)                                                  |

`tests/e2e/util.ts` wraps this for specs. A typical test:

```js
import { test, expect, mount, setState, card } from "./util.ts";

test("state rules follow the entity", async ({ page }) => {
  await mount(page, { type: "custom:tile-card-pro", entity: "vacuum.robot",
    rules: [{ state: "docked", status: "Parked" }, { state: "cleaning", status: "Busy" }] });
  await setState(page, "vacuum.robot", "docked");
  await expect(card(page)).toContainText("Parked");
  await setState(page, "vacuum.robot", "cleaning");
  await expect(card(page)).toContainText("Busy");
});
```

Locators pierce the cards' shadow DOM, so `card(page).locator(".row")` works as expected.

Determinism: `mount` freezes the browser clock at **21 June 2026, 12:00 Europe/Berlin** before loading the page, and the harness never starts the demo world's value drift. History is generated from a seed per entity, so the same window always yields the same series.

What is covered: every layout, all eight visuals, rules updating live, templates, attribute values, prefix and suffix, missing and unavailable entities, toggles calling `homeassistant.toggle`, tap, hold, navigate, none and confirmed `perform-action`, hover tooltips, the `hover` layers (tiles to the card's edges, cells, header entities, icons by the theme's hover opacity, every control, still list rows, the press state, touch screens), editor elements, config errors, sun events for the frozen day, the sun azimuth card's three views with the sides footer (pills, windows, hover preview, the camera slider, night, languages), illuminance modes, every section type of the weather card with the forecast of the demo world.

Run one file or test with the usual Playwright flags, for example `npx playwright test --project=integration tests/e2e/sun-path-card.spec.ts` or `-g "hold"`. Add `--ui` for the inspector.

## Visual regression tests

`tests/visual/cards.spec.ts` screenshots a set of configurations in light and dark and compares them with the PNGs in `tests/visual/__snapshots__/`. A screenshot may differ from its baseline by 100 pixels at most, whatever its size (`VISUAL_MAX_DIFF` sets another limit; renders in the Docker image are pixel-identical from run to run, so `VISUAL_MAX_DIFF=0` finds a baseline a change has left behind). A plain `test:visual:update` rewrites only the baselines that fail; after an intended change, rewrite the cases it touches with `--update-snapshots=all`, so none stays behind within the limit. `tests/visual/posters.spec.ts` covers the poster card on its own: every poster type in the states it draws differently (`pt-`), every variant (`pv-`), the poster's options (`po-`), the status and the corner's badges (`pb-`), and every type at five sizes plus the phone and wide widths and the Large text and Graphite themes (`ps-`). `tests/visual/tiles.spec.ts` does the same for the tile card: the poster types on a tile in their states (`tt-`), the tile's options (`to-`: the line, the icon, the second row, the controls), and the sizes, widths and themes (`ts-`). `tests/visual/viewports.spec.ts` draws the showcases' dashboards as Home Assistant's sections view lays them out (`mountView` in the harness: as many 320–500 px columns as fit, four at most) on a phone, a tablet and a desktop: it runs in the `visual-phone`, `visual-tablet` and `visual-desktop` projects (`playwright.config.ts`), each a Playwright device (its viewport, touch and mobile, so `hover: none` and `pointer: coarse` hold) in Chromium at 1x, and the device names the baseline (`vp-home-phone-dark.png`). `scripts/visual.sh` runs all four visual projects. All of them share the screenshot loop in `tests/visual/shoot.ts`; a case there may set states of its own (`states`: an entity's state and attributes, or with `like` a copy of an entity under a new id, its history drawn as that one's, so one case shows a type at several levels side by side), its width, a theme and the time it is drawn at. The harness puts the states back before the next mount.

Font rendering differs between macOS and Linux, so the baselines are rendered on **Linux only**, inside `mcr.microsoft.com/playwright`. `scripts/visual.sh` runs the suite in that image with the repository mounted; the same image runs in CI, so both compare identical pixels.

```sh
npm run test:visual                                        # compare against the committed baselines
npm run test:visual:update                                 # re-render the baselines after an intended change
npm run test:visual -- -g "pc-battery|pc-levels"           # some cases only
VISUAL_THEMES=dark npm run test:visual -- -g pc-           # one theme only, a quick look while working
npm run test:visual:update -- -g pc-battery --update-snapshots=all   # also baselines within the threshold
```

Docker Desktop must be running. The first run pulls the image (about 2 GB) and installs `node_modules` into a named volume; it is installed again only when `package-lock.json` changes. The whole suite takes well under a minute.

One test draws a case in both themes, and each worker mounts case after case into one page: the harness loads once, `mount` resets the theme, skin, width and the harness's records, and the demo world's sensors hold still in the harness (no drift), so a picture never depends on what ran before it. A case that changes the world (a click, a state) needs a page of its own (`page`, as `ef-calendar`). A local run fails a changed snapshot once; CI retries it once.

When a visual test fails, `test-results/` holds the expected, actual and diff images, and `npx playwright show-report` opens them side by side. Update the baselines only when the change is intended, and review the new PNGs in the diff before committing.

To add a case, append an entry to `CASES` in `cards.spec.ts`. The key becomes the file name, and both themes are generated automatically:

```js
"tc-my-case": { type: "custom:tile-card-pro", entity: "sensor.pressure", visual: "gauge", min: 950, max: 1050 },
```

Never run `--update-snapshots` natively on macOS: the PNGs would be rendered with macOS fonts and CI would fail on every one of them. The `snapshotPathTemplate` in `playwright.config.ts` deliberately drops Playwright's platform suffix so there is exactly one baseline per case.

## Docs site tests

`tests/docs/*.spec.ts` test what only the docs site has: the Playground (`docs/.vitepress/theme/playground/`) and the examples' Edit links into it. They run against the built site, so `npm run docs:build` comes first; `npm run test:docs` (`playwright.docs.config.ts`) serves `docs/.vitepress/dist` with Vite's preview on port 4175 (not `vitepress preview`, which compresses every response as it sends it: the browsers waited most of a second per file, and the suite took two to three minutes instead of about 20 s) and runs them in Chromium, its results in `test-results-docs/` (an integration run clears `test-results/` when it starts). Every test has a page of its own, so it starts with nothing in localStorage: no draft, nothing saved, the default preview settings. `tests/docs/util.ts` opens the Playground, reads and replaces the CodeMirror text (`expectYaml`, `typeYaml`: the YAML view, as CodeMirror draws only what it shows) and finds the visual editor's fields.

What is covered: the first example, the Examples menu, a visual edit into the YAML and the preview and typed YAML back into the form, YAML and config errors (the preview keeps the last card that parsed), several cards and the picker, a card the visual editor does not edit, a layout's card edited through its own editor; the draft across a reload, saving, reopening, renaming, deleting with the in-menu confirmation, New, Copy YAML, share links in another browser (the hash cleared), `#edit=` links and an example's Edit link; the width presets and their view columns (a layout card's breakpoints), Columns and Rows into `grid_options`, the mode and the theme, the grid guides, the States drawer (a switch, a number, a select, Reset, freezing the demo home), the splitter; the page itself (the nav bar's link, no footer or heading, as tall as the screen, the nav bar container's width and its borders beyond it) and a phone (the view tabs, the ⋯ menu). The store and the Edit links' codec have unit tests of their own (`tests/unit/playground-store.test.ts`, `tests/unit/editable.test.ts`).

```sh
npm run check:docs                          # the docs build and the whole suite
npm run test:docs -- playground-store       # one file; -g "Share" for one test
```

## Continuous integration

`validate.yml` runs six jobs:

1. **HACS validation** of `hacs.json`, README and repository metadata.
2. **Prettier + ESLint** and the type check.
3. **Bundle is up to date**: builds `dist/pro-cards.js` and fails if it differs from the committed file.
4. **Unit + integration tests** on Ubuntu with Chromium installed by Playwright.
5. **Docs build + Playground tests**: builds the docs site and runs `npm run test:docs` against it.
6. **Visual regression** inside the Playwright container.

Failed browser jobs upload the Playwright report and the diff images as artifacts.

## Known limits

- The template engine in the shim covers `{{ }}` expressions only. Templates with `{% %}` statements render as their raw text in the examples and tests.
- The sun path and sun azimuth unit tests derive day boundaries from the machine's local timezone; they pass in Europe and on CI's UTC runners because they only check ordering, day length and bearings.
- Visual tests cover the cards at one width (400 px, a Home Assistant section column). Narrow layouts are exercised by the integration tests, not by screenshots.

## Real Home Assistant

The three automated layers run against the docs' Home Assistant shim, which is fast and deterministic but a stand-in. Some things only a real Home Assistant shows: the visual editors inside the card editor, the sections grid with `grid_options`, the dialogs and haptics behind `hass-action`, the companion app, custom themes and real recorder data.

`npm run ha` runs the official Home Assistant image (`ghcr.io/home-assistant/home-assistant`, the version pinned as `HA_VERSION` in `test/ha/.env`) with `dist/` mounted at `/config/www/pro-cards`. `scripts/ha-setup.mjs` then finishes onboarding with the user `dev` / `dev` and registers `/local/pro-cards/pro-cards.js` as a dashboard resource; both steps are skipped when already done. The config (`.storage`, the recorder's history) lives in the Docker volume `pro-cards-ha-config` and survives restarts: `npm run ha:stop` removes the container, `npm run ha:reset` the container and the volume. `HA_VERSION=<version> npm run ha` runs another version, e.g. a beta. Then:

1. `npm run watch` rebuilds `dist/pro-cards.js` on every change.
2. Open `http://localhost:8123` and log in as `dev` / `dev`.
3. The **Pro Cards** dashboard in the sidebar (`test/ha/dashboards/pro-cards.yaml`) has one section per card; reload the page after editing the YAML or the bundle (append `?v=2` if the browser caches the old file).
4. The **Showcase** dashboards are the docs' showcase pages (`docs/showcase/*.md`), written again on every `npm run ha` so they follow the docs.

`test/ha/configuration.yaml` sets the home location to the docs' demo coordinates (the sun path card needs one) and defines template entities named like the docs' demo world (`sensor.outdoor_temperature`, `light.living_room`, `sensor.illuminance`, `sensor.robot_battery`, …) so examples from the docs can be pasted into the dashboard as they are, and an automation moves their values every minute so the history visuals have data after a few minutes. The demo integration adds the rest of a house (`sun.sun`, demo lights, covers, climate, media players); those entities work too, under their own ids.

The rest of the docs' demo world is there too, so every docs example (and every showcase) finds its entities. `scripts/ha-world.ts`, run by `npm run ha`, writes it from `docs/.vitepress/theme/ha-shim/world.ts` to `test/ha/world/` (not committed), leaving out what the config above already defines and the sun: `world.json` for the `pro_cards_world` integration (`test/ha/custom_components/`, mounted at `/config/custom_components`), which makes every entity it can (lights, covers, thermostats, media players, the vacuum, the weather with its forecasts, the camera …) with the world's state and attributes, answers their services by changing them, lets the numeric sensors drift every minute and counts the energy meters on by the world's readings, whose past 90 days it imports as long-term statistics (the energy flow card's periods); `package.yaml` for what Home Assistant makes itself (helpers, scenes, the script, the group, the people with their pictures under `/local/world/`); `dashboards.json` for the showcase dashboards. Where another integration took a world entity's id first (the demo's `cover.garage_door`), the setup gives it to the world's and moves the other one to `<id>_<platform>`. History builds up while the container runs: only the meters' statistics are imported. `docker logs -f pro-cards-ha` shows Home Assistant's log.

What to check there that the shim cannot: every card's visual editor opens and round-trips; `confirmation` shows HA's dialog and per-user `exemptions` skip it; `assist` opens the assist dialog; haptics fire in the companion app; the cards respect the grid in edit mode; a custom theme recolours the state colours.
