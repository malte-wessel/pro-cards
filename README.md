<p align="center">
  <img src="https://raw.githubusercontent.com/malte-wessel/pro-cards/main/docs/public/logo.svg" alt="" width="96" height="96">
</p>

# Pro Cards

[![Release](https://img.shields.io/github/v/release/malte-wessel/pro-cards?include_prereleases)](https://github.com/malte-wessel/pro-cards/releases)
[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
[![Validate](https://github.com/malte-wessel/pro-cards/actions/workflows/validate.yml/badge.svg)](https://github.com/malte-wessel/pro-cards/actions/workflows/validate.yml)
[![License](https://img.shields.io/github/license/malte-wessel/pro-cards)](LICENSE)

**Docs with live examples: https://malte-wessel.github.io/pro-cards/**

Beautiful, customizable cards for Home Assistant dashboards.

Pro Cards are polished dashboard cards that look like they belong in Home Assistant: same spacing, typography and colours, dark mode included. Every detail can be adjusted, from icons, colours and labels driven by values and templates to layouts, graphs and actions. Themes change the look of all cards at once.

- **High quality.** Crisp rendering, sensible defaults, smooth graphs, tested against a real Home Assistant and pixel by pixel in CI.
- **Highly customizable.** Rules switch icon, colour, label and card tint by value or state; templates fill names and values; six layouts, eight visuals, a weather card with forecasts, animated wind and rain cards, every action Home Assistant offers.
- **Home Assistant design.** The cards use the theme's colours, fonts, radii and state colours, so they blend in with the built-in tile cards, and a custom theme restyles them along with the rest of the dashboard.

Pro Cards is built with the help of AI. Code, docs and tests are written together with AI coding agents, reviewed and tested by a human before each release.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/malte-wessel/pro-cards/main/docs/public/readme/cards-dark.png">
  <img alt="Pro Cards on a dashboard: weather station, living room, tiles, sun path, illuminance, kitchen, batteries and a trend graph" src="https://raw.githubusercontent.com/malte-wessel/pro-cards/main/docs/public/readme/cards-light.png" width="860">
</picture>

| Card                 | Type                          | What it does                                                                                                                                  | Editor    |
| -------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Entity Card          | `custom:entity-card`          | One entity as a tile with icon, ring, gauge, bar, sparkline, columns, badge or strip. Rules and Jinja templates drive colour, icon and label. | YAML only |
| Entity Group Card    | `custom:entity-group-card`    | Many entities as list, grid, hero, row, column or table, with header entities on the title line.                                              | YAML only |
| Entity Sections Card | `custom:entity-sections-card` | Several groups with their own layout under one header: room and device cards.                                                                 | YAML only |
| Multi Trend Card     | `custom:multi-trend-card`     | Tile-style trend graph for several sensors with a hover/touch tooltip.                                                                        | Visual    |
| Sun Path Card        | `custom:sun-path-card`        | Today's sun elevation with sunrise, sunset, dawn, noon and dusk.                                                                              | Visual    |
| Illuminance Card     | `custom:illuminance-card`     | Illuminance as gauge arc, log-scale trend with zones or a colour band.                                                                        | Visual    |
| Weather Card         | `custom:weather-card`         | Current conditions, attributes and the hourly / daily forecast of a weather entity, with rules, sections and templates.                       | YAML only |
| Wind Card            | `custom:wind-card`            | Wind speed, direction and gusts as a tile, a flow tile or a hero, with an animated wind field in four styles that rules colour.               | YAML only |
| Rain Card            | `custom:rain-card`            | Rain rate and today's total as a tile, a flow tile or a hero, with falling drops, ripples or a filling gauge that rules colour.               | YAML only |

All cards support the sections grid (`grid_options`). Requires Home Assistant 2025.3 or newer.

## Installation

### HACS (recommended)

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=malte-wessel&repository=pro-cards&category=plugin)

Or add it by hand:

1. HACS → three-dot menu → **Custom repositories**.
2. Add `https://github.com/malte-wessel/pro-cards` with category **Dashboard**.
3. Search for **Pro Cards**, install it and reload the browser.

HACS registers the resource `/hacsfiles/pro-cards/pro-cards.js` automatically.

### Manual

1. Copy `dist/pro-cards.js` to `config/www/pro-cards/pro-cards.js`.
2. Settings → Dashboards → three-dot menu → **Resources** → add `/local/pro-cards/pro-cards.js` as **JavaScript module**.
3. Reload the browser. Bump the URL (`?v=2`) after every update to bypass the cache.

## Look and themes

The cards read the Home Assistant theme: card background, text colours, dividers, radii and the named
colour tokens (`primary`, `red`, `amber`, `blue-grey`, ...). Dark mode and custom themes apply without
configuration. Wherever a card accepts a colour you can use a named token, a hex, rgb or hsl value or a
CSS variable. See [Look & themes](https://malte-wessel.github.io/pro-cards/guide/colours).

## The cards

Each card starts with two lines and grows with options. The docs pages take you from the basic example
to the advanced ones step by step.

### Entity Card

One entity as a tile. Rules pick colour, icon and label by value or state.

```yaml
type: custom:entity-card
entity: sensor.living_room_temperature
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, label: Cold }
  - { below: 24, color: green, icon: mdi:thermometer, label: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, label: Warm }
```

[Entity Card docs](https://malte-wessel.github.io/pro-cards/cards/entity-card) ·
[Entity options](https://malte-wessel.github.io/pro-cards/cards/entity-options)

### Entity Group Card

Many entities in one layout: `list`, `grid`, `hero`, `row`, `column` or `table`.

```yaml
type: custom:entity-group-card
title: Living room
entities:
  - { entity: light.living_room, toggle: true }
  - { entity: cover.living_room_blinds, attribute: current_position, unit: "%", visual: bar }
  - { entity: sensor.living_room_temperature, visual: sparkline }
```

[Entity Group Card docs](https://malte-wessel.github.io/pro-cards/cards/entity-group-card)

### Entity Sections Card

Several groups with their own layout under one header: room and device cards.

```yaml
type: custom:entity-sections-card
title: Living room
sections:
  - layout: row
    entities: [sensor.living_room_temperature, sensor.living_room_humidity]
  - layout: row
    entities: [light.living_room, cover.living_room_blinds, media_player.living_room_tv]
```

[Entity Sections Card docs](https://malte-wessel.github.io/pro-cards/cards/entity-sections-card)

### Multi Trend Card

Several sensors as smooth lines with a hover tooltip. Visual editor.

```yaml
type: custom:multi-trend-card
entities:
  - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
  - { entity: sensor.dew_point, name: Dew point, color: blue }
```

[Multi Trend Card docs](https://malte-wessel.github.io/pro-cards/cards/multi-trend-card)

### Sun Path Card

Today's sun elevation with sunrise, sunset, dawn, noon and dusk, computed from your location. Visual editor.

```yaml
type: custom:sun-path-card
title: Sun today
```

[Sun Path Card docs](https://malte-wessel.github.io/pro-cards/cards/sun-path-card)

### Illuminance Card

An illuminance sensor on a log scale with zones, as gauge arc, trend or colour band. Visual editor.

```yaml
type: custom:illuminance-card
entity: sensor.illuminance
mode: arc
```

[Illuminance Card docs](https://malte-wessel.github.io/pro-cards/cards/illuminance-card)

### Weather Card

A weather entity as a tile, or as sections you compose like the sections card: the hero lead, rows of attributes and entities, trend charts and forecast rows.

```yaml
type: custom:weather-card
entity: weather.home
title: Home
sections:
  - { type: hero }
  - { type: row, entities: [humidity, wind_speed, pressure] }
  - { type: trend, mode: hourly, hours: 12 }
  - { type: forecast, mode: daily, days: 7 }
```

[Weather Card docs](https://malte-wessel.github.io/pro-cards/cards/weather-card)

### Wind Card

Wind speed, direction and gusts from sensors or a weather entity, with an animated wind field: dots, streamlines, swooshes or an arrow field that travel where the wind blows, faster with the speed, wavier with the gusts, coloured by your rules.

```yaml
type: custom:wind-card
entity: sensor.wind_speed
direction: sensor.wind_direction
gust: sensor.wind_gust
layout: hero
rules:
  - { below: 5, color: blue-grey, label: Calm }
  - { below: 20, color: teal, label: Light breeze }
  - { below: 35, color: amber, label: Fresh }
  - { above: 35, color: red, label: Storm, tint_card: true }
```

[Wind Card docs](https://malte-wessel.github.io/pro-cards/cards/wind-card)

### Rain Card

The rain rate and today's total, animated: drops that fall harder and slant with the wind, ripples on a puddle, or a rain gauge that fills through the day, coloured by your rules.

```yaml
type: custom:rain-card
entity: sensor.rain_rate
today: sensor.rain_today
wind: sensor.wind_speed
direction: sensor.wind_direction
layout: hero
flow: { style: drops }
rules:
  - { below: 0.1, color: blue-grey, label: Dry }
  - { below: 2.5, color: light-blue, label: Light rain }
  - { below: 7.6, color: blue, label: Moderate rain }
  - { above: 7.6, color: indigo, label: Heavy rain, tint_card: true }
```

[Rain Card docs](https://malte-wessel.github.io/pro-cards/cards/rain-card)

## Config schema

`schema/` holds JSON Schemas for every card (`pro-cards.schema.json` accepts any of them). Add `# yaml-language-server: $schema=https://malte-wessel.github.io/pro-cards/schema/pro-cards.schema.json` to a YAML file for completion in editors, or validate with `node scripts/validate.ts card.yaml`.

## Development

```sh
npm install
npm run build       # bundles src/ into dist/pro-cards.js
npm run watch       # rebuild on change
npm run docs:dev    # docs site with live examples at http://localhost:5173/pro-cards/
npm run docs:build  # static site in docs/.vitepress/dist (deployed to GitHub Pages on push to main)
```

`AGENTS.md` lists the project rules for coding agents and humans alike; `.claude/skills/` holds step-by-step workflows (docs example, visual case, release).

The docs run the real card sources against a simulated home (`docs/.vitepress/theme/ha-shim/`). To add a live example to a page, wrap a YAML code block in a `::: live` container.

Each card lives as its own TypeScript module in `src/`; `src/index.ts` imports them all. The committed
`dist/pro-cards.js` must match the sources (CI checks this). Releases are cut by pushing a `v*` tag,
which attaches the bundle to a GitHub release.

## Testing

```sh
npm test                 # unit tests (Vitest, happy-dom): pure helpers of every card, the docs' template engine and demo world
npm run test:e2e         # integration tests (Playwright, Chromium): real cards mounted in a browser against the simulated home
npm run test:visual      # visual regression (Playwright in Docker): screenshots compared with tests/visual/__snapshots__
npm run test:visual:update   # re-generate the baselines after an intended visual change
```

Details, the harness API and how to add cases: https://malte-wessel.github.io/pro-cards/guide/testing

Visual baselines are rendered on Linux only, inside `mcr.microsoft.com/playwright`, so the same pixels are compared locally and in CI. Docker Desktop must be running for the two visual commands. The browser tests use `tests/harness/`, a tiny Vite page that loads the card sources and the docs' Home Assistant shim; the clock is frozen at 21 June 2026, 12:00 Europe/Berlin.

## License

MIT
