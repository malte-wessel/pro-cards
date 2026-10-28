---
layout: home
hero:
  name: Pro Cards
  text: Every card your dashboard needs.
  tagline: Cards that match the look and feel of Home Assistant and adapt to your dashboard with rules, templates, layouts and animated flows. Installed with HACS, styled by your theme.
  actions:
    - theme: brand
      text: Install with HACS
      link: https://my.home-assistant.io/redirect/hacs_repository/?owner=malte-wessel&repository=pro-cards&category=plugin
    - theme: alt
      text: Get started
      link: /guide/getting-started
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
            - type: custom:entity-card-pro
              entity: sensor.solar_power
              name: Solar
              icon: mdi:solar-power-variant
              layout: poster
              decimals: 1
              visual: sparkline
              hours_to_show: 12
              rules:
                - { below: 0.1, color: grey, label: Idle }
                - { above: 0.1, color: amber, label: Producing }
            - type: custom:weather-card-pro
              entity: weather.home
              name: Outside
              layout: poster
              temperature_rules:
                - { below: 5, color: blue, label: Cold }
                - { below: 20, color: teal, label: Mild }
                - { above: 20, color: orange, label: Warm }
            - type: custom:wind-card-pro
              entity: sensor.wind_speed
              direction: sensor.wind_direction
              gust: sensor.wind_gust
              name: Wind
              layout: poster
              visual: flow
              rules:
                - { below: 5, color: blue-grey, label: Calm }
                - { below: 20, color: teal, label: Breeze }
                - { below: 35, color: amber, label: Fresh }
                - { above: 35, color: orange, label: Strong }
            - type: custom:rain-card-pro
              entity: sensor.rain_rate_roof
              today: sensor.rain_today
              wind: sensor.wind_speed
              direction: sensor.wind_direction
              name: Rain
              layout: poster
              visual: flow
              rules:
                - { below: 0.1, color: blue-grey, label: Dry }
                - { below: 2.5, color: light-blue, label: Light }
                - { above: 2.5, color: blue, label: Heavy }
            - type: custom:sun-path-card-pro
              layout: poster
            - type: custom:entity-card-pro
              entity: sensor.heat_pump_power
              name: Heat pump
              icon: mdi:heat-pump
              layout: poster
              decimals: 0
              visual: sparkline
              hours_to_show: 12
              color: deep-orange
            - type: custom:entity-card-pro
              entity: climate.living_room
              name: Thermostat
              layout: poster
              attribute: current_temperature
              unit: °C
              decimals: 1
              visual: bar
              min: 15
              max: 28
              control: stepper
              color: deep-orange
              badges:
                - entity: climate.living_room
                  attribute: hvac_action
                  rules:
                    - { state: heating, color: deep-orange, icon: mdi:fire, label: Heating }
                    - { state: idle, color: grey, icon: mdi:fire-off, label: Idle }
                    - { state: "off", color: grey, icon: mdi:power, label: "Off" }
            - type: custom:multi-trend-card-pro
              title: Power
              icon: mdi:flash
              color: amber
              hours_to_show: 12
              layout: poster
              entities:
                - { entity: sensor.power_consumption, name: Home, color: amber }
                - { entity: sensor.heat_pump_power, name: Heat pump, color: deep-orange }
            - type: custom:entity-card-pro
              entity: vacuum.robot
              name: Robot
              layout: poster
              control: buttons
              control_options:
                - { icon: mdi:play, action: { action: perform-action, perform_action: vacuum.start, target: { entity_id: vacuum.robot } } }
                - { icon: mdi:home-import-outline, action: { action: perform-action, perform_action: vacuum.return_to_base, target: { entity_id: vacuum.robot } } }
              rules:
                - { state: cleaning, color: teal }
                - { state: docked, color: grey }
              badges:
                - { entity: sensor.robot_battery, visual: ring }
                - sensor.robot_current_room
            - type: custom:layout-card-pro
              rows: [1fr, 1fr, 1fr]
              view_layout: { span: [1, 3] }
              cards:
                - type: custom:entity-card-pro
                  entity: media_player.living_room_tv
                  name: TV
                  icon: mdi:television-play
                  attribute: media_title
                  color: deep-purple
                - type: custom:entity-card-pro
                  entity: media_player.kitchen_speaker
                  name: Speaker
                  icon: mdi:speaker
                  attribute: media_title
                  color: green
                - type: custom:entity-card-pro
                  entity: switch.coffee_machine
                  name: Coffee machine
                  icon: mdi:coffee
                  control: toggle
                  control_position: lead
                  color: brown
            - type: custom:entity-card-pro
              entity: sensor.battery_soc
              name: Battery
              icon: mdi:home-battery
              layout: poster
              decimals: 0
              visual: bar
              rules:
                - { below: 20, color: red, label: Low }
                - { below: 50, color: amber, label: Half }
                - { above: 50, color: green, label: Full }
              badges:
                - { entity: sensor.battery_power, format: power, icon: mdi:flash }
            - type: custom:entity-card-pro
              entity: sensor.living_room_co2
              name: Air
              icon: mdi:molecule-co2
              layout: poster
              decimals: 0
              visual: columns
              hours_to_show: 12
              bucket_minutes: 30
              rules:
                - { below: 800, color: green, label: Fresh }
                - { below: 1200, color: amber, label: Stuffy }
                - { above: 1200, color: red, label: Ventilate }
            - type: custom:entity-card-pro
              entity: sensor.living_room_temperature
              name: Temperature
              icon: mdi:thermometer
              layout: poster
              decimals: 1
              visual: sparkline
              hours_to_show: 24
              rules:
                - { below: 18, color: blue, label: Cool }
                - { below: 24, color: green, label: Comfortable }
                - { above: 24, color: orange, label: Warm }
            - type: custom:entity-card-pro
              entity: sensor.living_room_humidity
              name: Humidity
              icon: mdi:water-percent
              layout: poster
              decimals: 0
              visual: gauge
              min: 0
              max: 100
              rules:
                - { below: 40, color: amber, label: Dry }
                - { below: 60, color: teal, label: Good }
                - { above: 60, color: blue, label: Humid }
            - type: custom:entity-card-pro
              entity: light.living_room
              name: Ceiling
              layout: poster
              value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
              unit: "%"
              control: slider
              tap_action: { action: toggle }
              rules: &light
                - { state: "on", color: amber }
                - { state: "off", color: grey }
            - type: custom:entity-card-pro
              entity: sensor.grid_power
              name: Grid
              icon: mdi:transmission-tower
              layout: poster
              decimals: 0
              visual: columns
              hours_to_show: 12
              bucket_minutes: 30
              rules:
                - { below: 0, color: green, label: Exporting }
                - { above: 0, color: blue, label: Importing }
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
            - type: custom:entity-card-pro
              entity: light.desk_lamp
              name: Desk lamp
              layout: poster
              value: "{{ (state_attr('light.desk_lamp', 'brightness') | float(0) / 2.55) | round }}"
              unit: "%"
              control: slider
              tap_action: { action: toggle }
              rules: *light
            - type: custom:entity-card-pro
              entity: cover.living_room_blinds
              name: Blinds
              icon: mdi:blinds-horizontal
              layout: poster
              attribute: current_position
              unit: "%"
              control: slider
              color: indigo
            - type: custom:entity-card-pro
              entity: fan.living_room
              name: Fan
              layout: poster
              attribute: percentage
              unit: "%"
              control: segments
              rules:
                - { state: "on", color: cyan }
                - { state: "off", color: grey }
            - type: custom:entity-card-pro
              entity: media_player.kitchen_speaker
              name: Kitchen speaker
              layout: poster
              icon: mdi:speaker
              attribute: media_title
              control: buttons
              rules:
                - { state: playing, color: green, label: Playing }
                - { state: idle, color: grey, label: Idle }
            - type: custom:entity-card-pro
              entity: light.dining_table
              name: Dining table
              layout: poster
              value: "{{ (state_attr('light.dining_table', 'brightness') | float(0) / 2.55) | round }}"
              unit: "%"
              control: slider
              tap_action: { action: toggle }
              rules: *light
            - type: custom:entity-card-pro
              entity: sensor.pressure
              name: Pressure
              icon: mdi:gauge
              layout: poster
              decimals: 0
              visual: sparkline
              hours_to_show: 24
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
  - title: "Weather you can see moving."
    text: "Wind and rain are animated fields that follow your sensors: faster in a storm, still on a calm day, always from the right direction."
    link: /cards/wind-card
    label: Wind and rain cards
    columns: 2
    cards:
      - type: custom:wind-card-pro
        entity: sensor.wind_speed
        direction: sensor.wind_direction
        gust: sensor.wind_gust
        name: Wind
        layout: poster
        visual: flow
        rules:
          - { below: 5, color: blue-grey, label: Calm }
          - { below: 20, color: teal, label: Breeze }
          - { below: 35, color: amber, label: Fresh }
          - { above: 35, color: orange, label: Strong }
      - type: custom:rain-card-pro
        entity: sensor.rain_rate_roof
        today: sensor.rain_today
        wind: sensor.wind_speed
        direction: sensor.wind_direction
        name: Rain
        layout: poster
        visual: flow
        rules:
          - { below: 0.1, color: blue-grey, label: Dry }
          - { below: 2.5, color: light-blue, label: Light }
          - { above: 2.5, color: blue, label: Heavy }
  - title: "Control, right on the card."
    text: "Steppers, sliders, segments, locks and your own buttons sit on the card itself. Swipe through and try them, no dialog opens."
    link: /cards/controls
    label: Controls
    cards:
      - type: custom:swipe-card-pro
        per_page: 1.3
        breakpoints:
          2: { per_page: 2.3 }
        cards:
          - type: custom:entity-card-pro
            entity: climate.living_room
            name: Thermostat
            layout: poster
            attribute: current_temperature
            unit: °C
            decimals: 1
            visual: bar
            min: 15
            max: 28
            control: stepper
            color: deep-orange
            badges:
              - entity: climate.living_room
                attribute: hvac_action
                rules:
                  - { state: heating, color: deep-orange, icon: mdi:fire, label: Heating }
                  - { state: idle, color: grey, icon: mdi:fire-off, label: Idle }
                  - { state: "off", color: grey, icon: mdi:power, label: "Off" }
          - type: custom:entity-card-pro
            entity: fan.living_room
            name: Fan
            layout: poster
            attribute: percentage
            unit: "%"
            control: segments
            rules:
              - { state: "on", color: cyan }
              - { state: "off", color: grey }
          - type: custom:entity-card-pro
            entity: cover.living_room_blinds
            name: Blinds
            icon: mdi:blinds-horizontal
            layout: poster
            attribute: current_position
            unit: "%"
            control: slider
            color: indigo
          - type: custom:entity-card-pro
            entity: lock.front_door
            name: Front door
            layout: poster
            control: auto
            rules:
              - { state: locked, color: green, icon: mdi:shield-lock }
              - { state: unlocked, color: red, icon: mdi:shield-lock-open }
            badges:
              - entity: binary_sensor.door_front
                rules:
                  - { state: "on", color: red, icon: mdi:door-open, label: Open }
                  - { state: "off", color: green, icon: mdi:door-closed, label: Closed }
          - type: custom:entity-card-pro
            entity: media_player.kitchen_speaker
            name: Kitchen speaker
            layout: poster
            icon: mdi:speaker
            attribute: media_title
            control: buttons
            rules:
              - { state: playing, color: green, label: Playing }
              - { state: idle, color: grey, label: Idle }
          - type: custom:entity-card-pro
            entity: vacuum.robot
            name: Robot
            layout: poster
            control: buttons
            control_options:
              - { icon: mdi:play, action: { action: perform-action, perform_action: vacuum.start, target: { entity_id: vacuum.robot } } }
              - { icon: mdi:home-import-outline, action: { action: perform-action, perform_action: vacuum.return_to_base, target: { entity_id: vacuum.robot } } }
            rules:
              - { state: cleaning, color: teal }
              - { state: docked, color: grey }
            badges:
              - { entity: sensor.robot_battery, visual: ring }
              - sensor.robot_current_room
  - title: "A whole room in one card."
    text: "Lights, scenes and devices together in one card, or as tiles stacked in one cell. Lay them out your way with the layout card."
    link: /cards/entity-group-card
    label: Group card
    columns: 2
    cards:
      - type: custom:entity-group-card-pro
        title: Living room
        icon: mdi:sofa
        layout: table
        vertical_align: bottom
        entities:
          - entity: light.desk_lamp
            name: Desk lamp
            control: toggle
            rules: &lamp
              - { state: "on", color: amber }
              - { state: "off", color: grey }
          - entity: light.living_room
            name: Ceiling
            control: slider
            rules: *lamp
          - entity: cover.living_room_blinds
            name: Blinds
            icon: mdi:blinds-horizontal
            attribute: current_position
            unit: "%"
            control: slider
            color: indigo
          - name: Scenes
            icon: mdi:palette
            control: buttons
            control_options:
              - { entity: scene.bright, icon: mdi:white-balance-sunny, color: amber }
              - { entity: scene.dinner, icon: mdi:silverware-fork-knife, color: deep-orange }
              - { entity: scene.movie_night, icon: mdi:movie-open, color: deep-purple }
              - { entity: scene.good_night, icon: mdi:weather-night, color: indigo }
      - type: custom:layout-card-pro
        rows: [1fr, 1fr, 1fr]
        cards:
          - type: custom:entity-card-pro
            entity: media_player.living_room_tv
            name: TV
            icon: mdi:television-play
            attribute: media_title
            color: deep-purple
          - type: custom:entity-card-pro
            entity: media_player.kitchen_speaker
            name: Speaker
            icon: mdi:speaker
            attribute: media_title
            color: green
          - type: custom:entity-card-pro
            entity: switch.coffee_machine
            name: Coffee machine
            icon: mdi:coffee
            control: toggle
            control_position: lead
            color: brown
  - title: "One value, front and centre."
    text: "A poster gives any entity one big value, a pill and badges. Rules turn thresholds into colours, labels and icons, so a glance is enough."
    link: /cards/entity-card#poster
    label: Posters
    columns: 2
    cards:
      - type: custom:entity-card-pro
        entity: lock.front_door
        name: Front door
        layout: poster
        control: auto
        rules:
          - { state: locked, color: green, icon: mdi:shield-lock }
          - { state: unlocked, color: red, icon: mdi:shield-lock-open }
        badges:
          - entity: binary_sensor.door_front
            rules:
              - { state: "on", color: red, icon: mdi:door-open, label: Open }
              - { state: "off", color: green, icon: mdi:door-closed, label: Closed }
      - type: custom:entity-card-pro
        entity: sensor.living_room_co2
        name: Air
        icon: mdi:molecule-co2
        layout: poster
        decimals: 0
        visual: columns
        hours_to_show: 12
        bucket_minutes: 30
        rules:
          - { below: 800, color: green, label: Fresh }
          - { below: 1200, color: amber, label: Stuffy }
          - { above: 1200, color: red, label: Ventilate }
  - title: "Follow the sun."
    text: "Its path through the day, the time to sunset, and which side of your house it shines on right now."
    link: /cards/sun-path-card
    label: Sun cards
    columns: 2
    cards:
      - type: custom:sun-path-card-pro
        layout: poster
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
