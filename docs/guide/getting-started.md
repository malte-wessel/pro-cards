# Getting started

Pro Cards adds these cards to the dashboard editor:

**Entities**

| Card                                            | `type`                        | Editor        |
| ----------------------------------------------- | ----------------------------- | ------------- |
| [Tile Card Pro](/cards/tile-card)               | `custom:tile-card-pro`        | Visual + YAML |
| [Poster Card Pro](/cards/poster-card)           | `custom:poster-card-pro`      | Visual + YAML |
| [Tile Group Card Pro](/cards/tile-group-card)   | `custom:tile-group-card-pro`  | Visual + YAML |
| [Multi Trend Card Pro](/cards/multi-trend-card) | `custom:multi-trend-card-pro` | Visual + YAML |

**Energy**

| Card                                            | `type`                        | Editor |
| ----------------------------------------------- | ----------------------------- | ------ |
| [Power Flow Card Pro](/cards/power-flow-card)   | `custom:power-flow-card-pro`  | YAML   |
| [Energy Flow Card Pro](/cards/energy-flow-card) | `custom:energy-flow-card-pro` | YAML   |

**Layout**

| Card                                    | `type`                    | Editor        |
| --------------------------------------- | ------------------------- | ------------- |
| [Layout Card Pro](/cards/layout-card)   | `custom:layout-card-pro`  | Visual + YAML |
| [Heading Card Pro](/cards/heading-card) | `custom:heading-card-pro` | YAML          |
| [Swipe Card Pro](/cards/swipe-card)     | `custom:swipe-card-pro`   | Visual + YAML |

**Weather**

| Card                                            | `type`                        | Editor        |
| ----------------------------------------------- | ----------------------------- | ------------- |
| [Weather Card Pro](/cards/weather-card)         | `custom:weather-card-pro`     | YAML          |
| [Sun Path Card Pro](/cards/sun-path-card)       | `custom:sun-path-card-pro`    | Visual + YAML |
| [Sun Azimuth Card Pro](/cards/sun-azimuth-card) | `custom:sun-azimuth-card-pro` | YAML          |

**Deprecated** (still working in 3.0, gone in 4.0: [Moving to 3.0](/guide/migrating) names what takes over)

| Card                                                    | `type`                            |
| ------------------------------------------------------- | --------------------------------- |
| [Entity Card Pro](/cards/entity-card)                   | `custom:entity-card-pro`          |
| [Entity Group Card Pro](/cards/entity-group-card)       | `custom:entity-group-card-pro`    |
| [Entity Sections Card Pro](/cards/entity-sections-card) | `custom:entity-sections-card-pro` |
| [Wind Card Pro](/cards/wind-card)                       | `custom:wind-card-pro`            |
| [Rain Card Pro](/cards/rain-card)                       | `custom:rain-card-pro`            |
| [Illuminance Card Pro](/cards/illuminance-card)         | `custom:illuminance-card-pro`     |

Requires Home Assistant 2026.4 or newer.

::: warning Upgrading from 1.x
Since 2.0.0 every card type ends in `-pro` (`custom:weather-card` is now `custom:weather-card-pro`). The old generic names collided with other custom cards, and one collision silently disabled the whole bundle. Update the `type:` of every Pro Card in your dashboards: in the raw configuration editor, append `-pro` to each `type: custom:…-card` line.
:::

## Install with HACS

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=malte-wessel&repository=pro-cards&category=plugin)

Or open HACS, search for **Pro Cards**, download it and reload the browser when HACS asks.

If HACS does not list it yet, add it as a custom repository first:

1. Open HACS, click the three-dot menu and choose **Custom repositories**.
2. Add `https://github.com/malte-wessel/pro-cards` with the category **Dashboard**.
3. Search for **Pro Cards** and download it.

HACS registers the resource `/hacsfiles/pro-cards/pro-cards.js` for you. Updates arrive through HACS like any other card; pre-releases (`x.y.z-beta.n`) appear only when you enable **Show beta versions** for Pro Cards in HACS.

## Install manually

1. Download `pro-cards.js` from the [latest release](https://github.com/malte-wessel/pro-cards/releases) and copy it to `config/www/pro-cards/pro-cards.js`.
2. Go to **Settings → Dashboards**, open the three-dot menu, choose **Resources** and add `/local/pro-cards/pro-cards.js` as a **JavaScript module**.
3. Reload the browser. After an update, append a version query such as `?v=2` to the resource URL so browsers drop the cached file.

## First card

Add a card in the dashboard editor, pick **Manual** and paste two lines:

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.living_room_temperature
```

:::

That is a complete card: the entity's icon, name and value, coloured like Home Assistant would colour it. Everything else is optional. Give it a shorter name, round the value, draw its last hours and add `rules` so the colour, the icon and the status follow the temperature:

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.living_room_temperature
name: Living room
decimals: 1
visual: { type: sparkline, hours: 12 }
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, status: Too cold }
  - { below: 24, color: green, icon: mdi:thermometer, status: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, status: Warm, tint_card: true }
```

:::

A tile draws its entity as its [kind](/cards/tile-types): a light brings its switch and its glow, a cover its buttons, a thermostat its stepper, a battery its colours by level. `kind: none` draws the entity as it is; `control: false` or `visual: false` leave one part out. The [poster](/cards/poster-card) draws the same kinds larger.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
```

:::

Every card page continues like this: the smallest configuration first, then one option at a time. All eighteen cards appear in the card picker as "Tile Card Pro", "Weather Card Pro" and so on, the deprecated ones last; the ones with a visual editor can be configured there without YAML. Pick an entity in the picker instead and Home Assistant suggests the cards that fit it: the poster and the tile for an entity with a kind of its own (a light, a cover, a battery, the weather …), the weather and sun cards for their entities, the multi trend card for a numeric sensor.

## Completion and validation in your editor

Every card has a JSON Schema, so an editor with a YAML language server can complete the options and underline a typo before the card reaches a dashboard. Point it at the bundle schema with one comment line at the top of the file:

```yaml
# yaml-language-server: $schema=https://malte-wessel.github.io/pro-cards/schema/pro-cards.schema.json
type: custom:tile-card-pro
entity: sensor.living_room_temperature
```

It accepts any of the eighteen cards and picks the right one by `type`. Home Assistant's own keys (`grid_options`, `visibility`, `layout_options`, `view_layout`, `card_mod`) are allowed; anything else unknown is an error, so `visula: sparkline` surfaces as you type it instead of as a card that ignores your option. A single card's schema is `https://malte-wessel.github.io/pro-cards/schema/<type>.schema.json`, for example `tile-card-pro.schema.json`. The deprecated cards' schemas say so, and editors strike them through.

## About the examples on this site

The examples run the real card code against a simulated home with about 120 entities (`sensor.outdoor_temperature`, `light.living_room`, `person.malte` and so on). Values drift every few seconds, switches really toggle, history is generated with a daily pattern, and Jinja templates are evaluated with a small subset of the template engine. Hover a graph or click a tile to see the interactions. Every example carries its YAML underneath, ready to paste.
