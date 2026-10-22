# Changelog

## 2.8.0 – Layout card and theme-aware sizing

_Beta_

- **New layout card** (`custom:layout-card-pro`): arrange any cards inside a section as a `grid` (columns, tracks, spans) or as `masonry`. Breakpoints count view columns, each card is placed through its `view_layout`, and `card_style: seamless` joins the cards into one surface. YAML only for now
- Icons are sized like Home Assistant's tile card (a 24 px icon in a 36 px circle), so Pro tiles match the built-in ones
- `icon_style: plain` draws an icon without its circle, still aligned with circled icons
- Power flow: `icon_size` on any node, including `other`
- Text follows Home Assistant's typography variables (`ha-font-size-*`, `ha-font-weight-*`, `ha-tile-info-*`), so a theme can size the cards' text
- Icons follow a theme's `ha-tile-icon-border-radius` and `tile-icon-opacity`
- Docs: recipes and a showcase for the layout card, a list of every theme variable the cards read, and a **Large text** example theme

## 2.7.1 – Safer colours, centred gauges

_2026-10-21_

- Colours and icons from configs, templates and attributes can no longer inject markup; a colour must be a plain colour token
- Grid cells and entity tiles centre a `ring` or `gauge` in the room they have
- Docs: install through HACS by searching for Pro Cards

## 2.7.0 – Sun azimuth card, cards fill their height

_2026-10-20_

- **New sun azimuth card** (`custom:sun-azimuth-card-pro`): where the sun is around your house today, as a sky `dial` or a `3d` scene with the house, its roof and its lit sides
- Every card takes the height it is given, as Home Assistant's cards do, so cards side by side line up. `fill_height: false` keeps a card at its own height
- Plots (sparklines, columns, trends, flow bands) grow into that height; tiles without a plot centre their content
- Tiles and the multi trend card size to their content (`rows: auto`)
- Power flow: rings on the grid (low-carbon share) and solar (`peak`) nodes, `idle_below`, and calmer label placement with `direction: down`

## 2.6.0 – Smoother lines

_2026-10-18_

- Sparklines and trends average the history into wider buckets, so noisy sensors draw calm lines; `smoothing_minutes` sets the bucket
- A rule `label` shows in row, column and table items and in header entities
- Power flow: `charge_from: solar` for batteries fed by their own panels
- Multi trend: `rules` colour a series by its current value

## 2.5.0 – Visibility for parts of a card

_2026-10-12_

- `visibility` on entities, sections, header items, buttons, power flow nodes and multi trend series, with Home Assistant's conditions plus `template`. Hidden parts take no room
- Power flow: `hide_consumers_below` / `hide_below` hide idle consumers without blinking
- Styles from UIX or card-mod survive a config change
- Docs: a Visibility guide

## 2.4.0 – Title actions

_2026-10-10_

- `title_tap_action` makes a card's title run an action, e.g. open the room's dashboard
- Header badges carry their icon inside the pill; dividers run edge to edge

## 2.3.1 – Centred icons

_2026-10-10_

- Icons sit exactly centred in buttons, chips and headers (they were 1–2 px low)

## 2.3.0 – Your own buttons

_2026-10-10_

- `control: buttons` with a list in `control_options`: a row of scene, script or switch buttons, each with its own action, colour, icon and label
- A literal `value: ""` is a blank value instead of unavailable

## 2.2.2 – Schemas online

_2026-10-07_

- The JSON Schemas are published with the docs site, so editor completion works with the URL the README names
- Docs: the sizing guide covers every card; fixes across the languages, weather and controls pages

## 2.2.1 – Changelog on the site

_2026-10-06_

- Docs: a changelog page
- Docs: pages no longer scroll by themselves on an iPhone

## 2.2.0 – Controls

_2026-10-06_

- Controls on the entity cards: `control: auto` picks what the domain needs (switches, sliders, steppers, covers, fans, locks, scripts, media, selects), or choose one with `control`. Placed on the line, under it or on the icon
- Optimistic values, hold to confirm, and full keyboard and screen reader support
- Docs: a Controls page; the demo home gained fans, locks, helpers and a garage door

## 2.1.0 – Stacked row items

_2026-10-04_

- Row and column items stack the value under the name and show it by default; rows spread over the width, columns sit at the start

## 2.0.0 – New card names

_2026-10-04_

- **Breaking:** every card type ends in `-pro` (e.g. `custom:entity-card-pro`), so the names no longer collide with other custom cards. Update the `type:` of every Pro Card in your dashboards
- A card whose name is already taken is skipped with a console message instead of breaking the whole bundle

## 1.7.1 – Undistorted trends

_2026-10-01_

- Multi trend and weather trends are drawn at their real height instead of being stretched
- Sun path: a header like the other cards', with an `icon` option
- Docs: three showcase dashboards and cards grouped into Entities, Energy and Weather

## 1.7.0 – Power flow card

_2026-10-01_

- **New power flow card** (`custom:power-flow-card`): solar, battery and grid feeding the home and its consumers as a tree with animated flow, a summary line and self-sufficiency

## 1.6.0 – Rain card

_2026-10-01_

- **New rain card** (`custom:rain-card`): rain rate and today's total as a tile or hero with falling drops, ripples or a filling gauge

## 1.5.2 – Wind turns smoothly

_2026-09-30_

- Wind card: the flow turns smoothly to a new direction

## 1.5.1 – Steady wind flow

_2026-09-30_

- Wind card: the flow no longer restarts when the speed or gusts change

## 1.5.0 – Wind card

_2026-09-30_

- **New wind card** (`custom:wind-card`): speed, direction and gusts as a tile or hero with an animated particle field in four styles

## 1.4.0 – Weather card

_2026-09-30_

- **New weather card** (`custom:weather-card`): a weather entity as a tile or as sections: hero, entity groups, a forecast trend and forecast rows
- Row and column values end in an ellipsis instead of overlapping

## 1.3.0 – Languages

_2026-09-30_

- The cards speak the language of your Home Assistant profile: twelve languages, editors included

## 1.2.0 – Sun path tooltip

_2026-09-30_

- Sun path: a tooltip with time and elevation, a 24 hour window around solar noon, ticks at sunrise, noon and sunset

## 1.1.0 – Illuminance band

_2026-09-30_

- Illuminance: `band` is the default `mode`; the trend plot got clearer axes and zones

## 1.0.2 – Polish and new brand

_2026-09-29_

- Row items show the name below the icon; fixes to hover rings, lane labels and card shadows
- New logo and colours; a theme picker on every docs example

## 1.0.1 – No ripple

_2026-09-29_

- Entity rows and the multi trend header no longer show Home Assistant's ripple

## 1.0.0 – Initial release

_2026-09-29_

- Entity, entity group, entity sections, multi trend, sun path and illuminance cards
