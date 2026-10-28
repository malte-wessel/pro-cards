---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather dashboard

Read the weather at a glance. The [weather card](/cards/weather-card) forecasts by the hour and the day, the [wind](/cards/wind-card) and the [rain](/cards/rain-card) move as animated fields, the [sun path](/cards/sun-path-card) and the [sun azimuth](/cards/sun-azimuth-card) show where the sun is and which walls it lights, and status strips colour a day of any sensor. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogV2VhdGhlcgogICAgICBzdWJ0aXRsZTogInt7IHN0YXRlcygnc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUnKSB9fSDCsEMgwrcgd2luZCB7eyBzdGF0ZXMoJ3NlbnNvci53aW5kX3NwZWVkJykgfX0ga20vaCDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5yYWluX3RvZGF5JykgfX0gbW0gcmFpbiB0b2RheSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19Iiwgc2hvd19pY29uOiBmYWxzZSwgdGFwX2FjdGlvbjogeyBhY3Rpb246IG5vbmUgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgY29sdW1uczogMgogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDQgfQogICAgICBjYXJkczoKICAgICAgICAtIHR5cGU6IGN1c3RvbTp3ZWF0aGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHdlYXRoZXIuaG9tZQogICAgICAgICAgbmFtZTogT3V0c2lkZQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzIsIDRdIH0KICAgICAgICAgIHRlbXBlcmF0dXJlX3J1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29sZCB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiB0ZWFsLCBsYWJlbDogTWlsZCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMjAsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBXYXJtIH0KICAgICAgICAgIHNlY3Rpb25zOgogICAgICAgICAgICAtIHsgdHlwZTogaGVybyB9CiAgICAgICAgICAgIC0geyB0eXBlOiBmb3JlY2FzdCwgbW9kZTogaG91cmx5LCBsYXlvdXQ6IGhvcml6b250YWwsIGhvdXJzOiA2LCB0aXRsZTogTmV4dCA2IGhvdXJzLCBkaXZpZGVyOiB0cnVlLCBzaG93OiBbXSwgaWNvbl9zaXplOiAzMiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206c3VuLXBhdGgtY2FyZC1wcm8KICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMSwgNF0gfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnN1bi1hemltdXRoLWNhcmQtcHJvCiAgICAgICAgICBzaG93X3N1bW1hcnk6IGZhbHNlCiAgICAgICAgICBjYW1lcmE6IDI4MAogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzEsIDRdIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktZ3JvdXAtY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBMYXN0IDI0IGhvdXJzCiAgICAgICAgICBpY29uOiBtZGk6Y2hhcnQtdGltZWxpbmUKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsyLCA2XSB9CiAgICAgICAgICBob3Vyc190b19zaG93OiAyNAogICAgICAgICAgYnVja2V0X21pbnV0ZXM6IDMwCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5vdXRkb29yX3RlbXBlcmF0dXJlCiAgICAgICAgICAgICAgbmFtZTogVGVtcGVyYXR1cmUKICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogNSwgY29sb3I6IGJsdWUsIGljb246IG1kaTp0aGVybW9tZXRlci1sb3cgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAxOCwgY29sb3I6IGxpZ2h0LWJsdWUsIGljb246IG1kaTp0aGVybW9tZXRlciB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDI1LCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTp0aGVybW9tZXRlciB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDI1LCBjb2xvcjogb3JhbmdlLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXItaGlnaCB9CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgICAgIG5hbWU6IFdpbmQKICAgICAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTAsIGNvbG9yOiBibHVlLWdyZXksIGljb246IG1kaTp3ZWF0aGVyLXdpbmR5IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMjUsIGNvbG9yOiB0ZWFsLCBpY29uOiBtZGk6d2VhdGhlci13aW5keSB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDI1LCBjb2xvcjogb3JhbmdlLCBpY29uOiBtZGk6d2VhdGhlci13aW5keS12YXJpYW50IH0KICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGVfcm9vZgogICAgICAgICAgICAgIG5hbWU6IFJhaW4KICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMC4xLCBjb2xvcjogZ3JleSwgaWNvbjogbWRpOndlYXRoZXItY2xvdWR5IH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogMC4xLCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOndlYXRoZXItcmFpbnkgfQogICAgICAgICAgICAtIGVudGl0eTogc2Vuc29yLmlsbHVtaW5hbmNlCiAgICAgICAgICAgICAgbmFtZTogRGF5bGlnaHQKICAgICAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTAsIGNvbG9yOiBibHVlLWdyZXksIGljb246IG1kaTp3ZWF0aGVyLW5pZ2h0IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTAwMCwgY29sb3I6IGJsdWUsIGljb246IG1kaTp3ZWF0aGVyLXN1bnNldCB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDIwMDAwLCBjb2xvcjogYW1iZXIsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55IH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogMjAwMDAsIGNvbG9yOiBvcmFuZ2UsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55IH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpyYWluLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGVfcm9vZgogICAgICAgICAgdG9kYXk6IHNlbnNvci5yYWluX3RvZGF5CiAgICAgICAgICB3aW5kOiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgZGlyZWN0aW9uOiBzZW5zb3Iud2luZF9kaXJlY3Rpb24KICAgICAgICAgIG5hbWU6IFJhaW4KICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2aXN1YWw6IGZsb3cKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGJsdWUtZ3JleSwgbGFiZWw6IERyeSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMi41LCBjb2xvcjogbGlnaHQtYmx1ZSwgbGFiZWw6IExpZ2h0IH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAyLjUsIGNvbG9yOiBibHVlLCBsYWJlbDogSGVhdnkgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IucHJlc3N1cmUKICAgICAgICAgIG5hbWU6IFByZXNzdXJlCiAgICAgICAgICBpY29uOiBtZGk6Z2F1Z2UKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgdmlzdWFsOiBzcGFya2xpbmUKICAgICAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgICAgICBjb2xvcjogaW5kaWdvCiAgICAgICAgLSB0eXBlOiBjdXN0b206d2luZC1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgZGlyZWN0aW9uOiBzZW5zb3Iud2luZF9kaXJlY3Rpb24KICAgICAgICAgIGd1c3Q6IHNlbnNvci53aW5kX2d1c3QKICAgICAgICAgIG5hbWU6IFdpbmQKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2aXN1YWw6IGZsb3cKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLWdyZXksIGxhYmVsOiBDYWxtIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHRlYWwsIGxhYmVsOiBCcmVlemUgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDM1LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBGcmVzaCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMzUsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBTdHJvbmcgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmxheW91dC1jYXJkLXBybwogICAgICAgICAgcm93czogWzFmciwgMWZyLCAxZnJdCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMSwgM10gfQogICAgICAgICAgY2FyZHM6CiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogc2Vuc29yLnV2X2luZGV4CiAgICAgICAgICAgICAgbmFtZTogVVYgaW5kZXgKICAgICAgICAgICAgICBpY29uOiBtZGk6c3VuLXdpcmVsZXNzCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB1bml0OiAiIgogICAgICAgICAgICAgIHZpc3VhbDogcmluZwogICAgICAgICAgICAgIG1pbjogMAogICAgICAgICAgICAgIG1heDogMTEKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMywgY29sb3I6IGdyZWVuLCBsYWJlbDogTG93IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogNiwgY29sb3I6IGFtYmVyLCBsYWJlbDogTW9kZXJhdGUgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiA4LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogSGlnaCB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDgsIGNvbG9yOiByZWQsIGxhYmVsOiBWZXJ5IGhpZ2ggfQogICAgICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgICAgICBlbnRpdHk6IHNlbnNvci5vdXRkb29yX2h1bWlkaXR5CiAgICAgICAgICAgICAgbmFtZTogSHVtaWRpdHkKICAgICAgICAgICAgICBpY29uOiBtZGk6d2F0ZXItcGVyY2VudAogICAgICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICAgICAgY29sb3I6IGJsdWUKICAgICAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBzZW5zb3IuZGV3X3BvaW50CiAgICAgICAgICAgICAgbmFtZTogRGV3IHBvaW50CiAgICAgICAgICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyLXdhdGVyCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICBjb2xvcjogdGVhbAo=">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Weather
      subtitle: "{{ states('sensor.outdoor_temperature') }} °C · wind {{ states('sensor.wind_speed') }} km/h · {{ states('sensor.rain_today') }} mm rain today"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", show_icon: false, tap_action: { action: none } }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:weather-card-pro
          entity: weather.home
          name: Outside
          view_layout: { span: [2, 4] }
          temperature_rules:
            - { below: 5, color: blue, label: Cold }
            - { below: 20, color: teal, label: Mild }
            - { above: 20, color: orange, label: Warm }
          sections:
            - { type: hero }
            - { type: forecast, mode: hourly, layout: horizontal, hours: 6, title: Next 6 hours, divider: true, show: [], icon_size: 32 }
        - type: custom:sun-path-card-pro
          layout: poster
          view_layout: { span: [1, 4] }
        - type: custom:sun-azimuth-card-pro
          show_summary: false
          camera: 280
          view_layout: { span: [1, 4] }
        - type: custom:entity-group-card-pro
          title: Last 24 hours
          icon: mdi:chart-timeline
          view_layout: { span: [2, 6] }
          hours_to_show: 24
          bucket_minutes: 30
          entities:
            - entity: sensor.outdoor_temperature
              name: Temperature
              decimals: 1
              visual: strip
              rules:
                - { below: 5, color: blue, icon: mdi:thermometer-low }
                - { below: 18, color: light-blue, icon: mdi:thermometer }
                - { below: 25, color: green, icon: mdi:thermometer }
                - { above: 25, color: orange, icon: mdi:thermometer-high }
            - entity: sensor.wind_speed
              name: Wind
              decimals: 0
              visual: strip
              rules:
                - { below: 10, color: blue-grey, icon: mdi:weather-windy }
                - { below: 25, color: teal, icon: mdi:weather-windy }
                - { above: 25, color: orange, icon: mdi:weather-windy-variant }
            - entity: sensor.rain_rate_roof
              name: Rain
              decimals: 1
              visual: strip
              rules:
                - { below: 0.1, color: grey, icon: mdi:weather-cloudy }
                - { above: 0.1, color: blue, icon: mdi:weather-rainy }
            - entity: sensor.illuminance
              name: Daylight
              decimals: 0
              visual: strip
              rules:
                - { below: 10, color: blue-grey, icon: mdi:weather-night }
                - { below: 1000, color: blue, icon: mdi:weather-sunset }
                - { below: 20000, color: amber, icon: mdi:white-balance-sunny }
                - { above: 20000, color: orange, icon: mdi:white-balance-sunny }
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
        - type: custom:entity-card-pro
          entity: sensor.pressure
          name: Pressure
          icon: mdi:gauge
          layout: poster
          decimals: 0
          visual: sparkline
          hours_to_show: 24
          color: indigo
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
        - type: custom:layout-card-pro
          rows: [1fr, 1fr, 1fr]
          view_layout: { span: [1, 3] }
          cards:
            - type: custom:entity-card-pro
              entity: sensor.uv_index
              name: UV index
              icon: mdi:sun-wireless
              decimals: 1
              unit: ""
              visual: ring
              min: 0
              max: 11
              rules:
                - { below: 3, color: green, label: Low }
                - { below: 6, color: amber, label: Moderate }
                - { below: 8, color: orange, label: High }
                - { above: 8, color: red, label: Very high }
            - type: custom:entity-card-pro
              entity: sensor.outdoor_humidity
              name: Humidity
              icon: mdi:water-percent
              decimals: 0
              color: blue
            - type: custom:entity-card-pro
              entity: sensor.dew_point
              name: Dew point
              icon: mdi:thermometer-water
              decimals: 1
              color: teal
```

</DashboardGrid>
