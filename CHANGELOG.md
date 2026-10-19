# Changelog

## 2.7.0 (beta)

- Power flow: the grid and solar nodes get a ring like the battery's when there is something to show. A grid with `fossil` / `non_fossil` draws its low-carbon share; a solar source with the new `peak` (W) draws its production against the panels' peak power. Without that data the node stays a plain circle
- Power flow: `idle_below` sets the watts below which a link is idle (default 20, as before). `idle_below: 1` lets a 3 W standby load flow instead of drawing a dashed track; the node colours and the summary line follow the same threshold
- Power flow: labels keep their places with `idle_links: hidden`. A hidden idle link used to free the room beside it, so a label moved whenever its link switched on or off (sources and consumers jumped between two places as the values changed). The labels now keep clear of every link, hidden or not
- Power flow: with `direction: down`, the sources' labels share one line, so the values read across: right of the icons when every name fits there, otherwise below them, beside each source's line, a name that still does not fit cut with an ellipsis (values are never cut). The choice depends on the names only, so a changing value never moves the labels. They used to go wherever there was room, in two rows when the card was narrow
- Power flow: with `direction: down`, the labels of a narrow consumer row stay below their nodes instead of alternating above and below. A long name ends in an ellipsis where it would meet its neighbour's label and may take the room a shorter neighbour leaves; the values are never cut, and only when not even they fit side by side does a label move above
- Power flow: with `direction: down`, a consumer whose label has a `secondary` line keeps its label below its node. The tree left room for two lines only, so such a label went above; the tree is now as tall as its tallest consumer label needs

## 2.6.0 (2026-10-18)

- New sun azimuth card (`custom:sun-azimuth-card-pro`): where the sun is around the house today, computed from the Home Assistant coordinates like the sun path card. Two views: `dial` (the sky seen from above: horizon ring, today's path, the house in the middle with its lit sides) and `3d` (a see-through sky dome over a small gabled house, lit by the sun, with its shadow, the sun's daily circle, a pole at the house, the elevation and the azimuth as angles with chips, the dome filling the width of a narrow card; `camera` orbits the scene and `camera_slider` puts a slider under the plot to do it by hand, the same slider as the entity cards' controls). `house.front` is the bearing the front faces, `house.roof` gives the house a `gable`, `gable_front`, `hip` or `flat` roof, `house.sides` names the front, right, back and left sides or sets a wall shared with the neighbour to `false` (unnamed sides are called by where they face); the sides footer (`show_sides: true`) lists each side's sun window today on a timeline with a pill for its state (hover or tap a timeline and the plot shows the sun at that time; `hover_preview: false` turns that off), and the dial and 3D views carry a line naming the sides in the sun and what comes next (`show_house`) and, with `show_events: true`, the sunrise / noon / sunset row. The events row and the sides footer are off by default. With `rows` in `grid_options` the card takes that height and the plot shrinks to fit. Colours: `sun_color`, `night_color`, `sky_color`. Words in every language the cards speak
- The solar maths moved to `src/shared/solar.ts` and gained the azimuth (no change for users)
- The controls' slider moved to `src/shared/slider.ts` so every card can draw it (no change for users)
- Sparklines, the lines of the multi trend card and the illuminance trend are calmer: the history is averaged to one point per 12 px of width (it was one per 2 px), so sensor noise no longer draws a jagged line and a sensor that flickers between two readings draws a smooth wave instead of a zigzag. A smoothed line runs through bucket means from edge to edge (the tooltip shows the mean). `smoothing_minutes` on the entity cards, the multi trend card and the illuminance card sets the averaging bucket in minutes instead; the multi trend and illuminance editors have a field for it. The illuminance trend averages on its log scale, so a bright moment does not lift a dim bucket
- A rule `label` shows in row, column and table items and in `header_entities` without `visual: badge`: it stands in for the value, in the rule's colour, as the badge pill does there (a window item reads Closed instead of off). The value stays in the item's tooltip. Items used to show the label only in the tooltip, so a row needed badges on every entity to read as words
- Power flow: `charge_from: solar` on a battery whose panels feed it (a plug-in battery, a DC-coupled hybrid): solar charges it before it covers the home, so the card no longer draws grid power into a battery the grid cannot reach as long as the sensors agree. Given as a `charge` / `discharge` pair, such a battery charges from its panels and feeds the home at once, as the unit does; a battery never charges itself
- `rules` on the series of the multi trend card: the first rule the current value matches (`below`, `above`, `state`) colours the line, its legend swatch and its tooltip swatch, as on the entity cards. A series' `color` may be a template and wins over the rules

## 2.5.0 (2026-10-12)

- `visibility` on the parts of a card: entities, header entities, sections and custom buttons of the entity cards, every section of the weather card, sources, consumers, rooms and devices of the power flow card, and the series of the multi trend card. A part is drawn only while its conditions hold. The conditions are Home Assistant's (`state`, `numeric_state`, `screen`, `user`, `location`, `time`, `and`, `or`, `not`) plus `template`; a state condition without `entity` reads the part's own. The card's own `visibility` stays Home Assistant's
- A hidden part takes no room: the first shown entity leads a hero, dividers stay between shown sections, a section or room whose entities are all hidden goes with them, a hidden row never tints the card, and a card with nothing left shows nothing (its grid cell stays; the card's own `visibility` removes it)
- Power flow: `hide_consumers_below` hides consumers that draw less than that many watts and shows them again only clearly above it, so an idling device does not blink; `hide_below` sets it per room or consumer. Hidden consumers count in Other, so the numbers still add up, and the tree's height follows the shown nodes
- Styles that UIX or card-mod put into a card stay through a config change; the cards used to clear their whole shadow root on every rebuild
- A template that stays in a changed config keeps its value instead of going blank until it next changes
- Docs: a Visibility guide with live examples, and the reference tables list the new keys

## 2.4.0 (2026-10-10)

- `title_tap_action` on the entity group, entity sections, power flow, weather, wind and rain cards: the title and its icon run an action, e.g. navigate to the room's dashboard. Without it the title stays plain text; header entities keep their own actions
- The title line sits 16 px above the first row (was 12 px), so the header reads as a block of its own
- Dividers between sections and below a hero lead run from edge to edge of the card
- Header badges carry their icon inside the pill instead of beside it. A header badge with `show_value: false`, or a value that renders empty, is just the icon in a coloured circle; an unavailable entity keeps its text. Badges in row, column and table items are unchanged
- Header items end at the card's right padding. A card without history visuals kept an empty range after them, and the header's 10 px gap before it showed as space after the last item

## 2.3.1 (2026-10-10)

- Icons sit centred in Home Assistant. Its icon aligns to the middle of the text line, so wherever a card's icon inherited a line height it sat below centre: by 1–2 px in the custom buttons and their labelled chips, by a pixel or less in header items, card title icons, the direction and rain chips of the wind and rain cards, and the Run and hold buttons of row items. Cards with a header get about 1 px shorter, as their title line no longer grows around the icon
- Docs: the live examples build icons as Home Assistant does, so the heading icons on the site sit centred too, and a test measures that every icon of every card sits centred in its box

## 2.3.0 (2026-10-10)

- Your own buttons: `control: buttons` takes `control_options` as a list of buttons, e.g. every scene of a room in one row. Each entry runs its `entity` (scenes and scripts turn on, buttons press) or switches it (lights, switches, fans: filled while on), or runs its own `action`; each takes its own `color` and `icon`, and a `label` turns it into a chip with text. A row of buttons needs no entity of its own, and `control_confirm` makes each button a hold
- A custom button's `action` targets the button's entity when the call names nothing to act on itself; a `perform-action` with its own `target`, `entity_id`, `area_id` or other target in its data is left alone. Each button keeps its own call in flight, so pressing two in a row or a neighbour answering first never drops a button's ghost
- Row items and the header draw no buttons: an item of buttons alone is a config error there, and the JSON Schema says so too
- A literal empty `value: ""` is a blank value instead of an unavailable one
- Docs: a "Your own buttons" section on the Controls page with a live example, and the entity options reference lists the new buttons

## 2.2.2 (2026-10-07)

- The JSON Schemas ship with the docs site, so `https://malte-wessel.github.io/pro-cards/schema/pro-cards.schema.json` resolves. The README has named that URL for editor completion since the schemas landed, but nothing ever copied `schema/` into the published site, so the YAML language server got a 404 and silently did nothing. The getting started guide now explains the one comment line it takes
- Docs: the sizing guide covers all ten cards. The weather, wind, rain and power flow cards were missing from its table although they report a size like the rest, its minimums were wrong for the three weather tiles (3 columns, not 6) and for a tile with a control (4 or 6, not 3), and a masonry or panel view was not mentioned at all
- Docs: the languages page lists the words the controls show (`Run`, `Done`) and the accessible names a screen reader reads out (`Off`, `Hold to lock`, `Press again to …` among them), the power flow card's generator and low-carbon strings, and the `title` a card picked from the picker arrives with. The controls' strings have been translated since they landed; only the page did not say so
- Docs: the weather card page lists Home Assistant's fifteen condition states with their names and mdi icons. They are the keys of an `icons` map and what a `rules` entry matches, and eight of them appeared nowhere on the site
- Docs: `control_confirm: true`, not `confirm: true`, in the last paragraph of the controls page; `name_position` is described the same way in all three places that mention it (row items only); the weather card's reference lists `name_position`; and the playground's entity list includes `light.attic`, the one entity of the demo home it left out

## 2.2.1 (2026-10-06)

- Docs: a changelog page on the site, so what a version brought is one click from the cards instead of a trip to GitHub. The page includes the repository's `CHANGELOG.md`, so a release is still written once; the guide, the playground and the changelog share one list that feeds both the nav dropdown and the sidebar, so the playground and the changelog sit under Guide instead of standing on their own
- Docs: the pages no longer scroll by themselves on an iPhone. Safari ties the scroll position to a box near the top of the viewport; the live examples rewriting their rows moved that box, so the page stepped down a few hundred pixels every few seconds while reading. The site opts out of that anchoring

## 2.2.0 (2026-10-06)

- Controls on the entity, entity group and entity sections cards. `control: auto` draws what the entity's domain calls for: lights a switch and a brightness slider, switches and helpers a switch, covers open / stop / close buttons and a position slider, thermostats a temperature stepper, fans speed segments (a slider beyond six speeds), locks a hold-to-confirm button, scripts, scenes and buttons a Run chip, media players transport buttons and a volume slider, selects a menu, numbers a slider. `control: toggle | slider | stepper | segments | buttons | button | select | hold` picks one, `none` draws nothing; `toggle: true` keeps working as an alias of `control: toggle`
- `control_position` puts a control on the line, under it or on the icon (tap the icon to toggle; a Run or hold button takes the icon's place). `control_attribute` names the mode segments set on a thermostat or fan, `control_step` and `control_options` tune sliders, steppers, segments and menus, and `control_confirm` turns the primary control into hold to confirm (every button of a group holds on its own)
- Controls sit in every layout: tiles, lists, hero leads, grid cells, row and column items and table fields. A control that shows the value itself (segments, a menu, the Run chip, a stepper on the number it sets) replaces the value text beside it. In narrow cards a control wraps under the name; tiles with a control size to their content and ask the sections grid for at least 4 columns (6 for wide controls)
- A control shows the value it asked for until the device answers, greys out while its entity is unavailable, and steps from the entity's minimum as Home Assistant does. A failed call shows Home Assistant's toast and fires the failure haptic
- Keyboard and screen readers: the focus survives card updates, a switch is a `switch`, a slider takes the arrow, page and Home / End keys, segments are a radio group (one tab stop, arrows choose), and hold to confirm takes Space or Enter held, or two presses from a screen reader
- A tile with `toggle: true` now sizes to its content and needs at least 4 columns, so its switch never spills past a narrow card
- The row's own tap / hold / double tap action lives on a layer behind the row's content, so a control is never nested in it; a hold that starts on a plot no longer counts as the row's hold
- `attribute: hvac_mode` on a climate entity shows its HVAC mode (Home Assistant keeps the mode in the state, not in an attribute)
- A gauge's value shrinks to fit inside its arc when it is long (a unit like "UV index" ran over the arc)
- Docs: a Controls page with every control and slot; the homepage and showcase dashboards, the card pages, the getting-started guide and the playground preset use controls; the demo home gained fans, locks, number, select and button helpers, a garage door and a few offline devices

## 2.1.0 (2026-10-04)

- Row and column items (entity group and sections cards, the weather card's row sections) stack the value under the name instead of putting it next to the icon: icon, bold name, plain value (a badge pill stacks the same way). `name_position: above` gives name, icon, value. Row and column items show the value by default (`show_value: false` hides it); the weather card's row sections no longer need their own default. An item without a name shows its value in the name's bold style. Row items spread over the width by default (`align: space-between`). Column items are list-like instead: the icon on the left with the name over the value beside it (`name_position` only applies to rows) and sit on the left by default (`align: start`)

## 2.0.0 (2026-10-04)

- **Breaking:** every card type ends in `-pro`: `custom:entity-card-pro`, `custom:entity-group-card-pro`, `custom:entity-sections-card-pro`, `custom:multi-trend-card-pro`, `custom:sun-path-card-pro`, `custom:illuminance-card-pro`, `custom:weather-card-pro`, `custom:wind-card-pro`, `custom:rain-card-pro`, `custom:power-flow-card-pro`; the card picker lists them as "… Card Pro". The old generic names (`weather-card`, `power-flow-card` …) were also used by other custom cards, and a single collision disabled the whole bundle. Update the `type:` of every Pro Card in your dashboards (the getting started page has a note). The JSON schemas moved with the cards (`schema/<type>.schema.json`)
- A card whose element name is already defined by another resource is reported in the console and skipped instead of taking every card after it down

## 1.7.1 (2026-10-01)

- Fix the multi trend card's plot in a cell taller or shorter than its natural height: the SVG was stretched to the card, which turned the hover dots into ellipses, thickened the gridlines and skewed the curves. The plot is now drawn at the height it gets, and the trend section of the weather card shares the fix
- Sun path card: the header is drawn like the other cards' (an icon and a 16 px title) instead of Home Assistant's card header; new `icon` option
- Docs: the showcase has three full-width dashboards (Energy, Overview, Weather) grown from the homepage examples
- Docs: the cards are grouped into Entities, Energy and Weather in the navigation, the getting started page and the README
- Docs: the homepage shows three live dashboards (Energy, Overview, Weather) instead of a strip of single cards, and a new Energy showcase page

## 1.7.0 (2026-10-01)

- New power flow card (`custom:power-flow-card`): where the home's power comes from and where it goes, as a tree with animated flow. Solar, battery and grid `sources` (signed `power` sensors or `import` / `export` and `charge` / `discharge` pairs, `soc`, `price`, `offline`), the `home` (a sensor, or computed from the sources) and optional `consumers` as devices or rooms (`group`), with an Other node for the rest. Solar covers the home first, then the battery, then the grid; surplus charges the battery and is exported. `flow_style` dots / lines / arrows, `direction` right / down, `consumer_style` nodes / list; the summary line names the state (importing, exporting, on battery, balanced, grid offline, expensive above `expensive_above`) and the self-sufficiency; `rules` on the home power label, colour and tint the card. The flow re-times on value changes instead of restarting and pauses with `prefers-reduced-motion`
- Power flow card options: `idle_links` (dashed / hidden / faint), `kw_above` and `decimals`, a `secondary` line on every source and consumer, consumers that produce (a negative value flows back to the home, `invert` per consumer), a grid `generator` that takes the grid node's place during an outage, the grid's `fossil` / `non_fossil` share on the home ring and the grid label, `animation: { slow_below, fast_above }` for the flow's pace
- Power flow card layout: every label owns a slot the tree reserves, so the card grows with the number of sources and consumers instead of squeezing text between nodes, and the columns keep the label widths clear

## 1.6.0 (2026-10-01)

- New rain card (`custom:rain-card`): the rain rate (`entity`) and today's total (`today`) as a tile with a small animated lead, a flow tile (`visual: flow`) or a hero (`layout: hero`) with a band and a chip. Three animations (`flow.style`): `drops` fall and splash, more and faster the harder it rains and slanted by a `wind` speed and `direction`; `ripples` spread on a puddle; `fill` is a rain gauge that today's total fills (12 mm). `rules` on the rate colour the rain, label the value and may tint the card; below 0.1 the card is dry. The animation keeps flowing through sensor updates and pauses with `prefers-reduced-motion`
- The wind card's animation engine moved to `src/shared/flow/` and is shared with the rain card (no change for users)

## 1.5.2 (2026-09-30)

- Wind card: the flow turns smoothly to a new direction instead of snapping, the short way round

## 1.5.1 (2026-09-30)

- Wind card: the flow no longer restarts every few seconds. Gusts drifting by a few km/h redrew the field, and a changed speed jumped the particles; the field is now redrawn only when the waves change by a real margin, and a new speed scales the running animation's playback rate, so the particles keep flowing and just speed up or slow down

## 1.5.0 (2026-09-30)

- New wind card (`custom:wind-card`): wind speed, direction and gusts from sensors (`entity`, `direction`, `gust`) or from a weather entity's attributes, as a tile with a small animated lead, a flow tile (`visual: flow`, the whole tile is the animated field) or a hero (`layout: hero`, big value and a flow band with a direction chip). The field's particles travel where the wind blows, faster with the speed, on taller waves with the gusts, with gust streaks; `rules` on the speed colour them, label the value and may tint the card. `flow.style` picks dots, lines (streamlines), swoosh or vectors (an arrow field), `flow.density` sparse / normal / dense, `flow.height` the hero band. Direction sensors may report degrees or compass points; speeds in m/s, mph, kn and ft/s drive the animation like km/h. All motion is CSS and pauses with `prefers-reduced-motion`
- The entity layer's secondary line builder (`secondaryEl`) is shared by the weather and wind cards (no change for users)

## 1.4.0 (2026-09-30)

- New weather card (`custom:weather-card`): a weather entity as a tile, or as sections composed like the sections card: `hero` (condition icon, big temperature, today's high / low), entity groups `row` / `list` / `table` / `grid` / `column` whose entries may name attributes of the weather entity (humidity, wind speed, pressure …) next to any entity with rules and every entity-card visual, `trend` (the multi trend plot of the hourly or daily forecast, with `hours` / `days`, `layout`, `x_axis`, `y_axis`, `show_legend` and `show` entries of `{ quantity, name, color }`) and `forecast` (hourly or daily rows or columns with condition, rain figures and temperature; days as low → high bars on one scale). Forecasts come from Home Assistant's forecast subscription. `rules` on the condition, `temperature_rules` on the temperature (on the card, or per `hero` / `forecast` / `trend` section, which also take `divider` and `title` like the sections card), header entities and templates. the conditions are the Home Assistant weather card's pictures (`icons: mdi` for the mdi icons, or a map with an mdi icon or an image per condition, on the card or per section), and `icon_size` sets the icon size of the tile, the hero and the forecast rows. Condition and attribute names come in every language the cards speak
- Entity cards: the value of a row or column item clips with an ellipsis instead of running into its neighbour when the section is narrow
- Multi trend card: a value axis no longer shows a `-0` tick
- The entity layer moved from `src/entity/` to `src/shared/entity/` and the multi trend plot to `src/shared/trend/` (no change for users)

## 1.3.0 (2026-09-30)

- The cards speak the language of the Home Assistant profile (English, Czech, German, Spanish, French, Italian, Norwegian Bokmål, Dutch, Polish, Portuguese, Russian and Swedish): the default sun path labels and tooltip word, the illuminance zone names, `Max` and `LUX`, the axis word `now`, `no data` / `loading …`, `Peak`, `unavailable`, `… not found` and every visual editor label. Your own `labels`, `zones`, rule `label`, `title` and `name` stay as written. See the Languages guide for adding a language
- Entity group and sections cards: the title of a freshly added card was German

## 1.2.0 (2026-09-30)

- Sun path card: hover or tap the curve for a tooltip with the time and the sun's elevation; `show_tooltip: false` turns it off
- Sun path card: the plot is a 24 hour window centred on solar noon, the ticks mark sunrise, solar noon and sunset (they marked dawn and dusk, which read as sunrise and sunset), and the dawn / dusk labels stay under their positions instead of jumping to the card edge

## 1.1.0 (2026-09-30)

- Illuminance card: `band` is the default `mode` (was `trend`); set `mode: trend` to keep the line plot
- Illuminance card: the trend plot labels its time axis at whole clock hours, its y axis with the zone thresholds (1, 100, 10k, 30k) instead of even decades, keeps the zone names right aligned and clear of the line, grows the scale to the window's peak instead of cutting it off, tints the bands more visibly and no longer clips the current-value dot at the right edge

## 1.0.2 (2026-09-29)

- Row items show the name below the icon by default (`name_position: below`); columns keep `above`
- Entity cards: the hover ring of the strip visual sits exactly on the hovered bar and the one of the columns visual frames its column evenly; the toggle button label and the peak marker of the tooltip were German
- Multi trend card: lane names and axis labels stay with their lanes when a grid row makes the card taller than its content
- The entity, sun path and illuminance cards no longer clip the card shadow a theme sets (`--ha-card-box-shadow`)
- Docs: a theme picker on every live example (Home Assistant default or Graphite, remembered across pages) and an extended Look & themes guide with the tokens the cards read, a sample theme and per-card tweaks
- New brand identity: isometric card-stack logo and Signal Blue palette across the docs site (light and dark), favicon, README and the console banner; social preview image for links to the docs

## 1.0.1 (2026-09-29)

- Entity rows and the multi trend header no longer show Home Assistant's ripple on hover and press

## 1.0.0 (2026-09-29)

Initial release.
