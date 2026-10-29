// The poster card's own parts (DOM): the poster row's skeleton without the label pill (the status
// is a badge row in the corner), the status badge, and the backdrop.
import type { EntityItem } from "../shared/entity/config.ts";
import { tplOf, type EntityModel, type RenderCtx } from "../shared/entity/model.ts";
import { fillBadge } from "../shared/entity/render/badge.ts";
import { asText, pictureOf } from "../shared/entity/look.ts";
import { posterParts } from "../shared/entity/render/lead.ts";
import type { ImageSrc, PosterConfig } from "./config.ts";

// the poster row's skeleton: the top line (lead, corner) and the body
export const posterCardParts = (row: HTMLElement) => {
  const parts = posterParts(row);
  parts.corner.querySelector(".plabel")?.remove();
  return parts;
};

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

// the backdrop in the body (built once): an image under its scrim, else a kind's part (built once
// per key, so its animations keep running; returned for its update), else nothing
export const updateBackdrop = (
  body: HTMLElement,
  ctx: RenderCtx,
  url: string | null,
  part: { key: string; build: () => HTMLElement } | null,
): HTMLElement | null => {
  let back = body.querySelector<HTMLElement>(":scope > .pback");
  if (!back) {
    back = document.createElement("div");
    back.className = "pback";
    body.prepend(back);
  }
  back.hidden = !url && !part;
  back.classList.toggle("scrim", !!url);
  if (url) {
    delete back.dataset.key;
    const src = ctx.hass?.hassUrl ? ctx.hass.hassUrl(url) : url;
    let img = back.querySelector(":scope > img") as HTMLImageElement | null;
    if (!img) {
      img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      back.replaceChildren(img);
    }
    if (img.getAttribute("src") !== src) img.src = src;
    return null;
  }
  if (!part) {
    delete back.dataset.key;
    back.replaceChildren();
    return null;
  }
  if (back.dataset.key !== part.key) {
    back.replaceChildren(part.build());
    back.dataset.key = part.key;
  }
  return back.firstElementChild as HTMLElement | null;
};
