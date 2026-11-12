# Sizing in sections

Every card tells Home Assistant's sections view how large it wants to be, so it lands with a sensible size. This guide explains the grid, each card's default size, and how cards fill the height they are given.

## The grid

A section is 12 columns wide and made of rows of 56 px, with 8 px gaps. `grid_options` sets a card's size: `columns` (6 is half a section, `full` the whole width) and `rows`. The dashboard editor's layout tab and the grid handles write the same keys.

`rows: auto` makes a card as tall as its content. Most cards use it by default; a number pins the height:

```yaml
type: custom:tile-group-card-pro
title: Rooms
tiles: [light.living_room, light.desk_lamp, climate.living_room]
grid_options: { columns: 12, rows: 4 }
```

Every card also takes `visibility`, `layout_options` (the old spelling of `grid_options`), `view_layout` and `card_mod`; Home Assistant (card-mod for `card_mod`) applies them, not the card.

## Default sizes

Each card's least size (`min_columns`, `min_rows`) keeps the grid handles from making it unreadable. `grid_options` can override any of them.

| Card                     | Default            | Least                                                                                    |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------- |
| Tile                     | 6 columns, `auto`  | 3 columns, 1 row; 4 with a switch or hold button on the line, 6 with a wider control     |
| Tile with a plot         | 6 columns, `auto`  | 2 rows                                                                                   |
| Vertical tile            | its least, `auto`  | 3 columns (6 with a wide control), 2 rows; a row more each for a control, a plot, badges |
| Poster                   | 6 columns, 3 rows  | 6 columns, 3 rows                                                                        |
| Tile group               | 6 columns, `auto`  | 6 columns; `layout: row` defaults to 12                                                  |
| Heading card             | full width, `auto` | 3 columns                                                                                |
| Layout and swipe card    | full width, `auto` | –                                                                                        |
| Weather card             | 6 columns, `auto`  | 3 columns, 1 row (2 with a header)                                                       |
| Weather card, `sections` | 12 columns, `auto` | 6 columns, 2 rows                                                                        |
| Sun path card            | 12 columns, `auto` | 6 columns                                                                                |
| Sun azimuth card         | 12 columns, `auto` | 6 columns                                                                                |
| Multi trend card         | 12 columns, `auto` | 6 columns, 2 rows                                                                        |
| Power and energy flow    | 12 columns, `auto` | 6 columns, 3 rows                                                                        |

[Sizes](/cards/sizes) shows the tile's and the poster's sizes in detail.

## Spanned sections

A section with `column_span: 2` or `3` has 12 columns per visible column, and the count shrinks with the screen: 36 on a wide desktop, 24 in a narrower window, 12 on a phone.

Pick widths that divide 12, 24 and 36, so rows stay full on every screen. `columns: 12` gives one card per row on a phone, two in a narrower window, three on a desktop; `columns: 6` gives two, four and six. `columns: 9` looks right on a phone but leaves gaps on a desktop.

## Filling the height

As Home Assistant's own cards do, every card takes the height it is given: its cell's with a number of rows, and with `rows: auto` its grid row's, so cards side by side are as tall as the tallest of them. A horizontal stack works the same way. The part of a card that can stretch fills that height, so the card lines up with its neighbours:

| Card                  | What fills the height                                           |
| --------------------- | --------------------------------------------------------------- |
| Tile                  | the plot below the line; any other tile centres its content     |
| Poster                | the visual behind; the content stays at the bottom              |
| Weather card          | its trends and plots; without `sections` it centres its content |
| Multi trend card      | the plot                                                        |
| Sun path card         | the plot                                                        |
| Sun azimuth card      | the picture, centred                                            |
| Power and energy flow | the tree: spread out when taller, scaled down when smaller      |

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  visual: sparkline
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  visual: columns
  grid_options: { columns: 6, rows: 3 }
```

:::

### Keeping a card's own height

`fill_height: false` keeps a card at its own height in a taller row or a horizontal stack, with the room left under it: a short room beside a longer one, for example. A cell smaller than the card cuts it off at the bottom.

::: live

```yaml
- type: custom:tile-group-card-pro
  title: Desk
  fill_height: false
  tiles: [light.desk_lamp, sensor.living_room_temperature]
  grid_options: { columns: 6 }
- type: custom:tile-group-card-pro
  title: Living room
  tiles: [light.living_room, climate.living_room, cover.living_room_blinds, media_player.living_room_speaker]
  grid_options: { columns: 6 }
```

:::

## Inside other cards

The least sizes bind only the sections grid. A [layout card](/cards/layout-card), a [swipe card](/cards/swipe-card) or a stack may give a card less room, and the card fits into it as well as it can. In a layout card, a card's `view_layout` sets its span and place.

## Masonry and panel views

The cards work in the older views too. In a masonry view each card reports its height so Home Assistant can balance the columns; there is nothing to set, and `grid_options` does nothing there. Wherever the height follows the content, as in masonry or a vertical stack, every card keeps its own height. In a panel view the one card takes the whole view.

## The examples here

The examples on this site are drawn at the width of one section (400 px). A card with `columns: 6` takes half of that, as it would on your dashboard.
