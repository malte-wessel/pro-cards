/*
 * popup-card-pro
 * Any cards in a pop-up that opens when the address ends in its hash: a sheet from the bottom on a
 * phone, dragged down to close, a dialog in the middle on a wide screen. Any card's navigate action
 * to "#kitchen" opens the pop-up with `hash: kitchen`; closing it goes back, as the back button
 * does. While closed it takes no room on the dashboard; in edit mode it shows inline with an Open
 * button. Its header is a heading card of its title, subtitle, icon and badges; its cards sit in
 * Home Assistant's section grid. Every child is a Home Assistant <hui-card>.
 *
 * Config (see docs/cards/popup-card.md):
 *   type: custom:popup-card-pro
 *   hash: kitchen
 *   title: Kitchen
 *   icon: mdi:countertops
 *   badges:
 *     - entity: sensor.kitchen_temperature
 *   width: normal                  # normal | wide | full (a wide screen; a phone gets the sheet)
 *   height: auto                   # auto: its cards' height (dragged up for more) | full
 *   cards:
 *     - type: custom:tile-card-pro
 *       entity: light.kitchen
 */
import { defineElement, fireHaptic, registerCard } from "./shared/card.ts";
import { applyStyle, CardsBase, placeNodes } from "./shared/cards/base.ts";
import { childKey, createHuiCard } from "./shared/cards/children.ts";
import { themeGap } from "./shared/cards/units.ts";
import { langOf } from "./shared/format.ts";
import type { CardConfigBase, HomeAssistant, HuiCardElement } from "./shared/ha.ts";
import { t } from "./shared/i18n.ts";
import { TemplateSubscriptions } from "./shared/templates.ts";
import { checkVisibility, visibilityDeps } from "./shared/visibility.ts";
import { CARD_TYPE, normalizePopupConfig, type PopupConfig } from "./popup/config.ts";
import { PopupCardEditor } from "./popup/editor.ts";
import {
  CLOSE_AT,
  closeDuration,
  MIN_STEP,
  poseOf,
  settleAt,
  SheetDrag,
  type Pose,
} from "./popup/gesture.ts";
import { cellOf, GRID_COLUMNS, spanOf } from "./popup/place.ts";
import {
  dashboardConfig,
  DEFAULT_DASHBOARD,
  findSection,
  isHeading,
  onDashboardSaved,
  pageDashboard,
  type Found,
} from "./popup/section.ts";
import { PORTAL_STYLE, STYLE } from "./popup/styles.ts";

// below this width the pop-up is a sheet from the bottom, else a dialog in the middle
const SHEET_QUERY = "(max-width: 600px)";
const CLOSE_PATH =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
// the sheet's curve: fast out, a long soft landing (as a phone's own sheets)
const EASE_SHEET = "cubic-bezier(0.32, 0.72, 0, 1)";

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const ms = (n: number) => (reducedMotion() ? 0 : n);

type State = "closed" | "opening" | "open" | "closing";

// the element that has the focus, inside shadow roots too
const deepActive = (): HTMLElement | null => {
  let el = document.activeElement as HTMLElement | null;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
  return el;
};

// The page behind an open pop-up does not scroll: one lock for every pop-up on the page, so one
// opening while another still closes keeps it, and the last one out gives the page back its own
let locks = 0;
let pageOverflow = "";
const lockPage = () => {
  if (locks++ === 0) {
    pageOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
};
const unlockPage = () => {
  if (locks > 0 && --locks === 0) document.documentElement.style.overflow = pageOverflow;
};

// whether a node is in a dialog: another one over the pop-up (more-info opened from a card in it),
// or the one the card is drawn in (Home Assistant's card editor)
// (dialog, ha-dialog, wa-dialog, ha-more-info-dialog, hui-dialog-edit-card)
const isDialog = (n: unknown) =>
  n instanceof Element &&
  (/(^|-)dialog(-|$)/.test(n.localName) || n.getAttribute("role") === "dialog");
const TEMPLATE = /\{\{|\{%/;

// the variables a container sets for its own cards only, not a theme's
const NOT_THEME = /^--(column-span|column-size|row-size)$/;

// where the open pop-up goes: beside Home Assistant's own dialogs, so the events of the cards
// inside (more-info, actions) reach it and the theme applies; the page's body elsewhere (the docs)
const portalParent = (): Node =>
  (document.querySelector("home-assistant")?.shadowRoot as ShadowRoot | null) ?? document.body;

export class PopupCard extends CardsBase {
  static cardType = CARD_TYPE;

  _cfg?: PopupConfig;
  _state: State = "closed";
  // the history entry with our hash was pushed by opening: closing goes back over it
  _pushed = false;
  _sheet?: HTMLElement;
  _scroll?: HTMLElement;
  _headBox?: HTMLElement;
  _head?: HuiCardElement;
  _headKey = "";
  _openBtn?: HTMLButtonElement;
  _closeBtn?: HTMLButtonElement;
  _grab?: HTMLElement;
  _inline?: HTMLElement;
  _portal?: HTMLElement;
  _wrap?: HTMLElement;
  _end?: HTMLElement; // the focus's end, after the sheet
  _scrim?: HTMLElement;
  _drag?: SheetDrag;
  _past = false; // the drag is past the share that closes the sheet
  // the sheet rests at the full height (else at its content's)
  _tall = false;
  // while dragged: its content's height, the full height, where its top was when the drag took over
  _geo?: { nat: number; max: number; e0: number };
  _focusBack: HTMLElement | null = null;
  _locked = false; // this pop-up holds the page's scroll lock
  // its section's cards, and why there are none (it was not found, its dashboard not read)
  _sectionCards: CardConfigBase[] = [];
  _sectionError: Extract<Found, { error: string }>["error"] | null = null;
  _sectionFor = ""; // what the cards were asked for: the section, its dashboard and view
  _sectionAsk = 0;
  _sectionDash = "";
  _offSaved?: () => void;
  // the templates of its own `visibility`, which decides whether it opens
  _tpl = new TemplateSubscriptions(CARD_TYPE, () => {});
  _media?: MediaQueryList;
  _lang = "";

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }
  static getStubConfig(hass?: HomeAssistant) {
    return { hash: "popup", title: t(hass, "popup.name"), cards: [] };
  }

  setConfig(config: CardConfigBase | null | undefined) {
    this._cfg = normalizePopupConfig(config);
    if (this._state !== "closed") this._applyWidth();
    this._syncTemplates();
    this._loadSection();
    this._load();
  }

  set hass(hass: HomeAssistant) {
    super.hass = hass;
    if (this._head) this._head.hass = hass;
    this._syncTemplates();
    this._loadSection();
  }
  get hass(): HomeAssistant | undefined {
    return super.hass;
  }

  set preview(v: boolean) {
    super.preview = v;
    if (this._head) this._head.preview = this._preview;
    this._place();
  }
  get preview(): boolean {
    return super.preview;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
    window.addEventListener("hashchange", this._onLocation);
    this._syncTemplates();
    this._offSaved = onDashboardSaved((dashboard) => {
      if (dashboard === this._sectionDash) this._loadSection(true);
    });
    this._loadSection();
    // (in Home Assistant's card editor or not: Open shows there or not)
    this._place();
    // opened by the address the page was loaded with (a link to the pop-up): nothing to go back to
    requestAnimationFrame(() => {
      if (this.isConnected && this._ours() && this._state === "closed" && this._allowed())
        this._open(false);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
    window.removeEventListener("hashchange", this._onLocation);
    this._tpl.clear();
    this._offSaved?.();
    // a dashboard saved while it was away is asked for again when it is back (cached else)
    this._sectionFor = "";
    // another view: the pop-up goes with the card, at once
    if (this._state !== "closed") this._teardown(false);
  }

  // the section's cards first, then its own
  _childConfigs() {
    const cfg = this._cfg;
    if (!cfg) return undefined;
    if (!cfg.section) return cfg.cards;
    const cards = this._sectionLead() ? this._sectionCards.slice(1) : this._sectionCards;
    return [...cards, ...cfg.cards];
  }
  // the section's heading, the header of a pop-up without one of its own (it would be a line
  // under the close button else)
  _sectionLead(): CardConfigBase | null {
    const first = this._sectionCards[0];
    return this._cfg?.section && !this._cfg.header && isHeading(first) ? first : null;
  }

  // The section's cards, asked for when the card gets its config, its hass or its place (the
  // page's dashboard and view, where the section names none) and when its dashboard is saved
  _loadSection(again = false) {
    const ref = this._cfg?.section;
    const hass = this._hass;
    if (!ref) {
      this._sectionFor = "";
      this._sectionAsk++; // an answer on its way is for nothing now
      if (this._sectionCards.length || this._sectionError) this._setSection([], null);
      return;
    }
    if (!hass?.callWS) return;
    const page = pageDashboard(location.pathname);
    const dashboard = ref.dashboard ?? page.dashboard;
    // the page's view, where the section is on the dashboard the page shows
    const here = dashboard === page.dashboard ? page.view : null;
    const key = JSON.stringify([ref, dashboard, here]);
    if (!again && key === this._sectionFor) return;
    this._sectionFor = key;
    this._sectionDash = dashboard;
    const ask = ++this._sectionAsk;
    dashboardConfig(hass, dashboard).then(
      (config) => {
        if (ask !== this._sectionAsk) return;
        // no config: no such dashboard, or the default one generated
        const found: Found =
          config === null
            ? { error: dashboard === DEFAULT_DASHBOARD ? "generated" : "unreadable" }
            : findSection(config, ref, here);
        if ("error" in found) this._setSection([], found.error);
        else this._setSection(found.cards, null);
      },
      () => {
        if (ask !== this._sectionAsk) return;
        // the connection lost: asked again with the next hass
        this._sectionFor = "";
        this._setSection([], "unreadable");
      },
    );
  }
  _setSection(cards: CardConfigBase[], error: PopupCard["_sectionError"]) {
    this._sectionCards = cards;
    this._sectionError = error;
    // (before hui-card is there, _load takes them when it is)
    if (this._ready) this._sync();
  }
  _message() {
    const ref = this._cfg?.section;
    if (!ref || !this._sectionError) return null;
    return t(this._hass, `popup.section_${this._sectionError}`, {
      section: ref.title ?? `#${ref.index}`,
    });
  }
  _style() {
    return STYLE;
  }
  _emptyKey() {
    return "popup.empty" as const;
  }
  // hidden on the dashboard: it shows as the pop-up; in the editor's preview it is inline
  _hideSelf() {
    return !this._preview;
  }

  // Its `visibility` decides whether it opens. Home Assistant evaluates the conditions on the card's
  // hui-card, but the pop-up hides itself on the dashboard (the hui-card is hidden either way) and
  // stays connected, so it checks them itself (the same semantics: a template false until
  // rendered). In the editor's preview it always opens.
  _allowed(): boolean {
    const v = this._cfg?.visibility;
    if (!v || this._preview) return true;
    const hass = this._hass;
    if (!hass) return false;
    return checkVisibility(v, {
      hass,
      tpl: (tpl) => this._tpl.results.get(tpl),
      media: (q) => matchMedia(q).matches,
      now: Date.now(),
    });
  }
  _syncTemplates() {
    const v = this._cfg?.visibility;
    if (!this.isConnected || !v) return this._tpl.clear();
    this._tpl.sync(this._hass?.connection, visibilityDeps([v]).templates);
  }

  // in a dialog: Home Assistant's card editor, whose preview the panel is; Open would draw the
  // pop-up behind it
  _inDialog(): boolean {
    let n: Node | null = this.parentNode;
    while (n) {
      if (isDialog(n)) return true;
      n = n.parentNode ?? (n instanceof ShadowRoot ? n.host : null);
    }
    return false;
  }

  // ---- the sheet: built once, inline in the editor's preview, in the portal while open, else
  // off the page (its cards then hold no subscriptions)

  _mount(wrap: HTMLElement) {
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    // focusable itself: a click on its background or its texts keeps the focus in it (Esc works)
    sheet.tabIndex = -1;
    sheet.innerHTML =
      `<div class="grab" aria-hidden="true"></div>` +
      `<div class="head"><div class="heading" hidden></div><div class="gap"></div>` +
      `<button class="open" type="button"></button>` +
      `<button class="x" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${CLOSE_PATH}"/></svg></button></div>` +
      `<div class="scroll"></div>`;
    this._sheet = sheet;
    this._grab = sheet.querySelector<HTMLElement>(".grab")!;
    this._headBox = sheet.querySelector<HTMLElement>(".heading")!;
    this._openBtn = sheet.querySelector<HTMLButtonElement>(".open")!;
    this._closeBtn = sheet.querySelector<HTMLButtonElement>(".x")!;
    this._scroll = sheet.querySelector<HTMLElement>(".scroll")!;
    this._scroll.appendChild(wrap);
    this._openBtn.addEventListener("click", () => this._open(false));
    this._closeBtn.addEventListener("click", () => this.close());
    sheet.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && this._state !== "closed") {
        ev.stopPropagation();
        this.close();
      }
    });
    this._drag = new SheetDrag(sheet, {
      enabled: () => this._state === "open" && !!this._wrap?.classList.contains("as-sheet"),
      onHandle: (path) =>
        path.some((n) => n === this._grab || n === sheet.querySelector(".head")) &&
        !path.includes(this._closeBtn!),
      canGrow: () => {
        if (this._tall) return false;
        const { nat, max } = this._heights();
        return max - nat >= MIN_STEP;
      },
      move: (d) => {
        const g = this._dragStart();
        const extent = g.e0 - d;
        this._pose(poseOf(extent, g.nat, g.max), g.nat);
        const past = g.nat - extent > CLOSE_AT * g.nat;
        if (past !== this._past) {
          this._past = past;
          if (past) fireHaptic(this, "light");
        }
      },
      release: (d, speed) => {
        const g = this._geo;
        this._geo = undefined;
        this._past = false;
        if (!g) return;
        const extent = g.e0 - d;
        const pose = poseOf(extent, g.nat, g.max);
        const rest = settleAt(extent, speed, g.nat, g.max);
        if (rest === "closed") this.close(pose.shift, Math.max(0, speed));
        else this._settle(pose, rest === "full", g);
      },
    });

    const inline = document.createElement("div");
    inline.className = "inline";
    (this.shadowRoot as ShadowRoot).appendChild(inline);
    this._inline = inline;
    this._place();
  }

  _place() {
    const sheet = this._sheet;
    if (!sheet) return;
    const open = this._state !== "closed";
    if (open) {
      if (sheet.parentNode !== this._wrap) this._wrap!.insertBefore(sheet, this._end!);
    } else if (this._preview) {
      if (sheet.parentNode !== this._inline) this._inline!.appendChild(sheet);
    } else sheet.remove();
    this._openBtn!.hidden = open || !this._preview || this._inDialog();
    this._closeBtn!.hidden = !open;
    this._grab!.hidden = !open;
    // a dialog while open; inline in the editor a part of the card
    if (open) {
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
    } else {
      sheet.removeAttribute("role");
      sheet.removeAttribute("aria-modal");
    }
    this._labels();
  }

  _labels() {
    const lang = langOf(this._hass);
    if (!this._openBtn || lang === this._lang) return;
    this._lang = lang;
    this._openBtn.textContent = t(this._hass, "popup.open");
    this._closeBtn!.setAttribute("aria-label", t(this._hass, "popup.close"));
    this._name();
  }
  // the dialog's name: its title as written, else (none, or a template) the word for a pop-up
  _name() {
    const head = this._cfg?.header ?? this._sectionLead();
    const title = head?.type === "heading" ? head.heading : head?.title;
    this._sheet?.setAttribute(
      "aria-label",
      typeof title === "string" && title && !TEMPLATE.test(title)
        ? title
        : t(this._hass, "popup.name"),
    );
  }

  // the cards, and the header's heading card beside them
  _sync() {
    super._sync();
    const head = this._cfg?.header ?? this._sectionLead();
    const key = head ? childKey(head) : "";
    if (key !== this._headKey) {
      this._headKey = key;
      if (!head) {
        this._head?.remove();
        this._head = undefined;
      } else if (this._head) this._head.config = head;
      else {
        this._head = createHuiCard(head, this._hass, this._preview);
        this._headBox!.appendChild(this._head);
      }
      this._headBox!.hidden = !head;
      this._name();
    }
  }

  _arrange(_columns: number): boolean[] {
    const body = this._body!;
    const gap = themeGap("row");
    const shown = this._kids.map((k) => this._visible(k));
    placeNodes(
      body,
      this._kids.map((k) => k.item),
    );
    let rows = 0;
    this._kids.forEach((k, i) => {
      const grid = k.hui.getGridOptions?.();
      const cell = cellOf(grid, gap);
      applyStyle(k.item, cell.style, this._styles);
      k.item.classList.toggle("off", !shown[i]);
      const layout = cell.gridLayout ? "grid" : undefined;
      if (k.hui.layout !== layout) k.hui.layout = layout;
      if (shown[i]) rows += ((k.size > 0 ? k.size : 1) * spanOf(grid)) / GRID_COLUMNS;
    });
    // (the inline panel in the editor's preview: its header and its cards)
    this._size = 1 + Math.ceil(rows);
    this._labels();
    return shown;
  }

  // ---- opening and closing

  _ours(): boolean {
    const h = this._cfg?.hash;
    if (!h) return false;
    try {
      return decodeURIComponent(location.hash.slice(1)) === h;
    } catch {
      return location.hash.slice(1) === h;
    }
  }

  // the address changed: our hash opens the pop-up, any other closes it (a new entry brought it:
  // closing goes back over it; one replaced in place is replaced again)
  _onLocation = (ev: Event) => {
    const ours = this._ours();
    if (ours && this._state === "closed") {
      if (!this._allowed()) return;
      // a new entry brought the hash (a navigate action, a link): closing goes back over it; the
      // back and forward buttons land on an entry whose neighbours are unknown (it may be the
      // page's first), and closing replaces it instead
      const replaced =
        ev.type === "popstate" ||
        (ev.type === "location-changed" &&
          !!(ev as CustomEvent<{ replace?: boolean }>).detail?.replace);
      this._open(!replaced);
    } else if (!ours && (this._state === "open" || this._state === "opening")) this._dismiss();
  };

  // closes the pop-up as ✕, Esc, the scrim and a swipe do: the address loses the hash; `from` the
  // sheet's offset where a drag let go, `speed` its speed (px/ms)
  close(from = 0, speed = 0) {
    if (this._state !== "open" && this._state !== "opening") return;
    const ours = this._ours();
    const pushed = this._pushed;
    this._dismiss(from, speed);
    if (!ours) return;
    if (pushed) history.back();
    else {
      history.replaceState(history.state, "", location.pathname + location.search);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: true } }));
    }
  }

  _open(pushed: boolean) {
    if (this._state !== "closed" || !this._cfg || !this._sheet || !this.isConnected) return;
    this._pushed = pushed;
    this._focusBack = deepActive();
    this._ensurePortal();
    this._inheritTheme();
    portalParent().appendChild(this._portal!);
    this._state = "opening";
    this._tall = this._cfg.height === "full";
    this._sheet.classList.toggle("tall", this._tall);
    this._applyWidth();
    this._media = matchMedia(SHEET_QUERY);
    this._media.addEventListener("change", this._applyWidth);
    this._place();
    lockPage();
    this._locked = true;
    document.addEventListener("focusin", this._onFocusIn);

    const sheet = this._sheet!;
    const scrim = this._scrim!;
    this._scroll!.scrollTop = 0;
    scrim.style.opacity = "1";
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(260) });
    const a = this._isSheet()
      ? sheet.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], {
          duration: ms(340),
          easing: EASE_SHEET,
        })
      : sheet.animate(
          [
            { opacity: 0, transform: "translate(-50%, -50%) scale(0.94)" },
            { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          ],
          { duration: ms(220), easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        );
    a.finished.then(
      () => {
        if (this._state === "opening") this._state = "open";
      },
      () => {},
    );
    this._closeBtn!.focus({ preventScroll: true });
  }

  // the pop-up animates away (no change to the address)
  _dismiss(from = 0, speed = 0) {
    if (this._state === "closed" || this._state === "closing") return;
    this._state = "closing";
    const sheet = this._sheet!;
    const scrim = this._scrim!;
    for (const an of sheet.getAnimations()) an.cancel();
    const height = sheet.offsetHeight || 1;
    let a: Animation;
    if (this._isSheet()) {
      const to = height + 16;
      a = sheet.animate(
        [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }],
        {
          duration: ms(closeDuration(to - from, height, speed)),
          easing: speed > 0.3 ? "cubic-bezier(0.25, 0.8, 0.4, 1)" : EASE_SHEET,
          fill: "forwards",
        },
      );
    } else
      a = sheet.animate(
        [
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.96)" },
        ],
        { duration: ms(150), easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
      );
    const was = Number.parseFloat(scrim.style.opacity || "1");
    scrim.animate([{ opacity: was }, { opacity: 0 }], {
      duration: ms(this._isSheet() ? 260 : 150),
      fill: "forwards",
    });
    a.finished.then(
      () => {
        if (this._state === "closing") this._teardown(true);
      },
      () => {},
    );
  }

  // the pop-up off the page: the sheet back where it rests, the page as it was
  _teardown(focusBack: boolean) {
    this._state = "closed";
    this._pushed = false;
    this._media?.removeEventListener("change", this._applyWidth);
    for (const an of [
      ...(this._sheet?.getAnimations() ?? []),
      ...(this._scrim?.getAnimations() ?? []),
    ])
      an.cancel();
    this._geo = undefined;
    if (this._sheet) {
      this._sheet.classList.remove("tall");
      this._free();
    }
    // the focus goes back where it was only from inside the pop-up (not from one opened meanwhile)
    const hadFocus = !!this._portal?.shadowRoot?.activeElement;
    this._portal?.remove();
    document.removeEventListener("focusin", this._onFocusIn);
    if (this._locked) unlockPage();
    this._locked = false;
    this._place();
    const back = this._focusBack;
    this._focusBack = null;
    if (focusBack && hadFocus && back?.isConnected) back.focus({ preventScroll: true });
  }

  // the sheet's content's height and its full height, measured as it is now
  _heights(): { nat: number; max: number } {
    const sheet = this._sheet!;
    const { height, maxHeight } = sheet.style;
    sheet.style.height = "";
    sheet.style.maxHeight = "";
    sheet.classList.remove("tall");
    const nat = sheet.offsetHeight;
    sheet.classList.add("tall");
    const max = sheet.offsetHeight;
    sheet.classList.toggle("tall", this._tall);
    sheet.style.height = height;
    sheet.style.maxHeight = maxHeight;
    return { nat: Math.min(nat, max), max };
  }

  // the drag took over: the sheet from where it is (a settling sheet stops there), measured once
  _dragStart() {
    if (this._geo) return this._geo;
    const sheet = this._sheet!;
    // where its top is now, a settling animation's frame included
    const e0 = this._portal!.getBoundingClientRect().bottom - sheet.getBoundingClientRect().top;
    for (const an of [...sheet.getAnimations(), ...this._scrim!.getAnimations()]) an.cancel();
    this._free();
    const { nat, max } = this._heights();
    this._geo = { nat, max, e0 };
    return this._geo;
  }

  // the sheet as tall and as far down as the finger has it, the scrim lighter the further down
  _pose(p: Pose, nat: number) {
    const sheet = this._sheet!;
    sheet.style.maxHeight = "none";
    sheet.style.height = `${p.height}px`;
    sheet.style.transform = p.shift ? `translateY(${p.shift}px)` : "";
    this._scrim!.style.opacity = String(Math.max(0, Math.min(1, 1 - p.shift / (nat || 1))));
  }

  // the sheet's own height and place again (its class says how tall it rests)
  _free() {
    const st = this._sheet!.style;
    st.height = "";
    st.maxHeight = "";
    st.transform = "";
  }

  // a drag let go short of closing: the sheet settles at its content's height or the full height,
  // springing back up where it was pulled down
  _settle(from: Pose, tall: boolean, g: { nat: number; max: number }) {
    const sheet = this._sheet!;
    this._tall = tall;
    sheet.classList.toggle("tall", tall);
    this._free();
    this._scrim!.style.opacity = "1";
    const to = tall ? g.max : g.nat;
    sheet.animate(
      [
        { height: `${from.height}px`, maxHeight: "none", transform: `translateY(${from.shift}px)` },
        { height: `${to}px`, maxHeight: "none", transform: "translateY(0)" },
      ],
      from.shift
        ? { duration: ms(380), easing: "cubic-bezier(0.25, 1.25, 0.45, 1)" }
        : { duration: ms(320), easing: EASE_SHEET },
    );
    if (from.shift)
      this._scrim!.animate(
        [{ opacity: Math.max(0, 1 - from.shift / (g.nat || 1)) }, { opacity: 1 }],
        {
          duration: ms(240),
        },
      );
  }

  // the focus stays in the open pop-up (a Tab past its last control comes back to it), unless it
  // goes to a dialog over it (more-info opened from a card inside)
  _onFocusIn = (ev: FocusEvent) => {
    const path = ev.composedPath();
    if (this._state === "closed" || path.includes(this._portal!) || path.some(isDialog)) return;
    this._sheet!.focus({ preventScroll: true });
  };

  _isSheet() {
    return !!this._wrap?.classList.contains("as-sheet");
  }

  // a sheet or a dialog, by the screen's width now; the dialog's width
  _applyWidth = () => {
    const wrap = this._wrap;
    if (!wrap) return;
    const sheet = matchMedia(SHEET_QUERY).matches;
    wrap.className = ["wrap", sheet ? "as-sheet" : "as-dialog", this._cfg?.width ?? "normal"].join(
      " ",
    );
    if (this._sheet) this._free();
  };

  // the theme where the card is (a view's or a dashboard's own, the docs' per example) on the
  // portal, which is elsewhere on the page: every variable in effect at the card
  _inheritTheme() {
    const cs = getComputedStyle(this);
    const style = this._portal!.style;
    style.cssText = "";
    for (let i = 0; i < cs.length; i++) {
      const name = cs[i];
      if (name.startsWith("--") && !NOT_THEME.test(name))
        style.setProperty(name, cs.getPropertyValue(name));
    }
    style.colorScheme = cs.colorScheme;
  }

  _ensurePortal() {
    if (this._portal) return;
    const host = document.createElement("div");
    host.className = "pro-cards-popup";
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = PORTAL_STYLE;
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.addEventListener("click", () => this.close());
    // the ends of the focus's round: Tab past the last control comes to the sheet (its first
    // control next), Shift+Tab before the first one to the close button
    const end = (to: () => HTMLElement | undefined) => {
      const el = document.createElement("div");
      el.tabIndex = 0;
      el.addEventListener("focus", () => to()?.focus({ preventScroll: true }));
      return el;
    };
    const start = end(() => (this._closeBtn?.hidden ? this._sheet : this._closeBtn));
    this._end = end(() => this._sheet);
    wrap.append(scrim, start, this._end);
    root.append(style, wrap);
    this._portal = host;
    this._wrap = wrap;
    this._scrim = scrim;
  }
}

registerCard(PopupCard, {
  name: "Pop-up Card Pro",
  description: "Any cards in a pop-up that a navigate action to its #hash opens",
});

defineElement(`${CARD_TYPE}-editor`, PopupCardEditor);
