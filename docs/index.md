---
layout: home
hero:
  name: Pro Cards
  text: Every card your dashboard needs.
  tagline: Cards that match the look and feel of Home Assistant and adapt to your dashboard with rules, templates, layouts and animated flows. Installed from the Marketplace, styled by your theme.
  actions:
    - theme: brand
      text: Install from the Marketplace
      link: https://my.home-assistant.io/redirect/hacs_repository/?owner=malte-wessel&repository=pro-cards&category=plugin
    - theme: alt
      text: Get started
      link: /guide/introduction
  # on a phone, in place of the backdrop: these posters in a swipe card under the buttons
  # (HeroSwipe.vue; each in a layout card, which gives it a poster's three rows)
  swipe:
    - { entity: sensor.wind_speed, name: Wind, visual: { type: flow, variant: lines } }
    - entity: sensor.rain_rate_roof
      name: Rain
      visual: { type: flow, variant: drops }
      inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
    - { kind: sun }
    - { entity: climate.living_room, name: Thermostat }
    - { entity: sensor.battery_soc, name: Battery, inputs: { power: sensor.battery_power } }
    - { entity: vacuum.robot, name: Robot, badges: [sensor.robot_current_room] }
  # the hero's backdrop (HeroDashboard.vue): posters picked from the dashboards below, live but inert
  dashboard:
    - column_span: 4
      cards:
        - type: custom:layout-card-pro
          columns: 2
          breakpoints:
            2: { columns: 4 }
            3: { columns: 6 }
          cards:
            - type: custom:poster-card-pro
              entity: sensor.solar_power
              name: Solar
              kind: solar
            - type: custom:poster-card-pro
              entity: weather.home
              name: Outside
            - type: custom:poster-card-pro
              entity: sensor.wind_speed
              name: Wind
              visual: { type: flow, variant: lines }
            - type: custom:poster-card-pro
              entity: sensor.rain_rate_roof
              name: Rain
              visual: { type: flow, variant: drops }
              inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
            - type: custom:poster-card-pro
              kind: sun
            - type: custom:poster-card-pro
              entity: climate.living_room
              name: Thermostat
            - type: custom:poster-card-pro
              entity: sensor.heat_pump_power
              name: Heat pump
              kind: heat_pump
              running_above: 50
            - type: custom:poster-card-pro
              name: Power
              icon: mdi:flash
              color: amber
              kind: trend
              visual: { hours: 12 }
              series:
                - { entity: sensor.power_consumption, name: Home, color: amber }
                - { entity: sensor.heat_pump_power, name: Heat pump, color: deep-orange }
            - type: custom:poster-card-pro
              entity: vacuum.robot
              name: Robot
              badges:
                - sensor.robot_current_room
            - type: custom:layout-card-pro
              rows: [1fr, 1fr, 1fr]
              view_layout: { span: [1, 3] }
              cards:
                - type: custom:tile-card-pro
                  entity: fan.living_room
                  name: Fan
                  control: false
                  status_badge: true
                - type: custom:tile-card-pro
                  entity: sensor.ev_battery
                  name: Car
                  kind: car
                  status_badge: true
                - type: custom:tile-card-pro
                  name: Laundry
                  icon: mdi:washing-machine
                  value: "{{ states('sensor.washer_remaining') }}"
                  unit: min
                  secondary: "{{ states('sensor.washer_power') | round }} W now"
                  status: "{{ 'Running' if states('sensor.washer_remaining') | int(0) > 0 else 'Done' }}"
                  color: "{{ 'teal' if states('sensor.washer_remaining') | int(0) > 0 else 'grey' }}"
                  tap_action: { action: more-info, entity: sensor.washer_status }
                  status_badge: true
            - type: custom:poster-card-pro
              entity: sensor.battery_soc
              name: Battery
              inputs: { power: sensor.battery_power }
            - type: custom:poster-card-pro
              entity: sensor.living_room_co2
              name: Air
              visual: { type: columns, hours: 12, bucket: 30 }
            - type: custom:poster-card-pro
              entity: sensor.living_room_temperature
              name: Temperature
              decimals: 1
              visual: { type: sparkline, hours: 24 }
              rules:
                - { below: 18, color: blue, status: Cool }
                - { below: 24, color: green, status: Comfortable }
                - { above: 24, color: orange, status: Warm }
            - type: custom:poster-card-pro
              entity: sensor.living_room_humidity
              name: Humidity
              decimals: 0
              visual: gauge
              min: 0
              max: 100
              rules:
                - { below: 40, color: amber, status: Dry }
                - { below: 60, color: teal, status: Good }
                - { above: 60, color: blue, status: Humid }
            - type: custom:poster-card-pro
              entity: light.living_room
              name: Ceiling
            - type: custom:poster-card-pro
              entity: sensor.grid_power
              name: Grid
              kind: grid
            - type: custom:power-flow-card-pro
              title: Now
              icon: mdi:flash
              home: sensor.power_consumption
              view_layout: { span: [2, 6] }
              sources:
                - { type: solar, entity: sensor.solar_power }
                - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
                - { type: grid, power: sensor.grid_power, price: sensor.electricity_price }
              consumers:
                - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
                - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
                - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
                - { entity: sensor.ev_charger_power, name: EV charger, icon: mdi:ev-station }
              rules:
                - { below: 500, color: green, label: Quiet }
                - { below: 3000, color: amber, label: Busy }
                - { above: 3000, color: red, label: Peak }
            - type: custom:poster-card-pro
              entity: light.desk_lamp
              name: Desk lamp
            - type: custom:poster-card-pro
              entity: cover.living_room_blinds
              name: Blinds
            - type: custom:poster-card-pro
              entity: fan.living_room
              name: Fan
            - type: custom:poster-card-pro
              entity: media_player.kitchen_speaker
              name: Kitchen speaker
            - type: custom:poster-card-pro
              entity: light.dining_table
              name: Dining table
            - type: custom:poster-card-pro
              entity: sensor.pressure
              name: Pressure
              decimals: 0
              visual: { type: sparkline, hours: 24 }
              color: indigo
# the feature rows below the hero (FeatureRows.vue): copy and live cards, sides alternating
feature_rows:
  - title: "Every watt, live."
    text: "The power flow follows your home second by second: what the sun makes, what the battery holds, what the grid takes, and where every watt goes."
    link: /cards/power-flow-card
    label: Power flow card
    cards:
      - type: custom:power-flow-card-pro
        title: Now
        icon: mdi:flash
        home: sensor.power_consumption
        tap_action: { action: navigate, navigation_path: /cards/power-flow-card }
        sources:
          - { type: solar, entity: sensor.solar_power }
          - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
          - { type: grid, power: sensor.grid_power, price: sensor.electricity_price }
        consumers:
          - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
          - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
          - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
          - { entity: sensor.ev_charger_power, name: EV charger, icon: mdi:ev-station }
        rules:
          - { below: 500, color: green, label: Quiet }
          - { below: 3000, color: amber, label: Busy }
          - { above: 3000, color: red, label: Peak }
  - title: "One value, front and centre."
    text: "A poster gives any entity one big value, a status and badges, and draws it the way it is: the air in its colours, a gauge, the power with its rules, the sun's day, a dishwasher that is done. Swipe through them."
    link: /cards/poster-card
    label: Posters
    cards:
      - type: custom:swipe-card-pro
        per_page: 1.2
        breakpoints:
          2: { per_page: 2.2 }
        cards:
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sensor.living_room_co2
                name: Air
                tap_action: { action: navigate, navigation_path: /cards/kinds#air-quality }
                visual: { type: columns, hours: 12, bucket: 30 }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sensor.living_room_humidity
                name: Humidity
                decimals: 0
                visual: gauge
                tap_action: { action: navigate, navigation_path: /cards/look#the-places }
                min: 0
                max: 100
                rules:
                  - { below: 40, color: amber, status: Dry }
                  - { below: 60, color: teal, status: Good }
                  - { above: 60, color: blue, status: Humid }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sensor.power_consumption
                name: Power
                tap_action: { action: navigate, navigation_path: /cards/look#rules }
                visual: { type: sparkline, hours: 12 }
                rules:
                  - { below: 1000, color: green, status: Low }
                  - { below: 3000, color: amber, status: Normal }
                  - { above: 3000, color: red, status: High, style: filled, pulse: true }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sensor.battery_soc
                name: Home battery
                tap_action: { action: navigate, navigation_path: /cards/kinds#battery }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sensor.solar_power
                name: Solar
                tap_action: { action: navigate, navigation_path: /cards/kinds#solar }
                kind: solar
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sun.sun
                tap_action: { action: navigate, navigation_path: /cards/kinds#sun }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: sensor.dishwasher_status
                name: Dishwasher
                tap_action: { action: navigate, navigation_path: /cards/look#values-from-templates }
                value: "{{ states('sensor.dishwasher_status') | replace('power_off', 'Off') | replace('run', 'Running') | replace('end', 'Done') }}"
                rules:
                  - { state: Running, color: green, icon: mdi:dishwasher }
                  - { state: Done, color: teal, icon: mdi:dishwasher-alert }
                  - { state: "Off", color: grey, icon: mdi:dishwasher-off }
                badges:
                  - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:timer-outline }
  - title: "A whole room in one card."
    text: "Lights, scenes and devices together in a tile group, and the room's last day beside them, hour by hour in its colours."
    link: /cards/tile-group-card
    label: Tile group
    columns: 2
    cards:
      - type: custom:tile-group-card-pro
        title: Living room
        icon: mdi:sofa
        title_tap_action: &group { action: navigate, navigation_path: /cards/tile-group-card#tiles-and-header }
        tiles:
          - { entity: light.desk_lamp, name: Desk lamp, tap_action: *group }
          - { entity: light.living_room, name: Ceiling, control: slider, tap_action: *group }
          - { entity: cover.living_room_blinds, name: Blinds, control: slider, tap_action: *group }
          - name: Scenes
            icon: mdi:palette
            tap_action: *group
            control:
              type: buttons
              options:
                - { entity: scene.bright, icon: mdi:white-balance-sunny, color: amber }
                - { entity: scene.dinner, icon: mdi:silverware-fork-knife, color: deep-orange }
                - { entity: scene.movie_night, icon: mdi:movie-open, color: deep-purple }
                - { entity: scene.good_night, icon: mdi:weather-night, color: indigo }
      - type: custom:tile-group-card-pro
        title: Last 24 hours
        icon: mdi:chart-timeline
        title_tap_action: &own { action: navigate, navigation_path: /cards/tile-group-card#tiles-of-their-own }
        tiles:
          - entity: sensor.living_room_temperature
            name: Temperature
            tap_action: *own
            decimals: 1
            visual: { type: strip, hours: 24, bucket: 60 }
            rules:
              - { below: 18, color: blue, icon: mdi:thermometer-low }
              - { below: 24, color: green, icon: mdi:thermometer }
              - { above: 24, color: orange, icon: mdi:thermometer-high }
          - entity: sensor.living_room_humidity
            name: Humidity
            tap_action: *own
            decimals: 0
            visual: { type: strip, hours: 24, bucket: 60 }
            rules:
              - { below: 40, color: amber, status: Dry }
              - { below: 60, color: teal, status: Good }
              - { above: 60, color: blue, status: Humid }
          - entity: sensor.living_room_co2
            name: Air
            tap_action: *own
            visual: { type: strip, hours: 24, bucket: 60 }
  - title: "Control, right on the card."
    text: "Steppers, sliders, segments, selects and locks sit on the card itself. Swipe through and try them, no dialog opens."
    link: /cards/controls
    label: Controls
    cards:
      - type: custom:swipe-card-pro
        per_page: 1.2
        breakpoints:
          2: { per_page: 2.2 }
        cards:
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: climate.living_room
                name: Thermostat
                tap_action: { action: navigate, navigation_path: /cards/controls#climate-and-air }
          # three tiles stacked: a poster's height
          - type: custom:layout-card-pro
            cards:
              - type: custom:tile-card-pro
                entity: light.desk_lamp
                name: Desk lamp
                tap_action: { action: navigate, navigation_path: /cards/controls#what-the-kinds-bring }
              - type: custom:tile-card-pro
                entity: cover.living_room_blinds
                name: Blinds
                tap_action: { action: navigate, navigation_path: /cards/controls#covers-and-valves }
              - type: custom:tile-card-pro
                entity: input_select.house_mode
                name: Mode
                tap_action: { action: navigate, navigation_path: /cards/controls#helpers-updates-and-dates }
                control: select
                show_value: false
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: fan.living_room
                name: Fan
                tap_action: { action: navigate, navigation_path: /cards/controls#climate-and-air }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: cover.living_room_blinds
                name: Blinds
                tap_action: { action: navigate, navigation_path: /cards/controls#covers-and-valves }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: lock.front_door
                name: Front door
                tap_action: { action: navigate, navigation_path: /cards/controls#media-robots-locks-and-alarms }
                badges:
                  - entity: binary_sensor.door_front
                    rules:
                      - { state: "on", color: red, icon: mdi:door-open, value: Open }
                      - { state: "off", color: green, icon: mdi:door-closed, value: Closed }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: media_player.kitchen_speaker
                name: Kitchen speaker
                tap_action: { action: navigate, navigation_path: /cards/controls#media-robots-locks-and-alarms }
          - type: custom:layout-card-pro
            cards:
              - type: custom:poster-card-pro
                entity: vacuum.robot
                name: Robot
                tap_action: { action: navigate, navigation_path: /cards/controls#media-robots-locks-and-alarms }
                badges:
                  - sensor.robot_current_room
  - title: "Weather you can see moving."
    text: "Wind and rain are animated fields that follow your sensors: faster in a storm, still on a calm day, always from the right direction."
    link: /cards/kinds#wind
    label: Wind and rain posters
    columns: 2
    cards:
      - type: custom:poster-card-pro
        entity: sensor.wind_speed
        name: Wind
        tap_action: { action: navigate, navigation_path: /cards/kinds#wind }
        visual: { type: flow, variant: lines }
      - type: custom:poster-card-pro
        entity: sensor.rain_rate_roof
        name: Rain
        tap_action: { action: navigate, navigation_path: /cards/kinds#rain }
        visual: { type: flow, variant: drops }
        inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
  - title: "Follow the sun."
    text: "Its path through the day, the time to sunset, and which side of your house it shines on right now."
    link: /cards/sun-azimuth-card
    label: Sun azimuth card
    cards:
      # one layout row of the posters' height: both cards the same size
      - type: custom:layout-card-pro
        columns: 2
        rows: [232px]
        cards:
          - type: custom:poster-card-pro
            kind: sun
            tap_action: { action: navigate, navigation_path: /cards/kinds#sun }
            grid_options: { rows: auto }
          - type: custom:sun-azimuth-card-pro
            show_summary: false
            camera: 280
# the dashboards below the feature rows (DashboardLinks.vue): each a page of the Showcase
dashboards:
  - title: Home
    text: The whole house on one screen, from the clock and the people to posters for everything.
    link: /showcase/home
  - title: Energy
    text: Every watt and every kilowatt-hour, from the live power flow to the day's totals.
    link: /showcase/energy
  - title: Living room
    text: A room you run without opening a dialog, with switches, sliders and your own scenes.
    link: /showcase/living-room
  - title: Weather
    text: The forecast, wind and rain as moving fields, and the sun over your house.
    link: /showcase/weather
---

<FeatureRows />

<DashboardLinks />

## Found something off?

[Open an issue](https://github.com/malte-wessel/pro-cards/issues).
