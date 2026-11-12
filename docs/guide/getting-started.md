# Install & first card

This page installs Pro Cards and walks you through your first tile, poster and tile group. Every example can be pasted straight into your dashboard.

Pro Cards requires Home Assistant 2026.4 or newer. Coming from an older version? [Moving to 3.0](/guide/migrating) lists what changed.

## Install from the <Marketplace /> {#install}

Since Home Assistant 2026.11, HACS is part of Home Assistant as the Marketplace. Before 2026.11, the same steps work in HACS.

[![Open your Home Assistant instance and open this repository in the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=malte-wessel&repository=pro-cards&category=plugin)

Or go to **Settings → Marketplace**, search for **Pro Cards**, install it and reload the browser.

If it is not listed yet, add it first: **Settings → Marketplace → Add from link**, then `malte-wessel/pro-cards`. In HACS: three-dot menu → **Custom repositories**, `https://github.com/malte-wessel/pro-cards` with the category **Dashboard**.

The Marketplace adds the dashboard resource for you (unless you keep your resources in YAML: then its install dialog shows the line to add). Updates arrive like any other. For pre-releases, turn on the **Pre-release** switch on Pro Cards' device under **Settings → Devices & services → Marketplace** (enable that entity first); in HACS, **Show beta versions**.

## Install manually

1. Download `pro-cards.js` from the [latest release](https://github.com/malte-wessel/pro-cards/releases) and copy it to `config/www/pro-cards/pro-cards.js`.
2. Go to **Settings → Dashboards**, open the three-dot menu, choose **Resources** and add `/local/pro-cards/pro-cards.js` as a **JavaScript module**.
3. Reload the browser. After an update, add a version to the resource URL, such as `?v=2`, so browsers drop the cached file.

::: tip Upgrading from 1.x
Every card type ends in `-pro`, such as `custom:weather-card-pro`. Add `-pro` to the `type:` of every Pro Card in your dashboards.
:::

## Your first tile

Add a card in the dashboard editor, pick **Manual** and paste two lines:

::: live

```yaml
type: custom:tile-card-pro
entity: light.living_room
```

:::

That is a complete card. The tile knows the entity is a light, so it shows its switch and glows in the light's colour. Tap the switch to try it.

## What the kind gives you

The **kind** is what the entity is. The tile detects it, and each kind brings its own look: a cover its buttons, a thermostat its stepper and target, a battery its colours by level. These tiles all have nothing but `entity:`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.phone_battery
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
```

:::

[Kinds](/cards/kinds) lists every kind and what it draws.

## Change one thing

Every part of a tile has a key of its own. Set a key and the kind fills in the rest. Here the tile gets a shorter name, and `rules` set its colour, icon and status by the temperature:

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.living_room_temperature
name: Living room
rules:
  - { below: 19, color: blue, icon: mdi:snowflake, status: Too cold }
  - { below: 24, color: green, icon: mdi:thermometer, status: Comfortable }
  - { above: 24, color: orange, icon: mdi:sun-thermometer, status: Warm }
```

:::

Rules match in the order you write them; the first match wins. [Look](/cards/look) covers icons, visuals, colours and rules.

## Your first poster

A poster takes nearly the same keys as a tile. Change the `type` and the same card shows its value large, with the status as a badge in the corner:

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  rules:
    - { below: 19, color: blue, status: Too cold }
    - { below: 24, color: green, status: Comfortable }
    - { above: 24, color: orange, status: Warm }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  rules:
    - { below: 19, color: blue, status: Too cold }
    - { below: 24, color: green, status: Comfortable }
    - { above: 24, color: orange, status: Warm }
  grid_options: { columns: 6 }
```

:::

## Your first tile group

A tile group puts several tiles on one card under a title. List the entities under `tiles`, or give a tile its own keys:

::: live

```yaml
type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
badges:
  - sensor.living_room_temperature
  - sensor.living_room_humidity
tiles:
  - { entity: light.living_room, name: Ceiling }
  - light.desk_lamp
  - cover.living_room_blinds
  - climate.living_room
```

:::

## The visual editor and the Playground

You do not have to write YAML. The cards appear in the card picker as "Tile Card Pro", "Poster Card Pro" and so on, and every current card has a visual editor; the tile's and the poster's offer only the options that apply to the entity's kind. Pick an entity in the picker instead, and Home Assistant suggests the cards that fit it. The editors write only what you change: a field left at its default writes nothing, and what a form does not show stays in the YAML as written.

The [Playground](/playground) runs these editors on this site, next to the YAML. Their examples have an **Edit** link that opens them there.

## Completion in your YAML editor

Every card has a JSON Schema. An editor with a YAML language server, such as VS Code, can complete the options and underline a typo. Add one comment line at the top of the file:

```yaml
# yaml-language-server: $schema=https://malte-wessel.github.io/pro-cards/schema/pro-cards.schema.json
type: custom:tile-card-pro
entity: light.living_room
```

## About the examples

The examples on this site run the real cards against a simulated home. Values drift every few seconds, switches really toggle, and graphs have a history. Every example shows its YAML underneath, ready to paste.

## Next steps

- [Kinds](/cards/kinds): every kind and what it draws.
- [Look](/cards/look): icon, visual, colour and rules.
- [Controls](/cards/controls): switches, sliders and buttons on the card.
- [Badges](/cards/badges): more values beside the name or in the corner.
