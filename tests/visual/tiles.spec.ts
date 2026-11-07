// The tile card, case by case from what its code draws: every poster type on a tile in the states
// it draws differently (`tt-`), the tile's own options (`to-`), and the sizes, widths and themes it
// fits itself to (`ts-`). A case sets the states it needs (`states`: a copy of an entity under a new
// id, so one case shows a type at several levels side by side).
import type { CardConfigBase, GridOptions } from "../../src/shared/ha.ts";
import type { StateOverride } from "../harness/harness.ts";
import { shoot, type Shot } from "./shoot.ts";

const T = "custom:tile-card-pro";
type Opts = Record<string, unknown>;
const t = (entity: string | null, o: Opts = {}): CardConfigBase => ({
  type: T,
  ...(entity ? { entity } : {}),
  ...o,
});
// a copy of `base` under a new id, in another state
const like = (base: string, state?: string | number, attributes?: Opts): StateOverride => ({
  like: base,
  state,
  attributes,
});

const cases: Record<string, Shot> = {};
const add = (name: string, cards: CardConfigBase[], o: Omit<Shot, "cards"> = {}) => {
  cases[name] = { cards, ...o };
};

// ----- the types -----

add(
  "tt-sensors",
  [
    t("sensor.living_room_temperature"),
    t("binary_sensor.door_front"),
    t("binary_sensor.tt_motion_on"),
    t("binary_sensor.tt_leak_on"),
    t("sensor.illuminance"),
    t("switch.coffee_machine"),
    t("sensor.living_room_co2"),
    t("sensor.tt_co2_high"),
    t("sensor.outdoor_aqi"),
    t("sensor.living_room_pm25"),
    t("sensor.robot_battery", { visual: false }),
    t("sensor.tt_battery_low", { visual: false }),
  ],
  {
    states: {
      "sensor.tt_co2_high": like("sensor.living_room_co2", 2600),
      "binary_sensor.tt_motion_on": like("binary_sensor.motion_hallway", "on"),
      "binary_sensor.tt_leak_on": like("binary_sensor.water_leak_bathroom", "on"),
      "sensor.tt_battery_low": like("sensor.robot_battery", 6),
    },
  },
);
add(
  "tt-weather",
  [
    t("weather.home", { visual: false }),
    t("weather.tt_rainy", { visual: false }),
    t("sun.sun", { visual: false }),
    t("sensor.wind_speed"),
    t("sensor.coast_wind_speed"),
    t("sensor.rain_rate"),
    t("sensor.tt_rain_heavy"),
    t(null, {
      kind: "trend",
      name: "Temperatures",
      series: ["sensor.living_room_temperature", "sensor.outdoor_temperature"],
    }),
  ],
  {
    states: {
      "weather.tt_rainy": like("weather.home", "rainy"),
      "sensor.tt_rain_heavy": like("sensor.rain_rate", 12),
    },
  },
);
add("tt-devices", [
  t("light.living_room"),
  t("light.office"),
  t("fan.living_room"),
  t("fan.bedroom"),
  t("climate.living_room", { visual: false }),
  t("climate.bedroom", { visual: false }),
  t("cover.living_room_blinds"),
  t("cover.garage_door"),
]);
add(
  "tt-devices-more",
  [
    t("lock.front_door"),
    t("lock.tt_jammed"),
    t("alarm_control_panel.home", { visual: false }),
    t("alarm_control_panel.tt_triggered", { visual: false }),
    t("vacuum.robot"),
    t("vacuum.basement"),
    t("media_player.living_room_speaker", { visual: false }),
    t("person.malte", { visual: false }),
  ],
  {
    states: {
      "lock.tt_jammed": like("lock.front_door", "jammed"),
      "alarm_control_panel.tt_triggered": like("alarm_control_panel.home", "triggered"),
    },
  },
);
add("tt-energy", [
  t("sensor.grid_power", { kind: "grid" }),
  t(null, {
    kind: "grid",
    name: "Grid",
    inputs: { import: "sensor.grid_import_power", export: "sensor.grid_export_power" },
  }),
  t("sensor.solar_power", {
    visual: false,
    kind: "solar",
    inputs: { today: "sensor.energy_today" },
  }),
  t("sensor.battery_soc", { visual: false, inputs: { power: "sensor.battery_power" } }),
  t("sensor.ev_battery", { kind: "car" }),
  t("sensor.washer_power", { kind: "washer" }),
]);
// unavailable, and an entity that does not exist
add("tt-unavailable", [
  t("light.shed"),
  t("climate.shed", { visual: false }),
  t("cover.shed_door"),
  t("lock.shed"),
  t("sensor.not_in_this_home"),
  t(null, { name: "Note", icon: "mdi:note-outline", value: "Bins out" }),
]);

// ----- the tile's own options -----

const CO2 = "sensor.living_room_co2";
add("to-line", [
  t(CO2, { secondary: "Upstairs" }),
  t(CO2, { status: false }),
  t(CO2, { status: "{{ 'Open a window' }}" }),
  t(CO2, { show_value: false }),
  t(CO2, { show_name: false }),
  t(CO2, { icon: false }),
  t(CO2, { name: "{{ 'Air' }}", value: "{{ 'Fine' }}", status: false }),
  t("sensor.living_room_temperature", {
    rules: [{ above: 20, color: "orange", status: "Warm", tint_card: true }],
  }),
]);
add("to-icon", [
  t("sensor.living_room_humidity", { icon: { ring: true } }),
  t("sensor.living_room_humidity", { icon: { style: "plain" } }),
  t("sensor.wind_speed", { icon: "mdi:weather-windy" }),
  t(null, { name: "Malte", value: "Home", icon: { type: "image", src: "person.malte" } }),
  t("light.desk_lamp", { icon: { tap_action: { action: "toggle" } }, control: false }),
  t("media_player.living_room_speaker", { visual: false, icon: { type: "icon" } }),
]);
add("to-picture", [
  t("weather.home"),
  t("sun.sun"),
  t("sensor.solar_power", { kind: "solar" }),
  t("sensor.outdoor_temperature", { visual: "sparkline" }),
  t("sensor.power_consumption", { visual: "columns" }),
  t("binary_sensor.door_front", { visual: "strip" }),
  t("sensor.living_room_humidity", { visual: "bar" }),
  t("sensor.living_room_humidity", { visual: "gauge" }),
]);
add("to-controls", [
  t("light.living_room", { control: "slider" }),
  t("light.living_room", { visual: false }),
  t("light.living_room", { control: false }),
  t("cover.living_room_blinds", { control: "slider" }),
  t("fan.living_room", { control: "toggle" }),
  t("media_player.living_room_speaker", { visual: false, control: false }),
]);

// the controls' shape: rounded squares of one height, the stepper one bar; your own buttons grey
// until on, then tinted in their entity's colour (or their own)
const ROOM: Opts = {
  name: "Living room",
  icon: { name: "mdi:sofa-outline", style: "plain" },
  secondary: "{{ states('sensor.living_room_temperature') }} °C",
  control: {
    type: "buttons",
    options: [
      { entity: "cover.living_room_blinds" },
      { entity: "light.living_room" },
      { entity: "light.to_lamp_off" },
      { entity: "scene.dimmed", label: "Dim", color: "deep-purple" },
    ],
  },
  grid_options: { columns: 12 },
};
add(
  "to-controls-shapes",
  [
    t(null, ROOM),
    t("climate.living_room"),
    t("climate.office", { control: "segments" }),
    t("input_select.house_mode", { control: "select" }),
    t("script.check_windows", { control: "button" }),
    t("lock.front_door", { control: "hold" }),
    t("media_player.living_room_speaker", { visual: false }),
  ],
  { states: { "light.to_lamp_off": like("light.living_room", "off") } },
);
// a slider as a bar (the default) and as a line, under the line and at its end
const SLIDER = { visual: false, grid_options: { columns: 6 } };
add("to-slider", [
  t("light.living_room", { ...SLIDER, control: "slider" }),
  t("light.living_room", { ...SLIDER, control: { type: "slider", variant: "line" } }),
  t("cover.living_room_blinds", { ...SLIDER, control: { type: "slider", position: "end" } }),
  t("input_number.heating_boost", {
    ...SLIDER,
    control: { type: "slider", variant: "line", position: "end" },
  }),
]);

// vertical: the icon on top, the name and the line centred, the controls below; each at the
// columns it asks for
const v = (entity: string | null, o: Opts = {}) => t(entity, { vertical: true, ...o });
add("to-vertical", [
  v("sensor.living_room_temperature"),
  v("sensor.living_room_co2"),
  v("light.desk_lamp"),
  v("fan.living_room"),
  v("climate.living_room", { visual: false }),
  v("cover.living_room_blinds"),
  v("vacuum.robot"),
  v("media_player.living_room_speaker", { visual: false }),
  v("sensor.wind_speed"),
  v("weather.home"),
  v("lock.front_door"),
  v("person.malte", { visual: false }),
]);

// the status on the line, as the first badge with status_badge; badges at the end of the first row, always
// all of them (the name gives way); the badge on the icon (an action, a zone, unavailable)
const AIR = ["sensor.living_room_temperature", "sensor.living_room_humidity"];
add("to-badges", [
  t(CO2, { grid_options: { columns: 6 } }),
  t(CO2, { name: "CO₂", status_badge: true, grid_options: { columns: 6 } }),
  t(CO2, { badges: AIR, status_badge: true, grid_options: { columns: 12 } }),
  t(CO2, { badges: AIR, grid_options: { columns: 6 } }),
  t(CO2, {
    name: "Air",
    badges: [{ style: "filled", icon: "mdi:air-filter" }],
    grid_options: { columns: 6 },
  }),
  t("climate.living_room", {
    visual: false,
    name: "Heat",
    status_badge: true,
    grid_options: { columns: 6 },
  }),
  t(CO2, {
    name: "CO₂",
    vertical: true,
    status_badge: true,
    badges: ["sensor.living_room_temperature"],
    grid_options: { columns: 6 },
  }),
  t("person.malte", { visual: false, vertical: true }),
  t("light.shed", { grid_options: { columns: 6 } }),
  t("sensor.wind_speed", {
    name: "Wind",
    icon: { badge: { icon: "mdi:alert", color: "red" } },
    grid_options: { columns: 6 },
  }),
  t("climate.living_room", {
    visual: false,
    name: "Heat",
    icon: { badge: false },
    grid_options: { columns: 6 },
  }),
]);

// ----- sizes, widths and themes -----

// the sizes of the docs' sizes page: horizontal 12 × 1, 6 × 1 and 6 × 2, vertical 6 × 2, 6 × 3
// and 4 × 2; a type that asks for more room takes the sizes it is drawn at instead (a trend's two
// rows, a vertical tile's third row for a control, six columns for wide controls)
type Size = { grid_options: GridOptions; vertical?: boolean };
const h = (columns: number, rows: number): Size => ({ grid_options: { columns, rows } });
const vt = (columns: number, rows: number): Size => ({ ...h(columns, rows), vertical: true });
const ALL = [h(12, 1), h(6, 1), h(6, 2), vt(6, 2), vt(6, 3), vt(4, 2)];
const SWITCH = [h(12, 1), h(6, 1), h(6, 2), vt(6, 3), vt(4, 3)];
const WIDE = [h(12, 1), h(6, 1), h(6, 2), vt(6, 3)];
const SIZED: Record<string, [CardConfigBase, Size[]]> = {
  entity: [t("sensor.outdoor_temperature"), ALL],
  air: [t("sensor.living_room_co2"), ALL],
  battery: [
    t("sensor.battery_soc", { visual: false, inputs: { power: "sensor.battery_power" } }),
    ALL,
  ],
  weather: [t("weather.home", { visual: false }), ALL],
  sun: [t("sun.sun", { visual: false }), ALL],
  wind: [t("sensor.wind_speed"), ALL],
  rain: [t("sensor.rain_rate_roof"), ALL],
  trend: [
    t(null, {
      kind: "trend",
      name: "Temperatures",
      series: ["sensor.living_room_temperature", "sensor.outdoor_temperature"],
    }),
    [h(12, 2), h(6, 2), vt(6, 3), vt(4, 3)],
  ],
  light: [t("light.living_room"), SWITCH],
  fan: [t("fan.living_room"), WIDE],
  climate: [t("climate.living_room", { visual: false }), WIDE],
  lock: [t("lock.front_door"), ALL],
  alarm: [t("alarm_control_panel.home", { visual: false }), ALL],
  person: [t("person.malte", { visual: false }), ALL],
  media: [t("media_player.living_room_speaker", { visual: false }), WIDE],
  cover: [t("cover.office_blinds"), WIDE],
  vacuum: [t("vacuum.robot"), WIDE],
  grid: [t("sensor.grid_power", { kind: "grid" }), ALL],
  solar: [
    t("sensor.solar_power", {
      visual: false,
      kind: "solar",
      inputs: { today: "sensor.energy_today" },
    }),
    ALL,
  ],
  car: [t("sensor.ev_battery", { kind: "car" }), ALL],
  appliance: [t("sensor.washer_power", { kind: "washer" }), ALL],
};
for (const [name, [card, sizes]] of Object.entries(SIZED))
  add(
    `ts-${name}`,
    sizes.map((o) => ({ ...card, ...o })),
  );

// a vertical tile at its least, half a section and the whole, and given a second row
add("ts-vertical", [
  v("sensor.outdoor_temperature", { grid_options: { columns: 3, rows: "auto" } }),
  v("sensor.outdoor_temperature", { grid_options: { columns: 6, rows: "auto" } }),
  v("sensor.outdoor_temperature", { visual: "sparkline", grid_options: { columns: 3 } }),
  v("fan.living_room", { grid_options: { columns: 12, rows: "auto" } }),
  v("light.living_room", { control: "slider", grid_options: { columns: 6, rows: "auto" } }),
  v("light.living_room", { grid_options: { columns: 3, rows: 3 } }),
]);
add(
  "ts-vertical-phone",
  [
    v("sensor.living_room_co2"),
    v("light.living_room"),
    v("fan.living_room"),
    v("cover.living_room_blinds"),
    v("media_player.living_room_speaker", { visual: false }),
    v("vacuum.robot"),
  ],
  { width: 358 },
);

const FEW = [
  t("light.living_room"),
  t("climate.living_room", { visual: false }),
  t("media_player.living_room_speaker", { visual: false }),
  t("sensor.wind_speed"),
  t("vacuum.robot"),
  t("weather.home", { visual: false }),
];
// a phone 390 px wide: its section 358 px, half of it 175
add("ts-phone", FEW, { width: 358 });
add("ts-wide", FEW, { width: 760 });
add("ts-large-text", FEW, { skin: "large" });
add("ts-graphite", FEW, { skin: "graphite" });
add("ts-masonry", FEW, { layout: null });

shoot(cases);
