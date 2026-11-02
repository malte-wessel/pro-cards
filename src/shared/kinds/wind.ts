// The wind kind: a wind speed sensor, or a weather entity's wind. The animation (`flow`, in its
// style) turns where the wind blows and runs at its speed, in the icon (its default) or behind the
// whole card, with the direction's arrow in the icon then (the animation is drawn in one place). Direction and gusts are found on the speed sensor's device, or are
// the weather entity's attributes.
import { buildBand, builtLead, setRate } from "../flow/dom.ts";
import { secondaryEl } from "../entity/render/lead.ts";
import { t } from "../i18n.ts";
import { oneOf } from "../util.ts";
import { DENSITIES, FLOW_STYLES } from "../wind/constants.ts";
import { fieldEl, setAngles, updateBand } from "../wind/field.ts";
import { leadDuration, pxps } from "../wind/flow.ts";
import { animatedLead, arrowIcon, arrowLead } from "../wind/lead.ts";
import { windNow } from "../wind/now.ts";
import { WIND_RULES } from "./rules.ts";
import type { Kind, KindCtx } from "./types.ts";

// the animation's style in a place (null: the place draws no flow)
const flowIn = (p: { type?: string; style?: unknown } | false) =>
  p && p.type === "flow" ? (oneOf(FLOW_STYLES, p.style) ? p.style : "dots") : null;
const nowOf = (c: KindCtx) =>
  windNow(c.ctx, { ent: c.ent, m: c.m }, c.input("direction"), c.input("gust"));

export const WIND: Kind = {
  name: "wind",
  deviceClasses: ["wind_speed"],
  reads: ["sensor", "weather", "input_number", "number"],
  readsText: "a wind_speed sensor or a weather entity (wind_speed, wind_bearing, wind_gust_speed)",
  keys: ["direction", "gust"],
  rules: WIND_RULES,
  icon: { type: "flow", style: "dots" },
  draws: ["flow"],
  ruleUnit: "km/h",
  main: (entity) => (entity?.startsWith("weather.") ? { attribute: "wind_speed" } : {}),
  inputs: [
    {
      key: "direction",
      find: { domains: ["sensor"], deviceClasses: ["wind_direction"], unit: "°" },
      weather: "wind_bearing",
    },
    {
      key: "gust",
      find: {
        domains: ["sensor"],
        deviceClasses: ["wind_speed"],
        translationKey: /gust/i,
        needsKey: true,
      },
      weather: "wind_gust_speed",
    },
  ],
  // where the wind comes from and its gusts
  slots: (c) => {
    const now = nowOf(c),
      gust = c.input("gust");
    const parts: { text: string }[] = [];
    if (now.dirText) parts.push({ text: t(c.ctx.hass, "wind.from", { dir: now.dirText }) });
    if (gust && gust.m.model.avail)
      parts.push({ text: t(c.ctx.hass, "wind.gusts", { v: gust.m.fmt.text }) });
    if (!parts.length && !c.input("direction") && !gust) return {};
    return { secondary: parts.length ? secondaryEl(parts) : null };
  },
  lead: {
    key: (c) => flowIn(c.place.icon) ?? "arrow",
    build: (c) => {
      const style = flowIn(c.place.icon);
      return style
        ? animatedLead(style, c.leadSize)
        : arrowLead(c.leadSize, c.place.icon.style === "plain" ? "plain" : "circle");
    },
    // the row turns the lead (--rot, --arrow) and times it (--ldur); a new speed scales its rate
    update: (el, c, row) => {
      const now = nowOf(c),
        px = pxps(now.kmh);
      setAngles(row, now.bearing);
      row.classList.toggle("nodir", now.bearing === null);
      const built = builtLead(row, "px", px, leadDuration(px));
      setRate(el, px / built);
    },
  },
  backdrop: {
    key: (c) => flowIn(c.place.visual) ?? "",
    build: () => buildBand("bg", arrowIcon(), fieldEl()),
    update: (el, c) => {
      const now = nowOf(c);
      updateBand(el, {
        style: flowIn(c.place.visual) ?? "dots",
        density: DENSITIES[1],
        bearing: now.bearing,
        kmh: now.kmh,
        gustKmh: now.gustKmh,
        chip: now.chip,
      });
    },
  },
};
