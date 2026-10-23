# Layout Card Pro

`custom:layout-card-pro` arranges cards, Pro Cards and Home Assistant's own, inside a section: in a grid or in masonry, as one surface or as separate cards, and differently depending on how many view columns the section spans. The cards keep their own `visibility`. YAML only for now. The [layout showcase](/showcase/layout) shows whole dashboards built with it.

## When to use it

- **The cards of a section should rearrange with its width.** Home Assistant sizes the cards of a section by twelfths of it, so two tiles share a row both when the section spans one view column on a phone and when it spans two on a desktop. The layout card gives them two columns in one view column and four in two (see [Breakpoints](#breakpoints)).
- **Cards that belong together should look like one card.** `card_style: seamless` merges them into one surface with dividers, what stack-in-card and vertical-stack-in-card are used for, while each card stays its own card with its own editor and visibility (see [Seamless](#seamless)).
- **A section needs columns Home Assistant does not have:** a fixed side next to a flexible main area (`[320px, 1fr]`), three equal columns, or masonry for cards of different heights, which in a section would stretch to the tallest card of their row (see [Tracks](#tracks) and [Masonry](#masonry)).

You do not need it to put cards one above the other or side by side at fixed shares: Home Assistant's vertical stack, horizontal stack and grid card do that, and a card's own `grid_options` size it in a section.

## Recipes

Complete cards to copy; the sections after them explain each option. The examples on this page show Pro Cards, but any card works inside, Home Assistant's tile, thermostat or picture cards too.

### A room card

The room's header, its light with a slider and three buttons in a row, merged into one card. Each part is a card of its own, so its tap actions, controls and `visibility` work as anywhere else.

::: live

```yaml
type: custom:layout-card-pro
card_style: seamless
cards:
  - type: custom:entity-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:entity-card-pro
    entity: light.living_room
    control: auto
  - type: custom:layout-card-pro
    columns: 3
    card_style: seamless
    cards:
      - type: custom:entity-card-pro
        entity: cover.living_room_blinds
        name: Blinds
      - type: custom:entity-card-pro
        entity: media_player.living_room_tv
        name: TV
      - type: custom:entity-card-pro
        entity: climate.living_room
        name: Heating
```

:::

### More columns where there is room

The lights of the house: two columns on a phone, four once the section spans two view columns. This frame is as wide as two view columns, so it shows four; the [showcase](/showcase/layout) has the same card in a narrow and a wide section.

::: live width=full

```yaml
type: custom:layout-card-pro
columns: 2
breakpoints:
  2: { columns: 4 }
cards:
  - type: custom:entity-card-pro
    entity: light.living_room
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: light.dining_table
  - type: custom:entity-card-pro
    entity: light.office
  - type: custom:entity-card-pro
    entity: light.desk_lamp
  - type: custom:entity-card-pro
    entity: light.bedroom
  - type: custom:entity-card-pro
    entity: light.hallway
  - type: custom:entity-card-pro
    entity: light.garden
```

:::

### A main card with a side column

The forecast takes two thirds and the doors line up beside it; on a phone the doors go below. Home Assistant's twelfths would give the same shares, but not the column of cards next to one tall card.

::: live width=full

```yaml
type: custom:layout-card-pro
columns: 1
breakpoints:
  2: { columns: [2fr, 1fr] }
cards:
  - type: custom:weather-card-pro
    entity: weather.home
    sections:
      - type: hero
      - type: forecast
        mode: daily
        days: 5
  - type: custom:layout-card-pro
    cards:
      - type: custom:entity-card-pro
        entity: lock.front_door
      - type: custom:entity-card-pro
        entity: cover.garage_door
      - type: custom:entity-card-pro
        entity: lock.garage_side_door
      - type: custom:entity-card-pro
        entity: cover.awning
```

:::

### A toolbar

Small cards over a strip of readings, the top of a room or a dashboard: two in a row on a phone, four once there is room, where a section would give each card a fixed share. The strip is one card to the eye.

::: live width=full

```yaml
type: custom:layout-card-pro
gap: 4
cards:
  - type: custom:layout-card-pro
    columns: 2
    breakpoints:
      2: { columns: 4 }
    gap: 4
    cards:
      - type: custom:entity-card-pro
        entity: light.living_room
        name: Lights
        tap_action: { action: toggle }
      - type: custom:entity-card-pro
        entity: switch.coffee_machine
        name: Coffee
        tap_action: { action: toggle }
      - type: custom:entity-card-pro
        entity: vacuum.robot
        name: Robot
      - type: custom:entity-card-pro
        entity: lock.front_door
        name: Door
  - type: custom:layout-card-pro
    columns: 3
    card_style: seamless
    cards:
      - type: custom:entity-card-pro
        entity: sensor.outdoor_temperature
      - type: custom:entity-card-pro
        entity: sensor.power_consumption
      - type: custom:entity-card-pro
        entity: sensor.battery_soc
```

:::

### Rooms of different lengths

A masonry of room cards: each room is a seamless column, and each goes to the shorter column, so a long room next to a short one leaves no gap under the short one, as it would in a grid row.

::: live width=full

```yaml
type: custom:layout-card-pro
layout: masonry
columns: 1
breakpoints:
  2: { columns: 2 }
cards:
  - type: custom:layout-card-pro
    card_style: seamless
    cards:
      - type: custom:entity-card-pro
        entity: sensor.kitchen_temperature
        name: Kitchen
      - type: custom:entity-card-pro
        entity: light.kitchen
      - type: custom:entity-card-pro
        entity: light.dining_table
      - type: custom:entity-card-pro
        entity: media_player.kitchen_speaker
      - type: custom:entity-card-pro
        entity: switch.coffee_machine
  - type: custom:layout-card-pro
    card_style: seamless
    cards:
      - type: custom:entity-card-pro
        entity: sensor.bedroom_temperature
        name: Bedroom
      - type: custom:entity-card-pro
        entity: light.bedroom
  - type: custom:layout-card-pro
    card_style: seamless
    cards:
      - type: custom:entity-card-pro
        entity: sensor.office_temperature
        name: Office
      - type: custom:entity-card-pro
        entity: light.office
      - type: custom:entity-card-pro
        entity: light.desk_lamp
```

:::

### Energy at a glance

The power flow over the battery and the big consumers on a phone; from two view columns the flow takes half the width, three rows high, and the tiles fill the other half beside it.

::: live width=full

```yaml
type: custom:layout-card-pro
columns: 2
breakpoints:
  2: { columns: 4 }
cards:
  - type: custom:power-flow-card-pro
    home: sensor.power_consumption
    sources:
      - { type: solar, entity: sensor.solar_power }
      - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
      - { type: grid, power: sensor.grid_power }
    view_layout: { span: { 1: full, 2: [2, 3] } }
  - type: custom:entity-card-pro
    entity: sensor.battery_soc
    visual: ring
  - type: custom:entity-card-pro
    entity: sensor.heat_pump_power
  - type: custom:entity-card-pro
    entity: sensor.ev_charger_power
  - type: custom:entity-card-pro
    entity: sensor.washer_power
  - type: custom:entity-card-pro
    entity: sensor.solar_power
  - type: custom:entity-card-pro
    entity: sensor.grid_power
```

:::

## Grid

`columns` is a count of equal columns. Every card takes one column unless its `view_layout` says otherwise: `span: 2` takes two columns, `span: [1, 2]` one column and two rows, `span: full` the whole row. A span wider than the grid shrinks to it, and a start column (`column: 3`) moves so the card fits.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
    view_layout: { span: full }
  - type: custom:entity-card-pro
    entity: sensor.outdoor_humidity
  - type: custom:entity-card-pro
    entity: sensor.pressure
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: light.living_room
```

:::

### Tracks

A list makes columns of their own widths, as CSS's `grid-template-columns` does: `fr` shares what is left (`[1fr, 2fr]`), a length is fixed (`[320px, 1fr]`), and `minmax(200px, 1fr)` is at least 200 px. A column never grows past its share because of a wide card. Content-sized columns (`auto`, `max-content`) are not allowed: the cards size to their column, so such a column would shrink to nothing.

::: live

```yaml
type: custom:layout-card-pro
columns: [1fr, 2fr]
cards:
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
    visual: sparkline
```

:::

### Rows

A row is as tall as its tallest card and the cards stretch to it (`align_items: start` keeps their own heights). A card that asks for a number of rows, by its `span` (`[1, 3]`) or by its own `grid_options` rows (a tile with a feature asks for 2), gets them in the height of Home Assistant's sections grid rows (56 px each) and fills them.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
    visual: sparkline
    view_layout: { span: [1, 3] }
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: light.living_room
  - type: custom:entity-card-pro
    entity: light.office
```

:::

## Masonry

`layout: masonry` fills columns by height, like Home Assistant's masonry view, but inside a section and with the column count and the order yours. Each card goes to the shortest column, measured by the cards' own size (their `getCardSize`), never by their drawn height, so a card that changes height does not reshuffle the others. `view_layout.column` pins a card to a column.

::: live

```yaml
type: custom:layout-card-pro
layout: masonry
columns: 2
cards:
  - type: custom:weather-card-pro
    entity: weather.home
    sections:
      - type: forecast
        mode: daily
        days: 5
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: light.living_room
  - type: custom:entity-card-pro
    entity: light.office
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
    view_layout: { column: 1 }
```

:::

## Breakpoints

The breakpoints are view columns, the unit Home Assistant's sections view places sections in. The top-level options apply in one view column: on a phone, or in a section with `column_span: 1`. Each breakpoint under `breakpoints` names a number of view columns (2, 3 …) and lists only what changes once the layout's section spans that many, inherited by every wider one.

```yaml
type: custom:layout-card-pro
columns: 2 # one view column
breakpoints:
  2: { columns: 4 } # the section spans two view columns
  3: { columns: 6, gap: 12 } # three or more
```

In a sections view the layout reads the span Home Assistant gives its section, which already counts the columns the view shows: a section of `column_span: 2` spans two view columns on a desktop and one on a phone, where the view has one. Outside a section (a panel view, a stack, another layout card) it counts its own width in the sections view's columns, 500 px at most each: up to 500 px is one, up to 1032 px two, and so on.

The same layout in a narrow frame and in a wide one:

::: live

```yaml
type: custom:layout-card-pro
columns: 1
breakpoints:
  2: { columns: 3 }
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
  - type: custom:entity-card-pro
    entity: sensor.outdoor_humidity
  - type: custom:entity-card-pro
    entity: sensor.pressure
```

:::

::: live width=760

```yaml
type: custom:layout-card-pro
columns: 1
breakpoints:
  2: { columns: 3 }
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
  - type: custom:entity-card-pro
    entity: sensor.outdoor_humidity
  - type: custom:entity-card-pro
    entity: sensor.pressure
```

:::

## Spacing

`gap` is the space between cards, one length or `[row, column]`; without it the layout uses the sections grid's gap from the theme. `padding` is inside the layout around the cards (1, 2 or 4 values, or `{ top, right, bottom, left }`). Lengths are numbers (px) or strings with `px`, `rem`, `%` or a theme variable such as `var(--ha-space-4)`.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
gap: [4, 16]
padding: [8, 0]
cards:
  - type: custom:entity-card-pro
    entity: sensor.kitchen_temperature
  - type: custom:entity-card-pro
    entity: sensor.kitchen_humidity
  - type: custom:entity-card-pro
    entity: sensor.bathroom_temperature
  - type: custom:entity-card-pro
    entity: sensor.bathroom_humidity
```

:::

## Seamless

`card_style: seamless` merges the cards into one surface with dividers between them. The layout draws the surface in the theme's card colour, border and radius, and the cards inside drop their own (it sets `--ha-card-background` to transparent and `--ha-card-border-width`, `--ha-card-border-radius` and `--ha-card-box-shadow` for them). The surface is painted once, so a translucent card colour over a background image looks the same as on a single card. The gaps default to 0.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
card_style: seamless
cards:
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: light.living_room
  - type: custom:entity-card-pro
    entity: cover.living_room_blinds
  - type: custom:entity-card-pro
    entity: climate.living_room
```

:::

With `padding`, the padding is inside the surface, around the cards. A card that draws its own background without these variables keeps it, and a card that uses `--ha-card-background` for more than its background (a chip, a knob) draws that part transparent; the Pro Cards' knobs and tooltips keep the surface colour. For one column of cards, use `columns: 1`.

## Placing cards

Every card may carry a `view_layout`. Each of its options takes one value or a map by view columns, inherited upwards: `span: { 1: full, 2: 2 }` takes the whole row in one view column and two columns from two.

| Option   | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| `span`   | Columns (`2`), `[columns, rows]` or `full`.                           |
| `column` | Grid: the column the card starts in. Masonry: the column it goes to.  |
| `order`  | Moves the card without moving its YAML; negative values come first.   |
| `align`  | `start`, `center`, `end` or `stretch`: how this card sits in its row. |

`view_layout` is the key Home Assistant keeps for this; its own `position` is left alone.

Here the lock comes first whatever its place in the YAML, the kitchen card sits in the middle of its row, and the outdoor temperature takes the row in one view column and half of it from two:

::: live

```yaml
type: custom:layout-card-pro
columns: 2
align_items: start
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
    visual: sparkline
    view_layout: { span: { 1: full, 2: 1 } }
  - type: custom:entity-card-pro
    entity: light.kitchen
    view_layout: { align: center }
  - type: custom:entity-card-pro
    entity: lock.front_door
    view_layout: { order: -1, span: full }
```

:::

## Visibility

Every card inside keeps Home Assistant's own `visibility`, with all its conditions and its editor. A hidden card leaves no gap: the cards after it move up. When every card is hidden the layout hides too. To show a card only when the view has room, use Home Assistant's `view_columns` condition (`{ condition: view_columns, min: 2 }`); by screen size, its `screen` condition.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
cards:
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: media_player.living_room_tv
    visibility:
      - { condition: state, entity: media_player.living_room_tv, state_not: "off" }
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
```

:::

## Sizing

In a section the layout card takes the full width of the section, whatever its `column_span`, and sizes to its cards (`rows: auto`); a fixed row count (`grid_options: { rows: 6 }`) gives it a height its grid fills. Its `getCardSize`, which masonry views use, is an estimate from its cards' sizes: the tallest card of each row for a grid (spans not counted), the tallest column for masonry. As a panel view's only card it fills the view, and the cards inside keep their borders, as in Home Assistant's stacks (the panel view takes the border of its one card away). See [Sizing](/guide/sizing).

## Reference

### Card options

Every option but `breakpoints` and `cards` may change in a breakpoint.

| Option        | Default   | Description                                                                                                              |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `layout`      | `grid`    | `grid` or `masonry`.                                                                                                     |
| `columns`     | `1`       | A count (1 to 24) or a list of tracks (`[1fr, 2fr]`, `[320px, 1fr]`). Masonry: the column count or their widths.         |
| `align_items` | `stretch` | `stretch`, `start`, `center` or `end`: how cards sit in their row.                                                       |
| `gap`         | theme     | One length or `[row, column]`.                                                                                           |
| `padding`     | `0`       | Inside the layout: 1, 2 or 4 values, or `{ top, right, bottom, left }`.                                                  |
| `card_style`  | `cards`   | `cards` or `seamless` (one surface with dividers).                                                                       |
| `breakpoints` | –         | `{ 2: { …options }, 3: { … } }`: the options that change once the section spans that many view columns. The base is one. |
| `cards`       | `[]`      | The cards, each with an optional `view_layout`.                                                                          |
