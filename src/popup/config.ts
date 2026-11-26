// Pop-up Card Pro: config types and normalization (pure). The card opens when the address ends in
// its `hash` (`#kitchen`): any card's navigate action to "#kitchen" opens it. Its header is a
// heading card made of its title, subtitle, icon and badges; its cards sit in Home Assistant's
// section grid.
import { checks, isObj } from "../shared/cards/checks.ts";
import type { CardConfigBase } from "../shared/ha.ts";
import { normalizeVisibility, type Visibility } from "../shared/visibility.ts";

export const CARD_TYPE = "popup-card-pro";
export const HEADING_TYPE = "custom:heading-card-pro";
// how wide the dialog is on a wide screen (a phone always gets the sheet across its width)
export const WIDTHS = ["normal", "wide", "full"] as const;
export type PopupWidth = (typeof WIDTHS)[number];
// how tall it opens: its cards' height (a sheet can be dragged up to the full height), or the full
export const HEIGHTS = ["auto", "full"] as const;
export type PopupHeight = (typeof HEIGHTS)[number];

export interface PopupConfig {
  hash: string;
  width: PopupWidth;
  height: PopupHeight;
  // the header's heading card, null without a title, subtitle, icon or badges
  header: CardConfigBase | null;
  cards: CardConfigBase[];
  // Home Assistant's `visibility` of the card: while it does not hold, the pop-up does not open
  visibility: Visibility;
}

const HEADER_KEYS = ["title", "subtitle", "icon", "badges"] as const;
const HASH = /^[A-Za-z0-9_-]+$/;

const { err, pickOf, cardList } = checks(CARD_TYPE);

// the hash as written, without its # ("#kitchen" and "kitchen" are the same pop-up)
export const parseHash = (v: unknown): string => {
  if (typeof v !== "string" || !v)
    throw err("'hash' is required: the address part that opens the pop-up, e.g. hash: kitchen");
  const h = v.startsWith("#") ? v.slice(1) : v;
  if (!HASH.test(h))
    throw err(`'hash' may hold letters, digits, - and _ only (kitchen, living-room), not '${v}'`);
  return h;
};

// the card's `visibility` as the pop-up checks it before opening; one it cannot read (a condition
// of a newer Home Assistant) does not stop it opening, which the console says
const visibilityOf = (raw: unknown): Visibility => {
  try {
    return normalizeVisibility(raw, { type: CARD_TYPE, label: "card", entity: null });
  } catch (e) {
    console.warn(`${CARD_TYPE}: its visibility does not decide whether it opens:`, e);
    return null;
  }
};

export const normalizePopupConfig = (raw: unknown): PopupConfig => {
  if (!isObj(raw)) throw err("the config must be an object");
  const head: Record<string, unknown> = {};
  for (const k of HEADER_KEYS) if (raw[k] !== undefined && raw[k] !== null) head[k] = raw[k];
  for (const k of ["title", "subtitle"] as const)
    if (head[k] !== undefined && typeof head[k] !== "string") throw err(`'${k}' must be text`);
  if (head.badges !== undefined && !Array.isArray(head.badges))
    throw err("'badges' must be a list, as on the heading card");
  return {
    hash: parseHash(raw.hash),
    width: raw.width === undefined ? "normal" : pickOf(WIDTHS, raw.width, "width"),
    height: raw.height === undefined ? "auto" : pickOf(HEIGHTS, raw.height, "height"),
    header: Object.keys(head).length ? { type: HEADING_TYPE, style: "title", ...head } : null,
    cards: cardList(raw.cards),
    visibility: visibilityOf(raw.visibility),
  };
};
