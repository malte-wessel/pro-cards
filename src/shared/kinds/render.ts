// What a card that draws a poster type renders from its config (DOM-free helpers): the status
// text, a picture's URL, the glow's level.
import type { ValueSrc } from "../entity/config.ts";
import { isOn } from "../entity/control.ts";
import { asText, pictureOf } from "../entity/look.ts";
import { tplOf, type EntityModel, type RenderCtx } from "../entity/model.ts";
import type { ImageSrc } from "./config.ts";
import type { Kind, KindCtx } from "./types.ts";

// the status text: the card's, else the kind's, else the matching rule's label
export const statusText = (
  ctx: RenderCtx,
  cfg: { statusText: ValueSrc | null },
  m: EntityModel,
  kindStatus: string | null,
): string | null => {
  const own = cfg.statusText;
  if (own?.kind === "text") return own.text;
  if (own?.kind === "template") return asText(tplOf(ctx, own.template));
  return kindStatus ?? m.look.label;
};

// a picture's URL now (null: none)
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
