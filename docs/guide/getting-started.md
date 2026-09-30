# Getting started

Pro Cards adds these cards to the dashboard editor:

| Card                                                | `type`                        | Editor        |
| --------------------------------------------------- | ----------------------------- | ------------- |
| [Entity Card](/cards/entity-card)                   | `custom:entity-card`          | YAML          |
| [Entity Group Card](/cards/entity-group-card)       | `custom:entity-group-card`    | YAML          |
| [Entity Sections Card](/cards/entity-sections-card) | `custom:entity-sections-card` | YAML          |
| [Multi Trend Card](/cards/multi-trend-card)         | `custom:multi-trend-card`     | Visual + YAML |
| [Sun Path Card](/cards/sun-path-card)               | `custom:sun-path-card`        | Visual + YAML |
| [Illuminance Card](/cards/illuminance-card)         | `custom:illuminance-card`     | Visual + YAML |
| [Weather Card](/cards/weather-card)                 | `custom:weather-card`         | YAML          |
| [Wind Card](/cards/wind-card)                       | `custom:wind-card`            | YAML          |

Requires Home Assistant 2025.3 or newer.

## Install with HACS

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=malte-wessel&repository=pro-cards&category=plugin)

Or add it by hand:

1. Open HACS, click the three-dot menu and choose **Custom repositories**.
2. Add `https://github.com/malte-wessel/pro-cards` with the category **Dashboard**.
3. Search for **Pro Cards**, download it and reload the browser when HACS asks.

HACS registers the resource `/hacsfiles/pro-cards/pro-cards.js` for you. Updates arrive through HACS like any other card; pre-releases (`x.y.z-beta.n`) appear only when you enable **Show beta versions** for Pro Cards in HACS.

## Install manually

1. Download `pro-cards.js` from the [latest release](https://github.com/malte-wessel/pro-cards/releases) and copy it to `config/www/pro-cards/pro-cards.js`.
2. Go to **Settings → Dashboards**, open the three-dot menu, choose **Resources** and add `/local/pro-cards/pro-cards.js` as a **JavaScript module**.
3. Reload the browser. After an update, append a version query such as `?v=2` to the resource URL so browsers drop the cached file.

## First card

Add a card in the dashboard editor, pick **Manual** and paste two lines:

::: live

```yaml
type: custom:entity-card
entity: sensor.living_room_temperature
```

:::

That is a complete card: the entity's icon, name and value, coloured like Home Assistant would colour it. Everything else is optional. Give it a shorter name, round the value and add `rules` so the colour, icon and label follow the temperature:

::: live

```yaml
type: custom:entity-card
entity: sensor.living_room_temperature
name: Living room
decimals: 1
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, label: Too cold }
  - { below: 24, color: green, icon: mdi:thermometer, label: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, label: Warm, tint_card: true }
```

:::

Every card page continues like this: the smallest configuration first, then one option at a time. The three cards with visual editors also appear in the card picker under their names.

## About the examples on this site

The examples run the real card code against a simulated home with about 80 entities (`sensor.outdoor_temperature`, `light.living_room`, `person.alex` and so on). Values drift every few seconds, switches really toggle, history is generated with a daily pattern, and Jinja templates are evaluated with a small subset of the template engine. Hover a graph or click a tile to see the interactions. Every example carries its YAML underneath, ready to paste.

## Built with AI

Pro Cards is built with the help of AI. Code, docs and tests are written together with AI coding agents, reviewed and tested by a human before each release.
