// What a card that draws a kind puts behind its texts (DOM), the poster's and the tile's alike:
// the visual's picture under its scrim, the kind's drawing (its flow, cover, path or line), or its
// glow (the kind's own, or the card's colour from its bottom edge). One layer, built once in the
// card's body and kept: a new picture fades in, a drawing is rebuilt only when its key changes.
import type { RenderCtx } from "../entity/model.ts";
import { div } from "./dom.ts";

// how much of a picture behind the card shows through its scrim by default
export const IMAGE_OPACITY = 0.3;

// the poster's colour and the layer's shade as typed values, so they can fade (once per page;
// another copy of the bundle has done it)
for (const [name, syntax, initialValue] of [
  ["--pc-tint", "<color>", "transparent"],
  ["--pc-shade", "<number>", "0.7"],
  ["--pc-shade-color", "<color>", "transparent"],
]) {
  try {
    CSS.registerProperty({ name, syntax, inherits: true, initialValue });
  } catch {
    // registered already, or no CSS Properties API: the value changes at once
  }
}

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
  // the pictures under it go (one that came after it fades in on its own: pictures changing
  // faster than a fade never leave the layer empty)
  const drop = () => {
    if (!next.isConnected) return;
    for (const o of back.querySelectorAll(":scope > img")) {
      if (o === next) break;
      o.remove();
    }
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
    // a picture that fails leaves the one before
    next.addEventListener("error", () => next.remove(), { once: true });
  }
};

// the layer in the body (built once): an image under its scrim (blurred by `blur` px), else a
// kind's part (built once per key, so its animations keep running; returned for its update), else
// nothing. The card's glow is built once and kept last: over a kind's drawing, under an image's
// scrim (the pback's ::after), so a new level fades rather than being drawn again
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
