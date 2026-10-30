---
outline: [2, 2]
---

# Poster sizes

How a [poster](/cards/poster-card) fits its size, then every [poster type](/cards/poster-types) at three sizes in one section: 6 × 3 (the default), 12 × 3 (the full section) and 9 × 4.

## How a poster fits its size

A poster takes six columns and three rows by default, and two rows at least. `grid_options` sets both. How narrow it can get in the dashboard editor depends on its control:

| Control                                                                           | Columns at least |
| --------------------------------------------------------------------------------- | ---------------- |
| none, or under the value                                                          | 3                |
| a switch or a hold beside the value                                               | 4                |
| anything wider beside the value: a stepper, a slider, segments, a select, buttons | 6                |

The icon's own actions, such as a lock's hold, take no room.

The content sits at the bottom of the card. More rows give the picture and the backdrop more room, and the icon and the badges stay at the top. On a short card the value shrinks and a slider may be hidden (more-info still has it).

`rows: auto` makes the poster as tall as its content. Beside a taller card, the poster stretches to the row's height. `fill_height: false` keeps its own height, see [Filling the height](/guide/sizing#filling-the-height). The player at two rows, its title smaller and its volume hidden, and with `rows: auto`:

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 2 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: auto }
```

:::

## Entity

A sensor with its history and badges: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 1000, color: green, label: Low }
    - { below: 3000, color: amber, label: Normal }
    - { above: 3000, color: red, label: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 1000, color: green, label: Low }
    - { below: 3000, color: amber, label: Normal }
    - { above: 3000, color: red, label: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.power_consumption
  name: Power
  visual: sparkline
  hours_to_show: 12
  rules:
    - { below: 1000, color: green, label: Low }
    - { below: 3000, color: amber, label: Normal }
    - { above: 3000, color: red, label: High }
  badges:
    - sensor.solar_power
  grid_options: { columns: 9, rows: 4 }
```

:::

## Air quality

CO₂ with its bands: 6 × 3, 12 × 3 and 9 × 4.

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
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 9, rows: 4 }
```

:::

## Home battery

The strip and its power: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  charge: sensor.balcony_battery_charge_power
  discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  charge: sensor.balcony_battery_charge_power
  discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Battery
  charge: sensor.balcony_battery_charge_power
  discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 9, rows: 4 }
```

:::

## Weather

The condition, the temperature and the next hours: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 9, rows: 4 }
```

:::

## Sun

The next event and the day's curve: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 9, rows: 4 }
```

:::

## Wind

The field behind the poster: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  variant: lines
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  variant: lines
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  variant: lines
  grid_options: { columns: 9, rows: 4 }
```

:::

## Rain

The drops behind the poster: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  variant: drops
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  variant: drops
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  variant: drops
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  grid_options: { columns: 9, rows: 4 }
```

:::

## Trend

Several lines on one scale: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  hours_to_show: 12
  poster: trend
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  hours_to_show: 12
  poster: trend
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  name: Outside
  icon: mdi:thermometer
  hours_to_show: 12
  poster: trend
  series:
    - { entity: sensor.outdoor_temperature, name: Temperature, color: orange }
    - { entity: sensor.dew_point, name: Dew point, color: teal }
  grid_options: { columns: 9, rows: 4 }
```

:::

## Light

The glow and its controls: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 9, rows: 4 }
```

:::

## Fan

The blades and the speeds: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 9, rows: 4 }
```

:::

## Climate

The thermostat and its dial: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 9, rows: 4 }
```

:::

## Lock

Held on the padlock: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 9, rows: 4 }
```

:::

## Alarm

Held on the shield: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 9, rows: 4 }
```

:::

## Person

The photo behind the poster: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 9, rows: 4 }
```

:::

## Media player

The art, the track and the transport: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 9, rows: 4 }
```

:::

## Cover

The blinds at their position: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office blinds
  grid_options: { columns: 9, rows: 4 }
```

:::

## Vacuum

The path and the dock: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 9, rows: 4 }
```

:::

## Grid

The power line: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  poster: grid
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  poster: grid
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  poster: grid
  grid_options: { columns: 9, rows: 4 }
```

:::

## Solar

The output and today's production: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  poster: solar
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  poster: solar
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  poster: solar
  grid_options: { columns: 9, rows: 4 }
```

:::

## Car

The charge, the range and the status: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  poster: car
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  poster: car
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  poster: car
  grid_options: { columns: 9, rows: 4 }
```

:::

## Appliance

How long it runs and the energy of this run: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  poster: appliance
  variant: heat_pump
  running_above: 50
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  poster: appliance
  variant: heat_pump
  running_above: 50
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  poster: appliance
  variant: heat_pump
  running_above: 50
  grid_options: { columns: 9, rows: 4 }
```

:::
