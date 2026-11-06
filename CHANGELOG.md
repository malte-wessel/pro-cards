# Changelog

## 3.0.0 – Poster and tile cards, energy flow, heading and swipe cards

_Beta_

- Requires Home Assistant 2026.4 or newer
- **Deprecated, and gone in 4.0:** the entity card (use the tile, or the poster), the entity group card (the tile group), the entity sections card (a layout card of headings and tile groups), the wind and rain cards (a poster or tile of the wind or rain kind) and the illuminance card, which goes without a successor. They still work; each says so once in the browser console, the card picker marks them, their schemas carry `deprecated`, and their pages sit under Deprecated in the docs. [Moving to 3.0](https://malte-wessel.github.io/pro-cards/guide/migrating) maps their keys to the new cards' and shows the layout card recipes for the group card's grid and hero
- **The weather, power flow and energy flow cards take `badges`** in their header, written as the poster's, the tile's and the heading's are. Their `header_entities` (the entity cards' keys) still work, say so once in the console and go in 4.0; a card takes one or the other, and [Moving to 3.0](https://malte-wessel.github.io/pro-cards/guide/migrating#header-entities) maps the keys.
- **New poster card** (`custom:poster-card-pro`): one entity as a poster, drawn the way its kind says. It takes half a section and three rows in a sections grid, and that at least: less room is a tile's.
  - The kind is detected from the entity's domain, then its device class. `kind` names it, and `kind: none` turns every default off.
  - Two places say what the card draws: `icon` and `visual` (what fills the card besides the icon and the texts, behind or below them). Each takes a thing by its name, `{ type, … }` with its options, or `false`; left out, it is the kind's. `icon` is an icon by name (`icon: mdi:sofa`), `{ ring: true, style: plain }`, a picture (`image`, with a `src` of its own: a URL, a template or an entity) or the wind's or the rain's animation (`flow`, its drawing the `variant`). `style` is the circle or none (`circle`, `plain`) on whatever the icon draws, and stays with the icon when a rule switches what it draws; a thing's own options (a picture's `src`, a flow's `variant`) go with it. `visual` is a `glow`, a picture behind the card (`image`, with `opacity`, `tint` and `blur`), the wind's or the rain's field (`flow`), a `sparkline`, `columns` or `strip` of the history (with their own `hours`, or `today`, `bucket`, `axis` and another entity's history as `src`), a `bar`, a `gauge` or `segments` of the value, or what a kind draws itself (`sun`, `cover` with its `variant`, `path`, `line`). A trend's sparkline is its series, a weather's the forecast's next hours, unless its `src` plots another entity. An object without `type` changes the options of what the place draws (`visual: { hours: 6 }` on a trend). Options that do nothing on what the place draws, and a thing the kind does not draw, are config errors where the config decides it (a written `kind`, a rule over the card's own thing) and a console warning where the detected kind does. The animation is drawn in one place: behind the card, the icon is the wind's arrow (the rain's icon); `icon: { type: icon }` draws the entity's icon (or its `name`) instead.
  - Rules set the places too, and a matching rule's `color` and `icon` win over the card's: the card's are its defaults. Its `status` wins over the kind's (a sun's next event, a trend's window too). A rule's text is its `status`, as the card's is (a text: an unquoted Off is an error that says to quote it).
  - The same shape for the control: `control: slider`, or `control: { type, position, attribute, step, options, confirm }`; without `type` its options change the kind's own controls (`control: { step: 10 }`, `control: { position: block }` puts their first under the value). Left out, it is the kind's controls; `auto` adds the domain's where the kind has none (an `input_select`'s select), `false` drops them.
  - Weather, sun, wind, rain and trend: a weather entity draws its condition, today's high and low and the next hours as a curve, coloured by condition. `sun.sun` (or `kind: sun`) draws the next sunrise or sunset and the day's curve. A wind sensor animates its icon with the direction and gusts; `visual: { type: flow, variant: lines }` (or `dots`, `swoosh`, `vectors`) makes the whole card the wind field. A rain sensor draws its drops and today's total (the `variant` `drops`, `ripples` or `fill`). `kind: trend` draws the lines of its `series` on one scale, its large value the card's entity (a sensor, a number or a counter) or the first series.
  - Devices bring their controls (`control: false` drops them). A light glows in its own colour as bright as it is. A fan's blades turn at its speed. A thermostat shows what it is doing, the card warm while it heats and cool while it cools. A lock and an alarm panel are held on their icon to lock or arm them, and an alarm that wants a code opens Home Assistant's keypad. A person's picture is the icon over their photo, blurred, with their zone and for how long.
  - A media player's cover art is the icon over the same art, blurred, and gives the poster its colour (the next song's cover and colour fade in), with the track's progress along the bottom. A cover draws its window in its device class's variant, or in the one its visual names (`visual: { type: cover, variant: garage }`; `shutter`, `blind` with its tilt, `curtain`, `garage`, `gate`, `awning`, `window`), and glides along while it moves. A vacuum's or a lawn mower's path draws itself while it works.
  - Named with `kind`: `grid` draws a power line with dots flowing in or out (one signed sensor, or `inputs: { import, export }`). `solar` shows the output with today's energy and production. `car` shows its charge and range, with the plug, charging and location. `appliance` (or `pump`, `washer`, `dryer`, `dishwasher`, `heat_pump`) shows how long it has run above `running_above` and the energy of this run. A battery draws a strip of segments filled to the charge; with its `power` (or `charge` and `discharge`) it is a home battery, the next segment pulsing while power flows.
  - A battery, the air quality sensors (`carbon_dioxide`, `pm25`, `pm10`, `aqi`), wind and rain bring their own colours and translated labels by value. The card's `rules` replace them.
  - A kind finds the other entities it reads on the same device, such as a wind sensor's direction and gusts or a rain gauge's daily total. `inputs` names one (`inputs: { gust: sensor.wind_gust, direction: false }`), and `false` drops it. A kind's other options (`running_above`, `series`) sit on the card. A key the kind does not read is a config error where `kind` is written, and a console warning where it is detected.
  - The texts have keys of their own (`name`, `value`, `secondary`, `color`), so a poster needs no entity. `show_name: false` and `show_value: false` leave the name or the value out, `icon: false` the icon. A text read as a boolean (YAML's unquoted Off, No) is a config error, never a hidden part.
  - The icon's own actions: `icon: { tap_action, hold_action, double_tap_action }`, as on Home Assistant's tile card. `toggle` there switches the entity, locks a lock or arms an alarm panel.
  - Badges in the corner, the first of them always the status badge (`status`: a text, a template or `false`; its look is the poster's, a tag in its colour; left out where it only repeats the value). A badge without an entity reads the poster's own (`{ attribute: humidity }`). A badge with an entity of its own opens it, also on a poster without one.
- **New tile card** (`custom:tile-card-pro`): one entity as a tile, with the poster card's kinds and places, smaller. The entity card's successor; it takes one row and sizes to its content.
  - The icon, the name and one line under it: the value, the status (the kind's, else the matching rule's `status`; `status` sets it or `false` drops it) and what the kind adds (a thermostat's Heating, a wind sensor's direction and gusts, a vacuum's battery and room). A status that only repeats the value is left out.
  - The kind's controls sit at the end of the line: a cover's buttons, a fan's speeds, a thermostat's stepper, a light's switch, a player's buttons. On a narrow tile they move under the line; a tile too short for that (a fixed row, a card around it giving less) keeps them beside the name, and where even that does not fit it leaves them out, a tap opening more-info. A fan's blades turn in its icon, a vacuum moves while it works, wind and rain animate theirs; a media player shows its art, a person their picture.
  - The kind's visual shows on a tile too: a light's glow and a thermostat's warmth from the bottom edge, a person's or a player's photo behind the tile, and as a second row the sun's day, the weather's next hours, solar production, a battery's segments and a trend's lines (`visual: false` keeps the tile to one row). A cover's, a robot's and the grid's drawings are the poster's: `visual: cover`, `path` or `line` draws them on a tile too. A media player's progress runs along the bottom edge. A plot or a curve below the line runs to the tile's edges, as on a poster; `control: slider` adds a slider.
  - `vertical: true` puts the icon on top, the name and the value with its status centred under it and the controls under them, as on Home Assistant's tile card. It takes a quarter of a section and two rows, a third with a control under the name, half a section with wider controls.
  - `badges` at the end of the first row, centred on the icon (as on the poster: entities or badges of their own), always shown: the name and the line give way. The status is on the line; `status_badge: true` makes it the first badge, always shown: the entity's state where the kind and the rules give none. Its look is the tile's, a tag in its colour. The icon carries Home Assistant's badge: what a thermostat or a humidifier is doing, a person's zone, an unavailable entity. `icon: { badge: false }` drops it, `icon: { badge: { icon, color } }` puts one of your own there (a rule can set one too), templates allowed (an empty icon: none), such as a warning while the wind is too strong.
  - `show_name: false`, `show_value: false` and `icon: false` work as on the poster. As on Home Assistant's tile, the icon toggles what switches and presses what runs by default (`icon: { tap_action: none }` turns it off), and a fan keeps turning with the toggle on it.
  - Tiles and posters answer the pointer as Home Assistant's tile does, unless `hover: false`: a light layer under a mouse, a ripple from where you press, the card's border and a ring around it in its colour while it has the keyboard's focus. The entity card's `visual: ring`, `visual: icon`, `visual: badge` and `toggle` are config errors that name the tile's keys.
  - The keys the places replaced are config errors that name the new spelling (`poster` is `kind`, `image_opacity` is `visual: { type: image, opacity }`, `icon_ring` is `icon: { ring: true }`, `control_step` is `control: { step }`, `icon_badge` is `icon: { badge }`, `gust` is `inputs: { gust }`, `show_icon: false` is `icon: false`, a rule's `label` is its `status`, `control: true` is `auto`, `control: none` is `false` …). The 2.9 betas' `variant` names the drawing's spelling (`variant: lines` is `visual: { type: flow, variant: lines }`, `variant: garage` is `visual: { type: cover, variant: garage }`, an appliance is its `kind`), and so does a cover's look as a kind (`kind: garage` is `visual: { type: cover, variant: garage }`). The status takes no badge keys (`status: { … }` is an error) and is no entry of `badges`: it comes first.
- **Visual editors** for every current card, in Home Assistant's card editor: new for the poster, the tile, the tile group, the heading, the layout, the swipe, the sun azimuth, the weather, the power flow and the energy flow card.
  - The poster's and the tile's form starts with what the card shows: the entity as it is, texts of your own (no entity), or a kind (the entity's detected one shown); under it the entity, offering only those that fit the kind (detected as it, or what it measures: of its device class, or a template sensor without one in its unit; a car its battery, solar, the grid and the appliances a power sensor, a trend a number; an input as well, a wind's direction a sensor in degrees), and the other entities the kind reads (with what was found on the device). A kind the entity does not fit waits for one that does, the YAML as it was. Then the name, the value (how it is written, its range, the line under it), the appearance (the colour, the icon and the visual with only the things and options that kind takes), its controls, the status and the badges, the rules (the kind's own shown until one is changed, then copied into the card in the sensor's unit; Predefined goes back to them; a state picked from the entity's, `above` and `below` in the value's unit; a hint on a rule that never matches, matches everything before others or is covered by an earlier one) and the interactions. The badges, the rules, a trend's lines and a control's options and buttons are lists in Home Assistant's own sections: a row each, saying what it shows or when it matches, opening its form in a view of its own with a back arrow, as Home Assistant's entities editor opens a row; a new one is added by its first change. A badge's form starts the same way, with what it shows (the entity as it is, a text of your own, or a kind whose colours it takes; its entity, else the card's), then its name, how its value is written, its appearance, after the value and its range, its switch, its actions and its own rules, which open on top of it. A trend line's form has its own rules (its colour) and conditions for when it shows (state, numeric state, screen, time, template; the others as YAML). The layout (a tile's vertical and alignment, filling the height) follows the appearance, and the icon takes a double tap too. A field left alone keeps the kind's default and writes nothing; what the form does not show stays in the YAML as written.
  - The layout and the swipe card edit their options and breakpoints, and each of their cards in a tab with that card's own editor (a tile's, a poster's, Home Assistant's), moved, duplicated, deleted or added from the card picker. The layout card's **Place in the layout** sets a card's span, column, order and alignment. The tile group edits its title, icon, layout and badges, and each tile in the tile's own editor (a new one by +; a table's tiles as rows, without what a row does not draw). The heading edits its title, icon, subtitle, style and colour, its badges, where they sit and how they look, and its actions. Their badges are the poster's and the tile's list, each in its dialog. The sun azimuth card edits its view, its house (the front's bearing, the roof, each side's name or a shared wall, an empty name showing where the side faces), its camera, what it shows under the plot and its colours. The weather card edits its own options (the rules as YAML) and each section in a tab with a form of its type: the lead, a forecast (its window, rows or columns, the rain figures), a trend (its window, its lines in order, the layout and axes) or an entity group (its layout and what it shows, its entities as YAML); + adds a section, the lead first. The power flow and the energy flow card edit their own options (the home, the consumers in a list with a dialog each, the drawing, the values; the energy card's period) and each source in a tab: solar, a battery or a grid, measured by one signed sensor or a pair, the grid with its price, outage, generator and fuel mix; the energy card with its meters.
    - On the docs site, the Playground runs the same editors beside the live card, with the YAML in a code editor, the preview at a phone's or one to three sections' width with the card's grid size and the demo home's states at hand. It keeps the card in the browser, undoes and redoes every change (visual, typed or an example opened), checks the YAML against the cards' schemas as you type (a wrong key underlined where it is, the keys and values that fit offered, the demo home's entities among them), lists what the card warns of, saves cards under a name and shares one as a link; **Edit** under an example opens it there.
- The multi trend card's visual editor writes an entity with nothing of its own as its id, and keeps one written as an object; it rewrote every entity as `{ entity: … }`.
- **Card suggestions:** picking an entity in Home Assistant's card picker suggests the cards that fit it: the poster and the tile for an entity with a kind of its own, the weather and sun cards for their entities, the multi trend card for a numeric sensor.
- **New tile group card** (`custom:tile-group-card-pro`): several tiles on one card under the entity group card's header (`title`, `icon`, `title_tap_action`, `badges`), the entity group card's successor. Its `tiles` are tile cards drawn flat on the group's surface, so everything a tile does works there too. Its `table` layout draws each tile as one line: the name in small capitals, the value with its status, and one control (the kind's, a slider too, or the domain's for what a tile controls with its icon) or a badge's visual (`bar`, `sparkline`, `trend`); a row draws no icon, no `secondary` and no badges, and gives way on a narrow card in this order: the status, the name, the control.
  - `layout: list` puts the tiles one under the other; `layout: row` puts vertical tiles side by side, in columns alike as wide as the widest tile needs, wrapping when narrow; `layout: table` one line each (above). The layout decides every tile's `vertical`.
  - The group sets nothing else on its tiles: each tile says everything about itself and looks the same in a group as on its own. A tile's `visibility` hides it in place.
- **`vertical_align`** on the tile and the tile group: where the content sits in a card taller than it (a fixed row count, a taller card beside it), `top`, `center` or `bottom`; a tile centres it unless told, a tile group keeps its tiles at the top. In both visual editors.
- **New energy flow card** (`custom:energy-flow-card-pro`): the power flow card's tree over a period (`period: today | yesterday | week | month | year`), from energy meters and their long-term statistics, live between compiled hours. The flows split the way the Energy dashboard splits them, hour by hour (day by day for longer periods); the dots move by each link's share of the home, thresholds and rules read kWh. A picker in the header steps to another day, week, month or year (‹ ›) or opens a calendar like Home Assistant's date picker (quick picks, and any range of days in two clicks), and goes back to the configured `period` after ten minutes untouched; `period_picker: false` keeps a fixed period. Also for heat: a heat pump's heat meter and the floors' meters show where the heat went
- **New heading card** (`custom:heading-card-pro`): a heading without a card around it, as Home Assistant's own, in five styles (`section`, `title`, `subtitle`, `big`, `hero`) with a subtitle and an icon (templates allowed; `icon_tap_action` gives the icon its own action). Its `badges` are entities with rules, actions and visibility, as pills (`outline`, `soft`, `filled`, `plain`) in three sizes. They sit at the end of the line (below it on a narrow card), right after the title or on a line of their own, wrap or scroll
- **Badges of the poster, the tile, the tile group and the heading card** are written as the cards are. Their pill holds the icon, the name, the value, a visual and a switch, in that order. `icon` is the icon place: a name, `{ type: image }` (the entity's picture, or `src`), `{ type: dot }`, `{ ring: true }` (a ring of the value around it) or `false`. `visual` draws after the value: `bar`, `sparkline` or `trend`, each over its own window (`{ type: sparkline, hours: 6 }`; 24 hours for a sparkline, one for a trend). `control: toggle` puts a switch at the end; it is the one control a badge holds. `color` and `icon` are defaults: a matching rule's win, and a rule's `value` is its text in place of the value (a template too). A badge takes its entity's kind's colours: a battery red when it runs low, air quality by its bands, wind and rain by their speed, a light in its own colour, a thermostat warm while it heats, a pulse where the kind calls for attention; not the kind's words, and no thresholds on an attribute or a value of its own. `kind` names one, `kind: none` leaves it out, its own `rules` replace the kind's. The old keys are config errors that name the new spelling: `visual: ring` is `icon: { ring: true }`, `visual: dot` is `icon: { type: dot }`, `show_icon: false` is `icon: false`, `show_entity_picture` is `icon: { type: image }`, `trend_hours` is `visual: { type: trend, hours }`, a rule's `label` is its `value`, `visual: count` is a template in `value` (`expand(…) | selectattr('state', 'eq', 'on') | list | count`); a rule's `tint_card`, `secondary`, `name_position` and the `control_*` keys are gone. The heading card's `hours_to_show`, `bucket_minutes` and `smoothing_minutes` are gone with them. The poster's `toggle` is `control: toggle`, as on the tile
- **New swipe card** (`custom:swipe-card-pro`): any cards side by side in a strip you swipe through, snapping to each card (`snap: start | center | free`). `per_page` says how many fit across, a fraction lets the next one peek in (1.15 by default); dots below show the page and jump to it. Given less height than its cards want (`grid_options`, a cell of a layout card), the cards fit themselves into it rather than being cut off. `unfold: 4` shows a grid of four instead of the strip, and like the layout card's, every option can change at `breakpoints` by view columns (`2: { per_page: 2.2 }`, `3: { unfold: 4 }`). The cards keep their own `visibility`. YAML only for now
- Group and sections cards: `vertical_align: center | bottom` moves the entities to the middle or the bottom of a card taller than its content (fixed rows, a taller card beside it); the title stays on top
- Layout card: `rows` sets the first rows' heights like `columns` sets the columns' (`[auto, 1fr]`: a heading row at its height and a row that takes the rest), so rooms of a heading and a card line up in a swipe card with `height: equal`
- The old header badges (`header_entities` on the deprecated cards, and until 4.0 on the weather and flow cards) draw more than a value: `visual: ring`, `bar`, `sparkline`, `trend` (the change over `trend_hours`), `count` (how many of a group's members are on) and `dot`; `control: toggle` puts a switch into a badge, sized to its pill. A badge takes `style` and `size`, `format: power | duration | relative` (W / kW / MW, `1h 12m`, `in 38 minutes`) and `stale_after` (grey with its age); a rule can change its `style` and make it `pulse`. Existing headers keep their look: there the badges are plain and small unless they say otherwise (a plain pill draws nothing, but keeps its padding and shape, so its hover is a pill)
- Energy flow: `period: dashboard` follows the period of Home Assistant's energy date picker on the dashboard, as Home Assistant's own energy cards do (`collection_key` for another picker); the card then has no picker of its own
- `hover: true` on an entity (or on the card or a section, for all of its entities) shows Home Assistant's hover and press on what a click runs (a tile, a grid cell, a header entity, an icon with its own action, every control), as on its tile card: a light layer under a mouse and its ripple from where you press
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
- Badges: `style: tag`, an outline in the badge's colour with its text in that colour (the look of a poster's status badge), for every badge and `badge_style`
- Controls: `control: buttons` on a vacuum or a lawn mower draws start / pause and return to the dock; `control: hold` on an alarm panel arms it (away) and disarms it
- A lock or an alarm panel held on its icon shows its own state's icon (a locked padlock while locked); the button's label says what the hold does
- Rules: `state` matches the value or the entity's own state, so `{ state: playing }` works on a media player shown by its `media_title` and `{ state: "on" }` on a light shown by a brightness template
- Fix: a grid cell's value that is a fraction of a pixel too wide is made smaller instead of cut with an ellipsis, and the values are fitted again when a web font arrives after the card was drawn
- Fix: tile: a single line of text beside a control (a select, buttons, a stepper) sits level with the icon instead of at its top
- Fix: sun azimuth: half a section wide, the card no longer runs into a resize loop (the browser reported it, and the scene was drawn twice)
- Fix: energy flow: the period picker no longer makes the header taller, so a power and an energy flow card side by side start their trees at the same height
- Fix: power and energy flow: the home sits level with the source nearest its height, so that source's line runs straight in instead of taking a small step that looked like a crack, and every line into the home meets its circle
- Fix: a history strip and its tooltip colour and name each past bucket by its own value, not by the entity's state now; columns of a series below zero stay inside the plot
- Fix: weather: a forecast row and the trend's tooltip match the rules by their own condition and temperature, not today's; the daily trend names each day as the forecast does (a day stamped at a UTC midnight, the day after a daylight saving change)
- Fix: power flow: without a grid, leftover solar or battery power no longer counts as export ("Exporting"), nor battery charging as coming from the grid
- Fix: energy flow: a consumer whose meter is unavailable now shows its total for the period; the period picker closes when the card leaves the page
- Fix: a slider tapped without moving, or keys that end on the value it started from, call no service; a hold button no longer keeps its armed look after the arm expired
- Fix: animations keep their speed when a card comes back (a view switch, a masonry move, shown again by `visibility`)
- Fix: a card's history period labels ("−24 h"), the multi trend and illuminance ranges and the illuminance axis follow the language; a thermostat's or fan's modes and presets show Home Assistant's names for them
- Fix: the sun path card's editor labels its icon field

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
