---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather dashboard

Read the weather at a glance. The [weather card](/cards/weather-card) forecasts by the hour and the day, the [wind](/cards/wind-card) and the [rain](/cards/rain-card) move as animated fields, the [sun path](/cards/sun-path-card) and the [sun azimuth](/cards/sun-azimuth-card) show where the sun is and which walls it lights, and status strips colour a day of any sensor. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogV2VhdGhlcgogICAgICBzdWJ0aXRsZTogInt7IHN0YXRlcygnc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUnKSB9fSDCsEMgwrcgd2luZCB7eyBzdGF0ZXMoJ3NlbnNvci53aW5kX3NwZWVkJykgfX0ga20vaCDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5yYWluX3RvZGF5JykgfX0gbW0gcmFpbiB0b2RheSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19IiwgaWNvbjogZmFsc2UsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBub25lIH0gfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNvbHVtbnM6IDIKICAgICAgYnJlYWtwb2ludHM6CiAgICAgICAgMjogeyBjb2x1bW5zOiA0IH0KICAgICAgY2FyZHM6CiAgICAgICAgLSB0eXBlOiBjdXN0b206d2VhdGhlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiB3ZWF0aGVyLmhvbWUKICAgICAgICAgIG5hbWU6IE91dHNpZGUKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsyLCA0XSB9CiAgICAgICAgICB0ZW1wZXJhdHVyZV9ydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiA1LCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvbGQgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogdGVhbCwgbGFiZWw6IE1pbGQgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDIwLCBjb2xvcjogb3JhbmdlLCBsYWJlbDogV2FybSB9CiAgICAgICAgICBzZWN0aW9uczoKICAgICAgICAgICAgLSB7IHR5cGU6IGhlcm8gfQogICAgICAgICAgICAtIHsgdHlwZTogZm9yZWNhc3QsIG1vZGU6IGhvdXJseSwgbGF5b3V0OiBob3Jpem9udGFsLCBob3VyczogNiwgdGl0bGU6IE5leHQgNiBob3VycywgZGl2aWRlcjogdHJ1ZSwgc2hvdzogW10sIGljb25fc2l6ZTogMzIgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAga2luZDogc3VuCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMSwgNF0gfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnN1bi1hemltdXRoLWNhcmQtcHJvCiAgICAgICAgICBzaG93X3N1bW1hcnk6IGZhbHNlCiAgICAgICAgICBjYW1lcmE6IDI4MAogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzEsIDRdIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktZ3JvdXAtY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBMYXN0IDI0IGhvdXJzCiAgICAgICAgICBpY29uOiBtZGk6Y2hhcnQtdGltZWxpbmUKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsyLCA2XSB9CiAgICAgICAgICBob3Vyc190b19zaG93OiAyNAogICAgICAgICAgYnVja2V0X21pbnV0ZXM6IDMwCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5vdXRkb29yX3RlbXBlcmF0dXJlCiAgICAgICAgICAgICAgbmFtZTogVGVtcGVyYXR1cmUKICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogNSwgY29sb3I6IGJsdWUsIGljb246IG1kaTp0aGVybW9tZXRlci1sb3cgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAxOCwgY29sb3I6IGxpZ2h0LWJsdWUsIGljb246IG1kaTp0aGVybW9tZXRlciB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDI1LCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTp0aGVybW9tZXRlciB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDI1LCBjb2xvcjogb3JhbmdlLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXItaGlnaCB9CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgICAgIG5hbWU6IFdpbmQKICAgICAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTAsIGNvbG9yOiBibHVlLWdyZXksIGljb246IG1kaTp3ZWF0aGVyLXdpbmR5IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMjUsIGNvbG9yOiB0ZWFsLCBpY29uOiBtZGk6d2VhdGhlci13aW5keSB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDI1LCBjb2xvcjogb3JhbmdlLCBpY29uOiBtZGk6d2VhdGhlci13aW5keS12YXJpYW50IH0KICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGVfcm9vZgogICAgICAgICAgICAgIG5hbWU6IFJhaW4KICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMC4xLCBjb2xvcjogZ3JleSwgaWNvbjogbWRpOndlYXRoZXItY2xvdWR5IH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogMC4xLCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOndlYXRoZXItcmFpbnkgfQogICAgICAgICAgICAtIGVudGl0eTogc2Vuc29yLmlsbHVtaW5hbmNlCiAgICAgICAgICAgICAgbmFtZTogRGF5bGlnaHQKICAgICAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTAsIGNvbG9yOiBibHVlLWdyZXksIGljb246IG1kaTp3ZWF0aGVyLW5pZ2h0IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTAwMCwgY29sb3I6IGJsdWUsIGljb246IG1kaTp3ZWF0aGVyLXN1bnNldCB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDIwMDAwLCBjb2xvcjogYW1iZXIsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55IH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogMjAwMDAsIGNvbG9yOiBvcmFuZ2UsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55IH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpwb3N0ZXItY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZV9yb29mCiAgICAgICAgICBuYW1lOiBSYWluCiAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogZmxvdywgdmFyaWFudDogZHJvcHMgfQogICAgICAgICAgaW5wdXRzOiB7IHdpbmQ6IHNlbnNvci53aW5kX3NwZWVkLCBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5wcmVzc3VyZQogICAgICAgICAgbmFtZTogUHJlc3N1cmUKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogc3BhcmtsaW5lLCBob3VyczogMjQgfQogICAgICAgICAgY29sb3I6IGluZGlnbwogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgbmFtZTogV2luZAogICAgICAgICAgdmlzdWFsOiB7IHR5cGU6IGZsb3csIHZhcmlhbnQ6IGxpbmVzIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgICAgIHJvd3M6IFsxZnIsIDFmciwgMWZyXQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzEsIDNdIH0KICAgICAgICAgIGNhcmRzOgogICAgICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgICAgICBlbnRpdHk6IHNlbnNvci51dl9pbmRleAogICAgICAgICAgICAgIG5hbWU6IFVWIGluZGV4CiAgICAgICAgICAgICAgaWNvbjogbWRpOnN1bi13aXJlbGVzcwogICAgICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICAgICAgdW5pdDogIiIKICAgICAgICAgICAgICB2aXN1YWw6IHJpbmcKICAgICAgICAgICAgICBtaW46IDAKICAgICAgICAgICAgICBtYXg6IDExCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDMsIGNvbG9yOiBncmVlbiwgbGFiZWw6IExvdyB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDYsIGNvbG9yOiBhbWJlciwgbGFiZWw6IE1vZGVyYXRlIH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogOCwgY29sb3I6IG9yYW5nZSwgbGFiZWw6IEhpZ2ggfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiA4LCBjb2xvcjogcmVkLCBsYWJlbDogVmVyeSBoaWdoIH0KICAgICAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl9odW1pZGl0eQogICAgICAgICAgICAgIG5hbWU6IEh1bWlkaXR5CiAgICAgICAgICAgICAgaWNvbjogbWRpOndhdGVyLXBlcmNlbnQKICAgICAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgICAgIGNvbG9yOiBibHVlCiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogc2Vuc29yLmRld19wb2ludAogICAgICAgICAgICAgIG5hbWU6IERldyBwb2ludAogICAgICAgICAgICAgIGljb246IG1kaTp0aGVybW9tZXRlci13YXRlcgogICAgICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICAgICAgY29sb3I6IHRlYWwK">

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
        - { value: "{{ now().strftime('%H:%M') }}", icon: false, tap_action: { action: none } }
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
          visual: { type: flow, variant: drops }
          inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
        - type: custom:poster-card-pro
          entity: sensor.pressure
          name: Pressure
          decimals: 0
          visual: { type: sparkline, hours: 24 }
          color: indigo
        - type: custom:poster-card-pro
          entity: sensor.wind_speed
          name: Wind
          visual: { type: flow, variant: lines }
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
