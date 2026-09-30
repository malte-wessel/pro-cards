# Weather Card

`custom:weather-card` shows one weather entity: the current conditions as a tile or a hero lead with the big temperature, weather attributes as items, and the forecast Home Assistant provides for the entity as an hourly chart and a daily list. It is built from the same parts as the [entity cards](/cards/entity-card): rules, templates, header entities and entity sections all work the same way. YAML only.

## Minimal

The entity alone makes a tile: the condition icon, the name and "temperature · condition" on one row of the sections grid.

::: live

```yaml
type: custom:weather-card
entity: weather.home
```

:::

## Hero

`layout: hero` (the default as soon as there is a `title`, `attributes` or `sections`) shows the condition, the big temperature and today's high and low. `name` puts your own words on the first line, the condition then moves to the second.

::: live

```yaml
type: custom:weather-card
entity: weather.home
layout: hero
```

:::

## Attributes

`attributes` lists items under the lead. A plain name is an attribute of the weather entity with a translated name, an icon and the entity's unit: `humidity`, `pressure`, `wind_speed`, `wind_gust_speed`, `wind_bearing`, `apparent_temperature`, `dew_point`, `uv_index`, `cloud_coverage`, `visibility`, `ozone`. An object is an [entity](/cards/entity-options) with every option the entity cards know, so a sensor next to the weather station fits in too. `attributes_layout: list` stacks them as rows.

::: live

```yaml
type: custom:weather-card
entity: weather.home
attributes:
  - humidity
  - wind_speed
  - pressure
  - { entity: sensor.uv_index, name: UV index, rules: [{ below: 3, color: green, label: Low }] }
```

:::

## Daily forecast

A `daily` section draws one row per day: the weekday, the condition, the rain chance and a bar from the low to the high on one scale for every day, so a warm day stands out. `days` takes 1 to 10, `show` picks the rain figures (`probability`, `precipitation`, or `[]` for none). `layout: columns` turns the bars upright, `layout: chart` draws highs and lows as lines.

::: live

```yaml
type: custom:weather-card
entity: weather.home
sections:
  - { type: daily, days: 7, show: [probability, precipitation] }
```

:::

## Hourly forecast

An `hourly` section shows the next `hours_to_show` hours (1 to 48). The default `visual: chart` has one lane per entry of `show`: the temperature as a line with its values, rain as columns, the rain chance as a dotted line and the wind as a line. Hover or touch the chart for the condition and every value at that hour. `visual: sparkline` draws just the temperature, `visual: columns` just the rain, both like the entity cards do it.

::: live

```yaml
type: custom:weather-card
entity: weather.home
sections:
  - { type: hourly, hours_to_show: 12, show: [temperature, precipitation, wind] }
```

:::

## Forecast charts anywhere

Each quantity of the hourly chart can be its own section: `type: temperature`, `precipitation`, `probability` or `wind`. Such a section has a title line (the quantity's name, or your `title`, and "next N h"), the same `hours_to_show` and `visual` options as the hourly section, and one lane. Sections render in the order written, so a chart can sit between the daily list and an entity group.

::: live

```yaml
type: custom:weather-card
entity: weather.home
sections:
  - { type: temperature, hours_to_show: 12 }
  - { type: daily, days: 5 }
  - { type: precipitation, hours_to_show: 24, visual: columns }
  - { type: wind, visual: sparkline, title: Breeze }
```

:::

## Rules and colours

`rules` match the condition (`state: rainy`, `state: lightning-rainy` …) and set colour, icon and label of the lead, or tint the whole card. `temperature_rules` match the temperature with `below` / `above` and colour the value, the temperature line and the daily bars, with a label next to the high and low. `secondary` replaces the line under the temperature; it can be a template.

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
  - { type: daily, days: 5 }
```

:::

## Entity sections

A section without `type` (or with `type: entities`) is an entity group exactly like a section of the [sections card](/cards/entity-sections-card): a `layout`, `entities` and the item options, plus a `title` above it. Sections render in the order written, so the forecast can sit between groups.

::: live

```yaml
type: custom:weather-card
entity: weather.home
title: Home
header_entities:
  - { entity: sun.sun, attribute: elevation, icon: mdi:weather-sunset-down, color: amber }
secondary: "feels like {{ state_attr('weather.home', 'apparent_temperature') }}°"
attributes: [humidity, wind_speed]
sections:
  - { type: hourly, hours_to_show: 12 }
  - type: entities
    title: Garden station
    layout: row
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
| `layout`                                 | `tile` / `hero` | `tile` when nothing but the entity keys is set, `hero` once there is a `title`, `attributes` or `sections`.                        |
| `name`                                   | friendly name   | Tile: the name. Hero: the first line, the condition then moves to the second line. Template allowed.                               |
| `secondary`                              | see description | The line under the name (tile: `temperature · condition`) or the temperature (hero: labels · high / low). Template allowed.        |
| `color`                                  | primary         | Fixed condition colour; overrides rules.                                                                                           |
| `decimals`                               | as reported     | Decimals of the temperature.                                                                                                       |
| `rules`                                  |                 | [Rules](/cards/entity-options#rules) on the condition (`state: rainy` …): colour, icon, label and `tint_card`. First match wins.   |
| `temperature_rules`                      |                 | Rules on the temperature (`below` / `above`): colour of the value, the temperature line and the daily bars, label and `tint_card`. |
| `attributes`                             |                 | Items under the lead: an attribute name of the weather entity or an [entity](/cards/entity-options).                               |
| `attributes_layout`                      | `row`           | `row` or `list`.                                                                                                                   |
| `sections`                               |                 | List of sections: `hourly`, `daily` or an entity group (see below).                                                                |
| `title` / `icon` / `header_entities`     |                 | The header, like the [group card](/cards/entity-group-card#card-options). Templates allowed.                                       |
| `tap_action` …                           | `more-info`     | Actions of the lead and defaults for every entity, see the [entity options](/cards/entity-options#actions).                        |
| `columns` / `align`                      | per layout      | Defaults for the entity sections, see the [group card](/cards/entity-group-card#card-options).                                     |
| `show_name` / `show_value` / `show_icon` | per layout      | Default [item options](/cards/entity-options#item-options) for the attributes and every entity section.                            |
| `hours_to_show` / `bucket_minutes`       | `24` / `60`     | History window of sparklines, columns and strips inside entity sections.                                                           |

### Hourly section

| Option           | Default                        | Description                                                                                  |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `type`           |                                | `hourly`                                                                                     |
| `hours_to_show`  | `12`                           | 1 to 48 hours from the current hour.                                                         |
| `visual`         | `chart`                        | `chart` (lanes per `show`, tooltip), `sparkline` (temperature) or `columns` (rain per hour). |
| `show`           | `[temperature, precipitation]` | Lanes of the chart, in this order: `temperature`, `precipitation`, `probability`, `wind`.    |
| `bucket_minutes` | `60`                           | Bucket size of `columns`.                                                                    |

### Chart section

One quantity as its own hourly chart: `type` is `temperature`, `precipitation`, `probability` or `wind`.

| Option           | Default         | Description                                                          |
| ---------------- | --------------- | -------------------------------------------------------------------- |
| `type`           |                 | `temperature`, `precipitation`, `probability` or `wind`              |
| `title`          | quantity's name | Left text of the title line; "next N h" sits on the right.           |
| `hours_to_show`  | `12`            | 1 to 48 hours from the current hour.                                 |
| `visual`         | `chart`         | `chart` (one lane, tooltip), `sparkline` (line) or `columns` (bars). |
| `bucket_minutes` | `60`            | Bucket size of `columns`.                                            |

### Daily section

| Option   | Default         | Description                                                                                     |
| -------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `type`   |                 | `daily`                                                                                         |
| `days`   | `7`             | 1 to 10 days, today first. Entities with a twice-daily forecast are summarised per day.         |
| `layout` | `list`          | `list` (range bars), `columns` (upright bars) or `chart` (highs and lows as lines, rain below). |
| `show`   | `[probability]` | Rain figures per day: `probability`, `precipitation`; `[]` hides them.                          |

### Entity section

The keys of a [sections card](/cards/entity-sections-card#section-options) section (`layout`, `entities`, `align`, `columns`, `divider`, item options) plus an optional `title` line above the group. `type: entities` may be given or left out.

The forecast comes from Home Assistant's forecast subscription, so it is the same data the built-in weather card shows, in the entity's own units. An entity without an hourly or daily forecast shows "no forecast" in that section. Tapping the lead opens the more-info dialog of the weather entity. The card takes 6 columns × 1 row as a tile and 12 columns with `rows: auto` as a hero; `grid_options`, `visibility`, `layout_options`, `view_layout` and `card_mod` pass through.
