# Rain Card Pro

::: warning Deprecated

The rain card is deprecated: it still works in 3.0 and goes in 4.0. Use a poster or a tile of the [rain kind](/cards/kinds#rain); [Moving to 3.0](/guide/migrating#the-wind-and-rain-cards) says what changes.

:::

`custom:rain-card-pro` shows how hard it rains now and, with a second sensor, how much fell today. It animates the rain in three styles: `drops` fall, more and faster the harder it rains and slanted by the wind; `ripples` spread on a puddle; `fill` is a rain gauge whose water rises with today's total. Your `rules` colour the rain. Without options it is a tile; `visual: flow` makes the whole tile the field, `layout: hero` adds the big value and a band. YAML only.

## Tile

The rate sensor alone makes a tile: the name, the rate and, with `today`, the total so far. The round lead shows a small version of the animation, or the rain icon on a dry day.

::: live

```yaml
type: custom:rain-card-pro
entity: sensor.rain_rate_roof
today: sensor.rain_today
```

:::

## Flow tile

`visual: flow` turns the tile into the animated field with the rain icon and the texts on top. A wide tile shows the name, the rule label with today's total and the big rate; a narrow one the name and "rate · total today". `flow.style` picks the animation.

::: live

```yaml
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  visual: flow
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  visual: flow
  flow: { style: ripples }
  grid_options: { columns: 6 }
  rules:
    - { below: 2.5, color: light-blue, label: Light rain }
    - { above: 2.5, color: blue, label: Moderate rain }
- type: custom:rain-card-pro
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

`layout: hero` shows the big rate with the label and today's total, then the band with a chip that repeats the total. `flow.height` sets the band's height (40 to 400 px, default 120); given more height, the band fills the card ([Filling the height](/guide/sizing#filling-the-height)). `title`, `icon` and `header_entities` add a header. The gauge (`fill`) is full at 12 mm.

::: live

```yaml
type: custom:rain-card-pro
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

`wind` slants the drops with the wind speed (up to 32° from about 35 km/h; m/s, mph, kn and ft/s are understood) and `direction` says which way: a westerly wind blows them to the right. Without `wind` the drops fall straight; without `direction` they lean to the right. Ripples and the gauge ignore the wind.

::: live

```yaml
type: custom:rain-card-pro
entity: sensor.rain_rate_roof
today: sensor.rain_today
wind: sensor.wind_gust
direction: sensor.wind_direction
layout: hero
```

:::

## Rules and colours

`rules` work on the rate like the [entity rules](/cards/entity-options#rules): `below` / `above` in the sensor's unit, first match wins. The rule's `color` paints the rain, the lead and the chip's icon; its `label` is the tile's pill and the accent of the second line; `tint_card: true` tints the whole card. A fixed `color` overrides the rules. Below 0.1 mm/h it counts as dry: no drops, the icon in the lead. Rates in in/h, mm/d or in/d and totals in in or cm are understood; the texts stay in the sensor's unit.

::: live

```yaml
- type: custom:rain-card-pro
  entity: sensor.rain_rate
  today: sensor.rain_today
  visual: flow
  rules:
    - { below: 0.1, color: blue-grey, label: Dry }
    - { above: 0.1, color: blue, label: Rain }
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  visual: flow
  flow: { style: ripples }
  rules:
    - { above: 0, color: indigo, label: Heavy rain, tint_card: true }
```

:::

## Lead and motion

`lead: icon` puts the rain icon in the round lead instead of the animation (a flow tile always shows the icon). The animation keeps flowing through sensor updates and pauses, leaving a still field, when your system asks for reduced motion.

::: live

```yaml
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  lead: icon
  grid_options: { columns: 6 }
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  flow: { style: fill }
  grid_options: { columns: 6 }
```

:::

## Hover

`hover: true` shows what a click will do, as Home Assistant's tile does: a light layer over the tile under the pointer, a stronger one while pressed; header entities do too, a hero keeps still. See [Hover](/cards/entity-options#hover).

::: live

```yaml
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  hover: true
  grid_options: { columns: 6 }
- type: custom:rain-card-pro
  entity: sensor.rain_rate_roof
  today: sensor.rain_today
  visual: flow
  hover: true
  grid_options: { columns: 6 }
```

:::

## Reference

### Card options

| Option              | Default                      | Description                                                                                                                                                                                     |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`            | required                     | The rain rate sensor (`sensor.*`, mm/h or in/h).                                                                                                                                                |
| `today`             | –                            | Today's total (mm or in): shown as "… today", fills the gauge, appears in the hero's chip.                                                                                                      |
| `wind`, `direction` | –                            | Wind speed and direction sensors: slant the drops. Direction in degrees or an English compass point (`N`, `NNE` …).                                                                             |
| `name`, `secondary` | friendly name / see above    | The first line and the line under it; templates allowed. `secondary` replaces the generated line.                                                                                               |
| `color`             | –                            | Fixed colour; overrides the rules.                                                                                                                                                              |
| `decimals`          | sensor                       | Decimals of the rate.                                                                                                                                                                           |
| `rules`             | –                            | `[{ below, above, color, label, tint_card }]` on the rate; first match wins.                                                                                                                    |
| `layout`            | `tile`                       | `tile` or `hero`.                                                                                                                                                                               |
| `visual`            | `icon`                       | Tile: `flow` makes the whole tile the animated field.                                                                                                                                           |
| `lead`              | `animated`                   | The round lead: `animated` (the style, small) or `icon`.                                                                                                                                        |
| `icon_style`        | `circle`                     | `plain` draws the icon lead (`lead: icon`) without its circle; the animated lead keeps it.                                                                                                      |
| `flow`              | see below                    | The animation options.                                                                                                                                                                          |
| `title`, `icon`     | –                            | Header, templates allowed. `header_entities` as in the [group card](/cards/entity-group-card#header-entities).                                                                                  |
| `title_tap_action`  | none                         | Action when the title or its icon is tapped, e.g. `{ action: navigate, navigation_path: /dashboard-rooms/kitchen }` to open the room's dashboard; see [Actions](/cards/entity-options#actions). |
| `tap_action` …      | more-info / more-info / none | `tap_action`, `hold_action`, `double_tap_action` on the lead row.                                                                                                                               |
| `hover`             | `false`                      | Home Assistant's hover and press layers on the tile; see [Hover](#hover).                                                                                                                       |

### Flow options

| Option   | Default | Description                                                                                |
| -------- | ------- | ------------------------------------------------------------------------------------------ |
| `style`  | `drops` | `drops`, `ripples` or `fill`. The rate sets how much rain each shows; there is no density. |
| `height` | `120`   | Height of the hero's band in px (40 to 400). The flow tile's band fills the tile.          |

The tile takes 6 columns, the hero 12; both size to their content (a tile at least one row, two with a header). The card shows the current states only.
