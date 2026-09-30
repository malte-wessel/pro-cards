---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather station

A weather view built from every kind of card: the weather card as the headline with the forecast, trends for the details, the sun path and daylight for context, strips for the last 24 hours.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IE5vdywgaWNvbjogbWRpOndlYXRoZXItcGFydGx5LWNsb3VkeSB9CiAgICAtIHR5cGU6IGN1c3RvbTp3ZWF0aGVyLWNhcmQKICAgICAgZW50aXR5OiB3ZWF0aGVyLmhvbWUKICAgICAgdGl0bGU6IFdlYXRoZXIKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IHN0YXRlOiBsaWdodG5pbmctcmFpbnksIGNvbG9yOiByZWQsIGxhYmVsOiBTdG9ybSB3YXJuaW5nLCB0aW50X2NhcmQ6IHRydWUgfQogICAgICB0ZW1wZXJhdHVyZV9ydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDAsIGNvbG9yOiBpbmRpZ28sIGxhYmVsOiBGcm9zdCwgdGludF9jYXJkOiB0cnVlIH0KICAgICAgICAtIHsgYmVsb3c6IDE2LCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvb2wgfQogICAgICAgIC0geyBiZWxvdzogMjYsIGNvbG9yOiBncmVlbiwgbGFiZWw6IFBsZWFzYW50IH0KICAgICAgICAtIHsgYWJvdmU6IDI2LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogSG90LCB0aW50X2NhcmQ6IHRydWUgfQogICAgICBzZWN0aW9uczoKICAgICAgICAtIHR5cGU6IGhlcm8KICAgICAgICAtIHR5cGU6IGdyaWQKICAgICAgICAgIGNvbHVtbnM6IDIKICAgICAgICAgIGVudGl0aWVzOgogICAgICAgICAgICAtIGh1bWlkaXR5CiAgICAgICAgICAgIC0gd2luZF9zcGVlZAogICAgICAgICAgICAtIHByZXNzdXJlCiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3IudXZfaW5kZXgKICAgICAgICAgICAgICBuYW1lOiBVViBpbmRleAogICAgICAgICAgICAgIHZpc3VhbDogYmFyCiAgICAgICAgICAgICAgbWluOiAwCiAgICAgICAgICAgICAgbWF4OiAxMQogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAzLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiA2LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBNb2RlcmF0ZSB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDgsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBIaWdoIH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogOCwgY29sb3I6IHJlZCwgbGFiZWw6IFZlcnkgaGlnaCB9CiAgICAgICAgLSB0eXBlOiB0cmVuZAogICAgICAgICAgbW9kZTogaG91cmx5CiAgICAgICAgICBob3VyczogMTIKICAgICAgICAgIHNob3c6IFt0ZW1wZXJhdHVyZSwgcHJlY2lwaXRhdGlvbl0KICAgICAgICAtIHR5cGU6IGZvcmVjYXN0CiAgICAgICAgICBtb2RlOiBkYWlseQogICAgICAgICAgZGF5czogNQogICAgICAgICAgZGl2aWRlcjogdHJ1ZQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQKICAgICAgZW50aXR5OiBiaW5hcnlfc2Vuc29yLnJhaW4KICAgICAgbmFtZTogUmFpbgogICAgICB2aXN1YWw6IHN0cmlwCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBzdGF0ZTogIm9uIiwgY29sb3I6IGJsdWUsIGljb246IG1kaTp3ZWF0aGVyLXJhaW55LCBsYWJlbDogUmFpbmluZyB9CiAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGljb246IG1kaTp3ZWF0aGVyLWNsb3VkeSwgbGFiZWw6IERyeSB9CiAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgIGJ1Y2tldF9taW51dGVzOiAzMAogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci53aW5kX2d1c3QKICAgICAgbmFtZTogR3VzdHMKICAgICAgZGVjaW1hbHM6IDAKICAgICAgdmlzdWFsOiBjb2x1bW5zCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiB0ZWFsIH0KICAgICAgICAtIHsgYmVsb3c6IDM1LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBGcmVzaCB9CiAgICAgICAgLSB7IGFib3ZlOiAzNSwgY29sb3I6IHJlZCwgbGFiZWw6IEF3bmluZyBpbiwgdGludF9jYXJkOiB0cnVlIH0KICAgICAgaG91cnNfdG9fc2hvdzogNgogICAgICBidWNrZXRfbWludXRlczogMTUKICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDYgfQogICAgLSB0eXBlOiBjdXN0b206c3VuLXBhdGgtY2FyZAogICAgICBsYWJlbHM6IHsgc3VucmlzZTogU3VucmlzZSwgc3Vuc2V0OiBTdW5zZXQsIGRhd246IERhd24sIG5vb246IFNvbGFyIG5vb24sIGR1c2s6IER1c2sgfQogICAgICB0aXRsZTogU3VuCi0gY29sdW1uX3NwYW46IDEKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBUcmVuZHMsIGljb246IG1kaTpjaGFydC1saW5lIH0KICAgIC0gdHlwZTogY3VzdG9tOm11bHRpLXRyZW5kLWNhcmQKICAgICAgdGl0bGU6IFRlbXBlcmF0dXJlICYgZGV3IHBvaW50CiAgICAgIGljb246IG1kaTp0aGVybW9tZXRlcgogICAgICBob3Vyc190b19zaG93OiAyNAogICAgICB4X2F4aXM6IHRydWUKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUsIG5hbWU6IFRlbXBlcmF0dXJlLCBjb2xvcjogcmVkIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuZGV3X3BvaW50LCBuYW1lOiBEZXcgcG9pbnQsIGNvbG9yOiBibHVlIH0KICAgIC0gdHlwZTogY3VzdG9tOm11bHRpLXRyZW5kLWNhcmQKICAgICAgdGl0bGU6IFdpbmQKICAgICAgaWNvbjogbWRpOndlYXRoZXItd2luZHkKICAgICAgY29sb3I6IHRlYWwKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLndpbmRfc3BlZWQsIG5hbWU6IFNwZWVkLCBjb2xvcjogdGVhbCB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLndpbmRfZ3VzdCwgbmFtZTogR3VzdHMsIGNvbG9yOiBvcmFuZ2UgfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogUHJlc3N1cmUKICAgICAgaWNvbjogbWRpOmdhdWdlCiAgICAgIGNvbG9yOiBwdXJwbGUKICAgICAgaG91cnNfdG9fc2hvdzogNDgKICAgICAgeV9heGlzOiB0cnVlCiAgICAgIGVudGl0aWVzOgogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5wcmVzc3VyZSwgbmFtZTogUHJlc3N1cmUsIGNvbG9yOiBwdXJwbGUgfQogICAgLSB0eXBlOiBjdXN0b206aWxsdW1pbmFuY2UtY2FyZAogICAgICB6b25lczoKICAgICAgICBuaWdodDogeyBsYWJlbDogTmlnaHQgfQogICAgICAgIHR3aWxpZ2h0OiB7IGxhYmVsOiBUd2lsaWdodCB9CiAgICAgICAgb3ZlcmNhc3Q6IHsgbGFiZWw6IE92ZXJjYXN0IH0KICAgICAgICBkYXk6IHsgbGFiZWw6IERheSB9CiAgICAgICAgc3VuOiB7IGxhYmVsOiBTdW4gfQogICAgICBlbnRpdHk6IHNlbnNvci5pbGx1bWluYW5jZQogICAgICBtb2RlOiB0cmVuZAogICAgICBuYW1lOiBEYXlsaWdodAotIGNvbHVtbl9zcGFuOiAxCiAgY2FyZHM6CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogTGFzdCAyNCBob3VycywgaWNvbjogbWRpOmNoYXJ0LXRpbWVsaW5lIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkCiAgICAgIHRpdGxlOiBUaW1lbGluZQogICAgICBpY29uOiBtZGk6Y2hhcnQtdGltZWxpbmUKICAgICAgaG91cnNfdG9fc2hvdzogMjQKICAgICAgYnVja2V0X21pbnV0ZXM6IDYwCiAgICAgIGVudGl0aWVzOgogICAgICAgIC0gZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZQogICAgICAgICAgbmFtZTogVGVtcGVyYXR1cmUKICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAwLCBjb2xvcjogaW5kaWdvIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxNiwgY29sb3I6IGJsdWUgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDI2LCBjb2xvcjogZ3JlZW4gfQogICAgICAgICAgICAtIHsgYWJvdmU6IDI2LCBjb2xvcjogb3JhbmdlIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgICAgIG5hbWU6IFdpbmQKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAxMCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAzNSwgY29sb3I6IG9yYW5nZSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMzUsIGNvbG9yOiByZWQgfQogICAgICAgIC0gZW50aXR5OiBzZW5zb3IuaWxsdW1pbmFuY2UKICAgICAgICAgIG5hbWU6IERheWxpZ2h0CiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMSwgY29sb3I6IGluZGlnbyB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMTAwLCBjb2xvcjogYmx1ZSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMTAwMDAsIGNvbG9yOiBibHVlLWdyZXkgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDMwMDAwLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDMwMDAwLCBjb2xvcjogb3JhbmdlIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHkKICAgICAgICAgIG5hbWU6IEh1bWlkaXR5CiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogNDAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgIC0geyBiZWxvdzogNzAsIGNvbG9yOiBncmVlbiB9CiAgICAgICAgICAgIC0geyBhYm92ZTogNzAsIGNvbG9yOiBibHVlIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkCiAgICAgIHRpdGxlOiBTdGF0aW9uCiAgICAgIGljb246IG1kaTphY2Nlc3MtcG9pbnQKICAgICAgbGF5b3V0OiBncmlkCiAgICAgIGNvbHVtbnM6IDIKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci53ZWF0aGVyX3N0YXRpb25fYmF0dGVyeQogICAgICAgICAgbmFtZTogQmF0dGVyeQogICAgICAgICAgdmlzdWFsOiByaW5nCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHJlZCB9CiAgICAgICAgICAgIC0geyBiZWxvdzogNTAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgIC0geyBhYm92ZTogNTAsIGNvbG9yOiBncmVlbiB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGUKICAgICAgICAgIG5hbWU6IFJhaW4gcmF0ZQogICAgICAgICAgaWNvbjogbWRpOndlYXRoZXItcG91cmluZwogICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGdyZXksIGxhYmVsOiBEcnkgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDAuMSwgY29sb3I6IGJsdWUsIGxhYmVsOiBSYWluIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuZGV3X3BvaW50LCBuYW1lOiBEZXcgcG9pbnQsIGNvbG9yOiB0ZWFsLCBkZWNpbWFsczogMSB9CiAgICAgICAgLSBlbnRpdHk6IHN1bi5zdW4KICAgICAgICAgIG5hbWU6IFN1bgogICAgICAgICAgdmlzdWFsOiBiYWRnZQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogYWJvdmVfaG9yaXpvbiwgY29sb3I6IGFtYmVyLCBpY29uOiBtZGk6d2hpdGUtYmFsYW5jZS1zdW5ueSwgbGFiZWw6IFVwIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiBiZWxvd19ob3Jpem9uLCBjb2xvcjogaW5kaWdvLCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCwgbGFiZWw6IERvd24gfQo=">

```yaml
- column_span: 1
  cards:
    - { type: heading, heading: Now, icon: mdi:weather-partly-cloudy }
    - type: custom:weather-card
      entity: weather.home
      title: Weather
      rules:
        - { state: lightning-rainy, color: red, label: Storm warning, tint_card: true }
      temperature_rules:
        - { below: 0, color: indigo, label: Frost, tint_card: true }
        - { below: 16, color: blue, label: Cool }
        - { below: 26, color: green, label: Pleasant }
        - { above: 26, color: orange, label: Hot, tint_card: true }
      sections:
        - type: hero
        - type: grid
          columns: 2
          entities:
            - humidity
            - wind_speed
            - pressure
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
        - type: trend
          mode: hourly
          hours: 12
          show: [temperature, precipitation]
        - type: forecast
          mode: daily
          days: 5
          divider: true
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
