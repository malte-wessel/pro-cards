// The current conditions: the hero lead (condition icon, big temperature, high / low), the
// tile (icon, name, "temperature · condition") and the poster (icon and condition on top, name,
// big temperature, high / low and the next hours' curve at the bottom).
import { cssColor } from "../../shared/color.ts";
import type { EntityItem } from "../../shared/entity/config.ts";
import { nameOf, tplOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
import { plotEl } from "../../shared/entity/render/blocks.ts";
import { bigEl, leadEl, secondaryEl, textEl } from "../../shared/entity/render/lead.ts";
import type { Point } from "../../shared/history.ts";
import { fmtNumber } from "../../shared/format.ts";
import type { WeatherConfig, WeatherIcons } from "../config.ts";
import { conditionIcon, conditionText, isCondition, isNight } from "../conditions.ts";
import { conditionEl, iconFor, isImageIcon } from "./icon.ts";
import type { Day } from "../forecast.ts";

export interface CurrentModel {
  cond: EntityModel;
  temp: EntityModel;
  today: Day | null;
  iconSize: number;
  icons: WeatherIcons;
}

// the condition colour: explicit, else the matching rule, else primary. Home Assistant's state
// colour for the weather domain is one colour for every condition, so it is not used here.
export const condColor = (ent: EntityItem, m: EntityModel): string =>
  !m.model.avail || ent.color ? m.look.color : (m.look.rule?.color ?? "primary");

// the model with the condition icon: a rule icon, else the `icons` map's (any icon set; an
// image is drawn by conditionEl instead), else the condition's own, its night variant while the
// sun is down. Named, never left to the entity's state icon, which knows no night.
const withIcon = (ctx: RenderCtx, icons: WeatherIcons, m: EntityModel): EntityModel => {
  const state = m.st?.state;
  const mapped = iconFor(icons, state);
  const own = isCondition(state) ? conditionIcon(state, isNight(ctx.hass)) : null;
  return {
    ...m,
    look: {
      ...m.look,
      icon: m.look.icon ?? (mapped && !isImageIcon(mapped) ? mapped : own),
      fallbackIcon: conditionIcon(state, isNight(ctx.hass)),
    },
  };
};

const condText = (ctx: RenderCtx, m: EntityModel) =>
  m.model.avail ? conditionText(ctx.hass, m.st?.state) : (m.look.label ?? "");

// "14° / 9°" from today's forecast
export const hiLoText = (ctx: RenderCtx, today: Day | null) => {
  if (!today || today.hi === null || today.lo === null) return null;
  return `${fmtNumber(ctx.hass, today.hi, 0)}° / ${fmtNumber(ctx.hass, today.lo, 0)}°`;
};

// the row's own item (the card's condition item, or a hero section's) and the temperature's colour
// for what shows it (the condition's is the row's --fe-color: the card's _rowColor)
const startRow = (row: HTMLElement, cfg: WeatherConfig, cm: CurrentModel) => {
  const ent = cfg.entities[Number(row.dataset.idx)] ?? cfg.entities[cfg.condIdx];
  row.style.setProperty("--fe-temp", cssColor(cm.temp.look.color, "var(--primary-color)"));
  return ent;
};
// the condition's lead: its icon in the soft circle; a picture or an image replaces the icon and
// stands alone, without the circle
const condLead = (ctx: RenderCtx, ent: EntityItem, cm: CurrentModel) => {
  const lead = leadEl(ctx, ent, withIcon(ctx, cm.icons, cm.cond), cm.iconSize);
  if (cm.cond.model.avail) {
    const icon = conditionEl(cm.icons, cm.cond.st?.state, isNight(ctx.hass), cm.cond.look.icon);
    if (icon.tagName !== "HA-ICON") {
      lead.classList.add("picture");
      const shape = lead.querySelector(".shape");
      shape?.replaceChildren(icon);
    }
  }
  return lead;
};

export const fillCurrent = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: WeatherConfig,
  cm: CurrentModel,
  isTile: boolean,
) => {
  row.replaceChildren();
  const ent = startRow(row, cfg, cm);
  const top = document.createElement("div");
  top.className = "top";
  top.appendChild(condLead(ctx, ent, cm));
  const main = document.createElement("div");
  main.className = "main";
  const line = document.createElement("div");
  line.className = "line";
  const texts = document.createElement("div");
  texts.className = "texts";
  const name = tplOf(ctx, ent.name);
  const sec = tplOf(ctx, ent.secondary);
  const condition = condText(ctx, cm.cond);
  if (isTile) {
    texts.appendChild(textEl("primary", nameOf(ctx, ent, cm.cond.st)));
    const parts: { text: string }[] = [];
    if (sec) parts.push({ text: sec });
    else if (!cm.cond.model.avail) parts.push({ text: condition });
    else {
      parts.push({ text: cm.temp.fmt.text }, { text: condition });
      if (cm.cond.look.label) parts.push({ text: cm.cond.look.label });
    }
    texts.appendChild(secondaryEl(parts));
  } else {
    texts.appendChild(textEl("primary", name || condition));
    texts.appendChild(bigEl(cm.temp.fmt));
    const parts: { text: string; accent?: boolean }[] = [];
    if (sec) parts.push({ text: sec });
    else if (!cm.cond.model.avail) parts.push({ text: condition });
    else {
      if (name) parts.push({ text: condition });
      if (cm.cond.look.label) parts.push({ text: cm.cond.look.label });
      if (cm.temp.look.label) parts.push({ text: cm.temp.look.label, accent: true });
      const hiLo = hiLoText(ctx, cm.today);
      if (hiLo) parts.push({ text: hiLo });
    }
    if (parts.length) texts.appendChild(secondaryEl(parts));
  }
  line.appendChild(texts);
  main.appendChild(line);
  top.appendChild(main);
  row.appendChild(top);
};

// a poster (its skeleton is the entity poster's, base: _poster): the condition's lead and, in the
// pill, the matching rule's label or the condition; at the bottom the name, the big temperature,
// its label and today's high / low, and the next hours of the forecast's temperature as the curve
// along the bottom edge (its tooltip reads the temperature item)
export const fillPoster = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: WeatherConfig,
  cm: CurrentModel,
  hours: Point[],
) => {
  const lead = row.querySelector<HTMLElement>(":scope > .ptop > .plead"),
    label = row.querySelector<HTMLElement>(":scope > .ptop > .corner > .plabel"),
    body = row.querySelector<HTMLElement>(":scope > .pbody");
  if (!lead || !label || !body) return;
  const ent = startRow(row, cfg, cm);
  lead.replaceChildren(condLead(ctx, ent, cm));
  const pill = cm.cond.look.label ?? condText(ctx, cm.cond);
  label.textContent = pill;
  label.hidden = !pill;
  body.replaceChildren();
  body.appendChild(textEl("pname", nameOf(ctx, ent, cm.cond.st)));
  const value = document.createElement("div");
  value.className = "pvalue";
  value.appendChild(bigEl(cm.temp.fmt));
  body.appendChild(value);
  const sec = tplOf(ctx, ent.secondary);
  const parts: { text: string; accent?: boolean }[] = [];
  if (sec) parts.push({ text: sec });
  else {
    if (cm.temp.look.label) parts.push({ text: cm.temp.look.label, accent: true });
    const hiLo = hiLoText(ctx, cm.today);
    if (hiLo) parts.push({ text: hiLo });
  }
  if (parts.length) body.appendChild(secondaryEl(parts));
  if (hours.length > 1) {
    const plot = plotEl(ctx, cfg.entities[cfg.tempIdx], cfg.tempIdx, cm.temp, {
      kind: "sparkline",
      series: hours,
      window: { t0: hours[0].t, t1: hours[hours.length - 1].t },
      loaded: true,
    });
    plot.classList.add("ptrend");
    body.appendChild(plot);
  }
};
