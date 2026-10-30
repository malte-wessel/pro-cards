// The poster card's own parts (DOM): the status badge (a badge row in the corner), the backdrop
// and the glow.
import type { EntityItem } from "../shared/entity/config.ts";
import { isOn } from "../shared/entity/control.ts";
import { tplOf, type EntityModel, type RenderCtx } from "../shared/entity/model.ts";
import { fillBadge } from "../shared/entity/render/badge.ts";
import { asText, pictureOf } from "../shared/entity/look.ts";
import { div } from "../shared/kinds/dom.ts";
import type { Kind, KindCtx } from "../shared/kinds/types.ts";
import type { ImageSrc, PosterConfig } from "./config.ts";

// the status text: the card's, else the kind's, else the matching rule's label
export const statusText = (
  ctx: RenderCtx,
  cfg: PosterConfig,
  m: EntityModel,
  kindStatus: string | null,
): string | null => {
  const own = cfg.statusText;
  if (own?.kind === "text") return own.text;
  if (own?.kind === "template") return asText(tplOf(ctx, own.template));
  return kindStatus ?? m.look.label;
};

// the status badge: a badge whose text is the status; with nothing to say it takes no room
export const fillStatus = (
  ctx: RenderCtx,
  el: HTMLElement,
  ent: EntityItem,
  idx: number,
  m: EntityModel,
  text: string | null,
) => {
  fillBadge(ctx, el, ent, idx, { ...m, look: { ...m.look, label: text || null } });
  el.classList.add("pstatus");
  el.classList.toggle("empty", !text);
};

// the backdrop's image now (null: none)
export const imageUrl = (ctx: RenderCtx, src: ImageSrc | false | null): string | null => {
  if (!src) return null;
  if (src.kind === "url") return src.url;
  if (src.kind === "template") return asText(tplOf(ctx, src.template));
  return pictureOf(ctx.hass?.states[src.entity]);
};

// how strong `visual: glow` lights the poster, 0 to 1: the kind's level (a light's brightness),
// else the value between min and max, else on or off
export const glowLevel = (kind: Kind, c: KindCtx): number => {
  const l = kind.level?.(c) ?? c.m.progress ?? (isOn(c.m.st) ? 1 : 0);
  return Math.min(1, Math.max(0, l));
};
// the glow's opacity for a level: from 0.3 up, nothing at 0 (a new level fades: .pglow's
// transition)
export const glowOpacity = (level: number) => (level > 0 ? (0.3 + 0.7 * level).toFixed(3) : "0");

// the backdrop in the body (built once): an image under its scrim, else a kind's part (built once
// per key, so its animations keep running; returned for its update), else nothing. The glow
// (`visual: glow`) is built once and kept last: over a kind's drawing, under an image's scrim (the
// pback's ::after), so a new level fades rather than being drawn again
export const updateBackdrop = (
  body: HTMLElement,
  ctx: RenderCtx,
  url: string | null,
  part: { key: string; build: () => HTMLElement } | null,
  glow = false,
): { part: HTMLElement | null; glow: HTMLElement | null } => {
  let back = body.querySelector<HTMLElement>(":scope > .pback");
  if (!back) {
    back = div("pback");
    body.prepend(back);
  }
  let lit = back.querySelector<HTMLElement>(":scope > .pglow");
  if (glow && !lit) lit = back.appendChild(div("pglow"));
  else if (!glow && lit) {
    lit.remove();
    lit = null;
  }
  back.hidden = !url && !part && !lit;
  back.classList.toggle("scrim", !!url);
  // the backdrop's own content, before the glow
  const own = (el: HTMLElement | null) => {
    for (const c of [...(back as HTMLElement).children]) if (c !== lit) c.remove();
    if (el) (back as HTMLElement).prepend(el);
  };
  if (url) {
    delete back.dataset.key;
    const src = ctx.hass?.hassUrl ? ctx.hass.hassUrl(url) : url;
    let img = back.querySelector(":scope > img") as HTMLImageElement | null;
    if (!img) {
      img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      own(img);
    }
    if (img.getAttribute("src") !== src) img.src = src;
    return { part: null, glow: lit };
  }
  if (!part) {
    delete back.dataset.key;
    own(null);
    return { part: null, glow: lit };
  }
  if (back.dataset.key !== part.key) {
    own(part.build());
    back.dataset.key = part.key;
  }
  const first = back.firstElementChild as HTMLElement | null;
  return { part: first === lit ? null : first, glow: lit };
};
