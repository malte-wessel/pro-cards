# Testing

Pro Cards has three test layers. They share one idea: the cards are plain web components, so they can run outside Home Assistant against the same simulated home that powers the live examples on this site.

| Layer             | Tool                  | Runs in                        | Command               |
| ----------------- | --------------------- | ------------------------------ | --------------------- |
| Unit              | Vitest with happy-dom | Node                           | `npm test`            |
| Integration       | Playwright, Chromium  | a real browser on your machine | `npm run test:e2e`    |
| Visual regression | Playwright, Chromium  | the Playwright Docker image    | `npm run test:visual` |

A fourth, manual layer is a real Home Assistant in the repository's devcontainer, see [Real Home Assistant](#real-home-assistant) below.

`npm run test:all` runs all three in that order; `npm run check` runs Prettier, ESLint, the TypeScript type check, the build, the unit and integration tests and the docs build, which is the definition of done before a commit. CI runs the same commands on every push and pull request (`.github/workflows/validate.yml`).

## Unit tests

`tests/unit/*.test.ts`, one file per card (the three entity cards share `entity-cards.test.ts`), `tests/unit/shared/` for the modules every card uses, `tests/unit/shared/entity/` for the entity layer the entity cards share, and one each for the docs' template engine, demo world and hass shim.

Every card is built from plain ES modules: `src/shared/` (colours, formatting, history fetch and bucketing, the editor base), `src/shared/entity/` for the layer the entity cards share, `src/shared/trend/` for the trend plot the multi trend and weather cards share, and one folder per other card (`src/multi-trend/`, `src/sun-path/`, `src/illuminance/`, `src/weather/`). Tests import straight from `src/`:

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
- **Entity cards**: rule matching and order, value sources (state, `attribute`, template, text), config normalisation and errors of all three cards, look resolution (explicit colour beats a matching rule, tint only on a match, grey for unavailable), formatting, grid options.
- **Multi trend card**: tick steps, time steps, editor form round trip, layout rows.
- **Sun path card**: solar elevation against known solstice values, event ordering, polar day and night.
- **Illuminance card**: zone merging, log scale, colour blending, editor round trip.
- **Docs shim**: the Jinja subset (filters, precedence, tests, conditionals, error fallback), deterministic history, state updates, service calls, template subscriptions.

`npm run test:watch` re-runs on change.

### Schema test

`tests/unit/schema.test.ts` validates every YAML example on the docs site, every showcase dashboard and every playground preset against the JSON Schemas in `schema/`. Adding an option to a card therefore means adding it to the schema too, otherwise the first docs example using it fails this test. `node scripts/validate.ts my-card.yaml` runs the same validation on any file.

## Integration tests

`tests/e2e/*.spec.ts` mount the real cards in Chromium through a small harness page, `tests/harness/`. Playwright starts the harness with Vite on port 4174 by itself.

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
  await mount(page, { type: "custom:entity-card", entity: "vacuum.robot", visual: "badge",
    rules: [{ state: "docked", label: "Parked" }, { state: "cleaning", label: "Busy" }] });
  await setState(page, "vacuum.robot", "docked");
  await expect(card(page).locator(".pill")).toHaveText("Parked");
  await setState(page, "vacuum.robot", "cleaning");
  await expect(card(page).locator(".pill")).toHaveText("Busy");
});
```

Locators pierce the cards' shadow DOM, so `card(page).locator(".row")` works as expected.

Determinism: `mount` freezes the browser clock at **21 June 2026, 12:00 Europe/Berlin** before loading the page, and the harness never starts the demo world's value drift. History is generated from a seed per entity, so the same window always yields the same series.

What is covered: every layout, all eight visuals, rules updating live, templates, attribute values, prefix and suffix, missing and unavailable entities, toggles calling `homeassistant.toggle`, tap, hold, navigate, none and confirmed `perform-action`, hover tooltips, editor elements, config errors, sun events for the frozen day, illuminance modes, every section type of the weather card with the forecast of the demo world.

Run one file or test with the usual Playwright flags, for example `npx playwright test --project=integration tests/e2e/sun-path-card.spec.ts` or `-g "hold"`. Add `--ui` for the inspector.

## Visual regression tests

`tests/visual/cards.spec.ts` screenshots a set of configurations in light and dark and compares them with the PNGs in `tests/visual/__snapshots__/`. The threshold is 0.2 % of pixels.

Font rendering differs between macOS and Linux, so the baselines are rendered on **Linux only**, inside `mcr.microsoft.com/playwright`. `scripts/visual.sh` runs the suite in that image with the repository mounted; the same image runs in CI, so both compare identical pixels.

```sh
npm run test:visual           # compare against the committed baselines
npm run test:visual:update    # re-render the baselines after an intended change
```

Docker Desktop must be running. The first run pulls the image (about 2 GB) and installs `node_modules` into a named volume, later runs take a few seconds.

When a visual test fails, `test-results/` holds the expected, actual and diff images, and `npx playwright show-report` opens them side by side. Update the baselines only when the change is intended, and review the new PNGs in the diff before committing.

To add a case, append an entry to `CASES` in `cards.spec.ts`. The key becomes the file name, and both themes are generated automatically:

```js
"ec-my-case": { type: "custom:entity-card", entity: "sensor.pressure", visual: "gauge", min: 950, max: 1050 },
```

Never run `--update-snapshots` natively on macOS: the PNGs would be rendered with macOS fonts and CI would fail on every one of them. The `snapshotPathTemplate` in `playwright.config.ts` deliberately drops Playwright's platform suffix so there is exactly one baseline per case.

## Continuous integration

`validate.yml` runs four jobs:

1. **HACS validation** of `hacs.json`, README and repository metadata.
2. **Bundle is up to date**: builds `dist/pro-cards.js` and fails if it differs from the committed file.
3. **Unit + integration tests** on Ubuntu with Chromium installed by Playwright.
4. **Visual regression** inside the Playwright container.

Failed browser jobs upload the Playwright report and the diff images as artifacts.

## Known limits

- The template engine in the shim covers `{{ }}` expressions only. Templates with `{% %}` statements render as their raw text in the examples and tests.
- The sun path unit test derives day boundaries from the machine's local timezone; it passes in Europe and on CI's UTC runners because it only checks ordering and day length.
- Visual tests cover the cards at one width (400 px, a Home Assistant section column). Narrow layouts are exercised by the integration tests, not by screenshots.

## Real Home Assistant

The three automated layers run against the docs' Home Assistant shim, which is fast and deterministic but a stand-in. Some things only a real Home Assistant shows: the visual editors inside the card editor, the sections grid with `grid_options`, the dialogs and haptics behind `hass-action`, the companion app, custom themes and real recorder data.

`.devcontainer/` runs Home Assistant with the repository mounted as a dashboard resource (image `thomasloven/hass-custom-devcontainer`). In VS Code choose **Reopen in Container**; without VS Code, `npm run ha` starts the same image and mounts as a plain Docker container (`npm run ha:stop` removes it). Then:

1. `npm run watch` rebuilds `dist/pro-cards.js` on every change.
2. Open `http://localhost:8123` and log in as `dev` / `dev`.
3. The **Pro Cards** dashboard in the sidebar (`test/ha/dashboards/pro-cards.yaml`) has one section per card; reload the page after editing the YAML or the bundle (append `?v=2` if the browser caches the old file).

The image is amd64, so on Apple silicon Home Assistant takes a few minutes to boot under emulation; `docker logs -f pro-cards-ha` shows progress. `test/ha/configuration.yaml` sets the home location to the docs' demo coordinates (the sun path card needs one) and defines template entities named like the docs' demo world (`sensor.outdoor_temperature`, `light.living_room`, `sensor.illuminance`, `sensor.robot_battery`, …) so examples from these pages can be pasted into the dashboard as they are, and an automation moves their values every minute so the history visuals have data after a few minutes. The demo integration adds the rest of a house (`sun.sun`, demo lights, covers, climate, media players); those entities work too, under their own ids.

What to check there that the shim cannot: every card's visual editor opens and round-trips; `confirmation` shows HA's dialog and per-user `exemptions` skip it; `assist` opens the assist dialog; haptics fire in the companion app; the cards respect the grid in edit mode; a custom theme recolours the state colours.
