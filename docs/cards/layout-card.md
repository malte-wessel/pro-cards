# Layout Card Pro

`custom:layout-card-pro` arranges any cards, Pro Cards and Home Assistant's own, in a grid, a stack or masonry. Its breakpoints measure the card's own width, so the same layout reflows inside a wide section, a narrow column or another layout. Each card says where it sits in its `view_layout`: how many columns and rows it spans, its order, whether it sticks, and its priority when the layout folds the surplus into a "+N more" row. The cards keep their own `visibility`. YAML only for now.

## Grid

`columns` is a count of equal columns. Every card takes one column unless its `view_layout` says otherwise: `span: 2` takes two columns, `span: [1, 2]` one column and two rows, `span: full` the whole row.

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

### As many as fit

`min_column_width` makes as many columns as fit, none narrower than the width, without any breakpoints. `max_columns` caps the count. Spans larger than the columns there are shrink to the row. It wins over `columns`; a breakpoint that should count columns again sets `min_column_width: null`.

::: live

```yaml
type: custom:layout-card-pro
min_column_width: 180
cards:
  - type: custom:entity-card-pro
    entity: sensor.living_room_temperature
  - type: custom:entity-card-pro
    entity: sensor.kitchen_temperature
  - type: custom:entity-card-pro
    entity: sensor.bedroom_temperature
  - type: custom:entity-card-pro
    entity: sensor.office_temperature
```

:::

### Fixed rows

By default a row is as tall as its tallest card and the cards stretch to it (`align_items: start` keeps their own heights). `row_height` makes rows of a fixed height as in Home Assistant's sections grid: a card that spans rows, by its `span` or by its own `grid_options` rows, is exactly that tall and fills it.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
row_height: 56
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

With `columns: 12` the cards take the columns of their own `grid_options` as they do in a section: a tile with `columns: 6` takes half the row.

## Stack

`layout: stack` puts the cards one below the other (`direction: down`) or side by side (`direction: across`). Across, the cards share the width equally, a `span` of 2 takes twice the share, and `wrap: true` with `min_column_width` wraps them onto new lines.

::: live

```yaml
type: custom:layout-card-pro
layout: stack
direction: across
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
  - type: custom:entity-card-pro
    entity: sensor.outdoor_humidity
```

:::

## Masonry

`layout: masonry` fills columns by height, like Home Assistant's masonry view, but with the column count and the order yours. Each card goes to the shortest column, measured by the cards' own size (their `getCardSize`), never by their drawn height, so a card that changes height does not reshuffle the others. `view_layout.column` pins a card to a column.

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

## Spacing

`gap` is the space between cards, one length or `[row, column]`; `row_gap` and `column_gap` set one direction. `padding` is inside the layout around the cards (1, 2 or 4 values, or `{ top, right, bottom, left }`), `margin` outside it, where negative values let the layout bleed to the edge. Lengths are numbers (px) or strings with `px`, `rem`, `%` or a theme variable such as `var(--ha-space-4)`. `density` sets the gaps at once: `compact` (4 px), `default` (the sections grid's gap), `roomy` (16 px), or `auto`, which is roomy on a touch screen.

`max_width` keeps a layout narrower than its card, `align` places it there (`start`, `center`, `end`).

::: live

```yaml
type: custom:layout-card-pro
columns: 2
gap: [4, 16]
padding: [8, 0]
max_width: 320
align: start
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

A card that draws its own background without these variables keeps it.

## Breakpoints

The top-level options are the smallest layout (`phone`). Each breakpoint under `breakpoints` starts at a width and lists only what changes there, inherited by every wider one: `tablet` (600 px), `desktop` (1024 px) and `wide` (1440 px) by default. Give one a number to move it, `false` to drop it, or a name of your own with a `min_width`.

::: live width=760

```yaml
type: custom:layout-card-pro
columns: 1
breakpoints:
  tablet: { columns: 2 }
  desktop: { min_width: 720, columns: 3, gap: 12 }
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
  - type: custom:entity-card-pro
    entity: sensor.outdoor_humidity
  - type: custom:entity-card-pro
    entity: sensor.pressure
```

:::

The width is the layout card's own, not the screen's (`container: true`), so a layout inside a narrow column or inside another layout reflows by itself. That also means a layout card in a single sections column, which is 320 to 500 px wide, is always `phone`: give its section a larger `column_span`, or use a panel or sidebar view, for the wider breakpoints. `container: false` measures the window instead.

A breakpoint holds a little below its width (24 px) once it applies, so a page scrollbar that appears with the taller layout does not switch it back and forth.

### Media rules

`media` adds options for anything the breakpoints do not cover: orientation, a touch screen, a dark theme. Each rule is a CSS media query with the options it changes. The first matching rule applies; `merge: true` applies it and goes on to the next.

```yaml
type: custom:layout-card-pro
columns: 3
media:
  - { query: "(orientation: portrait)", columns: 1 }
  - { query: "(pointer: coarse)", merge: true, density: roomy }
cards: []
```

## Placing cards

Every card may carry a `view_layout`. All of its options except `priority`, `show_on` and `hidden_below` take one value or a map by breakpoint, inherited upwards: `span: { phone: 1, desktop: [2, 2] }` spans one column up to tablet and two columns and two rows from desktop.

| Option         | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `span`         | Columns (`2`), `[columns, rows]` or `full`. Stack across: the card's share of the width.                         |
| `column`       | Grid: the column the card starts in. Masonry: the column it goes to.                                             |
| `row`          | Grid: the row the card starts in.                                                                                |
| `order`        | Moves the card without moving its YAML; negative values come first.                                              |
| `align`        | `start`, `center`, `end` or `stretch`: how this card sits in its cell.                                           |
| `sticky`       | `true` stays in view under the header while the page scrolls, within the layout card; or an offset such as `64`. |
| `aspect`       | A fixed shape, such as `16/9`, for cameras and pictures.                                                         |
| `min_height`   | At least this tall. `max_height`: at most.                                                                       |
| `bleed`        | Ignores the layout's side `padding`.                                                                             |
| `priority`     | `high`, `normal` or `low`: what folds first (see below).                                                         |
| `show_on`      | Only on these breakpoints, e.g. `[tablet, desktop]`.                                                             |
| `hidden_below` | Not below this breakpoint, e.g. `tablet`.                                                                        |

`view_layout` is the key Home Assistant keeps for this; its own `position` is left alone.

Here the lock comes first whatever its place in the YAML, the camera-like card keeps a 16:9 shape, and the office card shows only from `tablet`, which this narrow layout never reaches:

::: live

```yaml
type: custom:layout-card-pro
columns: 2
align_items: start
cards:
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
    visual: sparkline
    view_layout: { aspect: 16/9 }
  - type: custom:entity-card-pro
    entity: light.kitchen
    view_layout: { align: center }
  - type: custom:entity-card-pro
    entity: lock.front_door
    view_layout: { order: -1, span: full }
  - type: custom:entity-card-pro
    entity: light.office
    view_layout: { hidden_below: tablet }
```

:::

## Visibility

Every card inside keeps Home Assistant's own `visibility`, with all its conditions (state, numeric state, screen, user, time, location …) and its editor. A hidden card leaves no gap: the cards after it move up. When every card is hidden the layout hides too. `show_on` and `hidden_below` add the layout's own breakpoints to that. In the dashboard editor every card shows; the ones the layout's own breakpoints (`show_on`, `hidden_below`) or its fold would hide are faded. A card that Home Assistant's `visibility` hides shows there as on any dashboard, unfaded.

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

## Fold

`fold: { max_cards: 3 }` shows at most three cards and folds the rest into a "+N more" row that opens them. Low-priority cards fold first, from the end, then normal ones; high-priority cards never fold. The fold can differ per breakpoint, e.g. only on the smallest one; `label` is the row's text, with `{count}` for the number of cards behind it.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
fold: { max_cards: 2 }
breakpoints:
  tablet: { fold: false }
cards:
  - type: custom:entity-card-pro
    entity: lock.front_door
    view_layout: { priority: high }
  - type: custom:entity-card-pro
    entity: sensor.outdoor_temperature
  - type: custom:entity-card-pro
    entity: light.garden
    view_layout: { priority: low }
  - type: custom:entity-card-pro
    entity: cover.garage_door
    view_layout: { priority: low }
```

:::

## Sizing

In a section the layout card takes the full width of the section, whatever its `column_span`, and sizes to its cards (`rows: auto`); a fixed row count (`grid_options: { rows: 6 }`) gives it a height its grid fills. Its `getCardSize`, which masonry views use, is an estimate from its cards' sizes: the tallest card of each row for a grid (spans not counted), the sum or the tallest for a stack, the tallest column for masonry. See [Sizing](/guide/sizing).

## Reference

### Card options

Every option but `container`, `breakpoints`, `media` and `cards` may change in a breakpoint or a media rule.

| Option             | Default   | Description                                                                                                      |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `layout`           | `grid`    | `grid`, `stack` or `masonry`.                                                                                    |
| `columns`          | `1`       | A count (1 to 24) or a list of tracks (`[1fr, 2fr]`, `[320px, 1fr]`). Masonry: the column count or their widths. |
| `min_column_width` | –         | As many columns as fit, none narrower (grid and masonry); stack across with `wrap`: each card's minimum width.   |
| `max_columns`      | –         | With `min_column_width`: at most this many columns.                                                              |
| `max_width`        | –         | The layout's widest.                                                                                             |
| `align`            | `center`  | `start`, `center` or `end`: where a layout narrower than its card (`max_width`) sits.                            |
| `row_height`       | `auto`    | Grid: `auto`, or the height of one row (e.g. `56`) for cards that span rows.                                     |
| `dense`            | `false`   | Grid: later small cards fill the holes big ones leave.                                                           |
| `align_items`      | `stretch` | `stretch`, `start`, `center` or `end`: how cards sit in their row.                                               |
| `direction`        | `down`    | Stack: `down` or `across`.                                                                                       |
| `wrap`             | `false`   | Stack across: wrap onto new lines, each card at least `min_column_width`.                                        |
| `gap`              | density   | One length or `[row, column]`.                                                                                   |
| `row_gap`          | density   | The space between rows; wins over `gap`. `column_gap`: between columns.                                          |
| `padding`          | `0`       | Inside the layout: 1, 2 or 4 values, or `{ top, right, bottom, left }`.                                          |
| `margin`           | `0`       | Outside the layout, negative values allowed.                                                                     |
| `density`          | `default` | `compact`, `default`, `roomy` or `auto` (roomy on touch screens).                                                |
| `card_style`       | `cards`   | `cards` or `seamless` (one surface with dividers).                                                               |
| `fold`             | –         | `{ max_cards, label }`, a card count, or `false`.                                                                |
| `container`        | `true`    | Breakpoints measure the layout card (`true`) or the window (`false`).                                            |
| `breakpoints`      | see above | `name: min width`, `name: { min_width, …options }` or `name: false`. The base is `phone`.                        |
| `media`            | –         | `[{ query, merge, …options }]`.                                                                                  |
| `cards`            | `[]`      | The cards, each with an optional `view_layout`.                                                                  |
