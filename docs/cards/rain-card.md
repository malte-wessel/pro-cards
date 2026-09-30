# Rain Card

`custom:rain-card` shows the rain: how hard it falls now and, with a second sensor, how much fell today. The card animates it in three styles: `drops` fall and splash on the bottom edge, more and faster the harder it rains and slanted by the wind; `ripples` spread where drops land on a puddle; `fill` is a rain gauge whose water rises with today's total. Your `rules` colour the rain, label the value and may tint the card. Without options it is a tile like the [entity card](/cards/entity-card); `visual: flow` makes the whole tile the field, `layout: hero` adds the big value and a band. YAML only.

## Tile

The rate sensor alone makes a tile: the name, the rate and, with `today`, the total so far. The round lead shows a small version of the animation, or the rain icon on a dry day.

::: live

```yaml
type: custom:rain-card
entity: sensor.rain_rate_roof
today: sensor.rain_today
```

:::

## Flow tile

`visual: flow` turns the tile into the animated field with the rain icon and the texts on top. A full-width tile shows the name, the rule label with today's total and the big rate; a half-width tile keeps to the name and "rate · total today". `flow.style` picks the animation.

::: live

```yaml
- type: custom:rain-card
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  visual: flow
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
- type: custom:rain-card
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  visual: flow
  flow: { style: ripples }
  grid_options: { columns: 6 }
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
- type: custom:rain-card
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  visual: flow
  flow: { style: fill }
  grid_options: { columns: 6 }
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
```

:::

## Hero

`layout: hero` shows the big rate with the label and today's total on the second line, then the band with a chip that repeats the total. `flow.height` sets the band's height (40 to 400 px, default 120). `title`, `icon` and `header_entities` add a header like every entity card. The gauge below is full at 12 mm.

::: live

```yaml
type: custom:rain-card
entity: sensor.rain_rate_roof
today: sensor.rain_today
title: Rain
header_entities:
  - { entity: sensor.rain_today, icon: mdi:cup-water, color: blue }
layout: hero
flow: { style: fill, height: 140 }
rules:
  - { below: 0.1, color: blue-grey, label: Dry }
  - { below: 2.5, color: light-blue, label: Light rain }
  - { below: 7.6, color: blue, label: Moderate rain }
  - { below: 50, color: indigo, label: Heavy rain }
  - { above: 50, color: deep-purple, label: Violent rain, tint_card: true }
```

:::

## Wind and direction

`wind` slants the drops with the wind speed (up to 32° at 35 km/h and more; m/s, mph, kn and ft/s are understood) and `direction` says which way: a westerly wind blows them to the right. Without the two the drops fall straight. Ripples and the gauge ignore the wind.

::: live

```yaml
type: custom:rain-card
entity: sensor.rain_rate_roof
today: sensor.rain_today
wind: sensor.wind_gust
direction: sensor.wind_direction
layout: hero
```

:::

## Rules and colours

`rules` work on the rate like the [entity rules](/cards/entity-options#rules): `below` / `above` thresholds in the sensor's unit, first match wins. The matching rule's `color` paints the rain, the lead and the chip icon; its `label` is the pill of the tile and the accent of the second line; `tint_card: true` tints the whole card. A fixed `color` overrides the rules. Below 0.1 the card counts as dry: no drops, the icon in the lead.

::: live

```yaml
- type: custom:rain-card
  entity: sensor.rain_rate
  today: sensor.rain_today
  visual: flow
  rules:
    - { below: 0.1, color: blue-grey, label: Dry }
    - { above: 0.1, color: blue, label: Rain }
- type: custom:rain-card
  entity: sensor.rain_rate_roof
  visual: flow
  flow: { style: ripples }
  rules:
    - { above: 0, color: indigo, label: Heavy rain, tint_card: true }
```

:::

## Lead and motion

`lead: icon` puts the rain icon in the round lead instead of the animation (the flow tile always shows the icon). The animation is CSS only and keeps flowing through sensor updates: a new rate changes its pace, the field is redrawn only when rain starts or stops or the drop count changes by a quarter, and the wind's slant and the gauge's level move in place. It pauses when your system asks for reduced motion (`prefers-reduced-motion`), leaving a still field.

::: live

```yaml
- type: custom:rain-card
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  lead: icon
  grid_options: { columns: 6 }
- type: custom:rain-card
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  flow: { style: fill }
  grid_options: { columns: 6 }
```

:::

## Reference

### Card options

| Option              | Default                   | Description                                                                                                         |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `entity`            | required                  | The rain rate sensor (`sensor.*`, mm/h or in/h).                                                                    |
| `today`             | –                         | Today's total (mm or in): shown as "… today", fills the gauge, appears in the hero's chip.                          |
| `wind`, `direction` | –                         | Wind speed and direction sensors: slant the drops. Direction in degrees or an English compass point (`N`, `NNE` …). |
| `name`, `secondary` | friendly name / see above | The first line and the line under it; templates allowed. `secondary` replaces the generated line.                   |
| `color`             | –                         | Fixed colour; overrides the rules.                                                                                  |
| `decimals`          | sensor                    | Decimals of the rate.                                                                                               |
| `rules`             | –                         | `[{ below, above, color, label, tint_card }]` on the rate; first match wins.                                        |
| `layout`            | `tile`                    | `tile` or `hero`.                                                                                                   |
| `visual`            | `icon`                    | Tile only: `flow` makes the whole tile the animated field.                                                          |
| `lead`              | `animated`                | The round lead: `animated` (the style, small) or `icon`.                                                            |
| `flow`              | see below                 | The animation options.                                                                                              |
| `title`, `icon`     | –                         | Header, templates allowed. `header_entities` as in the [group card](/cards/entity-group-card#header-entities).      |
| `tap_action` …      | `more-info`               | `tap_action`, `hold_action`, `double_tap_action` on the lead row.                                                   |

### Flow options

| Option   | Default | Description                                                                                |
| -------- | ------- | ------------------------------------------------------------------------------------------ |
| `style`  | `drops` | `drops`, `ripples` or `fill`. The rate sets how much rain each shows; there is no density. |
| `height` | `120`   | Height of the hero's band in px (40 to 400). The flow tile's band fills the tile.          |

The tile takes half a section (6 columns) and one row, two with a header; the hero takes the full width and sizes to its content.
