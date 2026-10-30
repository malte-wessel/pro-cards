---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather dashboard

Read the weather at a glance. The [weather card](/cards/weather-card) forecasts by the hour and the day, the [wind](/cards/wind-card) and the [rain](/cards/rain-card) move as animated fields, the [sun path](/cards/sun-path-card) and the [sun azimuth](/cards/sun-azimuth-card) show where the sun is and which walls it lights, and status strips colour a day of any sensor. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogV2VhdGhlcgogICAgICBzdWJ0aXRsZTogInt7IHN0YXRlcygnc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUnKSB9fSDCsEMgwrcgd2luZCB7eyBzdGF0ZXMoJ3NlbnNvci53aW5kX3NwZWVkJykgfX0ga20vaCDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5yYWluX3RvZGF5JykgfX0gbW0gcmFpbiB0b2RheSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19Iiwgc2hvd19pY29uOiBmYWxzZSwgdGFwX2FjdGlvbjogeyBhY3Rpb246IG5vbmUgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgY29sdW1uczogMgogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDQgfQogICAgICBjYXJkczoKICAgICAgICAtIHR5cGU6IGN1c3RvbTp3ZWF0aGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHdlYXRoZXIuaG9tZQogICAgICAgICAgbmFtZTogT3V0c2lkZQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzIsIDRdIH0KICAgICAgICAgIHRlbXBlcmF0dXJlX3J1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29sZCB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiB0ZWFsLCBsYWJlbDogTWlsZCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMjAsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBXYXJtIH0KICAgICAgICAgIHNlY3Rpb25zOgogICAgICAgICAgICAtIHsgdHlwZTogaGVybyB9CiAgICAgICAgICAgIC0geyB0eXBlOiBmb3JlY2FzdCwgbW9kZTogaG91cmx5LCBsYXlvdXQ6IGhvcml6b250YWwsIGhvdXJzOiA2LCB0aXRsZTogTmV4dCA2IGhvdXJzLCBkaXZpZGVyOiB0cnVlLCBzaG93OiBbXSwgaWNvbl9zaXplOiAzMiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBwb3N0ZXI6IHN1bgogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzEsIDRdIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpzdW4tYXppbXV0aC1jYXJkLXBybwogICAgICAgICAgc2hvd19zdW1tYXJ5OiBmYWxzZQogICAgICAgICAgY2FtZXJhOiAyODAKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsxLCA0XSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQtcHJvCiAgICAgICAgICB0aXRsZTogTGFzdCAyNCBob3VycwogICAgICAgICAgaWNvbjogbWRpOmNoYXJ0LXRpbWVsaW5lCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMiwgNl0gfQogICAgICAgICAgaG91cnNfdG9fc2hvdzogMjQKICAgICAgICAgIGJ1Y2tldF9taW51dGVzOiAzMAogICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZQogICAgICAgICAgICAgIG5hbWU6IFRlbXBlcmF0dXJlCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXItbG93IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTgsIGNvbG9yOiBsaWdodC1ibHVlLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXIgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAyNSwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXIgfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiAyNSwgY29sb3I6IG9yYW5nZSwgaWNvbjogbWRpOnRoZXJtb21ldGVyLWhpZ2ggfQogICAgICAgICAgICAtIGVudGl0eTogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgICAgICAgICBuYW1lOiBXaW5kCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDEwLCBjb2xvcjogYmx1ZS1ncmV5LCBpY29uOiBtZGk6d2VhdGhlci13aW5keSB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDI1LCBjb2xvcjogdGVhbCwgaWNvbjogbWRpOndlYXRoZXItd2luZHkgfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiAyNSwgY29sb3I6IG9yYW5nZSwgaWNvbjogbWRpOndlYXRoZXItd2luZHktdmFyaWFudCB9CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3IucmFpbl9yYXRlX3Jvb2YKICAgICAgICAgICAgICBuYW1lOiBSYWluCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGdyZXksIGljb246IG1kaTp3ZWF0aGVyLWNsb3VkeSB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDAuMSwgY29sb3I6IGJsdWUsIGljb246IG1kaTp3ZWF0aGVyLXJhaW55IH0KICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5pbGx1bWluYW5jZQogICAgICAgICAgICAgIG5hbWU6IERheWxpZ2h0CiAgICAgICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDEwLCBjb2xvcjogYmx1ZS1ncmV5LCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDEwMDAsIGNvbG9yOiBibHVlLCBpY29uOiBtZGk6d2VhdGhlci1zdW5zZXQgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAyMDAwMCwgY29sb3I6IGFtYmVyLCBpY29uOiBtZGk6d2hpdGUtYmFsYW5jZS1zdW5ueSB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDIwMDAwLCBjb2xvcjogb3JhbmdlLCBpY29uOiBtZGk6d2hpdGUtYmFsYW5jZS1zdW5ueSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGVfcm9vZgogICAgICAgICAgbmFtZTogUmFpbgogICAgICAgICAgdmFyaWFudDogZHJvcHMKICAgICAgICAgIHdpbmQ6IHNlbnNvci53aW5kX3NwZWVkCiAgICAgICAgICBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbgogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IucHJlc3N1cmUKICAgICAgICAgIG5hbWU6IFByZXNzdXJlCiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgdmlzdWFsOiBzcGFya2xpbmUKICAgICAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgICAgICBjb2xvcjogaW5kaWdvCiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci53aW5kX3NwZWVkCiAgICAgICAgICBuYW1lOiBXaW5kCiAgICAgICAgICB2YXJpYW50OiBsaW5lcwogICAgICAgIC0gdHlwZTogY3VzdG9tOmxheW91dC1jYXJkLXBybwogICAgICAgICAgcm93czogWzFmciwgMWZyLCAxZnJdCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMSwgM10gfQogICAgICAgICAgY2FyZHM6CiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogc2Vuc29yLnV2X2luZGV4CiAgICAgICAgICAgICAgbmFtZTogVVYgaW5kZXgKICAgICAgICAgICAgICBpY29uOiBtZGk6c3VuLXdpcmVsZXNzCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB1bml0OiAiIgogICAgICAgICAgICAgIHZpc3VhbDogcmluZwogICAgICAgICAgICAgIG1pbjogMAogICAgICAgICAgICAgIG1heDogMTEKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMywgY29sb3I6IGdyZWVuLCBsYWJlbDogTG93IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogNiwgY29sb3I6IGFtYmVyLCBsYWJlbDogTW9kZXJhdGUgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiA4LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogSGlnaCB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDgsIGNvbG9yOiByZWQsIGxhYmVsOiBWZXJ5IGhpZ2ggfQogICAgICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgICAgICBlbnRpdHk6IHNlbnNvci5vdXRkb29yX2h1bWlkaXR5CiAgICAgICAgICAgICAgbmFtZTogSHVtaWRpdHkKICAgICAgICAgICAgICBpY29uOiBtZGk6d2F0ZXItcGVyY2VudAogICAgICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICAgICAgY29sb3I6IGJsdWUKICAgICAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBzZW5zb3IuZGV3X3BvaW50CiAgICAgICAgICAgICAgbmFtZTogRGV3IHBvaW50CiAgICAgICAgICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyLXdhdGVyCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICBjb2xvcjogdGVhbAo=">

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
        - type: custom:poster-card-pro
          poster: sun
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
        - type: custom:poster-card-pro
          entity: sensor.rain_rate_roof
          name: Rain
          variant: drops
          wind: sensor.wind_speed
          direction: sensor.wind_direction
        - type: custom:poster-card-pro
          entity: sensor.pressure
          name: Pressure
          decimals: 0
          visual: sparkline
          hours_to_show: 24
          color: indigo
        - type: custom:poster-card-pro
          entity: sensor.wind_speed
          name: Wind
          variant: lines
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
