# Moving to the 3.0 cards

3.0 brings the [tile](/cards/tile-card), the [poster](/cards/poster-card), the [tile group](/cards/tile-group-card), the [heading](/cards/heading-card) and the [layout card](/cards/layout-card). They take over from six older cards, which are deprecated: they still work in 3.0, say so once in the browser console, and go in 4.0.

| Deprecated card                                     | Use instead                                                     |
| --------------------------------------------------- | --------------------------------------------------------------- |
| [Entity card](/cards/entity-card)                   | a [tile](/cards/tile-card), or a [poster](/cards/poster-card)   |
| [Entity group card](/cards/entity-group-card)       | a [tile group](/cards/tile-group-card)                          |
| [Entity sections card](/cards/entity-sections-card) | a [layout card](/cards/layout-card) of headings and tile groups |
| [Wind card](/cards/wind-card)                       | a poster or a tile of the [wind kind](/cards/poster-types#wind) |
| [Rain card](/cards/rain-card)                       | a poster or a tile of the [rain kind](/cards/poster-types#rain) |
| [Illuminance card](/cards/illuminance-card)         | nothing: it goes (see [below](#the-illuminance-card))           |

The new cards say every old key they no longer take in an error that names its new spelling, so a card moved over tells you what to change.

## What changes on every card

Three things work the other way round on the new cards, also where the keys look the same:

- **The kind's defaults come on.** A tile or a poster draws its entity as its [kind](/cards/poster-types): a light brings its switch and its glow, a battery its colours by level, a cover its buttons. `kind: none` turns all of that off; `rules: []`, `control: false` or `visual: false` drop one part.
- **`color` and `icon` are defaults.** On the old cards they beat the rules; now a matching rule's colour and icon win. Leave them out to let the value decide, as before.
- **A rule's text is its `status`.** The old cards' `label` is `status` on a tile and a poster, and `value` on a [badge](/cards/poster-badges).

`hover` is on by default, as on Home Assistant's own tile.

## The entity card

One entity is a tile, or a poster where its value should be large. Most keys are the same; these change:

| Entity card                                             | Tile or poster                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `visual: ring`                                          | `icon: { ring: true }`                                                                                |
| `visual: icon`                                          | leave it out: the icon is always drawn                                                                |
| `visual: gauge`, `bar`, `sparkline`, `columns`, `strip` | the same `visual`, its window inside it: `visual: { type: sparkline, hours: 6 }`                      |
| `visual: badge`                                         | the status: on a tile on its line, or as a badge with `status_badge: true`; on a poster in its corner |
| `hours_to_show`, `bucket_minutes`, `smoothing_minutes`  | `visual: { hours, bucket, smoothing }`                                                                |
| `icon_style`, `show_entity_picture`, `show_icon: false` | `icon: { style }`, `icon: { type: image }`, `icon: false`                                             |
| `toggle: true`, `control: true`, `control: none`        | `control: toggle`, `control: auto`, `control: false`                                                  |
| `control_position`, `control_step`, `control_options` … | `control: { type, position, step, options, attribute, confirm }`                                      |
| `control_position: lead`                                | the icon's own actions: `icon: { tap_action: … }`                                                     |
| `secondary` replaces the line                           | `secondary` follows the value and the status; `show_value: false` and `status: false` leave them out  |
| `rules[].label`                                         | `rules[].status`                                                                                      |

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  visual: { type: sparkline, hours: 6 }
  rules:
    - { below: 19, color: blue, status: Cool }
    - { above: 24, color: orange, status: Warm }
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.kitchen
  icon: { ring: true }
  grid_options: { columns: 6 }
```

:::

## The entity group card

Several entities are a tile group: a title, an icon, badges in the header and its `tiles`. Each tile says everything about itself: the group passes nothing down to its tiles (`show_name`, the actions, the history window are set per tile).

| Entity group card                             | Tile group                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `entities`                                    | `tiles`, with a tile's keys                                      |
| `layout: list`, `column`                      | `layout: list`                                                   |
| `layout: row`                                 | `layout: row` (vertical tiles side by side)                      |
| `layout: grid`, `hero`, `table`               | a layout card, see below                                         |
| `header_entities`                             | `badges`, with a [badge's keys](/cards/poster-badges#badge-keys) |
| `show_icon`, `show_name`, actions on the card | on each tile                                                     |
| `align`, `name_position`, `vertical_align`    | none                                                             |

::: live

```yaml
type: custom:tile-group-card-pro
title: Kitchen
icon: mdi:silverware-fork-knife
badges:
  - sensor.kitchen_temperature
tiles:
  - light.kitchen
  - switch.coffee_machine
  - sensor.kitchen_humidity
```

:::

The group card's other layouts are a [layout card](/cards/layout-card) of new cards:

- **grid:** posters in a layout card with `columns`;
- **hero:** a poster above a tile group, `card_style: seamless` making them one surface;
- **table:** a tile group in `layout: list`.

::: live

```yaml
type: custom:layout-card-pro
card_style: seamless
cards:
  - type: custom:poster-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: { type: sparkline, hours: 12 }
  - type: custom:tile-group-card-pro
    tiles:
      - light.living_room
      - cover.living_room_blinds
      - sensor.living_room_humidity
```

:::

Two looks have no match: the group's ring with the value inside it (a ring is around the icon now), and one rule tinting the whole group (a tile's `tint_card` tints that tile).

## The entity sections card

A card of sections is a layout card: a [heading](/cards/heading-card) for its title and badges, a tile group for each section (with a title of its own where it helps), `card_style: seamless` for one surface. A section's `visibility` is that tile group's.

::: live

```yaml
type: custom:layout-card-pro
card_style: seamless
cards:
  - type: custom:heading-card-pro
    title: Living room
    icon: mdi:sofa
    badges:
      - sensor.living_room_temperature
      - sensor.living_room_humidity
  - type: custom:tile-group-card-pro
    layout: row
    tiles:
      - scene.bright
      - scene.dimmed
      - scene.movie_night
  - type: custom:tile-group-card-pro
    tiles:
      - light.living_room
      - fan.living_room
```

:::

The seamless surface draws a line between every two cards: a section without a divider has none on one surface. The card's defaults for its sections (`show_*`, the actions, the window) are set on each tile.

## The wind and rain cards

A wind or a rain sensor is a poster or a tile of the [wind](/cards/poster-types#wind) or [rain](/cards/poster-types#rain) kind: its speed or rate in the kind's colours, the animation in its icon, the direction and gusts (or today's total) found on its device.

| Wind or rain card                    | Poster or tile                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `direction`, `gust`, `today`, `wind` | `inputs: { direction, gust, today, wind }`, else found on the sensor's device                        |
| `layout: tile`                       | a tile: the animation in its icon                                                                    |
| `visual: flow`, `layout: hero`       | `visual: { type: flow }`: the animation behind the card, the icon a still arrow or a rain icon       |
| `flow.style`                         | `visual: { type: flow, variant }` (`dots`, `lines`, `swoosh`, `vectors`; `drops`, `ripples`, `fill`) |
| `lead: icon`                         | `icon: mdi:…`                                                                                        |
| `title`, `header_entities`           | a tile group around it, or a heading above                                                           |
| `rules[].label`                      | `rules[].status`; the kind brings its bands until the card writes its own                            |

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  visual: { type: flow, variant: drops }
  grid_options: { columns: 6 }
```

:::

What the new cards leave out: the hero's band under the lead and its `flow.height` (the animation fills the poster), the wind field's `density`, and a still direction arrow without the animation behind it.

## The illuminance card

The illuminance card goes without a successor. Its log scale, its zones and its arc have no match on the new cards. The nearest is a tile with the history as a strip, coloured by rules:

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.illuminance
kind: none
visual: { type: strip, hours: 24, bucket: 30 }
rules:
  - { below: 1, color: indigo, status: Night }
  - { below: 100, color: blue-grey, status: Twilight }
  - { below: 10000, color: teal, status: Overcast }
  - { below: 30000, color: amber, status: Day }
  - { above: 30000, color: orange, status: Sun }
```

:::
