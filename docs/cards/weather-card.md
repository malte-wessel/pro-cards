# Weather

`custom:weather-card-pro` shows one weather entity, as a tile or as a card built from sections: the current weather large, rows of values, trend charts and the forecast. For one value drawn large, a [poster of the weather kind](/cards/kinds#weather) is the simpler choice. The card is set up in YAML.

## The tile

The entity alone makes a tile: the condition's picture, the name, and the temperature and condition on the line under it.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
```

:::

## Sections

With `sections`, the card draws them in the order you write them. Each section takes a `title` above it, `divider: true` for a line above it, and [`visibility`](/guide/visibility), whose conditions read the weather entity unless they name another.

- `hero`: the condition, the temperature large, and today's high and low.
- `row`, `list`, `table`, `grid`, `column`: values of the weather entity and other entities.
- `trend`: a chart of the hourly or daily forecast.
- `forecast`: the next hours or days, as rows or columns.

## Hero and rows of values

The `hero` section's `name` puts your own words on its first line (the condition then moves to the second), and `secondary` replaces the second line. Both take templates and default to the card's `name` and `secondary`.

The `row`, `list`, `table`, `grid` and `column` sections list `entities`. An entry can name an attribute of the weather entity: `humidity`, `pressure`, `wind_speed`, `wind_gust_speed`, `wind_bearing`, `apparent_temperature`, `dew_point`, `uv_index`, `cloud_coverage`, `visibility`, `ozone`. It gets a translated name, an icon and the entity's unit. Any other entry is an entity with its own rules and visual. These sections use the older entity options; [Entity options](/cards/entity-options) describes them.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
sections:
  - type: hero
  - type: row
    entities:
      - humidity
      - wind_speed
      - { entity: sensor.uv_index, name: UV, visual: ring, min: 0, max: 11, rules: [{ below: 3, color: green }, { above: 3, color: amber }] }
  - type: table
    title: More
    divider: true
    entities: [pressure, dew_point, visibility]
```

:::

## Trend

A `trend` section charts the forecast as the [multi trend card](/cards/multi-trend-card) does. `mode: hourly` shows the next `hours` hours, `mode: daily` the next `days` days, with the temperature as high and low. `show` lists the lines: `temperature`, `precipitation`, `probability` and `wind`, or `{ quantity, name, color }`. Hover or touch the chart for the condition and every value at that time.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
sections:
  - type: trend
    mode: hourly
    hours: 12
    show:
      - temperature
      - precipitation
      - { quantity: wind, name: Breeze, color: teal }
    y_axis: true
  - type: trend
    mode: daily
    days: 7
    divider: true
    show: [temperature, precipitation]
```

:::

## Forecast

A `forecast` section lists the next days or hours: the weekday or time, the condition, the rain figures of `show` and the temperature. Days get a bar from the low to the high, on one scale for all days, so a warm day stands out. `layout: horizontal` turns the rows into columns.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
sections:
  - type: forecast
    mode: daily
    days: 5
    show: [probability, precipitation]
  - type: forecast
    mode: hourly
    layout: horizontal
    divider: true
    hours: 6
```

:::

## Icons

The conditions are drawn with the pictures of Home Assistant's own weather card, coloured by the theme's `--weather-icon-*` variables. `icons: mdi` uses the mdi weather icons instead. A map sets an icon per [condition](#conditions): an `mdi:` icon or an image URL (`/local/weather/rain.svg`); conditions left out keep the pictures. `icons` on a `hero` or `forecast` section merges over the card's. `icon_size` sets the icon's size in pixels, on the card for the tile and on a section for its own.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
icons: mdi
sections:
  - type: hero
    icon_size: 72
  - type: forecast
    mode: daily
    days: 4
    icons: { rainy: mdi:umbrella, pouring: mdi:umbrella }
```

:::

## Rules and colours

`rules` match the condition (`state: rainy`) and set the colour, the icon and a label, or tint the whole card with `tint_card: true`. `temperature_rules` match the temperature with `below` and `above`: they colour the value, the temperature line and the forecast bars, with a label beside the high and low. A `hero`, `trend` or `forecast` section can carry its own `rules` and `temperature_rules`, which replace the card's for that section. The first matching rule wins.

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
rules:
  - { state: lightning-rainy, color: red, label: Storm warning, tint_card: true }
  - { state: partlycloudy, color: amber, label: Some sun }
temperature_rules:
  - { below: 5, color: blue, label: Cold }
  - { below: 12, color: cyan, label: Cool }
  - { below: 20, color: green, label: Mild }
  - { above: 20, color: amber, label: Warm }
sections:
  - type: hero
  - type: forecast
    mode: daily
    days: 5
    rules:
      - { state: rainy, color: blue, icon: mdi:umbrella }
      - { state: pouring, color: indigo, icon: mdi:umbrella }
```

:::

## Header

`title` and `icon` add a header, and `badges` puts badges in it, with a [badge's keys](/cards/badges#badge-keys). The old `header_entities` still work until 4.0; see [Moving to 3.0](/guide/migrating#header-entities).

::: live

```yaml
type: custom:weather-card-pro
entity: weather.home
title: Home
badges:
  - { entity: sun.sun, attribute: elevation, icon: mdi:weather-sunset-down, color: amber }
secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°"
sections:
  - type: hero
  - type: row
    entities: [humidity, wind_speed, pressure]
  - type: trend
    mode: hourly
    hours: 12
  - type: forecast
    mode: daily
    days: 7
  - type: row
    title: Garden station
    divider: true
    entities:
      - { entity: sensor.outdoor_temperature, visual: ring, min: -10, max: 40 }
      - { entity: sensor.outdoor_humidity, visual: ring }
      - { entity: sensor.wind_gust, name: Gusts }
```

:::

## The visual editor

Home Assistant's card editor shows the entity, then the card's options in sections: the tile's name and secondary line, the header, the appearance (the colour, the condition icons, their size), the sections, the defaults of the entity sections, the badges, the rules and the interactions. The rules are the condition's (by its states) and the temperature's (above and below, in its unit), each a list whose rules open in a view of their own (when, its label, colour and icon, how it looks). The sections are a list too, each opening in a view with a form of its type: the lead, a forecast (daily or hourly, rows or columns, the rain figures), a trend (its window, its lines in order, each with its quantity, name and colour, the layout and axes) or an entity group (its layout and what it shows; its entities in a list, each an attribute of the weather entity or an entity with its name and icon). A section's lines, entities and rules open on top of its view. **Add a section** adds one (the lead first), the buttons on a row move or delete it; without sections the card is a tile. A value left at its default writes nothing, and what the form does not show stays in the YAML as written. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Conditions

Home Assistant's fifteen conditions: the keys of an `icons` map and the `state` a rule matches. The name is what the card shows, in the [profile language](/guide/languages).

| `state`           | Name          | `icons: mdi`                  |
| ----------------- | ------------- | ----------------------------- |
| `clear-night`     | Clear night   | `mdi:weather-night`           |
| `cloudy`          | Cloudy        | `mdi:weather-cloudy`          |
| `exceptional`     | Exceptional   | `mdi:alert-circle-outline`    |
| `fog`             | Fog           | `mdi:weather-fog`             |
| `hail`            | Hail          | `mdi:weather-hail`            |
| `lightning`       | Lightning     | `mdi:weather-lightning`       |
| `lightning-rainy` | Thunderstorms | `mdi:weather-lightning-rainy` |
| `partlycloudy`    | Partly cloudy | `mdi:weather-partly-cloudy`   |
| `pouring`         | Pouring       | `mdi:weather-pouring`         |
| `rainy`           | Rainy         | `mdi:weather-rainy`           |
| `snowy`           | Snowy         | `mdi:weather-snowy`           |
| `snowy-rainy`     | Sleet         | `mdi:weather-snowy-rainy`     |
| `sunny`           | Sunny         | `mdi:weather-sunny`           |
| `windy`           | Windy         | `mdi:weather-windy`           |
| `windy-variant`   | Windy         | `mdi:weather-windy-variant`   |

`sunny` and `partlycloudy` show their night icon while the sun is down; forecast days always show the day icon. A condition not in this list is shown as written, with a question mark icon.

### Card options

| Key                                    | Default             | Description                                                                                                   |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `entity`                               | –                   | The weather entity. Required.                                                                                 |
| `sections`                             | –                   | The sections, drawn in this order. Without them the card is a tile.                                           |
| `name`                                 | the friendly name   | The tile's name, or the hero's first line. Template allowed.                                                  |
| `secondary`                            | see description     | The line under the name (tile: temperature · condition; hero: label · high / low). Template allowed.          |
| `color`                                | the condition's     | A fixed colour for the condition; wins over the rules.                                                        |
| `icon_style`                           | `circle`            | `plain` draws the tile's and the hero's icon without its circle.                                              |
| `decimals`                             | as reported         | Decimals of the temperature, 0 to 3.                                                                          |
| `icons`                                | `hass`              | `hass` (Home Assistant's pictures), `mdi`, or a map from condition to an `mdi:` icon or image URL.            |
| `icon_size`                            | `36`                | The tile's icon size in pixels.                                                                               |
| `rules`                                | –                   | Rules on the condition: `color`, `icon`, `label`, `tint_card`. See [Rules](/cards/entity-options#rules).      |
| `temperature_rules`                    | –                   | Rules on the temperature (`below`, `above`): `color`, `label`, `tint_card`.                                   |
| `title`, `icon`                        | –                   | The header's text and icon. Template allowed.                                                                 |
| `badges`                               | –                   | The header's badges: entity ids or [badges](/cards/badges#badge-keys).                                        |
| `header_entities`                      | –                   | The old header badges, until 4.0; see [Moving to 3.0](/guide/migrating#header-entities).                      |
| `title_tap_action`                     | `none`              | What a tap on the title or its icon does, such as `{ action: navigate, navigation_path: /lovelace/weather }`. |
| `tap_action`, `hold_action`            | `more-info`         | What a tap or hold on the tile or hero does, and the default for every entity; see [Actions](/cards/actions). |
| `double_tap_action`                    | `none`              | What a double tap does, and the default for every entity.                                                     |
| `hover`                                | `false`             | `true` shows Home Assistant's hover and press effects; the default for every section and entity.              |
| `columns`, `align`                     | per layout          | Defaults for the entity sections.                                                                             |
| `show_name`, `show_value`, `show_icon` | per layout          | Defaults for the entity sections' items.                                                                      |
| `name_position`                        | `below`             | `above` or `below` the icon, in `row` items.                                                                  |
| `hours_to_show`, `bucket_minutes`      | `24`, `60`          | History window and bucket of sparklines, columns and strips in entity sections.                               |
| `smoothing_minutes`                    | one point per 12 px | Averaging of sparklines in entity sections, in minutes.                                                       |

### Section `hero`

| Key                          | Default    | Description                                                    |
| ---------------------------- | ---------- | -------------------------------------------------------------- |
| `name`, `secondary`          | the card's | The first and second line. Template allowed.                   |
| `icons`                      | the card's | Condition icons for this section, merged over the card's.      |
| `icon_size`                  | `56`       | The icon's size in pixels.                                     |
| `rules`, `temperature_rules` | the card's | Rules for this section only.                                   |
| `title`                      | –          | The text above the section.                                    |
| `divider`                    | `false`    | A line above the section.                                      |
| `visibility`                 | –          | [Conditions](/guide/visibility) that show or hide the section. |

### Sections `row`, `list`, `table`, `grid`, `column`

| Key                                    | Default    | Description                                                                                                                                           |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entities`                             | –          | Weather attribute names, entity ids or [entities](/cards/entity-options); an entry without `entity` reads the weather entity's `attribute`. Required. |
| `layout`                               | `list`     | The layout when `type` is left out, as in a section copied from elsewhere.                                                                            |
| `columns`                              | the card's | `grid`: cells per row, 1 to 4.                                                                                                                        |
| `align`                                | the card's | How the items spread; `row` items stretch over the width.                                                                                             |
| `show_name`, `show_value`, `show_icon` | the card's | Show or hide the items' parts; `row` items show their value.                                                                                          |
| `name_position`                        | the card's | `above` or `below` the icon, in `row` items.                                                                                                          |
| `hover`                                | the card's | Hover and press effects for this section's entities.                                                                                                  |
| `title`                                | –          | The text above the section.                                                                                                                           |
| `divider`                              | `false`    | A line above the section.                                                                                                                             |
| `visibility`                           | –          | [Conditions](/guide/visibility) that show or hide the section.                                                                                        |

### Section `trend`

| Key                          | Default                        | Description                                                                                                                                                        |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mode`                       | `daily`                        | `hourly` or `daily`.                                                                                                                                               |
| `hours`, `days`              | `12`, `7`                      | 1 to 48 hours from now, or 1 to 10 days from today.                                                                                                                |
| `show`                       | `[temperature, precipitation]` | The lines in order: `temperature`, `precipitation`, `probability`, `wind`, or `{ quantity, name, color }`. `wind_speed` and `precipitation_probability` also work. |
| `layout`                     | `auto`                         | `overlay` (one chart), `lanes` (one per line), or `auto`: overlaid when the lines share a unit.                                                                    |
| `x_axis`                     | `true`                         | Time labels and gridlines.                                                                                                                                         |
| `y_axis`                     | `false`                        | Value labels and gridlines.                                                                                                                                        |
| `show_legend`                | `true`                         | A legend when lines are overlaid.                                                                                                                                  |
| `rules`, `temperature_rules` | the card's                     | Rules for this section only.                                                                                                                                       |
| `title`                      | "Next 12 hours", "7 days"      | The text above the section.                                                                                                                                        |
| `divider`                    | `false`                        | A line above the section.                                                                                                                                          |
| `visibility`                 | –                              | [Conditions](/guide/visibility) that show or hide the section.                                                                                                     |

### Section `forecast`

| Key                          | Default                   | Description                                                          |
| ---------------------------- | ------------------------- | -------------------------------------------------------------------- |
| `mode`                       | `daily`                   | `hourly` or `daily`.                                                 |
| `layout`                     | `vertical`                | `vertical` (rows) or `horizontal` (columns).                         |
| `hours`, `days`              | `12`, `7`                 | 1 to 48 hours from now, or 1 to 10 days from today.                  |
| `show`                       | `[probability]`           | Rain figures per row: `probability`, `precipitation`; `[]` for none. |
| `icons`                      | the card's                | Condition icons for this section, merged over the card's.            |
| `icon_size`                  | `22`                      | The icons' size in pixels.                                           |
| `rules`, `temperature_rules` | the card's                | Rules for this section only.                                         |
| `title`                      | "Next 12 hours", "7 days" | The text above the section.                                          |
| `divider`                    | `false`                   | A line above the section.                                            |
| `visibility`                 | –                         | [Conditions](/guide/visibility) that show or hide the section.       |

The forecast is the one Home Assistant's own weather card shows, in the entity's units; a twice-daily forecast is summarised per day. A section whose forecast the entity does not provide says so.

### Grid and Home Assistant options

As a tile the card takes 6 columns (at least 3); with sections it takes 12 (at least 6). Both size their height to their content (`rows: auto`). The card also takes Home Assistant's `grid_options`, `visibility`, `view_layout`, `layout_options` and `card_mod`, and `fill_height: false` keeps its own height beside a taller card ([Filling the height](/guide/sizing#filling-the-height)).
