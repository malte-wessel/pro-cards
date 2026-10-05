---
sidebar: false
outline: false
aside: false
pageClass: wide
---

# Playground

Pick a preset or paste your own YAML. Only entities of the simulated home exist here, see the [entity list](#entities) below.

<ClientOnly><Playground /></ClientOnly>

## Entities

The simulated home has these entities. Values drift every few seconds and have a history.

- **Weather station**: `binary_sensor.rain`, `sensor.dew_point`, `sensor.illuminance`, `sensor.outdoor_humidity`, `sensor.outdoor_temperature`, `sensor.pressure`, `sensor.rain_rate`, `sensor.rain_rate_roof`, `sensor.rain_today`, `sensor.uv_index`, `sensor.weather_station_battery`, `sensor.wind_direction`, `sensor.wind_gust`, `sensor.wind_speed`, `sun.sun`, `weather.home`
- **Rooms**: `sensor.bathroom_humidity`, `sensor.bathroom_temperature`, `sensor.bedroom_temperature`, `sensor.hallway_temperature`, `sensor.kitchen_humidity`, `sensor.kitchen_temperature`, `sensor.living_room_co2`, `sensor.living_room_humidity`, `sensor.living_room_temperature`, `sensor.office_co2`, `sensor.office_temperature`
- **Lights, switches, covers, climate**: `climate.bedroom`, `climate.living_room`, `cover.awning`, `cover.bedroom_blinds`, `cover.garage_door`, `cover.living_room_blinds`, `cover.office_blinds`, `fan.bathroom`, `fan.bedroom`, `fan.living_room`, `light.bedroom`, `light.desk_lamp`, `light.dining_table`, `light.garden`, `light.hallway`, `light.kitchen`, `light.living_room`, `light.office`, `switch.coffee_machine`, `switch.garden_pump`
- **Doors, windows, motion**: `binary_sensor.door_front`, `binary_sensor.motion_hallway`, `binary_sensor.window_bathroom`, `binary_sensor.window_bedroom`, `binary_sensor.window_kitchen`, `binary_sensor.window_office`
- **Appliances and media**: `media_player.kitchen_speaker`, `media_player.living_room_tv`, `sensor.dishwasher_status`, `sensor.robot_battery`, `sensor.robot_current_room`, `sensor.robot_dustbin_remaining`, `sensor.robot_last_area`, `sensor.robot_progress`, `sensor.robot_total_cleanings`, `sensor.switch_temperature`, `sensor.washer_remaining`, `sensor.washer_status`, `vacuum.robot`
- **Locks and helpers (controls)**: `lock.front_door`, `lock.garage_side_door`, `input_number.heating_boost`, `input_number.target_humidity`, `number.ev_charge_limit`, `input_select.house_mode`, `select.thermostat_schedule`, `input_button.ring_doorbell`, `button.restart_router`
- **Offline (unavailable)**: `light.shed`, `switch.shed_heater`, `climate.shed`, `cover.shed_door`, `lock.shed`, `select.shed_program`
- **People, modes, scenes, scripts**: `input_boolean.away_mode`, `input_boolean.guest_mode`, `input_boolean.night_mode`, `input_boolean.vacation_mode`, `person.alex`, `person.kim`, `person.sam`, `scene.bright`, `scene.dimmed`, `scene.dinner`, `scene.good_night`, `scene.movie_night`, `script.check_windows`
- **Energy**: `binary_sensor.grid_outage`, `sensor.battery_power`, `sensor.battery_soc`, `sensor.battery_temperature`, `sensor.dining_light_power`, `sensor.dryer_power`, `sensor.electricity_price`, `sensor.energy_today`, `sensor.generator_power`, `sensor.grid_fossil_percentage`, `sensor.grid_power`, `sensor.heat_pump_power`, `sensor.office_power`, `sensor.power_consumption`, `sensor.range_hood_power`, `sensor.solar_east`, `sensor.solar_power`, `sensor.solar_west`, `sensor.washer_power`
- **Electric car**: `binary_sensor.ev_plugged`, `sensor.ev_battery`, `sensor.ev_charger_power`, `sensor.ev_range`
- **Device batteries**: `sensor.kitchen_window_battery`, `sensor.motion_hallway_battery`
