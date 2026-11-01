// Config of the poster card (pure): the raw YAML shape and the normalised one. The card is one
// entity (or none) drawn the way its poster type (its kind) says (src/shared/kinds/config.ts); its
// items are the poster itself, the status badge (a badge like the others, drawn as a tag) and the
// badges in its corner.
import { normalizeHistoryOptions, type Rule, type ValueSrc } from "../shared/entity/config.ts";
import type { HomeAssistant } from "../shared/ha.ts";
import {
  iconLookOf,
  isObj,
  kindConfigOf,
  normalizeCorner,
  normalizeKindItem,
  parseImage,
  type IconLook,
  type ImageSrc,
  type KindConfig,
  type RawKindCardConfig,
} from "../shared/kinds/config.ts";
import { CARD_TYPE } from "./constants.ts";

export interface RawPosterCardConfig extends RawKindCardConfig {
  status?: unknown;
  badges?: unknown;
  image?: unknown;
  image_blur?: unknown;
  image_opacity?: unknown;
  image_tint?: unknown;
}

export interface PosterConfig extends KindConfig {
  // the status badge's item (null: `status: false`) and its text as written (null: the kind's,
  // else the matching rule's label)
  statusIdx: number | null;
  statusText: ValueSrc | null;
  // the backdrop as written (false: none, not even the kind's; null: the kind's)
  image: ImageSrc | false | null;
  // the backdrop's blur in px as written (0: sharp; null: the kind's)
  imageBlur: number | null;
  // how much of the backdrop's picture shows through its shade, 0 to 1, and the shade's colour
  // (null: IMAGE_OPACITY, the card's surface)
  imageOpacity: number | null;
  imageTint: string | null;
  // what each of the card's rules changes of the icon and the backdrop, by rule
  ruleLooks: Map<Rule, RuleLook>;
  // `visual: glow`: the poster lit from below in its colour, as strong as its level
  glow: boolean;
}

// the blur of `image_blur: true`, in px
export const IMAGE_BLUR = 20;
// how much of a backdrop's picture shows through its shade by default
export const IMAGE_OPACITY = 0.3;

// what a matching rule changes of the poster's icon and backdrop; a key it leaves out is the card's
// (a key it writes wins over the card's: the card's is the default)
export interface RuleLook extends IconLook {
  image?: ImageSrc | false | null;
  imageBlur?: number;
  imageOpacity?: number;
  imageTint?: string;
}

export const parseImageOpacity = (v: unknown, key = "image_opacity"): number | null => {
  if (v === undefined || v === null) return null;
  if (typeof v === "number" && v >= 0 && v <= 1) return v;
  throw new Error(`${CARD_TYPE}: ${key} must be a number from 0 to 1`);
};

// a rule's own keys for the icon and the backdrop, as the card's are read
export const ruleLookOf = (src: Readonly<Record<string, unknown>> | undefined): RuleLook => {
  const out: RuleLook = iconLookOf(src);
  if (!src) return out;
  if (src.image !== undefined) out.image = parseImage(src.image);
  const blur = parseImageBlur(src.image_blur);
  if (blur !== null) out.imageBlur = blur;
  const opacity = parseImageOpacity(src.image_opacity, "a rule's image_opacity");
  if (opacity !== null) out.imageOpacity = opacity;
  if (typeof src.image_tint === "string" && src.image_tint) out.imageTint = src.image_tint;
  return out;
};
export const parseImageBlur = (v: unknown): number | null => {
  if (v === undefined || v === null) return null;
  if (v === true) return IMAGE_BLUR;
  if (v === false) return 0;
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  throw new Error(`${CARD_TYPE}: image_blur must be true, false or a number of px`);
};

export const normalizePosterConfig = (input: unknown, hass?: HomeAssistant): PosterConfig => {
  if (!isObj(input)) throw new Error(`${CARD_TYPE}: invalid config`);
  // `glow` and `none` draw no picture of the item's own (the glow is the card's, PosterCard._render)
  const visual = (input as RawPosterCardConfig).visual;
  const k = normalizeKindItem(
    input as RawPosterCardConfig,
    hass,
    CARD_TYPE,
    "poster card",
    visual === "glow" || visual === "none" ? { visual: "icon" } : {},
  );
  const raw = k.raw as RawPosterCardConfig;
  const { ctx, entities } = k;
  const main = entities[0];
  const glow = raw.visual === "glow";
  const { statusIdx, statusText, corner } = normalizeCorner(k, CARD_TYPE, "a poster's corner");

  return {
    layout: "poster",
    title: null,
    titleTap: null,
    icon: null,
    ...normalizeHistoryOptions(raw),
    columns: 1,
    ...ctx,
    type: CARD_TYPE,
    entities,
    groups: [
      {
        layout: "poster",
        idxs: [0],
        badgeIdxs: corner,
        align: "start",
        columns: 1,
        divider: false,
        visibility: null,
      },
    ],
    headerIdxs: [],
    hasHeader: false,
    ...kindConfigOf(k, main.rules),
    statusIdx,
    statusText,
    image: parseImage(raw.image),
    imageBlur: parseImageBlur(raw.image_blur),
    imageOpacity: parseImageOpacity(raw.image_opacity),
    imageTint: typeof raw.image_tint === "string" && raw.image_tint ? raw.image_tint : null,
    ruleLooks: new Map(main.rules.map((r) => [r, ruleLookOf(r.src)])),
    glow,
  };
};
