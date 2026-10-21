# Layout Card Pro

`custom:layout-card-pro` arranges cards, Pro Cards and Home Assistant's own, inside a section: in a grid or in masonry, as one surface or as separate cards, and differently depending on how many view columns the section spans. Home Assistant sizes the cards of a section by twelfths of it, the same on a phone and on a desktop; the layout card lets them take two columns in one view column and four in two, for example. The cards keep their own `visibility`. YAML only for now.

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

`card_style: seamless` merges the cards into one surface with dividers between them. The layout draws the surface in the theme's card colour, border and radius, and the cards inside drop their own (it sets `--ha-card-background`, `--ha-card-border-width`, `--ha-card-border-radius` and `--ha-card-box-shadow` for them). The gaps default to 0.

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

With `padding`, the padding is inside the surface, around the cards. A card that draws its own background without these variables keeps it. For one column of cards, use `columns: 1`.

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
