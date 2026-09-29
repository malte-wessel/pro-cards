---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather station

A weather view built from every kind of card: the hero as the headline, trends for the details, the sun path and daylight for context, strips for the last 24 hours.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IE5vdywgaWNvbjogbWRpOndlYXRoZXItcGFydGx5LWNsb3VkeSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktZ3JvdXAtY2FyZAogICAgICB0aXRsZTogV2VhdGhlciBzdGF0aW9uCiAgICAgIGljb246IG1kaTp3ZWF0aGVyLXBhcnRseS1jbG91ZHkKICAgICAgbGF5b3V0OiBoZXJvCiAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgIGVudGl0aWVzOgogICAgICAgIC0gZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZQogICAgICAgICAgbmFtZTogVGVtcGVyYXR1cmUKICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICB2aXN1YWw6IHNwYXJrbGluZQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IGluZGlnbywgaWNvbjogbWRpOnNub3dmbGFrZSwgbGFiZWw6IEZyb3N0LCB0aW50X2NhcmQ6IHRydWUgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDE2LCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOnRoZXJtb21ldGVyLWxvdywgbGFiZWw6IENvb2wgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDI2LCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTp0aGVybW9tZXRlciwgbGFiZWw6IFBsZWFzYW50IH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAyNiwgY29sb3I6IG9yYW5nZSwgaWNvbjogbWRpOnRoZXJtb21ldGVyLWhpZ2gsIGxhYmVsOiBIb3QsIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHksIG5hbWU6IEh1bWlkaXR5LCB2aXN1YWw6IGJhZGdlIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZCwgbmFtZTogV2luZCwgdmlzdWFsOiBiYWRnZSB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLnByZXNzdXJlLCBuYW1lOiBQcmVzc3VyZSwgZGVjaW1hbHM6IDAsIHZpc3VhbDogYmFkZ2UgfQogICAgICAgIC0gZW50aXR5OiBzZW5zb3IudXZfaW5kZXgKICAgICAgICAgIG5hbWU6IFVWIGluZGV4CiAgICAgICAgICB2aXN1YWw6IGJhcgogICAgICAgICAgbWluOiAwCiAgICAgICAgICBtYXg6IDExCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAzLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDYsIGNvbG9yOiBhbWJlciwgbGFiZWw6IE1vZGVyYXRlIH0KICAgICAgICAgICAgLSB7IGJlbG93OiA4LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogSGlnaCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogOCwgY29sb3I6IHJlZCwgbGFiZWw6IFZlcnkgaGlnaCB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IGJpbmFyeV9zZW5zb3IucmFpbgogICAgICBuYW1lOiBSYWluCiAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IHN0YXRlOiAib24iLCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOndlYXRoZXItcmFpbnksIGxhYmVsOiBSYWluaW5nIH0KICAgICAgICAtIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSwgaWNvbjogbWRpOndlYXRoZXItY2xvdWR5LCBsYWJlbDogRHJ5IH0KICAgICAgaG91cnNfdG9fc2hvdzogMjQKICAgICAgYnVja2V0X21pbnV0ZXM6IDMwCiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkCiAgICAgIGVudGl0eTogc2Vuc29yLndpbmRfZ3VzdAogICAgICBuYW1lOiBHdXN0cwogICAgICBkZWNpbWFsczogMAogICAgICB2aXN1YWw6IGNvbHVtbnMKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHRlYWwgfQogICAgICAgIC0geyBiZWxvdzogMzUsIGNvbG9yOiBhbWJlciwgbGFiZWw6IEZyZXNoIH0KICAgICAgICAtIHsgYWJvdmU6IDM1LCBjb2xvcjogcmVkLCBsYWJlbDogQXduaW5nIGluLCB0aW50X2NhcmQ6IHRydWUgfQogICAgICBob3Vyc190b19zaG93OiA2CiAgICAgIGJ1Y2tldF9taW51dGVzOiAxNQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTpzdW4tcGF0aC1jYXJkCiAgICAgIGxhYmVsczogeyBzdW5yaXNlOiBTdW5yaXNlLCBzdW5zZXQ6IFN1bnNldCwgZGF3bjogRGF3biwgbm9vbjogU29sYXIgbm9vbiwgZHVzazogRHVzayB9CiAgICAgIHRpdGxlOiBTdW4KLSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFRyZW5kcywgaWNvbjogbWRpOmNoYXJ0LWxpbmUgfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogVGVtcGVyYXR1cmUgJiBkZXcgcG9pbnQKICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyCiAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgIHhfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZSwgbmFtZTogVGVtcGVyYXR1cmUsIGNvbG9yOiByZWQgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQsIG5hbWU6IERldyBwb2ludCwgY29sb3I6IGJsdWUgfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogV2luZAogICAgICBpY29uOiBtZGk6d2VhdGhlci13aW5keQogICAgICBjb2xvcjogdGVhbAogICAgICBob3Vyc190b19zaG93OiAxMgogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZCwgbmFtZTogU3BlZWQsIGNvbG9yOiB0ZWFsIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iud2luZF9ndXN0LCBuYW1lOiBHdXN0cywgY29sb3I6IG9yYW5nZSB9CiAgICAtIHR5cGU6IGN1c3RvbTptdWx0aS10cmVuZC1jYXJkCiAgICAgIHRpdGxlOiBQcmVzc3VyZQogICAgICBpY29uOiBtZGk6Z2F1Z2UKICAgICAgY29sb3I6IHB1cnBsZQogICAgICBob3Vyc190b19zaG93OiA0OAogICAgICB5X2F4aXM6IHRydWUKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLnByZXNzdXJlLCBuYW1lOiBQcmVzc3VyZSwgY29sb3I6IHB1cnBsZSB9CiAgICAtIHR5cGU6IGN1c3RvbTppbGx1bWluYW5jZS1jYXJkCiAgICAgIHpvbmVzOgogICAgICAgIG5pZ2h0OiB7IGxhYmVsOiBOaWdodCB9CiAgICAgICAgdHdpbGlnaHQ6IHsgbGFiZWw6IFR3aWxpZ2h0IH0KICAgICAgICBvdmVyY2FzdDogeyBsYWJlbDogT3ZlcmNhc3QgfQogICAgICAgIGRheTogeyBsYWJlbDogRGF5IH0KICAgICAgICBzdW46IHsgbGFiZWw6IFN1biB9CiAgICAgIGVudGl0eTogc2Vuc29yLmlsbHVtaW5hbmNlCiAgICAgIG1vZGU6IHRyZW5kCiAgICAgIG5hbWU6IERheWxpZ2h0Ci0gY29sdW1uX3NwYW46IDEKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBMYXN0IDI0IGhvdXJzLCBpY29uOiBtZGk6Y2hhcnQtdGltZWxpbmUgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IFRpbWVsaW5lCiAgICAgIGljb246IG1kaTpjaGFydC10aW1lbGluZQogICAgICBob3Vyc190b19zaG93OiAyNAogICAgICBidWNrZXRfbWludXRlczogNjAKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5vdXRkb29yX3RlbXBlcmF0dXJlCiAgICAgICAgICBuYW1lOiBUZW1wZXJhdHVyZQogICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDAsIGNvbG9yOiBpbmRpZ28gfQogICAgICAgICAgICAtIHsgYmVsb3c6IDE2LCBjb2xvcjogYmx1ZSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMjYsIGNvbG9yOiBncmVlbiB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMjYsIGNvbG9yOiBvcmFuZ2UgfQogICAgICAgIC0gZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgbmFtZTogV2luZAogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDEwLCBjb2xvcjogZ3JlZW4gfQogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDM1LCBjb2xvcjogb3JhbmdlIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAzNSwgY29sb3I6IHJlZCB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5pbGx1bWluYW5jZQogICAgICAgICAgbmFtZTogRGF5bGlnaHQKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAxLCBjb2xvcjogaW5kaWdvIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMDAsIGNvbG9yOiBibHVlIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMDAwMCwgY29sb3I6IGJsdWUtZ3JleSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMzAwMDAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMzAwMDAsIGNvbG9yOiBvcmFuZ2UgfQogICAgICAgIC0gZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl9odW1pZGl0eQogICAgICAgICAgbmFtZTogSHVtaWRpdHkKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiA0MCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGJlbG93OiA3MCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA3MCwgY29sb3I6IGJsdWUgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IFN0YXRpb24KICAgICAgaWNvbjogbWRpOmFjY2Vzcy1wb2ludAogICAgICBsYXlvdXQ6IGdyaWQKICAgICAgY29sdW1uczogMgogICAgICBlbnRpdGllczoKICAgICAgICAtIGVudGl0eTogc2Vuc29yLndlYXRoZXJfc3RhdGlvbl9iYXR0ZXJ5CiAgICAgICAgICBuYW1lOiBCYXR0ZXJ5CiAgICAgICAgICB2aXN1YWw6IHJpbmcKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogcmVkIH0KICAgICAgICAgICAgLSB7IGJlbG93OiA1MCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA1MCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZQogICAgICAgICAgbmFtZTogUmFpbiByYXRlCiAgICAgICAgICBpY29uOiBtZGk6d2VhdGhlci1wb3VyaW5nCiAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMC4xLCBjb2xvcjogZ3JleSwgbGFiZWw6IERyeSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMC4xLCBjb2xvcjogYmx1ZSwgbGFiZWw6IFJhaW4gfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQsIG5hbWU6IERldyBwb2ludCwgY29sb3I6IHRlYWwsIGRlY2ltYWxzOiAxIH0KICAgICAgICAtIGVudGl0eTogc3VuLnN1bgogICAgICAgICAgbmFtZTogU3VuCiAgICAgICAgICB2aXN1YWw6IGJhZGdlCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiBhYm92ZV9ob3Jpem9uLCBjb2xvcjogYW1iZXIsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55LCBsYWJlbDogVXAgfQogICAgICAgICAgICAtIHsgc3RhdGU6IGJlbG93X2hvcml6b24sIGNvbG9yOiBpbmRpZ28sIGljb246IG1kaTp3ZWF0aGVyLW5pZ2h0LCBsYWJlbDogRG93biB9Cg==">

```yaml
- column_span: 1
  cards:
    - { type: heading, heading: Now, icon: mdi:weather-partly-cloudy }
    - type: custom:entity-group-card
      title: Weather station
      icon: mdi:weather-partly-cloudy
      layout: hero
      hours_to_show: 24
      entities:
        - entity: sensor.outdoor_temperature
          name: Temperature
          decimals: 1
          visual: sparkline
          rules:
            - { below: 0, color: indigo, icon: mdi:snowflake, label: Frost, tint_card: true }
            - { below: 16, color: blue, icon: mdi:thermometer-low, label: Cool }
            - { below: 26, color: green, icon: mdi:thermometer, label: Pleasant }
            - { above: 26, color: orange, icon: mdi:thermometer-high, label: Hot, tint_card: true }
        - { entity: sensor.outdoor_humidity, name: Humidity, visual: badge }
        - { entity: sensor.wind_speed, name: Wind, visual: badge }
        - { entity: sensor.pressure, name: Pressure, decimals: 0, visual: badge }
        - entity: sensor.uv_index
          name: UV index
          visual: bar
          min: 0
          max: 11
          rules:
            - { below: 3, color: green, label: Low }
            - { below: 6, color: amber, label: Moderate }
            - { below: 8, color: orange, label: High }
            - { above: 8, color: red, label: Very high }
    - type: custom:entity-card
      entity: binary_sensor.rain
      name: Rain
      visual: strip
      rules:
        - { state: "on", color: blue, icon: mdi:weather-rainy, label: Raining }
        - { state: "off", color: grey, icon: mdi:weather-cloudy, label: Dry }
      hours_to_show: 24
      bucket_minutes: 30
      grid_options: { columns: 6 }
    - type: custom:entity-card
      entity: sensor.wind_gust
      name: Gusts
      decimals: 0
      visual: columns
      rules:
        - { below: 20, color: teal }
        - { below: 35, color: amber, label: Fresh }
        - { above: 35, color: red, label: Awning in, tint_card: true }
      hours_to_show: 6
      bucket_minutes: 15
      grid_options: { columns: 6 }
    - type: custom:sun-path-card
      labels: { sunrise: Sunrise, sunset: Sunset, dawn: Dawn, noon: Solar noon, dusk: Dusk }
      title: Sun
- column_span: 1
  cards:
    - { type: heading, heading: Trends, icon: mdi:chart-line }
    - type: custom:multi-trend-card
      title: Temperature & dew point
      icon: mdi:thermometer
      hours_to_show: 24
      x_axis: true
      entities:
        - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
        - { entity: sensor.dew_point, name: Dew point, color: blue }
    - type: custom:multi-trend-card
      title: Wind
      icon: mdi:weather-windy
      color: teal
      hours_to_show: 12
      entities:
        - { entity: sensor.wind_speed, name: Speed, color: teal }
        - { entity: sensor.wind_gust, name: Gusts, color: orange }
    - type: custom:multi-trend-card
      title: Pressure
      icon: mdi:gauge
      color: purple
      hours_to_show: 48
      y_axis: true
      entities:
        - { entity: sensor.pressure, name: Pressure, color: purple }
    - type: custom:illuminance-card
      zones:
        night: { label: Night }
        twilight: { label: Twilight }
        overcast: { label: Overcast }
        day: { label: Day }
        sun: { label: Sun }
      entity: sensor.illuminance
      mode: trend
      name: Daylight
- column_span: 1
  cards:
    - { type: heading, heading: Last 24 hours, icon: mdi:chart-timeline }
    - type: custom:entity-group-card
      title: Timeline
      icon: mdi:chart-timeline
      hours_to_show: 24
      bucket_minutes: 60
      entities:
        - entity: sensor.outdoor_temperature
          name: Temperature
          decimals: 1
          visual: strip
          rules:
            - { below: 0, color: indigo }
            - { below: 16, color: blue }
            - { below: 26, color: green }
            - { above: 26, color: orange }
        - entity: sensor.wind_speed
          name: Wind
          decimals: 0
          visual: strip
          rules:
            - { below: 10, color: green }
            - { below: 20, color: amber }
            - { below: 35, color: orange }
            - { above: 35, color: red }
        - entity: sensor.illuminance
          name: Daylight
          decimals: 0
          visual: strip
          rules:
            - { below: 1, color: indigo }
            - { below: 100, color: blue }
            - { below: 10000, color: blue-grey }
            - { below: 30000, color: amber }
            - { above: 30000, color: orange }
        - entity: sensor.outdoor_humidity
          name: Humidity
          decimals: 0
          visual: strip
          rules:
            - { below: 40, color: amber }
            - { below: 70, color: green }
            - { above: 70, color: blue }
    - type: custom:entity-group-card
      title: Station
      icon: mdi:access-point
      layout: grid
      columns: 2
      entities:
        - entity: sensor.weather_station_battery
          name: Battery
          visual: ring
          rules:
            - { below: 20, color: red }
            - { below: 50, color: amber }
            - { above: 50, color: green }
        - entity: sensor.rain_rate
          name: Rain rate
          icon: mdi:weather-pouring
          decimals: 1
          rules:
            - { below: 0.1, color: grey, label: Dry }
            - { above: 0.1, color: blue, label: Rain }
        - { entity: sensor.dew_point, name: Dew point, color: teal, decimals: 1 }
        - entity: sun.sun
          name: Sun
          visual: badge
          rules:
            - { state: above_horizon, color: amber, icon: mdi:white-balance-sunny, label: Up }
            - { state: below_horizon, color: indigo, icon: mdi:weather-night, label: Down }
```

</DashboardGrid>
