---
outline: [2, 2]
---

# Tile types

A tile takes the [poster types](/cards/poster-types): what the entity is, and what the [tile card](/cards/tile-card) draws for it. This page shows every type on a tile. Each type's own options (the entities it reads, its `variant`) are the poster's, listed on [Poster types](/cards/poster-types).

A type fills a tile as it fills a poster, less what needs a poster's room:

- **The icon:** the type's own. A fan, a vacuum, a lawn mower and an appliance move while they run; wind and rain animate theirs. A media player shows its cover art, a person their picture.
- **The line:** the type's value, then its status (a rule's label, Heating, Cleaning, Exporting), then what it puts under a poster's value (the direction and gusts, today's total, the battery and the room).
- **The controls:** those a type puts beside a poster's value, at the end of the line. See [Tile controls](/cards/tile-controls).
- **The edge:** a light glows from the bottom of the tile, as bright as it is, and a media player's progress runs along the bottom edge.
- **The picture** (a curve, a trend's lines) only with `show_picture: true`, on a second row. The backdrop (a cover's window, a robot's path, a wind field) and the badges are a poster's alone.

The type is detected from the entity's domain, then its device class, else it is `entity`. `poster` sets a type by name.

## Entity

**Reads** any entity.

The fallback: the entity's icon, name and value, then the matching rule's label. `visual` adds a picture below the line: `sparkline`, `columns`, `strip`, `bar` or `gauge`. See [Poster types: Entity](/cards/poster-types#entity).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: binary_sensor.door_front
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.washer_remaining
  name: Laundry
  icon: mdi:washing-machine
  visual: bar
  max: 120
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_humidity
  name: Humidity
  visual: gauge
  grid_options: { columns: 6 }
```

:::

## Battery

**Reads** a battery's charge (device class `battery`).

The charge, orange and Low below 20 %, red and Critical below 10 %. A template sensor often has no device class: `poster: battery` makes it a battery, like the phone here. The remote is low, the smoke detector critical. See [Poster types: Battery](/cards/poster-types#battery).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.robot_battery
  name: Robot
  icon: mdi:robot-vacuum
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.phone_battery
  name: Phone
  poster: battery
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.remote_battery
  name: Remote
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.smoke_detector_battery
  name: Smoke detector
  grid_options: { columns: 6 }
```

:::

With a power sensor, it is a home battery: Charging or Discharging and its power follow the charge on the line. `power` is positive while it charges; `charge` and `discharge` take a sensor each instead. Without them, the type finds the power on the battery's device.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.balcony_battery_soc
  name: Balcony battery
  status_badge: true
  charge: sensor.balcony_battery_charge_power
  discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: sensor.battery_soc
  name: Home battery
  status_badge: true
  grid_options: { columns: 12 }
```

:::

## Air quality

**Reads** a CO₂, PM2.5, PM10 or air quality index sensor (by device class).

The value, coloured and labelled by the bands of its standard. See [Poster types: Air quality](/cards/poster-types#air-quality).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.office_co2
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.living_room_pm25
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.outdoor_aqi
  grid_options: { columns: 6 }
```

:::

## Weather

**Reads** a `weather.*` entity.

The condition's picture as the icon, the temperature, the condition, and today's high and low. `show_picture: true` draws the next hours as a curve, `hours_to_show` sets how far it looks ahead, and `show_entity_picture: false` draws the condition's icon in place of its picture. See [Poster types: Weather](/cards/poster-types#weather).

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  name: Next hours
  show_picture: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  name: Next day
  show_picture: true
  hours_to_show: 24
  show_entity_picture: false
  status_badge: true
  grid_options: { columns: 12 }
```

:::

`state` rules match the condition, `below` and `above` the temperature; a rule's label takes the condition's place on the line. With rules of your own, copy the [condition colours](/cards/poster-types#predefined-rules) to keep them:

::: live

```yaml
type: custom:tile-card-pro
entity: weather.home
name: Outside
rules:
  - { state: lightning-rainy, color: red, label: Storm }
  - { state: rainy, color: blue, icon: mdi:umbrella }
  - { below: 5, color: light-blue, label: Frost risk }
  - { above: 25, color: orange, label: Hot }
  - { above: 15, color: amber, label: Mild }
grid_options: { columns: 6 }
```

:::

## Sun

**Reads** `sun.sun` (or `poster: sun`).

The next sunrise or sunset as the name, its time, and how long until then. `show_picture: true` draws the day's curve with the sun on it. See [Poster types: Sun](/cards/poster-types#sun).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sun.sun
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sun.sun
  show_picture: true
  grid_options: { columns: 6 }
```

:::

## Wind

**Reads** a wind speed sensor (device class `wind_speed`), or a `weather.*` entity with `poster: wind`.

Particles cross the icon in the wind's direction, as fast as it blows. The line gives the speed, the wind's label, its direction and the gusts, which the type finds on the same device (`direction`, `gust`; `false` leaves one out). A `variant` draws the poster's field, which a tile has no room for: with one, the icon is an arrow turned to where the wind blows. See [Poster types: Wind](/cards/poster-types#wind).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Garden
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.coast_wind_speed
  name: Coast
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Arrow
  variant: lines
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: weather.home
  poster: wind
  name: Forecast wind
  grid_options: { columns: 6 }
```

:::

Rules of your own take the place of the wind's labels:

::: live

```yaml
type: custom:tile-card-pro
entity: sensor.wind_speed
name: Wind
gust: false
rules:
  - { below: 20, color: teal, label: Fine for sailing }
  - { above: 20, color: orange, label: Reef the sails }
grid_options: { columns: 6 }
```

:::

## Rain

**Reads** a rain rate sensor (device class `precipitation_intensity`).

Drops fall through the icon as fast as it rains. The line gives the rate, its label and today's total, which the type finds on the same device (`today`). See [Poster types: Rain](/cards/poster-types#rain).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  name: Roof
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.rain_rate
  name: Garden
  status_badge: true
  grid_options: { columns: 6 }
```

:::

## Trend

**Reads** its own entities (`poster: trend`).

The first series' value, the time window, and the lines of its `series` on one scale below. A trend's tile draws its lines by default: without them it is a value alone, and `show_picture: false` leaves them out. See [Poster types: Trend](/cards/poster-types#trend).

::: live

```yaml
type: custom:tile-card-pro
poster: trend
name: Temperatures
series:
  - { entity: sensor.outdoor_temperature, name: Outside, color: orange }
  - { entity: sensor.dew_point, name: Dew point, color: teal }
```

:::

## Light

**Reads** a `light.*` entity.

Its brightness and On or Off, a switch at the end of the line, and a glow from the tile's bottom edge in the light's own colour, as bright as it is. `control: slider` puts a dimmer below the line instead of the switch; `visual: none` drops the glow. See [Poster types: Light](/cards/poster-types#light).

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: light.kitchen
  grid_options: { columns: 6 }
```

:::

## Fan

**Reads** a `fan.*` entity.

The blades in the icon turn at the fan's speed. The line gives the speed, and its speeds sit at the end of the line, under it on a narrow tile. See [Poster types: Fan](/cards/poster-types#fan).

::: live

```yaml
- type: custom:tile-card-pro
  entity: fan.living_room
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: fan.bedroom
  grid_options: { columns: 12 }
```

:::

## Climate

**Reads** a `climate.*` entity.

The current temperature, what it is doing (Heating, Cooling, Idle), and a stepper for the target at the end of the line. The icon's badge says what it is doing too; `status_badge: true` puts the status in a tag at the end of the first row, in place of on the line ([Badges](/cards/tile-badges)). See [Poster types: Climate](/cards/poster-types#climate).

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  name: Living room
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: climate.bedroom
  grid_options: { columns: 12 }
```

:::

## Lock

**Reads** a `lock.*` entity.

Locked or Unlocked; a jammed lock in red. Hold the padlock to lock or unlock: a ring fills around it and the lock runs when it is full. See [Poster types: Lock](/cards/poster-types#lock).

::: live

```yaml
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: lock.back_door
  grid_options: { columns: 6 }
```

:::

## Alarm

**Reads** an `alarm_control_panel.*` entity.

Its state (Disarmed, Armed away …); a triggered alarm in red. Hold the shield to arm or disarm, unless the panel wants a code. See [Poster types: Alarm](/cards/poster-types#alarm).

::: live

```yaml
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: alarm_control_panel.garage
  grid_options: { columns: 6 }
```

:::

## Person

**Reads** a `person.*` entity.

Their picture as the icon, with their zone's badge on it, their zone and for how long they have been there. A person without a picture has the person icon. See [Poster types: Person](/cards/poster-types#person).

::: live

```yaml
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: person.kim
  grid_options: { columns: 6 }
```

:::

`show_entity_picture: false` draws the icon in place of the picture:

::: live

```yaml
type: custom:tile-card-pro
entity: person.malte
show_entity_picture: false
grid_options: { columns: 6 }
```

:::

## Media player

**Reads** a `media_player.*` entity.

The cover art as the icon and the tile's colour, the title, Playing or Paused, the artist and the album. Previous, play / pause and next sit at the end of the line, and the track's progress runs along the bottom edge. `control: slider` puts the volume below the line instead. See [Poster types: Media player](/cards/poster-types#media-player).

::: live

```yaml
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: media_player.kitchen_speaker
  status_badge: true
  grid_options: { columns: 12 }
```

:::

Other players, the kitchen's without its buttons (`control: false`):

::: live

```yaml
- type: custom:tile-card-pro
  entity: media_player.bedroom_speaker
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: media_player.kitchen_speaker
  control: false
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: media_player.office_speaker
  grid_options: { columns: 6 }
```

:::

`show_entity_picture: false` draws the player's icon in place of the art:

::: live

```yaml
type: custom:tile-card-pro
entity: media_player.kitchen_speaker
show_entity_picture: false
grid_options: { columns: 12 }
```

:::

## Cover

**Reads** a `cover.*` entity.

Its position and Open, Closed, Opening or Closing, with open, stop and close at the end of the line; the icon is Home Assistant's for its device class and state. `control: slider` puts the position below the line instead. See [Poster types: Cover](/cards/poster-types#cover).

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  name: Living room
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.skylight
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.driveway_gate
  status_badge: true
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: cover.garage_door
  grid_options: { columns: 12 }
```

:::

## Vacuum and lawn mower

**Reads** a `vacuum.*` or `lawn_mower.*` entity.

The robot in the icon moves while it works. The line gives its state, its battery and the room, where the integration reports them; an error in red. Start / pause and back to the dock sit at the end of the line. See [Poster types: Vacuum and lawn mower](/cards/poster-types#vacuum-and-lawn-mower).

::: live

```yaml
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 12 }
- type: custom:tile-card-pro
  entity: vacuum.basement
  grid_options: { columns: 12 }
```

:::

## Grid

**Reads** a power sensor, + importing and − exporting (`poster: grid`), or `import` and `export`.

The power in W or kW, Importing or Exporting, in Home Assistant's energy colours. See [Poster types: Grid](/cards/poster-types#grid).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.grid_power
  poster: grid
  name: Grid
  status_badge: true
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  name: Grid
  poster: grid
  import: sensor.grid_import_power
  export: sensor.grid_export_power
  status_badge: true
  grid_options: { columns: 6 }
```

:::

## Solar

**Reads** a power sensor (`poster: solar`).

The power now in the solar colour, and today's energy. `show_picture: true` draws today's production. See [Poster types: Solar](/cards/poster-types#solar).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  name: Solar
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.solar_power
  poster: solar
  name: Today
  show_picture: true
  grid_options: { columns: 6 }
```

:::

## Car

**Reads** its charge (`poster: car`) and the inputs it finds on its device.

The charge, Charging, Plugged in or the zone while away, and the range. See [Poster types: Car](/cards/poster-types#car).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  poster: car
  name: EV
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.van_battery
  poster: car
  name: Van
  grid_options: { columns: 6 }
```

:::

## Appliance

**Reads** a power sensor (`poster: appliance`).

The device in the icon moves while it runs above `running_above` (a pump's impeller turns, a drum shakes). The line gives how long it has run, Running or Off, and the energy of this run. See [Poster types: Appliance](/cards/poster-types#appliance).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.washer_power
  poster: appliance
  variant: washer
  name: Washer
  grid_options: { columns: 6 }
- type: custom:tile-card-pro
  entity: sensor.heat_pump_power
  poster: appliance
  variant: heat_pump
  name: Heat pump
  grid_options: { columns: 6 }
```

:::
