<script setup lang="ts">
// The home hero's backdrop: the dashboard of `hero.dashboard` in docs/index.md, live but inert,
// behind the whole hero. A wall of posters fills the screen; an oval of the page ground behind
// the centred text keeps it readable, the cards show around it.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useData } from "vitepress";
import { mountSections, loadRuntime, type MountHandle } from "./mount.ts";
import { useExampleTheme } from "./exampleTheme.ts";

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

// The first section's first card is the wall (a layout card): its cards repeat until they fill
// the stage's rows, and stop there on a short one, each pass three cards on so a copy never sits
// under its original. Columns as the container queries below give them on the stage (larger than
// the screen from 960 px, where it is tilted: TILTED); a poster is about 190 px tall.
const POSTER = 190;
const TILTED = { width: 1.35, height: 1.15 };
const fill = (secs: Section[]): Section[] => {
  const wall = secs[0]?.cards?.[0];
  const cards = wall?.cards;
  if (!cards?.length) return secs;
  const tilted = innerWidth >= 960;
  const width = innerWidth * (tilted ? TILTED.width : 1);
  const cols = width >= 1184 ? 6 : width >= 624 ? 4 : 2;
  const n = cols * (Math.ceil((innerHeight * (tilted ? TILTED.height : 1)) / POSTER) + 1);
  const len = cards.length;
  const filled = Array.from({ length: n }, (_, i) => cards[(i + Math.floor(i / len) * 3) % len]);
  return [{ ...secs[0], cards: [{ ...wall, cards: filled }, ...secs[0].cards!.slice(1)] }, ...secs.slice(1)];
};

onMounted(async () => {
  if (!sections.value) return;
  try {
    await loadRuntime();
    handles.push(...(await mountSections(host.value!, fill(sections.value))));
    requestAnimationFrame(() => (shown.value = true));
  } catch (err) {
    console.error("hero dashboard:", err);
  }
});
onBeforeUnmount(() => handles.forEach((h) => h.dispose()));
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
.stage {
  position: absolute;
  inset: 0 -24px;
  padding: calc(var(--vp-nav-height) + 16px) 16px 0;
  /* the cards' own z-indices stay under the fade */
  isolation: isolate;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.stage.shown {
  opacity: 1;
}
/* from 960 px the wall turns away on its left side, as if that side were further back; it is
   larger than the hero (TILTED in the script), and the fade's left edge hides where it ends */
@media (min-width: 960px) {
  .stage {
    inset: 0 -4% -12% -30%;
    padding: 16px;
    transform-origin: 100% 50%;
    transform: perspective(1600px) rotateY(-14deg);
  }
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
/* A band under the nav keeps it legible and one at the bottom leads into the page. The text is
   centred top to bottom in the hero's padding box, which sits --shift below the middle (the nav
   and the top padding are taller than the bottom one); phones and tablets get a solid band
   across it. */
.fade {
  --shift: 32px;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, var(--vp-c-bg) var(--vp-nav-height), transparent calc(var(--vp-nav-height) + 48px)),
    linear-gradient(to top, var(--vp-c-bg) 0, transparent 96px),
    linear-gradient(
      to bottom,
      transparent calc(50% + var(--shift) - 290px),
      var(--vp-c-bg) calc(50% + var(--shift) - 210px),
      var(--vp-c-bg) calc(50% + var(--shift) + 210px),
      transparent calc(50% + var(--shift) + 290px)
    );
}
@media (min-width: 640px) {
  .fade {
    --shift: 40px;
  }
}
/* Wider screens: a diagonal, solid in the lower left behind the text and clear towards the upper
   right. Its stops count from the hero's middle: the text column has a fixed width and sits
   centred top to bottom, so its top right corner stays about the same distance along the
   gradient, a little further (--solid) while the column still starts at the 64 px padding. A
   fade on the left hides where the turned wall ends. */
@media (min-width: 960px) {
  .fade {
    --solid: 50px;
    background:
      linear-gradient(
        to bottom,
        var(--vp-c-bg) var(--vp-nav-height),
        transparent calc(var(--vp-nav-height) + 48px)
      ),
      linear-gradient(to top, var(--vp-c-bg) 0, transparent 128px),
      linear-gradient(to right, var(--vp-c-bg) 0, transparent 22%),
      linear-gradient(
        to top right,
        var(--vp-c-bg) calc(50% + var(--solid)),
        transparent calc(50% + var(--solid) + 160px)
      );
  }
}
@media (min-width: 1280px) {
  .fade {
    --solid: -60px;
  }
}
</style>
