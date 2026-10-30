# Poster Card Pro

`custom:poster-card-pro` draws one entity as a poster: the icon at the top left, the badges at the top right, and at the bottom the name in small capitals and the value, large. What fills these places depends on the entity's **poster type**: a CO₂ sensor brings its air quality bands, a wind sensor its animated field, a media player its cover art. The poster type is detected from the entity, so most posters are just `entity:`. Every place can be set with a key of its own, and a poster needs no entity at all.

::: info Beta
The poster card is new in 3.0 and in beta: its options may still change.
:::

## Anatomy

A poster is three rows high in a sections grid (two at least) and keeps its content at the bottom of whatever height it gets. From top to bottom:

- the **lead** at the top left: the icon, the entity's picture or the poster type's own drawing;
- the **badges** at the top right, the first of them the **status badge** (the matching rule's label here);
- the **name**, the large **value** and the line under it, with the controls beside them (under them on a narrow card);
- the **picture** along the bottom: here the last 12 hours as a sparkline;
- behind it all, the **backdrop** (an image, or what the poster type draws there).

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
    - { above: 3000, color: red, label: High, style: filled, pulse: true }
  badges:
    - sensor.solar_power
    - sensor.battery_power
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.living_room_temperature
  name: Living room
  grid_options: { columns: 6 }
```

:::

## Poster types

A poster type is what the entity is. It supplies the poster's defaults: some types fill every place their own way, others only bring their own [rules](#rules). Detection takes the first match: the domain (`weather.*`, `sun.sun` …), then the device class, then `entity`, which brings nothing. `poster` names another type, gives one to an entity without a device class, names one that is never detected, or (`poster: entity`) switches every default off; no other key decides the type. A poster has one type; several subjects on one card are [badges](#badges).

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

### Entity

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

### Battery and air quality

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

### Weather

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

### Sun

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

### Wind

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

### Rain

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

### Trend

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

### Light

A light: a glow from the bottom of the card in the light's own colour (`rgb_color`, else Home Assistant's colour for a light that is on), as strong as its brightness and gone while it is off. The brightness is large, the switch beside it and the brightness slider along the bottom; `control: false` leaves them out.

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
```

:::

### Fan

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

### Climate

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

### Lock

A lock: the padlock in the lead is held to lock or unlock (a ring fills around it; a screen reader presses it twice), the state is large, and a jammed lock pulses red.

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

### Alarm

An alarm panel: held to arm it (away) or disarm it, its state large, red and pulsing while triggered. A panel that wants a code has no control here: a tap opens Home Assistant's dialog with its keypad.

::: live

```yaml
type: custom:poster-card-pro
entity: alarm_control_panel.home
```

:::

### Person

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

### Media player

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

### Cover

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

### Vacuum and lawn mower

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

### Grid

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

### Solar

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

### Car

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

### Appliance

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

## Slots

Every place has one key, the same for every poster type. Each takes plain text or a template; a key replaces one place and keeps the rest of the type.

| Place           | Key         | Default                                                 |
| --------------- | ----------- | ------------------------------------------------------- |
| Lead            | `icon`      | the entity's icon or picture, the type's drawing        |
| Status badge    | `status`    | the type's status, else the matching rule's label       |
| Name            | `name`      | the friendly name                                       |
| Value           | `value`     | the state (`attribute` shows an attribute)              |
| Under the value | `secondary` | the type's line                                         |
| Colour          | `color`     | the matching rule's, else Home Assistant's state colour |
| Picture         | `visual`    | the type's drawing                                      |
| Backdrop        | `image`     | the type's backdrop                                     |

Without an entity the keys fill the poster alone. A tap then does nothing unless `tap_action` says what. [Custom posters](/cards/poster-custom) builds posters from these keys, step by step:

::: live

```yaml
type: custom:poster-card-pro
name: Laundry
icon: mdi:washing-machine
value: "{{ states('sensor.washer_remaining') }}"
unit: min
secondary: "{{ states('sensor.washer_power') }} W"
status: "{{ 'Running' if states('sensor.washer_remaining') | int(0) > 0 else 'Done' }}"
color: "{{ 'teal' if states('sensor.washer_remaining') | int(0) > 0 else 'grey' }}"
tap_action: { action: more-info, entity: sensor.washer_status }
```

:::

## Badges

The corner is one list of badges with the keys of [header badges](/cards/heading-card#badge-options): `visual` (`ring`, `bar`, `sparkline`, `trend`, `count`, `dot`), `style`, `size`, `format`, `stale_after`, a switch with `control: toggle`, their own actions and `visibility`. They are outline pills unless a `style` says otherwise.

A badge without `entity` reads the poster's own: `attribute` shows one of its attributes (a weather attribute keeps its unit), and a badge with neither shows the poster's value again, say as a ring.

::: live

```yaml
- type: custom:poster-card-pro
  entity: weather.home
  attribute: temperature
  name: Outside
  icon: mdi:thermometer
  badges:
    - { attribute: humidity, icon: mdi:water-percent }
    - { attribute: wind_speed, icon: mdi:weather-windy }
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  badges:
    - { visual: ring, show_icon: false }
    - binary_sensor.ev_plugged
    - sensor.ev_range
  grid_options: { columns: 6 }
```

:::

### The status badge

The poster's own label is a badge too: the **status badge**, first in the corner. It is a `tag` (an outline in the poster's colour with its text in small capitals, without an icon) and says the poster type's status, else the matching rule's label; with nothing to say it takes no room. The poster's rules set its `style` and make it `pulse`.

`status` gives it a text (a template allowed), an object of badge keys (with `value` for its text), or `false` to drop it. `status` in `badges` places it elsewhere:

::: live

```yaml
- type: custom:poster-card-pro
  entity: sensor.ev_battery
  name: Car
  icon: mdi:car-electric
  rules:
    - { below: 20, color: red, label: Low }
    - { above: 20, color: green, label: Ready }
  status: { style: soft, icon: mdi:battery }
  badges:
    - entity: binary_sensor.ev_plugged
      rules:
        - { state: "on", color: green, icon: mdi:power-plug, label: Plugged in }
        - { state: "off", color: grey, icon: mdi:power-plug-off, label: Unplugged }
    - sensor.ev_range
    - status
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: sensor.dishwasher_status
  name: Dishwasher
  icon: mdi:dishwasher
  value: "{{ states('sensor.dishwasher_status') | replace('end', 'Done') | replace('run', 'Running') }}"
  status: false
  badges:
    - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:timer-outline }
  grid_options: { columns: 6 }
```

:::

## Controls

Every poster type takes `control` and its options, as the [entity cards](/cards/controls) do: a control needs a domain that supports it, and custom `buttons` call any action. The domain types (light, cover, media player …) bring their controls by default; `control: false` removes them, a name picks another. Every other type has none unless asked:

::: live

```yaml
- type: custom:poster-card-pro
  entity: climate.living_room
  name: Thermostat
  attribute: current_temperature
  unit: °C
  control: stepper
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: input_number.heating_boost
  name: Boost
  control: slider
  grid_options: { columns: 6 }
```

:::

A tap on the poster opens more-info; the controls and the badges take their own taps. [Poster controls](/cards/poster-controls) has every control, where it sits, your own buttons and holds.

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

## Rules

`rules` pick colour, icon and label by value or state, as on every Pro card; the first that matches wins. `state` matches the value **or** the entity's own state, so `{ state: playing }` works on a media player shown by its title. A poster type's own rules apply until the card has `rules`, which replace them as a whole; `rules: []` drops them.

### Predefined rules

Their labels are translated. Copy a set to change one band:

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

## Images and backdrops

`image` puts a picture behind the whole poster, under a scrim that keeps the texts readable: a URL, a template, or an entity whose picture it shows (a camera's snapshot, a media player's art, a person's photo). `image: false` drops a poster type's own backdrop.

::: live

```yaml
- type: custom:poster-card-pro
  entity: person.alex
  image: person.alex
  icon: mdi:account
  grid_options: { columns: 6 }
- type: custom:poster-card-pro
  entity: person.sam
  image: person.sam
  icon: mdi:account
  grid_options: { columns: 6 }
```

:::

A camera's snapshot behind a lock: who is at the door, held to open it.

::: live

```yaml
type: custom:poster-card-pro
entity: lock.front_door
image: camera.front_door
```

:::

## From the 2.9 betas

The 2.9 betas drew posters with `layout: poster` on the entity, group, sections, wind, rain, weather, sun path and multi trend cards. That layout is gone: those cards are tiles, lists and plots again, and a poster is this card. To move one over, change its type to `custom:poster-card-pro`, drop `layout: poster` and let the poster type bring what you had set by hand (icons, controls, the standard bands); keep `name`, your own rules and the grid options. The keys map like this:

| 2.9 beta                                                                    | Poster card                                                                 |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `custom:entity-card-pro` with `layout: poster`                              | `custom:poster-card-pro`, the same keys                                     |
| a group or sections card's `poster`: the rest as badges                     | `badges`                                                                    |
| the label pill                                                              | the status badge (`status`)                                                 |
| wind and rain cards: `layout: poster`, `direction`, `gust`, `today`, `wind` | the same keys on the poster, found on the device                            |
| wind and rain cards: `visual: flow` with `flow.style`                       | `variant`, the same names (`variant: lines`)                                |
| wind and rain cards: `lead: arrow`, `lead: icon`                            | `icon` replaces the animated lead                                           |
| weather card: `rules` and `temperature_rules`                               | one `rules`: `state` reads the condition, `below` / `above` the temperature |
| weather card: `icons: mdi`                                                  | `show_entity_picture: false`                                                |
| sun path card: `day_color`                                                  | `color`                                                                     |
| sun path card: `labels`                                                     | `name` and `value` templates                                                |
| multi trend card: `layout: poster`, `entities`                              | `poster: trend`, `series`                                                   |

## Reference

### Card options

| Option                                        | Default             | Description                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity`                                      | –                   | The entity; its domain and device class pick the poster type. Optional: the keys alone fill a poster.                                                                                                                                                                  |
| `poster`                                      | detected            | A poster type's name: forces it, names one never detected, or (`entity`) turns every default off; see [Poster types](#poster-types).                                                                                                                                   |
| `variant`                                     | the type's          | How the poster type draws its subject; see [Options of a poster type](#options-of-a-poster-type).                                                                                                                                                                      |
| `direction`, `gust`, `today` …                | found on the device | The entities a poster type reads (`direction`, `gust`, `today`, `wind`, `power`, `charge`, `discharge`, `import`, `export`, `range`, `plugged`, `charging`, `location`): an entity id, or `false` for none; see [Options of a poster type](#options-of-a-poster-type). |
| `running_above`, `series`                     | –                   | The appliance's threshold and the trend's series; see [Options of a poster type](#options-of-a-poster-type).                                                                                                                                                           |
| `name`, `icon`, `value`, `secondary`, `color` | the type's          | The places; templates allowed. `attribute`, `unit`, `decimals`, `prefix`, `suffix` as on the entity cards.                                                                                                                                                             |
| `status`                                      | the type's          | The status badge: a text or a template, an object of badge keys with `value` for its text, or `false`.                                                                                                                                                                 |
| `badges`                                      | –                   | The badges in the corner, in order; `status` places the status badge.                                                                                                                                                                                                  |
| `visual`                                      | the type's          | The picture: `sparkline`, `columns`, `strip`, `bar`, `gauge`, `ring` (around the icon), `icon` for none.                                                                                                                                                               |
| `image`                                       | the type's          | The backdrop: a URL, a template or an entity's picture; `false` drops the type's.                                                                                                                                                                                      |
| `rules`                                       | the type's          | Colour, icon, label, `style`, `pulse`, `tint_card` by value or state; they replace the type's own.                                                                                                                                                                     |
| `control`                                     | the type's          | A control as on the [entity cards](/cards/controls); `false` drops the type's.                                                                                                                                                                                         |
| `hours_to_show`                               | `24`                | The picture's window.                                                                                                                                                                                                                                                  |
| `tap_action` …                                | `more-info`         | `tap_action`, `hold_action`, `double_tap_action`; `none` without an entity.                                                                                                                                                                                            |
| `hover`                                       | `false`             | Home Assistant's hover and press layers.                                                                                                                                                                                                                               |

Like every card, this one also accepts `grid_options`, `visibility`, `view_layout` and `card_mod`. A poster takes half a section (6 columns) and three rows by default, two at least; `fill_height: false` keeps it at its own height.
