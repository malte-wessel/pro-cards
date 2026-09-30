# Changelog

## Unreleased

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
