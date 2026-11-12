// A link to a section further down a page lands on it, then the page's live examples above it
// mount and grow and push the section out of view. While they do, the section is held where
// VitePress puts a linked section (below the nav, `getScrollOffset`): every change of the page's
// height scrolls it back there. The reader's first scroll, key or tap ends that, and so does a page
// that has been still for a while.
import { getScrollOffset } from "vitepress";

const QUIET_MS = 2500;
const MAX_MS = 10000;
const INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

let stop: (() => void) | null = null;

export const holdAnchor = () => {
  stop?.();
  // (a hash that is no valid escape names no section)
  const id = (() => {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch {
      return "";
    }
  })();
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  const el = target;
  const hold = () => {
    const pad = parseInt(getComputedStyle(el).paddingTop, 10) || 0;
    const off = el.getBoundingClientRect().top - (getScrollOffset() - pad);
    if (Math.abs(off) >= 1) window.scrollBy(0, off);
    clearTimeout(quiet);
    quiet = setTimeout(end, QUIET_MS);
  };
  const ro = new ResizeObserver(hold);
  let quiet = setTimeout(end, QUIET_MS);
  const cap = setTimeout(end, MAX_MS);
  function end() {
    ro.disconnect();
    clearTimeout(quiet);
    clearTimeout(cap);
    for (const e of INPUT) window.removeEventListener(e, end, true);
    stop = null;
  }
  for (const e of INPUT) window.addEventListener(e, end, { capture: true, passive: true });
  ro.observe(document.body);
  stop = end;
};

// once the page is in place (VitePress renders it a tick after the route changes)
export const holdAnchorSoon = () => requestAnimationFrame(() => holdAnchor());
