#!/usr/bin/env node
// The docs' demo home for the dev Home Assistant (`npm run ha`), written to test/ha/world/ (not
// committed): world.json for the pro_cards_world integration (test/ha/custom_components: every
// entity it can make, with its state, attributes and drift, the weather's forecasts, the energy
// meters' hourly readings, the camera's picture), package.yaml for what Home Assistant makes itself
// (helpers, scenes, the script, the group, the people with their trackers), dashboards.json for
// the setup (scripts/ha-setup.mjs: one dashboard per showcase page). Entities the dev config
// already has (test/ha/configuration.yaml) and the sun are left to it.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { world } from "../docs/.vitepress/theme/ha-shim/world.ts";
import { METERS, readingAt } from "../docs/.vitepress/theme/ha-shim/meters.ts";
import { GARDEN_SNAPSHOT } from "../docs/.vitepress/theme/ha-shim/camera.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "test/ha/world");
const HOUR = 3600e3,
  DAY = 86400e3;
// the meters' past hours imported as statistics, and how far ahead their readings go
const PAST_DAYS = 90,
  AHEAD_DAYS = 30;

// ----- the entities the dev config makes: their ids, as Home Assistant derives them -----
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
// (its `!include` read as the path it names)
const schema = yaml.DEFAULT_SCHEMA.extend([new yaml.Type("!include", { kind: "scalar" })]);
const config = yaml.load(readFileSync(join(root, "test/ha/configuration.yaml"), "utf8"), {
  schema,
}) as Record<string, unknown>;
const taken = new Set<string>();
for (const [domain, v] of Object.entries(config))
  if (domain.startsWith("input_") && v && typeof v === "object")
    for (const key of Object.keys(v)) taken.add(`${domain}.${key}`);
for (const block of (config.template as Record<string, { name?: string }[]>[] | undefined) ?? [])
  for (const [domain, items] of Object.entries(block))
    for (const item of Array.isArray(items) ? items : [])
      if (item.name) taken.add(`${domain}.${slug(item.name)}`);

// ----- what Home Assistant makes itself: the package -----
const PACKAGE_DOMAINS = new Set([
  "input_boolean",
  "input_number",
  "input_select",
  "input_button",
  "scene",
  "script",
  "group",
  "person",
  "counter",
  "timer",
]);
const pkg: Record<string, Record<string, unknown> | unknown[]> = {};
const add = (domain: string, key: string, value: Record<string, unknown>) =>
  (((pkg[domain] ??= {}) as Record<string, unknown>)[key] = value);
const people: unknown[] = [];
// a person's picture as a file Home Assistant serves (test/ha/world/www is /local/world): a data
// URI would be too large for the recorder
const www = join(out, "www");
const picture = (key: string, uri: string) => {
  const m = uri.match(/^data:image\/(\w+)[^,]*?(;base64)?,(.*)$/);
  if (!m) return uri;
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  mkdirSync(www, { recursive: true });
  writeFileSync(
    join(www, `${key}.${ext}`),
    m[2] ? Buffer.from(m[3], "base64") : decodeURIComponent(m[3]),
  );
  return `/local/world/${key}.${ext}`;
};

const entities: unknown[] = [];
for (const [id, st] of Object.entries(world.states)) {
  const [domain, key] = id.split(".");
  if (taken.has(id) || domain === "sun") continue;
  const a = st.attributes;
  const name = a.friendly_name as string | undefined;
  const icon = a.icon as string | undefined;
  if (!PACKAGE_DOMAINS.has(domain)) {
    const def = world.defs[id];
    entities.push({
      id,
      state: st.state,
      attributes: a,
      ...(def?.noise ? { noise: def.noise, min: def.min, max: def.max } : {}),
      ...(def ? { decimals: def.decimals } : {}),
    });
    continue;
  }
  const named = { name, ...(icon ? { icon } : {}) };
  if (domain === "input_boolean") add(domain, key, { ...named, initial: st.state === "on" });
  else if (domain === "input_number")
    add(domain, key, {
      ...named,
      min: a.min,
      max: a.max,
      step: a.step,
      unit_of_measurement: a.unit_of_measurement,
      initial: Number(st.state),
    });
  else if (domain === "input_select")
    add(domain, key, { ...named, options: a.options, initial: st.state });
  else if (domain === "input_button") add(domain, key, named);
  // a scene sets nothing (the docs' scenes are names); a script runs nothing
  else if (domain === "scene") ((pkg.scene ??= []) as unknown[]).push({ ...named, entities: {} });
  else if (domain === "script") add(domain, key, { alias: name, icon, sequence: [] });
  else if (domain === "group") add(domain, key, { ...named, entities: a.entity_id });
  else if (domain === "counter")
    add(domain, key, {
      ...named,
      initial: a.initial ?? Number(st.state),
      step: a.step,
      minimum: a.minimum,
      maximum: a.maximum,
    });
  // (its presets are the registry's: set them in the timer's more-info)
  else if (domain === "timer") add(domain, key, { ...named, duration: a.duration });
  // a person is home or away by a tracker the integration makes for them
  else if (domain === "person") {
    ((pkg.person ??= []) as unknown[]).push({
      id: key,
      name,
      ...(typeof a.entity_picture === "string" ? { picture: picture(key, a.entity_picture) } : {}),
      device_trackers: [`device_tracker.${key}_location`],
    });
    people.push({
      id: `device_tracker.${key}_location`,
      name: `${name} location`,
      state: st.state,
    });
  }
}

// ----- the weather's forecasts, the meters' readings, the camera -----
const now = Date.now();
const forecasts: Record<string, unknown> = {};
for (const id of Object.keys(world.states))
  if (id.startsWith("weather.") && !taken.has(id))
    forecasts[id] = { daily: world.forecast(id, "daily"), hourly: world.forecast(id, "hourly") };
const first = Math.floor(now / HOUR) * HOUR - PAST_DAYS * DAY;
const hours = (PAST_DAYS + AHEAD_DAYS) * 24;
const meters = Object.fromEntries(
  METERS.filter((m) => !taken.has(m.id)).map((m) => [
    m.id,
    {
      name: m.name,
      unit: m.unit,
      // the reading at the start of every hour from `first`
      readings: Array.from({ length: hours + 1 }, (_, i) =>
        Number(readingAt(m.id, first + i * HOUR).toFixed(4)),
      ),
    },
  ]),
);
const cameras = { "camera.garden": GARDEN_SNAPSHOT.replace(/^data:[^,]+,/, "") };

mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, "world.json"),
  JSON.stringify({ generated: now, entities, people, forecasts, first, meters, cameras }),
);
writeFileSync(
  join(out, "package.yaml"),
  `# generated by scripts/ha-world.ts from the docs' demo world\n${yaml.dump(pkg, { lineWidth: -1 })}`,
);

// ----- the showcase pages: their dashboard's YAML, the fence under the DashboardGrid -----
const pages = join(root, "docs/showcase");
const dashboards = readdirSync(pages)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const md = readFileSync(join(pages, f), "utf8");
    const fence = md.slice(md.indexOf("<DashboardGrid")).match(/```yaml\n([\s\S]*?)\n```/);
    const title = md.match(/^# (.+)$/m)?.[1] ?? basename(f, ".md");
    if (!fence) return null;
    const sections = (yaml.load(fence[1]) as Record<string, unknown>[]).map((s) => ({
      type: "grid",
      ...s,
    }));
    return {
      url_path: `showcase-${basename(f, ".md")}`,
      title: `Showcase: ${title.replace(/ dashboard$/i, "")}`,
      config: {
        title,
        views: [{ title, path: "main", type: "sections", max_columns: 4, sections }],
      },
    };
  })
  .filter(Boolean);
writeFileSync(join(out, "dashboards.json"), JSON.stringify(dashboards));

console.log(
  `world: ${entities.length} entities, ${Object.values(pkg).reduce((n, v) => n + Object.keys(v).length, 0)} in the package, ${Object.keys(meters).length} meters, ${dashboards.length} showcase dashboards (skipped ${taken.size} of the dev config)`,
);
