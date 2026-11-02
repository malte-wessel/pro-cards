---
outline: [2, 2]
---

# Kinds

A kind is what the entity is, and what the [poster card](/cards/poster-card) draws for it. This page shows every kind with what it reads and draws, and its own options.

A kind's options sit on the card like any other key. Where a kind reads other entities, it finds them on the same device as the poster's entity. With more than one match, none is used: set the key yourself, or `false` for none. What a kind draws in its two places, the `icon` and the `visual`, is its default: [The places](/cards/poster-custom#the-places) lists them, and a key of the card changes them.

The kind is detected from the entity's domain, then its device class, else it is `none`. `kind` sets it by name, for an entity without a device class or a kind that is never detected.

| Kind                                                                                                 | Detected by                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`none`](#none)                                                                                      | anything else                                                                  |
| [`battery`](#battery)                                                                                | device class `battery`                                                         |
| [`carbon_dioxide`, `pm25`, `pm10`, `aqi`](#air-quality)                                              | their device class                                                             |
| [`weather`](#weather), [`sun`](#sun), [`wind`](#wind), [`rain`](#rain)                               | `weather.*`, `sun.sun`, device classes `wind_speed`, `precipitation_intensity` |
| [`trend`](#trend)                                                                                    | never: `kind: trend` with its `series`                                         |
| [`light`](#light), [`fan`](#fan), [`climate`](#climate)                                              | domain                                                                         |
| [`lock`](#lock), [`alarm_control_panel`](#alarm), [`person`](#person)                                | domain                                                                         |
| [`media_player`](#media-player), [`cover`](#cover), [`vacuum`, `lawn_mower`](#vacuum-and-lawn-mower) | domain                                                                         |
| [`grid`](#grid), [`solar`](#solar), [`car`](#car), [`appliance`](#appliance)                         | never: set with `kind`                                                         |
| [`pump`, `washer`, `dryer`, `dishwasher`, `heat_pump`](#appliance)                                   | never: an appliance that is a device of its own                                |

## None

**Reads** any entity.

The fallback: the entity's icon, name and value. The status badge shows the matching rule's label. `visual` adds a [visual](/cards/poster-custom#a-visual): `sparkline`, `columns`, `strip`, `bar`, `gauge`, `segments`, or `glow`, a light from below as strong as the value. A numeric value takes `unit`, `decimals` and `rules`, as on every Pro card.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.washer_remaining
  name: Laundry
  icon: mdi:washing-machine
  visual: bar
  max: 120
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.outdoor_humidity
  name: Humidity
  visual: gauge
  grid_options: { columns: 6 }
```

:::

## Battery

**Reads** a sensor of device class `battery`.

A battery poster draws a strip of ten segments under the charge, filled to it. It turns orange and says _Low_ below 20 %, red and _Critical_ below 10 %. The labels follow the user's language; [Predefined rules](#predefined-rules) has the set to copy and change.

A template sensor often has no device class. `kind: battery` makes it a battery, like the phone here. The remote is low, the smoke detector critical:

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.robot_battery
  name: Robot
  icon: mdi:robot-vacuum
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.phone_battery
  name: Phone
  kind: battery
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.remote_battery
  name: Remote
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.smoke_detector_battery
  name: Smoke detector
  grid_options: { columns: 6 }
```

:::

With a power sensor, it is a home battery. The status says Charging or Discharging, with the power under the charge, and the next segment to fill pulses while power flows.

`power` is positive while the battery charges and negative while it discharges. The [power flow card](/cards/power-flow-card) reads a battery the other way round. Or give `charge` and `discharge`, a sensor each.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.balcony_battery_soc
  name: Balcony battery
  charge: sensor.balcony_battery_charge_power
  discharge: sensor.balcony_battery_discharge_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.battery_soc
  name: Home battery
  grid_options: { columns: 6 }
```

:::

### Options

These apply to a battery:

| Key                   | Takes                                              | Default                                |
| --------------------- | -------------------------------------------------- | -------------------------------------- |
| `power`               | a power sensor, positive while the battery charges | a power sensor on the battery's device |
| `charge`, `discharge` | a power sensor each, in place of `power`           | –                                      |

## Air quality

**Reads** a sensor of device class `carbon_dioxide`, `pm25`, `pm10` or `aqi`.

These kinds bring their own colour and label by value, from a standard where there is one:

- CO₂: from _Good_ to _Bad_ at 800, 1200 and 2000 ppm.
- PM2.5 and PM10: the WHO and EU bands.
- Air quality index: the US EPA's bands. _Hazardous_ pulses.

The labels follow the user's language. [Predefined rules](#predefined-rules) has the sets to copy and change.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.office_co2
  name: Office
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_pm25
  name: Fine dust
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.outdoor_aqi
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.bedroom_co2
  name: Bedroom
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.city_aqi
  name: City
  grid_options: { columns: 6 }
```

:::

## Weather

**Reads** a weather entity.

A weather entity shows Home Assistant's picture of the condition, and the condition as the status. The temperature is large, with today's high and low under it. Along the bottom, a curve shows the hourly forecast for the next 12 hours. Hover it to read an hour.

The condition sets the colour: amber in the sun, blue in the rain, deep orange in a thunderstorm. The curve is its `sparkline`: the hours ahead, not a history (a weather's state is a word); `visual: { hours: 24 }` sets how far it looks ahead, and `visual: { type: sparkline, src: sensor.outdoor_temperature }` plots a sensor's past instead. The picture is the icon's `image`: `icon: { type: icon }` draws mdi icons.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  icon: { type: icon }
  visual: { hours: 24 }
  grid_options: { columns: 6 }
```

:::

`state` rules match the condition, `below` and `above` the temperature. With rules of your own, copy the [condition colours](#predefined-rules) to keep them:

::: live

```yaml
type: custom:poster-card-pro
entity: weather.home
name: Outside
rules:
  - { state: lightning-rainy, color: red, label: Storm, pulse: true }
  - { state: rainy, color: blue, icon: mdi:umbrella }
  - { below: 5, color: light-blue, label: Frost risk }
  - { above: 25, color: orange, label: Hot }
  - { state: partlycloudy, color: light-blue }
```

:::

## Sun

**Reads** `sun.sun`, or no entity.

Use `sun.sun`, or `kind: sun` without an entity: the sun is then computed from Home Assistant's location. The icon is the sun or the moon. The value is the next sunrise or sunset with its time, and the status says how soon it comes.

Along the bottom runs the day's curve (the `sun` visual), with the sun where it is now. Hover it for the elevation. The poster is amber by day and indigo by night. `color` paints the curve and the poster.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  kind: sun
  color: orange
  grid_options: { columns: 6 }
```

:::

## Wind

**Reads** a `wind_speed` sensor or a weather entity.

A wind speed sensor, or a weather entity with `kind: wind`. The animated icon (`icon: { type: flow, variant: dots }`) turns where the wind blows and runs at its speed. The speed is large, with the direction and the gusts under it. Five bands of its speed colour and name it, from _Calm_ to _Stormy_, and from 50 km/h the whole poster turns red:

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Garden
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.coast_wind_speed
  name: Coast
  grid_options: { columns: 6 }
```

:::

The direction and the gusts come from the sensor's device, or from the weather entity.

`visual: { type: flow }` turns the whole poster into the animated field, and the icon becomes an arrow for the direction. Its `variant`, in the icon or behind the poster:

- `dots`
- `lines`: streamlines
- `swoosh`: strokes that draw themselves
- `vectors`: arrows

The animation is drawn in one place: a flow in both is a config error.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: lines }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Wind
  kind: wind
  visual: { type: flow, variant: swoosh }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  visual: { type: flow, variant: vectors }
  gust: false
  rules:
    - { below: 20, color: teal, label: Fine for sailing }
    - { above: 20, color: orange, label: Reef the sails }
  grid_options: { columns: 6 }
```

:::

### Options

| Key         | Takes                                                                                               | Default                                            |
| ----------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `icon`      | `{ type: flow, variant }`: the animated icon, `variant` one of `dots`, `lines`, `swoosh`, `vectors` | `{ type: flow, variant: dots }`                    |
| `visual`    | `{ type: flow, variant }`: the whole poster is the wind field                                       | none                                               |
| `direction` | a wind direction sensor, or `false`                                                                 | one on the sensor's device; a weather entity's own |
| `gust`      | a gust speed sensor, or `false`                                                                     | one on the sensor's device; a weather entity's own |

## Rain

**Reads** a `precipitation_intensity` sensor (mm/h or in/h).

A rain rate sensor. The animated icon (`icon: { type: flow, variant: drops }`) rains at the rate. The rate is large, with today's total under it. The rain's bands colour and name it, from _Dry_ to _Violent_, which pulses.

`wind` and `direction` slant the drops. `visual: { type: flow }` fills the whole poster with rain. Its `variant`, in the icon or behind the poster: `drops`, `ripples` or `fill`, a gauge that fills with today's total.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.rain_rate
  name: Garden
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Roof
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.carport_rain_rate
  name: Carport
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Roof
  visual: { type: flow, variant: drops }
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  grid_options: { columns: 6 }
```

:::

### Options

| Key         | Takes                                                                                     | Default                          |
| ----------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| `icon`      | `{ type: flow, variant }`: the animated icon, `variant` one of `drops`, `ripples`, `fill` | `{ type: flow, variant: drops }` |
| `visual`    | `{ type: flow, variant }`: the whole poster is the rain                                   | none                             |
| `today`     | a sensor of the day's total, or `false`                                                   | one on the sensor's device       |
| `wind`      | a wind speed sensor, to slant the drops                                                   | –                                |
| `direction` | a wind direction sensor                                                                   | –                                |

## Trend

**Reads** its own entities (`kind: trend`).

`kind: trend` draws the entities of its `series` on one scale, as lines along the bottom (its `sparkline` visual). Hover them to read every value at that time. The large value is the card's `entity`, else the first series. The status is the time window: `visual: { hours: 12 }` sets it, 6 hours by default.

A series takes `name`, `color`, `rules` and `visibility`, as on the [multi trend card](/cards/multi-trend-card). `color` may be a template.

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
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Rooms
  icon: mdi:home-thermometer
  kind: trend
  series:
    - { entity: sensor.living_room_temperature, name: Living room, color: green }
    - { entity: sensor.bedroom_temperature, name: Bedroom, color: indigo }
    - { entity: sensor.office_temperature, name: Office, color: orange }
  grid_options: { columns: 6 }
```

:::

### Options

| Key      | Takes                                                       | Default  |
| -------- | ----------------------------------------------------------- | -------- |
| `series` | entity ids, or `{ entity, name, color, rules, visibility }` | required |

## Light

**Reads** a light.

A light glows from the bottom of the card (its visual, `glow`). The glow takes the light's own colour, is as strong as its brightness and is gone while the light is off. The brightness is large, with the switch beside it and the brightness slider along the bottom. `control: false` leaves them out.

Another [visual](/cards/poster-custom#a-visual) takes the glow's place: `visual: bar` draws the brightness as a bar, `visual: false` draws nothing.

::: live

```yaml
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.kitchen
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.desk_lamp
  name: Desk
  control: false
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.office
  visual: bar
  grid_options: { columns: 6 }
```

:::

## Fan

**Reads** a fan.

A fan's blades turn at its speed and stand still while it is off. The speed is large, with a segment for each speed beside it.

::: live

```yaml
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: fan.bedroom
  grid_options: { columns: 6 }
```

:::

## Climate

**Reads** a climate entity.

A thermostat shows the current temperature large, with the target under it and a stepper beside them. The status says what it is doing: Heating, Idle or Cooling.

The card warms while it heats and cools while it cools: its visual is a `glow` of its own.

::: live

```yaml
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.bedroom
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.office
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.kitchen
  grid_options: { columns: 6 }
```

:::

## Lock

**Reads** a lock.

Hold the padlock icon to lock or unlock: a ring fills around it first ([Hold to confirm](/cards/poster-controls#hold-to-confirm)). The state is large, and a jammed lock pulses red.

The hold is the icon's default action, `icon: { hold_action: { action: toggle } }`. Set another [icon action](/cards/poster-custom#the-icon) to change it.

::: live

```yaml
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.garage_side_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.back_door
  grid_options: { columns: 6 }
```

:::

## Alarm

**Reads** an alarm control panel.

Hold the shield icon to arm the panel (away) or disarm it, as on the [lock](#lock). The state is large, red and pulsing while triggered, and a red `glow` pulses from the edges. A panel that wants a code has no hold: a tap opens Home Assistant's dialog with its keypad.

::: live

```yaml
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.studio
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.garage
  grid_options: { columns: 6 }
```

:::

## Person

**Reads** a person or a device tracker.

A person's picture is the icon (`icon: { type: image }`), and their photo fills the poster behind it, blurred (`visual: { type: image, blur: 20 }`). The zone is large, with how long they have been there under it. A person without a picture keeps their icon.

::: live

```yaml
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: person.kim
  grid_options: { columns: 6 }
```

:::

`visual: { blur: false }` shows the photo sharp. With `icon: false` the icon is left out, so nothing covers their face:

::: live

```yaml
type: custom:poster-card-pro
entity: person.malte
icon: false
visual: { blur: false }
```

:::

## Media player

**Reads** a media player.

A media player's cover art is the icon, and fills the poster behind it, blurred. It also gives the poster its colour. The title is large, with the artist and album under it. The transport sits beside them and the volume below. Where the card has no room for it, the volume is hidden (more-info still has it). A thin bar along the bottom edge follows the track while it plays. A player that is off shows its icon and the state.

::: live

```yaml
type: custom:poster-card-pro
entity: media_player.living_room_speaker
```

:::

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.bedroom_speaker
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: media_player.kitchen_speaker
  control: false
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: media_player.office_speaker
  grid_options: { columns: 6 }
```

:::

As on a person, `visual: { blur: false }` shows the art sharp and `icon: { type: icon }` draws the player's icon:

::: live

```yaml
type: custom:poster-card-pro
entity: media_player.kitchen_speaker
icon: { type: icon }
visual: { blur: false }
```

:::

## Cover

**Reads** a cover.

A cover draws its window (its visual, `cover`), by default in its device class's variant:

- a shutter's slats;
- a blind's slats, turning with its tilt;
- a curtain's two halves;
- a garage door's panels;
- a gate;
- an awning reaching out;
- a window pane.

The drawing follows the cover's position and glides along while it moves; the status says Opening or Closing. The position is large, with open, stop and close beside it. A cover without a position draws it open or closed, and its state is large.

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.living_room_blinds
  name: Living room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.office_blinds
  name: Office
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.patio_blind
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.bedroom_curtain
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.awning
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.driveway_gate
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.skylight
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.garage_door
  grid_options: { columns: 6 }
```

:::

A cover without a device class draws a window pane. The visual's `variant` picks another drawing, whatever the device class: `visual: { type: cover, variant: garage }` (or `shutter`, `blind`, `curtain`, `gate`, `awning`, `window`).

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.workshop_door
  visual: { type: cover, variant: garage }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.garage_door
  grid_options: { columns: 6 }
```

:::

### Options

| Key      | Takes                                                                                                                                          | Default                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `visual` | `{ type: cover, variant }`: the window behind the poster, `variant` one of `shutter`, `blind`, `curtain`, `garage`, `gate`, `awning`, `window` | `cover`, its device class's variant (`shade` is a blind, `door` a garage door, `damper` a window), else a window pane |

## Vacuum and lawn mower

**Reads** a vacuum or a lawn mower.

While a vacuum or a lawn mower works, its path draws itself across the poster (its visual, `path`), on grass for a mower, and the robot in the icon moves. On its way back the path stays, faint. Docked, its dock stands in the path's place.

The state is large, with the battery and the room under it where the integration reports them. Start / pause and return to the dock sit beside them. An error pulses red.

::: live

```yaml
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: vacuum.upstairs
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: vacuum.basement
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lawn_mower.garden
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lawn_mower.front_lawn
  grid_options: { columns: 6 }
```

:::

## Grid

**Reads** a power sensor, + importing and − exporting (`kind: grid`).

`kind: grid` reads a power sensor that is positive while it imports and negative while it exports. Or give `import` and `export`, a sensor each. A power line crosses the poster (its visual, `line`), its dots flowing in or out in Home Assistant's energy colours. The power is large in W or kW, and the status says Importing or Exporting.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Grid
  kind: grid
  import: sensor.grid_import_power
  export: sensor.grid_export_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.balcony_grid_power
  name: Balcony
  kind: grid
  grid_options: { columns: 6 }
```

:::

### Options

| Key                | Takes                                                     | Default |
| ------------------ | --------------------------------------------------------- | ------- |
| `import`, `export` | a power sensor each, for a grid without one signed sensor | –       |

## Solar

**Reads** a power sensor (`kind: solar`).

`kind: solar` on the inverter's power draws it in the solar colour. The power is large, with today's energy under it. Today's production runs along the bottom (`visual: { type: sparkline, hours: today }`).

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  today: sensor.energy_today
  grid_options: { columns: 6 }
```

:::

### Options

| Key     | Takes                                              | Default                      |
| ------- | -------------------------------------------------- | ---------------------------- |
| `today` | an energy sensor of today's production, or `false` | one on the inverter's device |

## Car

**Reads** the car's battery in % (`kind: car`).

`kind: car` on the car's battery shows the charge large, with the range under it. The status says Charging, Plugged in, or where the car is while it is away from home. The battery's [rules](#predefined-rules) colour it, and their label comes first: the van is away, and its status says Critical.

Range, plug, charging and location come from the car's device. A wallbox's power sensor as `charging` counts as charging above 0 W.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  charging: false
  location: false
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.van_battery
  name: Van
  kind: car
  grid_options: { columns: 6 }
```

:::

### Options

| Key        | Takes                                                    | Default                 |
| ---------- | -------------------------------------------------------- | ----------------------- |
| `range`    | a distance sensor, or `false`                            | one on the car's device |
| `charging` | a binary sensor, or a wallbox's power sensor, or `false` | one on the car's device |
| `plugged`  | a plug binary sensor, or `false`                         | one on the car's device |
| `location` | a device tracker, or `false`                             | one on the car's device |

## Appliance

**Reads** a power sensor (`kind: appliance`, or the device's own kind).

`kind: appliance` reads a power sensor. Above `running_above` (5 W by default) the appliance runs, and the poster shows for how long and the energy of this run. Below it, the poster says Off.

The energy comes from the sensor's history. A run longer than the history, such as a heat pump's, shows its power and the energy of the hours the history holds.

An appliance that is a device of its own has its own kind: `pump`, `washer`, `dryer`, `dishwasher` or `heat_pump`. Its icon is that device, and it works while it runs: a pump's impeller and a heat pump's fan turn, a drum shakes. `appliance` draws a plug.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  kind: heat_pump
  running_above: 50
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.washer_power
  name: Washer
  kind: washer
  grid_options: { columns: 6 }
```

:::

### Options

These apply to `appliance` and to each device kind:

| Key             | Takes                              | Default |
| --------------- | ---------------------------------- | ------- |
| `running_above` | the power in W above which it runs | `5`     |

## Predefined rules

A kind's own rules apply until the card has `rules` of its own. `rules: []` drops them ([Colour and rules](/cards/poster-custom#colour-and-rules)). Their labels follow the user's language. Copy a set to change one band:

::: code-group

```yaml [battery]
rules:
  - { below: 10, color: red, label: Critical }
  - { below: 20, color: orange, label: Low }
```

```yaml [carbon_dioxide]
rules:
  - { below: 800, color: green, label: Good }
  - { below: 1200, color: amber, label: Moderate }
  - { below: 2000, color: orange, label: Poor }
  - { above: 2000, color: red, label: Bad }
```

```yaml [pm25]
rules:
  - { below: 10, color: green, label: Good }
  - { below: 25, color: amber, label: Fair }
  - { below: 50, color: orange, label: Poor }
  - { above: 50, color: red, label: Very poor }
```

```yaml [pm10]
rules:
  - { below: 20, color: green, label: Good }
  - { below: 50, color: amber, label: Fair }
  - { below: 100, color: orange, label: Poor }
  - { above: 100, color: red, label: Very poor }
```

```yaml [aqi]
rules:
  - { below: 51, color: green, label: Good }
  - { below: 101, color: amber, label: Moderate }
  - { below: 151, color: orange, label: Unhealthy for sensitive groups }
  - { below: 201, color: red, label: Unhealthy }
  - { below: 301, color: purple, label: Very unhealthy }
  - { above: 301, color: deep-purple, label: Hazardous, pulse: true }
```

:::

Wind: pick the tab for your sensor's unit.

::: code-group

```yaml [km/h]
rules:
  - { below: 5, color: blue-grey, label: Calm }
  - { below: 20, color: teal, label: Breezy }
  - { below: 35, color: amber, label: Windy }
  - { below: 50, color: orange, label: Strong wind }
  - { above: 50, color: red, label: Stormy, tint_card: true }
```

```yaml [m/s]
rules:
  - { below: 1.4, color: blue-grey, label: Calm }
  - { below: 5.6, color: teal, label: Breezy }
  - { below: 9.7, color: amber, label: Windy }
  - { below: 13.9, color: orange, label: Strong wind }
  - { above: 13.9, color: red, label: Stormy, tint_card: true }
```

```yaml [mph]
rules:
  - { below: 3, color: blue-grey, label: Calm }
  - { below: 12, color: teal, label: Breezy }
  - { below: 22, color: amber, label: Windy }
  - { below: 31, color: orange, label: Strong wind }
  - { above: 31, color: red, label: Stormy, tint_card: true }
```

```yaml [kn]
rules:
  - { below: 3, color: blue-grey, label: Calm }
  - { below: 11, color: teal, label: Breezy }
  - { below: 19, color: amber, label: Windy }
  - { below: 27, color: orange, label: Strong wind }
  - { above: 27, color: red, label: Stormy, tint_card: true }
```

:::

Rain: pick the tab for your sensor's unit.

::: code-group

```yaml [mm/h]
rules:
  - { below: 0.1, color: blue-grey, label: Dry }
  - { below: 2.5, color: light-blue, label: Light rain }
  - { below: 7.6, color: blue, label: Moderate rain }
  - { below: 50, color: indigo, label: Heavy rain }
  - { above: 50, color: deep-purple, label: Violent rain, pulse: true }
```

```yaml [in/h]
rules:
  - { below: 0.004, color: blue-grey, label: Dry }
  - { below: 0.1, color: light-blue, label: Light rain }
  - { below: 0.3, color: blue, label: Moderate rain }
  - { below: 2, color: indigo, label: Heavy rain }
  - { above: 2, color: deep-purple, label: Violent rain, pulse: true }
```

:::

Weather, colours only:

```yaml
rules:
  - { state: sunny, color: amber }
  - { state: clear-night, color: indigo }
  - { state: partlycloudy, color: light-blue }
  - { state: cloudy, color: blue-grey }
  - { state: fog, color: grey }
  - { state: windy, color: teal }
  - { state: windy-variant, color: teal }
  - { state: rainy, color: blue }
  - { state: pouring, color: indigo }
  - { state: snowy, color: light-blue }
  - { state: snowy-rainy, color: light-blue }
  - { state: hail, color: deep-purple }
  - { state: lightning, color: deep-orange }
  - { state: lightning-rainy, color: deep-orange }
  - { state: exceptional, color: red, pulse: true }
```
