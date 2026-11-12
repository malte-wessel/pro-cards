# Swipe

`custom:swipe-card-pro` puts cards side by side in a strip you swipe through. Use it for more cards of one sort than a phone has room for (the rooms, the cameras, the people at home), or for a row that should stay a row on a phone. Where the section is wider, the cards can unfold into a plain grid.

The strip snaps to each card, the next card peeks in, and dots below show where you are. Any card works inside, Home Assistant's own too, and each keeps its own `visibility`. To rearrange cards in columns by the width, use the [layout card](/cards/layout-card).

## A strip of cards

By default one card fills the strip and the start of the next peeks in. Swipe, scroll sideways with a trackpad, or tap a dot.

::: live width=400

```yaml
type: custom:swipe-card-pro
cards:
  - type: custom:tile-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:tile-card-pro
    entity: sensor.kitchen_temperature
    name: Kitchen
    visual: sparkline
  - type: custom:tile-card-pro
    entity: sensor.bedroom_temperature
    name: Bedroom
    visual: sparkline
  - type: custom:tile-card-pro
    entity: sensor.office_temperature
    name: Office
    visual: sparkline
```

:::

A slider or a plot takes a sideways drag for itself: swipe beside it, or tap a dot. With the keyboard, focus the strip and use the arrow keys.

## Cards per page

`per_page` is how many cards fit across the strip, from 1 to 12. A whole number shows exactly that many; a fraction lets the next card peek in. When every card fits on one page, there are no dots.

`snap` says where a card stops: `start` lines it up with the start of the strip, `center` puts it in the middle with its neighbours peeking in on both sides, and `free` scrolls without stopping.

::: live width=400

```yaml
type: custom:swipe-card-pro
per_page: 2.5
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
    entity: light.bedroom
  - type: custom:tile-card-pro
    entity: light.hallway
```

:::

## Rooms of equal height

With `height: equal`, the default, every card is as tall as the tallest; `height: auto` lets each keep its own. Here each slide is a [layout card](/cards/layout-card) with a heading over a tile group, and `rows: [auto, 1fr]` gives the extra height to the tiles, so the headings line up.

::: live width=400

```yaml
type: custom:swipe-card-pro
cards:
  - type: custom:layout-card-pro
    rows: [auto, 1fr]
    cards:
      - type: custom:heading-card-pro
        title: Living room
        icon: mdi:sofa
      - type: custom:tile-group-card-pro
        tiles:
          - light.living_room
          - light.desk_lamp
          - cover.living_room_blinds
          - media_player.living_room_speaker
  - type: custom:layout-card-pro
    rows: [auto, 1fr]
    cards:
      - type: custom:heading-card-pro
        title: Kitchen
        icon: mdi:stove
      - type: custom:tile-group-card-pro
        tiles:
          - light.kitchen
          - media_player.kitchen_speaker
  - type: custom:layout-card-pro
    rows: [auto, 1fr]
    cards:
      - type: custom:heading-card-pro
        title: Bedroom
        icon: mdi:bed
      - type: custom:tile-group-card-pro
        tiles:
          - light.bedroom
          - cover.bedroom_blinds
```

:::

## Breakpoints

The swipe card takes the [layout card's breakpoints](/cards/layout-card#breakpoints): the top-level options apply in one view column, and each entry under `breakpoints` lists what changes once the section spans that many view columns. Every option can change there.

`unfold` shows the cards as a grid of that many columns instead of the strip, with no swiping and no dots. It belongs in a breakpoint: a phone swipes, a wider section shows every card. `unfold: false` in a wider breakpoint goes back to the strip.

```yaml
type: custom:swipe-card-pro
per_page: 1.15 # one view column
breakpoints:
  2: { per_page: 2.2 } # the section spans two view columns
  3: { unfold: 4 } # three or more: a grid of four
```

The first example again with `unfold: 4` from two view columns, in a frame as wide as two:

::: live width=full

```yaml
type: custom:swipe-card-pro
breakpoints:
  2: { unfold: 4 }
cards:
  - type: custom:tile-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:tile-card-pro
    entity: sensor.kitchen_temperature
    name: Kitchen
    visual: sparkline
  - type: custom:tile-card-pro
    entity: sensor.bedroom_temperature
    name: Bedroom
    visual: sparkline
  - type: custom:tile-card-pro
    entity: sensor.office_temperature
    name: Office
    visual: sparkline
```

:::

## Visibility

Every card inside keeps Home Assistant's own `visibility`. A hidden card leaves the strip and takes its dot with it, and when every card is hidden the swipe card hides too.

## The visual editor

Home Assistant's card editor shows the swipe card's options and its breakpoints (each opens in a view of its own: from how many view columns, and what changes), then a tab for each card. The selected card is edited in its own editor: a tile's or a poster's form, Home Assistant's for its own cards, YAML for the others. The buttons beside the tabs move, duplicate and delete it, and **+** adds one from the card picker. Try it in the [Playground](/playground).

## Reference

### Card options

Every option but `breakpoints` and `cards` may change in a breakpoint.

| Option        | Default | Description                                                                                            |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `per_page`    | `1.15`  | How many cards fit across the strip, 1 to 12; a fraction lets the next card peek in.                   |
| `snap`        | `start` | Where a card stops: `start`, `center` or `free`.                                                       |
| `height`      | `equal` | `equal` (every card as tall as the tallest) or `auto` (each its own height).                           |
| `indicator`   | `dots`  | `dots` below the strip, or `none`.                                                                     |
| `unfold`      | –       | A grid of this many columns (1 to 12) instead of the strip; `false` goes back to the strip.            |
| `gap`         | theme   | The space between the cards.                                                                           |
| `padding`     | `0`     | Around the cards: 1, 2 or 4 values, or `{ top, right, bottom, left }`. Left and right inset the strip. |
| `breakpoints` | –       | `{ 2: { …options }, 3: { … } }`: what changes once the section spans that many view columns (2 to 12). |
| `cards`       | `[]`    | The cards.                                                                                             |

### Grid and Home Assistant options

The swipe card takes the full width of its section and sizes its height to its cards (`rows: auto`). See [Sizing](/guide/sizing).

| Key            | Default | Description                                                                    |
| -------------- | ------- | ------------------------------------------------------------------------------ |
| `grid_options` | –       | Home Assistant's size in a sections view: `columns`, `rows`.                   |
| `fill_height`  | `true`  | Fills the height the card is given; `false` keeps the swipe card's own height. |
| `visibility`   | –       | Home Assistant's conditions that show or hide the whole card.                  |
| `view_layout`  | –       | Placement in a [layout card](/cards/layout-card) or a custom view.             |
| `card_mod`     | –       | Styles for the card-mod plugin.                                                |
