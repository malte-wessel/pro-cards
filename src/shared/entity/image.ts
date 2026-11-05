// A picture as a card writes it (pure): an image URL, a template that renders one, or an entity
// whose picture it shows (a camera's snapshot, a media player's art, a person's photo). The
// poster's and the tile's places read it, and a badge's icon.
import { isTemplate } from "../util.ts";
import { asText, pictureOf, type TplGet } from "./look.ts";
import type { HassEntities } from "../ha.ts";

export type ImageSrc =
  | { kind: "url"; url: string }
  | { kind: "template"; template: string }
  | { kind: "entity"; entity: string };

const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;
// a file name looks like an entity id (garden.jpg): it is a picture's URL
const IMAGE_FILE = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

export const parseImage = (v: unknown): ImageSrc | false | null => {
  if (v === false) return false;
  if (typeof v !== "string" || !v) return null;
  if (isTemplate(v)) return { kind: "template", template: v };
  if (ENTITY_ID.test(v) && !IMAGE_FILE.test(v)) return { kind: "entity", entity: v };
  return { kind: "url", url: v };
};

// the picture's URL now (null: none yet, or none at all)
export const imageSrcUrl = (
  src: ImageSrc | false | null,
  states: HassEntities | undefined,
  tplGet: TplGet,
): string | null => {
  if (!src) return null;
  if (src.kind === "url") return src.url;
  if (src.kind === "template") return asText(tplGet(src.template));
  return pictureOf(states?.[src.entity]);
};
