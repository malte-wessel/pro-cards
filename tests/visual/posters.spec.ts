// The poster card, case by case from what its code draws (not from the docs' examples): every
// poster type in the states it draws differently (`pt-`), every variant (`pv-`), the poster's own
// options (`po-`), the status and the corner's badges (`pb-`), and the sizes, widths and themes a
// poster fits itself to (`ps-`). A case sets the states it needs (`states`: an entity's own, or a
// copy of one under a new id, so one case shows a type at several levels side by side).
import type { CardConfigBase, GridOptions } from "../../src/shared/ha.ts";
import type { StateOverride } from "../harness/harness.ts";
import { FROZEN } from "../e2e/util.ts";
import { shoot, type Shot } from "./shoot.ts";

const P = "custom:poster-card-pro";
type Opts = Record<string, unknown>;
const p = (entity: string | null, o: Opts = {}): CardConfigBase => ({
  type: P,
  ...(entity ? { entity } : {}),
  ...o,
});
// a copy of `base` under a new id, in another state
const like = (base: string, state?: string | number, attributes?: Opts): StateOverride => ({
  like: base,
  state,
  attributes,
});
// copies of one entity at several states: their ids, and the states for the case
const levels = (base: string, prefix: string, values: (string | number)[], attributes?: Opts) => {
  const ids = values.map((_, i) => `${base.split(".")[0]}.${prefix}_${i}`);
  const states = Object.fromEntries(ids.map((id, i) => [id, like(base, values[i], attributes)]));
  return { ids, states };
};
const at = (hours: number) => new Date(FROZEN.getTime() + hours * 3600e3);

const cases: Record<string, Shot> = {};
const add = (name: string, cards: CardConfigBase[], o: Omit<Shot, "cards"> = {}) => {
  cases[name] = { cards, ...o };
};

// ----- the types -----

add("pt-entity", [
  p("sensor.living_room_temperature"),
  p("binary_sensor.door_front"),
  p("switch.coffee_machine"),
  p("input_select.house_mode"),
  p("input_number.target_humidity"),
  p("light.living_room", { poster: "entity" }),
]);
add("pt-entity-states", [
  p("switch.shed_heater"),
  p("sensor.not_in_this_home"),
  p("input_boolean.guest_mode"),
  p("binary_sensor.window_kitchen"),
  p("sensor.robot_current_room"),
  p("sensor.washer_remaining"),
]);

{
  const b = levels("sensor.robot_battery", "pt_battery", [100, 55, 18, 6]);
  add(
    "pt-battery",
    [
      ...b.ids.map((id) => p(id)),
      p("sensor.phone_battery", { poster: "battery" }),
      p(b.ids[3], { name: "No rules", rules: [] }),
    ],
    { states: b.states },
  );
}
add(
  "pt-battery-home",
  [
    p("sensor.battery_soc", { power: "sensor.battery_power", name: "Discharging" }),
    p("sensor.battery_soc", { power: "sensor.pt_battery_in", name: "Charging" }),
    p("sensor.balcony_battery_soc", {
      charge: "sensor.balcony_battery_charge_power",
      discharge: "sensor.balcony_battery_discharge_power",
      name: "Charge and discharge",
    }),
    p("sensor.battery_soc", { power: "sensor.pt_battery_idle", name: "Idle" }),
  ],
  {
    states: {
      "sensor.pt_battery_in": like("sensor.battery_power", 1500),
      "sensor.pt_battery_idle": like("sensor.battery_power", 0),
    },
  },
);
{
  const c = levels("sensor.living_room_co2", "pt_co2", [600, 1000, 1500, 2600]);
  add(
    "pt-co2",
    c.ids.map((id) => p(id)),
    { states: c.states },
  );
  const pm25 = levels("sensor.living_room_pm25", "pt_pm25", [8, 40]);
  const pm10 = levels("sensor.living_room_pm25", "pt_pm10", [30, 120], {
    device_class: "pm10",
    friendly_name: "PM10",
  });
  add(
    "pt-pm",
    [...pm25.ids, ...pm10.ids].map((id) => p(id)),
    { states: { ...pm25.states, ...pm10.states } },
  );
  const aqi = levels("sensor.outdoor_aqi", "pt_aqi", [30, 90, 130, 180, 250, 350]);
  add(
    "pt-aqi",
    aqi.ids.map((id) => p(id)),
    { states: aqi.states },
  );
}

add("pt-weather", [
  p("weather.home"),
  p("weather.home", { show_entity_picture: false }),
  p("weather.home", { hours_to_show: 24, name: "24 hours" }),
  p("weather.home", { rules: [{ state: "partlycloudy", color: "teal", label: "Mild" }] }),
]);
{
  const w = levels("weather.home", "pt_weather", [
    "sunny",
    "rainy",
    "lightning-rainy",
    "snowy",
    "fog",
    "exceptional",
  ]);
  add(
    "pt-weather-conditions",
    w.ids.map((id) => p(id)),
    { states: w.states },
  );
  const n = levels("weather.home", "pt_night", ["clear-night", "partlycloudy"]);
  add(
    "pt-weather-night",
    [...n.ids.map((id) => p(id)), ...n.ids.map((id) => p(id, { show_entity_picture: false }))],
    { states: { ...n.states, "sun.sun": { state: "below_horizon" } }, time: at(12) },
  );
}

add("pt-sun", [
  p("sun.sun"),
  p(null, { poster: "sun", name: "Sun" }),
  p("sun.sun", { color: "deep-orange", name: "Own colour" }),
  p("sun.sun", { grid_options: { columns: 6, rows: 4 } }),
]);
add("pt-sun-evening", [p("sun.sun"), p(null, { poster: "sun" })], { time: at(7) });
add("pt-sun-night", [p("sun.sun"), p(null, { poster: "sun" })], { time: at(12) });

{
  const inputs = { direction: "sensor.wind_direction", gust: "sensor.wind_gust" };
  const w = levels("sensor.wind_speed", "pt_wind", [2, 12, 28, 42, 65]);
  add(
    "pt-wind",
    [
      p("sensor.wind_speed"),
      p("weather.home", { poster: "wind" }),
      p("sensor.wind_speed", { direction: false, gust: false, name: "No direction" }),
      p(w.ids[0], inputs),
    ],
    { states: w.states },
  );
  add(
    "pt-wind-levels",
    w.ids.slice(1).map((id) => p(id, inputs)),
    { states: w.states },
  );
}
{
  const r = levels("sensor.rain_rate_roof", "pt_rain", [5, 20, 60]);
  add(
    "pt-rain",
    [
      p("sensor.rain_rate"),
      p("sensor.rain_rate_roof"),
      ...r.ids.map((id) => p(id, { today: "sensor.rain_today" })),
      p("sensor.rain_rate_roof", {
        wind: "sensor.wind_speed",
        direction: "sensor.wind_direction",
        today: false,
        name: "In the wind",
      }),
    ],
    { states: r.states },
  );
}
add("pt-trend", [
  p(null, {
    poster: "trend",
    name: "Temperatures",
    series: [
      "sensor.living_room_temperature",
      "sensor.bedroom_temperature",
      "sensor.outdoor_temperature",
    ],
  }),
  p(null, {
    poster: "trend",
    name: "Named and coloured",
    hours_to_show: 24,
    series: [
      { entity: "sensor.living_room_humidity", name: "Living", color: "teal" },
      { entity: "sensor.bathroom_humidity", name: "Bath", color: "purple" },
    ],
  }),
  p("sensor.outdoor_humidity", {
    poster: "trend",
    series: ["sensor.outdoor_humidity", "sensor.kitchen_humidity"],
  }),
  p(null, { poster: "trend", name: "One line", series: ["sensor.power_consumption"] }),
]);

add(
  "pt-light",
  [
    p("light.living_room"),
    p("light.attic"),
    p("light.office"),
    p("light.kitchen"),
    p("light.pt_hallway"),
    p("light.shed"),
  ],
  { states: { "light.pt_hallway": like("light.hallway", "on") } },
);
add("pt-fan", [p("fan.living_room"), p("fan.bedroom"), p("fan.bathroom"), p("fan.pt_full")], {
  states: { "fan.pt_full": like("fan.living_room", "on", { percentage: 100 }) },
});
add(
  "pt-climate",
  [
    p("climate.living_room"),
    p("climate.bedroom"),
    p("climate.pt_cooling"),
    p("climate.pt_idle"),
    p("climate.living_room", { control: false, name: "No stepper" }),
    p("climate.shed"),
  ],
  {
    states: {
      "climate.pt_cooling": like("climate.living_room", "cool", {
        friendly_name: "Office AC",
        hvac_action: "cooling",
        hvac_modes: ["off", "cool", "auto"],
        temperature: 22,
        current_temperature: 25.5,
      }),
      "climate.pt_idle": like("climate.living_room", "heat", {
        friendly_name: "Kitchen thermostat",
        hvac_action: "idle",
        temperature: 21,
        current_temperature: 21.5,
      }),
    },
  },
);
{
  const l = levels("lock.front_door", "pt_lock", ["jammed", "unlocking", "open"]);
  add(
    "pt-lock",
    [p("lock.front_door"), p("lock.garage_side_door"), ...l.ids.map((id) => p(id)), p("lock.shed")],
    { states: l.states },
  );
}
{
  const a = levels("alarm_control_panel.home", "pt_alarm", [
    "armed_away",
    "armed_home",
    "arming",
    "triggered",
  ]);
  add(
    "pt-alarm",
    [
      p("alarm_control_panel.home"),
      ...a.ids.map((id) => p(id)),
      p("alarm_control_panel.pt_code", { name: "With a code" }),
    ],
    {
      states: {
        ...a.states,
        "alarm_control_panel.pt_code": like("alarm_control_panel.home", "armed_night", {
          code_format: "number",
          code_arm_required: true,
        }),
      },
    },
  );
}
add(
  "pt-person",
  [
    p("person.malte"),
    p("person.sam"),
    p("person.kim"),
    p("person.pt_work"),
    p("person.malte", { show_entity_picture: false, name: "No picture in the icon" }),
    p("person.malte", { image_blur: false, name: "Sharp" }),
  ],
  {
    states: {
      "person.pt_work": { ...like("person.malte", "Work", { friendly_name: "At work" }), ago: 125 },
    },
  },
);
add(
  "pt-media",
  [
    p("media_player.living_room_speaker"),
    p("media_player.bedroom_speaker"),
    p("media_player.kitchen_speaker", { show_entity_picture: false }),
    p("media_player.pt_off"),
  ],
  {
    states: {
      "media_player.pt_off": like("media_player.living_room_speaker", "off", {
        friendly_name: "Office speaker",
        media_title: null,
        media_artist: null,
        media_album_name: null,
        entity_picture: null,
        media_position: null,
        media_duration: null,
      }),
    },
  },
);
add("pt-cover", [
  p("cover.living_room_blinds"),
  p("cover.office_blinds"),
  p("cover.patio_blind"),
  p("cover.bedroom_curtain"),
  p("cover.awning"),
  p("cover.garage_door"),
  p("cover.driveway_gate"),
  p("cover.workshop_door"),
]);
add(
  "pt-cover-states",
  [p("cover.pt_opening"), p("cover.pt_closing"), p("cover.pt_window"), p("cover.shed_door")],
  {
    states: {
      "cover.pt_opening": like("cover.living_room_blinds", "opening", { current_position: 30 }),
      "cover.pt_closing": like("cover.garage_door", "closing"),
      "cover.pt_window": like("cover.workshop_door", "open", {
        friendly_name: "Skylight",
        current_position: 50,
      }),
    },
  },
);
add(
  "pt-robot",
  [
    p("vacuum.robot"),
    p("vacuum.pt_returning"),
    p("vacuum.pt_docked"),
    p("vacuum.pt_error"),
    p("lawn_mower.garden"),
    p("lawn_mower.pt_docked"),
  ],
  {
    states: {
      "vacuum.pt_returning": like("vacuum.robot", "returning", { status: "Returning" }),
      "vacuum.pt_docked": like("vacuum.robot", "docked", { battery_level: 100, status: null }),
      "vacuum.pt_error": like("vacuum.robot", "error", { status: "Stuck" }),
      "lawn_mower.pt_docked": like("lawn_mower.garden", "docked"),
    },
  },
);
add(
  "pt-grid",
  [
    p("sensor.grid_power", { poster: "grid" }),
    p("sensor.pt_grid_in", { poster: "grid" }),
    p("sensor.pt_grid_idle", { poster: "grid" }),
    p(null, {
      poster: "grid",
      name: "Grid",
      import: "sensor.grid_import_power",
      export: "sensor.grid_export_power",
    }),
  ],
  {
    states: {
      "sensor.pt_grid_in": like("sensor.grid_power", 2300),
      "sensor.pt_grid_idle": like("sensor.grid_power", 4),
    },
  },
);
add(
  "pt-solar",
  [
    p("sensor.solar_power", { poster: "solar", today: "sensor.energy_today" }),
    p("sensor.solar_power", { poster: "solar", today: false, name: "No today" }),
    p("sensor.balcony_solar_power", { poster: "solar" }),
    p("sensor.pt_solar_off", { poster: "solar", today: "sensor.energy_today" }),
  ],
  { states: { "sensor.pt_solar_off": like("sensor.solar_power", 0) } },
);
add(
  "pt-car",
  [
    p("sensor.ev_battery", { poster: "car" }),
    p("sensor.ev_battery", { poster: "car", charging: false, name: "Plugged in" }),
    p("sensor.ev_battery", { poster: "car", charging: false, plugged: false, name: "Away" }),
    p("sensor.pt_ev_low", { poster: "car", range: "sensor.pt_ev_range", charging: false }),
  ],
  {
    states: {
      "device_tracker.ev": { state: "not_home" },
      "sensor.pt_ev_low": like("sensor.ev_battery", 8, { friendly_name: "Car" }),
      "sensor.pt_ev_range": like("sensor.ev_range", 31),
    },
  },
);
add("pt-appliance", [
  p("sensor.washer_power", { poster: "appliance" }),
  p("sensor.dryer_power", { poster: "appliance" }),
  p("sensor.heat_pump_power", { poster: "appliance", variant: "heat_pump" }),
  p("sensor.office_power", { poster: "appliance", running_above: 200, name: "Below threshold" }),
]);

// ----- the variants -----

add(
  "pv-wind",
  ["dots", "lines", "swoosh", "vectors"].map((variant) =>
    p("sensor.wind_speed", { variant, name: variant }),
  ),
);
add("pv-rain", [
  ...["drops", "ripples", "fill"].map((variant) =>
    p("sensor.rain_rate_roof", { variant, name: variant }),
  ),
  p("sensor.rain_rate", { variant: "fill", name: "fill, dry" }),
]);
add(
  "pv-cover",
  ["shutter", "blind", "curtain", "garage", "gate", "awning", "window"].map((variant) =>
    p("cover.pt_half", { variant, name: variant }),
  ),
  {
    states: {
      "cover.pt_half": like("cover.patio_blind", "open", {
        current_position: 50,
        current_tilt_position: 70,
      }),
    },
  },
);
add("pv-appliance", [
  ...["pump", "washer", "dryer", "dishwasher", "heat_pump"].map((variant) =>
    p("sensor.washer_power", { poster: "appliance", variant, name: variant }),
  ),
  p("sensor.dryer_power", { poster: "appliance", variant: "dryer", name: "dryer, off" }),
]);

// ----- the poster's options -----

add("po-texts", [
  p("sensor.outdoor_temperature", { name: "Outside", secondary: "In the shade" }),
  p("sensor.outdoor_temperature", { name_position: "below" }),
  p("sensor.outdoor_temperature", { prefix: "≈ ", suffix: " now", decimals: 0 }),
  p("sensor.pressure", { unit: "mbar", name: "Unit of its own" }),
  p("weather.home", { poster: "entity", attribute: "humidity", name: "An attribute" }),
  p(null, { name: "Note", icon: "mdi:note-outline", value: "Bins out" }),
]);
add("po-hide", [
  p("sensor.wind_speed", { show_name: false }),
  p("sensor.wind_speed", { show_icon: false }),
  p("sensor.wind_speed", { show_value: false }),
  p("switch.garden_pump", { image: "camera.garden", show_icon: false, show_value: false }),
]);
add("po-no-data", [
  p("sensor.robot_current_room", { visual: "sparkline" }),
  p("sensor.robot_current_room", { visual: "columns" }),
]);
add("po-templates", [
  p(null, {
    name: "Template value",
    icon: "mdi:thermometer",
    value: "{{ states('sensor.outdoor_temperature') }} °C",
  }),
  p("sensor.outdoor_temperature", {
    secondary: "{{ states('sensor.outdoor_humidity') }} % humidity",
  }),
  p("sensor.outdoor_temperature", { name: "{{ states('input_select.house_mode') }} mode" }),
  p("light.living_room", {
    color: "{{ 'red' if is_state('light.living_room', 'on') else 'grey' }}",
  }),
]);
add("po-icon", [
  p("sensor.outdoor_temperature", { icon: "mdi:sun-thermometer" }),
  p("sensor.outdoor_temperature", { icon_style: "plain" }),
  p("sensor.robot_battery", { poster: "entity", icon_ring: true }),
  p("sensor.living_room_humidity", { icon_ring: true, min: 30, max: 70, icon_style: "plain" }),
  p("switch.garden_pump", { icon_image: "camera.garden" }),
  p(null, {
    name: "Malte",
    value: "{{ states('person.malte') }}",
    icon_image: "person.malte",
    icon_ring: true,
  }),
]);
add("po-icon-image", [
  p("sensor.wind_speed", { icon_image: "person.sam", name: "Over the animated lead" }),
  p(null, {
    name: "From a template",
    icon_image: "{{ state_attr('person.sam', 'entity_picture') }}",
  }),
  p(null, { name: "No picture: the icon", icon_image: "person.kim", icon: "mdi:star" }),
  p("camera.garden", { show_entity_picture: true }),
]);
add("po-colour", [
  p("sensor.outdoor_temperature", { color: "red" }),
  p("sensor.outdoor_temperature", { color: "#3f51b5", name: "Hex" }),
  p("sensor.outdoor_temperature", {
    rules: [{ above: 0, color: "orange", icon: "mdi:fire", label: "Warm" }],
  }),
  p("sensor.outdoor_temperature", {
    rules: [{ above: 0, color: "deep-orange", tint_card: true, label: "Tinted" }],
  }),
  p("sensor.outdoor_temperature", { rules: [{ above: 0, color: "red", pulse: true }] }),
  p("light.kitchen", { rules: [{ state: "off", color: "grey", label: "Dark" }], color: "purple" }),
]);
add("po-visuals", [
  p("sensor.outdoor_temperature", { visual: "sparkline" }),
  p("sensor.power_consumption", { visual: "columns" }),
  p("sensor.outdoor_temperature", { visual: "strip" }),
  p("sensor.living_room_humidity", { visual: "bar", min: 0, max: 100 }),
  p("sensor.living_room_humidity", { visual: "gauge", min: 0, max: 100 }),
  p("sensor.living_room_temperature", { visual: "glow", min: 15, max: 25 }),
  p("switch.coffee_machine", { visual: "glow", name: "Glow, off" }),
  p("light.living_room", { visual: "none", name: "No glow" }),
]);
add("po-image", [
  p("switch.garden_pump", { image: "camera.garden", name: "Default" }),
  p("switch.garden_pump", { image: "camera.garden", image_opacity: 0.8, name: "0.8" }),
  p("switch.garden_pump", { image: "camera.garden", image_blur: true, name: "Blurred" }),
  p("switch.garden_pump", {
    image: "camera.garden",
    image_blur: 4,
    image_opacity: 0.6,
    name: "4 px",
  }),
  p("switch.garden_pump", {
    image: "camera.garden",
    image_tint: "indigo",
    image_opacity: 0.5,
    name: "Tinted",
  }),
  p("person.malte", { image: false, name: "No backdrop" }),
]);
add("po-image-sources", [
  p("sensor.outdoor_temperature", {
    image: "{{ state_attr('camera.garden', 'entity_picture') }}",
  }),
  p("sensor.outdoor_temperature", { image: "person.sam", image_opacity: 0.7 }),
  p("media_player.living_room_speaker", { image: false }),
  p("media_player.living_room_speaker", { image_blur: false, image_opacity: 0.6 }),
]);
add("po-rule-looks", [
  p("switch.garden_pump", {
    name: "Matches",
    rules: [{ state: "off", image: "camera.garden", image_opacity: 0.6, color: "green" }],
  }),
  p("switch.garden_pump", {
    name: "Does not match",
    rules: [{ state: "on", image: "camera.garden", image_opacity: 0.6 }],
  }),
  p("light.living_room", { rules: [{ state: "on", icon_style: "plain", icon_ring: true }] }),
  p("person.malte", { rules: [{ state: "home", image: false, icon_image: false }] }),
  p("sensor.outdoor_temperature", { rules: [{ above: 0, icon_image: "person.malte" }] }),
  p("switch.garden_pump", {
    image: "camera.garden",
    image_opacity: 0.2,
    rules: [{ state: "off", image_tint: "blue", image_blur: 8, image_opacity: 0.7 }],
  }),
]);
add("po-controls", [
  p("light.living_room"),
  p("light.attic", { control: "slider" }),
  p("input_number.target_humidity", { control: "stepper" }),
  p("fan.living_room"),
  p("climate.living_room", { control: "segments", control_attribute: "preset_mode" }),
  p("input_select.house_mode", { control: "select" }),
  p("button.restart_router", { control: "button" }),
  p("lock.front_door", { control: "hold" }),
]);
add("po-controls-buttons", [
  p(null, {
    name: "Living room",
    icon: "mdi:sofa",
    value: "Evening",
    control: "buttons",
    control_options: [
      { entity: "light.living_room", label: "Ceiling" },
      { entity: "light.kitchen", icon: "mdi:lightbulb-outline" },
      { icon: "mdi:movie-open", label: "Movie", action: { action: "none" } },
    ],
    grid_options: { columns: 12 },
  }),
  p("light.living_room", { control: false, name: "No control" }),
  p("light.attic", { control: "slider", control_position: "end", name: "Slider at the end" }),
  p("input_number.target_humidity", { control: "stepper", control_position: "block" }),
  p("fan.living_room", { control: "segments", control_position: "block" }),
]);

// ----- the status and the badges -----

add("pb-status", [
  p("light.living_room", { status: false, name: "No status" }),
  p("light.living_room", { status: "Reading light" }),
  p("sensor.outdoor_temperature", {
    status: {
      value: "{{ states('sensor.outdoor_humidity') }} %",
      style: "filled",
      icon: "mdi:water",
    },
  }),
  p("sensor.outdoor_temperature", {
    status: { value: "Mild", color: "teal", style: "soft", show_icon: true, icon: "mdi:leaf" },
  }),
  p("light.living_room", { badges: [{ entity: "sensor.living_room_temperature" }, "status"] }),
  p("fan.living_room", { status: { size: "m", style: "filled" } }),
]);
add("pb-styles", [
  p("sensor.outdoor_temperature", {
    name: "Styles",
    status: false,
    grid_options: { columns: 12, rows: 4 },
    badges: ["outline", "soft", "filled", "plain", "tag"].map((style) => ({
      entity: "sensor.outdoor_humidity",
      style,
    })),
  }),
  p("sensor.outdoor_temperature", {
    name: "Sizes",
    status: false,
    grid_options: { columns: 12, rows: 4 },
    badges: ["s", "m", "l"].map((size) => ({ entity: "sensor.outdoor_humidity", size })),
  }),
]);
add("pb-visuals", [
  p("sensor.power_consumption", {
    name: "Visuals",
    status: false,
    grid_options: { columns: 12, rows: 4 },
    badges: [
      { entity: "sensor.robot_battery", visual: "icon" },
      { entity: "sensor.robot_battery", visual: "ring" },
      { entity: "sensor.ev_battery", visual: "bar" },
      { entity: "sensor.power_consumption", visual: "sparkline" },
    ],
  }),
  p("sensor.power_consumption", {
    name: "More visuals",
    status: false,
    grid_options: { columns: 12, rows: 4 },
    badges: [
      { entity: "sensor.outdoor_temperature", visual: "trend" },
      { entity: "group.downstairs_lights", visual: "count" },
      { entity: "binary_sensor.window_kitchen", visual: "dot" },
    ],
  }),
]);
add(
  "pb-format",
  [
    p(null, {
      name: "Formats",
      value: "",
      grid_options: { columns: 12, rows: 4 },
      badges: [
        { entity: "sensor.washer_power", format: "power" },
        { entity: "sensor.washer_remaining", format: "duration" },
        { entity: "sensor.dishwasher_finishes", format: "relative" },
        { entity: "sensor.outdoor_temperature", format: "auto" },
      ],
    }),
    p(null, {
      name: "Stale",
      value: "",
      grid_options: { columns: 12, rows: 3 },
      badges: [
        { entity: "sensor.pt_stale", stale_after: "1h" },
        { entity: "sensor.outdoor_humidity", stale_after: "1h" },
      ],
    }),
  ],
  { states: { "sensor.pt_stale": { ...like("sensor.outdoor_humidity", 61), ago: 180 } } },
);
add("pb-own", [
  p("climate.living_room", {
    badges: [{ attribute: "hvac_action" }, { attribute: "temperature", icon: "mdi:target" }],
  }),
  p("weather.home", { badges: [{ attribute: "humidity" }, { attribute: "wind_speed" }] }),
  p("sensor.outdoor_temperature", { badges: [{}, { show_name: true, name: "Again" }] }),
  p("sensor.living_room_co2", {
    badges: [
      {
        entity: "sensor.living_room_co2",
        rules: [{ above: 500, color: "red", style: "filled", pulse: true }],
      },
    ],
  }),
]);
add(
  "pb-corner",
  [1, 2, 3, 4].map((n) =>
    p("sensor.outdoor_temperature", {
      name: `${n} badges`,
      badges: [
        "sensor.outdoor_humidity",
        "sensor.pressure",
        "sensor.wind_speed",
        "sensor.uv_index",
      ].slice(0, n),
    }),
  ),
);
add("pb-corner-controls", [
  p("light.living_room", {
    badges: ["sensor.living_room_temperature", "sensor.living_room_humidity"],
  }),
  p("climate.living_room", { badges: ["sensor.living_room_humidity"] }),
  p("media_player.living_room_speaker", { badges: ["sensor.living_room_temperature"] }),
  p("cover.office_blinds", { badges: ["sensor.illuminance"] }),
]);

// ----- sizes, widths and themes -----

// a poster's sizes in a section: half of it and three rows (the default and the grid's least),
// four rows, the whole width; and about the showcases' dashboards' (8 columns: 264 px here, theirs
// 285)
const SIZES: GridOptions[] = [
  { columns: 6, rows: 3 },
  { columns: 6, rows: 4 },
  { columns: 12, rows: 3 },
  { columns: 8, rows: 3 },
];
const SIZED: Record<string, CardConfigBase> = {
  entity: p("sensor.outdoor_temperature", { visual: "sparkline" }),
  light: p("light.living_room"),
  fan: p("fan.living_room"),
  climate: p("climate.living_room"),
  lock: p("lock.front_door"),
  alarm: p("alarm_control_panel.home"),
  person: p("person.malte"),
  media: p("media_player.living_room_speaker"),
  cover: p("cover.office_blinds"),
  vacuum: p("vacuum.robot"),
  weather: p("weather.home"),
  sun: p("sun.sun"),
  wind: p("sensor.wind_speed", { variant: "lines" }),
  rain: p("sensor.rain_rate_roof", { variant: "fill" }),
  trend: p(null, {
    poster: "trend",
    name: "Temperatures",
    series: ["sensor.living_room_temperature", "sensor.outdoor_temperature"],
  }),
  battery: p("sensor.battery_soc", { power: "sensor.battery_power" }),
  car: p("sensor.ev_battery", { poster: "car" }),
  grid: p("sensor.grid_power", { poster: "grid" }),
  solar: p("sensor.solar_power", { poster: "solar", today: "sensor.energy_today" }),
  appliance: p("sensor.washer_power", { poster: "appliance", variant: "washer" }),
  air: p("sensor.living_room_co2"),
};
for (const [name, card] of Object.entries(SIZED))
  add(
    `ps-${name}`,
    SIZES.map((grid_options) => ({ ...card, grid_options })),
  );

// beside a taller card: its own height with fill_height: false, the row's with rows: auto
add("ps-fill-height", [
  p("sensor.outdoor_temperature", { fill_height: false, grid_options: { columns: 6, rows: 4 } }),
  p("light.living_room", { grid_options: { columns: 6, rows: 4 } }),
  p("light.living_room", { grid_options: { columns: 6, rows: 4 } }),
  p("sensor.outdoor_temperature", { grid_options: { columns: 6, rows: "auto" } }),
]);
// where its height follows its content (rows: auto, a masonry view): as tall as that
const LITTLE = [
  p(null, { name: "Note", icon: "mdi:note-outline", value: "Bins out" }),
  p("sensor.outdoor_temperature"),
];
add(
  "ps-auto",
  LITTLE.map((c) => ({ ...c, grid_options: { columns: 6, rows: "auto" } })),
);
add("ps-auto-masonry", LITTLE, { layout: null });
const FEW = [
  p("light.living_room"),
  p("climate.living_room"),
  p("media_player.living_room_speaker"),
  p("sensor.wind_speed", { variant: "lines" }),
  p("weather.home"),
  p("sensor.battery_soc", { power: "sensor.battery_power" }),
];
// a phone 390 px wide: its section 358 px, half of it 175
add("ps-phone", FEW, { width: 358 });
add("ps-wide", FEW, { width: 760 });
add("ps-large-text", FEW, { skin: "large" });
add("ps-graphite", FEW, { skin: "graphite" });

shoot(cases);
