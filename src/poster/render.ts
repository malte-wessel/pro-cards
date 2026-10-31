// The poster card's own parts (DOM): the status badge (a badge row in the corner), the backdrop
// and the glow.
import type { EntityItem } from "../shared/entity/config.ts";
import type { EntityModel, RenderCtx } from "../shared/entity/model.ts";
import { fillBadge } from "../shared/entity/render/badge.ts";
import { div } from "../shared/kinds/dom.ts";

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

const imgEl = (src: string) => {
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  img.src = src;
  return img;
};
// a new picture (the next song's cover) fades in over the one before, once it has loaded; the
// one before goes when it is covered (at once without motion: .pin has no transition then)
const FADE_MS = 700;
const fadeIn = (back: HTMLElement, last: HTMLImageElement, next: HTMLImageElement) => {
  next.classList.add("pin");
  last.after(next);
  const drop = () => {
    for (const o of back.querySelectorAll(":scope > img")) if (o !== next) o.remove();
    next.classList.remove("pin", "on");
  };
  const show = () => {
    if (!next.isConnected) return;
    requestAnimationFrame(() => next.classList.add("on"));
    setTimeout(drop, FADE_MS + 50);
  };
  if (next.complete) show();
  else {
    next.addEventListener("load", show, { once: true });
    next.addEventListener("error", drop, { once: true });
  }
};

// the backdrop in the body (built once): an image under its scrim (blurred by `blur` px), else a
// kind's part (built once per key, so its animations keep running; returned for its update), else
// nothing. The glow
// (`visual: glow`) is built once and kept last: over a kind's drawing, under an image's scrim (the
// pback's ::after), so a new level fades rather than being drawn again
export const updateBackdrop = (
  body: HTMLElement,
  ctx: RenderCtx,
  url: string | null,
  part: { key: string; build: () => HTMLElement } | null,
  glow = false,
  blur = 0,
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
  back.classList.toggle("blur", !!url && blur > 0);
  if (url && blur > 0) back.style.setProperty("--pblur", `${blur}px`);
  else back.style.removeProperty("--pblur");
  // the backdrop's own content, before the glow
  const own = (el: HTMLElement | null) => {
    for (const c of [...(back as HTMLElement).children]) if (c !== lit) c.remove();
    if (el) (back as HTMLElement).prepend(el);
  };
  if (url) {
    delete back.dataset.key;
    const src = ctx.hass?.hassUrl ? ctx.hass.hassUrl(url) : url;
    const imgs = back.querySelectorAll<HTMLImageElement>(":scope > img");
    const img = imgs[imgs.length - 1] ?? null;
    if (!img) own(imgEl(src));
    else if (img.getAttribute("src") !== src) fadeIn(back, img, imgEl(src));
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
