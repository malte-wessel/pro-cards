---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather dashboard

Read the weather at a glance. The [weather card](/cards/weather-card) forecasts by the hour and the day, the [wind](/cards/wind-card) and the [rain](/cards/rain-card) move as animated fields, the [sun path](/cards/sun-path-card) and the [sun azimuth](/cards/sun-azimuth-card) show where the sun is and which walls it lights, and status strips colour a day of any sensor. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogV2VhdGhlcgogICAgICBzdWJ0aXRsZTogInt7IHN0YXRlcygnc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUnKSB9fSDCsEMgwrcgd2luZCB7eyBzdGF0ZXMoJ3NlbnNvci53aW5kX3NwZWVkJykgfX0ga20vaCDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5yYWluX3RvZGF5JykgfX0gbW0gcmFpbiB0b2RheSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19Iiwgc2hvd19pY29uOiBmYWxzZSwgdGFwX2FjdGlvbjogeyBhY3Rpb246IG5vbmUgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgY29sdW1uczogMgogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDQgfQogICAgICBjYXJkczoKICAgICAgICAtIHR5cGU6IGN1c3RvbTp3ZWF0aGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHdlYXRoZXIuaG9tZQogICAgICAgICAgbmFtZTogT3V0c2lkZQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzIsIDRdIH0KICAgICAgICAgIHRlbXBlcmF0dXJlX3J1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29sZCB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiB0ZWFsLCBsYWJlbDogTWlsZCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMjAsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBXYXJtIH0KICAgICAgICAgIHNlY3Rpb25zOgogICAgICAgICAgICAtIHsgdHlwZTogaGVybyB9CiAgICAgICAgICAgIC0geyB0eXBlOiBmb3JlY2FzdCwgbW9kZTogaG91cmx5LCBsYXlvdXQ6IGhvcml6b250YWwsIGhvdXJzOiA2LCB0aXRsZTogTmV4dCA2IGhvdXJzLCBkaXZpZGVyOiB0cnVlLCBzaG93OiBbXSwgaWNvbl9zaXplOiAzMiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBraW5kOiBzdW4KICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsxLCA0XSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206c3VuLWF6aW11dGgtY2FyZC1wcm8KICAgICAgICAgIHNob3dfc3VtbWFyeTogZmFsc2UKICAgICAgICAgIGNhbWVyYTogMjgwCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMSwgNF0gfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkLXBybwogICAgICAgICAgdGl0bGU6IExhc3QgMjQgaG91cnMKICAgICAgICAgIGljb246IG1kaTpjaGFydC10aW1lbGluZQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzIsIDZdIH0KICAgICAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgICAgICBidWNrZXRfbWludXRlczogMzAKICAgICAgICAgIGVudGl0aWVzOgogICAgICAgICAgICAtIGVudGl0eTogc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUKICAgICAgICAgICAgICBuYW1lOiBUZW1wZXJhdHVyZQogICAgICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiA1LCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOnRoZXJtb21ldGVyLWxvdyB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDE4LCBjb2xvcjogbGlnaHQtYmx1ZSwgaWNvbjogbWRpOnRoZXJtb21ldGVyIH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMjUsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOnRoZXJtb21ldGVyIH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogMjUsIGNvbG9yOiBvcmFuZ2UsIGljb246IG1kaTp0aGVybW9tZXRlci1oaWdoIH0KICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci53aW5kX3NwZWVkCiAgICAgICAgICAgICAgbmFtZTogV2luZAogICAgICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAxMCwgY29sb3I6IGJsdWUtZ3JleSwgaWNvbjogbWRpOndlYXRoZXItd2luZHkgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAyNSwgY29sb3I6IHRlYWwsIGljb246IG1kaTp3ZWF0aGVyLXdpbmR5IH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogMjUsIGNvbG9yOiBvcmFuZ2UsIGljb246IG1kaTp3ZWF0aGVyLXdpbmR5LXZhcmlhbnQgfQogICAgICAgICAgICAtIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZV9yb29mCiAgICAgICAgICAgICAgbmFtZTogUmFpbgogICAgICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAwLjEsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6d2VhdGhlci1jbG91ZHkgfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiAwLjEsIGNvbG9yOiBibHVlLCBpY29uOiBtZGk6d2VhdGhlci1yYWlueSB9CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3IuaWxsdW1pbmFuY2UKICAgICAgICAgICAgICBuYW1lOiBEYXlsaWdodAogICAgICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAxMCwgY29sb3I6IGJsdWUtZ3JleSwgaWNvbjogbWRpOndlYXRoZXItbmlnaHQgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAxMDAwLCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOndlYXRoZXItc3Vuc2V0IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMjAwMDAsIGNvbG9yOiBhbWJlciwgaWNvbjogbWRpOndoaXRlLWJhbGFuY2Utc3VubnkgfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiAyMDAwMCwgY29sb3I6IG9yYW5nZSwgaWNvbjogbWRpOndoaXRlLWJhbGFuY2Utc3VubnkgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IucmFpbl9yYXRlX3Jvb2YKICAgICAgICAgIG5hbWU6IFJhaW4KICAgICAgICAgIHZpc3VhbDogeyB0eXBlOiBmbG93LCBzdHlsZTogZHJvcHMgfQogICAgICAgICAgd2luZDogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgICAgIGRpcmVjdGlvbjogc2Vuc29yLndpbmRfZGlyZWN0aW9uCiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5wcmVzc3VyZQogICAgICAgICAgbmFtZTogUHJlc3N1cmUKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogc3BhcmtsaW5lLCBob3VyczogMjQgfQogICAgICAgICAgY29sb3I6IGluZGlnbwogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgbmFtZTogV2luZAogICAgICAgICAgdmlzdWFsOiB7IHR5cGU6IGZsb3csIHN0eWxlOiBsaW5lcyB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgICAgICByb3dzOiBbMWZyLCAxZnIsIDFmcl0KICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsxLCAzXSB9CiAgICAgICAgICBjYXJkczoKICAgICAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBzZW5zb3IudXZfaW5kZXgKICAgICAgICAgICAgICBuYW1lOiBVViBpbmRleAogICAgICAgICAgICAgIGljb246IG1kaTpzdW4td2lyZWxlc3MKICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIHVuaXQ6ICIiCiAgICAgICAgICAgICAgdmlzdWFsOiByaW5nCiAgICAgICAgICAgICAgbWluOiAwCiAgICAgICAgICAgICAgbWF4OiAxMQogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAzLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiA2LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBNb2RlcmF0ZSB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDgsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBIaWdoIH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogOCwgY29sb3I6IHJlZCwgbGFiZWw6IFZlcnkgaGlnaCB9CiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHkKICAgICAgICAgICAgICBuYW1lOiBIdW1pZGl0eQogICAgICAgICAgICAgIGljb246IG1kaTp3YXRlci1wZXJjZW50CiAgICAgICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgICAgICBjb2xvcjogYmx1ZQogICAgICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgICAgICBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQKICAgICAgICAgICAgICBuYW1lOiBEZXcgcG9pbnQKICAgICAgICAgICAgICBpY29uOiBtZGk6dGhlcm1vbWV0ZXItd2F0ZXIKICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIGNvbG9yOiB0ZWFsCg==">

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
          kind: sun
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
          visual: { type: flow, style: drops }
          wind: sensor.wind_speed
          direction: sensor.wind_direction
        - type: custom:poster-card-pro
          entity: sensor.pressure
          name: Pressure
          decimals: 0
          visual: { type: sparkline, hours: 24 }
          color: indigo
        - type: custom:poster-card-pro
          entity: sensor.wind_speed
          name: Wind
          visual: { type: flow, style: lines }
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
