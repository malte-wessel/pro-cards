// Pop-up Card Pro: a section of a dashboard as the pop-up's cards. The dashboard's config is
// fetched once per page and dashboard (`lovelace/config`, which any user may read), shared by
// every pop-up, and again when Home Assistant says the dashboard was saved (`lovelace_updated`).
// Finding the section in it is pure.
import type { CardConfigBase, HomeAssistant } from "../shared/ha.ts";

export interface SectionRef {
  dashboard: string | null; // its address ("lovelace" the default one); null: the pop-up's own
  view: string | number | null; // a view's path or index; null: the pop-up's view, else the first
  title: string | null; // the heading of the section
  index: number | null; // or its place among the view's sections, from 0
}

interface ViewConfig {
  path?: string;
  sections?: { title?: unknown; cards?: CardConfigBase[] }[];
}
interface DashboardConfig {
  views?: ViewConfig[];
  strategy?: unknown;
}

export type Found = { cards: CardConfigBase[] } | { error: "generated" | "missing" | "unreadable" };

// a heading card: Home Assistant's, or ours
export const isHeading = (c: CardConfigBase | undefined) =>
  c?.type === "heading" || c?.type === "custom:heading-card-pro";

// the text of a section's heading: its first heading card's
export const headingOf = (cards: CardConfigBase[] | undefined): string | null => {
  const h = (cards ?? []).find(isHeading);
  const text = h?.type === "heading" ? h.heading : h?.title;
  return typeof text === "string" ? text.trim() : null;
};

// the view a reference means: by path, else by index; none named, the pop-up's own (`here`, its
// path or index from the address) on its own dashboard, else the first
export const viewOf = (
  views: ViewConfig[],
  view: string | number | null,
  here: string | null,
): ViewConfig | undefined => {
  const pick = (v: string | number) =>
    views.find((x) => x.path !== undefined && String(x.path) === String(v)) ??
    (/^\d+$/.test(String(v)) ? views[Number(v)] : undefined);
  if (view !== null) return pick(view);
  return (here !== null ? pick(here) : undefined) ?? views[0];
};

export const POPUP_TYPE = "custom:popup-card-pro";
const isCard = (c: unknown): c is CardConfigBase =>
  !!c && typeof c === "object" && typeof (c as CardConfigBase).type === "string";

// a section's cards without the pop-ups among them, at any depth (a stack's too): a pop-up does
// nothing inside a pop-up, and one in the section it shows would show itself without end
export const withoutPopups = <T>(v: T): T => {
  if (Array.isArray(v))
    return v.filter((x) => !(isCard(x) && x.type === POPUP_TYPE)).map((x) => withoutPopups(x)) as T;
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, x && typeof x === "object" ? withoutPopups(x) : x]),
    ) as T;
  return v;
};

// a section's cards as Home Assistant draws it: one saved before the heading card (2024.3 to
// 2024.8) keeps its title on the section, drawn as a heading above its cards
const cardsOf = (s: { title?: unknown; cards?: CardConfigBase[] }): CardConfigBase[] => {
  const cards = (Array.isArray(s.cards) ? s.cards : []).filter(isCard);
  return typeof s.title === "string" && s.title.trim() && !cards.some(isHeading)
    ? [{ type: "heading", heading: s.title }, ...cards]
    : cards;
};

// the section `ref` names in a dashboard's config; `here` the view the page shows, where the
// section is on the dashboard the page shows (null on another)
export const findSection = (config: unknown, ref: SectionRef, here: string | null): Found => {
  const dash = config as DashboardConfig | null;
  if (!dash || typeof dash !== "object") return { error: "unreadable" };
  if (dash.strategy && !dash.views) return { error: "generated" };
  const view = viewOf(dash.views ?? [], ref.view, here);
  const sections = (view?.sections ?? []).map(cardsOf);
  const cards =
    ref.title !== null
      ? sections.find((c) => headingOf(c)?.toLowerCase() === ref.title!.toLowerCase())
      : ref.index !== null
        ? sections[ref.index]
        : undefined;
  return cards ? { cards: withoutPopups(cards) } : { error: "missing" };
};

export const DEFAULT_DASHBOARD = "lovelace";

// the dashboard and view the page shows: /<dashboard>/<view> (the default one's address is
// "lovelace"), as the config names them, not percent-encoded
export const pageDashboard = (path: string): { dashboard: string; view: string | null } => {
  const [, dashboard = "", view] = path.split("/").map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  return { dashboard: dashboard || DEFAULT_DASHBOARD, view: view || null };
};

// ---- the fetch, shared by the page's pop-ups

const configs = new Map<string, Promise<unknown>>();
const listeners = new Set<(dashboard: string) => void>();
let watching: HomeAssistant["connection"] | null = null;
// Home Assistant names the default dashboard with null
const urlPathOf = (dashboard: string) => (dashboard === DEFAULT_DASHBOARD ? null : dashboard);

// one subscription per connection: a dashboard saved is fetched again by whoever shows it
const watch = (hass: HomeAssistant) => {
  if (watching === hass.connection || !hass.connection?.subscribeMessage) return;
  watching = hass.connection;
  hass.connection
    .subscribeMessage<{ data?: { url_path?: string | null } }>(
      (ev) => {
        const dashboard = ev?.data?.url_path || DEFAULT_DASHBOARD;
        configs.delete(dashboard);
        for (const fn of listeners) fn(dashboard);
      },
      { type: "subscribe_events", event_type: "lovelace_updated" },
    )
    .catch(() => {
      watching = null;
    });
};

// the dashboard's config by its address; null where it has none (no such dashboard, or the
// default one while Home Assistant generates it), kept until a dashboard is saved. Any other
// failure (the connection lost) rejects and is asked again next time.
export const dashboardConfig = (hass: HomeAssistant, dashboard: string): Promise<unknown> => {
  watch(hass);
  let p = configs.get(dashboard);
  if (!p) {
    p = hass
      .callWS<unknown>({ type: "lovelace/config", url_path: urlPathOf(dashboard), force: false })
      .catch((e: { code?: string }) => {
        if (e?.code === "config_not_found") return null;
        configs.delete(dashboard);
        throw e;
      });
    configs.set(dashboard, p);
  }
  return p;
};

// called with the dashboard's address when it was saved; returns the unsubscribe
export const onDashboardSaved = (fn: (dashboard: string) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
