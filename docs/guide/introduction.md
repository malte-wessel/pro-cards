# Introduction

Pro Cards is a set of custom cards for Home Assistant dashboards. They look like Home Assistant's own cards, follow your theme, and draw each entity the way it deserves: a light with its glow, a thermostat with its stepper, the wind as a moving field.

The cards install with HACS as one bundle, need nothing else, and speak 12 languages: they follow the language you set in Home Assistant.

## Kinds

Every entity has a **kind**: what it is. A light, a thermostat, a cover, a battery, the weather, the sun, a washing machine. The cards detect the kind from the entity, so a card usually needs only `entity:`. The kind then decides the icon, the colours, the status text, the controls and the picture.

You can change any part of it, one key at a time, or set `kind` yourself when the entity does not say what it is. [Kinds](/cards/kinds) lists them all.

## The three core cards

### Tile

A **tile** is a compact row: the icon, the name, and one line with the value and the status. The kind adds its controls at the end of the line, such as a light's switch or a thermostat's stepper.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  name: Ceiling
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
```

:::

### Poster

A **poster** shows one value large, with the icon at the top and badges in the corner. It has room for what the kind draws: the weather's next hours, a light's glow, a media player's cover art.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  grid_options: { columns: 6 }
```

:::

### Tile group

A **tile group** puts several tiles on one card under a title: a room, or a set of devices. It lays them out as a list, side by side in a row, or as a table with one line per tile.

::: live

```yaml
type: custom:tile-group-card-pro
title: Living room
icon: mdi:sofa
tiles:
  - { entity: light.living_room, name: Ceiling }
  - light.desk_lamp
  - cover.living_room_blinds
  - media_player.living_room_speaker
```

:::

A tile in a group takes the same keys as a tile card, and a poster nearly the same. What you learn on one works on the others.

## The other cards

| Card                                   | What it does                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| [Heading](/cards/heading-card)         | A title for a section, with live badges beside or below it.                        |
| [Layout](/cards/layout-card)           | Arranges cards in a grid or masonry that changes with the width of the section.    |
| [Swipe](/cards/swipe-card)             | Cards side by side in a strip you swipe through, with dots.                        |
| [Weather](/cards/weather-card)         | Current conditions and the hourly or daily forecast of a weather entity.           |
| [Sun path](/cards/sun-path-card)       | Today's sun elevation with sunrise, sunset, dawn, noon and dusk.                   |
| [Sun azimuth](/cards/sun-azimuth-card) | Where the sun is around your house, and the sides it shines on today.              |
| [Multi trend](/cards/multi-trend-card) | A trend graph of several sensors, with a tooltip on hover or touch.                |
| [Power flow](/cards/power-flow-card)   | Solar, battery and grid to your home and its rooms, as a tree with animated flows. |
| [Energy flow](/cards/energy-flow-card) | The same tree over a period (today, this week, month or year) from energy meters.  |

## Where to go next

- [Install & first card](/guide/getting-started): install the bundle and build your first tile, poster and tile group.
- [Playground](/playground): try the visual editor and the YAML side by side, and see the card change.
- [Showcase](/showcase/home): whole dashboards built with Pro Cards.
