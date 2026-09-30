// The summary line above the tree: "Home · 1.85 kW", then the state (importing, exporting, on
// battery, balanced, grid offline, expensive) with the self-sufficiency, and the home rule's label
// as a pill. Built once; every render updates the texts and the state colour.
import type { EntityItem } from "../../shared/entity/config.ts";
import type { Look } from "../../shared/entity/look.ts";
import { nameOf, type EntityModel, type RenderCtx } from "../../shared/entity/model.ts";
import { fillSecondary, pillEl, textEl } from "../../shared/entity/render/lead.ts";
import { t } from "../../shared/i18n.ts";
import { fmtNumber } from "../../shared/format.ts";
import { fmtPower, type Flows, type PowerNow, type SummaryState } from "../model.ts";

export const buildSummary = () => {
  const el = document.createElement("div");
  el.className = "psummary line";
  const texts = document.createElement("div");
  texts.className = "texts";
  texts.appendChild(textEl("primary", ""));
  texts.appendChild(textEl("secondary", ""));
  el.appendChild(texts);
  return el;
};

export const updateSummary = (
  el: HTMLElement,
  ctx: RenderCtx,
  home: { ent: EntityItem; m: EntityModel; look: Look },
  now: PowerNow,
  flows: Flows,
  state: SummaryState,
) => {
  const hass = ctx.hass;
  const primary = el.querySelector<HTMLElement>(".primary");
  if (primary)
    primary.textContent = `${nameOf(ctx, home.ent, home.m.st)} · ${fmtPower(hass, flows.H)}`;
  const vars: Record<string, string> = {
    v: fmtPower(hass, state.w),
    price: now.price?.text ?? "",
  };
  const parts = [{ text: t(hass, state.key, vars), accent: true }];
  if (flows.selfSufficiency !== null)
    parts.push({
      text: t(hass, "power.self_sufficient", {
        pct: `${fmtNumber(hass, Math.round(flows.selfSufficiency * 100), 0)} %`,
      }),
      accent: false,
    });
  const secondary = el.querySelector<HTMLElement>(".secondary");
  if (secondary) fillSecondary(secondary, parts);
  el.style.setProperty("--fe-color", state.color);
  let pill = el.querySelector<HTMLElement>(".pill");
  if (home.look.label) {
    if (!pill) pill = el.appendChild(pillEl(""));
    pill.textContent = home.look.label;
    pill.style.setProperty("--fe-color", home.look.color);
    pill.style.setProperty("--fe-soft", `color-mix(in srgb, ${home.look.color} 20%, transparent)`);
  } else pill?.remove();
};
