---
outline: [2, 3]
---

# Kinds

A kind is what an entity is: a light, a thermostat, the weather, a washing machine. The [tile](/cards/tile-card) and the [poster](/cards/poster-card) draw every entity as its kind, so a card looks right without any options.

The kind is detected from the entity: first its domain (`light.*`, `weather.*`, `sun.sun`), then its device class (a `battery` or `temperature` sensor, a `door` binary sensor, an `outlet` switch). An entity that matches nothing is `none`, the plain entity. Set `kind:` to choose one yourself, for a sensor without a device class or a kind that is never detected, such as `grid` or `washer`.

A kind brings:

- **An icon:** its own, often animated. A fan's blades turn, wind blows through the icon, a media player shows its cover art.
- **Colours and a status:** rules by value or state (a low battery turns orange and says Low), or what the device is doing (Heating, Charging, Exporting).
- **Controls:** a light's switch, a thermostat's stepper, a player's buttons. See [Controls](/cards/controls).
- **A visual:** a light's glow, the weather's forecast, a cover's window. See [Look](/cards/look) to change or remove it.
- **Inputs:** the other entities it reads, such as the gusts beside the wind speed. The kind finds them on the same device as your entity. Name one under `inputs` when it finds none or the wrong one, or set it to `false` to leave it out.

| Kind                                                                            | Reads                                         | Draws                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| [`none`](#none)                                                                 | any entity                                    | its icon, name and value                       |
| [`weather`](#weather)                                                           | `weather.*`                                   | the condition's picture, the forecast          |
| [`sun`](#sun)                                                                   | `sun.sun`, or no entity                       | the next sunrise or sunset, the day's curve    |
| [`wind`](#wind)                                                                 | a `wind_speed` sensor, or a weather entity    | particles in the wind, direction and gusts     |
| [`rain`](#rain)                                                                 | a `precipitation_intensity` sensor            | falling drops, today's total                   |
| [`carbon_dioxide`, `pm25`, `pm10`, `aqi`](#air-quality)                         | a sensor of that device class                 | the value in the colours of its standard       |
| [`trend`](#trend)                                                               | its `series` (set with `kind`)                | several sensors as lines on one scale          |
| [`temperature`, `humidity`](#temperature-and-humidity)                          | a sensor of that device class                 | the day's line, today's low and high           |
| [`illuminance`](#illuminance)                                                   | an `illuminance` sensor                       | dark, dim or bright, the day's line            |
| [`opening`](#doors-and-windows)                                                 | a door, window or opening binary sensor       | open or closed, for how long, when it was open |
| [`motion`](#motion)                                                             | a motion, occupancy or presence binary sensor | detected or clear, for how long, when          |
| [`safety`](#leaks-and-smoke)                                                    | a leak, smoke, gas or problem binary sensor   | a red pulse while it alerts                    |
| [`battery`](#battery)                                                           | a `battery` sensor                            | the charge as ten segments                     |
| [`grid`](#grid)                                                                 | a power sensor (set with `kind`)              | importing or exporting, a power line           |
| [`solar`](#solar)                                                               | a power sensor (set with `kind`)              | the power now, today's production              |
| [`car`](#car)                                                                   | the car's battery (set with `kind`)           | the charge, the range, charging or where       |
| [`appliance`, `pump`, `washer`, `dryer`, `dishwasher`, `heat_pump`](#appliance) | a power sensor (set with `kind`)              | how long it runs, the energy of this run       |
| [`light`](#light)                                                               | `light.*`                                     | brightness, a switch, a glow                   |
| [`plug`](#plug)                                                                 | an `outlet` switch                            | a switch, its power                            |
| [`fan`](#fan)                                                                   | `fan.*`                                       | turning blades, its speeds                     |
| [`climate`](#climate)                                                           | `climate.*`                                   | the temperature, a stepper, a warm glow        |
| [`cover`](#cover)                                                               | `cover.*`                                     | the position, open / stop / close, its window  |
| [`lock`](#lock)                                                                 | `lock.*`                                      | locked or not, hold to lock                    |
| [`alarm_control_panel`](#alarm)                                                 | `alarm_control_panel.*`                       | its state, hold to arm                         |
| [`media_player`](#media-player)                                                 | `media_player.*`                              | the cover art, the title, the transport        |
| [`vacuum`, `lawn_mower`](#vacuum-and-lawn-mower)                                | `vacuum.*`, `lawn_mower.*`                    | the robot at work, its path                    |
| [`person`](#person)                                                             | `person.*`, `device_tracker.*`                | their picture, the zone and how long           |

## The plain entity

### None

The fallback for anything without a kind: the entity's icon, name and value, coloured by your `rules`. It draws no visual of its own; `visual` adds one, such as a `sparkline`, `bar` or `gauge` (see [Look](/cards/look)). `kind: none` turns a detected kind off.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.pressure
  visual: sparkline
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.pressure
  visual: sparkline
  grid_options: { columns: 6 }
```

:::

## Weather and air

### Weather

The condition's picture as the icon, the temperature, the condition as the status, and today's high and low. A curve shows the hourly forecast for the next 12 hours; `visual: { hours: 24 }` looks further ahead. The condition sets the colour: amber in the sun, blue in the rain. `state` rules match the condition, `below` and `above` the temperature.

::: live

```yaml
- type: custom:tile-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: weather.home
  name: Outside
  grid_options: { columns: 6 }
```

:::

`icon: { type: icon }` draws the condition's icon in place of the picture.

### Sun

The next sunrise or sunset with its time, and how soon it comes. The day's curve runs below, with the sun where it is now; hover it for the elevation. The card is amber by day and indigo by night. Use `sun.sun`, or `kind: sun` without an entity: the sun is then computed from Home Assistant's location.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sun.sun
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sun.sun
  grid_options: { columns: 6 }
```

:::

### Wind

Particles blow through the icon in the wind's direction, as fast as it blows. The value is the speed, with the direction and the gusts beside it. Five bands colour and name the speed, from Calm to Stormy, and from 50 km/h the whole card turns red. A weather entity with `kind: wind` shows its wind.

The kind finds the direction and the gusts on the sensor's device (`inputs: { direction, gust }`). The flow comes in four variants (`dots`, `lines`, `swoosh`, `vectors`), and `visual: { type: flow }` fills the whole card with it; see [Look](/cards/look).

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.wind_speed
  name: Garden
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.wind_speed
  name: Garden
  grid_options: { columns: 6 }
```

:::

### Rain

Drops fall through the icon as fast as it rains. The value is the rate, with today's total beside it. Five bands colour and name it, from Dry to Violent rain. The kind finds today's total on the sensor's device (`inputs: { today }`); `inputs: { wind, direction }` slant the drops. The drops come in three variants (`drops`, `ripples`, `fill`), and `visual: { type: flow }` lets it rain across the whole card.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.rain_rate_roof
  name: Roof
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.rain_rate_roof
  name: Roof
  grid_options: { columns: 6 }
```

:::

### Air quality

Four kinds, detected by the sensor's device class, colour and name the value by the bands of a standard:

- `carbon_dioxide`: Good to Bad at 800, 1200 and 2000 ppm.
- `pm25` and `pm10`: the WHO and EU bands.
- `aqi`: the US EPA's bands. Hazardous pulses.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_co2
  name: Living room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_co2
  name: Living room
  visual: sparkline
  grid_options: { columns: 6 }
```

:::

### Trend

`kind: trend` draws the entities of its `series` as lines on one scale. Hover them to read every value at one time. The large value is the card's `entity`, else the first series, and the status is the time window: 6 hours, or what `visual: { hours: 12 }` sets. A series takes `name`, `color`, `rules` and `visibility`, as on the [multi trend card](/cards/multi-trend-card).

::: live

```yaml
- type: custom:tile-card-pro
  kind: trend
  name: Temperatures
  series:
    - { entity: sensor.living_room_temperature, name: Living room, color: orange }
    - { entity: sensor.outdoor_temperature, name: Outside, color: teal }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  kind: trend
  name: Temperatures
  series:
    - { entity: sensor.living_room_temperature, name: Living room, color: orange }
    - { entity: sensor.outdoor_temperature, name: Outside, color: teal }
  grid_options: { columns: 6 }
```

:::

## Sensors

### Temperature and humidity

The value with today's low and high under it (↓ 19.1 ↑ 21.6), and on the poster a line of the last 24 hours. The tile stays compact; `visual: sparkline` adds the line. They bring no colours: a comfortable temperature is yours to say with `rules`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.living_room_temperature
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_humidity
  grid_options: { columns: 6 }
```

:::

### Illuminance

The light level in lux, its icon and status by how light it is: Dark below 10 lx, Dim below 200 lx, Bright above. The poster draws a line of the last 24 hours.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.illuminance
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.illuminance
  grid_options: { columns: 6 }
```

:::

### Doors and windows

`opening`: a binary sensor of class `door`, `window`, `garage_door` or `opening`. Open or Closed with how long it has been, and on the poster a strip along its bottom edge: when it was open in the last 24 hours. `visual: { variant: timeline }` draws the strip below the texts with its times instead.

::: live

```yaml
- type: custom:tile-card-pro
  entity: binary_sensor.window_kitchen
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: binary_sensor.door_front
  grid_options: { columns: 6 }
```

:::

### Motion

`motion`: a binary sensor of class `motion`, `occupancy` or `presence`. Detected or Clear with how long it has been. The poster draws when there was motion along its bottom edge, as a door does; the tile glows while there is.

::: live

```yaml
- type: custom:tile-card-pro
  entity: binary_sensor.motion_hallway
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: binary_sensor.motion_hallway
  grid_options: { columns: 6 }
```

:::

### Leaks and smoke

`safety`: a binary sensor of class `moisture`, `smoke`, `gas`, `carbon_monoxide`, `safety`, `problem` or `tamper`. Quiet while all is well; while it alerts the card turns red and pulses from its edges, and says how long it has been. A rain sensor of class `moisture` is one too: `kind: none` keeps it plain.

::: live

```yaml
- type: custom:tile-card-pro
  entity: binary_sensor.water_leak_bathroom
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: binary_sensor.smoke_hallway
  grid_options: { columns: 6 }
```

:::

## Energy

### Battery

The charge, with ten segments below it, filled to the charge, in Home Assistant's battery colours: red below 30 %, orange below 70 %, green above. It says Low below 20 % and Critical below 10 %. A template sensor often has no device class: `kind: battery` makes it a battery, like the phone here.

With a power sensor it is a home battery: while power flows the status says Charging or Discharging and the card takes the energy colours (Low and Critical stay red), the power sits beside the charge, and the next segment pulses. The kind finds the power on the battery's device. Name it with `inputs: { power }` (positive while it charges), or give `inputs: { charge, discharge }`, a sensor each.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.phone_battery
  name: Phone
  kind: battery
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.battery_soc
  name: Home battery
  grid_options: { columns: 6 }
```

:::

### Grid

`kind: grid` reads a power sensor that is positive while you import and negative while you export. Or leave out the entity and give `inputs: { import, export }`, a sensor each. The power shows in W or kW, the status says Importing or Exporting, in Home Assistant's energy colours. On a poster a power line crosses the card, its dots flowing in or out; a tile leaves it out unless you ask for it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.grid_power
  name: Grid
  kind: grid
  grid_options: { columns: 6 }
```

:::

### Solar

`kind: solar` on the inverter's power shows it in the solar colour, with today's energy beside it and today's production as a curve below. The kind finds today's energy on the inverter's device; `inputs: { today }` names it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.solar_power
  name: Solar
  kind: solar
  grid_options: { columns: 6 }
```

:::

### Car

`kind: car` on the car's battery shows the charge, with the range beside it. The status says Charging, Plugged in, or where the car is while it is away. The battery's colours and its Low and Critical apply. Range, plug, charging and location come from the car's device (`inputs: { range, plugged, charging, location }`); a wallbox's power sensor as `charging` counts as charging above 0 W.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  kind: car
  grid_options: { columns: 6 }
```

:::

### Appliance

An appliance reads a power sensor. Above `running_above` (5 W unless set) it runs: the card shows for how long and the energy of this run. Below it, the card says Off. Where the device reports more, the kind finds it on the device or takes it from `inputs`: `remaining`, the time left (a duration, or the time it finishes), shown in place of how long it has run; `phase`, its program's phase (Washing, Rinsing …), shown as its status. Each kind draws its device's icon (a plug for `appliance`), which moves while it runs: `pump` and `heat_pump` turn, the others shake.

::: live

```yaml
- type: custom:tile-card-pro
  entity: sensor.washer_power
  name: Washer
  kind: washer
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.washer_power
  name: Washer
  kind: washer
  grid_options: { columns: 6 }
```

:::

## Devices

### Light

The brightness, On or Off, and a switch. The card glows from its bottom edge in the light's own colour, as bright as the light, and the glow is gone while it is off. The poster adds a brightness slider; `control: slider` puts one on the tile ([Controls](/cards/controls)).

::: live

```yaml
- type: custom:tile-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: light.living_room
  grid_options: { columns: 6 }
```

:::

### Plug

A switch of class `outlet`: its switch at the line's end, and while it is on, the power it draws as the value. It finds that power on the plug's device (`inputs: { power }` names another); the poster draws it in columns over the last 24 hours, and a plot the card names (`visual: sparkline` on a tile, say) draws that power too. A switch without a device class becomes a plug with `kind: plug`.

::: live

```yaml
- type: custom:tile-card-pro
  entity: switch.coffee_machine
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: switch.coffee_machine
  grid_options: { columns: 6 }
```

:::

### Fan

The blades in the icon turn at the fan's speed and stand still while it is off. The value is the speed, with a segment for each speed beside it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: fan.living_room
  grid_options: { columns: 6 }
```

:::

### Climate

The current temperature, the target with a stepper, and what the thermostat is doing: Heating, Idle or Cooling. The card glows warm while it heats and cool while it cools.

::: live

```yaml
- type: custom:tile-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: climate.living_room
  grid_options: { columns: 6 }
```

:::

### Cover

The position, Open, Closed, Opening or Closing, and open, stop and close buttons. A poster draws the window behind its texts, following the position: shutter, blind, curtain, garage door, gate, awning or window, by the cover's device class. A tile leaves the window out unless you name it; `visual: { type: cover, variant: garage }` picks another drawing ([Look](/cards/look)).

::: live

```yaml
- type: custom:tile-card-pro
  entity: cover.living_room_blinds
  name: Blinds
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: cover.living_room_blinds
  name: Blinds
  grid_options: { columns: 6 }
```

:::

### Lock

Locked or Unlocked; a jammed lock turns red. Hold the padlock to lock or unlock: a ring fills around it first, so a tap never opens the door by accident.

::: live

```yaml
- type: custom:tile-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: lock.front_door
  grid_options: { columns: 6 }
```

:::

### Alarm

The panel's state (Disarmed, Armed away …); a triggered alarm pulses red. Hold the shield to arm (away) or disarm, as on the lock. A panel that wants a code has no hold: a tap opens Home Assistant's keypad.

::: live

```yaml
- type: custom:tile-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: alarm_control_panel.home
  grid_options: { columns: 6 }
```

:::

### Media player

The cover art as the icon, blurred behind the card and as its colour. The title is the value, with the artist and album; Playing or Paused is the status. Previous, play / pause and next sit beside it, a poster adds the volume, and a thin bar along the bottom follows the track. A player that is off shows its icon and state.

::: live

```yaml
- type: custom:tile-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: media_player.living_room_speaker
  grid_options: { columns: 6 }
```

:::

### Vacuum and lawn mower

The robot in the icon moves while it works. The value is its state, with the battery and the room where the integration reports them; an error turns it red. Start / pause and back to the dock sit beside it. On a poster its path draws itself across the card (on grass for a mower), and the dock stands there while it is docked; a tile leaves the path out unless you name it.

::: live

```yaml
- type: custom:tile-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: vacuum.robot
  grid_options: { columns: 6 }
```

:::

### Person

Their picture as the icon, and their photo behind the card, blurred. The value is their zone, with how long they have been there. A person without a picture keeps the person icon. A device tracker is a person too.

::: live

```yaml
- type: custom:tile-card-pro
  entity: person.malte
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: person.malte
  grid_options: { columns: 6 }
```

:::

`icon: { type: icon }` draws the icon in place of the picture, and `visual: false` leaves the photo out; see [Look](/cards/look).

## The kinds' rules

Battery, car, air quality, illuminance, wind, rain and weather bring rules of their own: the colours, icons and statuses above. A jammed lock, a triggered alarm, a leak or smoke and a robot with an error have one rule each that makes the status badge pulse. The kind's rules apply until the card has `rules` of its own, which replace them as a whole; `rules: []` drops them. The statuses follow the user's language. Copy a set to change one band (on a home battery, rules of your own also replace its charging and discharging colours):

::: code-group

```yaml [battery]
rules:
  - { below: 10, color: red, status: Critical }
  - { below: 20, color: red, status: Low }
  - { below: 30, color: red }
  - { below: 70, color: orange }
  - { above: 70, color: green }
```

```yaml [carbon_dioxide]
rules:
  - { below: 800, color: green, status: Good }
  - { below: 1200, color: amber, status: Moderate }
  - { below: 2000, color: orange, status: Poor }
  - { above: 2000, color: red, status: Bad }
```

```yaml [pm25]
rules:
  - { below: 10, color: green, status: Good }
  - { below: 25, color: amber, status: Fair }
  - { below: 50, color: orange, status: Poor }
  - { above: 50, color: red, status: Very poor }
```

```yaml [pm10]
rules:
  - { below: 20, color: green, status: Good }
  - { below: 50, color: amber, status: Fair }
  - { below: 100, color: orange, status: Poor }
  - { above: 100, color: red, status: Very poor }
```

```yaml [aqi]
rules:
  - { below: 51, color: green, status: Good }
  - { below: 101, color: amber, status: Moderate }
  - { below: 151, color: orange, status: Unhealthy for sensitive groups }
  - { below: 201, color: red, status: Unhealthy }
  - { below: 301, color: purple, status: Very unhealthy }
  - { above: 301, color: deep-purple, status: Hazardous, pulse: true }
```

```yaml [illuminance]
rules:
  - { below: 10, icon: mdi:brightness-4, status: Dark }
  - { below: 200, icon: mdi:brightness-5, status: Dim }
  - { above: 200, icon: mdi:brightness-7, status: Bright }
```

```yaml [wind (km/h)]
rules:
  - { below: 5, color: blue-grey, status: Calm }
  - { below: 20, color: teal, status: Breezy }
  - { below: 35, color: amber, status: Windy }
  - { below: 50, color: orange, status: Strong wind }
  - { above: 50, color: red, status: Stormy, tint_card: true }
```

```yaml [rain (mm/h)]
rules:
  - { below: 0.1, color: blue-grey, status: Dry }
  - { below: 2.5, color: light-blue, status: Light rain }
  - { below: 7.6, color: blue, status: Moderate rain }
  - { below: 50, color: indigo, status: Heavy rain }
  - { above: 50, color: deep-purple, status: Violent rain, pulse: true }
```

```yaml [weather]
rules:
  - { state: sunny, color: var(--state-weather-sunny-color) }
  - { state: clear-night, color: var(--state-weather-clear_night-color) }
  - { state: partlycloudy, color: var(--state-weather-partlycloudy-color) }
  - { state: cloudy, color: var(--state-weather-cloudy-color) }
  - { state: fog, color: var(--state-weather-fog-color) }
  - { state: windy, color: var(--state-weather-windy-color) }
  - { state: windy-variant, color: var(--state-weather-windy_variant-color) }
  - { state: rainy, color: var(--state-weather-rainy-color) }
  - { state: pouring, color: var(--state-weather-pouring-color) }
  - { state: snowy, color: var(--state-weather-snowy-color) }
  - { state: snowy-rainy, color: var(--state-weather-snowy_rainy-color) }
  - { state: hail, color: var(--state-weather-hail-color) }
  - { state: lightning, color: var(--state-weather-lightning-color) }
  - { state: lightning-rainy, color: var(--state-weather-lightning_rainy-color) }
  - { state: exceptional, color: var(--state-weather-exceptional-color), pulse: true }
```

:::

The kinds' own battery and weather colours are Home Assistant's, so a theme can change them; the battery's set above writes their defaults. The wind's and the rain's own bands follow your sensor's unit. Rules you write read the value as the sensor reports it: for a sensor in m/s, write the thresholds in m/s.

## Reference

These keys are the same on the tile and the poster. A key the kind does not read is a config error when `kind` is written, and a warning in the browser's console when the kind is detected. An input whose default is "on the device" is looked for on the device of the card's entity; where the device has more than one match, none is used.

| Key                | Default                                               | What it does                                                                                 |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `kind`             | detected                                              | The kind by name, one of those in the table at the top. `none` draws the plain entity.       |
| `inputs.direction` | wind: on the device, or the weather entity's; rain: – | Wind, rain: a wind direction sensor (degrees or a compass point), or `false`.                |
| `inputs.gust`      | on the device, or the weather entity's                | Wind: a gust speed sensor, or `false`.                                                       |
| `inputs.today`     | on the device                                         | Rain: today's total. Solar: today's energy. Or `false`.                                      |
| `inputs.wind`      | –                                                     | Rain: a wind speed sensor that slants the drops, or `false`.                                 |
| `inputs.power`     | on the battery's or the plug's device                 | Battery: its power, positive while it charges. Plug: the power it draws, or `false`.         |
| `inputs.charge`    | –                                                     | Battery: its charging power, with `discharge` in place of `power`.                           |
| `inputs.discharge` | –                                                     | Battery: its discharging power.                                                              |
| `inputs.import`    | –                                                     | Grid: the import power, with `export` in place of one signed sensor.                         |
| `inputs.export`    | –                                                     | Grid: the export power.                                                                      |
| `inputs.range`     | on the car's device                                   | Car: a distance sensor, or `false`.                                                          |
| `inputs.plugged`   | on the car's device                                   | Car: a plug binary sensor, or `false`.                                                       |
| `inputs.charging`  | on the car's device                                   | Car: a charging binary sensor, or a wallbox's power sensor (charging above 0 W), or `false`. |
| `inputs.location`  | on the car's device                                   | Car: its device tracker, or `false`.                                                         |
| `inputs.remaining` | on the appliance's device                             | Appliance kinds: the time left, a duration or a timestamp when it finishes, or `false`.      |
| `inputs.phase`     | on the appliance's device                             | Appliance kinds: its phase (an enum or a select), shown as its status, or `false`.           |
| `running_above`    | `5`                                                   | Appliance kinds: the power in W above which it runs.                                         |
| `series`           | required for `trend`                                  | Trend: entity ids, or `{ entity, name, color, rules, visibility }`.                          |
