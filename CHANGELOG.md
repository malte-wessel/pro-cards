# Changelog

## 3.1.0 – Buttons that show state, tile group rows

_Beta_

### What's new

- **Buttons that show state:** the poster's and the tile's own buttons (`control: { type: buttons }`) take a badge's keys: `name` and `show_name`, `attribute`, `value` and `show_value`, `unit`, `decimals`, `prefix`, `suffix`, and `rules` that set the icon, the colour, the text, a pulse and whether the button is filled (`active`). A room's poster can carry its lights, blinds, windows and heating in one row, and with `visibility` show only what needs attention. [Controls](https://malte-wessel.github.io/pro-cards/cards/controls#buttons-that-show-state)
- **A rule's own `attribute`:** a rule on a button, a badge, a tile or a poster can read an attribute in place of the shown value, such as a thermostat's `hvac_action` beside its temperature. [Look](https://malte-wessel.github.io/pro-cards/cards/look#rules)
- **Tile group rows:** `overflow` says what a row does with tiles that do not fit (`wrap`, `shrink` on one line, or `scroll`), `align` where its tiles sit (`stretch`, `start`, `center`, `end`, `space-between`), `columns` the most tiles on a line. [Tile group](https://malte-wessel.github.io/pro-cards/cards/tile-group-card#row)
- **Tile group lists beside the icon:** `indent: true` on a list starts what a tile draws below its line (a bar, a plot, a slider, buttons) at its name, beside the icon, so the icons keep one column and everything else lines up in the next. [Tile group](https://malte-wessel.github.io/pro-cards/cards/tile-group-card#below-the-line)
- **Tile groups without padding:** `padding: false` puts the tiles flush with the card and each other, square and without borders. [Tile group](https://malte-wessel.github.io/pro-cards/cards/tile-group-card#without-padding)

### Changed: existing cards look different

- **Buttons fill by state:** a button of your own fills while its entity is active, as Home Assistant colours it: a window or a door open, motion or smoke seen, a person home, a thermostat while it heats or cools. Before, only buttons that switch their entity filled. A sensor, a number, a scene and a script stay grey.
- **Attributes as Home Assistant writes them:** an `attribute` you name on a tile, a poster, a badge or a button shows with its unit and in Home Assistant's words ("60 %", "21.6 °C", "Heating" where it read "heating"). A number Home Assistant scales (a light's brightness as a percentage) keeps its own value, which the rules compare. A `unit` or `decimals` of your own still win.

### Deprecated, gone in 4.0

- A button's `label` is `name` with `show_name: true`, and its `action` is `tap_action`. [Moving](https://malte-wessel.github.io/pro-cards/guide/migrating#button-keys)

## 3.0.0 – Poster and tile cards, energy flow, heading and swipe cards

_2026-11-12_

Requires Home Assistant 2026.4 or newer. [Moving to 3.0](https://malte-wessel.github.io/pro-cards/guide/migrating) maps the older cards and keys to the new ones.

### New cards

- **Tile** (`custom:tile-card-pro`): one entity as a compact tile, the icon, the name and one line with its value and status, its controls at the end of the line. `vertical: true` stacks it as Home Assistant's tile does. The entity card's successor.
- **Poster** (`custom:poster-card-pro`): one entity large, drawn the way it is: a light's glow, a fan's turning blades, a thermostat warm or cool, a player's cover art, a cover's window, a robot's path, wind and rain as animated fields, the sun's day.
- **Tile group** (`custom:tile-group-card-pro`): several tiles on one card under a header, as a list, a row or a table. The entity group card's successor.
- **Heading** (`custom:heading-card-pro`): a heading without a card around it, in five styles, with a subtitle and badges.
- **Energy flow** (`custom:energy-flow-card-pro`): the power flow's tree over a day, week, month or year from the energy statistics, with a period picker or following the energy dashboard's.
- **Swipe** (`custom:swipe-card-pro`): any cards in a strip you swipe through, with a page per card or several, and breakpoints by view columns.

### What's new

- **Kinds:** a tile and a poster recognise what an entity is (a light, a thermostat, a cover, a battery, the weather, a car, an appliance and more) and bring its icon, colours, statuses, controls and visual. `kind`, `icon`, `visual` and `rules` change any part of it. [Kinds](https://malte-wessel.github.io/pro-cards/cards/kinds) · [Look](https://malte-wessel.github.io/pro-cards/cards/look)
- **Controls on the card:** switches, sliders, steppers, segments, selects, buttons and a date picker for every domain Home Assistant's tile covers. `attribute` names what a control sets, such as a light's colour temperature or a fan's direction; a light's favourite colours and a cover's favourite positions come from Home Assistant. [Controls](https://malte-wessel.github.io/pro-cards/cards/controls)
- **Badges** are written the same way on the tile, the poster, the tile group and the heading, and in the weather and flow cards' headers: an icon or picture, a name, a value, a small chart and a switch. [Badges](https://malte-wessel.github.io/pro-cards/cards/badges)
- **Visual editors** for every current card, including the layout, swipe and tile group cards, which edit their cards in tabs. Picking an entity in the card picker suggests the cards that fit it. The docs' [Playground](https://malte-wessel.github.io/pro-cards/playground) runs the editors beside the YAML.
- **Layout card:** `min_column_width` fits as many columns as there is room for; `rows` sizes the first rows.
- **`vertical_align`** on the tile and the tile group; `stretch` lets a group's tiles share a fixed height.
- **Power and energy flow:** evenly spaced columns and lanes, other units (water, heat), `flow_style: none`, a renamable Other node, badges.
- Numbers and times follow the profile's number format, 12 / 24 hour clock and time zone.

### Deprecated, gone in 4.0

- The entity, entity group, entity sections, wind, rain and illuminance cards. They still work and say so once in the browser console. Use the tile, the poster, the tile group and the layout card instead; the illuminance card has no successor.
- `header_entities` on the weather and flow cards: use `badges`.
- Multi trend card: `hours_to_show` and `smoothing_minutes` are `hours` and `smoothing`.
- A badge rule's `label` (2.9 betas) is `value`.
- Weather card: a rule's `label` is `status`, and its entity sections give way to a tile group beside it.

### Breaking

- Weather card: `hover` is on by default, as on the tile; `hover: false` turns it off.

### Fixes

Among many, a trend with its value axis no longer freezes the browser on a flat line, a lock that needs a code asks for it, buttons an entity does not support are left out, a heat / cool thermostat gets a stepper per target, and the power flow no longer counts leftover power as export without a grid.

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
