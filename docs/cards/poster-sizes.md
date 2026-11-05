---
outline: [2, 2]
---

# Poster sizes

How a [poster](/cards/poster-card) fits its size, then every [kind](/cards/poster-types) at four sizes in one section: 6 × 3 (the default), 6 × 4, 12 × 3 (the full section) and 8 × 3 (about the size of the showcases' posters).

## How a poster fits its size

A poster takes half a section (six columns) and three rows, by default and at least: the icon and its badges, the name, the large value and the visual need that much room. An entity in less room is what a tile is for, such as the [tile](/cards/tile-card). `grid_options` makes a poster larger, and the dashboard editor does not let it get smaller. A card around it, such as a swipe card or a stack, may still give it less: the poster then fits its content as well as it can.

The content sits at the bottom of the card. More rows give the visual more room, and the icon and the badges stay at the top. Where the content needs more room than the card has, the value shrinks and a slider may be hidden (more-info still has it).

`rows: auto` makes the poster as tall as its content; so does a masonry view or a vertical stack. Beside a taller card, the poster stretches to the row's height. `fill_height: false` keeps its own height, see [Filling the height](/guide/sizing#filling-the-height). The player at three rows, its volume hidden, and with `rows: auto`:

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: auto }
```

:::

## Entity

A sensor with its history and badges: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 1000, color: green, status: Low }
    - { below: 3000, color: amber, status: Normal }
    - { above: 3000, color: red, status: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 1000, color: green, status: Low }
    - { below: 3000, color: amber, status: Normal }
    - { above: 3000, color: red, status: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 1000, color: green, status: Low }
    - { below: 3000, color: amber, status: Normal }
    - { above: 3000, color: red, status: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: { type: sparkline, hours: 12 }
  rules:
    - { below: 1000, color: green, status: Low }
    - { below: 3000, color: amber, status: Normal }
    - { above: 3000, color: red, status: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 8, rows: 3 }
```

:::

## Air quality

CO₂ with its bands: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 8, rows: 3 }
```

:::

## Home battery

The strip and its power: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  inputs:
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  inputs:
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  inputs:
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  inputs:
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 8, rows: 3 }
```

:::

## Weather

The condition, the temperature and the next hours: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 8, rows: 3 }
```

:::

## Sun

The next event and the day's curve: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 8, rows: 3 }
```

:::

## Wind

The field behind the poster: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 8, rows: 3 }
```

:::

## Rain

The drops behind the poster: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  visual: { type: flow, variant: drops }
  inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  visual: { type: flow, variant: drops }
  inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  visual: { type: flow, variant: drops }
  inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  visual: { type: flow, variant: drops }
  inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
  grid_options: { columns: 8, rows: 3 }
```

:::

## Trend

Several lines on one scale: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  kind: trend
  visual: { hours: 12 }
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  kind: trend
  visual: { hours: 12 }
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  kind: trend
  visual: { hours: 12 }
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  kind: trend
  visual: { hours: 12 }
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 8, rows: 3 }
```

:::

## Light

The glow and its controls: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 8, rows: 3 }
```

:::

## Fan

The blades and the speeds: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 8, rows: 3 }
```

:::

## Climate

The thermostat, warm while it heats: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 8, rows: 3 }
```

:::

## Lock

Held on the padlock: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 8, rows: 3 }
```

:::

## Alarm

Held on the shield: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 8, rows: 3 }
```

:::

## Person

The photo behind the poster: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 8, rows: 3 }
```

:::

## Media player

The art, the track and the transport: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 8, rows: 3 }
```

:::

## Cover

The blinds at their position: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 8, rows: 3 }
```

:::

## Vacuum

The path and the dock: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 8, rows: 3 }
```

:::

## Grid

The power line: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 8, rows: 3 }
```

:::

## Solar

The output and today's production: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 8, rows: 3 }
```

:::

## Car

The charge, the range and the status: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 8, rows: 3 }
```

:::

## Appliance

How long it runs and the energy of this run: 6 × 3, 6 × 4, 12 × 3 and 8 × 3.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  kind: heat_pump
  running_above: 50
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  kind: heat_pump
  running_above: 50
  grid_options: { columns: 6, rows: 4 }
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  kind: heat_pump
  running_above: 50
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  kind: heat_pump
  running_above: 50
  grid_options: { columns: 8, rows: 3 }
```

:::
