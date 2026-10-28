---
outline: [2, 2]
sidebar: false
aside: false
pageClass: wide
---

# Poster layouts

Four dark wall-panel dashboards, one per view of a home, each a [layout card](/cards/layout-card) of twelve cells, four across and three down (two across on a phone). Most cells are posters: one thing each, its icon and a pill on top, a large value at the bottom, and a curve along the bottom edge where there is one. The cards that are not posters take whole cells too (`view_layout: { span: [columns, rows] }`, three grid rows to a cell), so every row lines up. Every control works: tap, drag and hold.

## Home

The title with today's date and a clock, then who is home and what is playing in a [heading card](/cards/heading-card). The first row is the outside: the [weather](/cards/weather-card#poster) with the next hours of its forecast, the [sun path](/cards/sun-path-card#poster) with the next sunset, the [wind](/cards/wind-card#poster) as its animated field and the [rain](/cards/rain-card#poster) falling across its poster. Then the power of the home and the heat pump in a [multi trend card](/cards/multi-trend-card#poster), the car, the robot vacuum with its own buttons and the dishwasher with the time it finishes; the front door to hold, the kitchen speaker, the living room's desk lamp, ceiling light to dim and scene buttons in a [group card](/cards/entity-group-card) and a [swipe card](/cards/swipe-card) of controls (swipe or tap a dot): the bedroom thermostat's stepper, the kitchen in a group card, the TV's tile with its buttons and volume, and the bedroom fan's speeds.

<DashboardGrid mode="dark" b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogSG9tZQogICAgICBzdWJ0aXRsZTogInt7IG5vdygpLnN0cmZ0aW1lKCclQSwgJWUgJUInKSB9fSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19Iiwgc2hvd19pY29uOiBmYWxzZSwgdGFwX2FjdGlvbjogeyBhY3Rpb246IG5vbmUgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTpoZWFkaW5nLWNhcmQtcHJvCiAgICAgIHN0eWxlOiBzdWJ0aXRsZQogICAgICBiYWRnZV9zdHlsZTogb3V0bGluZQogICAgICBiYWRnZV9zaXplOiBsCiAgICAgIGJhZGdlc19wb3NpdGlvbjogaW5saW5lCiAgICAgIGJhZGdlczoKICAgICAgICAtIHsgZW50aXR5OiBwZXJzb24uYWxleCwgc2hvd19lbnRpdHlfcGljdHVyZTogdHJ1ZSwgc2hvd19uYW1lOiB0cnVlLCBydWxlczogJmhvbWUgW3sgc3RhdGU6IGhvbWUsIGNvbG9yOiBncmVlbiwgbGFiZWw6IEhvbWUgfSwgeyBzdGF0ZTogbm90X2hvbWUsIGNvbG9yOiBncmV5LCBsYWJlbDogQXdheSB9XSB9CiAgICAgICAgLSB7IGVudGl0eTogcGVyc29uLnNhbSwgc2hvd19lbnRpdHlfcGljdHVyZTogdHJ1ZSwgc2hvd19uYW1lOiB0cnVlLCBydWxlczogKmhvbWUgfQogICAgICAgIC0geyBlbnRpdHk6IHBlcnNvbi5raW0sIHNob3dfbmFtZTogdHJ1ZSwgcnVsZXM6ICpob21lIH0KICAgICAgICAtIHsgZW50aXR5OiBtZWRpYV9wbGF5ZXIubGl2aW5nX3Jvb21fdHYsIG5hbWU6IFRWLCBpY29uOiBtZGk6dGVsZXZpc2lvbi1wbGF5LCBhdHRyaWJ1dGU6IG1lZGlhX3RpdGxlLCBzaG93X25hbWU6IHRydWUsIHZpc2liaWxpdHk6IFt7IGNvbmRpdGlvbjogc3RhdGUsIGVudGl0eTogbWVkaWFfcGxheWVyLmxpdmluZ19yb29tX3R2LCBzdGF0ZTogcGxheWluZyB9XSB9CiAgICAgICAgLSB7IGVudGl0eTogZ3JvdXAuZG93bnN0YWlyc19saWdodHMsIG5hbWU6IExpZ2h0cyBvbiwgdmlzdWFsOiBjb3VudCwgc2hvd19uYW1lOiB0cnVlLCBjb2xvcjogYW1iZXIgfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNvbHVtbnM6IDIKICAgICAgYnJlYWtwb2ludHM6CiAgICAgICAgMjogeyBjb2x1bW5zOiA0IH0KICAgICAgY2FyZHM6CiAgICAgICAgLSB0eXBlOiBjdXN0b206d2VhdGhlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiB3ZWF0aGVyLmhvbWUKICAgICAgICAgIG5hbWU6IE91dHNpZGUKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB0ZW1wZXJhdHVyZV9ydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiA1LCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvbGQgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogdGVhbCwgbGFiZWw6IE1pbGQgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDIwLCBjb2xvcjogb3JhbmdlLCBsYWJlbDogV2FybSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206c3VuLXBhdGgtY2FyZC1wcm8KICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgLSB0eXBlOiBjdXN0b206d2luZC1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgZGlyZWN0aW9uOiBzZW5zb3Iud2luZF9kaXJlY3Rpb24KICAgICAgICAgIGd1c3Q6IHNlbnNvci53aW5kX2d1c3QKICAgICAgICAgIG5hbWU6IFdpbmQKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2aXN1YWw6IGZsb3cKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLWdyZXksIGxhYmVsOiBDYWxtIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHRlYWwsIGxhYmVsOiBCcmVlemUgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDM1LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBGcmVzaCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMzUsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBTdHJvbmcgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnJhaW4tY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZV9yb29mCiAgICAgICAgICB0b2RheTogc2Vuc29yLnJhaW5fdG9kYXkKICAgICAgICAgIHdpbmQ6IHNlbnNvci53aW5kX3NwZWVkCiAgICAgICAgICBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbgogICAgICAgICAgbmFtZTogUmFpbgogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIHZpc3VhbDogZmxvdwogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMC4xLCBjb2xvcjogYmx1ZS1ncmV5LCBsYWJlbDogRHJ5IH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyLjUsIGNvbG9yOiBsaWdodC1ibHVlLCBsYWJlbDogTGlnaHQgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDIuNSwgY29sb3I6IGJsdWUsIGxhYmVsOiBIZWF2eSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBQb3dlcgogICAgICAgICAgaWNvbjogbWRpOmZsYXNoCiAgICAgICAgICBjb2xvcjogYW1iZXIKICAgICAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5wb3dlcl9jb25zdW1wdGlvbiwgbmFtZTogSG9tZSwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmhlYXRfcHVtcF9wb3dlciwgbmFtZTogSGVhdCBwdW1wLCBjb2xvcjogZGVlcC1vcmFuZ2UgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuZXZfYmF0dGVyeQogICAgICAgICAgbmFtZTogQ2FyCiAgICAgICAgICBpY29uOiBtZGk6Y2FyLWVsZWN0cmljCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiByZWQsIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDIwLCBjb2xvcjogZ3JlZW4gfQogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIGVudGl0eTogYmluYXJ5X3NlbnNvci5ldl9wbHVnZ2VkCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgc3RhdGU6ICJvbiIsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOnBvd2VyLXBsdWcsIGxhYmVsOiBQbHVnZ2VkIGluIH0KICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6cG93ZXItcGx1Zy1vZmYsIGxhYmVsOiBVbnBsdWdnZWQgfQogICAgICAgICAgICAtIHNlbnNvci5ldl9yYW5nZQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiB2YWN1dW0ucm9ib3QKICAgICAgICAgIG5hbWU6IFJvYm90CiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgY29udHJvbDogYnV0dG9ucwogICAgICAgICAgY29udHJvbF9vcHRpb25zOgogICAgICAgICAgICAtIHsgaWNvbjogbWRpOnBsYXksIGFjdGlvbjogeyBhY3Rpb246IHBlcmZvcm0tYWN0aW9uLCBwZXJmb3JtX2FjdGlvbjogdmFjdXVtLnN0YXJ0LCB0YXJnZXQ6IHsgZW50aXR5X2lkOiB2YWN1dW0ucm9ib3QgfSB9IH0KICAgICAgICAgICAgLSB7IGljb246IG1kaTpob21lLWltcG9ydC1vdXRsaW5lLCBhY3Rpb246IHsgYWN0aW9uOiBwZXJmb3JtLWFjdGlvbiwgcGVyZm9ybV9hY3Rpb246IHZhY3V1bS5yZXR1cm5fdG9fYmFzZSwgdGFyZ2V0OiB7IGVudGl0eV9pZDogdmFjdXVtLnJvYm90IH0gfSB9CiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiBjbGVhbmluZywgY29sb3I6IHRlYWwgfQogICAgICAgICAgICAtIHsgc3RhdGU6IGRvY2tlZCwgY29sb3I6IGdyZXkgfQogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iucm9ib3RfYmF0dGVyeSwgdmlzdWFsOiByaW5nIH0KICAgICAgICAgICAgLSBzZW5zb3Iucm9ib3RfY3VycmVudF9yb29tCiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5kaXNod2FzaGVyX3N0YXR1cwogICAgICAgICAgbmFtZTogRGlzaHdhc2hlcgogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIHZhbHVlOiAie3sgc3RhdGVzKCdzZW5zb3IuZGlzaHdhc2hlcl9zdGF0dXMnKSB8IHJlcGxhY2UoJ3Bvd2VyX29mZicsICdPZmYnKSB8IHJlcGxhY2UoJ3J1bicsICdSdW5uaW5nJykgfCByZXBsYWNlKCdlbmQnLCAnRG9uZScpIH19IgogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogUnVubmluZywgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6ZGlzaHdhc2hlciB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogRG9uZSwgY29sb3I6IHRlYWwsIGljb246IG1kaTpkaXNod2FzaGVyLWFsZXJ0IH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAiT2ZmIiwgY29sb3I6IGdyZXksIGljb246IG1kaTpkaXNod2FzaGVyLW9mZiB9CiAgICAgICAgICBiYWRnZXM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kaXNod2FzaGVyX2ZpbmlzaGVzLCBmb3JtYXQ6IHJlbGF0aXZlLCBpY29uOiBtZGk6dGltZXItb3V0bGluZSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGxvY2suZnJvbnRfZG9vcgogICAgICAgICAgbmFtZTogRnJvbnQgZG9vcgogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGNvbnRyb2w6IGF1dG8KICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6IGxvY2tlZCwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6c2hpZWxkLWxvY2sgfQogICAgICAgICAgICAtIHsgc3RhdGU6IHVubG9ja2VkLCBjb2xvcjogcmVkLCBpY29uOiBtZGk6c2hpZWxkLWxvY2stb3BlbiB9CiAgICAgICAgICBiYWRnZXM6CiAgICAgICAgICAgIC0gZW50aXR5OiBiaW5hcnlfc2Vuc29yLmRvb3JfZnJvbnQKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogIm9uIiwgY29sb3I6IHJlZCwgaWNvbjogbWRpOmRvb3Itb3BlbiwgbGFiZWw6IE9wZW4gfQogICAgICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6ZG9vci1jbG9zZWQsIGxhYmVsOiBDbG9zZWQgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBtZWRpYV9wbGF5ZXIua2l0Y2hlbl9zcGVha2VyCiAgICAgICAgICBuYW1lOiBLaXRjaGVuIHNwZWFrZXIKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICBpY29uOiBtZGk6c3BlYWtlcgogICAgICAgICAgYXR0cmlidXRlOiBtZWRpYV90aXRsZQogICAgICAgICAgY29udHJvbDogYnV0dG9ucwogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogcGxheWluZywgY29sb3I6IGdyZWVuLCBsYWJlbDogUGxheWluZyB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogaWRsZSwgY29sb3I6IGdyZXksIGxhYmVsOiBJZGxlIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktZ3JvdXAtY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBMaXZpbmcgcm9vbQogICAgICAgICAgaWNvbjogbWRpOnNvZmEKICAgICAgICAgIGxheW91dDogdGFibGUKICAgICAgICAgIHZlcnRpY2FsX2FsaWduOiBib3R0b20KICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsxLCAzXSB9CiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSBlbnRpdHk6IGxpZ2h0LmRlc2tfbGFtcAogICAgICAgICAgICAgIG5hbWU6IERlc2sgbGFtcAogICAgICAgICAgICAgIGNvbnRyb2w6IHRvZ2dsZQogICAgICAgICAgICAgIHJ1bGVzOiAmbGFtcAogICAgICAgICAgICAgICAgLSB7IHN0YXRlOiAib24iLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfQogICAgICAgICAgICAtIGVudGl0eTogbGlnaHQubGl2aW5nX3Jvb20KICAgICAgICAgICAgICBuYW1lOiBDZWlsaW5nCiAgICAgICAgICAgICAgY29udHJvbDogc2xpZGVyCiAgICAgICAgICAgICAgcnVsZXM6ICpsYW1wCiAgICAgICAgICAgIC0gbmFtZTogU2NlbmVzCiAgICAgICAgICAgICAgaWNvbjogbWRpOnBhbGV0dGUKICAgICAgICAgICAgICBjb250cm9sOiBidXR0b25zCiAgICAgICAgICAgICAgY29udHJvbF9vcHRpb25zOgogICAgICAgICAgICAgICAgLSB7IGVudGl0eTogc2NlbmUuYnJpZ2h0LCBpY29uOiBtZGk6d2hpdGUtYmFsYW5jZS1zdW5ueSwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmRpbm5lciwgaWNvbjogbWRpOnNpbHZlcndhcmUtZm9yay1rbmlmZSwgY29sb3I6IGRlZXAtb3JhbmdlIH0KICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLm1vdmllX25pZ2h0LCBpY29uOiBtZGk6bW92aWUtb3BlbiwgY29sb3I6IGRlZXAtcHVycGxlIH0KICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmdvb2RfbmlnaHQsIGljb246IG1kaTp3ZWF0aGVyLW5pZ2h0LCBjb2xvcjogaW5kaWdvIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpzd2lwZS1jYXJkLXBybwogICAgICAgICAgcGVyX3BhZ2U6IDEKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsxLCAzXSB9CiAgICAgICAgICBjYXJkczoKICAgICAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBjbGltYXRlLmJlZHJvb20KICAgICAgICAgICAgICBuYW1lOiBCZWRyb29tCiAgICAgICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgICAgICBhdHRyaWJ1dGU6IGN1cnJlbnRfdGVtcGVyYXR1cmUKICAgICAgICAgICAgICB1bml0OiDCsEMKICAgICAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgICAgIGNvbnRyb2w6IHN0ZXBwZXIKICAgICAgICAgICAgICBjb2xvcjogaW5kaWdvCiAgICAgICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAgICAgLSBlbnRpdHk6IGNsaW1hdGUuYmVkcm9vbQogICAgICAgICAgICAgICAgICBhdHRyaWJ1dGU6IGh2YWNfYWN0aW9uCiAgICAgICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogaGVhdGluZywgY29sb3I6IGRlZXAtb3JhbmdlLCBpY29uOiBtZGk6ZmlyZSwgbGFiZWw6IEhlYXRpbmcgfQogICAgICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6cG93ZXIsIGxhYmVsOiAiT2ZmIiB9CiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkLXBybwogICAgICAgICAgICAgIHRpdGxlOiBLaXRjaGVuCiAgICAgICAgICAgICAgaWNvbjogbWRpOnNpbHZlcndhcmUtZm9yay1rbmlmZQogICAgICAgICAgICAgIGxheW91dDogdGFibGUKICAgICAgICAgICAgICB2ZXJ0aWNhbF9hbGlnbjogYm90dG9tCiAgICAgICAgICAgICAgc2hvd192YWx1ZTogZmFsc2UKICAgICAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IGxpZ2h0LmtpdGNoZW4sIG5hbWU6IExpZ2h0LCBjb250cm9sOiBzbGlkZXIsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgICAgICAtIHsgZW50aXR5OiBzd2l0Y2guY29mZmVlX21hY2hpbmUsIG5hbWU6IENvZmZlZSwgaWNvbjogbWRpOmNvZmZlZSwgY29udHJvbDogdG9nZ2xlLCBjb2xvcjogYnJvd24gfQogICAgICAgICAgICAgICAgLSB7IGVudGl0eTogaW5wdXRfc2VsZWN0LmhvdXNlX21vZGUsIG5hbWU6IE1vZGUsIGNvbnRyb2w6IHNlbGVjdCB9CiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogbWVkaWFfcGxheWVyLmxpdmluZ19yb29tX3R2CiAgICAgICAgICAgICAgbmFtZTogTGl2aW5nIHJvb20gVFYKICAgICAgICAgICAgICBpY29uOiBtZGk6dGVsZXZpc2lvbi1wbGF5CiAgICAgICAgICAgICAgYXR0cmlidXRlOiBtZWRpYV90aXRsZQogICAgICAgICAgICAgIGNvbnRyb2w6IGF1dG8KICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogcGxheWluZywgY29sb3I6IGRlZXAtcHVycGxlIH0KICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogcGF1c2VkLCBjb2xvcjogZ3JleSB9CiAgICAgICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogZmFuLmJlZHJvb20KICAgICAgICAgICAgICBuYW1lOiBCZWRyb29tIGZhbgogICAgICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICAgICAgYXR0cmlidXRlOiBwZXJjZW50YWdlCiAgICAgICAgICAgICAgdW5pdDogIiUiCiAgICAgICAgICAgICAgY29udHJvbDogc2VnbWVudHMKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogIm9uIiwgY29sb3I6IGN5YW4gfQogICAgICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfQo=">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Home
      subtitle: "{{ now().strftime('%A, %e %B') }}"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", show_icon: false, tap_action: { action: none } }
    - type: custom:heading-card-pro
      style: subtitle
      badge_style: outline
      badge_size: l
      badges_position: inline
      badges:
        - { entity: person.alex, show_entity_picture: true, show_name: true, rules: &home [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
        - { entity: person.sam, show_entity_picture: true, show_name: true, rules: *home }
        - { entity: person.kim, show_name: true, rules: *home }
        - { entity: media_player.living_room_tv, name: TV, icon: mdi:television-play, attribute: media_title, show_name: true, visibility: [{ condition: state, entity: media_player.living_room_tv, state: playing }] }
        - { entity: group.downstairs_lights, name: Lights on, visual: count, show_name: true, color: amber }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:weather-card-pro
          entity: weather.home
          name: Outside
          layout: poster
          temperature_rules:
            - { below: 5, color: blue, label: Cold }
            - { below: 20, color: teal, label: Mild }
            - { above: 20, color: orange, label: Warm }
        - type: custom:sun-path-card-pro
          layout: poster
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
          entity: sensor.ev_battery
          name: Car
          icon: mdi:car-electric
          layout: poster
          rules:
            - { below: 20, color: red, label: Low }
            - { above: 20, color: green }
          badges:
            - entity: binary_sensor.ev_plugged
              rules:
                - { state: "on", color: green, icon: mdi:power-plug, label: Plugged in }
                - { state: "off", color: grey, icon: mdi:power-plug-off, label: Unplugged }
            - sensor.ev_range
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
        - type: custom:entity-card-pro
          entity: sensor.dishwasher_status
          name: Dishwasher
          layout: poster
          value: "{{ states('sensor.dishwasher_status') | replace('power_off', 'Off') | replace('run', 'Running') | replace('end', 'Done') }}"
          rules:
            - { state: Running, color: green, icon: mdi:dishwasher }
            - { state: Done, color: teal, icon: mdi:dishwasher-alert }
            - { state: "Off", color: grey, icon: mdi:dishwasher-off }
          badges:
            - { entity: sensor.dishwasher_finishes, format: relative, icon: mdi:timer-outline }
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
        - type: custom:entity-group-card-pro
          title: Living room
          icon: mdi:sofa
          layout: table
          vertical_align: bottom
          view_layout: { span: [1, 3] }
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
            - name: Scenes
              icon: mdi:palette
              control: buttons
              control_options:
                - { entity: scene.bright, icon: mdi:white-balance-sunny, color: amber }
                - { entity: scene.dinner, icon: mdi:silverware-fork-knife, color: deep-orange }
                - { entity: scene.movie_night, icon: mdi:movie-open, color: deep-purple }
                - { entity: scene.good_night, icon: mdi:weather-night, color: indigo }
        - type: custom:swipe-card-pro
          per_page: 1
          view_layout: { span: [1, 3] }
          cards:
            - type: custom:entity-card-pro
              entity: climate.bedroom
              name: Bedroom
              layout: poster
              attribute: current_temperature
              unit: °C
              decimals: 1
              control: stepper
              color: indigo
              badges:
                - entity: climate.bedroom
                  attribute: hvac_action
                  rules:
                    - { state: heating, color: deep-orange, icon: mdi:fire, label: Heating }
                    - { state: "off", color: grey, icon: mdi:power, label: "Off" }
            - type: custom:entity-group-card-pro
              title: Kitchen
              icon: mdi:silverware-fork-knife
              layout: table
              vertical_align: bottom
              show_value: false
              entities:
                - { entity: light.kitchen, name: Light, control: slider, color: amber }
                - { entity: switch.coffee_machine, name: Coffee, icon: mdi:coffee, control: toggle, color: brown }
                - { entity: input_select.house_mode, name: Mode, control: select }
            - type: custom:entity-card-pro
              entity: media_player.living_room_tv
              name: Living room TV
              icon: mdi:television-play
              attribute: media_title
              control: auto
              rules:
                - { state: playing, color: deep-purple }
                - { state: paused, color: grey }
            - type: custom:entity-card-pro
              entity: fan.bedroom
              name: Bedroom fan
              layout: poster
              attribute: percentage
              unit: "%"
              control: segments
              rules:
                - { state: "on", color: cyan }
                - { state: "off", color: grey }
```

</DashboardGrid>

## Lights

Eight lights as posters: tap one to switch it, drag its slider to dim it (the hallway's has no dimmer, so a switch, and its pill shows the motion sensor), scenes and modes in a [sections card](/cards/entity-sections-card) two cells wide, the garden light with the illuminance outside, and the power of the dining light over the last hours.

<DashboardGrid mode="dark" b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogTGlnaHRzCiAgICAgIHN1YnRpdGxlOiAie3sgc3RhdGVzLmxpZ2h0IHwgc2VsZWN0YXR0cignc3RhdGUnLCAnZXEnLCAnb24nKSB8IGxpc3QgfCBjb3VudCB9fSBvZiB7eyBzdGF0ZXMubGlnaHQgfCBsaXN0IHwgY291bnQgfX0gb24iCiAgICAgIGJhZGdlX3N0eWxlOiBwbGFpbgogICAgICBiYWRnZV9zaXplOiBsCiAgICAgIGJhZGdlczoKICAgICAgICAtIHsgdmFsdWU6ICJ7eyBub3coKS5zdHJmdGltZSgnJUg6JU0nKSB9fSIsIHNob3dfaWNvbjogZmFsc2UsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBub25lIH0gfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNvbHVtbnM6IDIKICAgICAgYnJlYWtwb2ludHM6CiAgICAgICAgMjogeyBjb2x1bW5zOiA0IH0KICAgICAgY2FyZHM6CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGxpZ2h0LmxpdmluZ19yb29tCiAgICAgICAgICBuYW1lOiBMaXZpbmcgcm9vbQogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIHZhbHVlOiAie3sgKHN0YXRlX2F0dHIoJ2xpZ2h0LmxpdmluZ19yb29tJywgJ2JyaWdodG5lc3MnKSB8IGZsb2F0KDApIC8gMi41NSkgfCByb3VuZCB9fSIKICAgICAgICAgIHVuaXQ6ICIlIgogICAgICAgICAgY29udHJvbDogc2xpZGVyCiAgICAgICAgICB0YXBfYWN0aW9uOiB7IGFjdGlvbjogdG9nZ2xlIH0KICAgICAgICAgIHJ1bGVzOiAmbGlnaHQKICAgICAgICAgICAgLSB7IHN0YXRlOiAib24iLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGxpZ2h0LmRpbmluZ190YWJsZQogICAgICAgICAgbmFtZTogRGluaW5nIHRhYmxlCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgdmFsdWU6ICJ7eyAoc3RhdGVfYXR0cignbGlnaHQuZGluaW5nX3RhYmxlJywgJ2JyaWdodG5lc3MnKSB8IGZsb2F0KDApIC8gMi41NSkgfCByb3VuZCB9fSIKICAgICAgICAgIHVuaXQ6ICIlIgogICAgICAgICAgY29udHJvbDogc2xpZGVyCiAgICAgICAgICB0YXBfYWN0aW9uOiB7IGFjdGlvbjogdG9nZ2xlIH0KICAgICAgICAgIHJ1bGVzOiAqbGlnaHQKICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogbGlnaHQua2l0Y2hlbgogICAgICAgICAgbmFtZTogS2l0Y2hlbgogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIHZhbHVlOiAie3sgKHN0YXRlX2F0dHIoJ2xpZ2h0LmtpdGNoZW4nLCAnYnJpZ2h0bmVzcycpIHwgZmxvYXQoMCkgLyAyLjU1KSB8IHJvdW5kIH19IgogICAgICAgICAgdW5pdDogIiUiCiAgICAgICAgICBjb250cm9sOiBzbGlkZXIKICAgICAgICAgIHRhcF9hY3Rpb246IHsgYWN0aW9uOiB0b2dnbGUgfQogICAgICAgICAgcnVsZXM6ICpsaWdodAogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBsaWdodC5vZmZpY2UKICAgICAgICAgIG5hbWU6IE9mZmljZQogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIHZhbHVlOiAie3sgKHN0YXRlX2F0dHIoJ2xpZ2h0Lm9mZmljZScsICdicmlnaHRuZXNzJykgfCBmbG9hdCgwKSAvIDIuNTUpIHwgcm91bmQgfX0iCiAgICAgICAgICB1bml0OiAiJSIKICAgICAgICAgIGNvbnRyb2w6IHNsaWRlcgogICAgICAgICAgdGFwX2FjdGlvbjogeyBhY3Rpb246IHRvZ2dsZSB9CiAgICAgICAgICBydWxlczogKmxpZ2h0CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGxpZ2h0LmJlZHJvb20KICAgICAgICAgIG5hbWU6IEJlZHJvb20KICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2YWx1ZTogInt7IChzdGF0ZV9hdHRyKCdsaWdodC5iZWRyb29tJywgJ2JyaWdodG5lc3MnKSB8IGZsb2F0KDApIC8gMi41NSkgfCByb3VuZCB9fSIKICAgICAgICAgIHVuaXQ6ICIlIgogICAgICAgICAgY29udHJvbDogc2xpZGVyCiAgICAgICAgICB0YXBfYWN0aW9uOiB7IGFjdGlvbjogdG9nZ2xlIH0KICAgICAgICAgIHJ1bGVzOiAqbGlnaHQKICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogbGlnaHQuZGVza19sYW1wCiAgICAgICAgICBuYW1lOiBEZXNrIGxhbXAKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2YWx1ZTogInt7IChzdGF0ZV9hdHRyKCdsaWdodC5kZXNrX2xhbXAnLCAnYnJpZ2h0bmVzcycpIHwgZmxvYXQoMCkgLyAyLjU1KSB8IHJvdW5kIH19IgogICAgICAgICAgdW5pdDogIiUiCiAgICAgICAgICBjb250cm9sOiBzbGlkZXIKICAgICAgICAgIHRhcF9hY3Rpb246IHsgYWN0aW9uOiB0b2dnbGUgfQogICAgICAgICAgcnVsZXM6ICpsaWdodAogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBsaWdodC5hdHRpYwogICAgICAgICAgbmFtZTogQXR0aWMKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICB2YWx1ZTogInt7IChzdGF0ZV9hdHRyKCdsaWdodC5hdHRpYycsICdicmlnaHRuZXNzJykgfCBmbG9hdCgwKSAvIDIuNTUpIHwgcm91bmQgfX0iCiAgICAgICAgICB1bml0OiAiJSIKICAgICAgICAgIGNvbnRyb2w6IHNsaWRlcgogICAgICAgICAgdGFwX2FjdGlvbjogeyBhY3Rpb246IHRvZ2dsZSB9CiAgICAgICAgICBydWxlczogKmxpZ2h0CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGxpZ2h0LmhhbGx3YXkKICAgICAgICAgIG5hbWU6IEhhbGx3YXkKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICBjb250cm9sOiBhdXRvCiAgICAgICAgICBydWxlczogKmxpZ2h0CiAgICAgICAgICBiYWRnZXM6CiAgICAgICAgICAgIC0gZW50aXR5OiBiaW5hcnlfc2Vuc29yLm1vdGlvbl9oYWxsd2F5CiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgc3RhdGU6ICJvbiIsIGNvbG9yOiBhbWJlciwgaWNvbjogbWRpOm1vdGlvbi1zZW5zb3IsIGxhYmVsOiBNb3Rpb24gfQogICAgICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGljb246IG1kaTptb3Rpb24tc2Vuc29yLW9mZiwgbGFiZWw6IENsZWFyIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktc2VjdGlvbnMtY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBTY2VuZXMgJiBtb2RlcwogICAgICAgICAgaWNvbjogbWRpOnBhbGV0dGUKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsyLCAzXSB9CiAgICAgICAgICBzaG93X3ZhbHVlOiBmYWxzZQogICAgICAgICAgc2VjdGlvbnM6CiAgICAgICAgICAgIC0gbGF5b3V0OiByb3cKICAgICAgICAgICAgICBhbGlnbjogc3BhY2UtYmV0d2VlbgogICAgICAgICAgICAgIG5hbWVfcG9zaXRpb246IGJlbG93CiAgICAgICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgICAgICAtIHsgZW50aXR5OiBzY2VuZS5icmlnaHQsIG5hbWU6IEJyaWdodCwgaWNvbjogbWRpOndoaXRlLWJhbGFuY2Utc3VubnksIGNvbG9yOiBhbWJlciwgY29udHJvbDogYnV0dG9uIH0KICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmRpbW1lZCwgbmFtZTogRGltbWVkLCBpY29uOiBtZGk6bGlnaHRidWxiLW9uLTUwLCBjb2xvcjogb3JhbmdlLCBjb250cm9sOiBidXR0b24gfQogICAgICAgICAgICAgICAgLSB7IGVudGl0eTogc2NlbmUuZGlubmVyLCBuYW1lOiBEaW5uZXIsIGljb246IG1kaTpzaWx2ZXJ3YXJlLWZvcmsta25pZmUsIGNvbG9yOiBkZWVwLW9yYW5nZSwgY29udHJvbDogYnV0dG9uIH0KICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmdvb2RfbmlnaHQsIG5hbWU6IE5pZ2h0LCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCwgY29sb3I6IGluZGlnbywgY29udHJvbDogYnV0dG9uIH0KICAgICAgICAgICAgLSBsYXlvdXQ6IHJvdwogICAgICAgICAgICAgIGFsaWduOiBzcGFjZS1iZXR3ZWVuCiAgICAgICAgICAgICAgbmFtZV9wb3NpdGlvbjogYmVsb3cKICAgICAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgICAgIC0geyBlbnRpdHk6IGlucHV0X2Jvb2xlYW4ubmlnaHRfbW9kZSwgbmFtZTogTmlnaHQsIGNvbnRyb2w6IHRvZ2dsZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogaW5kaWdvIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgICAgICAgICAtIHsgZW50aXR5OiBpbnB1dF9ib29sZWFuLmd1ZXN0X21vZGUsIG5hbWU6IEd1ZXN0cywgY29udHJvbDogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBwaW5rIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgICAgICAgICAtIHsgZW50aXR5OiBpbnB1dF9ib29sZWFuLmF3YXlfbW9kZSwgbmFtZTogQXdheSwgY29udHJvbDogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBibHVlIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGxpZ2h0LmdhcmRlbgogICAgICAgICAgbmFtZTogR2FyZGVuCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgY29udHJvbDogYXV0bwogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogIm9uIiwgY29sb3I6IGdyZWVuIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfQogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuaWxsdW1pbmFuY2UsIGljb246IG1kaTpicmlnaHRuZXNzLTUgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuZGluaW5nX2xpZ2h0X3Bvd2VyCiAgICAgICAgICBuYW1lOiBMaWdodCBwb3dlcgogICAgICAgICAgaWNvbjogbWRpOmxpZ2h0bmluZy1ib2x0CiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHZpc3VhbDogc3BhcmtsaW5lCiAgICAgICAgICBob3Vyc190b19zaG93OiAxMgogICAgICAgICAgY29sb3I6IGFtYmVyCg==">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Lights
      subtitle: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} of {{ states.light | list | count }} on"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", show_icon: false, tap_action: { action: none } }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:entity-card-pro
          entity: light.living_room
          name: Living room
          layout: poster
          value: "{{ (state_attr('light.living_room', 'brightness') | float(0) / 2.55) | round }}"
          unit: "%"
          control: slider
          tap_action: { action: toggle }
          rules: &light
            - { state: "on", color: amber }
            - { state: "off", color: grey }
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
          entity: light.kitchen
          name: Kitchen
          layout: poster
          value: "{{ (state_attr('light.kitchen', 'brightness') | float(0) / 2.55) | round }}"
          unit: "%"
          control: slider
          tap_action: { action: toggle }
          rules: *light
        - type: custom:entity-card-pro
          entity: light.office
          name: Office
          layout: poster
          value: "{{ (state_attr('light.office', 'brightness') | float(0) / 2.55) | round }}"
          unit: "%"
          control: slider
          tap_action: { action: toggle }
          rules: *light
        - type: custom:entity-card-pro
          entity: light.bedroom
          name: Bedroom
          layout: poster
          value: "{{ (state_attr('light.bedroom', 'brightness') | float(0) / 2.55) | round }}"
          unit: "%"
          control: slider
          tap_action: { action: toggle }
          rules: *light
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
          entity: light.attic
          name: Attic
          layout: poster
          value: "{{ (state_attr('light.attic', 'brightness') | float(0) / 2.55) | round }}"
          unit: "%"
          control: slider
          tap_action: { action: toggle }
          rules: *light
        - type: custom:entity-card-pro
          entity: light.hallway
          name: Hallway
          layout: poster
          control: auto
          rules: *light
          badges:
            - entity: binary_sensor.motion_hallway
              rules:
                - { state: "on", color: amber, icon: mdi:motion-sensor, label: Motion }
                - { state: "off", color: grey, icon: mdi:motion-sensor-off, label: Clear }
        - type: custom:entity-sections-card-pro
          title: Scenes & modes
          icon: mdi:palette
          view_layout: { span: [2, 3] }
          show_value: false
          sections:
            - layout: row
              align: space-between
              name_position: below
              entities:
                - { entity: scene.bright, name: Bright, icon: mdi:white-balance-sunny, color: amber, control: button }
                - { entity: scene.dimmed, name: Dimmed, icon: mdi:lightbulb-on-50, color: orange, control: button }
                - { entity: scene.dinner, name: Dinner, icon: mdi:silverware-fork-knife, color: deep-orange, control: button }
                - { entity: scene.good_night, name: Night, icon: mdi:weather-night, color: indigo, control: button }
            - layout: row
              align: space-between
              name_position: below
              entities:
                - { entity: input_boolean.night_mode, name: Night, control: toggle, rules: [{ state: "on", color: indigo }, { state: "off", color: grey }] }
                - { entity: input_boolean.guest_mode, name: Guests, control: toggle, rules: [{ state: "on", color: pink }, { state: "off", color: grey }] }
                - { entity: input_boolean.away_mode, name: Away, control: toggle, rules: [{ state: "on", color: blue }, { state: "off", color: grey }] }
        - type: custom:entity-card-pro
          entity: light.garden
          name: Garden
          layout: poster
          control: auto
          rules:
            - { state: "on", color: green }
            - { state: "off", color: grey }
          badges:
            - { entity: sensor.illuminance, icon: mdi:brightness-5 }
        - type: custom:entity-card-pro
          entity: sensor.dining_light_power
          name: Light power
          icon: mdi:lightning-bolt
          layout: poster
          decimals: 0
          visual: sparkline
          hours_to_show: 12
          color: amber
```

</DashboardGrid>

## Climate

The two thermostats with their steppers and what they are doing, the living room fan's speeds, the blinds, the room temperatures and the office air with their history, the bathroom's humidity with a switch for its fan, the temperatures of four rooms in a [multi trend card](/cards/multi-trend-card) with a time axis, the windows in a table and the weather outside.

<DashboardGrid mode="dark" b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogQ2xpbWF0ZQogICAgICBzdWJ0aXRsZTogInt7IHN0YXRlcygnc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUnKSB9fSDCsEMgb3V0c2lkZSDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5vdXRkb29yX2h1bWlkaXR5JykgfX0gJSBodW1pZGl0eSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19Iiwgc2hvd19pY29uOiBmYWxzZSwgdGFwX2FjdGlvbjogeyBhY3Rpb246IG5vbmUgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgY29sdW1uczogMgogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDQgfQogICAgICBjYXJkczoKICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogY2xpbWF0ZS5saXZpbmdfcm9vbQogICAgICAgICAgbmFtZTogTGl2aW5nIHJvb20KICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICBhdHRyaWJ1dGU6IGN1cnJlbnRfdGVtcGVyYXR1cmUKICAgICAgICAgIHVuaXQ6IMKwQwogICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgIGNvbnRyb2w6IHN0ZXBwZXIKICAgICAgICAgIGNvbG9yOiBkZWVwLW9yYW5nZQogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIGVudGl0eTogY2xpbWF0ZS5saXZpbmdfcm9vbQogICAgICAgICAgICAgIGF0dHJpYnV0ZTogaHZhY19hY3Rpb24KICAgICAgICAgICAgICBydWxlczogJmFjdGlvbgogICAgICAgICAgICAgICAgLSB7IHN0YXRlOiBoZWF0aW5nLCBjb2xvcjogZGVlcC1vcmFuZ2UsIGljb246IG1kaTpmaXJlLCBsYWJlbDogSGVhdGluZyB9CiAgICAgICAgICAgICAgICAtIHsgc3RhdGU6IGlkbGUsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6ZmlyZS1vZmYsIGxhYmVsOiBJZGxlIH0KICAgICAgICAgICAgICAgIC0geyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6cG93ZXIsIGxhYmVsOiAiT2ZmIiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IGNsaW1hdGUuYmVkcm9vbQogICAgICAgICAgbmFtZTogQmVkcm9vbQogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGF0dHJpYnV0ZTogY3VycmVudF90ZW1wZXJhdHVyZQogICAgICAgICAgdW5pdDogwrBDCiAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgY29udHJvbDogc3RlcHBlcgogICAgICAgICAgY29sb3I6IGluZGlnbwogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBjbGltYXRlLmJlZHJvb20sIGF0dHJpYnV0ZTogaHZhY19hY3Rpb24sIHJ1bGVzOiAqYWN0aW9uIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogZmFuLmxpdmluZ19yb29tCiAgICAgICAgICBuYW1lOiBMaXZpbmcgcm9vbSBmYW4KICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICBhdHRyaWJ1dGU6IHBlcmNlbnRhZ2UKICAgICAgICAgIHVuaXQ6ICIlIgogICAgICAgICAgY29udHJvbDogc2VnbWVudHMKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6ICJvbiIsIGNvbG9yOiBjeWFuIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBjb3Zlci5saXZpbmdfcm9vbV9ibGluZHMKICAgICAgICAgIG5hbWU6IEJsaW5kcwogICAgICAgICAgaWNvbjogbWRpOmJsaW5kcy1ob3Jpem9udGFsCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgYXR0cmlidXRlOiBjdXJyZW50X3Bvc2l0aW9uCiAgICAgICAgICB1bml0OiAiJSIKICAgICAgICAgIGNvbnRyb2w6IHNsaWRlcgogICAgICAgICAgY29sb3I6IGluZGlnbwogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IubGl2aW5nX3Jvb21fdGVtcGVyYXR1cmUKICAgICAgICAgIG5hbWU6IExpdmluZyByb29tCiAgICAgICAgICBpY29uOiBtZGk6c29mYQogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICB2aXN1YWw6IHNwYXJrbGluZQogICAgICAgICAgaG91cnNfdG9fc2hvdzogMjQKICAgICAgICAgIHJ1bGVzOiAmdGVtcGVyYXR1cmUKICAgICAgICAgICAgLSB7IGJlbG93OiAxOCwgY29sb3I6IGJsdWUsIGxhYmVsOiBDb29sIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyNCwgY29sb3I6IGdyZWVuLCBsYWJlbDogQ29tZm9ydGFibGUgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDI0LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogV2FybSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5iZWRyb29tX3RlbXBlcmF0dXJlCiAgICAgICAgICBuYW1lOiBCZWRyb29tCiAgICAgICAgICBpY29uOiBtZGk6YmVkCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgIHZpc3VhbDogc3BhcmtsaW5lCiAgICAgICAgICBob3Vyc190b19zaG93OiAyNAogICAgICAgICAgcnVsZXM6ICp0ZW1wZXJhdHVyZQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuYmF0aHJvb21faHVtaWRpdHkKICAgICAgICAgIG5hbWU6IEJhdGhyb29tCiAgICAgICAgICBpY29uOiBtZGk6c2hvd2VyCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHZpc3VhbDogYmFyCiAgICAgICAgICBtaW46IDMwCiAgICAgICAgICBtYXg6IDEwMAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogNjAsIGNvbG9yOiBncmVlbiwgbGFiZWw6IERyeSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogNzAsIGNvbG9yOiBhbWJlciwgbGFiZWw6IEh1bWlkIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA3MCwgY29sb3I6IHJlZCwgbGFiZWw6IFZlbnRpbGF0ZSwgdGludF9jYXJkOiB0cnVlIH0KICAgICAgICAgIGJhZGdlczoKICAgICAgICAgICAgLSB7IGVudGl0eTogZmFuLmJhdGhyb29tLCBjb250cm9sOiB0b2dnbGUgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iub2ZmaWNlX2NvMgogICAgICAgICAgbmFtZTogT2ZmaWNlIGFpcgogICAgICAgICAgaWNvbjogbWRpOm1vbGVjdWxlLWNvMgogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHNwYXJrbGluZQogICAgICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDgwMCwgY29sb3I6IGdyZWVuLCBsYWJlbDogRnJlc2ggfQogICAgICAgICAgICAtIHsgYmVsb3c6IDEyMDAsIGNvbG9yOiBhbWJlciwgbGFiZWw6IFN0dWZmeSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMTIwMCwgY29sb3I6IHJlZCwgbGFiZWw6IFZlbnRpbGF0ZSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBUZW1wZXJhdHVyZXMKICAgICAgICAgIGljb246IG1kaTpob21lLXRoZXJtb21ldGVyCiAgICAgICAgICBjb2xvcjogb3JhbmdlCiAgICAgICAgICBob3Vyc190b19zaG93OiAyNAogICAgICAgICAgeF9heGlzOiB0cnVlCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMiwgM10gfQogICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5saXZpbmdfcm9vbV90ZW1wZXJhdHVyZSwgbmFtZTogTGl2aW5nIHJvb20sIGNvbG9yOiBncmVlbiB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5iZWRyb29tX3RlbXBlcmF0dXJlLCBuYW1lOiBCZWRyb29tLCBjb2xvcjogaW5kaWdvIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm9mZmljZV90ZW1wZXJhdHVyZSwgbmFtZTogT2ZmaWNlLCBjb2xvcjogb3JhbmdlIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmJhdGhyb29tX3RlbXBlcmF0dXJlLCBuYW1lOiBCYXRocm9vbSwgY29sb3I6IHRlYWwgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkLXBybwogICAgICAgICAgdGl0bGU6IFdpbmRvd3MKICAgICAgICAgIGljb246IG1kaTp3aW5kb3ctY2xvc2VkLXZhcmlhbnQKICAgICAgICAgIGxheW91dDogdGFibGUKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsxLCAzXSB9CiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogYmluYXJ5X3NlbnNvci53aW5kb3dfa2l0Y2hlbiwgbmFtZTogS2l0Y2hlbiwgdmlzdWFsOiBiYWRnZSwgcnVsZXM6ICZ3aW5kb3cgW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiByZWQsIGxhYmVsOiBPcGVuIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBDbG9zZWQgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBiaW5hcnlfc2Vuc29yLndpbmRvd19iYXRocm9vbSwgbmFtZTogQmF0aHJvb20sIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiAqd2luZG93IH0KICAgICAgICAgICAgLSB7IGVudGl0eTogYmluYXJ5X3NlbnNvci53aW5kb3dfYmVkcm9vbSwgbmFtZTogQmVkcm9vbSwgdmlzdWFsOiBiYWRnZSwgcnVsZXM6ICp3aW5kb3cgfQogICAgICAgICAgICAtIHsgZW50aXR5OiBiaW5hcnlfc2Vuc29yLndpbmRvd19vZmZpY2UsIG5hbWU6IE9mZmljZSwgdmlzdWFsOiBiYWRnZSwgcnVsZXM6ICp3aW5kb3cgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOndlYXRoZXItY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogd2VhdGhlci5ob21lCiAgICAgICAgICBuYW1lOiBPdXRzaWRlCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgdGVtcGVyYXR1cmVfcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogNSwgY29sb3I6IGJsdWUsIGxhYmVsOiBDb2xkIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHRlYWwsIGxhYmVsOiBNaWxkIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAyMCwgY29sb3I6IG9yYW5nZSwgbGFiZWw6IFdhcm0gfQo=">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Climate
      subtitle: "{{ states('sensor.outdoor_temperature') }} °C outside · {{ states('sensor.outdoor_humidity') }} % humidity"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", show_icon: false, tap_action: { action: none } }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:entity-card-pro
          entity: climate.living_room
          name: Living room
          layout: poster
          attribute: current_temperature
          unit: °C
          decimals: 1
          control: stepper
          color: deep-orange
          badges:
            - entity: climate.living_room
              attribute: hvac_action
              rules: &action
                - { state: heating, color: deep-orange, icon: mdi:fire, label: Heating }
                - { state: idle, color: grey, icon: mdi:fire-off, label: Idle }
                - { state: "off", color: grey, icon: mdi:power, label: "Off" }
        - type: custom:entity-card-pro
          entity: climate.bedroom
          name: Bedroom
          layout: poster
          attribute: current_temperature
          unit: °C
          decimals: 1
          control: stepper
          color: indigo
          badges:
            - { entity: climate.bedroom, attribute: hvac_action, rules: *action }
        - type: custom:entity-card-pro
          entity: fan.living_room
          name: Living room fan
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
          entity: sensor.living_room_temperature
          name: Living room
          icon: mdi:sofa
          layout: poster
          decimals: 1
          visual: sparkline
          hours_to_show: 24
          rules: &temperature
            - { below: 18, color: blue, label: Cool }
            - { below: 24, color: green, label: Comfortable }
            - { above: 24, color: orange, label: Warm }
        - type: custom:entity-card-pro
          entity: sensor.bedroom_temperature
          name: Bedroom
          icon: mdi:bed
          layout: poster
          decimals: 1
          visual: sparkline
          hours_to_show: 24
          rules: *temperature
        - type: custom:entity-card-pro
          entity: sensor.bathroom_humidity
          name: Bathroom
          icon: mdi:shower
          layout: poster
          decimals: 0
          visual: bar
          min: 30
          max: 100
          rules:
            - { below: 60, color: green, label: Dry }
            - { below: 70, color: amber, label: Humid }
            - { above: 70, color: red, label: Ventilate, tint_card: true }
          badges:
            - { entity: fan.bathroom, control: toggle }
        - type: custom:entity-card-pro
          entity: sensor.office_co2
          name: Office air
          icon: mdi:molecule-co2
          layout: poster
          decimals: 0
          visual: sparkline
          hours_to_show: 12
          rules:
            - { below: 800, color: green, label: Fresh }
            - { below: 1200, color: amber, label: Stuffy }
            - { above: 1200, color: red, label: Ventilate }
        - type: custom:multi-trend-card-pro
          title: Temperatures
          icon: mdi:home-thermometer
          color: orange
          hours_to_show: 24
          x_axis: true
          view_layout: { span: [2, 3] }
          entities:
            - { entity: sensor.living_room_temperature, name: Living room, color: green }
            - { entity: sensor.bedroom_temperature, name: Bedroom, color: indigo }
            - { entity: sensor.office_temperature, name: Office, color: orange }
            - { entity: sensor.bathroom_temperature, name: Bathroom, color: teal }
        - type: custom:entity-group-card-pro
          title: Windows
          icon: mdi:window-closed-variant
          layout: table
          view_layout: { span: [1, 3] }
          entities:
            - { entity: binary_sensor.window_kitchen, name: Kitchen, visual: badge, rules: &window [{ state: "on", color: red, label: Open }, { state: "off", color: green, label: Closed }] }
            - { entity: binary_sensor.window_bathroom, name: Bathroom, visual: badge, rules: *window }
            - { entity: binary_sensor.window_bedroom, name: Bedroom, visual: badge, rules: *window }
            - { entity: binary_sensor.window_office, name: Office, visual: badge, rules: *window }
        - type: custom:weather-card-pro
          entity: weather.home
          name: Outside
          layout: poster
          temperature_rules:
            - { below: 5, color: blue, label: Cold }
            - { below: 20, color: teal, label: Mild }
            - { above: 20, color: orange, label: Warm }
```

</DashboardGrid>

## Energy

The [power flow](/cards/power-flow-card) in a block of four cells, then the solar output, the grid's import and export per half hour, the home battery, the car, today's energy with its cost, the price, the washer with the time it has left and the heat pump.

<DashboardGrid mode="dark" b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogRW5lcmd5CiAgICAgIHN1YnRpdGxlOiAie3sgc3RhdGVzKCdzZW5zb3IuZW5lcmd5X3RvZGF5JykgfX0ga1doIHRvZGF5IMK3IHt7IHN0YXRlcygnc2Vuc29yLmVsZWN0cmljaXR5X3ByaWNlJykgfX0g4oKsL2tXaCBub3ciCiAgICAgIGJhZGdlX3N0eWxlOiBwbGFpbgogICAgICBiYWRnZV9zaXplOiBsCiAgICAgIGJhZGdlczoKICAgICAgICAtIHsgdmFsdWU6ICJ7eyBub3coKS5zdHJmdGltZSgnJUg6JU0nKSB9fSIsIHNob3dfaWNvbjogZmFsc2UsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBub25lIH0gfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNvbHVtbnM6IDIKICAgICAgYnJlYWtwb2ludHM6CiAgICAgICAgMjogeyBjb2x1bW5zOiA0IH0KICAgICAgY2FyZHM6CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG93ZXItZmxvdy1jYXJkLXBybwogICAgICAgICAgaG9tZTogc2Vuc29yLnBvd2VyX2NvbnN1bXB0aW9uCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMiwgNl0gfQogICAgICAgICAgc291cmNlczoKICAgICAgICAgICAgLSB7IHR5cGU6IHNvbGFyLCBlbnRpdHk6IHNlbnNvci5zb2xhcl9wb3dlciB9CiAgICAgICAgICAgIC0geyB0eXBlOiBiYXR0ZXJ5LCBwb3dlcjogc2Vuc29yLmJhdHRlcnlfcG93ZXIsIHNvYzogc2Vuc29yLmJhdHRlcnlfc29jIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGdyaWQsIHBvd2VyOiBzZW5zb3IuZ3JpZF9wb3dlciwgcHJpY2U6IHNlbnNvci5lbGVjdHJpY2l0eV9wcmljZSB9CiAgICAgICAgICBjb25zdW1lcnM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5oZWF0X3B1bXBfcG93ZXIsIG5hbWU6IEhlYXQgcHVtcCwgaWNvbjogbWRpOmhlYXQtcHVtcCB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci53YXNoZXJfcG93ZXIsIG5hbWU6IFdhc2hlciwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5vZmZpY2VfcG93ZXIsIG5hbWU6IE9mZmljZSwgaWNvbjogbWRpOm1vbml0b3IgfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuZXZfY2hhcmdlcl9wb3dlciwgbmFtZTogRVYgY2hhcmdlciwgaWNvbjogbWRpOmV2LXN0YXRpb24gfQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogNTAwLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBRdWlldCB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMzAwMCwgY29sb3I6IGFtYmVyLCBsYWJlbDogQnVzeSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMzAwMCwgY29sb3I6IHJlZCwgbGFiZWw6IFBlYWsgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iuc29sYXJfcG93ZXIKICAgICAgICAgIG5hbWU6IFNvbGFyCiAgICAgICAgICBpY29uOiBtZGk6c29sYXItcG93ZXItdmFyaWFudAogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICB2aXN1YWw6IHNwYXJrbGluZQogICAgICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGdyZXksIGxhYmVsOiBJZGxlIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAwLjEsIGNvbG9yOiBhbWJlciwgbGFiZWw6IFByb2R1Y2luZyB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5ncmlkX3Bvd2VyCiAgICAgICAgICBuYW1lOiBHcmlkCiAgICAgICAgICBpY29uOiBtZGk6dHJhbnNtaXNzaW9uLXRvd2VyCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHZpc3VhbDogY29sdW1ucwogICAgICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgICAgIGJ1Y2tldF9taW51dGVzOiAzMAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IGdyZWVuLCBsYWJlbDogRXhwb3J0aW5nIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAwLCBjb2xvcjogYmx1ZSwgbGFiZWw6IEltcG9ydGluZyB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5iYXR0ZXJ5X3NvYwogICAgICAgICAgbmFtZTogQmF0dGVyeQogICAgICAgICAgaWNvbjogbWRpOmhvbWUtYmF0dGVyeQogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IGJhcgogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiByZWQsIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDUwLCBjb2xvcjogYW1iZXIsIGxhYmVsOiBIYWxmIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA1MCwgY29sb3I6IGdyZWVuLCBsYWJlbDogRnVsbCB9CiAgICAgICAgICBiYWRnZXM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5iYXR0ZXJ5X3Bvd2VyLCBmb3JtYXQ6IHBvd2VyLCBpY29uOiBtZGk6Zmxhc2ggfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuZXZfYmF0dGVyeQogICAgICAgICAgbmFtZTogQ2FyCiAgICAgICAgICBpY29uOiBtZGk6Y2FyLWVsZWN0cmljCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiByZWQsIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDIwLCBjb2xvcjogZ3JlZW4gfQogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuZXZfY2hhcmdlcl9wb3dlciwgZm9ybWF0OiBwb3dlciwgaWNvbjogbWRpOmV2LXN0YXRpb24gfQogICAgICAgICAgICAtIHNlbnNvci5ldl9yYW5nZQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuZW5lcmd5X3RvZGF5CiAgICAgICAgICBuYW1lOiBFbmVyZ3kgdG9kYXkKICAgICAgICAgIGljb246IG1kaTpjYXNoCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgIHNlY29uZGFyeTogInt7IChzdGF0ZXMoJ3NlbnNvci5lbmVyZ3lfdG9kYXknKSB8IGZsb2F0KDApICogc3RhdGVzKCdzZW5zb3IuZWxlY3RyaWNpdHlfcHJpY2UnKSB8IGZsb2F0KDApKSB8IHJvdW5kKDIpIH19IOKCrCBhdCB7eyBzdGF0ZXMoJ3NlbnNvci5lbGVjdHJpY2l0eV9wcmljZScpIH19IOKCrC9rV2giCiAgICAgICAgICBjb2xvcjogZ3JlZW4KICAgICAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogc2Vuc29yLmVsZWN0cmljaXR5X3ByaWNlCiAgICAgICAgICBuYW1lOiBQcmljZQogICAgICAgICAgaWNvbjogbWRpOmN1cnJlbmN5LWV1cgogICAgICAgICAgbGF5b3V0OiBwb3N0ZXIKICAgICAgICAgIGRlY2ltYWxzOiAyCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAwLjIsIGNvbG9yOiBncmVlbiwgbGFiZWw6IENoZWFwIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAwLjM1LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBOb3JtYWwgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDAuMzUsIGNvbG9yOiByZWQsIGxhYmVsOiBFeHBlbnNpdmUgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iud2FzaGVyX3N0YXR1cwogICAgICAgICAgbmFtZTogV2FzaGVyCiAgICAgICAgICBsYXlvdXQ6IHBvc3RlcgogICAgICAgICAgdmFsdWU6ICJ7eyBzdGF0ZXMoJ3NlbnNvci53YXNoZXJfc3RhdHVzJykgfCByZXBsYWNlKCdwb3dlcl9vZmYnLCAnT2ZmJykgfCByZXBsYWNlKCdydW4nLCAnUnVubmluZycpIHwgcmVwbGFjZSgnZW5kJywgJ0RvbmUnKSB9fSIKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6IFJ1bm5pbmcsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogRG9uZSwgY29sb3I6IHRlYWwsIGljb246IG1kaTp3YXNoaW5nLW1hY2hpbmUtYWxlcnQgfQogICAgICAgICAgICAtIHsgc3RhdGU6ICJPZmYiLCBjb2xvcjogZ3JleSwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZS1vZmYgfQogICAgICAgICAgYmFkZ2VzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iud2FzaGVyX3JlbWFpbmluZywgaWNvbjogbWRpOnRpbWVyLW91dGxpbmUgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuaGVhdF9wdW1wX3Bvd2VyCiAgICAgICAgICBuYW1lOiBIZWF0IHB1bXAKICAgICAgICAgIGljb246IG1kaTpoZWF0LXB1bXAKICAgICAgICAgIGxheW91dDogcG9zdGVyCiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgdmlzdWFsOiBzcGFya2xpbmUKICAgICAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgICAgICBjb2xvcjogZGVlcC1vcmFuZ2UK">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Energy
      subtitle: "{{ states('sensor.energy_today') }} kWh today · {{ states('sensor.electricity_price') }} €/kWh now"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", show_icon: false, tap_action: { action: none } }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:power-flow-card-pro
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
          entity: sensor.ev_battery
          name: Car
          icon: mdi:car-electric
          layout: poster
          rules:
            - { below: 20, color: red, label: Low }
            - { above: 20, color: green }
          badges:
            - { entity: sensor.ev_charger_power, format: power, icon: mdi:ev-station }
            - sensor.ev_range
        - type: custom:entity-card-pro
          entity: sensor.energy_today
          name: Energy today
          icon: mdi:cash
          layout: poster
          decimals: 1
          secondary: "{{ (states('sensor.energy_today') | float(0) * states('sensor.electricity_price') | float(0)) | round(2) }} € at {{ states('sensor.electricity_price') }} €/kWh"
          color: green
        - type: custom:entity-card-pro
          entity: sensor.electricity_price
          name: Price
          icon: mdi:currency-eur
          layout: poster
          decimals: 2
          rules:
            - { below: 0.2, color: green, label: Cheap }
            - { below: 0.35, color: amber, label: Normal }
            - { above: 0.35, color: red, label: Expensive }
        - type: custom:entity-card-pro
          entity: sensor.washer_status
          name: Washer
          layout: poster
          value: "{{ states('sensor.washer_status') | replace('power_off', 'Off') | replace('run', 'Running') | replace('end', 'Done') }}"
          rules:
            - { state: Running, color: green, icon: mdi:washing-machine }
            - { state: Done, color: teal, icon: mdi:washing-machine-alert }
            - { state: "Off", color: grey, icon: mdi:washing-machine-off }
          badges:
            - { entity: sensor.washer_remaining, icon: mdi:timer-outline }
        - type: custom:entity-card-pro
          entity: sensor.heat_pump_power
          name: Heat pump
          icon: mdi:heat-pump
          layout: poster
          decimals: 0
          visual: sparkline
          hours_to_show: 12
          color: deep-orange
```

</DashboardGrid>
