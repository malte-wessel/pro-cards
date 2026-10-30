// The showcases' dashboards as Home Assistant's sections view lays them out on a phone, a tablet
// and a desktop: how the cards fit the columns a screen gives them, and one another. Each runs in
// the visual-phone, visual-tablet and visual-desktop projects (playwright.config.ts: the device's
// viewport, touch and mobile), named `vp-<dashboard>-<device>`. A dashboard is the YAML under its
// page's <DashboardGrid>.
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import type { ViewSection } from "../harness/harness.ts";
import { shoot, type Shot } from "./shoot.ts";

const DASHBOARDS = ["home", "living-room", "posters", "weather", "energy"];

const sectionsOf = (page: string): ViewSection[] => {
  const md = readFileSync(`docs/showcase/${page}.md`, "utf8");
  const m = md.match(/<DashboardGrid[^>]*>[\s\S]*?```yaml\n([\s\S]*?)```/);
  if (!m) throw new Error(`no dashboard on docs/showcase/${page}.md`);
  return yaml.load(m[1]) as ViewSection[];
};

const cases: Record<string, Shot> = {};
for (const page of DASHBOARDS) cases[`vp-${page}`] = { sections: sectionsOf(page) };

shoot(cases);
