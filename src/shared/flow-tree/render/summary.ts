// The summary line above the tree: "Home · 1.85 kW", then the card's parts (the power card: the
// state – importing, exporting, on battery, balanced, grid offline, expensive – with the
// self-sufficiency), and the home rule's label as a pill. Built once; every render updates the
// texts and the state colour.
import type { EntityItem } from "../../entity/config.ts";
import type { Look } from "../../entity/look.ts";
import { nameOf, type EntityModel, type RenderCtx } from "../../entity/model.ts";
import { fillSecondary, pillEl, textEl } from "../../entity/render/lead.ts";
import { t } from "../../i18n.ts";
import { fmtNumber } from "../../format.ts";
import type { HomeAssistant } from "../../ha.ts";
import type { Flows } from "../model.ts";

// what the card says on the secondary line: its parts (the first in the state colour) and that
// colour; `tint` tints the whole card red (grid offline, expensive)
export interface Summary {
  parts: { text: string; accent: boolean }[];
  color: string;
  tint: boolean;
}

// "self-sufficient 72 %" of the flows, none while the home takes nothing
export const selfSufficiencyPart = (hass: HomeAssistant | undefined, f: Flows) =>
  f.selfSufficiency === null
    ? []
    : [
        {
          text: t(hass, "power.self_sufficient", {
            pct: `${fmtNumber(hass, Math.round(f.selfSufficiency * 100), 0)} %`,
          }),
          accent: false,
        },
      ];

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
  value: string,
  summary: Summary,
) => {
  const primary = el.querySelector<HTMLElement>(".primary");
  if (primary) primary.textContent = `${nameOf(ctx, home.ent, home.m.st)} · ${value}`;
  const secondary = el.querySelector<HTMLElement>(".secondary");
  if (secondary) fillSecondary(secondary, summary.parts);
  el.style.setProperty("--fe-color", summary.color);
  let pill = el.querySelector<HTMLElement>(".pill");
  if (home.look.label) {
    if (!pill) pill = el.appendChild(pillEl(""));
    pill.textContent = home.look.label;
    pill.style.setProperty("--fe-color", home.look.color);
    pill.style.setProperty("--fe-soft", `color-mix(in srgb, ${home.look.color} 20%, transparent)`);
  } else pill?.remove();
};
