# Changelog

## 2.9.0 – Energy flow, heading and swipe cards

_Beta_

- **New energy flow card** (`custom:energy-flow-card-pro`): the power flow card's tree over a period (`period: today | yesterday | week | month | year`), from energy meters and their long-term statistics, live between compiled hours. The flows split the way the Energy dashboard splits them, hour by hour (day by day for longer periods); the dots move by each link's share of the home, thresholds and rules read kWh. A picker in the header steps to another day, week, month or year (‹ ›) or opens a calendar like Home Assistant's date picker (quick picks, and any range of days in two clicks), and goes back to the configured `period` after ten minutes untouched; `period_picker: false` keeps a fixed period. Also for heat: a heat pump's heat meter and the floors' meters show where the heat went
- **New heading card** (`custom:heading-card-pro`): a heading without a card around it, as Home Assistant's own, in five styles (`section`, `title`, `subtitle`, `big`, `hero`) with a subtitle and an icon (templates allowed; `icon_tap_action` gives the icon its own action). Its `badges` are entities with rules, actions and visibility, as pills (`outline`, `soft`, `filled`, `plain`) in three sizes. They sit at the end of the line (below it on a narrow card), right after the title or on a line of their own, wrap or scroll
- **New swipe card** (`custom:swipe-card-pro`): any cards side by side in a strip you swipe through, snapping to each card (`snap: start | center | free`). `per_page` says how many fit across, a fraction lets the next one peek in (1.15 by default); dots below show the page and jump to it. `unfold: 4` shows a grid of four instead of the strip, and like the layout card's, every option can change at `breakpoints` by view columns (`2: { per_page: 2.2 }`, `3: { unfold: 4 }`). The cards keep their own `visibility`. YAML only for now
- Entity card: `layout: poster` draws the entity as a poster: the icon at the top left, the matching rule's label as a pill at the top right, and at the bottom the name in small capitals and the value, large. Controls sit on the value's line or along the bottom, and a `sparkline` or `columns` plot fills the room below the value out to the card's edges. `badges` adds pills under the label, with the keys of header entities. Three rows high by default, its content at the bottom. In the group and sections cards, `layout: poster` makes the first entity the poster and the rest its badges. The wind and rain cards take `layout: poster` too: the animated lead, the label's pill, the speed or rate large, the direction and gusts or today's total below it; with `visual: flow` the whole poster is the animated field. The sun path card too: the next sunrise or sunset large, how soon it comes in the pill and the day's curve along the bottom; and the weather card: the condition in the pill, the temperature large with today's high and low, and the next 12 hours of the hourly forecast as the curve; and the multi trend card (`layout: poster`): the first value large and the lines overlaid along the bottom
- Layout card: `rows` sets the first rows' heights like `columns` sets the columns' (`[auto, 1fr]`: a heading row at its height and a row that takes the rest), so rooms of a heading and a card line up in a swipe card with `height: equal`
- Header badges (the heading card's, and `header_entities` on every card with a header) draw more than a value: `visual: ring`, `bar`, `sparkline`, `trend` (the change over `trend_hours`), `count` (how many of a group's members are on) and `dot`; `control: toggle` puts a switch into a badge. A badge takes `style` and `size`, `format: power | duration | relative` (W / kW / MW, `1h 12m`, `in 38 minutes`) and `stale_after` (grey with its age); a rule can change its `style` and make it `pulse`. Existing headers keep their look: there the badges are plain and small unless they say otherwise
- Energy flow: `period: dashboard` follows the period of Home Assistant's energy date picker on the dashboard, as Home Assistant's own energy cards do (`collection_key` for another picker); the card then has no picker of its own
- `hover: true` on an entity (or on the card or a section, for all of its entities) shows Home Assistant's hover and press layers on what a click runs (a tile, a grid cell, a header entity, an icon with its own action, every control), as on its tile card
- A tile is clickable as a whole, as on Home Assistant's tile card: its padding runs the action too, also when the tile is taller than its content
- Energy flow: the period picker's buttons answer the pointer as Home Assistant's control buttons do (a light layer on hover, a stronger one while pressed)
- Power flow: `other: { name, icon }` renames the Other node
- Power and energy flow: `flow_style: none` draws the active links in their colour without motion
- Power and energy flow: a tree whose sensors report another unit (a water flow in L/min, water meters in m³) shows its values in that unit as written instead of W or kWh
- Power and energy flow: a tree without a grid source (a heat flow) no longer claims to be 100 % self-sufficient
- Power and energy flow: sources and consumers are evenly spaced (one distance between every two centres in a column, rooms centred on their devices), and the lines from the sources turn into the home in one mirrored block, every corner alike
- Power and energy flow: a battery's or grid's two values sit in one line where there is room for it, stacked where there is not
- Power and energy flow: the lines out of the home and out of each room take their own lanes, the mirror of the lines into the home: each leaves the circle on its own lane, centred on the node, and they turn in one block, every corner alike. Many lines move closer, down to a 2 px gap; more than that fit share one line as before. The consumer column centres on the home, so the one level with it runs straight (a card with rooms can grow a few px for it), and on a narrow card the home moves left for the lanes, a source label beside it keeping its value and having its name cut
- Power and energy flow: on a narrow card with rooms, the rooms' labels stay clear of the home's line: the home moves left (a source label beside it keeps its value and has its name cut), a device's name is cut where a room's label needs its place, and where even the devices' values would not fit beside the rooms' labels, the devices' labels go below them
- Fix: energy flow: the period picker no longer makes the header taller, so a power and an energy flow card side by side start their trees at the same height
- Fix: power and energy flow: the home sits level with the source nearest its height, so that source's line runs straight in instead of taking a small step that looked like a crack, and every line into the home meets its circle

## 2.8.0 – Layout card and theme-aware sizing

_2026-10-25_

- **New layout card** (`custom:layout-card-pro`): arrange any cards inside a section as a `grid` (columns, tracks, spans) or as `masonry`. Breakpoints count view columns, each card is placed through its `view_layout`, and `card_style: seamless` joins the cards into one surface, painted once (a translucent theme colour does not stack). YAML only for now
- Icons are sized like Home Assistant's tile card (a 24 px icon in a 36 px circle), so Pro tiles match the built-in ones
- `icon_style: plain` draws an icon without its circle, still aligned with circled icons
- `show_entity_picture: true` shows an entity's picture (a person's photo, a cover, a snapshot) in place of its icon, as on Home Assistant's tile card
- Entity cards no longer show the history window (`12 h`) in the header; a strip still labels its own axis
- Power flow: `icon_size` on any node, including `other`
- Power flow: a solar-fed battery given as a `charge` / `discharge` pair shows both values while it charges and discharges at once (`252 W ↓` over `221 W ↑`) instead of the net value; its label keeps a line for the second value, so such a card is one line taller
- Power flow: `charge_from` takes the entity of a solar source (or a list of them), so a battery is charged only by its own panels and the other arrays get no link to it
- Power flow: `both_ways: true` on a grid's `import` / `export` pair, for a meter that does not net its phases: the grid imports and exports at once and its node shows both values
- Text follows Home Assistant's typography variables (`ha-font-size-*`, `ha-font-weight-*`, `ha-tile-info-*`), so a theme can size the cards' text
- Icons follow a theme's `ha-tile-icon-border-radius` and `tile-icon-opacity`
- Docs: recipes and a showcase for the layout card, a list of every theme variable the cards read, and a **Large text** example theme
- Fix: a card whose entities change while its history loads no longer shows the old history (or "No data") until the next refresh, and a failed history request is retried once a minute instead of on every update
- Fix: power flow links follow their labels when a value changes width (`980 W` → `1.02 kW`): the lines no longer stay behind, and the dots keep running instead of restarting on narrow cards
- Fix: power flow: an idle (dashed) link no longer covers an active line it shares a stretch with, such as an idle battery → grid track over solar exporting to the grid
- Fix: weather forecast days keep their day icon after sunset; forecast hours take the night icon when the sun is down at that hour
- Fix: the rain card animates in/h, mm/d and in/d rates and in or cm totals by their real amount (an in/h sensor counted as nearly dry)
- Fix: history axes keep their ticks on the hour and the days on midnight across a daylight saving change
- Faster updates: an entity card redraws only the rows a state change touches, weather forecasts and charts only when the forecast changes, and numbers and times are formatted without rebuilding a formatter each time
- Wind and rain: off-screen bands stop animating, the wind lead moves without layout work, and a sensor hovering at a threshold no longer rebuilds the field over and over
- Fix: a row tapped by a pointer released over it after a cancelled press (a scroll) no longer runs its action
- Fix: a value from a template shows blank until Home Assistant answers, not "Unavailable"
- Fix: weather: a refused forecast is asked for again a minute later; days stamped at a UTC midnight show under their own date; the condition takes its night icon at sunset with any icon set, and an icon set like `phu:` shows on the tile and hero too
- Fix: the rain card's lead follows the rate again after a dry spell
- Fix: the wind card animates a Beaufort force by the speed it stands for
- Fix: illuminance: `min_lx` below 0.1 sets the bottom of the scale, and a `min_lx` that is not below `max_lx` is a config error
- Fix: power flow: a grid running on its generator counts in the home ring as generator power only
- Fix: sun azimuth: the sun's dot and beam agree with the text around sunrise and sunset
- Fix: colours given as `#rgba` or `#rrggbbaa` blend correctly; `true` and blank values no longer count as numbers

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
