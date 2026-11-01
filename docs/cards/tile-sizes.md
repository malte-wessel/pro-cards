---
outline: [2, 2]
---

# Tile sizes

How a [tile](/cards/tile-card) fits its size, then every [poster type](/cards/tile-types) at six sizes in one section. First three horizontal: 12 × 1 (the whole section), 6 × 1 (the default's width) and 6 × 2. Then three vertical: 6 × 2, 6 × 3 and 4 × 2.

A type that asks for more room shows the sizes it takes instead, as Home Assistant draws a smaller one at the least a card asks for: a trend's lines take two rows, three vertical; a vertical tile with a control takes three rows, six columns with a stepper, buttons or speeds.

Where a type's status fits as a badge beside the whole name, the tile shows it so (`status_badge: true`): on the whole section and on most vertical tiles. At half a section it stays on the line, where a badge would cut the name; see [Status and badges](/cards/tile-custom#status-and-badges).

## How a tile fits its size

A tile takes half a section (six columns), and its height follows its content (`rows: auto`): one 56 px row for the icon, the name and the line, more for what sits below the line.

- **Below the line** go a picture (`visual`, `show_picture`) and a control at `block` (a slider). A tile with a plot or a picture asks the grid for two rows at least.
- **At the end of the line** go the type's controls. On a narrow tile they move under the line rather than squeeze the name, and the tile grows by their height. A tile with a control on its line asks the grid for more columns: four for a switch or a hold, six for anything wider (a stepper, speeds, buttons).
- **Without room under the line** (a fixed row, a card around it giving less), the controls stay on the line beside the name, cut to 40 px at least. Where even that does not fit, they are left out, and a tap opens more-info with them.
- **The line** is cut at its end where it is too long, and the name above it too.

`grid_options` sets another size. Beside a taller card, or given more rows than its content needs, the tile stretches to the row's height and centres its content; `fill_height: false` keeps its own height, see [Filling the height](/guide/sizing#filling-the-height). A card around it, such as a swipe card or a stack, may give it less than it asks for.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: light.living_room
  fill_height: false
  grid_options: { columns: 6, rows: 2 }
```

:::

## A vertical tile

`vertical: true` puts the icon on top, with the name and the line centred under it and the controls under them, as Home Assistant's own tile does. Its line is narrow: it shows the value and the status, not what the type adds after them (a `secondary` you write stays).

A vertical tile takes a quarter of a section and two rows at least. A control under the name takes a third row, a plot or a picture one more. A stepper, a select, buttons or speeds need half a section across it, so with one of them it takes six columns.

## Entity

A plain tile fits any of them; its content centres in a taller one.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  vertical: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  vertical: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_temperature
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Air quality

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Home battery

The line holds the charge, Discharging and the power: at 6 × 1 it is cut at its end.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  power: sensor.battery_power
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  power: sensor.battery_power
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  power: sensor.battery_power
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  power: sensor.battery_power
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  power: sensor.battery_power
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  power: sensor.battery_power
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Weather

Without `show_picture`, the condition's picture, the temperature and the condition.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: weather.home
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: weather.home
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: weather.home
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: weather.home
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: weather.home
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Sun

::: live

```yaml
- type: custom:tile-card-pro
  entity: sun.sun
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sun.sun
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sun.sun
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sun.sun
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sun.sun
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sun.sun
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Wind

The direction and the gusts are the type's line: the vertical tiles leave them out.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Rain

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Trend

Its lines are its picture, so it takes two rows at least, three vertical: 12 × 2 and 6 × 2, then 6 × 3 and 4 × 3.

::: live

```yaml
- type: custom:tile-card-pro
  poster: trend
  name: Temperatures
  series: [sensor.living_room_temperature, sensor.outdoor_temperature]
  status_badge: true
  grid_options: { columns: 12, rows: 2 }
- type: custom:tile-card-pro
  poster: trend
  name: Temperatures
  series: [sensor.living_room_temperature, sensor.outdoor_temperature]
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  poster: trend
  name: Temperatures
  series: [sensor.living_room_temperature, sensor.outdoor_temperature]
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  poster: trend
  name: Temperatures
  series: [sensor.living_room_temperature, sensor.outdoor_temperature]
  vertical: true
  grid_options: { columns: 4, rows: 3 }
```

:::

## Light

The switch keeps to the line at every width here, and the glow fills whatever height the tile has. Vertical, the switch takes a third row: 6 × 3 and 4 × 3.

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: light.living_room
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: light.living_room
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 3 }
```

:::

## Fan

At 6 × 1 on this section its controls have no room: the tile is too short for them under the line and too narrow beside the name, so they are left out and a tap opens more-info. On a wider section they keep to the line; two rows or the whole width bring them back. Vertical, they take half a section and a third row: 6 × 3.

::: live

```yaml
- type: custom:tile-card-pro
  entity: fan.living_room
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: fan.living_room
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
```

:::

## Climate

At 6 × 1 on this section its controls have no room: the tile is too short for them under the line and too narrow beside the name, so they are left out and a tap opens more-info. On a wider section they keep to the line; two rows or the whole width bring them back. Vertical, they take half a section and a third row: 6 × 3.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: climate.living_room
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
```

:::

## Lock

::: live

```yaml
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: lock.front_door
  vertical: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: lock.front_door
  vertical: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: lock.front_door
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Alarm

::: live

```yaml
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  vertical: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  vertical: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Person

::: live

```yaml
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: person.malte
  vertical: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: person.malte
  vertical: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: person.malte
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Media player

At 6 × 1 on this section its controls have no room: the tile is too short for them under the line and too narrow beside the name, so they are left out and a tap opens more-info. On a wider section they keep to the line; two rows or the whole width bring them back. Vertical, they take half a section and a third row: 6 × 3. The progress along the bottom edge takes no room of its own.

::: live

```yaml
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
```

:::

## Cover

At 6 × 1 on this section its controls have no room: the tile is too short for them under the line and too narrow beside the name, so they are left out and a tap opens more-info. On a wider section they keep to the line; two rows or the whole width bring them back. Vertical, they take half a section and a third row: 6 × 3.

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.office_blinds
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: cover.office_blinds
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: cover.office_blinds
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: cover.office_blinds
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
```

:::

## Vacuum

Its two buttons keep to the line at 6 × 1, the name and the line giving way to them. Vertical, they take half a section and a third row: 6 × 3.

::: live

```yaml
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: vacuum.robot
  vertical: true
  grid_options: { columns: 6, rows: 3 }
```

:::

## Grid

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Solar

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  today: sensor.energy_today
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  today: sensor.energy_today
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  today: sensor.energy_today
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  today: sensor.energy_today
  vertical: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  today: sensor.energy_today
  vertical: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  today: sensor.energy_today
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Car

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  vertical: true
  status_badge: true
  grid_options: { columns: 4, rows: 2 }
```

:::

## Appliance

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  status_badge: true
  grid_options: { columns: 12, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  grid_options: { columns: 6, rows: 1 }
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 2 }
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  vertical: true
  status_badge: true
  grid_options: { columns: 6, rows: 3 }
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  vertical: true
  grid_options: { columns: 4, rows: 2 }
```

:::
