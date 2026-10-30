# Poster types

A poster type is what the entity is, and what the [poster card](/cards/poster-card) draws for it unless the card says otherwise. This page shows every type: what it reads, its `variant` values and its own keys, each with live examples; then the keys the types share, the entities they find on the device and the rules they bring.

The type supplies the poster's defaults: some types fill every place their own way, others only bring their own [rules](#predefined-rules). Detection takes the first match: the domain (`weather.*`, `sun.sun` …), then the device class, then `entity`, which brings nothing. `poster` names another type, gives one to an entity without a device class, names one that is never detected, or (`poster: entity`) switches every default off; no other key decides the type. A type named with `poster` must read the entity: `poster: wind` on a light is an error that says what the wind poster reads. A poster has one type; several subjects on one card are [badges](/cards/poster-badges).

| Poster type                                                                                          | Detected by                                                                    | Status |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| [`entity`](#entity)                                                                                  | anything else                                                                  | built  |
| [`battery`](#battery-and-air-quality)                                                                | device class `battery`                                                         | built  |
| [`carbon_dioxide`, `pm25`, `pm10`, `aqi`](#battery-and-air-quality)                                  | their device class                                                             | built  |
| [`weather`](#weather), [`sun`](#sun), [`wind`](#wind), [`rain`](#rain)                               | `weather.*`, `sun.sun`, device classes `wind_speed`, `precipitation_intensity` | built  |
| [`trend`](#trend)                                                                                    | never: `poster: trend` with its `series`                                       | built  |
| [`light`](#light), [`fan`](#fan), [`climate`](#climate)                                              | domain                                                                         | built  |
| [`lock`](#lock), [`alarm_control_panel`](#alarm), [`person`](#person)                                | domain                                                                         | built  |
| [`media_player`](#media-player), [`cover`](#cover), [`vacuum`, `lawn_mower`](#vacuum-and-lawn-mower) | domain                                                                         | built  |
| [`grid`](#grid), [`solar`](#solar), [`car`](#car), [`appliance`](#appliance)                         | never: what a device is in the home, set with `poster`                         | built  |

## Entity

**Reads** any entity · no keys of its own.

The fallback: the entity's icon, name and value, the matching rule's label in the status badge, and `visual` for the picture (`sparkline`, `columns`, `bar`, `gauge`). A value that reads as a number gets `unit`, `decimals` and `rules`, as on every Pro card.

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

## Battery and air quality

**Reads** a sensor of device class `battery`, `carbon_dioxide`, `pm25`, `pm10` or `aqi` · **keys** `power`, `charge`, `discharge` (battery).

These types bring nothing but their rules: colour and a label by value, from a standard where there is one. A battery is red and _Critical_ below 10 %, orange and _Low_ below 20 %; CO₂ goes from _Good_ to _Bad_ at 800, 1200 and 2000 ppm; PM2.5 and PM10 follow the WHO and EU bands, the air quality index the US EPA's (_Hazardous_ pulses). Their labels follow the user's language. See [Predefined rules](#predefined-rules) for the sets to copy and change.

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
```

:::

With its power the battery poster draws a home battery: the cell filled to the charge, the power flowing in or out, Charging or Discharging as the status and the power under the charge. `power` is + while it charges and − while it discharges (the [power flow card](/cards/power-flow-card) reads a battery the other way round); `charge` and `discharge` give a meter each. They need no `poster`: the state of charge's device class makes it a battery. A power sensor on the battery's device is found by itself.

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

A template sensor has no device class; `poster` gives it a type:

::: live

```yaml
type: custom:poster-card-pro
entity: sensor.robot_battery
name: Robot
icon: mdi:robot-vacuum
poster: battery
```

:::

## Weather

**Reads** a weather entity · no keys of its own.

A weather entity: Home Assistant's picture of the condition, the condition as the status, the temperature large with today's high and low under it, and the next 12 hours of the hourly forecast as a curve along the bottom (hover it for the hour). The condition sets the colour: amber in the sun, blue in the rain, deep orange in a thunderstorm. `hours_to_show` sets how far the curve looks ahead, `show_entity_picture: false` draws mdi icons instead of the pictures.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  hours_to_show: 24
  show_entity_picture: false
  grid_options: { columns: 6 }
```

:::

One `rules` reads both: `state` matches the condition, `below` and `above` the temperature. They replace the condition colours, so copy the [set](#predefined-rules) to keep them:

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

**Reads** `sun.sun`, or no entity · no keys of its own.

`sun.sun`, or `poster: sun` without an entity: the sun is computed from Home Assistant's location. The sun or the moon, how soon the next sunrise or sunset comes as the status, that event large with its time, and the day's curve along the bottom with the sun where it is now (hover it for the elevation). Amber by day and indigo by night; `color` paints the curve and the poster.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  poster: sun
  color: orange
  grid_options: { columns: 6 }
```

:::

## Wind

**Reads** a `wind_speed` sensor or a weather entity · **variant** `dots`, `lines`, `swoosh`, `vectors` · **keys** `direction`, `gust`.

A wind speed sensor, or a weather entity with `poster: wind`. The animated lead turns where the wind blows and runs at its speed; the speed is large, where the wind comes from and its gusts are under it, and the Beaufort bands colour and name it. The direction and the gusts are [found](#discovered-inputs) on the speed sensor's device (a weather entity brings its own); `direction` and `gust` set them.

`variant` makes the whole poster the animated field: `dots`, `lines` (streamlines), `swoosh` (strokes drawing themselves) or `vectors` (arrows); the lead is the direction's arrow then.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  variant: lines
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Wind
  poster: wind
  variant: swoosh
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Wind
  variant: vectors
  gust: false
  rules:
    - { below: 20, color: teal, label: Fine for sailing }
    - { above: 20, color: orange, label: Reef the sails }
  grid_options: { columns: 6 }
```

:::

## Rain

**Reads** a `precipitation_intensity` sensor (mm/h or in/h) · **variant** `drops`, `ripples`, `fill` · **keys** `today`, `wind`, `direction`.

A rain rate sensor. The animated lead rains at the rate, the rate is large and today's total under it ([found](#discovered-inputs) on the rate sensor's device), and the rain's bands colour and name it. `wind` and `direction` slant the drops; `variant` fills the poster with rain: `drops`, `ripples` or `fill` (a gauge that fills with today's total).

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Rain
  variant: drops
  wind: sensor.wind_speed
  direction: sensor.wind_direction
  grid_options: { columns: 6 }
```

:::

## Trend

**Reads** its own entities (`poster: trend`) · **keys** `series`.

Several entities on one scale (`poster: trend` with its `series`): the first one's value large (the card's `entity`, when it has one), the time window as the status (`hours_to_show`, 6 hours by default) and the lines overlaid along the bottom, every value under the pointer. A series takes `name`, `color` (a template allowed), `rules` and `visibility`, as on the [multi trend card](/cards/multi-trend-card).

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
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Rooms
  icon: mdi:home-thermometer
  poster: trend
  series:
    - { entity: sensor.living_room_temperature, name: Living room, color: green }
    - { entity: sensor.bedroom_temperature, name: Bedroom, color: indigo }
    - { entity: sensor.office_temperature, name: Office, color: orange }
  grid_options: { columns: 6 }
```

:::

## Light

**Reads** a light · no keys of its own.

A light: its picture is a glow from the bottom of the card (`visual: glow`) in the light's own colour (`rgb_color`, else Home Assistant's colour for a light that is on), as strong as its brightness and gone while it is off. The brightness is large, the switch beside it and the brightness slider along the bottom; `control: false` leaves them out. Another [picture](/cards/poster-custom#a-picture) replaces the glow: `visual: bar` draws the brightness as a bar, `visual: none` draws nothing.

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

**Reads** a fan · no keys of its own.

A fan: its blades turn at its speed (standing still while it is off), the speed is large and its speeds are segments beside it.

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

**Reads** a climate entity · no keys of its own.

A thermostat: the current temperature large, the target under it and the stepper beside them, what it is doing as the status (Heating, Idle, Cooling), and a dial along the bottom: the target as a ring, the temperature now as a dot, the stretch between them in the poster's colour. The card warms while it heats and cools while it cools.

::: live

```yaml
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.bedroom
  grid_options: { columns: 6 }
```

:::

## Lock

**Reads** a lock · no keys of its own.

A lock: the padlock in the lead is held to lock or unlock (a ring fills around it; a screen reader presses it twice), the state is large, and a jammed lock pulses red. The hold is the icon's default action, `icon_hold_action: { action: toggle }`; another [icon action](/cards/poster-custom#the-icon) replaces it.

::: live

```yaml
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.garage_side_door
  grid_options: { columns: 6 }
```

:::

## Alarm

**Reads** an alarm control panel · no keys of its own.

An alarm panel: its shield in the lead is held to arm it (away) or disarm it (`icon_hold_action: { action: toggle }`, as the [lock](#lock)), its state large, red and pulsing while triggered. A panel that wants a code has no hold here: a tap opens Home Assistant's dialog with its keypad.

::: live

```yaml
type: custom:poster-card-pro
entity: alarm_control_panel.home
```

:::

## Person

**Reads** a person or a device tracker · no keys of its own.

A person: their photo behind the poster (no lead over their face), the zone large and for how long under it. A person without a picture keeps their icon.

::: live

```yaml
- type: custom:poster-card-pro
  entity: person.alex
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: person.kim
  grid_options: { columns: 6 }
```

:::

## Media player

**Reads** a media player · no keys of its own.

A media player: its cover art behind the poster, and the art's own colour for the poster (read from the picture once it has loaded). The title is large, the artist and album under it, the transport beside them and the volume below (on a card too short for it the volume gives way, more-info has it); a thin bar along the bottom edge runs with the track while it plays.

::: live

```yaml
type: custom:poster-card-pro
entity: media_player.living_room_tv
```

:::

::: live

```yaml
- type: custom:poster-card-pro
  entity: media_player.kitchen_speaker
  control: false
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: media_player.living_room_tv
  image: false
  control: buttons
  grid_options: { columns: 6 }
```

:::

## Cover

**Reads** a cover · **variant** `shutter`, `blind`, `curtain`, `garage`, `gate`, `awning`, `window` · no other keys.

A cover draws the window itself, by its device class: a shutter's slats, a blind's slats turning with its tilt, a curtain's two halves, a garage door's panels, a gate, an awning reaching out, or a window pane. The drawing sits at the cover's position and glides along while it moves, through every position it reports. The position is large, with open, stop and close beside it.

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
```

:::

A cover without a device class is a window pane; `variant` picks another drawing (`shutter`, `blind`, `curtain`, `garage`, `gate`, `awning`, `window`):

::: live

```yaml
- type: custom:poster-card-pro
  entity: cover.workshop_door
  variant: garage
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.garage_door
  grid_options: { columns: 6 }
```

:::

## Vacuum and lawn mower

**Reads** a vacuum or a lawn mower · no keys of its own.

A vacuum or a lawn mower: while it works its path draws itself across the poster (on grass for a mower) and the robot in the lead moves; docked, the dock stands there. The state is large, its battery and room under it where the integration reports them, start / pause and return to the dock beside them, and an error pulses red.

::: live

```yaml
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lawn_mower.garden
  grid_options: { columns: 6 }
```

:::

## Grid

**Reads** a power sensor, + importing and − exporting (`poster: grid`) · **keys** `import`, `export`.

`poster: grid` on a power sensor, + while it imports and − while it exports (or `poster: grid` with `import` and `export`, a meter each): a power line across the poster with its dots flowing in, or out while it exports, in Home Assistant's energy colours. The power is large in W or kW, Importing or Exporting the status.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  poster: grid
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  name: Grid
  poster: grid
  import: sensor.grid_import_power
  export: sensor.grid_export_power
  grid_options: { columns: 6 }
```

:::

## Solar

**Reads** a power sensor (`poster: solar`) · **keys** `today`.

`poster: solar` on the inverter's power, in the solar colour: the power is large, today's energy under it ([found](#discovered-inputs) on the inverter's device, or `today`) and today's production along the bottom.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  poster: solar
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  poster: solar
  today: sensor.energy_today
  grid_options: { columns: 6 }
```

:::

## Car

**Reads** the car's battery in % (`poster: car`) · **keys** `range`, `charging`, `plugged`, `location`.

`poster: car` on the car's battery: the charge large, the range under it, and Charging, Plugged in or where it is (away from home) as the status. Range, plug, charging and location are [found](#discovered-inputs) on the car's device (`range`, `plugged`, `charging` and `location` set them); a wallbox's power sensor counts as charging above 0 W.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  poster: car
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  poster: car
  charging: false
  location: false
  grid_options: { columns: 6 }
```

:::

## Appliance

**Reads** a power sensor (`poster: appliance`) · **variant** `pump`, `washer`, `dryer`, `dishwasher`, `heat_pump` · **keys** `running_above`.

`poster: appliance` on a power sensor: running above `running_above` (5 W by default), it says for how long and the energy of this run (from the sensor's history; a run longer than the history, a heat pump's, shows its power and the energy of the history's hours), and the device in the lead works: a pump's impeller and a heat pump's fan turn, a drum shakes (`variant: pump | washer | dryer | dishwasher | heat_pump`). Otherwise it is Off.

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.heat_pump_power
  name: Heat pump
  poster: appliance
  variant: heat_pump
  running_above: 50
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.washer_power
  name: Washer
  poster: appliance
  variant: washer
  grid_options: { columns: 6 }
```

:::

## Options of a poster type

What only one poster type reads sits at the top level too, beside everything that shapes the poster: `variant` for how the type draws its subject, the entities it reads, `running_above` and `series`. These keys never decide the type: a solar poster's `today` needs `poster: solar`, a pair of meters `poster: grid`. A key the poster type does not read is left out, with a warning in the browser console; with `poster` written, [the schema](/guide/getting-started#completion-and-validation-in-your-editor) rejects it too (`gust` on `poster: rain`), so a YAML editor that knows it marks it as you type.

| Key                                        | Poster type | Value                                                                                                                                                |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poster`                                   | any         | A poster type's name: forces it, or names one never detected (`grid`, `solar`, `car`, `appliance`, `sun`, `trend`); `entity` turns every default off |
| `variant`                                  | `wind`      | `dots \| lines \| swoosh \| vectors`: the whole poster is the animated field (default: the animated lead)                                            |
| `variant`                                  | `rain`      | `drops \| ripples \| fill`: the whole poster is the rain (default: the animated lead)                                                                |
| `variant`                                  | `cover`     | `shutter \| blind \| curtain \| garage \| gate \| awning \| window` (default: the device class)                                                      |
| `variant`                                  | `appliance` | `pump \| washer \| dryer \| dishwasher \| heat_pump` (default: a plug)                                                                               |
| `direction`, `gust`                        | `wind`      | entity ids or `false`                                                                                                                                |
| `today`, `wind`, `direction`               | `rain`      | entity ids or `false`                                                                                                                                |
| `today`                                    | `solar`     | an energy sensor or `false`                                                                                                                          |
| `power`, or `charge` and `discharge`       | `battery`   | entity ids or `false`: a home battery, `power` + while it charges                                                                                    |
| `import`, `export`                         | `grid`      | entity ids, instead of one signed sensor                                                                                                             |
| `range`, `charging`, `plugged`, `location` | `car`       | entity ids or `false`; `charging` a binary sensor, or power: on above 0; `location` a device tracker                                                 |
| `running_above`                            | `appliance` | the power in W above which it runs (default 5)                                                                                                       |
| `series`                                   | `trend`     | ids or `{ entity, name, color, rules, visibility }`                                                                                                  |

## Discovered inputs

A poster type's inputs are found on the poster entity's device: by device class first, by the integration's own name for the entity (its translation key, the same in every language) where that cannot tell two apart. Two candidates left: none, never a guess. The input's key on the card replaces what was found, `false` drops it; what was found is said once in the browser console ("…; set `gust` to choose another").

| Poster type | Input       | Found by                                                                                             |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| wind        | `direction` | device class `wind_direction`, else a sensor in °; a weather entity's `wind_bearing`                 |
| wind        | `gust`      | another `wind_speed` sensor whose translation key names a gust; a weather entity's `wind_gust_speed` |
| rain        | `today`     | a `precipitation` sensor whose translation key names the day                                         |
| solar       | `today`     | an `energy` sensor whose translation key names the day                                               |
| battery     | `power`     | a `power` sensor                                                                                     |
| car         | `range`     | device class `distance`                                                                              |
| car         | `plugged`   | binary sensor `plug`                                                                                 |
| car         | `charging`  | binary sensor `battery_charging`                                                                     |
| car         | `location`  | a `device_tracker`                                                                                   |

## Predefined rules

A poster type's own rules apply until the card has `rules`, which replace them as a whole; `rules: []` drops them (see [Colour and rules](/cards/poster-custom#colour-and-rules)). Their labels are translated. Copy a set to change one band:
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

Wind, in the unit of your sensor (the set is written in km/h; a copied set reads the sensor's own unit):

::: code-group

```yaml [km/h]
rules:
  - { below: 2, color: blue-grey, label: Calm }
  - { below: 12, color: light-blue, label: Light breeze }
  - { below: 29, color: teal, label: Moderate breeze }
  - { below: 39, color: green, label: Fresh breeze }
  - { below: 62, color: amber, label: Strong wind }
  - { below: 89, color: orange, label: Gale }
  - { above: 89, color: red, label: Storm, pulse: true }
```

```yaml [m/s]
rules:
  - { below: 0.6, color: blue-grey, label: Calm }
  - { below: 3.3, color: light-blue, label: Light breeze }
  - { below: 8.1, color: teal, label: Moderate breeze }
  - { below: 10.8, color: green, label: Fresh breeze }
  - { below: 17.2, color: amber, label: Strong wind }
  - { below: 24.7, color: orange, label: Gale }
  - { above: 24.7, color: red, label: Storm, pulse: true }
```

```yaml [mph]
rules:
  - { below: 1, color: blue-grey, label: Calm }
  - { below: 7, color: light-blue, label: Light breeze }
  - { below: 18, color: teal, label: Moderate breeze }
  - { below: 24, color: green, label: Fresh breeze }
  - { below: 39, color: amber, label: Strong wind }
  - { below: 55, color: orange, label: Gale }
  - { above: 55, color: red, label: Storm, pulse: true }
```

```yaml [kn]
rules:
  - { below: 1, color: blue-grey, label: Calm }
  - { below: 6, color: light-blue, label: Light breeze }
  - { below: 16, color: teal, label: Moderate breeze }
  - { below: 21, color: green, label: Fresh breeze }
  - { below: 34, color: amber, label: Strong wind }
  - { below: 48, color: orange, label: Gale }
  - { above: 48, color: red, label: Storm, pulse: true }
```

:::

Rain:

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

Weather, colours only (the condition is the status):

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
