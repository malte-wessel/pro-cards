// The current conditions: the hero lead (condition icon, big temperature, high / low) and the
// tile (icon, name, "temperature · condition").
import { cssColor } from "../../shared/color.ts";
import type { EntityItem } from "../../shared/entity/config.ts";
import { nameOf, tplOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
import { bigEl, leadEl, textEl } from "../../shared/entity/render/lead.ts";
import { fmtNumber } from "../../shared/format.ts";
import type { WeatherConfig } from "../config.ts";
import { conditionIcon, conditionText, isNight } from "../conditions.ts";
import type { Day } from "../forecast.ts";

export interface CurrentModel {
  cond: EntityModel;
  temp: EntityModel;
  today: Day | null;
}

// the condition colour: explicit, else the matching rule, else primary. Home Assistant's state
// colour for the weather domain is one colour for every condition, so it is not used here.
export const condColor = (ent: EntityItem, m: EntityModel): string =>
  !m.model.avail || ent.color ? m.look.color : (m.look.rule?.color ?? "primary");

// the model with the condition icon as fallback (a rule icon still wins)
const withIcon = (ctx: RenderCtx, m: EntityModel): EntityModel => ({
  ...m,
  look: { ...m.look, fallbackIcon: conditionIcon(m.st?.state, isNight(ctx.hass)) },
});

const condText = (ctx: RenderCtx, m: EntityModel) =>
  m.model.avail ? conditionText(ctx.hass, m.st?.state) : (m.look.label ?? "");

// "14° / 9°" from today's forecast
export const hiLoText = (ctx: RenderCtx, today: Day | null) => {
  if (!today || today.hi === null || today.lo === null) return null;
  return `${fmtNumber(ctx.hass, today.hi, 0)}° / ${fmtNumber(ctx.hass, today.lo, 0)}°`;
};

// secondary line: parts joined by " · ", the temperature label in the temperature colour
const secondaryEl = (parts: { text: string; accent?: boolean }[]) => {
  const el = document.createElement("div");
  el.className = "secondary";
  parts.forEach((p, i) => {
    if (i > 0) el.appendChild(document.createTextNode(" · "));
    if (p.accent) {
      const s = document.createElement("span");
      s.className = "accent";
      s.textContent = p.text;
      el.appendChild(s);
    } else el.appendChild(document.createTextNode(p.text));
  });
  return el;
};

export const fillCurrent = (
  ctx: RenderCtx,
  row: HTMLElement,
  cfg: WeatherConfig,
  cm: CurrentModel,
  isTile: boolean,
) => {
  // the row's own item: the card's condition item, or a hero section's
  const ent = cfg.entities[Number(row.dataset.idx)] ?? cfg.entities[cfg.condIdx];
  row.replaceChildren();
  row.style.setProperty("--fe-color", cssColor(condColor(ent, cm.cond), "var(--primary-color)"));
  row.style.setProperty("--fe-temp", cssColor(cm.temp.look.color, "var(--primary-color)"));
  const top = document.createElement("div");
  top.className = "top";
  top.appendChild(leadEl(ctx, ent, withIcon(ctx, cm.cond), isTile ? 40 : 56));
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
