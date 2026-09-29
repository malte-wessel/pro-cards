# Sizing in sections

All cards report a default size to the sections grid through `getGridOptions`, so they land with a sensible footprint and you can resize them with the grid handles or `grid_options`.

| Card                                                        | Default                  | Notes                                                                   |
| ----------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------- |
| Entity card                                                 | 6 columns × 1 row        | Visuals gauge, bar, sparkline, columns and strip switch to `rows: auto` |
| Entity group card, `list` / `grid`                          | 12 columns, `rows: auto` | Height follows the number of entities                                   |
| Entity group card, `hero`                                   | 12 columns, `rows: auto` |                                                                         |
| Entity group card `row` / `column` / `table`, sections card | 12 columns, `rows: auto` | Height follows the sections                                             |
| Multi trend card                                            | 12 columns × 3 rows      | Lanes layout: 2 rows + one row per entity                               |
| Sun path card                                               | 12 columns, `rows: auto` |                                                                         |
| Illuminance card                                            | 12 columns, `rows: auto` |                                                                         |

Each card also reports minimum sizes (`min_columns`, `min_rows`) so the grid handles cannot make it unreadable: 3 columns for the entity card, 6 for everything else; an entity card with an icon is pinned to one row (`max_rows: 1`). `grid_options` can override any of these.

Besides `grid_options`, every card accepts the Home Assistant keys `visibility`, `layout_options`, `view_layout` and `card_mod`. The cards ignore them; Home Assistant applies them.

## Columns in spanned sections

A section has 12 columns. A section with `column_span: 2` or `3` gets 12 columns **per visible column**, and that number shrinks with the viewport: 36 on a wide desktop, 24 in a narrower window, 12 on a phone.

Pick column counts that divide 12, 24 and 36 so rows stay full on every screen:

- `columns: 12` → 1 tile per row on a phone, 2 on a two-column window, 3 on a wide desktop
- `columns: 6` → 2 / 4 / 6 per row

`columns: 9` looks right on a phone (75 %) but leaves a gap on desktops (37.5 % of a 24-column row). Avoid it.

## Rows

`rows: auto` lets the card size itself to its content. Numbers pin the height: 56 px per row plus 8 px gaps. A tile with an icon fits one row; a tile with a bar or sparkline needs `auto`. The cards set this for you, override only when the layout needs it:

```yaml
type: custom:entity-group-card
title: Rooms
entities: ["..."]
grid_options: { columns: 12, rows: 4 }
```

## Width of the examples here

The examples on this site are rendered at the width of a single Home Assistant section column (400 px). Tiles with `grid_options.columns: 6` are shown at half that, the same proportion they have in a dashboard.
