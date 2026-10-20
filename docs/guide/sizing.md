# Sizing in sections

All cards report a default size to the sections grid through `getGridOptions`, so they land with a sensible footprint and you can resize them with the grid handles or `grid_options`.

| Card                                         | Default                  | Minimum           | Notes                                                                                             |
| -------------------------------------------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| Entity card, plain tile                      | 6 columns, `rows: auto`  | 3 columns, 1 row  | Exactly one row on its own                                                                        |
| Entity card with a block visual or a control | 6 columns, `rows: auto`  | 3 / 4 / 6         | Block visuals: gauge, bar, sparkline, columns, strip; 2 rows at least with a sparkline or columns |
| Entity group card, every layout but `hero`   | 12 columns, `rows: auto` | 6 columns, 2 rows | Height follows the number of entities                                                             |
| Entity group card, `hero`                    | 12 columns, `rows: auto` | 6 columns, 3 rows |                                                                                                   |
| Entity sections card                         | 12 columns, `rows: auto` | 6 columns, 2 rows | 3 rows when a section is a `hero`; height follows the sections                                    |
| Multi trend card                             | 12 columns × 3 rows      | 6 columns, 2 rows | Lanes layout: 2 rows + one row per entity                                                         |
| Sun path card                                | 12 columns, `rows: auto` | 6 columns         |                                                                                                   |
| Sun azimuth card                             | 12 columns, `rows: auto` | 6 columns         | Height follows the view and the sides footer                                                      |
| Illuminance card                             | 12 columns, `rows: auto` | 6 columns         |                                                                                                   |
| Weather card, tile                           | 6 columns, `rows: auto`  | 3 columns, 1 row  | Exactly one row on its own, 2 with a header                                                       |
| Weather card with `sections`                 | 12 columns, `rows: auto` | 6 columns, 2 rows |                                                                                                   |
| Wind and rain card, tile                     | 6 columns, `rows: auto`  | 3 columns, 1 row  | Exactly one row on its own, 2 with a header                                                       |
| Wind and rain card, `layout: hero`           | 12 columns, `rows: auto` | 6 columns, 3 rows |                                                                                                   |
| Power flow card                              | 12 columns, `rows: auto` | 6 columns, 3 rows | Height follows the config, not the width                                                          |

The minimums (`min_columns`, `min_rows`) keep the grid handles from making a card unreadable; `grid_options` can override any of them. A tile with a control needs more room than a plain one: 4 columns for a switch or a hold button on its line, 6 for anything wider, 3 when the control sits under the line. Every tile sizes to its content: a plain tile is exactly one 56 px row on its own (two with a header), a block visual or a control makes it taller.

Besides `grid_options`, every card accepts the Home Assistant keys `visibility`, `layout_options` (the older spelling of `grid_options`), `view_layout` and `card_mod`. The cards do not read them; Home Assistant applies them.

## Columns in spanned sections

A section has 12 columns. A section with `column_span: 2` or `3` gets 12 columns **per visible column**, and that number shrinks with the viewport: 36 on a wide desktop, 24 in a narrower window, 12 on a phone.

Pick column counts that divide 12, 24 and 36 so rows stay full on every screen:

- `columns: 12` → 1 tile per row on a phone, 2 on a two-column window, 3 on a wide desktop
- `columns: 6` → 2 / 4 / 6 per row

`columns: 9` looks right on a phone (75 %) but leaves a gap on desktops (37.5 % of a 24-column row). Avoid it.

## Rows

`rows: auto` lets the card size itself to its content. Numbers pin the height: 56 px per row plus 8 px gaps. The cards set this for you, override only when the layout needs it:

```yaml
type: custom:entity-group-card-pro
title: Rooms
entities: ["..."]
grid_options: { columns: 12, rows: 4 }
```

### Filling the height

Like Home Assistant's own cards, every card takes the height it is given. That is the height of its cell with a number of rows, and with `rows: auto` the height of its grid row: the cards side by side in a row are all as tall as the tallest of them. A horizontal stack works the same way. The part of a card that can stretch fills that height: a plot grows into the room the rest of the card leaves and is drawn at that height, so the card lines up with its neighbours, a core sensor card among them. In a smaller cell the plot shrinks, down to a floor.

::: live

```yaml
- type: custom:entity-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  grid_options: { columns: 6, rows: 3 }
- type: custom:entity-card-pro
  entity: sensor.outdoor_temperature
  name: Outside
  visual: columns
  grid_options: { columns: 6, rows: 3 }
```

:::

| Card                                  | What fills the height                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Entity card, tiles                    | The `sparkline` or `columns` plot; any other tile centres its content                          |
| Entity group and entity sections card | The `sparkline` and `columns` plots, an even share each; without them the rows stay at the top |
| Weather card                          | The trends and the plots of its entity sections; the tile centres its content                  |
| Wind and rain card                    | The hero's band (`flow.height` is its height everywhere else); the tile centres its content    |
| Multi trend card                      | The plot                                                                                       |
| Sun path card                         | The plot                                                                                       |
| Sun azimuth card                      | The picture, centred                                                                           |
| Illuminance card                      | The trend (`mode: trend`); the arc and the band keep their size, centred                       |
| Power flow card                       | The tree: spread out in a taller cell, scaled down as a whole in a smaller one                 |

Wherever the height follows the content (a masonry view, a vertical stack, a card alone in its row), every card keeps its own height. In a panel view the card takes the whole view.

## Masonry and panel views

The sections grid is where the cards are at home, but they work in the older view types too. In a masonry view every card reports its height through `getCardSize` instead, so Home Assistant can balance the columns: a plain tile counts as one unit, a card with a header one more, and the group, sections, weather, power flow, wind and rain cards add up what they actually draw. There is nothing to configure, and `grid_options` has no effect there — a masonry card always fills its column, so use `columns` (the card's own key) and the layouts to shape it. In a panel view the single card takes the whole view.

## Width of the examples here

The examples on this site are rendered at the width of a single Home Assistant section column (400 px). Tiles with `grid_options.columns: 6` are shown at half that, the same proportion they have in a dashboard.
