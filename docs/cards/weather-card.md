# Weather Card

`custom:weather-card` shows one weather entity. Without `sections` it is a tile. With `sections` you compose the card like the [sections card](/cards/entity-sections-card): the hero lead, rows of weather attributes and entities, trend charts and forecast rows, in the order you write them. The parts are the ones the other Pro Cards use: rules, templates, header entities, the entity visuals and the multi trend plot. YAML only.

## Tile

The entity alone makes a tile: the condition icon, the name and "temperature · condition" on one row of the sections grid.

::: live

```yaml
type: custom:weather-card
entity: weather.home
```

:::

## Hero

A `hero` section shows the condition, the big temperature and today's high and low. `name` puts your own words on the first line (the condition then moves to the second), `secondary` replaces the second line; both accept templates and fall back to the card's `name` / `secondary`.

::: live

```yaml
type: custom:weather-card
entity: weather.home
sections:
  - type: hero
```

:::

## Rows of attributes and entities

`row`, `list`, `table`, `grid` and `column` sections are entity groups exactly like the sections of the [sections card](/cards/entity-sections-card): `entities`, `align`, `columns`, the item options and a `title`. An entry that names an attribute of the weather entity gets a translated name, an icon and the entity's unit: `humidity`, `pressure`, `wind_speed`, `wind_gust_speed`, `wind_bearing`, `apparent_temperature`, `dew_point`, `uv_index`, `cloud_coverage`, `visibility`, `ozone`. Any other entry is an [entity](/cards/entity-options) with every option the entity cards know, so a sensor next to the weather station fits in with its own rules and visual.

::: live

```yaml
type: custom:weather-card
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
    entities: [pressure, dew_point, visibility]
```

:::

## Trend

A `trend` section is the plot of the [multi trend card](/cards/multi-trend-card) over the forecast. `mode: hourly` draws the next `hours_to_show` hours (1 to 48), `mode: daily` the next `days` days (1 to 10) with the temperature as high and low. `show` lists the lines like the multi trend card's `entities`: a quantity name (`temperature`, `precipitation`, `probability`, `wind`) or `{ quantity, name, color }`; the temperature takes its rule colour by default. `layout` (`auto`, `overlay`, `lanes`), `x_axis`, `y_axis` and `show_legend` work as in the multi trend card. Hover or touch the plot for the condition and every value at that time.

::: live

```yaml
type: custom:weather-card
entity: weather.home
sections:
  - type: hero
  - type: trend
    mode: hourly
    hours_to_show: 12
    show:
      - temperature
      - precipitation
      - { quantity: wind, name: Breeze, color: teal }
    y_axis: true
  - type: trend
    mode: daily
    days: 7
    show: [temperature, precipitation]
```

:::

## Forecast

A `forecast` section lists the next days or hours. `layout: vertical` draws one row each with the weekday or time, the condition, the rain figures of `show` (`probability`, `precipitation`, or `[]` for none) and the temperature; days get a bar from the low to the high on one scale for every day, so a warm day stands out. `layout: horizontal` turns the rows into columns.

::: live

```yaml
type: custom:weather-card
entity: weather.home
sections:
  - type: forecast
    mode: daily
    days: 7
    show: [probability, precipitation]
  - type: forecast
    mode: daily
    layout: horizontal
    days: 6
  - type: forecast
    mode: hourly
    layout: horizontal
    hours_to_show: 6
```

:::

## Rules and colours

`rules` match the condition (`state: rainy`, `state: lightning-rainy` …) and set colour, icon and label of the lead, or tint the whole card. `temperature_rules` match the temperature with `below` / `above` and colour the value, the temperature line and the forecast bars, with a label next to the high and low. Both live on the card and apply to every section; a `hero`, `forecast` or `trend` section can carry its own `rules` / `temperature_rules`, which replace the card's for that section: a forecast with an umbrella for rainy days, a trend with stricter temperature colours.

::: live

```yaml
type: custom:weather-card
entity: weather.home
title: Home
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
  - type: trend
    mode: hourly
    hours_to_show: 12
    show: [temperature]
    temperature_rules:
      - { below: 18, color: teal, label: Fresh }
      - { above: 18, color: red, label: Hot }
```

:::

## Everything

Sections render in the order written, so the forecast can sit between groups, and the header takes `title`, `icon` and `header_entities` like the group cards.

::: live

```yaml
type: custom:weather-card
entity: weather.home
title: Home
header_entities:
  - { entity: sun.sun, attribute: elevation, icon: mdi:weather-sunset-down, color: amber }
secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°"
temperature_rules:
  - { below: 12, color: blue, label: Cool }
  - { below: 20, color: green, label: Mild }
  - { above: 20, color: amber, label: Warm }
sections:
  - type: hero
  - type: row
    entities: [humidity, wind_speed, pressure]
  - type: trend
    mode: hourly
    hours_to_show: 12
  - type: forecast
    mode: daily
    days: 7
  - type: row
    title: Garden station
    entities:
      - { entity: sensor.outdoor_temperature, visual: ring, min: -10, max: 40 }
      - { entity: sensor.outdoor_humidity, visual: ring }
      - { entity: sensor.wind_gust, name: Gusts }
```

:::

## Reference

### Card options

| Option                                   | Default         | Description                                                                                                                        |
| ---------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                 |                 | The weather entity (required).                                                                                                     |
| `sections`                               |                 | The sections, rendered in this order (see below). Without sections the card is a tile.                                             |
| `name`                                   | friendly name   | Tile: the name. Hero: the first line, the condition then moves to the second line. Template allowed.                               |
| `secondary`                              | see description | The line under the name (tile: `temperature · condition`) or the temperature (hero: labels · high / low). Template allowed.        |
| `color`                                  | primary         | Fixed condition colour; overrides rules.                                                                                           |
| `decimals`                               | as reported     | Decimals of the temperature.                                                                                                       |
| `rules`                                  |                 | [Rules](/cards/entity-options#rules) on the condition (`state: rainy` …): colour, icon, label and `tint_card`. First match wins.   |
| `temperature_rules`                      |                 | Rules on the temperature (`below` / `above`): colour of the value, the temperature line and the forecast bars, label, `tint_card`. |
| `title` / `icon` / `header_entities`     |                 | The header, like the [group card](/cards/entity-group-card#card-options). Templates allowed.                                       |
| `tap_action` …                           | `more-info`     | Actions of the lead and defaults for every entity, see the [entity options](/cards/entity-options#actions).                        |
| `columns` / `align`                      | per layout      | Defaults for the entity sections, see the [group card](/cards/entity-group-card#card-options).                                     |
| `show_name` / `show_value` / `show_icon` | per layout      | Default [item options](/cards/entity-options#item-options) for every entity section.                                               |
| `hours_to_show` / `bucket_minutes`       | `24` / `60`     | History window of sparklines, columns and strips inside entity sections.                                                           |

### Section `hero`

| Option                        | Default    | Description                                                                    |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `title`                       |            | Line above the section.                                                        |
| `name` / `secondary`          | the card's | Overrides of the card's `name` / `secondary` for this lead. Templates allowed. |
| `rules` / `temperature_rules` | the card's | Condition / temperature rules for this section only.                           |

### Sections `row`, `list`, `table`, `grid`, `column`

The keys of a [sections card](/cards/entity-sections-card#section-options) section (`entities`, `align`, `columns`, `divider`, item options) plus `title`. Entries: a weather attribute name, an entity id, or an entity item (without `entity` it reads the weather entity, with `attribute`). Row items show their value by default.

### Section `trend`

| Option                                         | Default                            | Description                                                                                                                                              |
| ---------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                                         | `daily`                            | `hourly` or `daily`.                                                                                                                                     |
| `hours_to_show` / `days`                       | `12` / `7`                         | 1 to 48 hours from the current hour / 1 to 10 days, today first.                                                                                         |
| `show`                                         | `[temperature, precipitation]`     | The lines, in this order, like the multi trend card's `entities`: `temperature`, `precipitation`, `probability`, `wind`, or `{ quantity, name, color }`. |
| `layout` / `x_axis` / `y_axis` / `show_legend` | `auto` / `true` / `false` / `true` | The multi trend card's plot options.                                                                                                                     |
| `title`                                        | "Next N hours" / "N days"          | Line above the section.                                                                                                                                  |
| `rules` / `temperature_rules`                  | the card's                         | Condition / temperature rules for this section only.                                                                                                     |

### Section `forecast`

| Option                        | Default                   | Description                                                            |
| ----------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `mode`                        | `daily`                   | `hourly` or `daily`.                                                   |
| `layout`                      | `vertical`                | `vertical` (rows) or `horizontal` (columns).                           |
| `hours_to_show` / `days`      | `12` / `7`                | 1 to 48 hours from the current hour / 1 to 10 days, today first.       |
| `show`                        | `[probability]`           | Rain figures per row: `probability`, `precipitation`; `[]` hides them. |
| `title`                       | "Next N hours" / "N days" | Line above the section.                                                |
| `rules` / `temperature_rules` | the card's                | Condition / temperature rules for this section only.                   |

The forecast comes from Home Assistant's forecast subscription, so it is the same data the built-in weather card shows, in the entity's own units; entities with a twice-daily forecast are summarised per day. An entity without an hourly or daily forecast shows "no forecast" in that section. Tapping the lead opens the more-info dialog of the weather entity. The card takes 6 columns × 1 row as a tile and 12 columns with `rows: auto` with sections; `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod` pass through.
