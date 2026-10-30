---
outline: [2, 2]
---

# Poster sizes

Every [poster type](/cards/poster-card#poster-types) at three sizes in one section of the sections grid: the default, six columns and three rows; twice as wide (twelve columns, the full section); and one step wider and a row higher (nine columns, four rows). The value fits the room each size gives, and every poster runs against the simulated home.

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

The cell and its power: 6 × 3, 12 × 3 and 9 × 4.

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
  entity: person.alex
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: person.alex
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: person.alex
  grid_options: { columns: 9, rows: 4 }
```

:::

## Media player

The art, the track and the transport: 6 × 3, 12 × 3 and 9 × 4.

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.living_room_tv
  grid_options: { columns: 6, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_tv
  grid_options: { columns: 12, rows: 3 }
- type: custom:poster-card-pro
  entity: media_player.living_room_tv
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
