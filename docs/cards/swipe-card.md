# Swipe Card Pro

`custom:swipe-card-pro` puts cards side by side in a strip you swipe through. The strip snaps to each card, the next card peeks in so it is clear there is more, and dots below show the page. Once the section is wide enough the cards can unfold into a plain grid, and like the layout card's, every option can change at breakpoints. Any card works inside: Pro Cards and Home Assistant's own. The cards keep their own `visibility`. YAML only for now.

## When to use it

- **More cards than a phone has room for, one kind of thing each:** the rooms, the cameras, the members of the household. Swiping keeps them on one line instead of a long column.
- **A row that should stay a row on a phone:** a section's twelfths put four tiles in a row on a desktop and stack them on a phone. In a swipe card they stay side by side and you swipe to the rest.

To arrange cards in columns that change with the width, use the [layout card](/cards/layout-card); to show one card or another by the screen size, use Home Assistant's `screen` condition.

## Basic

`per_page: 1.15` is the default: one card and the start of the next. Swipe, scroll sideways with a trackpad, or tap a dot.

::: live width=400

```yaml
type: custom:swipe-card-pro
cards:
  - type: custom:entity-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.kitchen_temperature
    name: Kitchen
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.bedroom_temperature
    name: Bedroom
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.office_temperature
    name: Office
    visual: sparkline
```

:::

## Cards per page

`per_page` is how many cards fit across the strip, from 1 to 12. A whole number shows exactly that many; a fraction lets the next card peek in. Small tiles fit two and a half. There is a dot for every place the strip stops at, so the last cards of a page share the last dot. A strip whose cards all fit on one page shows no dots, and fewer cards than `per_page` fill the strip.

::: live width=400

```yaml
type: custom:swipe-card-pro
per_page: 2.5
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
    entity: light.bedroom
  - type: custom:entity-card-pro
    entity: light.hallway
```

:::

## Snap

`snap` says where a card stops: `start` (the default) lines it up with the start of the strip, `center` puts the current card in the middle with the cards on both sides peeking in, `free` scrolls without stopping at any card.

::: live width=400

```yaml
type: custom:swipe-card-pro
per_page: 1.3
snap: center
cards:
  - type: custom:entity-card-pro
    entity: light.living_room
  - type: custom:entity-card-pro
    entity: light.kitchen
  - type: custom:entity-card-pro
    entity: light.bedroom
  - type: custom:entity-card-pro
    entity: light.hallway
```

:::

## Unfold

`unfold` shows the cards as a plain grid of that many columns instead of the strip: no swiping, no dots. On its own it makes little sense; it belongs in a breakpoint, so a phone swipes and a wider section shows every card.

## Breakpoints

The swipe card's breakpoints are the [layout card's](/cards/layout-card#breakpoints): view columns, the unit Home Assistant's sections view places sections in. The top-level options apply in one view column, on a phone or in a section with `column_span: 1`. Each breakpoint under `breakpoints` names a number of view columns (2, 3 …) and lists only what changes once the card's section spans that many, inherited by every wider one. Every option can change there.

```yaml
type: custom:swipe-card-pro
per_page: 1.15 # one view column
breakpoints:
  2: { per_page: 2.2 } # the section spans two view columns
  3: { unfold: 4 } # three or more: a grid of four
```

`unfold: false` in a wider breakpoint goes back to the strip. Outside a section (a panel view, a stack, a layout card) the card counts its own width in the sections view's columns, 500 px at most each, as the layout card does.

The same card in a narrow frame and in one as wide as two view columns, where it unfolds:

::: live width=400

```yaml
type: custom:swipe-card-pro
breakpoints:
  2: { unfold: 4 }
cards:
  - type: custom:entity-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.kitchen_temperature
    name: Kitchen
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.bedroom_temperature
    name: Bedroom
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.office_temperature
    name: Office
    visual: sparkline
```

:::

::: live width=full

```yaml
type: custom:swipe-card-pro
breakpoints:
  2: { unfold: 4 }
cards:
  - type: custom:entity-card-pro
    entity: sensor.living_room_temperature
    name: Living room
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.kitchen_temperature
    name: Kitchen
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.bedroom_temperature
    name: Bedroom
    visual: sparkline
  - type: custom:entity-card-pro
    entity: sensor.office_temperature
    name: Office
    visual: sparkline
```

:::

## Rooms of equal height

A slide can be a [layout card](/cards/layout-card) of its own: here each room is a heading over its lights. With `height: equal` every slide is as tall as the tallest, and the layout card's `rows: [auto, 1fr]` gives that height to the lights, so the headings stay at their own height and line up.

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
      - type: custom:entity-group-card-pro
        entities:
          - light.living_room
          - light.dining_table
          - cover.living_room_blinds
          - media_player.living_room_tv
  - type: custom:layout-card-pro
    rows: [auto, 1fr]
    cards:
      - type: custom:heading-card-pro
        title: Kitchen
        icon: mdi:stove
      - type: custom:entity-group-card-pro
        entities:
          - light.kitchen
          - media_player.kitchen_speaker
  - type: custom:layout-card-pro
    rows: [auto, 1fr]
    cards:
      - type: custom:heading-card-pro
        title: Bedroom
        icon: mdi:bed
      - type: custom:entity-group-card-pro
        entities:
          - light.bedroom
          - cover.bedroom_blinds
```

:::

## Spacing and height

`gap` is the space between the cards (the theme's section gap by default). `padding` is the space around them; its left and right are an inset at both ends of the strip, where a card also stops. `height: equal` (the default) makes every card as tall as the tallest; `height: auto` lets each keep its own height.

## Visibility

Every card inside keeps Home Assistant's own `visibility`. A hidden card leaves the strip and takes its dot with it. When every card is hidden the swipe card hides too.

## Swiping and controls

A slider, a plot you scrub and similar controls take a sideways drag for themselves: swipe beside them, on the card's name or icon, or tap a dot. The strip can be focused with the keyboard, and the arrow keys scroll it.

## Sizing

In a section the swipe card takes the full width of the section and sizes to its cards (`rows: auto`). Its `getCardSize` is the tallest card's; unfolded, the tallest card of each row. See [Sizing](/guide/sizing).

## Reference

### Card options

Every option but `breakpoints` and `cards` may change in a breakpoint.

| Option        | Default | Description                                                                                                              |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `per_page`    | `1.15`  | How many cards fit across the strip, 1 to 12; a fraction lets the next card peek in.                                     |
| `gap`         | theme   | The space between the cards.                                                                                             |
| `padding`     | `0`     | Around the cards: 1, 2 or 4 values, or `{ top, right, bottom, left }`. Left and right are the inset of the strip.        |
| `snap`        | `start` | `start`, `center` or `free`.                                                                                             |
| `height`      | `equal` | `equal` (every card as tall as the tallest) or `auto`.                                                                   |
| `indicator`   | `dots`  | `dots` or `none`.                                                                                                        |
| `unfold`      | –       | A grid of this many columns (1 to 12) instead of the strip; `false` goes back to the strip in a breakpoint.              |
| `breakpoints` | –       | `{ 2: { …options }, 3: { … } }`: the options that change once the section spans that many view columns. The base is one. |
| `cards`       | `[]`    | The cards.                                                                                                               |
