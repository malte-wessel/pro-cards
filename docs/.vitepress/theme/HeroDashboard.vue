<script setup lang="ts">
// The home hero's backdrop: the dashboard of `hero.dashboard` in docs/index.md, live but inert,
// behind the whole hero from 640 px. A wall of posters, turned away on its left, fills the
// screen; a diagonal of the page ground behind the text keeps it readable, the cards show above
// and right of it.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useData } from "vitepress";
import { mountSections, loadRuntime, type MountHandle } from "./mount.ts";
import { useExampleTheme } from "./exampleTheme.ts";
import { PHONE } from "./hero.ts";

interface Section {
  cards?: { cards?: unknown[] }[];
}

const { frontmatter } = useData();
const sections = computed(() => {
  const d = frontmatter.value.hero?.dashboard;
  return Array.isArray(d) ? (d as Section[]) : null;
});
const theme = useExampleTheme();
const host = ref<HTMLDivElement | null>(null);
const shown = ref(false);
const handles: MountHandle[] = [];

// The first section's first card is the wall (a layout card): its cards repeat until their cells
// cover the stage, and stop there, each pass three cards on so a copy never sits under its
// original. The stage is measured (its layout box: the tilt turns it away from its right edge,
// so it never shows more than that); columns as the container queries below give them on the
// grid. A cell is one row of the sections grid with its gap; a card takes its `view_layout`
// span, else a poster's one column and three rows. A span that does not fit the end of a row
// leaves a hole, so the wall comes out at least as tall as its cells.
const ROW = 64;
interface WallCard {
  view_layout?: { span?: number | [number, number] };
}
const cellsOf = (card: unknown, cols: number): number => {
  const span = (card as WallCard)?.view_layout?.span;
  const [c, r] = Array.isArray(span) ? span : [typeof span === "number" ? span : 1, 3];
  return Math.min(c, cols) * r;
};
const plan = (secs: Section[], grid: HTMLElement): { secs: Section[]; count: number } => {
  const wall = secs[0]?.cards?.[0];
  const cards = wall?.cards;
  const stage = grid.parentElement;
  if (!cards?.length || !stage) return { secs, count: 0 };
  const pad = getComputedStyle(stage);
  const height = stage.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom);
  const width = grid.clientWidth;
  const cols = width >= 1200 ? 6 : width >= 640 ? 4 : 2;
  // (the last row has no gap after it, so the wall may end a gap short: under the bottom fade)
  const need = cols * Math.ceil(height / ROW);
  const len = cards.length;
  const filled: unknown[] = [];
  for (let i = 0, cells = 0; cells < need; i++) {
    const card = cards[(i + Math.floor(i / len) * 3) % len];
    filled.push(card);
    cells += cellsOf(card, cols);
  }
  const first = { ...secs[0], cards: [{ ...wall, cards: filled }, ...secs[0].cards!.slice(1)] };
  return { secs: [first, ...secs.slice(1)], count: filled.length };
};

// The wall follows the window: mounted again when the stage needs more cards than it has (a
// smaller stage keeps its cards, cut off by the hero), and none on a phone, where it is not drawn
// and HeroSwipe.vue shows posters under the buttons instead. One update at a time.
let mounted = 0;
let busy = false;
let again = false;
const phone = typeof window === "undefined" ? null : matchMedia(PHONE);
const clear = () => {
  handles.splice(0).forEach((h) => h.dispose());
  host.value?.replaceChildren();
  mounted = 0;
};
const update = async () => {
  if (!sections.value || !host.value) return;
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  try {
    if (phone?.matches) {
      clear();
      shown.value = false;
      return;
    }
    const { secs, count } = plan(sections.value, host.value);
    if (count <= mounted) return;
    await loadRuntime();
    clear();
    handles.push(...(await mountSections(host.value, secs)));
    mounted = count;
    requestAnimationFrame(() => (shown.value = true));
  } catch (err) {
    console.error("hero dashboard:", err);
  } finally {
    busy = false;
    if (again) {
      again = false;
      void update();
    }
  }
};
let timer = 0;
const later = () => {
  clearTimeout(timer);
  timer = window.setTimeout(update, 150);
};
let resize: ResizeObserver | null = null;
onMounted(() => {
  void update();
  phone?.addEventListener("change", update);
  resize = new ResizeObserver(later);
  if (host.value?.parentElement) resize.observe(host.value.parentElement);
});
onBeforeUnmount(() => {
  phone?.removeEventListener("change", update);
  resize?.disconnect();
  clearTimeout(timer);
  clear();
});
</script>

<template>
  <div v-if="sections" class="hero-dash" aria-hidden="true" inert>
    <div class="stage ha-theme" :class="{ shown }" :data-theme="theme">
      <div ref="host" class="ha-grid sections"></div>
    </div>
    <div class="fade"></div>
  </div>
</template>

<style scoped>
.hero-dash {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}
/* on a phone it is not drawn (HeroSwipe.vue shows posters under the buttons) */
@media (max-width: 639px) {
  .hero-dash {
    display: none;
  }
}
/* the wall turns away on its left side, as if that side were further back; it is larger than the
   hero, and the fade's left edge hides where it ends */
.stage {
  position: absolute;
  inset: 0 -4% -12% -30%;
  padding: 16px;
  transform-origin: 100% 50%;
  transform: perspective(1600px) rotateY(-14deg);
  /* the cards' own z-indices stay under the fade */
  isolation: isolate;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.stage.shown {
  opacity: 1;
}
/* the section spans view columns by the stage's width, as a sections view would show it:
   2, 4 or 6 posters a row */
.stage :deep(.ha-grid.sections > .section.span-wide) {
  --column-span: 1;
}
@container (min-width: 640px) {
  .stage :deep(.ha-grid.sections > .section.span-wide) {
    --column-span: 2;
  }
}
@container (min-width: 1200px) {
  .stage :deep(.ha-grid.sections > .section.span-wide) {
    --column-span: 3;
  }
}
/* A band under the nav keeps it legible and one at the bottom leads into the page; a diagonal is
   solid in the lower left behind the text and clear towards the upper right. Its stops count
   from the hero's middle: the text column has a fixed width and sits centred top to bottom, so
   its top right corner stays about the same distance along the gradient, a little further
   (--solid) while the column still starts at the 48 or 64 px padding. A fade on the left hides
   where the turned wall ends. */
.fade {
  --solid: 50px;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, var(--vp-c-bg) var(--vp-nav-height), transparent calc(var(--vp-nav-height) + 48px)),
    linear-gradient(to top, var(--vp-c-bg) 0, transparent 128px),
    linear-gradient(to right, var(--vp-c-bg) 0, transparent 22%),
    linear-gradient(
      to top right,
      var(--vp-c-bg) calc(50% + var(--solid)),
      transparent calc(50% + var(--solid) + 160px)
    );
}
/* on a tablet the text column takes most of the width: solid further out, from 220 px at 640
   down to the 50 px of 960 */
@media (max-width: 959px) {
  .fade {
    --solid: calc(560px - 53.125vw);
  }
}
@media (min-width: 1280px) {
  .fade {
    --solid: -60px;
  }
}
</style>
