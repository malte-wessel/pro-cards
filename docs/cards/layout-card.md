# Layout

`custom:layout-card-pro` arranges cards inside a section: in a grid or in masonry, as separate cards or as one surface, and differently once the section spans more view columns. Use it when a section's cards should rearrange with its width, or when cards that belong together should look like one card. The [showcase dashboards](/showcase/home) are built with it.

Any card works inside, Home Assistant's own too, and each keeps its own editor, actions and `visibility`. To put cards one above the other or side by side at fixed shares, Home Assistant's vertical stack, horizontal stack and grid card are enough.

## A grid

`columns` is the number of equal columns. Every card takes one column unless its `view_layout` says otherwise: `span: 2` takes two columns, `span: [1, 2]` one column and two rows, `span: full` the whole row. A row is as tall as its tallest card, and the cards stretch to it.

::: live

```yaml
type: custom:layout-card-pro
columns: 2
cards:
  - type: custom:tile-card-pro
    entity: sensor.living_room_temperature
    visual: sparkline
    view_layout: { span: full }
  - type: custom:tile-card-pro
    entity: light.living_room
  - type: custom:tile-card-pro
    entity: light.desk_lamp
  - type: custom:tile-card-pro
    entity: climate.living_room
  - type: custom:tile-card-pro
    entity: cover.living_room_blinds
```

:::

`gap` sets the space between the cards (the theme's section gap by default), `padding` the space around them inside the layout.

## Seamless

`card_style: seamless` merges the cards into one surface with dividers between them, what stack-in-card is often used for. The layout draws the surface in the theme's card colour, border and radius, and the cards inside drop their own. The gap is 0 unless you set one, and `padding` sits inside the surface.

Here a room card: the temperature, the ceiling light and a row of three tiles, one card to the eye.

::: live

```yaml
type: custom:layout-card-pro
card_style: seamless
cards:
  - type: custom:tile-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:tile-card-pro
    entity: light.living_room
  - type: custom:layout-card-pro
    columns: 3
    card_style: seamless
    cards:
      - type: custom:tile-card-pro
        entity: cover.living_room_blinds
        name: Blinds
      - type: custom:tile-card-pro
        entity: media_player.living_room_speaker
        name: Music
      - type: custom:tile-card-pro
        entity: climate.living_room
        name: Heating
```

:::

A card that draws its own background without the theme's card variables keeps it.

## Columns by width

`min_column_width` makes as many columns of at least that width as fit, and the cards flow into them: two on a phone, more as the section gets wider. It is often all a grid needs to follow the width, with no breakpoints at all. `columns` is then the most columns there may be. Columns no card fills stay empty, so a card is one column wide in every row.

The lights of the house at `min_column_width: 160`, in a frame as wide as a phone and in a wide one:

::: live width=400

```yaml
type: custom:layout-card-pro
min_column_width: 160
cards:
  - type: custom:tile-card-pro
    entity: light.living_room
  - type: custom:tile-card-pro
    entity: light.desk_lamp
  - type: custom:tile-card-pro
    entity: light.kitchen
  - type: custom:tile-card-pro
    entity: light.dining_table
  - type: custom:tile-card-pro
    entity: light.office
  - type: custom:tile-card-pro
    entity: light.bedroom
  - type: custom:tile-card-pro
    entity: light.hallway
  - type: custom:tile-card-pro
    entity: light.garden
```

:::

::: live width=full

```yaml
type: custom:layout-card-pro
min_column_width: 160
cards:
  - type: custom:tile-card-pro
    entity: light.living_room
  - type: custom:tile-card-pro
    entity: light.desk_lamp
  - type: custom:tile-card-pro
    entity: light.kitchen
  - type: custom:tile-card-pro
    entity: light.dining_table
  - type: custom:tile-card-pro
    entity: light.office
  - type: custom:tile-card-pro
    entity: light.bedroom
  - type: custom:tile-card-pro
    entity: light.hallway
  - type: custom:tile-card-pro
    entity: light.garden
```

:::

`min_column_width` takes a length (`180`, `12rem`) and changes in a breakpoint like any option; `min_column_width:` left empty there goes back to a fixed `columns`. It counts columns, so it does not go with a list of their widths.

## Breakpoints

Breakpoints count **view columns**, the unit Home Assistant's sections view places sections in: one view column is one column of the dashboard, about 500 px wide. A section spans as many view columns as its `column_span` asks for and the screen has room for. The layout's own `columns` are something else: how its cards are arranged inside that section.

<div class="vcols">
  <div class="vcols-screen">
    <div class="vcols-view" style="--n: 1">
      <span class="vcols-col" style="--i: 1"></span>
      <div class="vcols-section" style="--span: 1"><div class="vcols-layout" style="--c: 2"><i></i><i></i><i></i><i></i></div></div>
    </div>
    <p class="vcols-caption"><strong>A phone</strong><br />the section spans 1 view column: <code>columns: 2</code></p>
  </div>
  <div class="vcols-screen">
    <div class="vcols-view" style="--n: 3">
      <span class="vcols-col" style="--i: 1"></span><span class="vcols-col" style="--i: 2"></span><span class="vcols-col" style="--i: 3"></span>
      <div class="vcols-section" style="--span: 1"><div class="vcols-layout" style="--c: 2"><i></i><i></i><i></i><i></i></div></div>
    </div>
    <p class="vcols-caption"><strong>A wide screen, <code>column_span: 1</code></strong><br />still 1 view column: <code>columns: 2</code></p>
  </div>
  <div class="vcols-screen">
    <div class="vcols-view" style="--n: 3">
      <span class="vcols-col" style="--i: 1"></span><span class="vcols-col" style="--i: 2"></span><span class="vcols-col" style="--i: 3"></span>
      <div class="vcols-section" style="--span: 2"><div class="vcols-layout" style="--c: 4"><i></i><i></i><i></i><i></i></div></div>
    </div>
    <p class="vcols-caption"><strong>A wide screen, <code>column_span: 2</code></strong><br />2 view columns: breakpoint <code>2</code>, <code>columns: 4</code></p>
  </div>
</div>

A section of `column_span: 1` stays at one view column on any screen, so it never reaches breakpoint 2; give the section a larger `column_span` for that. Four things in a dashboard are called columns:

| Columns                   | What it is                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| view columns              | The dashboard's columns, about 500 px each. What `breakpoints` count.                                      |
| a section's `column_span` | How many view columns a section asks to span (Home Assistant's).                                           |
| `grid_options.columns`    | How wide a card is in its section's grid: 12 columns per view column the section spans (Home Assistant's). |
| the layout's `columns`    | How many columns the layout arranges its own cards in.                                                     |

The top-level options apply in one view column: on a phone, or in a section with `column_span: 1`. Each entry under `breakpoints` names a number of view columns (2, 3 …) and lists only what changes once the section spans that many; wider ones inherit it. A `gap`, `padding` or `rows` left empty (`gap:`) goes back to its default.

```yaml
type: custom:layout-card-pro
columns: 2 # one view column
breakpoints:
  2: { columns: 4 } # the section spans two view columns
  3: { columns: 6, gap: 12 } # three or more
```

The lights of the house: two columns on a phone, four from two view columns. This frame is as wide as two, so it shows four.

::: live width=full

```yaml
type: custom:layout-card-pro
columns: 2
breakpoints:
  2: { columns: 4 }
cards:
  - type: custom:tile-card-pro
    entity: light.living_room
  - type: custom:tile-card-pro
    entity: light.desk_lamp
  - type: custom:tile-card-pro
    entity: light.kitchen
  - type: custom:tile-card-pro
    entity: light.dining_table
  - type: custom:tile-card-pro
    entity: light.office
  - type: custom:tile-card-pro
    entity: light.bedroom
  - type: custom:tile-card-pro
    entity: light.hallway
  - type: custom:tile-card-pro
    entity: light.garden
```

:::

Outside a section (a panel view, a stack, another layout card) the layout counts its own width in view columns of at most 500 px.

## Tracks

A list in `columns` gives each column its own width, as CSS's `grid-template-columns` does: `fr` shares what is left (`[2fr, 1fr]`), a length is fixed (`[320px, 1fr]`), and `minmax(200px, 1fr)` is at least 200 px. Columns that size to their content (`auto`) are not allowed.

Here the forecast takes two thirds from two view columns, with the doors in a column beside it; on a phone the doors go below.

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
      - type: custom:tile-card-pro
        entity: lock.front_door
      - type: custom:tile-card-pro
        entity: cover.garage_door
      - type: custom:tile-card-pro
        entity: lock.garage_side_door
      - type: custom:tile-card-pro
        entity: cover.awning
```

:::

### Rows

`rows` sets the heights of the first rows, as CSS's `grid-template-rows` does; the rest stay as tall as their cards. `auto` keeps a row as tall as its cards, `fr` gives it a share of any extra height the layout is given, and a length or `minmax()` works as for columns. `rows: [auto, 1fr]` keeps a heading at its height and gives the rest to the card below it. `align_items: start` keeps every card at its own height instead of stretching it to its row.

## Masonry

`layout: masonry` fills the columns by height, like Home Assistant's masonry view: each card goes to the shortest column, so a long card next to a short one leaves no gap. `view_layout.column` pins a card to a column. Masonry has no rows.

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
      - type: custom:tile-card-pro
        entity: sensor.living_room_temperature
        name: Living room
      - type: custom:tile-card-pro
        entity: light.living_room
      - type: custom:tile-card-pro
        entity: light.desk_lamp
      - type: custom:tile-card-pro
        entity: fan.living_room
      - type: custom:tile-card-pro
        entity: media_player.living_room_speaker
  - type: custom:layout-card-pro
    card_style: seamless
    cards:
      - type: custom:tile-card-pro
        entity: sensor.bedroom_temperature
        name: Bedroom
      - type: custom:tile-card-pro
        entity: light.bedroom
  - type: custom:layout-card-pro
    card_style: seamless
    cards:
      - type: custom:tile-card-pro
        entity: sensor.office_temperature
        name: Office
      - type: custom:tile-card-pro
        entity: light.office
```

:::

## Placing cards

Every card may carry a `view_layout`: its `span`, the `column` it starts in, its `order` and how it is aligned in its row (`align`). Each takes one value or a map by view columns, inherited by wider ones: `span: { 1: full, 2: [2, 3] }` takes the whole row on a phone, and two columns and three rows from two view columns.

Here the power flow sits above the tiles on a phone, and beside them from two view columns:

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
  - type: custom:tile-card-pro
    entity: sensor.battery_soc
  - type: custom:tile-card-pro
    entity: sensor.heat_pump_power
  - type: custom:tile-card-pro
    entity: sensor.ev_charger_power
  - type: custom:tile-card-pro
    entity: sensor.washer_power
  - type: custom:tile-card-pro
    entity: sensor.solar_power
  - type: custom:tile-card-pro
    entity: sensor.grid_power
```

:::

`order: -1` moves a card to the front without moving its YAML.

## Visibility

Every card inside keeps Home Assistant's own `visibility`. A hidden card leaves no gap, and when every card is hidden the layout hides too. To show a card only when the view has room, use Home Assistant's `view_columns` condition (`{ condition: view_columns, min: 2 }`).

## The visual editor

Home Assistant's card editor shows the layout's options and its breakpoints (a row each, opening in a view of its own: from how many view columns, and the options it changes), then a tab for each card. The selected card is edited in its own editor: a tile's or a poster's form, Home Assistant's for its own cards, YAML for the others. The buttons beside the tabs move, duplicate and delete it, and **+** adds one from the card picker. **Place in the layout** sets the selected card's span, column, order and alignment; a place that changes with the view columns stays in YAML. Try it in the [Playground](/playground).

## Reference

### Card options

Every option but `breakpoints` and `cards` may change in a breakpoint.

| Option             | Default   | Description                                                                                                                                     |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout`           | `grid`    | `grid` or `masonry` (columns filled by height).                                                                                                 |
| `columns`          | `1`       | A count (1 to 24), or a list of widths: `fr`, a length or `minmax()` (`[2fr, 1fr]`, `[320px, 1fr]`). With `min_column_width`: the most columns. |
| `min_column_width` | –         | As many columns of at least this length as fit (`180`, `12rem`); empty columns stay. Not with a list of widths.                                 |
| `rows`             | –         | Grid only: the first rows' heights (`[auto, 1fr]`): `auto`, `fr`, a length or `minmax()`; the rest are as tall as their cards.                  |
| `align_items`      | `stretch` | `stretch`, `start`, `center` or `end`: how the cards sit in their row.                                                                          |
| `gap`              | theme     | The space between cards: one length or `[row, column]`. `0` with `card_style: seamless`.                                                        |
| `padding`          | `0`       | Around the cards, inside the layout: 1, 2 or 4 values, or `{ top, right, bottom, left }`.                                                       |
| `card_style`       | `cards`   | `cards`, or `seamless`: one surface with dividers.                                                                                              |
| `breakpoints`      | –         | `{ 2: { …options }, 3: { … } }`: what changes once the section spans that many [view columns](#breakpoints) (2 to 12).                          |
| `cards`            | `[]`      | The cards, each with an optional `view_layout`.                                                                                                 |

Lengths are numbers (px) or strings with `px`, `rem`, `%` or a theme variable such as `var(--ha-space-4)`.

### view_layout

On a card inside the layout. Each option takes one value or a map by view columns (`{ 1: full, 2: 2 }`).

| Option   | Description                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------ |
| `span`   | Columns (`2`), `[columns, rows]` or `full`. A span wider than the grid shrinks to it.            |
| `column` | Grid: the column the card starts in. Masonry: the column it goes to.                             |
| `order`  | Moves the card without moving its YAML; negative values come first.                              |
| `align`  | `start`, `center`, `end` or `stretch`: how this card sits in its row, in place of `align_items`. |

### Grid and Home Assistant options

The layout takes the full width of its section and sizes its height to its cards (`rows: auto`). A fixed `rows` in `grid_options` gives it a height its grid fills. See [Sizing](/guide/sizing).

| Key            | Default | Description                                                                |
| -------------- | ------- | -------------------------------------------------------------------------- |
| `grid_options` | –       | Home Assistant's size in a sections view: `columns`, `rows`.               |
| `fill_height`  | `true`  | Fills the height the card is given; `false` keeps the layout's own height. |
| `visibility`   | –       | Home Assistant's conditions that show or hide the whole card.              |
| `view_layout`  | –       | Placement in another layout card or a custom view.                         |
| `card_mod`     | –       | Styles for the card-mod plugin.                                            |
