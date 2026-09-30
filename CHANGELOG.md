# Changelog

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
